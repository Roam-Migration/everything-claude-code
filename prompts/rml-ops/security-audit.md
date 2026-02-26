# Pre-Deployment Security Audit

You are performing a security audit before deploying to production.

## Automated Checks

Run these commands before deployment:

### 1. Dependency Vulnerabilities
```bash
# Check for known vulnerabilities
npm audit

# Auto-fix where possible
npm audit fix
```

**Action if HIGH/CRITICAL found:**
- Review vulnerability details
- Update affected packages
- If no fix available, assess risk and document

### 2. Hardcoded Secrets
```bash
# Search for potential secrets in code
grep -r "API_KEY\|api_key\|apiKey\|SECRET\|password\|token" src/

# Check for .env files in git
git ls-files | grep "\.env"
```

**Action if found:**
- Move to environment variables
- Add to `.env.example` (without actual values)
- Ensure `.env` in `.gitignore`

### 3. Docker Security
```bash
# Check Dockerfile best practices
docker run --rm -i hadolint/hadolint < Dockerfile
```

**Common issues:**
- Running as root (should use `USER node`)
- Unnecessary packages in final image
- Missing `--no-cache` in `apk add`

## Manual Security Review

### 1. Authentication

**Check:**
- [ ] IAPAuthProvider wraps entire app
- [ ] All routes wrapped in SecureRoute
- [ ] No bypass routes (public endpoints should be intentional)
- [ ] Auth state persisted correctly

**Example:**
```tsx
// CORRECT
<IAPAuthProvider>
  <SecureRoute>
    <App />
  </SecureRoute>
</IAPAuthProvider>

// WRONG - exposes routes before auth check
<App>
    {/* Some routes might not check auth */}
</App>
```

### 2. API Calls

**Check:**
- [ ] Using apiClient utility (includes credentials)
- [ ] No API keys in client-side code
- [ ] CORS configured correctly (if applicable)
- [ ] Input validation on all API requests

**Example:**
```tsx
// CORRECT
import { apiClient } from '@roam-migration/components';
const data = await apiClient.get('/api/users');

// WRONG - missing credentials
const data = await fetch('/api/users').then(r => r.json());
```

### 3. Environment Variables

**Check:**
- [ ] `.env` in `.gitignore`
- [ ] `.env.example` committed (without secrets)
- [ ] Secrets loaded via Cloud Run environment config
- [ ] No fallback to hardcoded values

**Set in Cloud Run:**
```bash
gcloud run services update [service-name] \
  --region=us-central1 \
  --set-env-vars="API_KEY=secret-value,NODE_ENV=production"
```

### 4. nginx Configuration (for SPAs)

**Check nginx.conf:**
- [ ] Port 8080 (Cloud Run requirement)
- [ ] Security headers present:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
- [ ] No server_tokens directive (hides nginx version)
- [ ] gzip enabled for text assets

**Example:**
```nginx
server {
  listen 8080;

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Hide nginx version
  server_tokens off;
}
```

### 5. Client-Side Security

**Check:**
- [ ] No sensitive data in localStorage/sessionStorage
- [ ] No console.log statements with secrets
- [ ] XSS protection for user-generated content
- [ ] CSP headers if applicable

**XSS protection example:**
```tsx
// CORRECT - React escapes by default
<p>{userInput}</p>

// WRONG - dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 6. Dockerfile Security

**Check:**
- [ ] Multi-stage build (smaller final image)
- [ ] `.dockerignore` excludes sensitive files
- [ ] No secrets in ENV variables
- [ ] Minimal base image (alpine preferred)

**Example .dockerignore:**
```
node_modules
.git
.env
.env.local
*.log
.vscode
README.md
```

## IAP-Specific Checks

### 1. Verify Domain Restriction
```bash
# Check IAP policy
gcloud iap web get-iam-policy \
  --resource-type=backend-services \
  --service=[service-name] \
  --project=rmlintranet
```

**Must include:**
```yaml
members:
  - domain:roammigrationlaw.com
role: roles/iap.httpsResourceAccessor
```

**Must NOT include:**
- `allUsers`
- `allAuthenticatedUsers`
- External domains

### 2. Test External Access
```bash
# Should fail with 403 or redirect
curl https://[your-domain].roammigrationlaw.com
```

**Expected:** 302 redirect to Google login OR 403 Forbidden

**Not expected:** 200 OK with content

### 3. Verify OAuth Consent Screen

**Check:**
- [ ] User Type: **Internal** (not External)
- [ ] Authorized domains: roammigrationlaw.com

## Pre-Deployment Checklist

Before running `./deploy.sh`:

**Code Security:**
- [ ] No hardcoded secrets
- [ ] Dependencies up to date (`npm audit` clean)
- [ ] Environment variables configured
- [ ] No console.log with sensitive data

**Container Security:**
- [ ] Dockerfile passes hadolint
- [ ] .dockerignore includes .env
- [ ] Port 8080 exposed
- [ ] Running as non-root user (where possible)

**Authentication:**
- [ ] IAPAuthProvider configured
- [ ] All routes protected with SecureRoute
- [ ] IAP enabled in GCP console
- [ ] Domain restriction: @roammigrationlaw.com only

**Network Security:**
- [ ] HTTPS enforced (automatic via Cloud Run)
- [ ] Security headers in nginx.conf
- [ ] No exposed admin endpoints
- [ ] CORS configured correctly

**Access Control:**
- [ ] Service account permissions minimal
- [ ] Only required APIs enabled
- [ ] No overly permissive IAM roles

## Post-Deployment Verification

After deployment:

### 1. Test Authentication Flow
```bash
# Test with authorized email
# (Do this in browser, not curl)
```

**Steps:**
1. Open in incognito: https://[domain].roammigrationlaw.com
2. Should redirect to Google login
3. Login with @roammigrationlaw.com account
4. Should access app successfully

### 2. Test Unauthorized Access
```bash
# Try external email (should fail)
```

**Expected:** Access denied message

### 3. Check Logs for Errors
```bash
gcloud run services logs read [service-name] \
  --region=us-central1 \
  --limit=100
```

**Look for:**
- Authentication errors
- 500 errors
- Missing environment variables
- Unexpected access patterns

## Security Incident Response

If vulnerability found in production:

1. **Assess severity** (Low/Medium/High/Critical)
2. **For High/Critical:**
   - Rollback immediately: `./scripts/rollback.sh`
   - Fix in development
   - Redeploy after verification
3. **For Medium/Low:**
   - Create fix
   - Test thoroughly
   - Deploy in next release

**Document incident:**
- What was the vulnerability?
- How was it discovered?
- What was the impact?
- How was it fixed?
- How to prevent in future?
