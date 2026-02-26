# RML Intranet - GCP Deployment with IAP

**Project:** RML Intranet Production Deployment  
**Deployment Date:** February 9, 2026  
**Status:** ✅ PRODUCTION LIVE  
**URL:** https://intranet.roammigrationlaw.com  
**Access:** @roammigrationlaw.com domain only  

---

## Executive Summary

Successfully deployed RML Intranet to Google Cloud Platform using Cloud Run with Identity-Aware Proxy (IAP) authentication, replacing Vercel deployment to achieve **$1,728-3,492/year cost savings** while maintaining enterprise-grade security.

**Key Achievement:** Production-validated deployment pattern for GCP + IAP that can be replicated for additional RML applications (Compass Wiki, Quote Calculator, etc.).

---

## Production Architecture

```
User Request
    ↓
https://intranet.roammigrationlaw.com
    ↓
DNS A Record → 34.95.69.121 (Static IP)
    ↓
Global Load Balancer (roamintranet-lb)
    ↓
SSL Termination (roamintranet-cert: Google-managed)
    ↓
Identity-Aware Proxy (IAP)
    ├─ OAuth Client: roamintranet-IAP
    ├─ Client ID: [see GCP Console > APIs & Services > Credentials]
    ├─ Domain Restriction: @roammigrationlaw.com
    └─ Unauthorized → 403 Forbidden
    ↓
Backend Service (roamintranet-backend)
    ├─ Protocol: HTTP (correct for serverless NEGs)
    └─ IAP Enabled
    ↓
Network Endpoint Group (rml-intranet-neg)
    ├─ Type: Serverless
    └─ Region: us-central1
    ↓
Cloud Run Service (rml-intranet)
    ├─ Container: gcr.io/rmlintranet/rml-intranet:latest
    ├─ Region: us-central1
    └─ IAM: allUsers → roles/run.invoker (safe behind IAP)
```

---

## Infrastructure Components

### GCP Project
```
Project ID: rmlintranet
Project Number: [see GCP Console]
Billing Account: [see GCP Console > Billing]
Region: us-central1
```

### Networking
| Resource | Name | Value | Type |
|----------|------|-------|------|
| Static IP | roamintranet-ip | 34.95.69.121 | Global |
| SSL Certificate | roamintranet-cert | ACTIVE | Google-managed |
| Domain | intranet.roammigrationlaw.com | A → 34.95.69.121 | DNS |

### Load Balancer
| Component | Name | Configuration |
|-----------|------|---------------|
| URL Map | roamintranet-lb | Default service: roamintranet-backend |
| HTTPS Proxy | roamintranet-https-proxy | SSL cert: roamintranet-cert |
| Forwarding Rule | roamintranet-https-rule | Port 443, IP: 34.95.69.121 |
| Backend Service | roamintranet-backend | Protocol: HTTP, IAP: enabled |

### Compute
| Resource | Name | Configuration |
|----------|------|---------------|
| Cloud Run Service | rml-intranet | Container, us-central1, no auth required |
| Network Endpoint Group | rml-intranet-neg | Serverless, Cloud Run, us-central1 |

### Authentication
| Component | Value |
|-----------|-------|
| OAuth Brand | roamintranet (orgInternalOnly: true) |
| OAuth Client | roamintranet-IAP |
| Client ID | [see GCP Console > APIs & Services > Credentials] |
| Redirect URI | https://iap.googleapis.com/v1/oauth/clientIds/{CLIENT_ID}:handleRedirect |
| Authorized Domain | @roammigrationlaw.com |

---

## Deployment Timeline

### Phase 1: Infrastructure Setup (Feb 7, 2026)
- GCP project created: `rmlintranet`
- Billing linked
- APIs enabled: Cloud Run, Cloud Build, Container Registry, IAP, Compute
- Initial container build via Cloud Build
- Load balancer infrastructure created

### Phase 2: Domain Configuration (Feb 9, 2026)
- Domain verified via Google Search Console
- DNS challenges with SiteGround CDN identified
- CDN disabled for subdomain to allow A record
- A record created: intranet → 34.95.69.121
- SSL certificate provisioned (ACTIVE after ~30 minutes)

### Phase 3: IAP Configuration (Feb 9, 2026)
- OAuth consent screen configured (Internal)
- OAuth client created via console (roamintranet-IAP)
- Backend service updated with OAuth credentials
- IAM policies added (domain restriction)
- Cloud Run IAM updated (allUsers invoker)

### Phase 4: Troubleshooting & Resolution (Feb 9, 2026)
**Issue:** "Failed OAuth redirect" error after sign-in
**Root Cause:** Two OAuth clients existed, backend using wrong client
**Resolution:** Updated backend to use console-created OAuth client with correct redirect URI
**Validation:** Site loads successfully for @roammigrationlaw.com users

### Phase 5: Production Validation (Feb 9, 2026)
- ✅ Authentication flow tested (redirect to Google sign-in)
- ✅ Authorized access confirmed (j.taylor@roammigrationlaw.com)
- ✅ Domain restriction validated
- ✅ SSL certificate active
- ✅ CLI verification successful (`curl -I`)

