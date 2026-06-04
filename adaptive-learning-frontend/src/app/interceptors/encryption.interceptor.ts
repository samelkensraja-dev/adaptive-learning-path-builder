import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, tap } from 'rxjs';
import { EncryptionService, EncryptedEnvelope, EncryptedResponse } from '../services/encryption.service';
import { environment } from '../../environments/environment';

/**
 * HTTP interceptor — transparent cKYC/Repco hybrid encryption.
 *
 * POST / PUT to /api/** (except /api/crypto/**):
 *   Outgoing request body → encrypted envelope {encryptedData, encryptedKey, iv}
 *   Incoming response     → decrypted back to plain JSON
 *
 * GET / DELETE — passed through unmodified (no body to encrypt).
 */
export const encryptionInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const encSvc = inject(EncryptionService);

  const isApiCall     = req.url.includes(environment.apiBaseUrl);
  const isCryptoPath  = req.url.includes('/api/crypto');
  const needsEncrypt  = isApiCall && !isCryptoPath &&
                        (req.method === 'POST' || req.method === 'PUT') &&
                        encSvc.isReady;

  if (!needsEncrypt) {
    return next(req);
  }

  // Run async encryption then re-enter the HttpClient pipeline
  return from(encryptRequest(req, encSvc)).pipe(
    switchMap(({ encryptedReq, aesKey }) =>
      next(encryptedReq).pipe(
        // Decrypt the response body
        switchMap(async event => {
          if (event instanceof HttpResponse && event.body) {
            try {
              const body = event.body as EncryptedResponse;
              if (body.encryptedData && body.iv) {
                const plain = await encSvc.decrypt(body, aesKey);
                return event.clone({ body: plain });
              }
            } catch (e) {
              console.warn('[EncryptionInterceptor] Response decryption failed — returning raw', e);
            }
          }
          return event;
        })
      )
    )
  );
};

async function encryptRequest(
  req: HttpRequest<unknown>,
  encSvc: EncryptionService
): Promise<{ encryptedReq: HttpRequest<unknown>; aesKey: CryptoKey }> {

  const envelope: EncryptedEnvelope = await encSvc.encrypt(req.body);
  const { _aesKey, ...wireEnvelope } = envelope;   // strip the in-memory key from wire payload

  const encryptedReq = req.clone({
    body:    wireEnvelope,
    headers: req.headers.set('X-Encrypted', 'true') // optional marker for debugging
  });

  return { encryptedReq, aesKey: _aesKey };
}
