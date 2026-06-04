import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Hybrid encryption service — cKYC / Repco pattern.
 *
 * Algorithm:
 *   Request  : AES-256-CBC(payload) + RSA-OAEP-SHA256(aesKey) → {encryptedData, encryptedKey, iv}
 *   Response : AES-256-CBC(responseJson)                       → {encryptedData, iv}
 *
 * Uses only the browser's built-in Web Crypto API (window.crypto.subtle).
 * No npm packages required.
 */
@Injectable({ providedIn: 'root' })
export class EncryptionService {

  private rsaPublicKey: CryptoKey | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {}

  /** Must be called once at app startup (see app.component.ts ngOnInit). */
  init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.loadPublicKey();
    }
    return this.initPromise;
  }

  get isReady(): boolean { return this.rsaPublicKey !== null; }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Encrypts a JSON-serialisable payload using hybrid RSA+AES.
   * Returns the wire envelope {encryptedData, encryptedKey, iv}.
   */
  async encrypt(payload: unknown): Promise<EncryptedEnvelope> {
    await this.init();
    if (!this.rsaPublicKey) throw new Error('RSA public key not loaded');

    const plaintext  = JSON.stringify(payload);
    const aesKey     = await this.generateAesKey();
    const iv         = crypto.getRandomValues(new Uint8Array(16));

    // AES-256-CBC encrypt the payload
    const encryptedDataBuf = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      aesKey,
      new TextEncoder().encode(plaintext)
    );

    // RSA-OAEP wrap the AES key with the server's public key
    const wrappedKeyBuf = await crypto.subtle.wrapKey(
      'raw',
      aesKey,
      this.rsaPublicKey,
      { name: 'RSA-OAEP' }
    );

    return {
      encryptedData: this.toBase64(encryptedDataBuf),
      encryptedKey:  this.toBase64(wrappedKeyBuf),
      iv:            this.toBase64(iv),
      _aesKey:       aesKey      // kept in-memory for response decryption
    };
  }

  /**
   * Decrypts a server response envelope {encryptedData, iv}
   * using the AES key that was generated for the original request.
   */
  async decrypt<T>(response: EncryptedResponse, aesKey: CryptoKey): Promise<T> {
    const iv          = this.fromBase64(response.iv);
    const ciphertext  = this.fromBase64(response.encryptedData);
    const plainBuf    = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      aesKey,
      ciphertext
    );
    return JSON.parse(new TextDecoder().decode(plainBuf)) as T;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async loadPublicKey(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ spki: string }>(`${environment.apiBaseUrl}/crypto/public-key`)
      );
      const spkiBytes = this.fromBase64(res.spki);
      this.rsaPublicKey = await crypto.subtle.importKey(
        'spki',
        spkiBytes,
        { name: 'RSA-OAEP', hash: 'SHA-256' },  // SHA-256 for both OAEP and MGF1
        false,                                     // non-exportable
        ['wrapKey']                                // only used to wrap AES keys
      );
      console.log('[EncryptionService] RSA public key loaded — RSA-OAEP-SHA256 ready');
    } catch (err) {
      console.warn('[EncryptionService] Could not load public key — encryption disabled', err);
      this.rsaPublicKey = null;
    }
  }

  private async generateAesKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-CBC', length: 256 },
      true,                                // exportable (needed for wrapKey)
      ['encrypt', 'decrypt']
    );
  }

  private toBase64(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return btoa(String.fromCharCode(...bytes));
  }

  private fromBase64(b64: string): Uint8Array {
    const bin = atob(b64);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  }
}

/** Wire format sent from Angular to Spring Boot (POST/PUT body). */
export interface EncryptedEnvelope {
  encryptedData: string;
  encryptedKey:  string;
  iv:            string;
  _aesKey:       CryptoKey;   // not serialised — kept client-side for response decrypt
}

/** Wire format received from Spring Boot in response to an encrypted request. */
export interface EncryptedResponse {
  encryptedData: string;
  iv:            string;
}
