# Session: RML Intranet — Notion Document Hub Integration

**Date:** 2026-02-24
**Branch:** `troubleshoot/notion-integration`
**Service deployed:** `rml-intranet-forms-api` (Cloud Run, generation 38)

---

## What Was Accomplished

Diagnosed and fixed the broken Notion integration on the Core Operations page's "Operations Documents" card. The `DocumentHubCard` component was returning empty results instead of live documents from the Notion Document Hub database.

**Root causes (two separate issues):**

1. **Wrong database ID** — `NotionService.ts` had a hardcoded fallback of `29ae1901e36e80eba289000b6f194afb` (a Notion collection ID / internal data-source format) instead of the actual Notion database page ID `29ae1901e36e804a91d9dd85c8f331d4`. The Notion REST API requires the page ID.

2. **Missing `NOTION_API_KEY` in Cloud Run** — The API key was only in the local `backend/.env` file and not in `backend/cloudbuild.yaml`'s `--set-env-vars`. This meant `NotionService.isConfigured()` returned `false` in production, short-circuiting all document fetches with an empty array.

---

## Files Changed

| File | Change |
|---|---|
| `backend/src/services/NotionService.ts:46` | Fixed `documentsDbId` fallback to correct database page ID |
| `backend/cloudbuild.yaml` | Added `NOTION_API_KEY` and `NOTION_DOCUMENTS_DB_ID` to `--set-env-vars` |
| `backend/.env` | Added `NOTION_DOCUMENTS_DB_ID=29ae1901e36e804a91d9dd85c8f331d4` (local dev) |

Commit: `366fd67 fix: connect Notion Document Hub to Core Operations page`

---

## Technical Decisions

### Why fix the fallback AND the env var?
The code fallback ensures correctness without environment configuration. The env var in `cloudbuild.yaml` makes the intent explicit for future maintainers and allows override without redeployment.

### Why not use Secret Manager for NOTION_API_KEY?
The project already has other API keys (e.g., `METABASE_EMBED_SECRET_KEY`) as plaintext in `cloudbuild.yaml`. Consistent with the existing pattern for now. Future improvement: move to `--update-secrets` like `SUPABASE_SERVICE_ROLE_KEY`.

---

## Key Architecture Insight

**Notion IDs are not interchangeable.** The Notion MCP tooling returns collection IDs in `collection://UUID` format — these are *internal* Notion identifiers. The REST API uses database *page* IDs which are visible in the database URL. They share the same first segment (`29ae1901-e36e-...`) but diverge after that.

- Collection ID: `29ae1901-e36e-80eb-a289-000b6f194afb` (MCP internal)
- Page ID: `29ae1901-e36e-804a-91d9-dd85c8f331d4` (REST API / URL)

**Always confirm IDs via Notion MCP `notion-fetch`** on the database — the page ID is in the `url` field.

---

## Data Flow (Post-Fix)

```
CoreOperationsPage
  └─ <DocumentHubCard categories={['Process guide', 'SOP', 'Internal Training - Admin']} />
       └─ fetchDocuments() → GET /api/notion/documents?categories=...
            └─ backend route: NotionService.fetchDocuments()
                 └─ POST https://api.notion.com/v1/databases/29ae1901e36e804a91d9dd85c8f331d4/query
                      filter: Status = "Published"
                      client-side filter: category matches passed array
```

---

## Challenges

- **Cloud Run env var gap** — `--set-env-vars` in Cloud Run *replaces* all non-secret env vars on each deploy. Any key not listed gets dropped. The local `.env` gave a false sense of security.
- **Duplicate builds** — Two builds ran simultaneously (background task + foreground submit). Both succeeded; the second one (`0c782ed3`) landed on the service at generation 38.

---

## Lessons Learned

1. **Always check Cloud Run env vars directly** before debugging application logic: `gcloud run services describe [service] --format='value(spec.template.spec.containers[0].env)'`
2. **Notion collection IDs ≠ database page IDs** — verify with `notion-fetch` before using in REST API calls
3. **`--set-env-vars` is destructive** — treat the `cloudbuild.yaml` env var list as the single source of truth for what exists in Cloud Run production
4. **Backend `.env` is local-only** — changes there have zero effect on deployed Cloud Run services

---

## Next Steps (if any)

- Consider moving `NOTION_API_KEY` to Secret Manager (`gcloud secrets create notion-api-key --data-file=-`) for consistency with `SUPABASE_SERVICE_ROLE_KEY`
- Verify the Operations Documents card renders correctly in production browser session
- Other Notion database IDs (`NOTION_KPI_REPORTS_DB_ID`, `NOTION_LEAVE_REQUESTS_DB_ID`, `NOTION_FEEDBACK_DB_ID`) are also absent from Cloud Run — add them when those features are activated
