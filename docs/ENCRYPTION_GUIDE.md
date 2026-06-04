# Encryption Guide

## Overview

The Adaptive Learning Path Builder uses **hybrid RSA + AES encryption** on all API write operations, following the same pattern used in India's cKYC and Repco financial API integrations.

---

## Algorithm

| Layer | Algorithm | Key Size | Mode | Padding |
|-------|-----------|----------|------|---------|
| Payload | AES | 256-bit | CBC | PKCS5/PKCS7 |
| Key wrap | RSA | 2048-bit | OAEP | SHA-256 + MGF1-SHA-256 |
| Encoding | Base64 | — | — | Standard |

---

## Key Material

| File | Location | Contains | Committed to Git? |
|------|----------|----------|------------------|
| `certificate.crt` | `src/main/resources/crypto/` | RSA **public** key | ✅ Yes (safe) |
| `privatekey.pem` | `D:\nila\EncryptionDecryption\` | RSA **private** key | ❌ No — stays external |

The private key path is set via environment variable:
```bash
set CRYPTO_PRIVATE_KEY_PATH=D:\nila\EncryptionDecryption\privatekey.pem
```

---

## Encryption Flow

### Request (Angular → Spring Boot)

```
ANGULAR                                   SPRING BOOT
───────                                   ───────────

1. App startup:
   GET /api/crypto/public-key
   ← { spki: "MIIBIjAN..." }

2. Import RSA public key:
   crypto.subtle.importKey(
     'spki', spkiBytes,
     {name:'RSA-OAEP', hash:'SHA-256'},
     false, ['wrapKey']
   )

3. User clicks "Save Draft":
   a. Generate fresh AES-256 key:
      crypto.subtle.generateKey(
        {name:'AES-CBC', length:256},
        true, ['encrypt','decrypt']
      )
   b. Generate random 16-byte IV:
      crypto.getRandomValues(new Uint8Array(16))

   c. Encrypt payload:
      crypto.subtle.encrypt(
        {name:'AES-CBC', iv},
        aesKey,
        TextEncoder.encode(JSON.stringify(body))
      )

   d. Wrap AES key with RSA:
      crypto.subtle.wrapKey(
        'raw', aesKey, rsaPublicKey,
        {name:'RSA-OAEP'}
      )

4. Send encrypted envelope:
   POST /api/learning-paths
   {
     "encryptedData": "<Base64(AES-CBC(body))>",
     "encryptedKey":  "<Base64(RSA-OAEP(aesKey))>",
     "iv":            "<Base64(IV)>"
   }
                                  5. EncryptionDecryptionFilter:
                                     a. Parse envelope
                                     b. RSA decrypt AES key:
                                        Cipher.getInstance(
                                          "RSA/ECB/OAEPWithSHA-256AndMGF1Padding"
                                        )
                                        + OAEPParameterSpec(
                                            SHA-256, MGF1, MGF1-SHA-256
                                          )
                                     c. AES decrypt body:
                                        Cipher.getInstance(
                                          "AES/CBC/PKCS5Padding"
                                        )
                                     d. Replace request body
                                        with plain JSON

                                  6. Controller processes
                                     plain JSON normally
```

### Response (Spring Boot → Angular)

```
SPRING BOOT                               ANGULAR
───────────                               ───────

7. Controller returns plain JSON
   EncryptionDecryptionFilter captures it:
   a. Generate fresh 16-byte IV
   b. AES-CBC encrypt response
      using same AES key from step 5b
   c. Send:
      {
        "encryptedData": "<Base64(AES(response))>",
        "iv":            "<Base64(newIV)>"
      }
                                  8. EncryptionInterceptor receives
                                     encrypted response
                                     calls EncryptionService.decrypt():
                                     crypto.subtle.decrypt(
                                       {name:'AES-CBC', iv},
                                       aesKey,  // kept in memory
                                       ciphertext
                                     )

                                  9. Plain JSON returned to component
```

---

## Security Properties

| Property | How Achieved |
|----------|-------------|
| **Confidentiality** | AES-256-CBC encrypts every payload |
| **Key confidentiality** | RSA-OAEP wraps AES key — only server can unwrap |
| **Forward secrecy per request** | Fresh AES key + IV generated for every request |
| **No private key in source** | Loaded from external path via env var |
| **No private key in browser** | Client only has the public certificate |
| **Tamper detection** | Decryption fails with exception if ciphertext is modified |

---

## Developer Mode (No Encryption)

If `CRYPTO_PRIVATE_KEY_PATH` is not set, the filter logs a warning and **passes through plaintext** — useful for development without the key file.

```
WARN  EncryptionUtil - CRYPTO_PRIVATE_KEY_PATH not set — decryption disabled.
```

Angular's `EncryptionService.isReady` returns `false` when the public key fetch fails, and the interceptor skips encryption automatically.

---

## Cross-Language Compatibility

The Web Crypto API (browser) and Java Security (server) implementations are compatible because both use:

| Parameter | Web Crypto | Java |
|-----------|-----------|------|
| RSA Padding | RSA-OAEP | `RSA/ECB/OAEPWithSHA-256AndMGF1Padding` |
| OAEP Hash | SHA-256 | `OAEPParameterSpec("SHA-256", ...)` |
| MGF1 Hash | SHA-256 (same as hash) | `MGF1ParameterSpec("SHA-256")` |
| AES Mode | AES-CBC | `AES/CBC/PKCS5Padding` |
| AES Key Size | 256-bit | 256-bit |
| IV Size | 16 bytes | 16 bytes |
| Encoding | Base64 (btoa/atob) | `Base64.getEncoder()` |

---

## Files Reference

| File | Purpose |
|------|---------|
| `EncryptionUtil.java` | Core crypto: load keys, RSA encrypt/decrypt, AES encrypt/decrypt |
| `EncryptedPayload.java` | DTO: `{encryptedData, encryptedKey, iv}` |
| `EncryptedApiResponse.java` | DTO: `{encryptedData, iv}` |
| `EncryptionDecryptionFilter.java` | Spring filter: transparent request decryption + response encryption |
| `CryptoController.java` | REST: `GET /api/crypto/public-key`, `GET /api/crypto/status` |
| `encryption.service.ts` | Angular: load public key, encrypt(), decrypt() |
| `encryption.interceptor.ts` | Angular: intercept POST/PUT, auto-encrypt/decrypt |
