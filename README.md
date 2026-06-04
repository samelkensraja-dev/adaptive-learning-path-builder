# Adaptive Learning Path Builder
### NilaApps / Edrevel AI — Fullstack Developer Screening Task

> **Candidate submission** — Full-stack application built with Angular 19 (frontend) and Java Spring Boot 3 (backend), implementing a visual drag-and-drop learning path builder with conditional adaptive routing, RSA+AES hybrid encryption, and a complete VAPT security audit.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Features Implemented](#features-implemented)
5. [Prerequisites](#prerequisites)
6. [Build Steps](#build-steps)
7. [Run Steps](#run-steps)
8. [Verification Steps](#verification-steps)
9. [API Endpoints](#api-endpoints)
10. [Encryption](#encryption)
11. [VAPT Security](#vapt-security)
12. [Project Structure](#project-structure)

---

## Project Overview

The **Adaptive Learning Path Builder** allows educators to visually design branching learning paths where learners are automatically routed to different content modules based on their assessment scores.

The UI closely matches the provided design reference — a three-panel layout with a drag-and-drop canvas, component sidebar, and live properties editor.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular (Standalone) | 19.2 |
| Frontend Language | TypeScript | 5.x |
| Frontend Styling | SCSS | — |
| Backend | Spring Boot | 3.3.5 |
| Backend Language | Java | 23 |
| Build Tool (Backend) | Apache Maven | 3.9 |
| Build Tool (Frontend) | Angular CLI | 19.2 |
| Crypto (Frontend) | Web Crypto API (built-in browser) | — |
| Crypto (Backend) | Java Security / javax.crypto | — |

---

## Architecture

Three-layer architecture (Presentation → Business → Data):

```
┌─────────────────────────────────────────────────────┐
│                  ANGULAR FRONTEND                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ Header   │  │ Canvas   │  │ Properties Panel   │ │
│  │ Component│  │ Component│  │ Component          │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │  EncryptionInterceptor (HttpInterceptorFn)      │ │
│  │  Encrypts POST/PUT → Decrypts Responses         │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │  HTTPS / Encrypted JSON
┌──────────────────────▼──────────────────────────────┐
│               SPRING BOOT BACKEND                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Presentation Layer (Controllers)             │   │
│  │  ComponentController  LearningPathController │   │
│  │  CryptoController                            │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼───────────────────────┐   │
│  │ Business Layer (Services)                    │   │
│  │  ComponentService     LearningPathService    │   │
│  │  EncryptionUtil                              │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                            │
│  ┌──────────────────────▼───────────────────────┐   │
│  │ Data Layer (Repositories)                    │   │
│  │  ComponentRepository  LearningPathRepository │   │
│  │  (In-memory ConcurrentHashMap store)         │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Features Implemented

### Canvas Builder
- [x] Drag-and-drop nodes from sidebar onto the SVG canvas
- [x] Drag to reposition nodes on canvas
- [x] Bezier curved arrows with conditional routing labels
- [x] Zoom in / Zoom out / Fit to screen controls
- [x] Node types: **Start** (green), **Assessment** (blue), **Unit** (blue), **Group** (purple dashed), **End** (gray)
- [x] Node deletion (hover → X button)
- [x] Node selection with highlight ring

### Sidebar
- [x] Section and Group drag tiles
- [x] "How it works" expandable info panel
- [x] SAT Adaptive Test example
- [x] Available Content library loaded live from backend API

### Properties Panel
- [x] Label, Description editing
- [x] Duration and score settings (Max Score, Passing Score)
- [x] Assignment Conditions builder (Source Section, Operator, Threshold)
- [x] Condition summary ("Show if score < 50%")

### API
- [x] Full CRUD for Learning Paths
- [x] Components library endpoint
- [x] RSA public key endpoint for encryption bootstrap

### Security
- [x] RSA-OAEP-SHA256 + AES-256-CBC hybrid encryption on all POST/PUT requests and responses
- [x] OWASP security headers (X-Frame-Options, CSP, HSTS, Referrer-Policy)
- [x] Input validation with Jakarta Bean Validation (`@Pattern`, `@NotBlank`, `@Size`)
- [x] Global exception handler (no stack traces in responses)
- [x] Audit logging on all write operations
- [x] Mass-assignment protection
- [x] Request size limits

---

## Prerequisites

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| Node.js | 18+ | `node --version` |
| npm | 8+ | `npm --version` |
| Angular CLI | 19 | `ng version` |
| JDK | 17+ (JDK 23 recommended) | `"C:\Program Files\Java\jdk-23\bin\java.exe" --version` |
| Apache Maven | 3.8+ | `mvn --version` |

> **Windows Note:** The system may have multiple JREs. Use JDK 23 explicitly (see Run Steps below).

---

## Build Steps

### Backend

```bash
cd adaptive-learning-backend

# Compile and package
mvn package -DskipTests

# Expected output:
# [INFO] BUILD SUCCESS
# JAR created at: target/adaptive-learning-backend-1.0.0.jar
```

### Frontend

```bash
cd adaptive-learning-frontend

# Install dependencies
npm install

# Build (development)
ng build --configuration=development

# Build (production)
ng build --configuration=production

# Expected output:
# Application bundle generation complete.
# Output location: dist/adaptive-learning-frontend
```

---

## Run Steps

### Step 1 — Start the Backend

```bash
cd adaptive-learning-backend

# Set the private key path (keep the key OUTSIDE the source tree)
set CRYPTO_PRIVATE_KEY_PATH=D:\nila\EncryptionDecryption\privatekey.pem

# Run with JDK 23
"C:\Program Files\Java\jdk-23\bin\java.exe" -jar target\adaptive-learning-backend-1.0.0.jar
```

**Wait for this log line before starting the frontend:**
```
Started AdaptiveLearningApplication in X.XXX seconds
```

### Step 2 — Start the Frontend

```bash
cd adaptive-learning-frontend

ng serve --port 4200
```

**Wait for:**
```
Application bundle generation complete.
➜  Local:   http://localhost:4200/
```

### Step 3 — Open the App

Navigate to **[http://localhost:4200](http://localhost:4200)** in any modern browser.

---

## Verification Steps

### 1. Backend Health Checks

```bash
# Encryption status
curl http://localhost:8080/api/crypto/status
# Expected: {"encryptionEnabled":true,"decryptionAvailable":true,"algorithm":"RSA-OAEP-SHA256 / AES-256-CBC"}

# Components library
curl http://localhost:8080/api/components
# Expected: {"items":[...],"totalCount":6}

# Pre-loaded SAT Adaptive Path
curl http://localhost:8080/api/learning-paths/lp-sat-adaptive-001
# Expected: {"id":"lp-sat-adaptive-001","name":"SAT Adaptive Path","nodes":[...10 nodes...],"edges":[...11 edges...]}
```

### 2. Frontend UI Checks

Open **http://localhost:4200** and verify:

| Area | What to check |
|------|--------------|
| Header | "Adaptive Learning Path Builder" title, Builder/Preview tabs, Save Draft + Publish buttons |
| Sidebar | 6 content items loaded from API (Math Module 1, Math Module 2 Easy/Advanced, R&C Module 1/2 Easy/Advanced) |
| Canvas | SAT Adaptive Path loaded — 10 nodes with bezier arrows connecting them |
| Properties | Click any node → right panel shows Label, Description, Duration, Conditions |
| Drag & Drop | Drag a Section tile from sidebar → drops as new node on canvas |
| Save Draft | Click "Save Draft" → backend receives encrypted POST/PUT |

### 3. Encryption Verification

Open browser DevTools → Network tab:
- Select any **Save Draft** or **Publish** request to `/api/learning-paths`
- **Request payload** should be: `{"encryptedData":"...","encryptedKey":"...","iv":"..."}`
- **Response payload** should be: `{"encryptedData":"...","iv":"..."}`
- All data is encrypted — no plain JSON visible on the wire

---

## API Endpoints

### Components

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/components` | Returns all available content items |

### Learning Paths

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/learning-paths` | List all paths | No |
| GET | `/api/learning-paths/{id}` | Get single path | No |
| POST | `/api/learning-paths` | Create new path (encrypted) | No |
| PUT | `/api/learning-paths/{id}` | Update path (encrypted) | No |
| DELETE | `/api/learning-paths/{id}` | Delete path | No |

### Crypto

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crypto/public-key` | Returns RSA public key (SPKI Base64 + PEM cert) |
| GET | `/api/crypto/status` | Encryption readiness check |

### Request/Response Format (POST/PUT)

**Request body (encrypted):**
```json
{
  "encryptedData": "<Base64 AES-256-CBC encrypted JSON>",
  "encryptedKey":  "<Base64 RSA-OAEP-SHA256 encrypted AES key>",
  "iv":            "<Base64 16-byte random IV>"
}
```

**Response body (encrypted):**
```json
{
  "encryptedData": "<Base64 AES-256-CBC encrypted response JSON>",
  "iv":            "<Base64 fresh IV>"
}
```

---

## Encryption

Hybrid encryption matching the cKYC/Repco pattern:

```
CLIENT (Angular)                   SERVER (Spring Boot)
────────────────                   ────────────────────
1. Fetch RSA public key   ──GET──► Return SPKI Base64
2. Generate AES-256 key
3. AES-CBC encrypt body
4. RSA-OAEP wrap AES key  ──POST─► Decrypt AES key (private key)
                                    AES decrypt body
                                    Process request
                          ◄──────  AES encrypt response (same key)
5. AES decrypt response
```

**Key details:**
- RSA: 2048-bit, OAEP padding, SHA-256 hash + MGF1-SHA-256
- AES: 256-bit key, CBC mode, PKCS5 padding, fresh 16-byte IV per request
- Private key: loaded from `CRYPTO_PRIVATE_KEY_PATH` env var — **never bundled in JAR or committed to git**
- Public certificate: bundled in `src/main/resources/crypto/certificate.crt` (safe — public key only)

---

## VAPT Security

A full Vulnerability Assessment and Penetration Testing review was conducted. See **[VAPT_Security_Report.pdf](./VAPT_Security_Report.pdf)** for the complete report.

**Summary of findings and fixes:**

| Category | Issues Found | Status |
|----------|-------------|--------|
| Bugs & Logic Errors | 6 (1 Critical, 2 Major, 3 Minor) | All Fixed |
| Code Standards | 5 | All Fixed |
| Security/Compliance | 5 (3 High, 2 Medium) | All Fixed |
| VAPT Frontend | 5 (2 High, 2 Medium, 1 Low) | All Fixed |
| VAPT Backend | 7 (2 Critical, 4 High, 1 Medium) | Auth layer needed for production; rest fixed |
| **Overall Score** | | **★★★☆☆ 3/5** |

> **Note:** The 2 Critical backend findings (Broken Authentication, Broken Access Control) require adding Spring Security with JWT before production deployment — this is a known gap noted in the VAPT report.

---

## Project Structure

```
D:\nila\
├── adaptive-learning-frontend/          # Angular 19 app
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── header/                  # Top bar with tabs + actions
│   │   │   ├── sidebar/                 # Component library + drag tiles
│   │   │   ├── canvas/                  # SVG flow canvas with nodes + edges
│   │   │   └── properties-panel/        # Node property editor
│   │   ├── services/
│   │   │   ├── component.service.ts     # GET /api/components
│   │   │   ├── learning-path.service.ts # CRUD /api/learning-paths
│   │   │   └── encryption.service.ts    # Web Crypto RSA+AES
│   │   ├── interceptors/
│   │   │   └── encryption.interceptor.ts # Transparent POST/PUT encryption
│   │   ├── models/
│   │   │   ├── learning-path.model.ts
│   │   │   └── component.model.ts
│   │   └── environments/
│   │       ├── environment.ts           # Dev: http://localhost:8080/api
│   │       └── environment.prod.ts      # Prod: /api (nginx proxy)
│   └── ...
│
├── adaptive-learning-backend/           # Spring Boot 3 app
│   └── src/main/java/com/nilaapps/adaptive/
│       ├── controller/                  # Presentation layer
│       │   ├── ComponentController.java
│       │   ├── LearningPathController.java
│       │   └── crypto/CryptoController.java
│       ├── service/                     # Business layer
│       │   ├── ComponentService.java
│       │   ├── LearningPathService.java
│       │   └── crypto/EncryptionUtil.java
│       ├── repository/                  # Data layer
│       │   ├── ComponentRepository.java
│       │   └── LearningPathRepository.java
│       ├── model/
│       │   ├── LearningPath.java
│       │   ├── PathNode.java
│       │   ├── PathEdge.java
│       │   └── ComponentItem.java
│       └── config/
│           ├── CorsConfig.java
│           ├── SecurityHeadersFilter.java
│           ├── GlobalExceptionHandler.java
│           └── crypto/EncryptionDecryptionFilter.java
│
├── EncryptionDecryption/                # Key material (NOT in git)
│   ├── certificate.crt                  # RSA public cert (safe to share)
│   └── privatekey.pem                   # RSA private key (KEEP SECRET)
│
└── docs/                                # ← This folder
    ├── README.md
    ├── ARCHITECTURE.md
    ├── API_REFERENCE.md
    ├── ENCRYPTION_GUIDE.md
    ├── SETUP_GUIDE.md
    └── VAPT_Security_Report.pdf
```

---

## Author

**Sam Elkens Raja**
Submitted for: Fullstack Developer — NilaApps / Edrevel AI
