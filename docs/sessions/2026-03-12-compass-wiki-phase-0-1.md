# Session: Compass Wiki — Phase 0 + Phase 1 Build

**Date:** 2026-03-12
**Project:** Compass Wiki (wiki.roammigrationlaw.com / intranet /wiki)
**Status:** Deployed — awaiting Drive folder permission grant + first sync

---

## What Was Built

Full Phase 0+1 implementation of the Compass Wiki: a Google Docs/Sheets-powered internal wiki embedded at `/wiki` in the RML intranet, replacing YouNeedAWiki.

### Backend (25 files, 3059 insertions)

| File | Purpose |
|------|---------|
| `supabase/migrations/20260312000001_wiki.sql` | wiki_root_folders, wiki_folders, wiki_documents, wiki_sync_runs, wiki_watch_subscriptions |
| `supabase/migrations/20260312000002_wiki_search_fn.sql` | `wiki_search()` PostgreSQL RPC — full-text search with ts_headline snippets |
| `backend/src/services/WikiSyncService.ts` | Drive API traversal + Docs/Sheets content indexing |
| `backend/src/routes/wiki.ts` | All /api/wiki/* routes (tree, doc, folder, search, sync, admin) |
| `backend/src/utils/cache.ts` | Added `wikiCache` (30 min TTL, cleared on sync) |
| `backend/src/middleware/auth.ts` | Added `/api/wiki/sync` to Cloud Scheduler bypass |
| `backend/src/index.ts` | Mounted wiki router |
| `backend/cloudbuild.yaml` | Added `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY` to secrets |

### Frontend

| File | Purpose |
|------|---------|
| `src/app/types/wiki.ts` | All TypeScript types |
| `src/app/services/wikiService.ts` | API client |
| `src/app/contexts/WikiTreeContext.tsx` | Tree fetch, NavigationItem[] conversion, lookup utils |
| `src/app/lib/wiki/GoogleDocRenderer.tsx` | Docs JSON → React (headings, paragraphs, tables, lists, links) |
| `src/app/lib/wiki/GoogleSheetRenderer.tsx` | Sheets values → HTML tables (essential requirement met) |
| `src/app/lib/wiki/extractToc.ts` | Extract ToC entries from Docs body |
| `src/app/components/Wiki/WikiTocPanel.tsx` | Sticky IntersectionObserver ToC (xl+, Docs only) |
| `src/app/components/Wiki/WikiDocMetaBar.tsx` | Metadata bar (folder path, date, word count, Open in Drive) |
| `src/app/components/Wiki/WikiFolderGrid.tsx` | Card grid for folder index |
| `src/app/pages/WikiSection.tsx` | Top-level router + WikiTreeProvider wrapper |
| `src/app/pages/WikiLandingPage.tsx` | /wiki landing — root folder grid |
| `src/app/pages/WikiContentPage.tsx` | Path resolver (folder vs doc from tree context) |
| `src/app/pages/WikiDocPage.tsx` | Document reader (Docs + Sheets) |
| `src/app/pages/WikiFolderPage.tsx` | Folder index page |
| `src/styles/wiki-prose.css` | Custom prose typography (no @tailwindcss/typography needed) |
| `src/app/App.tsx` | Added `/wiki/*` route + WikiSection import |
| `src/app/config/content-config.ts` | Added 'Compass Wiki' to header nav |

---

## Deployments

- **Migrations:** Applied to `spybbjljplimivkiipar` ✅
- **Frontend:** `rml-intranet-00147-tr2` ✅
- **Backend (first):** `rml-intranet-forms-api-00092-n9z` ✅ (missing service account key)
- **Backend (fix):** Redeploying with `GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY=google-workspace-service-account:latest`

---

## Drive Setup Required (Jackson action)

**Service account email:** `rml-intranet-directory-reader@rmlintranet.iam.gserviceaccount.com`

Must be granted **Viewer** access on the Roam Compass root folder:
`https://drive.google.com/drive/u/0/folders/1nK2O6REW-E0WUm2_pencXvMeszoTB6zW`

After granting access, trigger the first sync via:
- Admin → Wiki Management → "Sync now" button (Phase 2), OR
- Direct API call: `POST https://rml-intranet-forms-api-hmff5nrb3q-uc.a.run.app/api/wiki/sync`

---

## Seeded Root Folders (in wiki_root_folders table)

| Folder | Drive ID |
|--------|----------|
| 00 Index | `1NKllIKK5UE3D5_drqyvZwuGXwQ0cjCXF` |
| 01 Visa Classes | `1Cs0xmp-UgBxx1f5sLaXpzRHcP8PzhzEV` |
| 02 Case Management | `1ksAEWbTTI2hT22IevghSvsH_OAmxJ5jk` |
| 03 Legal Research | `11-oVlx-EdbW8DXzSxqzn_kLQAO_qECBJ` |
| 04 Quality Standards | `1Id7QP-_8FEnNnVRp5VKcEtlz6LhSToee` |
| 05 Client Experience | `1EKApZGp8jUm68MCwZybAjKMX2YOIN08r` |

Excluded: `97 Dashboard` + `99 Wiki Management` (hardcoded in WikiSyncService.EXCLUDED_FOLDER_IDS)

---

## Key Technical Decisions

- **No @tailwindcss/typography** — custom `wiki-prose.css` instead (simpler for Tailwind v4 compat)
- **WikiSheetRenderer**: stores sheets as `{ sheetName: string[][] }` JSON, renders each sheet as a styled table
- **Path resolution**: `WikiContentPage` resolves folder vs doc from tree context using URL path slugs (no separate routes needed)
- **Cache strategy**: `wikiCache` cleared on every sync completion; 30 min TTL otherwise
- **Auth bypass**: `/api/wiki/sync` added to Cloud Scheduler bypass guard in `auth.ts`

---

## Next Steps

### Immediate
1. Grant service account Viewer on Roam Compass Drive folder (Jackson)
2. Trigger first sync once backend redeploy completes
3. Verify docs render correctly at `/wiki`

### Phase 2 (Admin Tools — 2-3 days)
- `/admin/wiki` panel with folder manager, sync log, error log, "Sync now" button

### Phase 3 (Optional)
- Inline images
- Change notifications (Google Chat)
- Drive push webhooks (near-real-time sync)
