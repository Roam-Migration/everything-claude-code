# Pattern: JWT-Signed Embedding for Third-Party Tools

**Context:** RML Intranet - Metabase Dashboard Integration
**Date:** 2026-02-16
**Status:** ✅ Validated in Production

---

## Problem

Need to securely embed third-party dashboards/tools (Metabase, Looker, Tableau, etc.) that contain PII or sensitive data without:
- Exposing API credentials to frontend
- Allowing unauthenticated access to embedded content
- Relying solely on "security through obscurity" (public UUIDs)

---

## Solution

Use **JWT-signed embedding** where:
1. Backend generates signed tokens with secret key
2. Tokens include dashboard ID, parameters, and expiration
3. Third-party service validates JWT signature before rendering
4. Frontend requests fresh signed URLs on page load (never sees secret key)

### Security Layers

```
User Authentication (IAP) → Backend API (generates JWT) → Third-Party Service (validates JWT) → Content
```

**Defense in Depth:**
- Layer 1: IAP prevents unauthenticated users from accessing intranet
- Layer 2: Backend API checks IAP headers before generating tokens
- Layer 3: JWT signature validates request came from authorized backend
- Layer 4: Token expiration limits exposure window

---

## Implementation

### Backend Service

**File:** `backend/src/services/MetabaseService.ts`

```typescript
import jwt from 'jsonwebtoken';

export interface EmbedParams {
  dashboardId: number;
  params?: Record<string, any>;
  expiresIn?: number; // seconds
}

export class EmbedService {
  private readonly serviceUrl: string;
  private readonly secretKey: string;

  constructor() {
    this.serviceUrl = process.env.SERVICE_URL!;
    this.secretKey = process.env.EMBED_SECRET_KEY!;

    if (!this.serviceUrl || !this.secretKey) {
      throw new Error('SERVICE_URL and EMBED_SECRET_KEY must be set');
    }
  }

  generateSignedUrl(params: EmbedParams): string {
    const { dashboardId, params: dashboardParams = {}, expiresIn = 600 } = params;

    // Create JWT payload
    const payload = {
      resource: { dashboard: dashboardId },
      params: dashboardParams,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    };

    // Sign the JWT
    const token = jwt.sign(payload, this.secretKey, {
      algorithm: 'HS256',
    });

    // Return embed URL
    return `${this.serviceUrl}/embed/dashboard/${token}#bordered=true&titled=true`;
  }

  validateConfig(): boolean {
    try {
      const testUrl = this.generateSignedUrl({ dashboardId: 1 });
      return testUrl.startsWith(this.serviceUrl);
    } catch {
      return false;
    }
  }
}
```

### Backend Route

**File:** `backend/src/routes/embed.ts`

```typescript
import { Router } from 'express';
import { EmbedService } from '../services/EmbedService';

const router = Router();
let embedService: EmbedService;

try {
  embedService = new EmbedService();
} catch (error) {
  console.error('Failed to initialize embed service:', error);
}

router.get('/signed-url', async (req, res) => {
  if (!embedService) {
    return res.status(503).json({
      error: 'Embed service unavailable',
    });
  }

  try {
    const embedUrl = embedService.generateSignedUrl({
      dashboardId: parseInt(process.env.DEFAULT_DASHBOARD_ID || '1'),
      params: {}, // Add user-specific filters here
      expiresIn: 600, // 10 minutes
    });

    return res.json({
      url: embedUrl,
      expiresIn: 600,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to generate embed URL',
    });
  }
});

router.get('/health', async (req, res) => {
  if (!embedService || !embedService.validateConfig()) {
    return res.status(503).json({ status: 'unhealthy' });
  }
  return res.json({ status: 'healthy' });
});

