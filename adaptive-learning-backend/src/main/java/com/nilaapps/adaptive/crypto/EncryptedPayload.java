package com.nilaapps.adaptive.crypto;

/**
 * Wire format for an encrypted API request body.
 * Matches the cKYC/Repco hybrid encryption envelope:
 *   encryptedData  - Base64(AES-256-CBC(plaintext))
 *   encryptedKey   - Base64(RSA-OAEP-SHA256(aesKey))
 *   iv             - Base64(16-byte random IV)
 */
public class EncryptedPayload {
    private String encryptedData;
    private String encryptedKey;
    private String iv;

    public String getEncryptedData() { return encryptedData; }
    public void setEncryptedData(String v) { this.encryptedData = v; }
    public String getEncryptedKey() { return encryptedKey; }
    public void setEncryptedKey(String v) { this.encryptedKey = v; }
    public String getIv() { return iv; }
    public void setIv(String v) { this.iv = v; }
}
