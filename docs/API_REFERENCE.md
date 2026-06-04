# API Reference

Base URL: `http://localhost:8080`

All POST/PUT request bodies and their responses are **encrypted** (see [ENCRYPTION_GUIDE.md](./ENCRYPTION_GUIDE.md)).
GET/DELETE requests are plaintext.

---

## Components

### GET /api/components

Returns the available content library used to populate the sidebar.

**Response 200:**
```json
{
  "items": [
    {
      "id": "cmp-assess-math-1",
      "title": "Math Module 1 Assessment",
      "shortDescription": "Baseline math diagnostic used to route learners.",
      "type": "assessment",
      "approximateDurationMinutes": 35,
      "metadata": {
        "assessment": {
          "maxScore": 100,
          "passingScore": 50
        }
      }
    },
    {
      "id": "cmp-unit-math-2-easy",
      "title": "Math Module 2 - Easy",
      "shortDescription": "Foundational math remediation unit.",
      "type": "unit",
      "approximateDurationMinutes": 35,
      "metadata": {
        "unit": { "recommendedMinutes": 30 }
      }
    }
  ],
  "totalCount": 6
}
```

---

## Learning Paths

### GET /api/learning-paths

Returns all stored learning paths.

**Response 200:**
```json
[
  {
    "id": "lp-sat-adaptive-001",
    "name": "SAT Adaptive Path",
    "status": "draft",
    "version": 1,
    "nodes": [...],
    "edges": [...]
  }
]
```

---

### GET /api/learning-paths/{id}

Returns a single learning path by ID.

**Response 200:**
```json
{
  "id": "lp-sat-adaptive-001",
  "name": "SAT Adaptive Path",
  "description": "Routes learners based on math and reading performance.",
  "status": "draft",
  "version": 1,
  "canvas": { "zoom": 0.7, "offsetX": 0, "offsetY": 0 },
  "nodes": [
    {
      "id": "node-start",
      "componentId": "system-start",
      "type": "start",
      "label": "Start Assessment",
      "position": { "x": 420, "y": 60 }
    },
    {
      "id": "node-math-1",
      "componentId": "cmp-assess-math-1",
      "type": "assessment",
      "label": "Math Module 1",
      "position": { "x": 420, "y": 170 },
      "config": {
        "approximateDurationMinutes": 35,
        "assessment": { "maxScore": 100, "passingScore": 50 }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "sourceNodeId": "node-start",
      "targetNodeId": "node-math-1",
      "priority": 1,
      "isDefault": true,
      "conditions": { "operator": "AND", "rules": [] }
    },
    {
      "id": "e3",
      "sourceNodeId": "node-math-2-group",
      "targetNodeId": "node-math-2-easy",
      "label": "Score < 50%",
      "priority": 1,
      "isDefault": false,
      "conditions": {
        "operator": "AND",
        "rules": [
          {
            "id": "r3",
            "sourceType": "assessment",
            "sourceNodeId": "node-math-1",
            "metric": "score_range",
            "operator": "between",
            "range": { "min": 0, "max": 49, "minInclusive": true, "maxInclusive": true }
          }
        ]
      }
    }
  ]
}
```

**Response 404:** Path not found

---

### POST /api/learning-paths

Creates a new learning path.
The request body must be wrapped in an encrypted envelope.

**Plain request body (before encryption):**
```json
{
  "name": "My New Path",
  "description": "Optional description",
  "status": "draft",
  "nodes": [
    {
      "id": "node-start",
      "componentId": "system-start",
      "type": "start",
      "label": "Start",
      "position": { "x": 300, "y": 50 }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "sourceNodeId": "node-start",
      "targetNodeId": "node-end",
      "conditions": { "operator": "AND", "rules": [] }
    }
  ]
}
```

**Actual wire payload (encrypted):**
```json
{
  "encryptedData": "h3kPz9Q...base64...",
  "encryptedKey":  "A1bCdE...base64...",
  "iv":            "randomIVbase64=="
}
```

**Response 201:** Created learning path (encrypted response body)

**Validation rules:**
- `name`: required, 1–150 characters
- `status`: must be `"draft"` or `"published"`
- `nodes`: minimum 2 nodes required
- `edges`: minimum 1 edge required
- Node `type`: must be `start | unit | assessment | end | group`

**Response 400 (validation error):**
```json
{
  "errors": [
    "name: must not be blank",
    "status: status must be 'draft' or 'published'"
  ]
}
```

---

### PUT /api/learning-paths/{id}

Updates an existing learning path. Same encrypted body format as POST.

- The `id` field in the body is ignored (taken from URL path)
- The `version` is auto-incremented server-side

**Response 200:** Updated learning path (encrypted)
**Response 404:** Path not found

---

### DELETE /api/learning-paths/{id}

Deletes a learning path.

**Response 204:** No Content
**Response 404:** Path not found

---

## Crypto

### GET /api/crypto/public-key

Returns the server's RSA public key for Angular to use when encrypting request AES keys.

**Response 200:**
```json
{
  "spki": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...",
  "certificate": "-----BEGIN CERTIFICATE-----\nMIIDQTCC...\n-----END CERTIFICATE-----\n",
  "algorithm": "RSA-OAEP-SHA256 + AES-256-CBC"
}
```

- `spki` — Base64-encoded SubjectPublicKeyInfo bytes, imported by Angular via `crypto.subtle.importKey('spki', ...)`
- `certificate` — Full X.509 PEM certificate (informational)

---

### GET /api/crypto/status

Checks if encryption is fully operational.

**Response 200 (both keys loaded):**
```json
{
  "encryptionEnabled": true,
  "decryptionAvailable": true,
  "algorithm": "RSA-OAEP-SHA256 / AES-256-CBC"
}
```

**Response 200 (no private key — dev mode):**
```json
{
  "encryptionEnabled": true,
  "decryptionAvailable": false,
  "algorithm": "RSA-OAEP-SHA256 / AES-256-CBC"
}
```

---

## Error Responses

All error responses use this format (no stack traces):

| Status | Meaning |
|--------|---------|
| 400 | Validation error — check `errors` array |
| 400 | Encrypted payload invalid or corrupt |
| 404 | Resource not found |
| 500 | Internal error — generic message only |

```json
{ "error": "An internal error occurred. Please contact support." }
```

---

## Node Types Reference

| Type | Icon Colour | Description |
|------|------------|-------------|
| `start` | Green | Entry point of the path |
| `assessment` | Blue | Scored quiz module that drives routing |
| `unit` | Blue | Learning content module |
| `group` | Purple dashed | Adaptive branch — one child shown per learner |
| `end` | Gray | Exit point of the path |

## Edge Condition Metrics

| Metric | Applies To | Operator | Value Type |
|--------|-----------|----------|-----------|
| `completion` | assessment, unit | `eq` | boolean |
| `passed` | assessment | `eq` | boolean |
| `score` | assessment | `eq, ne, gt, gte, lt, lte` | number |
| `score_range` | assessment | `between` | range object |
| `time_spent_minutes` | unit | `eq, ne, gt, gte, lt, lte` | number |
| `percentage_completion` | unit | `eq, ne, gt, gte, lt, lte` | number |
