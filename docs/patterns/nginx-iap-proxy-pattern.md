# nginx Proxy Pattern for IAP-Protected Backends

**Pattern Name:** nginx IAP Header Forwarding Proxy
**Use Case:** Frontend nginx proxying authenticated requests to backend API services
**Context:** Cloud Run services behind Google Cloud IAP (Identity-Aware Proxy)

---

## Problem

When a frontend application needs to call a separate backend API service, both protected by IAP:

**Naive approach (FAILS):**
```
Browser → Backend API directly
```
- Browser doesn't have IAP headers
- Backend rejects with 401 Unauthorized

**Why it fails:**
- IAP headers (`X-Goog-Authenticated-User-Email`, etc.) are added by Load Balancer
- Browser direct calls bypass the Load Balancer
- Backend can't validate authentication

---

## Solution

Route API calls through the frontend nginx, which has IAP headers from the Load Balancer:

```
Browser → Load Balancer (IAP) → Frontend nginx → Backend API
                   ↓                    ↓
          [adds IAP headers]   [forwards headers]
```

---

## Implementation

### 1. Frontend nginx Configuration

**File:** `nginx.conf.template` (if using envsubst) or `nginx.conf`

```nginx
location /api/position-descriptions {
    # Only allow read methods (adjust as needed)
    if ($request_method !~ ^(GET|OPTIONS)$) {
        return 405 '{"error": "Method not allowed"}';
    }

    # Proxy to backend API
    proxy_pass https://backend-service-url.run.app/api/position-descriptions;
    proxy_ssl_server_name on;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;

    # Forward standard headers
    proxy_set_header Host backend-service-url.run.app;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Forward IAP headers (CRITICAL)
    proxy_set_header X-Goog-IAP-JWT-Assertion $http_x_goog_iap_jwt_assertion;
    proxy_set_header X-Goog-Authenticated-User-Email $http_x_goog_authenticated_user_email;

    # Proxy settings
    proxy_redirect off;
    proxy_buffering off;
    proxy_read_timeout 30s;
    proxy_connect_timeout 10s;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;
        add_header Access-Control-Max-Age 3600 always;
        return 204;
    }
}
```

**Key elements:**
- `proxy_pass` points to backend Cloud Run service
- `proxy_ssl_server_name on` enables SNI for HTTPS
- IAP headers forwarded with `$http_x_goog_*` variables
- Method restrictions prevent unwanted operations
- Timeouts prevent hanging requests

### 2. Backend Express Configuration

**File:** `backend/src/index.ts`

```typescript
import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();

// CRITICAL: Trust proxy headers (MUST be before middleware)
app.set('trust proxy', true);

// Rate limiting will now work correctly
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// IAP authentication middleware
app.use((req, res, next) => {
  const email = req.headers['x-goog-authenticated-user-email'];
  if (!email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = { email: email.toString().replace('accounts.google.com:', '') };
  next();
});
```

**Why trust proxy is required:**
- nginx forwards `X-Forwarded-For` header
- `express-rate-limit` uses this header for IP-based limiting
- Without trust proxy, Express throws validation errors
- Must be set BEFORE any middleware that uses req.ip

### 3. Frontend Service Configuration

**File:** `src/app/services/api.ts`

```typescript
// Use relative URLs (no base URL needed)
const API_BASE_URL = '';

export async function fetchData() {
  // This goes to same domain, nginx proxies to backend
  const response = await fetch(`${API_BASE_URL}/api/position-descriptions`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

**Key points:**
- Empty base URL means relative to current domain
- Browser calls `https://intranet.example.com/api/...`
- nginx intercepts and proxies to backend
- IAP headers already present from Load Balancer

---

## Common Mistakes

### ❌ Mistake 1: Modify nginx.conf Instead of Template

**Problem:**
```bash
# Modify this:
nginx.conf

# But Docker uses this:
docker-entrypoint.sh → nginx.conf.template → nginx.conf
```

**Solution:** Check Dockerfile for which file is actually used:
```bash
grep -E "COPY.*nginx|ENTRYPOINT" Dockerfile
```

### ❌ Mistake 2: Forget Trust Proxy

**Symptom:**
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy'
setting is false (default).
```

**Solution:** Add trust proxy FIRST:
```typescript
const app = express();
app.set('trust proxy', true); // MUST be here
app.use(rateLimit(...)); // Then middleware
```

### ❌ Mistake 3: Wrong Host Header

**Problem:**
```nginx
proxy_set_header Host $host; # Uses frontend host
```

**Fix:**
```nginx
proxy_set_header Host backend-service-url.run.app; # Use backend host
```

**Why:** Cloud Run validates Host header matches service URL

### ❌ Mistake 4: Hardcode Backend URL in Frontend

**Problem:**
```typescript
const API_BASE_URL = 'https://backend-service.run.app';
// Browser calls backend directly → No IAP headers → 401
```

**Fix:**
```typescript
const API_BASE_URL = ''; // Relative URLs → nginx proxy → IAP headers
```

---

## Testing

### Local Development

**Option 1: Mock IAP headers**
```typescript
// backend middleware
if (process.env.NODE_ENV === 'development') {
  req.user = { email: 'dev@example.com' };
  return next();
}
```

**Option 2: Vite proxy**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### Production Testing

**Health check:**
```bash
curl -H "X-Goog-Authenticated-User-Email: accounts.google.com:user@example.com" \
  https://backend-service.run.app/health
```

**Full flow:**
```bash
# Should work (through frontend)
curl https://frontend.example.com/api/data

# Should fail with 401 (direct to backend)
curl https://backend-service.run.app/api/data
```

---

## When to Use This Pattern

**✅ Use when:**
- Separate frontend/backend Cloud Run services
- Both protected by IAP
- Frontend needs to call backend APIs
- Backend validates IAP headers

**❌ Don't use when:**
- Single Cloud Run service (monolith)
- Backend is public (no IAP)
- Using API Gateway (different auth pattern)
- Backend validates JWT tokens directly (Cloud Run service-to-service auth)

---

## Related Patterns

- **Docker Template Pattern:** Using envsubst for runtime config
- **Express Trust Proxy Pattern:** Required for rate limiting behind proxies
- **IAP Authentication Pattern:** Validating Google IAP headers
- **Cloud Run Service Mesh:** Alternative using VPC connectors

---

## References

- [Express behind proxies](https://expressjs.com/en/guide/behind-proxies.html)
- [nginx proxy_pass docs](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [Google Cloud IAP](https://cloud.google.com/iap/docs)
- [express-rate-limit trust proxy error](https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/)

---

**Pattern Extracted From:** RML Intranet Position Descriptions implementation (2026-02-16)
**Session Notes:** `/home/jtaylor/everything-claude-code/docs/sessions/2026-02-16-intranet-position-descriptions-phase1.md`
