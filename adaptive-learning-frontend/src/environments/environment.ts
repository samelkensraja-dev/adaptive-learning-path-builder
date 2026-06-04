// Dev: use relative /api — proxied to localhost:8080 by proxy.conf.json.
// This means the Angular app works on ANY port (4200, 4201, 49816, etc.)
// without CORS issues, because requests go through the dev server proxy.
export const environment = {
  production: false,
  apiBaseUrl: '/api'
};