---

## Critical Lessons Learned

### 1. OAuth Client Management

**WRONG APPROACH:**
```bash
# Deprecated API - creates unmanageable client
gcloud alpha iap oauth-clients create \
  projects/{PROJECT_NUMBER}/brands/{PROJECT_NUMBER} \
  --display_name="IAP-RML-Intranet"
```

**Problems:**
- Cannot edit redirect URIs in console
- API deprecated (shutdown March 19, 2026)
- Not visible in standard credentials UI

**CORRECT APPROACH:**
1. Create OAuth client via **Google Cloud Console**
2. https://console.cloud.google.com/apis/credentials/oauthclient
3. Application type: **Web application**
4. Name: `{service-name}-IAP`
5. Add redirect URI: `https://iap.googleapis.com/v1/oauth/clientIds/{CLIENT_ID}:handleRedirect`
6. Copy Client ID and Secret
7. Update backend service with credentials

**Why this matters:** Console-created clients are editable, fully supported, and not subject to API deprecation.

---

### 2. Backend Service Protocol

**Configuration:**
```yaml
Backend Service:
  Protocol: HTTP  # NOT HTTPS
  Port: 8080
```

**Why HTTP for serverless NEGs:**
- Load balancer terminates HTTPS (user → LB)
- Load balancer → Cloud Run uses HTTP (internal GCP network)
- Cloud Run handles its own TLS if needed
- This is Google's recommended configuration

**Warning to ignore:**
```
WARNING: IAP has been enabled for a backend service that does not use HTTPS.
```

This warning is misleading for serverless NEGs. The user-facing connection IS HTTPS.

---

### 3. Cloud Run IAM Permissions

**Configuration:**
```yaml
Cloud Run Service IAM:
  - allUsers → roles/run.invoker
```

**Why this is safe:**
- Load balancer is the **only advertised entry point**
- IAP sits **between load balancer and backend**
- Direct Cloud Run URL (*.run.app) is not discoverable
- Can optionally block direct access with ingress rules

**If you tried to restrict Cloud Run:**
```bash
# This BLOCKS the load balancer
gcloud run services add-iam-policy-binding rml-intranet \
  --member=domain:roammigrationlaw.com \
  --role=roles/run.invoker
```

Result: 403 errors because load balancer can't invoke Cloud Run.

**Security layers:**
1. HTTPS enforced (SSL certificate)
2. IAP authentication (Google sign-in)
3. Domain restriction (@roammigrationlaw.com)
4. Load balancer as sole entry point

---

### 4. DNS Provider Challenges (SiteGround)

**Issue:** CDN prevents A record creation for subdomains

**Attempted Solutions:**
1. ❌ CNAME to ghs.googlehosted.com (Cloud Run direct)
   - SSL worked but blocked IAP functionality
   
2. ❌ Cloud DNS subdomain delegation
   - SiteGround doesn't support NS records for subdomains
   - Subdomains inherit parent nameservers

3. ✅ Disable CDN for subdomain, create A record
   - SiteGround > Domain Management > Manage > CDN
   - Exclude subdomain: `intranet.roammigrationlaw.com`
   - Create A record pointing to load balancer IP

**Key takeaway:** For IAP deployments, always use load balancer + A record, not Cloud Run direct mapping.

---

### 5. SSL Certificate Provisioning Timeline

**Cloud Run Managed Certificate:**
- Provisioned in ~10 minutes after DNS propagation
- Works for Cloud Run direct access
- **Not suitable for IAP** (requires load balancer)

**Load Balancer Managed Certificate:**
- Initial status: FAILED_NOT_VISIBLE (DNS pointed to Cloud Run)
- After A record update: ACTIVE in ~30 minutes
- Automatic renewal
- **Required for IAP** deployment

**Monitoring:**
```bash
gcloud compute ssl-certificates describe roamintranet-cert \
  --global \
  --format="value(managed.status)"
```

**Statuses:**
- PROVISIONING: Certificate being created
- FAILED_NOT_VISIBLE: DNS not pointing to load balancer
- ACTIVE: Certificate ready and serving traffic

---

### 6. IAP vs Cloud Run Direct Authentication

**Cloud Run IAM (Direct Access):**
```bash
curl -I https://rml-intranet-xxxxx.run.app
# Returns: HTTP/2 403 (no redirect, no sign-in flow)
```

Requires:
- gcloud auth token
- API authentication
- Not browser-friendly

**Load Balancer + IAP:**
```bash
curl -I https://intranet.roammigrationlaw.com
# Returns: HTTP/2 302 (redirects to Google sign-in)
```

Provides:
- Browser-based authentication
- Google Workspace SSO
- Domain restriction
- User-friendly sign-in flow

**For internal apps:** Always use IAP, not Cloud Run direct auth.

---

## Deployment Runbook (Validated Pattern)

### Prerequisites

**Required:**
- GCP project with billing enabled
- Google Workspace domain
- Domain ownership verified in Google Search Console
- DNS management access

