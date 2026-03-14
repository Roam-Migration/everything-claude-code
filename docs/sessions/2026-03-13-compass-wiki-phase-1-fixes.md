# Session: Compass Wiki — Phase 1 Bug Fixes

**Date:** 2026-03-13
**Project:** Compass Wiki (intranet.roammigrationlaw.com/wiki)
**Status:** Deployed — wiki functional, all Phase 1 bugs resolved

---

## What Was Fixed

Continued from 2026-03-12 session. Phase 0+1 was built and deployed; this session resolved all issues found during first testing.

### Bug 1: Shared Drive returns 0 docs (`supportsAllDrives`)

**Symptom:** Sync ran successfully (`folders_synced: 6`) but `docs_added: 0`.

**Root cause:** Roam Compass is a Google Shared Drive. The Drive API `files.list` silently returns zero results for Shared Drive content without `supportsAllDrives: true` + `includeItemsFromAllDrives: true`.

**Fix:** Added both params to `drive.files.list` in `WikiSyncService.syncFolder` and `supportsAllDrives: true` to `drive.files.get` in the admin folder validation route.

**Commit:** `81dccb4`

---

### Bug 2: Three sync bugs — folder depth, parent FK, archival

**Symptom:** After Shared Drive fix, 25 docs indexed but all sub-folders at `depth: 0` with `parent_folder_id: null`. On next sync, root folder mirror nodes (depth-0 wiki_folders entries) were archived because their Drive IDs weren't in `seenDriveFolderIds`.

**Root causes (three bugs):**
1. Sub-folders upserted with `depth` (current level) instead of `depth + 1`
2. No `wiki_folders` row was created for the current folder at the start of `syncFolder`, so `currentFolderDbId = null` for all root-level children
3. `seenDriveFolderIds.add(driveFolderId)` never called — only child IDs were added, so root mirror nodes got archived on every sync

**Fix:**
- Renamed `ensureRootFolderNode` → `ensureFolderNode`, extended to accept `parentFolderDbId` and `depth` params, called at the **top** of every `syncFolder` invocation
- `seenDriveFolderIds.add(driveFolderId)` added at top of `syncFolder` (covers root + recursive)
- Sub-folder upsert now uses `depth + 1`

**Commit:** `9f9320e`

---

### Bug 3: nginx not proxying `/api/wiki/`

**Symptom:** `/wiki` page showed "Could not load the wiki — Unexpected token '<', '<!DOCTYPE'... is not valid JSON".

**Root cause:** `/api/wiki/` was missing from `nginx.conf.template`. Requests fell through to the SPA catch-all (`try_files $uri /index.html`), returning the React app's HTML instead of JSON.

**Fix:** Added `location /api/wiki/` block to `nginx.conf.template` with full proxy headers and 60s timeout (sync can run long).

**Commit:** `58a7426`

---

### Bug 4: Duplicate nav items + non-interactive root folder cards

**Symptom:** Each folder appeared twice in the left nav; clicking root folder cards on the landing page had no effect.

