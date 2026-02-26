# Deploy Application to Google Cloud Run with IAP

You are deploying an RML internal application to Google Cloud Platform.

## Prerequisites Check

Before deploying, verify:
- [ ] GCP project `rmlintranet` is active
- [ ] `deploy.sh` script exists (from rml-deployment-templates)
- [ ] App builds successfully locally (`npm run build`)
- [ ] Dockerfile exposes port 8080
- [ ] No secrets hardcoded in code

## Deployment Process

### 1. Set Active GCP Project
```bash
gcloud config set project rmlintranet
```

### 2. Verify Build Locally
```bash
# Test Docker build
docker build -t test-build .

# Verify container runs on port 8080
docker run -p 8080:8080 test-build

# Test in browser
curl http://localhost:8080/health
```

### 3. Run Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh --service=[service-name]
```

**Service naming convention:** `rml-[app-name]`

Examples:
- `rml-intranet`
- `rml-quote-calculator`
- `compass-wiki`

### 4. Monitor Cloud Build
```bash
# Watch build progress
gcloud builds list --limit=5

# Stream logs for latest build
BUILD_ID=$(gcloud builds list --limit=1 --format="value(id)")
gcloud builds log $BUILD_ID --stream
```

### 5. Verify Deployment

After successful build:
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe [service-name] \
  --region=us-central1 \
  --format='value(status.url)')

echo "Service deployed at: $SERVICE_URL"

# Test health endpoint
curl $SERVICE_URL/health
```

## Post-Deployment Configuration

### Configure IAP (Required)
```bash
cd ~/projects/rml-deployment-templates
./scripts/setup-iap.sh --service=[service-name]
```

**Manual steps (IAP requires web console):**
1. Go to https://console.cloud.google.com/security/iap?project=rmlintranet
2. Configure OAuth consent screen (if not done):
   - User Type: **Internal**
   - App Name: **RML Internal Apps**
   - Support Email: **j.taylor@roammigrationlaw.com**
3. Create OAuth Client ID:
   - Application Type: **Web application**
   - Name: **IAP-[service-name]**
4. Enable IAP toggle for your service
5. Add access:
   - Member: **domain:roammigrationlaw.com**
   - Role: **IAP-secured Web App User**

### Map Custom Domain (Required)
```bash
cd ~/projects/rml-deployment-templates
./scripts/map-domain.sh \
  --service=[service-name] \
  --domain=[subdomain].roammigrationlaw.com
```

**DNS Configuration:**
Add CNAME record at your DNS provider:
```
Type: CNAME
Name: [subdomain]
Value: ghs.googlehosted.com
TTL: 3600
```

**SSL Certificate:**
Google auto-provisions SSL. Wait 10-60 minutes after DNS propagation.

Check status:
```bash
gcloud run domain-mappings describe \
  --domain=[subdomain].roammigrationlaw.com \
  --region=us-central1
```

## Verification Checklist

- [ ] Service deploys successfully (*.run.app URL accessible)
- [ ] Health check responds: `curl [SERVICE_URL]/health`
- [ ] IAP enabled and configured
- [ ] @roammigrationlaw.com users can access
- [ ] External users cannot access (403 Forbidden)
- [ ] Custom domain resolves
- [ ] HTTPS certificate valid
- [ ] No console errors in browser

## Troubleshooting

### Build Fails
```bash
# View detailed logs
gcloud builds log [BUILD_ID]
```

Common issues:
- Port mismatch (must be 8080)
- `npm run build` fails
- Missing environment variables

### Container Crashes
```bash
# Check runtime logs
gcloud run services logs read [service-name] \
  --region=us-central1 \
  --limit=100
```

Common issues:
- App not listening on port 8080
- Missing dependencies in production build
- Environment variables not set

### IAP 403 Errors

1. Verify user email is @roammigrationlaw.com
2. Check IAP policy includes domain:
```bash
   gcloud iap web get-iam-policy \
     --resource-type=backend-services \
     --service=[service-name]
```
3. Clear browser cookies
4. Try incognito mode

## Rollback Procedure

If deployment causes issues:
```bash
cd ~/projects/rml-deployment-templates
./scripts/rollback.sh --service=[service-name]
```

This routes 100% traffic back to previous working revision.

## Success Criteria

Deployment is complete when:
1. Custom domain loads in browser
2. User sees login prompt (Google Workspace)
3. Login with @roammigrationlaw.com succeeds
4. Login with external email fails
5. Application functions as expected
6. No console errors
