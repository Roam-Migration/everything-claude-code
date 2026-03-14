# Cloud Run + Vite Deployment Skill

## Purpose

Systematic workflow for deploying the RML Intranet (Vite/React frontend + Express backend) to Google Cloud Run. Prevents the most common deployment failures: VITE env var gaps, Secret Manager misconfiguration, and nginx routing holes.

## When to Use

- Deploying frontend or backend changes to production (`intranet.roammigrationlaw.com`)
- Adding new environment variables or secrets to either service
- Debugging a deployment failure or env var not reaching the app
- Setting up a new Cloud Run service from scratch

## Core Principle

**VITE env vars do NOT flow automatically from `.env` to Cloud Build.** The pipeline is:
```
Secret Manager / cloudbuild.yaml substitutions
    → Dockerfile ARG
    → Dockerfile ENV
    → Vite build (VITE_* vars embedded at build time)
    → Served as static files (no runtime env access)
```

Backend env vars flow differently:
```
cloudbuild.yaml --update-secrets / --set-env-vars
    → Cloud Run container env
    → Accessible via process.env at runtime
```

---

## Workflow

### Phase 1: Identify What Changed

Before deploying, audit the changeset:

1. **New VITE env vars?** Any new `VITE_*` usage in frontend code?
   - If yes → must wire through Dockerfile + cloudbuild.yaml (see Phase 3)
2. **New backend secrets?** Any new `process.env.SECRET_*` in backend?
   - If yes → must add to Secret Manager + cloudbuild.yaml (see Phase 4)
3. **New API routes?** Any new `router.post('/api/...')` in backend?
   - If yes → nginx location block required (see Phase 2)
4. **Both frontend and backend changed?**
   - Deploy backend first (backend URL may be needed by frontend build)

**Gate:** Complete this audit before writing any deployment config changes.

---

### Phase 2: nginx Route Audit (Frontend)

**Every backend route needs a corresponding nginx location block.** Missing blocks cause silent 404s.

Open `nginx.conf.template` (NOT `nginx.conf` — Cloud Run uses the template):

```nginx
# Pattern for each backend API route:
location /api/your-route {
    proxy_pass http://backend:3001/api/your-route;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Checklist:
- [ ] Every new `app.use('/api/...')` in `backend/src/index.ts` has a location block
- [ ] Location paths match exactly (trailing slash consistency matters)
- [ ] No wildcard blocks that could swallow unintended routes

---

### Phase 3: VITE Env Var Wiring (Frontend)

If any new `VITE_*` variables were added, complete all three steps:

**Step 3a — Dockerfile ARG + ENV** (`Dockerfile` in repo root):
```dockerfile
# Add after existing ARGs:
ARG VITE_NEW_VAR
ENV VITE_NEW_VAR=$VITE_NEW_VAR
```

**Step 3b — cloudbuild.yaml build step** (frontend `cloudbuild.yaml`):

For secrets (recommended pattern using `availableSecrets`):
```yaml
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/my-secret/versions/latest
      env: MY_SECRET

steps:
  - name: 'gcr.io/cloud-builders/docker'
    entrypoint: bash
    args:
      - '-c'
      - |
        docker build \
          --build-arg VITE_NEW_VAR=$$MY_SECRET \
          -t gcr.io/$PROJECT_ID/rml-intranet .
    secretEnv: ['MY_SECRET']
```

**CRITICAL:** Use `$$VAR` (double-dollar) — single `$VAR` is interpreted by Cloud Build substitution, not bash.

For non-secret build-time vars (plain substitutions):
```yaml
substitutions:
  _VITE_NEW_VAR: 'some-value'

steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - '--build-arg=VITE_NEW_VAR=$_VITE_NEW_VAR'
      - '-t'
      - 'gcr.io/$PROJECT_ID/rml-intranet'
      - '.'
```

**Step 3c — Verify** the var name is identical in all three places:
- `VITE_*` in frontend TypeScript (`import.meta.env.VITE_NEW_VAR`)
- `ARG VITE_NEW_VAR` in Dockerfile
- `--build-arg VITE_NEW_VAR=...` in cloudbuild.yaml

---

### Phase 4: Backend Secret / Env Var Wiring

**Backend env vars are runtime, not build-time — they go in `--update-secrets` or `--set-env-vars` on the Cloud Run deploy step.**

In `backend/cloudbuild.yaml`, find the `gcloud run deploy` step and add:

```yaml
# For secrets (preferred — auto-rotates):
'--update-secrets=NEW_SECRET=secret-name-in-gcp:latest'

# For plain env vars (not sensitive):
'--set-env-vars=NEW_VAR=value'
```

**CRITICAL:** Cloud Run env vars **REPLACE on deploy** — every var must be listed in cloudbuild.yaml. If a var is missing from the deploy step, it disappears from the running container.

Verify the complete list of `--update-secrets` and `--set-env-vars` flags covers all backend env vars currently in production.

---

### Phase 5: Deploy Frontend

```bash
cd /tmp/Rmlintranetdesign
gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet
```

Monitor build output for:
- Docker build step: confirm all `--build-arg` values are passed
- `Successfully built` + `Successfully tagged`
- Cloud Run deploy: `Service URL: https://...`

