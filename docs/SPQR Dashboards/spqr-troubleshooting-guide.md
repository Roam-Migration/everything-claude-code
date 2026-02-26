# SPQR Dashboard Troubleshooting Guide

**Generated:** 2026-02-17
**Session:** Error analysis and resolution planning

---

## Quick Summary

Your SPQR dashboard has **4 distinct issues** causing the errors you're seeing:

1. ✅ **Diagnosed:** Mixed Content Error (HTTP API called from HTTPS page)
2. ✅ **Diagnosed:** Expired Metabase JWT tokens (10-minute lifespan)
3. ⚠️ **Needs Investigation:** Backend 500 errors (server-side crashes)
4. 🔄 **Cascading Failure:** Frontend crashes due to missing data (will auto-resolve)

---

## Error Severity & Priority

| Issue | Severity | Impact | Fix Time | Priority |
|-------|----------|--------|----------|----------|
| Mixed Content | 🔴 Critical | Blocks ALL API calls | 15 min | P0 |
| JWT Expiration | 🟠 High | Dashboard breaks after 10 min | 30 min | P1 |
| Backend 500s | 🟠 High | Forms can't submit | 1-2 hours | P1 |
| Frontend crashes | 🟡 Medium | Poor UX, auto-fixes | 1 hour | P2 |

---

## Issue #1: Mixed Content Error (CRITICAL)

### Symptoms
```
Mixed Content: The page at 'https://intranet.roammigrationlaw.com/business-intelligence/spqr'
was loaded over HTTPS, but requested an insecure resource
'http://intranet.roammigrationlaw.com:8080/api/forms/'
```

### Why This Happens
Browsers block HTTP requests from HTTPS pages for security. Your React app is configured to call `http://` instead of `https://`.

### Where to Fix
Look for API configuration in your frontend codebase:

**Common locations:**
- `src/config.ts` or `src/config/api.ts`
- `.env.production` file
- `src/api/client.ts`
- `vite.config.ts` or `webpack.config.js`

**What to change:**
```javascript
// FROM:
const API_BASE_URL = 'http://intranet.roammigrationlaw.com:8080';

// TO (Option 1 - Direct HTTPS):
const API_BASE_URL = 'https://intranet.roammigrationlaw.com:8080';

// TO (Option 2 - Reverse Proxy):
const API_BASE_URL = 'https://intranet.roammigrationlaw.com/api';
// ^ Requires nginx/apache config to proxy /api -> localhost:8080
```

### Testing
1. Rebuild frontend: `npm run build`
2. Redeploy
3. Open browser DevTools Console
4. Refresh page
5. Verify: No "Mixed Content" errors

---

## Issue #2: Metabase JWT Expiration (HIGH)

### Symptoms
```
wealth-fish.metabaseapp.com/api/embed/dashboard/.../dashcard/.../card/... → 400
```

### Analysis (Using debug-jwt.js)
```
Expires: 2026-02-17T05:27:41.000Z
Now:     2026-02-17T05:28:48.634Z
Status:  ❌ EXPIRED (1 minute ago)
Lifespan: 10 minutes
```

### Why This Happens
Your backend generates Metabase embed tokens with `exp: iat + 600` (10 minutes). After 10 minutes, the dashboard stops loading.

### Solutions

**Option A: Longer Tokens (Quick Fix)**
Increase token lifespan in backend:

```javascript
// In your Metabase JWT generation code
const payload = {
  resource: { dashboard: 529 },
  params: { matter_type: [], current_stage: [], case_manager: [], supervisor: [] },
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour instead of 10 min
};

const token = jwt.sign(payload, METABASE_SECRET_KEY);
```

**Option B: Auto-Refresh (Better UX)**
Add token refresh logic to frontend:

```javascript
// Add to your SPQR dashboard component
useEffect(() => {
  const checkTokenExpiration = () => {
    // Extract JWT from iframe URL
    const iframe = document.querySelector('iframe[src*="metabaseapp.com"]');
    const src = iframe?.src;

    if (!src) return;

    // Parse JWT (format: /embed/dashboard/{JWT}/...)
    const jwtMatch = src.match(/\/embed\/dashboard\/([^\/]+)/);
    if (!jwtMatch) return;

    const token = jwtMatch[1];
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    const minutesLeft = (expiresAt - Date.now()) / 1000 / 60;

    // Refresh if less than 5 minutes left
    if (minutesLeft < 5) {
      fetch('/api/metabase/refresh-embed-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardId: 529 })
      })
        .then(res => res.json())
        .then(({ embedUrl }) => {
          iframe.src = embedUrl; // Seamless refresh
        });
    }
  };

  // Check every 5 minutes
  const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, []);
```

