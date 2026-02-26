# RML Deployment Templates

GCP Cloud Run deployment templates for RML internal applications.

## Purpose

Provides copy-paste deployment configurations for:
- **Vite + React SPAs** (Intranet, Quote Calculator)
- **Next.js SSR apps** (Compass Wiki)
- Automated scripts for IAP, domain mapping, rollbacks

## Quick Start

### Deploy Vite + React SPA
```bash
# 1. Copy template to your app
cp -r vite-react-spa/* /path/to/your-app/

# 2. Deploy
cd /path/to/your-app
chmod +x deploy.sh
./deploy.sh --service=your-app-name
```

### Deploy Next.js SSR App
```bash
# 1. Copy template
cp -r nextjs-ssr/* /path/to/your-nextjs-app/

# 2. Ensure package.json has "start" script
# "scripts": { "start": "next start -p 8080" }

# 3. Deploy
cd /path/to/your-nextjs-app
chmod +x deploy.sh
./deploy.sh --service=your-nextjs-app
```

## Templates

### `vite-react-spa/`

For single-page applications built with Vite, React, Vue, etc.

**Includes:**
- Multi-stage Dockerfile (Node build → nginx serve)
- nginx.conf with SPA routing, security headers
- Cloud Build configuration
- Deployment script

**Requirements:**
- `npm run build` produces `dist/` folder
- App listens on port 8080 (configured in nginx)

### `nextjs-ssr/`

For Next.js applications with server-side rendering.

**Includes:**
- Multi-stage Dockerfile (build → Node serve)
- Cloud Build configuration
- Deployment script

**Requirements:**
- `npm run build` produces `.next/` folder
- `npm start` runs Next.js server on port 8080
- Set `PORT=8080` in Dockerfile

## Scripts

### `setup-iap.sh`

Configure Identity-Aware Proxy for Google Workspace SSO.
```bash
./scripts/setup-iap.sh --service=rml-intranet
```

**Process:**
1. Enables IAP API
2. Guides through OAuth consent screen setup
3. Provides IAP configuration steps
4. Adds domain restriction (@roammigrationlaw.com)

### `map-domain.sh`

Map a custom domain to your Cloud Run service.
```bash
./scripts/map-domain.sh \
  --service=rml-intranet \
  --domain=intranet.roammigrationlaw.com
```

**Process:**
1. Creates domain mapping
2. Outputs DNS CNAME record to add
3. Waits for SSL certificate provisioning

### `rollback.sh`

Rollback to a previous revision.
```bash
./scripts/rollback.sh --service=rml-intranet
```

**Process:**
1. Lists available revisions
2. Prompts for revision to rollback to
3. Routes 100% traffic to selected revision

## Customization

### Change Region

Default: `us-central1`

To use Australia region:
```bash
./deploy.sh --service=your-app --region=australia-southeast2
```

### Adjust Resources

Edit `cloudbuild.yaml`:
```yaml
- '--memory'
- '1Gi'         # Increase memory
- '--cpu'
- '2'           # Increase CPU
- '--min-instances'
- '1'           # Keep 1 instance warm
```

### Add Environment Variables
```bash
gcloud run services update your-service \
  --region=us-central1 \
  --set-env-vars="API_KEY=your-key,NODE_ENV=production"
```

## Deployment Checklist

Before deploying to production:

- [ ] App builds successfully locally (`npm run build`)
- [ ] Dockerfile exposes port 8080
- [ ] No hardcoded secrets in code (use env vars)
- [ ] `.dockerignore` excludes `node_modules`, `.env`
- [ ] Cloud Build APIs enabled in GCP project
- [ ] Billing account linked to project

After deployment:

- [ ] Test service URL (*.run.app)
- [ ] Configure IAP (`setup-iap.sh`)
- [ ] Map custom domain (`map-domain.sh`)
- [ ] Verify domain resolves (wait for DNS + SSL)
- [ ] Test authentication with @roammigrationlaw.com email
- [ ] Test authentication fails with external email
- [ ] Set up monitoring/alerting
- [ ] Document service in Notion

## Troubleshooting

### Build Fails
```bash
# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>
```

Common issues:
- Missing `package.json` or `package-lock.json`
- `npm run build` fails (test locally first)
- Dockerfile references wrong build output folder

### Deployment Fails
```bash
# Check service logs
gcloud run services logs read your-service --region=us-central1 --limit=50
```

Common issues:
- Container not listening on port 8080
- App crashes on startup (missing env vars)
- Health check fails — the `vite-react-spa` template includes a `/health` endpoint in nginx.conf; for `nextjs-ssr`, Cloud Run uses TCP startup probes (no `/health` route needed)

### IAP Not Working

1. Verify OAuth consent screen is "Internal" type
2. Check user email domain is @roammigrationlaw.com
3. Clear browser cookies and retry
4. Check IAP policy:
```bash
   gcloud iap web get-iam-policy --resource-type=backend-services --service=your-service
```

### Domain Not Resolving

1. Verify DNS CNAME points to `ghs.googlehosted.com`
2. Check DNS propagation: `dig your-domain.roammigrationlaw.com`
3. Wait up to 60 minutes for SSL certificate
4. Check domain mapping status:
```bash
   gcloud run domain-mappings describe --domain=your-domain.roammigrationlaw.com --region=us-central1
```

## Related Repos

- [rml-shared-components](https://github.com/Roam-Migration/rml-shared-components) - React component library
- [rml-claude-prompts](https://github.com/Roam-Migration/rml-claude-prompts) - Claude Code instructions

## Support

For issues or questions:
1. Check this README
2. Review GCP Apps Handover doc
3. Ping Jackson or Sochan
