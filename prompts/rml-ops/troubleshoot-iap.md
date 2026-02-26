# Troubleshoot Identity-Aware Proxy (IAP) Issues

You are debugging IAP authentication problems for an RML application.

## Common Symptoms

1. **403 Forbidden** - User cannot access despite @roammigrationlaw.com email
2. **Redirect loop** - Keeps redirecting to login
3. **No login prompt** - Goes straight to app (unauthenticated)
4. **External users can access** - IAP not enforcing domain restriction

## Diagnostic Steps

### 1. Verify IAP is Enabled
```bash
# Check IAP status for service
gcloud iap web get-iam-policy \
  --resource-type=backend-services \
  --service=[service-name] \
  --project=rmlintranet
```

**Expected output:** Should list domain:roammigrationlaw.com with role `roles/iap.httpsResourceAccessor`

**If empty:** IAP not configured. Run `setup-iap.sh`

### 2. Check OAuth Consent Screen

**Go to:** https://console.cloud.google.com/apis/credentials/consent?project=rmlintranet

**Verify:**
- User Type: **Internal** (not External)
- App Name: Set
- Support Email: Set
- Authorized domains: roammigrationlaw.com

**If "External":** This is the issue. Change to "Internal" to restrict to Workspace.

### 3. Check OAuth Client ID

**Go to:** https://console.cloud.google.com/apis/credentials?project=rmlintranet

**Verify:**
- OAuth 2.0 Client ID exists
- Application Type: **Web application**
- Authorized redirect URIs includes IAP callback

**If missing:** Create new OAuth client:
```
Application Type: Web application
Name: IAP-[service-name]
```

### 4. Check IAP Configuration

**Go to:** https://console.cloud.google.com/security/iap?project=rmlintranet

**Verify:**
- Your Cloud Run service is listed
- IAP toggle is **ON** (blue)
- OAuth client is selected

**If toggle OFF:** Enable IAP, select OAuth client

### 5. Check Access Policy

**In IAP console, click on your service:**

**Verify members include:**
- `domain:roammigrationlaw.com` with role **IAP-secured Web App User**

**If domain not listed:**
```bash
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services \
  --service=[service-name] \
  --member=domain:roammigrationlaw.com \
  --role=roles/iap.httpsResourceAccessor \
  --project=rmlintranet
```

### 6. Test Authentication

**Test with authorized user:**
```bash
# Get identity token for your @roammigrationlaw.com account
gcloud auth login
TOKEN=$(gcloud auth print-identity-token)

# Test service access
curl -H "Authorization: Bearer $TOKEN" https://[your-domain].roammigrationlaw.com/health
```

**Expected:** 200 OK with "healthy" response

**If 403:** IAP policy not correctly configured

**Test with unauthenticated request:**
```bash
curl https://[your-domain].roammigrationlaw.com/health
```

**Expected:** 302 redirect to Google login

**If 200:** IAP not enabled

## Issue-Specific Fixes

### Issue: 403 Forbidden for @roammigrationlaw.com Users

**Cause:** User not in IAP access list

**Fix:**
```bash
# Add specific user
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services \
  --service=[service-name] \
  --member=user:[email]@roammigrationlaw.com \
  --role=roles/iap.httpsResourceAccessor \
  --project=rmlintranet
```

**Or add entire domain:**
```bash
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services \
  --service=[service-name] \
  --member=domain:roammigrationlaw.com \
  --role=roles/iap.httpsResourceAccessor \
  --project=rmlintranet
```

### Issue: Redirect Loop

**Cause:** OAuth client misconfigured or cookies stale

**Fix:**
1. Clear browser cookies for domain
2. Try incognito mode
3. Verify OAuth redirect URIs:
```
   https://iap.googleapis.com/v1/oauth/clientIds/[CLIENT_ID]:handleRedirect
```

### Issue: No Login Prompt

**Cause:** IAP not enabled on service

**Fix:**
1. Go to IAP console
2. Find service
3. Toggle IAP ON
4. Select OAuth client
5. Add access members

### Issue: External Users Can Access

**Cause:** OAuth consent screen is "External" type

**Fix:**
1. Go to OAuth consent screen settings
2. Change User Type to **Internal**
3. Save
4. Test with external email (should now be denied)

## Verification Checklist

After fixes, verify:
- [ ] @roammigrationlaw.com users can access
- [ ] External users get 403 or redirect to login error
- [ ] No redirect loops
- [ ] Login prompt appears for unauthenticated users
- [ ] No console errors in browser
- [ ] Custom domain works (not just *.run.app)

## Still Not Working?

**Check Cloud Run service settings:**
```bash
gcloud run services describe [service-name] \
  --region=us-central1 \
  --project=rmlintranet \
  --format=json | grep ingress
```

**Expected:** `"ingress": "INGRESS_TRAFFIC_ALL"` or `"INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"`

**If different:** Update ingress:
```bash
gcloud run services update [service-name] \
  --region=us-central1 \
  --project=rmlintranet \
  --ingress=all
```

**Check for conflicting authentication:**
- Ensure Cloud Run service has `--allow-unauthenticated` flag
- IAP handles authentication, not Cloud Run's built-in auth

**Review logs for errors:**
```bash
gcloud run services logs read [service-name] \
  --region=us-central1 \
  --project=rmlintranet \
  --limit=100
```

Look for:
- 401/403 errors
- IAP-related headers
- OAuth errors
