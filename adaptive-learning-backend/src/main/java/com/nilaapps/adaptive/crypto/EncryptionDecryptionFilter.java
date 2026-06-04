package com.nilaapps.adaptive.crypto;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Transparent encryption/decryption filter for cKYC/Repco-style API security.
 *
 * On POST / PUT requests:
 *   1. Reads the encrypted JSON envelope {encryptedData, encryptedKey, iv}
 *   2. RSA-OAEP-decrypts the AES key using the server private key
 *   3. AES-256-CBC-decrypts the payload; replaces the request body
 *   4. Stores the AES key in a request attribute for use in the response
 *
 * On responses to encrypted requests:
 *   5. Captures the controller's plain JSON response
 *   6. AES-256-CBC-encrypts it using the same AES key (new IV)
 *   7. Writes {encryptedData, iv} to the actual HTTP response
 *
 * Skipped paths: GET /api/crypto/** (public-key endpoint, status)
 */
@Component
@Order(2)   // after SecurityHeadersFilter (order 1 default)
public class EncryptionDecryptionFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(EncryptionDecryptionFilter.class);
    private static final String AES_KEY_ATTR = "X-AES-KEY";

    private final EncryptionUtil encryptionUtil;
    private final ObjectMapper   objectMapper;

    public EncryptionDecryptionFilter(EncryptionUtil encryptionUtil, ObjectMapper objectMapper) {
        this.encryptionUtil = encryptionUtil;
        this.objectMapper   = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path   = request.getRequestURI();
        String method = request.getMethod();
        // Skip: crypto endpoints, GET/DELETE (no body), non-API paths
        return path.startsWith("/api/crypto")
            || "GET".equalsIgnoreCase(method)
            || "DELETE".equalsIgnoreCase(method)
            || !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        if (!encryptionUtil.isDecryptionAvailable()) {
            // Private key not configured — pass through unencrypted (dev fallback)
            log.debug("Encryption filter: decryption unavailable, passing through");
            chain.doFilter(request, response);
            return;
        }

        // ── 1. Read & decrypt request body ─────────────────────────────────
        String rawBody = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        if (rawBody.isBlank()) {
            chain.doFilter(request, response);
            return;
        }

        EncryptedPayload envelope;
        try {
            envelope = objectMapper.readValue(rawBody, EncryptedPayload.class);
        } catch (Exception e) {
            log.debug("Body is not an encrypted envelope — treating as plain JSON");
            // Not encrypted — wrap original body and pass through
            chain.doFilter(new CachedBodyRequestWrapper(request, rawBody.getBytes(StandardCharsets.UTF_8)), response);
            return;
        }

        if (envelope.getEncryptedData() == null || envelope.getEncryptedKey() == null) {
            chain.doFilter(new CachedBodyRequestWrapper(request, rawBody.getBytes(StandardCharsets.UTF_8)), response);
            return;
        }

        try {
            byte[] aesKey = encryptionUtil.decryptAesKey(envelope.getEncryptedKey());
            byte[] iv     = Base64.getDecoder().decode(envelope.getIv());
            String plain  = encryptionUtil.decryptAes(envelope.getEncryptedData(), aesKey, iv);

            log.debug("Request decrypted successfully, path={}", request.getRequestURI());

            // Store AES key for response encryption
            request.setAttribute(AES_KEY_ATTR, aesKey);

            // ── 2. Wrap request with decrypted body ─────────────────────────
            CachedBodyRequestWrapper wrappedReq =
                new CachedBodyRequestWrapper(request, plain.getBytes(StandardCharsets.UTF_8));

            // ── 3. Capture response ─────────────────────────────────────────
            CachedBodyResponseWrapper wrappedRes = new CachedBodyResponseWrapper(response);
            chain.doFilter(wrappedReq, wrappedRes);

            // ── 4. Encrypt response ─────────────────────────────────────────
            String responseBody = wrappedRes.getCapturedBody();
            byte[] newIv        = encryptionUtil.generateIv();
            String encData      = encryptionUtil.encryptAes(responseBody, aesKey, newIv);

            EncryptedApiResponse encRes = new EncryptedApiResponse(
                encData,
                Base64.getEncoder().encodeToString(newIv)
            );
            String encResJson = objectMapper.writeValueAsString(encRes);

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.setContentLength(encResJson.getBytes(StandardCharsets.UTF_8).length);
            response.setStatus(wrappedRes.getStatus());
            response.getWriter().write(encResJson);
            log.debug("Response encrypted successfully, path={}", request.getRequestURI());

        } catch (Exception e) {
            log.error("Encryption/Decryption error: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Encrypted payload is invalid or corrupt\"}");
        }
    }

    // ── Inner: request wrapper ─────────────────────────────────────────────────

    private static class CachedBodyRequestWrapper extends HttpServletRequestWrapper {
        private final byte[] body;

        CachedBodyRequestWrapper(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override public ServletInputStream getInputStream() {
            ByteArrayInputStream bis = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                public int read() { return bis.read(); }
                public boolean isFinished() { return bis.available() == 0; }
                public boolean isReady()    { return true; }
                public void setReadListener(ReadListener rl) {}
            };
        }

        @Override public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(
                new ByteArrayInputStream(body), StandardCharsets.UTF_8));
        }
    }

    // ── Inner: response wrapper ────────────────────────────────────────────────

    private static class CachedBodyResponseWrapper extends HttpServletResponseWrapper {
        private final ByteArrayOutputStream capture = new ByteArrayOutputStream();
        private PrintWriter writer;
        private int status = 200;

        CachedBodyResponseWrapper(HttpServletResponse response) { super(response); }

        @Override public PrintWriter getWriter() throws IOException {
            if (writer == null) writer = new PrintWriter(
                new OutputStreamWriter(capture, StandardCharsets.UTF_8));
            return writer;
        }

        @Override public ServletOutputStream getOutputStream() {
            return new ServletOutputStream() {
                public void write(int b) { capture.write(b); }
                public boolean isReady() { return true; }
                public void setWriteListener(WriteListener wl) {}
            };
        }

        @Override public void setStatus(int sc)                { this.status = sc; }
        @Override public void sendError(int sc)                { this.status = sc; }
        @Override public void sendError(int sc, String msg)    { this.status = sc; }
        public int getStatus()                                 { return status; }

        String getCapturedBody() {
            if (writer != null) writer.flush();
            return capture.toString(StandardCharsets.UTF_8);
        }
    }
}
