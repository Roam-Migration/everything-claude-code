# Session: RML Intranet — Daily & Critical Updates Notion Sync

**Date:** 2026-02-25
**Branch:** `troubleshoot/notion-integration`
**Repo:** `/tmp/Rmlintranetdesign`

---

## What Was Accomplished

1. **Built "View All" archive pages**
   - `DailyUpdatesPage.tsx` — skeleton loader, empty state, per-entry cards with On Leave / Announcements / Business sections
   - `CriticalUpdatesPage.tsx` — category filter pills, severity filter, text search, clear filters, contextual empty states
   - Added routes `/daily-updates` and `/critical-updates` in `App.tsx`
   - Changed home card links from `<a href="#">` to `<Link to="...">` (React Router)
   - Added breadcrumb labels for both routes

2. **Created Notion databases via integration token**
   - `Daily Updates` DB: `312e1901e36e8104b227e867fbfa3356`
   - `Critical Updates` DB: `312e1901e36e819f973acce6d01a80e9`
   - **Critical**: Databases must be created via the integration token (not personal OAuth / MCP) to be auto-accessible

3. **Fixed Dockerfile missing ARG/ENV declarations**
   - `VITE_NOTION_UPDATES_DB` and `VITE_NOTION_DAILY_UPDATES_DB` were added to `cloudbuild.yaml` as `--build-arg` but were never declared in `Dockerfile`
   - Docker silently ignores undeclared build args — Vite received empty strings — form threw `Error: Daily Updates database not configured`
   - Fix: added `ARG VITE_FOO=` + `ENV VITE_FOO=$VITE_FOO` blocks to Dockerfile before `RUN npm run build`

4. **Fixed home page not fetching Daily Updates from Notion**
   - `loadNotionData()` in `HomePage.tsx` only called `fetchDailyPriorities()` and `fetchCriticalUpdates()`
   - `fetchAllDailyUpdates` was never called — card always showed hardcoded placeholder data (Sarah Johnson / Mike Chen)
   - Fix: added `fetchAllDailyUpdates()` to the `Promise.all` in `loadNotionData`, removed hardcoded initial state

5. **Implemented upsert logic for Daily Updates (same-date behaviour)**
   - Previously: two submissions for the same date → two separate Notion rows
   - Fix: `createDailyUpdate` now queries for existing entry on that date via `filter: { property: 'Date', date: { equals: data.date } }`
   - If found → `PATCH /pages/{id}` to update in place
   - If not found → `POST /pages` to create new
   - nginx updated to allow PATCH on `/api/notion/pages/{id}`

6. **Confirmed Critical Updates sync**
   - End-to-end confirmed: form writes to Notion with all fields (Category, Type, Status, Date)
   - Home page was already correctly wired to `fetchCriticalUpdates()` from a prior session
   - Both entries verified in Notion database

---

## Technical Decisions

### Upsert via date filter
Notion has no native upsert. Pattern used:
```typescript
const existing = await notionRequest(`/databases/${DATABASE_IDS.dailyUpdates}/query`, {
  method: 'POST',
  body: JSON.stringify({
    filter: { property: 'Date', date: { equals: data.date } },
    page_size: 1,
  }),
});
const existingPage = existing?.results?.[0];
if (existingPage) {
  await notionRequest(`/pages/${existingPage.id}`, { method: 'PATCH', body: JSON.stringify({ properties }) });
} else {
  await notionRequest('/pages', { method: 'POST', body: JSON.stringify({ parent: { database_id: ... }, properties }) });
}
```

### nginx PATCH allowlist
The Notion API proxy in nginx was restricted to `GET|POST|OPTIONS`. PATCH was needed for page updates. The existing allowlist rule `if ($uri ~ "^/api/notion/pages/[a-f0-9-]+$")` covers both GET and PATCH since nginx evaluates method and URI independently.

---

## Challenges and Solutions

| Challenge | Root Cause | Fix |
|---|---|---|
| "Failed to add update" error | Dockerfile missing `ARG`/`ENV` for new `VITE_*` vars | Added declarations before `RUN npm run build` |
| Home page shows placeholder data | `loadNotionData()` never called `fetchAllDailyUpdates` | Added to `Promise.all` |
| Same-date creates duplicate entries | No upsert logic | Query-then-PATCH-or-POST pattern |
| MCP-created databases inaccessible | Notion MCP uses personal OAuth; integration token has no access | Re-create databases using integration token directly |

---

## Key Metrics

- 3 frontend builds deployed (~2m20s each)
- 1 backend build deployed (~3m20s)
- 2 Notion databases live with correct schemas
- 0 test failures (confirmed via manual testing)

---

## Lessons Learned

1. **Vite env vars require three steps for Cloud Build:**
   - `--build-arg KEY=VALUE` in `cloudbuild.yaml`
   - `ARG KEY=` in Dockerfile
   - `ENV KEY=$KEY` in Dockerfile (before `RUN npm run build`)
   - Missing step 2 or 3 = Docker silently ignores the value

2. **Notion integration token access**: Databases must be created *via* the integration token for auto-access. MCP/personal OAuth creates databases that the integration key cannot see.

3. **Always audit `loadNotionData` when adding new data sources**: It's easy to wire up the service function but forget to call it from the home page fetch hook.

4. **nginx method allowlist and URI allowlist are independent checks**: You can reuse the same URI pattern rule for both GET and PATCH — no duplication needed.

---

## Notion Database IDs (Updated)

| Database | ID | Used In |
|---|---|---|
| Daily Updates | `312e1901e36e8104b227e867fbfa3356` | `VITE_NOTION_DAILY_UPDATES_DB` |
| Critical Updates | `312e1901e36e819f973acce6d01a80e9` | `VITE_NOTION_UPDATES_DB` |

---

## Files Changed

**New:**
- `src/app/pages/DailyUpdatesPage.tsx`
- `src/app/pages/CriticalUpdatesPage.tsx`

**Modified:**
- `Dockerfile` — ARG/ENV for new VITE vars
- `cloudbuild.yaml` — VITE_NOTION_UPDATES_DB, VITE_NOTION_DAILY_UPDATES_DB build args
- `backend/cloudbuild.yaml` — NOTION_DAILY_UPDATES_DB_ID, NOTION_CRITICAL_UPDATES_DB_ID env vars
- `nginx.conf` + `nginx.conf.template` — PATCH method + /api/notion/pages allowlist
- `src/app/App.tsx` — new routes
- `src/app/pages/HomePage.tsx` — fetchAllDailyUpdates wired, placeholder removed
- `src/app/services/notion.ts` — upsert logic, new fetch/create functions
- `src/app/components/DailyUpdatesCard.tsx` — Link to /daily-updates
- `src/app/components/UpdatesCard.tsx` — Link to /critical-updates
- `src/app/components/DailyUpdateForm.tsx` — real Notion write call
- `src/app/components/CriticalUpdateForm.tsx` — real Notion write call
- `src/app/config/breadcrumb-labels.ts` — new route labels
- `backend/src/routes/notion.ts` — proxy routes (bypassed by nginx in prod, present for completeness)
