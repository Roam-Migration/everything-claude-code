# Notion Database Integration Pattern

**Project:** RML Intranet (`Roam-Migration/Rmlintranetdesign`)
**Established:** 2026-03-03
**Trigger:** Critical Updates DB returning 401 due to mismatched API keys between frontend nginx proxy and backend

---

## Architecture Overview

The intranet accesses Notion via **two separate paths**, both using the same integration token:

```
Browser → nginx (/api/notion/*) → api.notion.com        [reads: DB queries]
Browser → nginx (/api/updates/*) → backend → Notion     [writes: create pages]
```

The nginx proxy injects the API key server-side via `${NOTION_API_KEY}` substituted from env at container start. The backend reads it from its own `NOTION_API_KEY` env var (same secret).

---

## The Shared Secret Rule

**Both services must use the same `notion-api-key` GCP Secret Manager reference.**

| Service | Config |
|---|---|
| `rml-intranet` (frontend) | `--update-secrets=NOTION_API_KEY=notion-api-key:latest` |
| `rml-intranet-forms-api` (backend) | `--update-secrets=NOTION_API_KEY=notion-api-key:latest` |

When the secret is rotated in GCP Secret Manager, both services automatically pick up the new value at next revision start (Cloud Run resolves `:latest` per revision).

**Never hardcode the Notion API key as a plain `--set-env-vars` value.** This was the root cause of the March 2026 incident — the frontend had a stale hardcoded key that diverged silently when the backend secret was rotated.

---

## Adding a New Notion Database

### Step 1 — Connect the integration in Notion
Open the database in Notion → `...` menu → **Connections** → add the **RML Intranet** integration.

This grants access to the shared `notion-api-key` token (used by both services).

### Step 2 — Add the DB ID to the backend
In `backend/cloudbuild.yaml`, add to `--set-env-vars`:
```
NOTION_MY_FEATURE_DB_ID=<db-page-id>
```
The backend uses these for write operations and for routes that need the DB ID at runtime.

### Step 3 — Add the DB ID to the frontend build
In `cloudbuild.yaml` (root), add to `--build-arg` in the docker build step:
```
VITE_NOTION_MY_FEATURE_DB=<db-page-id>
```
And in `Dockerfile`, add before `RUN npm run build`:
```dockerfile
ARG VITE_NOTION_MY_FEATURE_DB=
ENV VITE_NOTION_MY_FEATURE_DB=$VITE_NOTION_MY_FEATURE_DB
```
`VITE_*` vars are baked into the JS bundle at compile time — they cannot be set at Cloud Run runtime.

### Step 4 — Verify access
After deploying, test the key against the DB directly:
```bash
NOTION_KEY=$(gcloud secrets versions access latest --secret=notion-api-key --project=rmlintranet)
curl -s -o /dev/null -w "%{http_code}" -X POST \
  "https://api.notion.com/v1/databases/<DB_ID>/query" \
  -H "Authorization: Bearer ${NOTION_KEY}" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"page_size":1}'
# Expected: 200. 401 = wrong key. 404 = integration not connected or wrong ID.
```

---

## Rotating the Notion API Key

1. Generate new token in Notion workspace settings → Connections → your integration
2. Update GCP Secret Manager:
   ```bash
   echo -n "ntn_new_token_here" | gcloud secrets versions add notion-api-key \
     --data-file=- --project=rmlintranet
   ```
3. Both Cloud Run services will pick it up on next cold start / revision deploy
4. Force immediate pickup by touching a revision:
   ```bash
   gcloud run services update rml-intranet --region=us-central1 --project=rmlintranet --no-traffic
   gcloud run services update rml-intranet-forms-api --region=us-central1 --project=rmlintranet --no-traffic
   ```

---

## Current DB Inventory (as of 2026-03-03)

| DB | ID | Access | Used by |
|---|---|---|---|
| Critical Updates | `312e1901e36e819f973acce6d01a80e9` | ✓ 200 | nginx proxy (read) + backend (write) |
| Daily Updates | `312e1901e36e8104b227e867fbfa3356` | ✓ 200 | nginx proxy (read) + backend (write) |
| Document Hub | `29ae1901e36e804a91d9dd85c8f331d4` | ✓ 200 | nginx proxy (read) |
| Platform Features | `e38debd2-2692-4e42-ae29-5b5a13fff724` | ✗ 404 | nginx proxy (read, has static fallback) |

**Platform Features 404:** Integration not yet connected in Notion, or DB ID is a collection ID (not page ID). Not breaking — `/platform-map` falls back to static config. Add integration connection in Notion to activate live sync.

---

## Critical: Page URL ID vs Collection ID

Notion has two different IDs per database. **Always use the Page URL ID for the REST API.**

| ID type | Where it appears | Use for |
|---|---|---|
| **Page URL ID** | URL: `notion.so/workspace/Title-{THIS_ID}` | Notion REST API — all database operations |
| **Collection ID** | Notion MCP response: `collection://UUID` | Internal Notion / MCP only |

They share an opening segment but differ in the middle bytes:
```
Page URL:      69eba1aa-b2ba-4657-8130-db2b74dd686d   ← correct for REST API
Collection ID: e38debd2-2692-4e42-ae29-5b5a13fff724   ← WRONG, causes 404
```

**How to confirm the correct ID:** Navigate to the database in Notion → copy the URL → extract the UUID after the last `-` in the path (before `?v=`).

**Platform Features DB incident (2026-03-03):** `VITE_NOTION_PLATFORM_FEATURES_DB` was set to the collection ID `e38debd2...` for months. It silently fell back to static config because the `fetchPlatformFeatures()` function treats 404 as a stale-data fallback. Fixed to `69eba1aa...` (page URL ID).

---

## Diagnosing 401 on `/api/notion/`

The nginx proxy passes Notion's HTTP status directly to the browser. A 401 from the browser console means one of:

1. **`NOTION_API_KEY` not set on frontend Cloud Run** — check with:
   ```bash
   gcloud run services describe rml-intranet --region=us-central1 --project=rmlintranet \
     --format='value(spec.template.spec.containers[0].env)'
   ```
   Should show `secretKeyRef`, not a plain `value`.

2. **Integration not connected to the database** — open the DB in Notion → Connections → verify the integration is listed.

3. **Key mismatch** — the secret in GCP Secret Manager may differ from what's deployed. Force a revision update (see rotation steps above).

---

## nginx Notion Proxy Config Notes

- Config source: `nginx.conf.template` (NOT `nginx.conf` — the template is what gets copied in Dockerfile)
- `envsubst '${NOTION_API_KEY}'` runs in `docker-entrypoint.sh` at container start
- New routes must be explicitly allowlisted in the `if ($uri ~ ...)` blocks in the `/api/notion/` location
- Rate limiting: 10 req/s per IP, burst 20 (`notion_api` zone)