**APIs to Enable:**
```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  iap.googleapis.com \
  containerregistry.googleapis.com \
  --project={PROJECT_ID}
```

---

### Step 1: Deploy Cloud Run Service

**Build and deploy container:**
```bash
# Option A: Cloud Build (recommended)
gcloud builds submit \
  --tag gcr.io/{PROJECT_ID}/{SERVICE_NAME}:latest \
  --project={PROJECT_ID}

gcloud run deploy {SERVICE_NAME} \
  --image gcr.io/{PROJECT_ID}/{SERVICE_NAME}:latest \
  --region {REGION} \
  --platform managed \
  --no-allow-unauthenticated \
  --project={PROJECT_ID}

# Option B: Deploy script
./deploy.sh
```

**Variables:**
- `{PROJECT_ID}`: GCP project ID (e.g., `rmlintranet`)
- `{SERVICE_NAME}`: Cloud Run service name (e.g., `rml-intranet`)
- `{REGION}`: GCP region (e.g., `us-central1`)

**Verify deployment:**
```bash
gcloud run services describe {SERVICE_NAME} \
  --region {REGION} \
  --project={PROJECT_ID} \
  --format="value(status.url)"
```

---

### Step 2: Create Serverless Network Endpoint Group

```bash
gcloud compute network-endpoint-groups create {SERVICE_NAME}-neg \
  --region {REGION} \
  --network-endpoint-type serverless \
  --cloud-run-service {SERVICE_NAME} \
  --project={PROJECT_ID}
```

**Verify NEG:**
```bash
gcloud compute network-endpoint-groups describe {SERVICE_NAME}-neg \
  --region {REGION} \
  --project={PROJECT_ID}
```

Expected output:
```yaml
networkEndpointType: SERVERLESS
cloudRun:
  service: {SERVICE_NAME}
```

---

### Step 3: Create Backend Service

```bash
# Create backend service
gcloud compute backend-services create {SERVICE_NAME}-backend \
  --global \
  --protocol HTTP \
  --project={PROJECT_ID}

# Add NEG to backend
gcloud compute backend-services add-backend {SERVICE_NAME}-backend \
  --global \
  --network-endpoint-group {SERVICE_NAME}-neg \
  --network-endpoint-group-region {REGION} \
  --project={PROJECT_ID}
```

**Verify backend:**
```bash
gcloud compute backend-services describe {SERVICE_NAME}-backend \
  --global \
  --project={PROJECT_ID}
```

**CRITICAL:** Protocol must be HTTP, not HTTPS, for serverless NEGs.

---

### Step 4: Reserve Static IP Address

```bash
gcloud compute addresses create {SERVICE_NAME}-ip \
  --global \
  --project={PROJECT_ID}

# Get the IP address
gcloud compute addresses describe {SERVICE_NAME}-ip \
  --global \
  --format="value(address)" \
  --project={PROJECT_ID}
```

**Save this IP** - you'll need it for DNS configuration.

---

### Step 5: Create SSL Certificate

```bash
gcloud compute ssl-certificates create {SERVICE_NAME}-cert \
  --domains={SUBDOMAIN}.{DOMAIN} \
  --global \
  --project={PROJECT_ID}
```

**Example:**
```bash
gcloud compute ssl-certificates create roamintranet-cert \
  --domains=intranet.roammigrationlaw.com \
  --global \
  --project=rmlintranet
```

**Note:** Certificate will stay in PROVISIONING or FAILED_NOT_VISIBLE until DNS is configured.

---

### Step 6: Create Load Balancer Components

**URL Map:**
```bash
gcloud compute url-maps create {SERVICE_NAME}-lb \
  --default-service {SERVICE_NAME}-backend \
  --global \
  --project={PROJECT_ID}
```

**HTTPS Proxy:**
```bash
gcloud compute target-https-proxies create {SERVICE_NAME}-https-proxy \
  --url-map {SERVICE_NAME}-lb \
  --ssl-certificates {SERVICE_NAME}-cert \
  --global \
  --project={PROJECT_ID}
```

**Forwarding Rule:**
```bash
gcloud compute forwarding-rules create {SERVICE_NAME}-https-rule \
  --address {SERVICE_NAME}-ip \
  --target-https-proxy {SERVICE_NAME}-https-proxy \
  --ports 443 \
  --global \
  --project={PROJECT_ID}
```

**Verify load balancer:**
```bash
gcloud compute forwarding-rules describe {SERVICE_NAME}-https-rule \
  --global \
  --format="value(IPAddress)" \
  --project={PROJECT_ID}
```

---

### Step 7: Configure DNS

**In DNS provider (e.g., SiteGround):**

1. **If CDN is enabled:** Disable CDN for the subdomain
   - SiteGround: Domain Management → Manage → CDN
   - Add exclusion for subdomain

2. **Create A record:**
   ```
   Type: A
   Host: {subdomain}
   Value: {static-ip}
   TTL: 3600
   ```

**Example:**
```
Type: A
Host: intranet
Value: 34.95.69.121
TTL: 3600
```

