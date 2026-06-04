# Submission Checklist — NilaApps / Edrevel AI

Use this checklist before sending the repository link.

---

## Code Complete

- [x] Angular 19 frontend — matches provided design image
- [x] Spring Boot 3 Java backend — three-layer architecture (Controller → Service → Repository)
- [x] Full CRUD REST API for Learning Paths
- [x] Available Components API
- [x] Drag-and-drop canvas with node types (Start, Assessment, Unit, Group, End)
- [x] SVG bezier arrows with conditional routing labels
- [x] Properties panel with label, description, duration, score, conditions
- [x] Save Draft and Publish buttons wired to backend
- [x] RSA-OAEP-SHA256 + AES-256-CBC hybrid encryption on all POST/PUT
- [x] VAPT security audit completed — report attached

---

## Security Complete

- [x] Encryption using existing certificate.crt + privatekey.pem
- [x] Private key loaded from environment variable (not in source tree)
- [x] OWASP security headers (X-Frame-Options, CSP, HSTS)
- [x] Input validation with Jakarta Bean Validation
- [x] Global exception handler (no stack traces in responses)
- [x] Audit logging on all write operations
- [x] Mass-assignment protection
- [x] Request size limits
- [x] CORS restricted to localhost:4200

---

## Documentation Complete

- [x] `docs/README.md` — full project documentation
- [x] `docs/ARCHITECTURE.md` — three-layer + component architecture
- [x] `docs/API_REFERENCE.md` — all endpoints with examples
- [x] `docs/ENCRYPTION_GUIDE.md` — RSA+AES hybrid encryption guide
- [x] `docs/SETUP_GUIDE.md` — step-by-step setup for reviewer
- [x] `docs/VAPT_Security_Report.pdf` — full security audit PDF
- [x] `docs/screenshots/HOW_TO_TAKE_SCREENSHOTS.md`

---

## Repository Setup

- [ ] Create public GitHub repository
- [ ] Add `.gitignore` with `privatekey.pem`, `*.pem`, `target/`, `dist/`, `node_modules/`
- [ ] Push `adaptive-learning-frontend/` folder
- [ ] Push `adaptive-learning-backend/` folder
- [ ] Push `docs/` folder
- [ ] Take and push screenshots (see `docs/screenshots/HOW_TO_TAKE_SCREENSHOTS.md`)
- [ ] Update README with actual GitHub repo URL and screenshots
- [ ] Send repo link to NilaApps

---

## Run Verification (do this before sending)

```bash
# 1. Start backend with encryption
set CRYPTO_PRIVATE_KEY_PATH=D:\nila\EncryptionDecryption\privatekey.pem
"C:\Program Files\Java\jdk-23\bin\java.exe" -jar adaptive-learning-backend\target\adaptive-learning-backend-1.0.0.jar

# 2. Start frontend
cd adaptive-learning-frontend && ng serve --port 4200

# 3. Open http://localhost:4200 — canvas loads with 10 nodes
# 4. Click Save Draft — check Network tab shows encrypted payload
# 5. curl http://localhost:8080/api/crypto/status
#    → {"encryptionEnabled":true,"decryptionAvailable":true}
```

---

## .gitignore (add to repo root)

```gitignore
# Private key — NEVER commit
*.pem
*.key
privatekey*

# Build outputs
target/
dist/
.angular/

# Dependencies
node_modules/

# IDE
.idea/
.vscode/
*.iml

# Logs
*.log
backend*.log
```