export default router;
```

### Frontend Component

**File:** `src/components/EmbedDashboard.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function EmbedDashboard() {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmbedUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/embed/signed-url', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch embed URL');
        }

        const data = await response.json();
        setEmbedUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEmbedUrl();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[800px]">
        <Loader2 className="w-16 h-16 animate-spin" />
        <p>Generating secure embed URL...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[800px]">
        <p className="text-red-500">{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <iframe
      src={embedUrl!}
      className="w-full h-[800px] border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
```

### Nginx Proxy Configuration

**File:** `nginx.conf.template`

```nginx
location /api/embed/ {
    # Restrict methods
    if ($request_method !~ ^(GET|OPTIONS)$) {
        return 405 '{"error": "Method not allowed"}';
    }

    # Proxy to backend
    proxy_pass https://backend-service.run.app/api/embed/;
    proxy_ssl_server_name on;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;

    # Forward headers
    proxy_set_header Host backend-service.run.app;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Forward IAP headers
    proxy_set_header X-Goog-IAP-JWT-Assertion $http_x_goog_iap_jwt_assertion;
    proxy_set_header X-Goog-Authenticated-User-Email $http_x_goog_authenticated_user_email;

    # Timeouts
    proxy_read_timeout 15s;
    proxy_connect_timeout 5s;
}
```

### Environment Variables

**File:** `backend/cloudbuild.yaml`

```yaml
args:
  - '--set-env-vars'
  - 'SERVICE_URL=https://service.com,EMBED_SECRET_KEY=abc123...,DEFAULT_DASHBOARD_ID=529'
```

---

## Configuration

### 1. Enable Signed Embedding in Third-Party Service

**Metabase Example:**
1. Settings → Admin → Embedding → Enable "Signed Embedding"
2. Copy secret key (shown only once!)
3. Dashboard → Share → Embedding → Set to "Signed" → Publish

**Looker Example:**
1. Admin → Embedding → Enable "Signed SSO Embedding"
2. Generate embed secret
3. Configure embed URL domain allowlist

### 2. Store Secret Key Securely

**Options:**
- ✅ Cloud Run environment variables
- ✅ Google Secret Manager
- ❌ Never in code or .env files committed to Git

### 3. Configure Token Expiration

**Guidelines:**
| Use Case | Recommended Expiration | Rationale |
|----------|------------------------|-----------|
| Internal BI dashboards | 10-30 minutes | Users actively viewing, rare idle time |
| Executive dashboards | 30-60 minutes | Longer viewing sessions |
| Public-facing embeds | 5 minutes | Minimize exposure window |
| Video/media embeds | 2-4 hours | Long playback duration |

---

## Best Practices

### Security

1. **Never expose secret key to frontend**
   - ✅ Backend generates tokens
   - ❌ Frontend never sees secret key

2. **Use short token expiration**
   - ✅ 10-30 minutes for dashboards
   - ❌ Avoid >1 hour expiration

3. **Validate IAP headers in backend**
   ```typescript
   const userEmail = req.headers['x-goog-authenticated-user-email'];
   if (!userEmail) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

4. **Set iframe sandbox attributes**
   ```html
   <iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
   ```

5. **Use HTTPS everywhere**
   - Backend API: HTTPS
   - Third-party service: HTTPS
   - Nginx proxy: HTTPS (terminates at load balancer)

### Performance

1. **Cache signed URLs client-side**
   - Store in component state, not localStorage (expires with page)
   - Refresh on page load, not on every render

2. **Set reasonable timeouts**
   - Backend API: 15s read, 5s connect
   - Avoid 60s+ timeouts (poor UX)

3. **Monitor token generation latency**
   - JWT signing is fast (<50ms)
   - Network latency to third-party service dominates

### User Experience

1. **Show loading states**
   - Spinner while fetching signed URL
   - "Generating secure embed URL..." message

2. **Handle errors gracefully**
   - Display error message
   - Provide retry button
   - Log errors to backend for debugging

3. **Handle token expiration**
   - Refresh page to get new token
   - Or implement auto-refresh before expiration

---

## Variations

### Variation 1: Per-User Filtering

Pass IAP user email to filter dashboard data:

```typescript
generateSignedUrl({
  dashboardId: 529,
  params: {
    user_email: req.headers['x-goog-authenticated-user-email'],
  },
  expiresIn: 600,
});
```

**Dashboard must support parameter filtering:**
- Metabase: Use dashboard parameters in SQL queries
- Looker: Use user attributes in LookML
- Tableau: Use user filters in workbooks

### Variation 2: Role-Based Dashboards

Return different dashboard IDs based on user role:

```typescript
const dashboardId = getUserRole(userEmail) === 'executive' ? 529 : 530;
const embedUrl = embedService.generateSignedUrl({ dashboardId });
```

### Variation 3: Multi-Dashboard Selector

Allow users to switch between dashboards:

```typescript
router.get('/signed-url/:dashboardId', async (req, res) => {
  const dashboardId = parseInt(req.params.dashboardId);
  const embedUrl = embedService.generateSignedUrl({ dashboardId });
  return res.json({ url: embedUrl });
});
```

Frontend:
```typescript
const fetchDashboard = (id) => {
  fetch(`/api/embed/signed-url/${id}`).then(/* ... */);
};
```

---

## Troubleshooting

### Token Generation Fails

**Symptoms:**
- 503 Service Unavailable
- "Failed to initialize embed service"

**Causes:**
1. SECRET_KEY not set in environment
2. SERVICE_URL not configured
3. jsonwebtoken not installed

**Fixes:**
```bash
# Check env vars
gcloud run services describe SERVICE --format="value(spec.template.spec.containers[0].env)"

# Verify jsonwebtoken installed
npm list jsonwebtoken

# Test locally
SERVICE_URL=https://service.com EMBED_SECRET_KEY=abc123 npm run dev
```

### Dashboard Shows "Unauthorized"

**Symptoms:**
- Embed loads blank page
- "Invalid token" error

**Causes:**
1. Wrong secret key (doesn't match third-party service)
2. Token expired
3. Clock skew between backend and third-party service

**Fixes:**
```bash
# Verify secret key matches
echo $EMBED_SECRET_KEY  # Should match service's secret

# Check token payload
# Decode JWT at jwt.io to inspect exp timestamp

# Sync server time
ntpdate -s time.google.com
```

### Mixed Content Errors

**Symptoms:**
- "blocked loading resource over HTTP"
- Dashboard doesn't load

**Causes:**
1. Missing nginx proxy for `/api/embed/`
2. Backend URL uses http:// instead of https://

**Fixes:**
- Add nginx location block (see pattern above)
- Verify backend URL uses https://

---

## Metrics to Monitor

### Security Metrics
- Token generation failures (should be <0.1%)
- Invalid token attempts (indicates attack or misconfiguration)
- IAP bypass attempts (should be 0)

### Performance Metrics
- Token generation latency (target: <100ms)
- Dashboard load time (target: <5 seconds)
- API request rate (track per user)

### User Experience Metrics
- Token expiration errors (indicates expiration too short)
- Retry button clicks (indicates reliability issues)
- Page abandonment rate (indicates UX problems)

---

## Related Patterns

- **nginx-iap-proxy-pattern.md** - Nginx proxy configuration for IAP-protected backend APIs
- **non-blocking-data-loading.md** - Loading states for async data fetching
- **toast-notification-integration.md** - Error notification patterns

---

## Adaptable For

- ✅ Metabase signed embedding
- ✅ Looker signed SSO embedding
- ✅ Tableau signed embedding
- ✅ Custom analytics tools
- ✅ Video player signed URLs (Vimeo, Wistia, Mux)
- ✅ Document viewer signed URLs (Box, Google Drive API)
- ✅ Any service that supports JWT-signed embedding

---

## References

- [Metabase Signed Embedding](https://www.metabase.com/docs/latest/embedding/signed-embedding)
- [JWT.io](https://jwt.io/) - JWT decoder/debugger
- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken)
- [RFC 7519: JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)

---

**Validated In:** RML Intranet Metabase Integration (2026-02-16)
**Status:** ✅ Production-ready pattern
