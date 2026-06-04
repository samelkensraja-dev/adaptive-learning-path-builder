import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { encryptionInterceptor } from './interceptors/encryption.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // CHANGED: register encryption interceptor — transparently encrypts POST/PUT bodies
    provideHttpClient(withInterceptors([encryptionInterceptor]))
  ]
};