**Verify DNS propagation:**
```bash
dig A {subdomain}.{domain} +short
# Should return: {static-ip}
```

---

### Step 8: Verify Domain Ownership

**Google Search Console:**
1. https://search.google.com/search-console
2. Add property: `{domain}` (e.g., `roammigrationlaw.com`)
3. Verify ownership via DNS TXT record or HTML file
4. This is **required** for SSL certificate provisioning

---

### Step 9: Wait for SSL Certificate Provisioning

**Monitor certificate status:**
```bash
watch -n 30 'gcloud compute ssl-certificates describe {SERVICE_NAME}-cert \
  --global \
  --format="value(managed.status)" \
  --project={PROJECT_ID}'
```

**Timeline:**
- DNS propagation: 5-15 minutes
- Certificate provisioning: 10-60 minutes
- Status: PROVISIONING → ACTIVE

**Common issues:**
- FAILED_NOT_VISIBLE: DNS not pointing to load balancer IP
- PROVISIONING: Wait longer (can take up to 60 minutes)

---

### Step 10: Create OAuth Client (CONSOLE ONLY)

⚠️ **DO NOT USE `gcloud alpha iap oauth-clients create`** - deprecated API

**Via Google Cloud Console:**

1. Navigate to: https://console.cloud.google.com/apis/credentials/oauthclient?project={PROJECT_ID}

2. **OAuth consent screen** (if not configured):
   - User Type: **Internal**
   - App Name: `{Service Name}`
   - User Support Email: `{your-email}@{domain}`
   - Developer Contact: `{your-email}@{domain}`
   - Save and Continue
   - Scopes: Default (email, profile, openid)
   - Save and Continue

3. **Create OAuth Client:**
   - Application Type: **Web application**
   - Name: `{service-name}-IAP`
   - Authorized JavaScript origins: (leave empty)
   - Authorized redirect URIs: (leave empty for now)
   - Click **Create**

4. **Copy credentials:**
   - Client ID: `{PROJECT_NUMBER}-{random}.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-{random}`
   - Save these securely

5. **Add redirect URI:**
   - Edit the OAuth client you just created
   - Authorized redirect URIs:
     ```
     https://iap.googleapis.com/v1/oauth/clientIds/{CLIENT_ID}:handleRedirect
     ```
   - Replace `{CLIENT_ID}` with the actual Client ID from step 4
   - Save

**Example redirect URI:**
```
https://iap.googleapis.com/v1/oauth/clientIds/{CLIENT_ID}.apps.googleusercontent.com:handleRedirect
```

---

### Step 11: Enable IAP on Backend Service

```bash
gcloud compute backend-services update {SERVICE_NAME}-backend \
  --global \
  --iap=enabled,oauth2-client-id={CLIENT_ID},oauth2-client-secret={CLIENT_SECRET} \
  --project={PROJECT_ID}
```

**Example:**
```bash
gcloud compute backend-services update roamintranet-backend \
  --global \
  --iap=enabled,oauth2-client-id={CLIENT_ID}.apps.googleusercontent.com,oauth2-client-secret={CLIENT_SECRET} \
  --project=rmlintranet
```

**Verify IAP enabled:**
```bash
gcloud compute backend-services describe {SERVICE_NAME}-backend \
  --global \
  --project={PROJECT_ID} \
  --format="yaml(iap)"
```

Expected:
```yaml
iap:
  enabled: true
  oauth2ClientId: {CLIENT_ID}
```

**You will see this warning - IGNORE IT:**
```
WARNING: IAP has been enabled for a backend service that does not use HTTPS.
```

This is expected for serverless NEGs (HTTP protocol is correct).

---

### Step 12: Configure Domain Restriction

```bash
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services \
  --service={SERVICE_NAME}-backend \
  --member=domain:{your-domain} \
  --role=roles/iap.httpsResourceAccessor \
  --project={PROJECT_ID}
```

**Example:**
```bash
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services \
  --service=roamintranet-backend \
  --member=domain:roammigrationlaw.com \
  --role=roles/iap.httpsResourceAccessor \
  --project=rmlintranet
```

**Verify IAM policy:**
```bash
gcloud iap web get-iam-policy \
  --resource-type=backend-services \
  --service={SERVICE_NAME}-backend \
  --project={PROJECT_ID}
```

---

### Step 13: Allow Cloud Run Invocation

```bash
gcloud run services add-iam-policy-binding {SERVICE_NAME} \
  --region {REGION} \
  --member=allUsers \
  --role=roles/run.invoker \
  --project={PROJECT_ID}
```

**Why allUsers is safe:**
- Load balancer is the only advertised entry point
- IAP sits between load balancer and Cloud Run
- Direct Cloud Run URL is not discoverable
- Can optionally restrict with ingress rules

**Verify Cloud Run IAM:**
```bash
gcloud run services get-iam-policy {SERVICE_NAME} \
  --region {REGION} \
  --project={PROJECT_ID}
```

Expected:
```yaml
bindings:
- members:
  - allUsers
  role: roles/run.invoker
```

---