**Backend endpoint needed:**
```javascript
// POST /api/metabase/refresh-embed-token
app.post('/api/metabase/refresh-embed-token', async (req, res) => {
  const { dashboardId } = req.body;

  const payload = {
    resource: { dashboard: dashboardId },
    params: { matter_type: [], current_stage: [], case_manager: [], supervisor: [] },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60)
  };

  const token = jwt.sign(payload, process.env.METABASE_SECRET_KEY);
  const embedUrl = `https://wealth-fish.metabaseapp.com/embed/dashboard/${token}`;

  res.json({ embedUrl });
});
```

### Testing
1. Deploy changes
2. Open dashboard
3. Wait 8 minutes
4. Check browser DevTools Network tab
5. Verify: No 400 errors from Metabase
6. Verify: Dashboard still loads correctly

---

## Issue #3: Backend 500 Errors (HIGH)

### Symptoms
```
/api/forms/fallback-weekly-kpi/submissions?limit=10 → 500
/api/position-descriptions → 500
```

### Investigation Steps

**1. Access Backend Logs**

```bash
# If using PM2
pm2 logs api-server --lines 200 | grep -A 10 "500"

# If using Docker
docker logs <container-name> --tail 200 | grep -A 10 "500"

# If using systemd
journalctl -u api-server -n 200 | grep -A 10 "500"

# Direct log files
tail -200 /var/log/api-server/error.log
```

**2. Check Database Connection**

```bash
# Test if database is accessible
psql -h localhost -U dbuser -d dbname -c "SELECT 1;"
# OR for MySQL:
mysql -h localhost -u dbuser -p -e "SELECT 1;"
```

**3. Test Endpoints Manually**

```bash
# Test with full headers
curl -X GET \
  'https://intranet.roammigrationlaw.com/api/forms/fallback-weekly-kpi/submissions?limit=10' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -v

curl -X GET \
  'https://intranet.roammigrationlaw.com/api/position-descriptions' \
  -H 'Accept: application/json' \
  -v
```

**4. Common Causes Checklist**

- [ ] Database connection pool exhausted
- [ ] Missing environment variables (DB_PASSWORD, API_KEY, etc.)
- [ ] SQL syntax errors (especially SQL Server vs PostgreSQL differences)
- [ ] Table/column doesn't exist (schema mismatch)
- [ ] Permissions issue (DB user can't SELECT from table)
- [ ] Uncaught exception in route handler
- [ ] Missing dependency (npm package not installed)
- [ ] Memory leak / out of memory

**5. Enable Debug Logging**

Add to your backend startup:

```bash
# Node.js
DEBUG=* npm start

# Or set in code:
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: err.message });
});
```

### Once Fixed
1. Restart backend service
2. Test endpoints return 200 OK
3. Verify frontend can submit forms

---

## Issue #4: Frontend Crashes (MEDIUM)

### Symptoms
```
TypeError: Cannot read properties of undefined (reading 'cols')
TypeError: Cannot read properties of undefined (reading 'column')
```

### Why This Happens
**Cascading failure from Issues #1-3:**
1. API call fails (mixed content/expired token/500 error)
2. Response is `undefined` or `null`
3. Frontend tries `data.cols.map(...)` → crash

### Solution: Defensive Coding

**Add null checks:**

```typescript
// BEFORE (crashes):
const columns = data.cols.map(col => col.name);
const tooltipColumn = settings.graph.tooltip_columns.column;

// AFTER (safe):
const columns = data?.cols?.map(col => col.name) ?? [];
const tooltipColumn = settings?.graph?.tooltip_columns?.column ?? null;
```

**Add React Error Boundary:**

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Unable to load dashboard</h2>
          <p>Please refresh the page or contact support if the issue persists.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap your dashboard:
<ErrorBoundary>
  <SPQRDashboard />
</ErrorBoundary>
```

