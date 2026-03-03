# RML Intranet — Notion DB Integration Fixes

**Date:** 2026-03-03
**Repo:** Roam-Migration/Rmlintranetdesign
**Commit:** `4d92412`

---

## Session Goal

Investigate why the Critical Updates widget on the intranet was not displaying live Notion data — it was showing static placeholder content instead.

---

## Root Causes Found (3 layers)

### Layer 1 — `VITE_NOTION_UPDATES_DB` not baked into deployed build

`VITE_*` vars are baked into the JS bundle at Vite compile time. The env var `VITE_NOTION_UPDATES_DB` was present in `cloudbuild.yaml` but the live production deployment predated that line being added. Result: `DATABASE_IDS.updates` was an empty string at runtime, so `fetchCriticalUpdates()` short-circuited to return `homePageConfig.updates` (the hardcoded placeholder data).

**Fix:** Triggered a fresh `gcloud builds submit` from the main branch.

### Layer 2 — `NOTION_API_KEY` mismatch between nginx proxy and GCP Secret Manager

The frontend Cloud Run (`rml-intranet`) had `NOTION_API_KEY` set as a **hardcoded plain-text env var** — a different, stale token from a manual setup predating the Feb 2026 key rotation. The nginx template `nginx.conf.template` substitutes `${NOTION_API_KEY}` at container start, so it was using the wrong key and Notion returned 401.

The backend (`rml-intranet-forms-api`) correctly used the GCP Secret Manager reference (`notion-api-key:latest`), which is why role lookups and write operations worked but reads via the nginx proxy failed.

**Fix:**
```bash
gcloud run services update rml-intranet --region=us-central1 --project=rmlintranet \
  --remove-env-vars=NOTION_API_KEY

gcloud run services update rml-intranet --region=us-central1 --project=rmlintranet \
  --update-secrets=NOTION_API_KEY=notion-api-key:latest
```

Cloud Run blocks switching a var from `value` to `secretKeyRef` in a single command — must be two separate updates.

### Layer 3 — Platform Features DB using collection ID instead of page URL ID

`VITE_NOTION_PLATFORM_FEATURES_DB` was set to `e38debd2-2692-4e42-ae29-5b5a13fff724` (the Notion collection ID), not the page URL ID `69eba1aab2ba46578130db2b74dd686d`. Notion REST API returns 404 for collection IDs. This had been silently falling back to static config for months — only discovered during the full DB audit.

**Fix:** Updated `cloudbuild.yaml`, committed and redeployed.

---

## DB Access Audit Results

All four intranet Notion databases tested against `notion-api-key:latest`:

| Database | ID used | HTTP |
|---|---|---|
| Critical Updates | `312e1901e36e819f973acce6d01a80e9` | 200 ✓ |
| Daily Updates | `312e1901e36e8104b227e867fbfa3356` | 200 ✓ |
| Document Hub | `29ae1901e36e804a91d9dd85c8f331d4` | 200 ✓ |
| Platform Features | `69eba1aab2ba46578130db2b74dd686d` (fixed) | 200 ✓ |

---

## Patterns Documented

`docs/patterns/notion-database-integration.md` — covers:
- Two-path Notion access (nginx proxy for reads, backend for writes)
- Shared `notion-api-key` GCP secret rule — never hardcode as plain env var
- Page URL ID vs Collection ID distinction with test command
- Step-by-step checklist for adding a new Notion database
- Key rotation procedure
- 401/404 diagnosis guide

---

## Key Technical Learnings

**Cloud Run env var type switching requires two steps**
You cannot change a var from `value` type to `secretKeyRef` type in a single `gcloud run services update`. Remove first, then add as secret.

**`VITE_*` vars are compile-time, not runtime**
They are baked into the Docker image at `npm run build`. Cloud Run runtime env vars arrive too late. All `VITE_*` vars must be in `Dockerfile` as `ARG`/`ENV` AND in `cloudbuild.yaml` as `--build-arg`. Changing them requires a full redeploy.

**nginx `${VAR}` substitution uses the Cloud Run env var, not the build arg**
The nginx template uses `envsubst` at container start. The `NOTION_API_KEY` in the nginx config comes from the Cloud Run env, not the Docker build. These are separate systems — one is for static frontend bundle config, the other is for runtime server config.

**Silent fallbacks mask integration failures**
Both `fetchCriticalUpdates()` (Status filter returns empty → homepage shows nothing) and `fetchPlatformFeatures()` (404 → falls back to static config) silently succeed from the user's perspective. The Platform Features 404 was undetected for months. Always verify DB access explicitly after any key rotation or new integration.

---

## Infrastructure State After Session

- `rml-intranet` revision `rml-intranet-00099-xfd` — `NOTION_API_KEY` now using `notion-api-key:latest` secret
- `rml-intranet` revision `rml-intranet-00100-*` — `VITE_NOTION_PLATFORM_FEATURES_DB` corrected to page URL ID
- All four Notion DBs returning 200 with current key
- `cloudbuild.yaml` (main branch, commit `4d92412`) — both DB ID fixes committed