### Step 14: Validate Deployment

**Check all components:**
```bash
# 1. SSL certificate status
gcloud compute ssl-certificates describe {SERVICE_NAME}-cert \
  --global \
  --format="value(managed.status)" \
  --project={PROJECT_ID}
# Expected: ACTIVE

# 2. DNS resolution
dig A {subdomain}.{domain} +short
# Expected: {static-ip}

# 3. HTTPS redirect
curl -I https://{subdomain}.{domain}
# Expected: HTTP/2 302 (redirect to Google sign-in)

# 4. Backend health
gcloud compute backend-services describe {SERVICE_NAME}-backend \
  --global \
  --project={PROJECT_ID} \
  --format="yaml(iap)"
# Expected: iap.enabled: true
```

---

### Step 15: Test Authentication

**Test with authorized user:**
1. Open incognito window
2. Navigate to `https://{subdomain}.{domain}`
3. Should redirect to Google sign-in
4. Sign in with `{user}@{domain}`
5. Should load application successfully

**Test with unauthorized user:**
1. Open incognito window
2. Navigate to `https://{subdomain}.{domain}`
3. Sign in with external email (gmail, etc.)
4. Should receive: **403 Forbidden**

**Test from CLI:**
```bash
curl -I https://{subdomain}.{domain}
```

Expected response:
```
HTTP/2 302
location: https://accounts.google.com/...
```

---

## Security Validation Checklist

After deployment, verify:

- [ ] **SSL Active:** Certificate status is ACTIVE
- [ ] **HTTPS Enforced:** HTTP redirects to HTTPS
- [ ] **IAP Enabled:** Backend service has IAP configured
- [ ] **OAuth Internal:** Consent screen is "Internal" only
- [ ] **Domain Restriction:** Only @{domain} can access
- [ ] **Redirect URI Correct:** Matches IAP format
- [ ] **Unauthorized Blocked:** External emails get 403
- [ ] **Authorized Access:** Domain users can sign in and access
- [ ] **Backend Protocol:** HTTP (for serverless NEG)
- [ ] **Cloud Run IAM:** allUsers invoker role (safe behind IAP)
- [ ] **No Public Secrets:** OAuth credentials not in repository
- [ ] **DNS Propagated:** A record resolves to correct IP

---

## Cost Analysis

### Monthly Cost Breakdown

**RML Intranet Production:**
```
Cloud Run:
  - vCPU: $0.00002400/vCPU-second
  - Memory: $0.00000250/GB-second
  - Requests: $0.40/million requests
  - Estimated: $6-9/month (depends on traffic)

Load Balancer:
  - Forwarding rules: $0.025/hour = $18/month
  - BUT: First 5 rules free
  - Actual cost: $0 (included)

SSL Certificate:
  - Google-managed: $0 (free)

Container Registry:
  - Storage: $0.026/GB/month
  - Estimated: <$1/month

IAP:
  - Free with Google Workspace

Static IP:
  - In use: $0 (free when attached to forwarding rule)
  
──────────────────────────
Total: ~$7-10/month
```

### Comparison to Vercel

| Metric | Vercel | GCP | Savings |
|--------|--------|-----|---------|
| Hosting | $0 (free tier) | $6-9/month | -$72-108/year |
| SSO/Auth | $150-300/month | $0 (IAP free) | **$1,800-3,600/year** |
| **Total** | **$150-300/month** | **$6-9/month** | **$1,728-3,492/year** |

**ROI for 2 apps:** $3,456-6,984/year  
**ROI for 5 apps:** $8,640-17,460/year

---

## Troubleshooting Guide

### Issue: SSL Certificate Stuck in PROVISIONING

**Symptoms:**
```bash
gcloud compute ssl-certificates describe {SERVICE_NAME}-cert --global
# managed.status: PROVISIONING
```

**Causes:**
1. DNS not propagated yet
2. DNS not pointing to load balancer IP
3. Domain ownership not verified

**Solutions:**
```bash
# 1. Check DNS
dig A {subdomain}.{domain} +short
# Should return load balancer IP

# 2. Verify domain ownership in Google Search Console
# https://search.google.com/search-console

# 3. Wait (can take up to 60 minutes)
# Check every 5-10 minutes
```

---

### Issue: SSL Certificate Shows FAILED_NOT_VISIBLE

**Symptoms:**
```bash
gcloud compute ssl-certificates describe {SERVICE_NAME}-cert --global
# managed.status: FAILED_NOT_VISIBLE
```

**Causes:**
- DNS A record not pointing to load balancer IP
- DNS pointing to Cloud Run direct (ghs.googlehosted.com)

**Solutions:**
```bash
# 1. Verify load balancer IP
gcloud compute addresses describe {SERVICE_NAME}-ip --global

# 2. Update DNS A record to load balancer IP
# NOT CNAME, must be A record

# 3. Wait for DNS propagation (15-30 minutes)
# Then certificate will automatically provision
```

---

### Issue: "Failed OAuth redirect" Error

