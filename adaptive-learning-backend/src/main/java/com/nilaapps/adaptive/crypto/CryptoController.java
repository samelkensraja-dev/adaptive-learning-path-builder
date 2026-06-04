package com.nilaapps.adaptive.crypto;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

/**
 * Exposes the server's public certificate so the Angular client
 * can load it at startup to encrypt request AES keys.
 * The private key NEVER leaves the server.
 */
@RestController
@RequestMapping("/api/crypto")
public class CryptoController {

    private final EncryptionUtil encryptionUtil;

    public CryptoController(EncryptionUtil encryptionUtil) {
        this.encryptionUtil = encryptionUtil;
    }

    /**
     * GET /api/crypto/public-key
     * Returns the RSA public key in two formats:
     *   spki        — Base64-encoded SubjectPublicKeyInfo bytes (for Web Crypto importKey)
     *   certificate — Full PEM certificate (informational)
     * Angular uses 'spki' to import the key via crypto.subtle.importKey().
     */
    @GetMapping("/public-key")
    public ResponseEntity<Map<String, String>> getPublicKey() throws Exception {
        return ResponseEntity.ok(Map.of(
            "spki",        encryptionUtil.getPublicKeySpkiBase64(),   // Web Crypto format
            "certificate", encryptionUtil.getPublicCertificatePem(), // informational
            "algorithm",   "RSA-OAEP-SHA256 + AES-256-CBC"
        ));
    }

    /** Health probe for encryption readiness */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
            "encryptionEnabled", true,
            "decryptionAvailable", encryptionUtil.isDecryptionAvailable(),
            "algorithm", "RSA-OAEP-SHA256 / AES-256-CBC"
        ));
    }
}