Average build time: ~2 minutes.

**If build fails:**
- `ARG not found`: Step 3a — Dockerfile ARG missing
- `$$VAR is empty`: Step 3b — secret not in `secretEnv` or wrong name
- `Access denied to secret`: Check IAM binding for Cloud Build SA on that secret

---

### Phase 6: Deploy Backend

```bash
cd /tmp/Rmlintranetdesign/backend
gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet
```

Monitor for:
- `Service [rml-intranet-forms-api] revision ... serving 100% of traffic`

**If backend fails to start:**
- Check Cloud Run logs: `gcloud run logs read --service=rml-intranet-forms-api --project=rmlintranet`
- Missing env var: check `--update-secrets` / `--set-env-vars` in cloudbuild.yaml
- Port mismatch: backend must listen on `PORT` env var (Cloud Run injects this)

---

### Phase 7: Verify Production

1. **Smoke test the new feature** at `https://intranet.roammigrationlaw.com`
2. **Check env vars reached the app:**
   - Frontend: `import.meta.env.VITE_*` should be defined (check in browser DevTools → Sources)
   - Backend: Check Cloud Run service config: `gcloud run services describe rml-intranet-forms-api --project=rmlintranet --region=us-central1`
3. **Check nginx routing:** New API route returns correct response, not 404

---

## Rollback Procedure

```bash
# List recent revisions
gcloud run revisions list --service=rml-intranet --project=rmlintranet --region=us-central1

# Route all traffic to previous revision
gcloud run services update-traffic rml-intranet \
  --to-revisions=REVISION-NAME=100 \
  --project=rmlintranet \
  --region=us-central1
```

---

## Pre-Deployment Checklist

- [ ] nginx location blocks added for all new API routes
- [ ] New VITE vars wired through Dockerfile ARG + ENV + cloudbuild.yaml --build-arg
- [ ] New backend secrets added to Secret Manager + cloudbuild.yaml --update-secrets
- [ ] No existing env vars accidentally removed from cloudbuild.yaml
- [ ] Double-dollar `$$VAR` used in bash entrypoint steps (not single `$VAR`)
- [ ] Backend deployed before frontend if backend URL is a VITE var
- [ ] Production smoke test completed

---

## Error Reference

| Error | Location | Root Cause | Fix |
|-------|----------|-----------|-----|
| `import.meta.env.VITE_FOO` is `undefined` | Frontend | ARG/ENV missing in Dockerfile or --build-arg missing in cloudbuild.yaml | Complete Phase 3 |
| `$$MY_SECRET` expands to empty string | Build step | Secret not in `secretEnv` list, or wrong env name | Add to `secretEnv` array, match name exactly |
| `Cannot GET /api/new-route` | Browser | nginx location block missing | Add to `nginx.conf.template`, redeploy frontend |
| Backend env var missing at runtime | Cloud Run | Var missing from `--update-secrets`/`--set-env-vars` | Add to `gcloud run deploy` step in backend cloudbuild.yaml |
| `Access denied` to secret | Cloud Build | Cloud Build SA lacks Secret Manager accessor role | `gcloud secrets add-iam-policy-binding secret-name --member=serviceAccount:... --role=roles/secretmanager.secretAccessor` |
| IAP 403 after deploy | Cloud Run + IAP | OAuth client mismatch or new revision lost backend binding | Check: `gcloud compute backend-services describe roamintranet-backend --global` |

---

## Infrastructure Quick Reference

| Resource | Value |
|----------|-------|
| GCP Project | `rmlintranet` |
| Region | `us-central1` |
| Frontend service | `rml-intranet` |
| Backend service | `rml-intranet-forms-api` |
| Production URL | `intranet.roammigrationlaw.com` |
| Backend API key secret | `notion-api-key` |
| Frontend cloudbuild.yaml | `/tmp/Rmlintranetdesign/cloudbuild.yaml` |
| Backend cloudbuild.yaml | `/tmp/Rmlintranetdesign/backend/cloudbuild.yaml` |

---

## Anti-Patterns to Avoid

❌ **Putting VITE vars in `.env`** — they don't reach Cloud Build; file isn't copied into build context

❌ **Using `$VAR` (single dollar) in bash entrypoint steps** — Cloud Build substitutes it before bash sees it; always use `$$VAR`

❌ **Using `--set-env-vars` for the Notion API key** — key rotation won't propagate; use `--update-secrets=NOTION_API_KEY=notion-api-key:latest`

❌ **Omitting existing vars from the deploy step** — Cloud Run replace-on-deploy will silently remove them from the running container

❌ **Editing `nginx.conf` directly** — Cloud Run uses `nginx.conf.template`; changes to `nginx.conf` are overwritten on container start

❌ **Deploying frontend before backend** when a new backend route is needed — frontend will 404 until backend is live