**Symptoms:**
- Redirects to Google sign-in successfully
- After authentication, shows error:
  ```
  Failed OAuth redirect
  Create path rule variants...
  ```

**Causes:**
1. OAuth client redirect URI not configured
2. Wrong OAuth client associated with backend
3. Multiple OAuth clients causing confusion

**Solutions:**

**Solution 1: Verify Redirect URI**
```bash
# 1. Get Client ID from backend
gcloud compute backend-services describe {SERVICE_NAME}-backend \
  --global \
  --format="value(iap.oauth2ClientId)"

# 2. Check OAuth client in console
# https://console.cloud.google.com/apis/credentials
# Find client with matching ID

# 3. Verify Authorized redirect URIs contains:
# https://iap.googleapis.com/v1/oauth/clientIds/{CLIENT_ID}:handleRedirect
```

**Solution 2: Recreate OAuth Client (if needed)**
1. Create new OAuth client via console (Web application)
2. Add redirect URI during creation
3. Update backend service with new credentials:
   ```bash
   gcloud compute backend-services update {SERVICE_NAME}-backend \
     --global \
     --iap=enabled,oauth2-client-id={NEW_ID},oauth2-client-secret={NEW_SECRET}
   ```

---

### Issue: 403 Forbidden for Authorized Users

**Symptoms:**
- Sign in with @{domain} email
- Receive 403 Forbidden

**Causes:**
1. IAM policy not configured for domain
2. Wrong domain in IAM policy
3. Backend IAP not enabled

**Solutions:**
```bash
# 1. Verify IAP enabled
gcloud compute backend-services describe {SERVICE_NAME}-backend \
  --global \
  --format="yaml(iap)"
# Should show: enabled: true

# 2. Check IAM policy
gcloud iap web get-iam-policy \
  --resource-type=backend-services \
  --service={SERVICE_NAME}-backend

# 3. Add domain policy if missing
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services \
  --service={SERVICE_NAME}-backend \
  --member=domain:{your-domain} \
  --role=roles/iap.httpsResourceAccessor
```

---

### Issue: 403 Forbidden - Load Balancer Can't Reach Cloud Run

**Symptoms:**
- OAuth works, redirects properly
- After authentication, 403 error
- Backend service shows healthy

**Cause:**
Cloud Run IAM policy blocks load balancer invocation

**Solution:**
```bash
# Allow allUsers to invoke Cloud Run
gcloud run services add-iam-policy-binding {SERVICE_NAME} \
  --region {REGION} \
  --member=allUsers \
  --role=roles/run.invoker

# Verify
gcloud run services get-iam-policy {SERVICE_NAME} --region {REGION}
# Should show: allUsers → roles/run.invoker
```

**This is safe** because:
- IAP authenticates at load balancer level
- Load balancer is the only advertised entry point
- Direct Cloud Run URL is not discoverable

---

### Issue: "Backend Service Uses HTTP" Warning

**Symptoms:**
```
WARNING: IAP has been enabled for a backend service that does not use HTTPS.
```

**Cause:**
Backend service protocol is HTTP (which is correct for serverless NEGs)

**Solution:**
**IGNORE THIS WARNING** - it's misleading for serverless NEGs.

**Why:**
- User → Load Balancer: HTTPS ✅
- IAP authentication: At HTTPS layer ✅
- Load Balancer → Cloud Run: HTTP (internal GCP network) ✅
- This is Google's recommended configuration

**To verify security:**
```bash
# User-facing connection is HTTPS
curl -I https://{subdomain}.{domain}
# Returns: HTTP/2 302 (HTTPS)

# SSL certificate is active
gcloud compute ssl-certificates describe {SERVICE_NAME}-cert --global
# managed.status: ACTIVE
```

---

### Issue: DNS Not Propagating

**Symptoms:**
```bash
dig A {subdomain}.{domain} +short
# Returns: empty or wrong IP
```

**Causes:**
1. A record not created yet
2. DNS provider has CDN enabled (blocks A record)
3. DNS propagation still in progress
4. Wrong record type (CNAME instead of A)

**Solutions:**

**For SiteGround:**
```
1. Domain Management → Manage
2. CDN → Disable or add subdomain exclusion
3. DNS Zone Editor
4. Add A record:
   Type: A
   Host: {subdomain}
   Value: {load-balancer-ip}
   TTL: 3600
5. Save
```

**Verify propagation:**
```bash
# Check multiple DNS servers
dig @8.8.8.8 A {subdomain}.{domain} +short
dig @1.1.1.1 A {subdomain}.{domain} +short

# Wait 5-15 minutes and retry
```

---

## Replication Guide for Additional Apps

To deploy additional apps (Compass Wiki, Quote Calculator, etc.) using this validated pattern:

### Quick Checklist