**Root causes:**
1. **Duplicates:** `buildTree` fetched "top folders" using `parent_folder_id === null` — but the depth-0 mirror nodes also have `parent_folder_id: null`. Each root folder appeared as the `root_folder` node AND again as a child `folder` node.
2. **Non-interactive cards:** Root folders had `path_slugs: []` (sync started pathSlugs at `[]` not including the root folder's own slug), so `convertTreeToNavigation` fell back to `path: '/wiki'` for all root folders. Clicking navigated to the same page.
3. **Nav key collision:** All root folder nav items shared `path: '/wiki'` as the React key.

**Fix:**
- `buildTree`: skip mirror nodes from `topFolders`; use `foldersByParent.get(mirrorNode.id)` for children; set `id: mirrorNode?.id` and `path_slugs: mirrorNode?.path_slugs` on `root_folder` nodes
- `WikiSyncService.syncAll`: compute `rootSlug = slugify(name, drive_id)` and pass `pathSlugs: [rootSlug]` to `syncFolder`
- `convertTreeToNavigation`: derive path from `root.path_slugs` instead of hardcoding `/wiki`
- `WikiLandingPage`: link cards to `rootNode.path_slugs` instead of first child

**Commit:** `71a484a`

---

### Bug 5: Stale tree + hover colours

**Symptom:** Root folder nav items still didn't navigate after Fix 4. Folder card hover was imperceptible (near-white background).

**Root causes:**
1. **Stale tree:** Frontend loaded the tree during the deploy/resync window when mirror nodes still had `path_slugs: []`. The 30-min backend wikiCache lock-in + React state meant users needed a hard refresh.
2. **Hover:** `NavItem` used `hover:bg-[#f9f9f9]` (98% white, indistinguishable from background). `WikiFolderGrid` used `hover:bg-[#f9f1f6]` (very faint pink).

**Fix:**
- `WikiTreeContext`: added stale-detection `useEffect` — if any `root_folder` has empty `path_slugs` but has children, auto-refetch after 3s
- `NavItem`: `hover:bg-[#f9f9f9]` → `hover:bg-[#f0e4ec]` (visible soft pink)
- `WikiFolderGrid`: `hover:bg-[#f9f1f6]` → `hover:bg-[#ecdff0]` (more saturated); icons shift to brand purple on hover
- `WikiLandingPage` root cards: added `hover:bg-[#ecdff0]`

**Commit:** `0453365`

---

## Final State

| Metric | Value |
|--------|-------|
| Folders synced | 18 (6 root + 12 sub-folders) |
| Documents indexed | 25 (mix of Docs + Sheets) |
| Sync errors | 0 |
| Root folder path_slugs | All populated (e.g. `01-visa-classes-1cs0xm`) |
| Wiki URL | intranet.roammigrationlaw.com/wiki |

---

## Key Technical Learnings

### Shared Drive API params are NOT optional
`drive.files.list` silently returns `[]` for Shared Drive content without:
```typescript
supportsAllDrives: true,
includeItemsFromAllDrives: true,
```
No error, no warning. Always add these when the Drive target may be a Shared Drive.

### "Ensure before iterate" pattern for tree sync
`ensureFolderNode` must be called at the **start** of `syncFolder` (not lazily when a doc is encountered). This guarantees:
- FK is satisfied before any child references it
- The folder's own Drive ID is added to the seen-set before processing children
- `currentFolderDbId` is available for all items in the folder

### Mirror node architecture
Root folders live in `wiki_root_folders` (config table) but `wiki_documents` requires a FK to `wiki_folders`. Solution: `ensureFolderNode` creates a depth-0 `wiki_folders` mirror for each root folder. The mirror's `id` is used as `folder_id` on documents and as the `root_folder` tree node's `id`. `buildTree` must skip mirror nodes when listing children (use `foldersByParent.get(mirrorNode.id)` not `parent_folder_id IS NULL`).

### Path slug must include root folder itself
Initial sync called `syncFolder(pathSlugs: [])` — so sub-folders got paths like `['lmt-1ekazi']` with no root prefix. Root folders had `path_slugs: []` (no navigable URL). Fix: `syncAll` computes root slug and passes `pathSlugs: [rootSlug]` so the hierarchy is:
- Root: `['01-visa-classes-1cs0xm']` → `/wiki/01-visa-classes-1cs0xm`
- Child: `['01-visa-classes-1cs0xm', 'lmt-1ekazi']` → `/wiki/01-visa-classes-1cs0xm/lmt-1ekazi`

### nginx SPA catch-all masks API 404s
When an API path is missing from nginx, `try_files $uri /index.html` returns the app shell HTML. The browser receives `<!DOCTYPE html>` where it expected JSON → "Unexpected token '<'" parse error. Always add new API paths before deploying new API routes.

### Frontend stale state after deploy + resync
If the frontend loads the wiki tree between "data cleared" and "resync complete", it caches an empty tree. Stale-detection `useEffect` in `WikiTreeContext` auto-refetches if `root_folder` nodes have empty `path_slugs` but have children. Hard refresh also resolves it.

---

## Remaining (Phase 2)

- Cloud Scheduler job for 2-hour recurring sync
- `/admin/wiki` panel (folder manager, sync log, error log, Sync Now button)
- Phase 3 (optional): inline images, Drive push webhooks, Google Chat change notifications