### Testing
1. Deploy with error boundaries
2. Simulate failure (disconnect network, wait for token expiry)
3. Verify: Error message shown instead of blank screen
4. Verify: Clicking "Refresh" recovers

---

## Browser Extension Errors (IGNORE)

These errors are from **browser extensions**, not your application:

```
content.js:18 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'useCache')
polyfill.js:496 Uncaught (in promise) Error: Could not establish connection
```

**These are safe to ignore.** They don't affect your dashboard functionality.

Common causes:
- Ad blockers
- Password managers (LastPass, 1Password)
- Developer tools extensions
- VPN extensions

---

## Verification Checklist

After applying fixes:

### ✅ Mixed Content Fixed
- [ ] Open browser DevTools Console
- [ ] Refresh SPQR page
- [ ] Verify: No "Mixed Content" warnings
- [ ] Verify: API calls show in Network tab with 200 status

### ✅ JWT Tokens Working
- [ ] Open SPQR dashboard
- [ ] Wait 15 minutes
- [ ] Verify: Dashboard still loads data
- [ ] Check Network tab: No 400 errors from Metabase

### ✅ Backend APIs Healthy
- [ ] Test: `curl https://intranet.roammigrationlaw.com/api/forms/fallback-weekly-kpi/submissions?limit=10`
- [ ] Verify: Returns 200 OK with JSON data
- [ ] Test: `curl https://intranet.roammigrationlaw.com/api/position-descriptions`
- [ ] Verify: Returns 200 OK with JSON data

### ✅ Frontend Resilient
- [ ] Open dashboard
- [ ] Disconnect network
- [ ] Verify: Error message shown (not blank screen)
- [ ] Reconnect network
- [ ] Click "Refresh" button
- [ ] Verify: Dashboard loads correctly

---

## Tools Created

### JWT Decoder (`/home/jtaylor/debug-jwt.js`)

**Usage:**
```bash
node debug-jwt.js <jwt-token>
```

**Example:**
```bash
node debug-jwt.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJkYXNoYm9hcmQiOjUyOX0sInBhcmFtcyI6eyJtYXR0ZXJfdHlwZSI6W10sImN1cnJlbnRfc3RhZ2UiOltdLCJjYXNlX21hbmFnZXIiOltdLCJzdXBlcnZpc29yIjpbXX0sImV4cCI6MTc3MTMwNjA2MSwiaWF0IjoxNzcxMzA1NDYxfQ.N2gCksR8cDKNE1qJUb2u6Ki83dFzThAn39ODT_MDAgw
```

**Output:**
```
=== JWT Header ===
{ "alg": "HS256", "typ": "JWT" }

=== JWT Payload ===
{ "resource": { "dashboard": 529 }, ... }

=== Expiration Check ===
Expires: 2026-02-17T05:27:41.000Z
Now:     2026-02-17T05:28:48.634Z
Status:  ❌ EXPIRED
```

**When to use:**
- Debugging Metabase embed 400 errors
- Verifying token expiration times
- Checking dashboard IDs and parameters

---

## Need Frontend Source Code?

The errors indicate your frontend is a React app, but I don't see it in `/home/jtaylor/everything-claude-code`.

**Where is the frontend code located?**
- Different repository?
- On a remote server?
- In a subdirectory I haven't found?

Please provide the path so I can help fix the API URL configuration and add error boundaries.

---

## Questions?

**Q: Should I fix these in a specific order?**
A: Yes, priority order:
1. Mixed Content (blocks everything else)
2. Backend 500s (prevents forms from working)
3. JWT expiration (prevents dashboard from staying loaded)
4. Frontend error handling (improves UX)

**Q: Can I just increase token lifespan to 24 hours?**
A: Yes, that's fine for MVP. Auto-refresh is better for production but not required immediately.

**Q: Why are browser extension errors showing?**
A: They're from installed extensions trying to modify the page. Safe to ignore.

**Q: Will fixing Mixed Content fix the 'cols' errors too?**
A: Yes! The 'cols' errors are cascading failures. Once data loads correctly, they'll disappear.

---

**Last Updated:** 2026-02-17
**Status:** Analysis Complete, 4 Tasks Created
**Next Step:** Fix Mixed Content Error (Task #1)