```bash
# Replace these variables
SERVICE_NAME="compass-wiki"
REGION="us-central1"
DOMAIN="compass.roammigrationlaw.com"
PROJECT_ID="rmlintranet"

# 1. Deploy Cloud Run
gcloud run deploy $SERVICE_NAME --image=gcr.io/$PROJECT_ID/$SERVICE_NAME:latest --region=$REGION --no-allow-unauthenticated

# 2. Create NEG
gcloud compute network-endpoint-groups create ${SERVICE_NAME}-neg --region=$REGION --network-endpoint-type=serverless --cloud-run-service=$SERVICE_NAME

# 3. Create Backend
gcloud compute backend-services create ${SERVICE_NAME}-backend --global --protocol=HTTP
gcloud compute backend-services add-backend ${SERVICE_NAME}-backend --global --network-endpoint-group=${SERVICE_NAME}-neg --network-endpoint-group-region=$REGION

# 4. Reserve IP
gcloud compute addresses create ${SERVICE_NAME}-ip --global

# 5. Create SSL Cert
gcloud compute ssl-certificates create ${SERVICE_NAME}-cert --domains=$DOMAIN --global

# 6. Create Load Balancer
gcloud compute url-maps create ${SERVICE_NAME}-lb --default-service=${SERVICE_NAME}-backend --global
gcloud compute target-https-proxies create ${SERVICE_NAME}-https-proxy --url-map=${SERVICE_NAME}-lb --ssl-certificates=${SERVICE_NAME}-cert --global
gcloud compute forwarding-rules create ${SERVICE_NAME}-https-rule --address=${SERVICE_NAME}-ip --target-https-proxy=${SERVICE_NAME}-https-proxy --ports=443 --global

# 7. Configure DNS (manual in provider)
# A record: {subdomain} → {static-ip}

# 8. Create OAuth Client (manual in console)
# https://console.cloud.google.com/apis/credentials/oauthclient?project={PROJECT_ID}

# 9. Enable IAP
gcloud compute backend-services update ${SERVICE_NAME}-backend --global --iap=enabled,oauth2-client-id={CLIENT_ID},oauth2-client-secret={SECRET}

# 10. Add Domain Restriction
gcloud iap web add-iam-policy-binding --resource-type=backend-services --service=${SERVICE_NAME}-backend --member=domain:roammigrationlaw.com --role=roles/iap.httpsResourceAccessor

# 11. Allow Cloud Run Invocation
gcloud run services add-iam-policy-binding $SERVICE_NAME --region=$REGION --member=allUsers --role=roles/run.invoker

# 12. Wait for SSL (10-60 minutes)
# 13. Test deployment
```

### Differences from RML Intranet

