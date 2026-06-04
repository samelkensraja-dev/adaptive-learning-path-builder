# Setup Guide

Complete step-by-step guide to set up, build, and run the Adaptive Learning Path Builder from scratch.

---

## System Requirements

| Tool | Required Version | Install Link |
|------|-----------------|--------------|
| JDK | 17 or higher (JDK 23 recommended) | https://www.oracle.com/java/technologies/downloads/ |
| Apache Maven | 3.8+ | https://maven.apache.org/download.cgi |
| Node.js | 18+ | https://nodejs.org/ |
| Angular CLI | 19 | `npm install -g @angular/cli@19` |
| Git | Any | https://git-scm.com/ |

---

## Step 1 — Clone / Download the Repository

```bash
git clone <repository-url>
cd adaptive-learning-path-builder
```

Or extract the ZIP file and open the folder.

---

## Step 2 — Verify Tools

```bash
# Check Java (must use JDK 17+, not JRE 8)
"C:\Program Files\Java\jdk-23\bin\java.exe" --version
# Expected: java 23.0.x

# Check Maven
mvn --version
# Expected: Apache Maven 3.9.x, Java version: 23

# Check Node
node --version
# Expected: v18.x or higher

# Check Angular CLI
ng version
# Expected: Angular CLI: 19.x
```

---

## Step 3 — Build the Backend

```bash
# Navigate to backend
cd adaptive-learning-backend

# Download dependencies and build JAR
mvn package -DskipTests

# Verify JAR created
dir target\adaptive-learning-backend-1.0.0.jar
```

---

## Step 4 — Set Up Encryption Key

The private key must be set as an environment variable.
It should **not** be inside the project folder.

```bash
# Windows Command Prompt
set CRYPTO_PRIVATE_KEY_PATH=D:\nila\EncryptionDecryption\privatekey.pem

# Windows PowerShell
$env:CRYPTO_PRIVATE_KEY_PATH = "D:\nila\EncryptionDecryption\privatekey.pem"

# Linux / macOS
export CRYPTO_PRIVATE_KEY_PATH=/path/to/privatekey.pem
```

> If the private key is not available, the app runs in **plaintext fallback mode** — all features work, requests are just not encrypted.

---

## Step 5 — Start the Backend

```bash
cd adaptive-learning-backend

# Windows — use JDK 23 explicitly (not default Java 8)
"C:\Program Files\Java\jdk-23\bin\java.exe" -jar target\adaptive-learning-backend-1.0.0.jar

# Linux / macOS (if JAVA_HOME set to JDK 17+)
java -jar target/adaptive-learning-backend-1.0.0.jar
```

**Wait for this startup confirmation:**
```
INFO  o.s.b.w.embedded.tomcat.TomcatWebServer - Tomcat started on port 8080
INFO  c.n.a.AdaptiveLearningApplication        - Started AdaptiveLearningApplication in X.XXX seconds
INFO  c.n.adaptive.crypto.EncryptionUtil        - EncryptionUtil initialised — RSA-OAEP-SHA256 + AES-256-CBC ready
```

**Test it:**
```bash
curl http://localhost:8080/api/crypto/status
# Should return: {"encryptionEnabled":true,"decryptionAvailable":true,...}
```

---

## Step 6 — Install Frontend Dependencies

```bash
cd adaptive-learning-frontend

npm install
```

---

## Step 7 — Start the Frontend

```bash
cd adaptive-learning-frontend

ng serve --port 4200
```

**Wait for:**
```
✔ Building...
Application bundle generation complete. [X.XXX seconds]
➜  Local:   http://localhost:4200/
```

---

## Step 8 — Open the Application

Open your browser and navigate to:

**http://localhost:4200**

You should see:
- The "Adaptive Learning Path Builder" header
- SAT Adaptive Path loaded on the canvas (10 nodes with arrows)
- Sidebar with 6 content items from the backend
- Properties panel on the right

---

## Step 9 — Verify Everything Works

### Check the canvas loads

The canvas should show the SAT Adaptive Path with:
- Start Assessment → Math Module 1 → Math Module 2 Group (Easy/Advanced branches) → Reading & Comp Module 1 → Reading & Comp Group (Easy/Advanced branches) → Complete Assessment

### Check encryption is active

1. Open browser DevTools (F12) → Network tab
2. Click "Save Draft"
3. Find the POST request to `/api/learning-paths`
4. Click it → Request payload should show:
   ```json
   { "encryptedData": "...", "encryptedKey": "...", "iv": "..." }
   ```
   (Not plain JSON — this confirms encryption is working)

### Check the API endpoints

```bash
# All components
curl http://localhost:8080/api/components

# The pre-loaded demo path
curl http://localhost:8080/api/learning-paths/lp-sat-adaptive-001

# Encryption status
curl http://localhost:8080/api/crypto/status

# Public key (SPKI format for Angular)
curl http://localhost:8080/api/crypto/public-key
```

---

## Common Issues

### Issue: Port 8080 already in use

```bash
# Windows: find and kill the process using port 8080
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

### Issue: "Unsupported class version error" when running JAR

The JAR was compiled with JDK 17+ but you're running it with JRE 8.
**Fix:** Use the full JDK 23 path explicitly:
```bash
"C:\Program Files\Java\jdk-23\bin\java.exe" -jar target\adaptive-learning-backend-1.0.0.jar
```

### Issue: Sidebar shows no components (empty list)

The frontend can't reach the backend. Verify:
1. Backend is running: `curl http://localhost:8080/api/components`
2. No firewall blocking port 8080
3. Frontend is running on port 4200 (CORS is configured for 4200 only)

### Issue: Encryption not working (plaintext mode)

Check the backend log:
```
WARN  EncryptionUtil - CRYPTO_PRIVATE_KEY_PATH not set — decryption disabled.
```
**Fix:** Set the environment variable before starting the backend.

### Issue: Angular build fails with "TS" errors

```bash
# Clean and rebuild
cd adaptive-learning-frontend
rm -rf node_modules dist .angular
npm install
ng build
```

---

## Production Deployment Notes

1. **Replace the certificate and key pair** with a production CA-signed certificate
2. **Add Spring Security** (JWT/OAuth2) — the current version has no authentication
3. Set `crypto.private-key-path` in a secrets manager (AWS Secrets Manager, HashiCorp Vault)
4. Configure `environment.prod.ts` `apiBaseUrl` to point to the production API domain
5. Serve the Angular dist via nginx with the following headers pre-configured:
   ```nginx
   add_header X-Frame-Options "DENY";
   add_header Content-Security-Policy "default-src 'self'; ...";
   add_header Strict-Transport-Security "max-age=31536000";
   ```
