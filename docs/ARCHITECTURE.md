# System Architecture

## Overview

The Adaptive Learning Path Builder follows a clean **three-layer architecture** on the backend and a **component-service** pattern on the frontend.

---

## Backend — Three-Layer Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                      (Controllers)                           │
│                                                              │
│   ComponentController      GET /api/components               │
│   LearningPathController   GET/POST/PUT/DELETE               │
│                            /api/learning-paths               │
│   CryptoController         GET /api/crypto/public-key        │
│                            GET /api/crypto/status            │
└────────────────────────────┬─────────────────────────────────┘
                             │  calls
┌────────────────────────────▼─────────────────────────────────┐
│                    BUSINESS LAYER                            │
│                      (Services)                              │
│                                                              │
│   ComponentService         Business rules for components     │
│   LearningPathService      CRUD logic + version increment    │
│                            + audit logging                   │
│   EncryptionUtil           RSA-OAEP + AES-256-CBC crypto     │
└────────────────────────────┬─────────────────────────────────┘
                             │  calls
┌────────────────────────────▼─────────────────────────────────┐
│                    DATA LAYER                                │
│                      (Repositories)                          │
│                                                              │
│   ComponentRepository      In-memory list (read-only seed)   │
│   LearningPathRepository   ConcurrentHashMap + AtomicLong    │
│                            (thread-safe in-memory store)     │
└──────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Package | Responsibility |
|-------|---------|---------------|
| Presentation | `controller/` | HTTP routing, request/response mapping, `@Valid` enforcement |
| Business | `service/` | Business rules, versioning, audit logging, data transformation |
| Data | `repository/` | Storage access, CRUD operations, ID generation |

---

## Frontend — Component Architecture

```
AppComponent (root shell)
│
├── HeaderComponent
│     Button: Builder / Preview tabs
│     Button: Save Draft → calls LearningPathService.update()
│     Button: Publish   → calls LearningPathService.update()
│
├── SidebarComponent
│     Tile: Section (drag to canvas)
│     Tile: Group   (drag to canvas)
│     Info: How it works (expandable)
│     List: Available Content ← loaded from ComponentService
│
├── CanvasComponent (main interactive area)
│     SVG layer: bezier arrows (edges)
│     HTML layer: positioned node divs
│     Events: dragover, drop, mousedown, click
│     Zoom: canvasState.zoom (0.2 → 2.0)
│     Pan:  canvasState.offsetX/offsetY
│
└── PropertiesPanelComponent
      Form: Label, Description
      Form: Duration, Max Score, Passing Score
      Form: Assignment Conditions (Source, Operator, Threshold)
```

### Service Layer

```
EncryptionService          Loads RSA public key at startup
                           encrypt(payload) → EncryptedEnvelope
                           decrypt(response, aesKey) → T

LearningPathService        CRUD via HttpClient
                           Requests automatically encrypted by interceptor

ComponentService           GET /api/components
                           Populates sidebar Available Content list
```

### HTTP Pipeline

```
Angular HttpClient
       │
       ▼
EncryptionInterceptor (HttpInterceptorFn)
  POST/PUT → encrypt body → send
  Response → decrypt body → return
       │
       ▼
Spring Boot API (localhost:8080)
       │
       ▼
EncryptionDecryptionFilter (OncePerRequestFilter)
  Decrypt request body → pass to controller
  Capture response → encrypt → send
       │
       ▼
Controller → Service → Repository
```

---

## Cross-Cutting Concerns

| Concern | Implementation |
|---------|---------------|
| CORS | `CorsConfig.java` — allows `localhost:4200` with explicit headers |
| Security Headers | `SecurityHeadersFilter.java` — X-Frame-Options, CSP, HSTS, Referrer-Policy |
| Error Handling | `GlobalExceptionHandler.java` — hides stack traces, returns generic 500 |
| Input Validation | `@NotBlank`, `@Pattern`, `@Size` on all model fields |
| Audit Logging | SLF4J logger in `LearningPathService` for every write operation |
| Request Size | `spring.servlet.multipart.max-request-size=2MB` |
| Encryption | `EncryptionDecryptionFilter` + `EncryptionUtil` — RSA-OAEP + AES-256-CBC |

---

## Data Flow — Create Learning Path

```
1. User clicks "Save Draft" in Angular UI
2. AppComponent.saveDraft() calls LearningPathService.create(lp)
3. HttpClient.post('/api/learning-paths', body)
   │
   ├── EncryptionInterceptor intercepts POST
   │     a. EncryptionService.encrypt(body)
   │        - Generate AES-256 key (Web Crypto)
   │        - AES-CBC encrypt JSON body
   │        - RSA-OAEP wrap AES key with server's public key
   │     b. Replace body with {encryptedData, encryptedKey, iv}
   │
4. Encrypted request arrives at Spring Boot
   │
   ├── EncryptionDecryptionFilter
   │     a. RSA-OAEP decrypt AES key (privatekey.pem)
   │     b. AES-CBC decrypt request body
   │     c. Replace request body with plain JSON
   │
   ├── LearningPathController.create(@Valid @RequestBody lp)
   │     - Strips client-supplied id (mass-assignment guard)
   │     - Calls service.create(lp)
   │
   ├── LearningPathService.create(lp)
   │     - Sets version = 1
   │     - Calls repository.save(lp)
   │     - Audit log: CREATED id=... name=...
   │
   ├── LearningPathRepository.save(lp)
   │     - Generates id if blank
   │     - Stores in ConcurrentHashMap
   │     - Returns saved entity
   │
   └── EncryptionDecryptionFilter (response path)
         a. Captures controller JSON response
         b. Generates fresh IV
         c. AES-CBC encrypts response using same AES key
         d. Returns {encryptedData, iv}

5. EncryptionInterceptor receives encrypted response
   - Calls EncryptionService.decrypt(body, aesKey)
   - Returns plain LearningPath object to AppComponent

6. AppComponent shows toast "Saved as draft"
```

---

## JSON Schema Compliance

The learning path data structure adheres to the provided schemas:

- `learning-path.schema.json` — Node types, edge conditions, rule metrics
- `available-content.schema.json` — Component type, metadata structure

Node types validated by `@Pattern` constraint:
```
start | unit | assessment | end | group
```

Status validated:
```
draft | published
```