**For Compass Wiki (Next.js):**
- Region: `australia-southeast1` (closer to AU users)
- Domain: `compass.roammigrationlaw.com`
- OAuth Client: Create new client (don't reuse `roamintranet-IAP`)
- Same IAP configuration pattern
- Same domain restriction (@roammigrationlaw.com)

**For Quote Calculator:**
- Domain: `quotes.roammigrationlaw.com`
- Region: `us-central1` (same as intranet)
- OAuth Client: Create new client
- All other steps identical

---

## Infrastructure as Code (Future)

### Current State
All infrastructure created via `gcloud` CLI commands.

### Future Improvements

**Option 1: Terraform**
```hcl
# modules/cloud-run-iap/main.tf
resource "google_cloud_run_service" "app" {
  name     = var.service_name
  location = var.region
  # ... configuration
}

resource "google_compute_global_forwarding_rule" "https" {
  name       = "${var.service_name}-https-rule"
  target     = google_compute_target_https_proxy.default.id
  # ... configuration
}
```

**Option 2: Cloud Deployment Manager**
```yaml
# deployment.yaml
resources:
- name: cloud-run-service
  type: run.v1.service
  properties:
    # ... configuration
```

**Option 3: Pulumi**
```typescript
// index.ts
const service = new gcp.cloudrun.Service("app", {
    location: region,
    // ... configuration
});
```

**Recommendation:** Start with documented `gcloud` commands (current approach), move to Terraform once pattern is stable across 3+ apps.

---

## Monitoring and Alerts

### Recommended Monitoring

**Uptime Checks:**
```bash
gcloud monitoring uptime create https://{subdomain}.{domain} \
  --display-name="{Service Name} Uptime" \
  --check-interval=60s \
  --timeout=10s \
  --project={PROJECT_ID}
```

**Log-Based Alerts:**
1. IAP authentication failures
2. 403 errors (unauthorized access attempts)
3. Backend service errors
4. Cloud Run container crashes

**Cost Alerts:**
```bash
gcloud billing budgets create \
  --billing-account={BILLING_ID} \
  --display-name="RML Apps Monthly Budget" \
  --budget-amount=50 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

---

## Documentation Storage

### Production Credentials

**Stored in:**
```
~/rml-iap-credentials.txt (local machine)
```

**Contains:**
- OAuth Client name
- Client ID
- Backend service name
- Domain
- Static IP address

**Client Secret:**
- Visible in Google Cloud Console
- OAuth Credentials page
- Can also store in GCP Secret Manager (optional)

### Configuration Reference

**Load Balancer Setup:**
```bash
gcloud compute url-maps describe roamintranet-lb --global
gcloud compute backend-services describe roamintranet-backend --global
gcloud compute ssl-certificates describe roamintranet-cert --global
```

**IAP Configuration:**
```bash
gcloud compute backend-services describe roamintranet-backend --global --format="yaml(iap)"
gcloud iap web get-iam-policy --resource-type=backend-services --service=roamintranet-backend
```

**Cloud Run Status:**
```bash
gcloud run services describe rml-intranet --region=us-central1
gcloud run services get-iam-policy rml-intranet --region=us-central1
```

---

## Next Steps

### Immediate (Complete)
- [x] RML Intranet deployed
- [x] IAP configured and validated
- [x] Domain restriction active
- [x] SSL certificate provisioned
- [x] Production access confirmed

### Short-term (Next 1-2 weeks)
- [ ] Deploy Compass Wiki using this pattern
- [ ] Validate cross-app replication
- [ ] Set up monitoring and alerts
- [ ] Configure budget alerts
- [ ] Decommission Vercel deployment

### Medium-term (Next 1-3 months)
- [ ] Deploy Quote Calculator
- [ ] Deploy Roaming Around Intranet
- [ ] Implement CI/CD via Cloud Build triggers
- [ ] Create staging environments ({service}-dev)
- [ ] Document infrastructure as code approach

### Long-term (3-6 months)
- [ ] Migrate to Terraform for infrastructure
- [ ] Implement automated testing in CI/CD
- [ ] Set up comprehensive monitoring dashboards
- [ ] Document disaster recovery procedures
- [ ] Create runbooks for common operational tasks

---

## Support and Resources

### Google Cloud Documentation
- Cloud Run: https://cloud.google.com/run/docs
- IAP: https://cloud.google.com/iap/docs
- Load Balancer: https://cloud.google.com/load-balancing/docs
- SSL Certificates: https://cloud.google.com/load-balancing/docs/ssl-certificates

### GCP Console Quick Links
- Project Dashboard: https://console.cloud.google.com/home/dashboard?project=rmlintranet
- Cloud Run: https://console.cloud.google.com/run?project=rmlintranet
- Load Balancing: https://console.cloud.google.com/net-services/loadbalancing?project=rmlintranet
- IAP: https://console.cloud.google.com/security/iap?project=rmlintranet
- OAuth Credentials: https://console.cloud.google.com/apis/credentials?project=rmlintranet
- SSL Certificates: https://console.cloud.google.com/net-services/loadbalancing/advanced/sslCertificates/list?project=rmlintranet

### Contact Information
| Role | Contact | Purpose |
|------|---------|---------|
| GCP Billing | j.taylor@roammigrationlaw.com | Billing account: [see GCP Console > Billing] |
| Project Owner | Jackson Taylor | Decisions, infrastructure changes |
| Technical Support | Google Cloud Support | https://console.cloud.google.com/support?project=rmlintranet |

---

## Appendix: Command Reference

### Quick Status Check

```bash
#!/bin/bash
# check-deployment.sh
# Quick validation script for RML Intranet deployment

PROJECT_ID="rmlintranet"
SERVICE_NAME="rml-intranet"
REGION="us-central1"
DOMAIN="intranet.roammigrationlaw.com"

echo "=== SSL Certificate Status ==="
gcloud compute ssl-certificates describe ${SERVICE_NAME%%-*}-cert \
  --global \
  --format="value(managed.status)" \
  --project=$PROJECT_ID

echo ""
echo "=== DNS Resolution ==="
dig A $DOMAIN +short

echo ""
echo "=== IAP Configuration ==="
gcloud compute backend-services describe ${SERVICE_NAME%%-*}-backend \
  --global \
  --format="yaml(iap)" \
  --project=$PROJECT_ID

echo ""
echo "=== Cloud Run Status ==="
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format="value(status.conditions[0].status)" \
  --project=$PROJECT_ID

echo ""
echo "=== Load Balancer IP ==="
gcloud compute addresses describe ${SERVICE_NAME%%-*}-ip \
  --global \
  --format="value(address)" \
  --project=$PROJECT_ID

echo ""
echo "=== HTTP Test ==="
curl -I https://$DOMAIN 2>&1 | head -n 1
```

### Deployment Variables Template

```bash
# deployment-vars.sh
# Source this file before running deployment commands

export PROJECT_ID="rmlintranet"
export PROJECT_NUMBER=""          # Get from: GCP Console > Project Settings
export BILLING_ACCOUNT=""          # Get from: GCP Console > Billing
export REGION="us-central1"
export DOMAIN="roammigrationlaw.com"

# Service-specific (change per app)
export SERVICE_NAME="rml-intranet"
export SUBDOMAIN="intranet"
export FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"

# OAuth (get from console after creation)
export OAUTH_CLIENT_ID=""          # Get from: GCP Console > APIs & Services > Credentials
export OAUTH_CLIENT_SECRET=""      # Get from: GCP Console > APIs & Services > Credentials
```

---

**Document Version:** 1.0  
**Last Updated:** February 9, 2026  
**Status:** Production Validated  
**Deployment Success:** ✅ CONFIRMED  

---

**End of Handover Document**
