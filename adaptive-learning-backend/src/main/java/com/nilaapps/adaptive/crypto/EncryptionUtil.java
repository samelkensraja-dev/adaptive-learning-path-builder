package com.nilaapps.adaptive.crypto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.*;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import javax.crypto.spec.PSource;
import java.util.Base64;

/**
 * Core cryptographic utility — cKYC/Repco hybrid encryption pattern.
 *
 * Algorithm:
 *   Payload  →  AES-256-CBC  →  encryptedData (Base64)
 *   AES key  →  RSA-OAEP-SHA256  →  encryptedKey (Base64)
 *
 * The RSA public key is loaded from the bundled certificate.crt.
 * The RSA private key is loaded from an EXTERNAL path (never bundled in JAR)
 * configured via the environment variable CRYPTO_PRIVATE_KEY_PATH or
 * the property crypto.private-key-path in application.properties.
 */
@Component
public class EncryptionUtil {

    private static final Logger log = LoggerFactory.getLogger(EncryptionUtil.class);

    private static final String RSA_ALGO   = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
    private static final String AES_ALGO   = "AES/CBC/PKCS5Padding";
    private static final int    AES_BITS   = 256;
    private static final int    IV_BYTES   = 16;

    /** Path to the private key PEM — set via env var or application.properties */
    @Value("${crypto.private-key-path:#{environment['CRYPTO_PRIVATE_KEY_PATH']}}")
    private String privateKeyPath;

    private PublicKey  publicKey;
    private PrivateKey privateKey;

    @PostConstruct
    public void init() throws Exception {
        loadPublicKey();
        loadPrivateKey();
        log.info("EncryptionUtil initialised — RSA-OAEP-SHA256 + AES-256-CBC ready");
    }

    // ── Key loading ────────────────────────────────────────────────────────────

    /** Loads the public key from the certificate bundled in resources. */
    private void loadPublicKey() throws Exception {
        try (InputStream is = new ClassPathResource("crypto/certificate.crt").getInputStream()) {
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            X509Certificate cert  = (X509Certificate) cf.generateCertificate(is);
            this.publicKey = cert.getPublicKey();
            log.info("Public key loaded from classpath:crypto/certificate.crt  subject={}",
                     cert.getSubjectX500Principal());
        }
    }

    /**
     * Loads the private key from an EXTERNAL file path.
     * Path resolution order:
     *  1. ${crypto.private-key-path} in application.properties
     *  2. CRYPTO_PRIVATE_KEY_PATH environment variable
     */
    private void loadPrivateKey() throws Exception {
        if (privateKeyPath == null || privateKeyPath.isBlank() || privateKeyPath.equals("null")) {
            log.warn("CRYPTO_PRIVATE_KEY_PATH not set — decryption disabled. " +
                     "Set environment variable or crypto.private-key-path property.");
            this.privateKey = null;
            return;
        }
        String pem = Files.readString(Paths.get(privateKeyPath));
        String base64 = pem
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(base64);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        this.privateKey = KeyFactory.getInstance("RSA").generatePrivate(spec);
        log.info("Private key loaded from external path: {}", privateKeyPath);
    }

    // ── RSA operations ─────────────────────────────────────────────────────────

    /** Encrypt AES key bytes with the RSA public key (OAEP-SHA-256). */
    public String encryptAesKey(byte[] aesKeyBytes) throws Exception {
        Cipher cipher = Cipher.getInstance(RSA_ALGO);
        cipher.init(Cipher.ENCRYPT_MODE, publicKey, oaepSpec());
        return Base64.getEncoder().encodeToString(cipher.doFinal(aesKeyBytes));
    }

    /** Decrypt Base64-encoded RSA-encrypted AES key using the private key. */
    public byte[] decryptAesKey(String encryptedKeyBase64) throws Exception {
        if (privateKey == null) throw new IllegalStateException(
            "Private key not loaded — set CRYPTO_PRIVATE_KEY_PATH");
        Cipher cipher = Cipher.getInstance(RSA_ALGO);
        cipher.init(Cipher.DECRYPT_MODE, privateKey, oaepSpec());
        return cipher.doFinal(Base64.getDecoder().decode(encryptedKeyBase64));
    }

    /** Returns the PEM-encoded public certificate (informational). */
    public String getPublicCertificatePem() throws Exception {
        byte[] certBytes = new ClassPathResource("crypto/certificate.crt").getInputStream().readAllBytes();
        return new String(certBytes, StandardCharsets.UTF_8);
    }

    /**
     * Returns the public key in Base64-encoded SPKI (SubjectPublicKeyInfo) format.
     * This is the format that the browser's Web Crypto API expects for importKey('spki', ...).
     * The SPKI encoding is the standard output of PublicKey.getEncoded() for RSA keys.
     */
    public String getPublicKeySpkiBase64() {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    // ── AES operations ─────────────────────────────────────────────────────────

    /** Generate a fresh 256-bit AES secret key. */
    public SecretKey generateAesKey() throws Exception {
        KeyGenerator kg = KeyGenerator.getInstance("AES");
        kg.init(AES_BITS, new SecureRandom());
        return kg.generateKey();
    }

    /** Generate a fresh 16-byte random IV. */
    public byte[] generateIv() {
        byte[] iv = new byte[IV_BYTES];
        new SecureRandom().nextBytes(iv);
        return iv;
    }

    /** AES-256-CBC encrypt plaintext → Base64 ciphertext. */
    public String encryptAes(String plaintext, byte[] aesKeyBytes, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGO);
        cipher.init(Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(aesKeyBytes, "AES"),
                    new IvParameterSpec(iv));
        return Base64.getEncoder().encodeToString(
            cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8)));
    }

    /** AES-256-CBC decrypt Base64 ciphertext → plaintext. */
    public String decryptAes(String ciphertextBase64, byte[] aesKeyBytes, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGO);
        cipher.init(Cipher.DECRYPT_MODE,
                    new SecretKeySpec(aesKeyBytes, "AES"),
                    new IvParameterSpec(iv));
        return new String(
            cipher.doFinal(Base64.getDecoder().decode(ciphertextBase64)),
            StandardCharsets.UTF_8);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private OAEPParameterSpec oaepSpec() {
        // SHA-256 for both digest and MGF1 — matches node-forge RSA-OAEP with md.sha256
        return new OAEPParameterSpec(
            "SHA-256", "MGF1",
            new MGF1ParameterSpec("SHA-256"),
            PSource.PSpecified.DEFAULT);
    }

    public boolean isDecryptionAvailable() { return privateKey != null; }
}
