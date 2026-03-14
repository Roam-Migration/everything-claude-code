# Session: Compass Wiki — Simplify Review + Phase 2 Task Planning

**Date:** 2026-03-14
**Project:** Compass Wiki (intranet.roammigrationlaw.com/wiki)
**Status:** Deployed — simplify fixes applied, Phase 2 tasks created in Notion

---

## Context

Continuation of the 2026-03-13 session (Phase 1 bug fixes). This session resumed after context compaction, ran the simplify review, applied fixes, and closed out with Notion task creation.

---

## Simplify Review Findings

Three parallel agents (reuse, quality, efficiency) reviewed the wiki-related changes from Phase 1.

### Applied Fixes

**`WikiTreeContext.tsx` — `navigation` as `useMemo`**

Was storing `navigation: NavigationItem[]` as a separate `useState` alongside `tree`. Risk: if tree updated without triggering the `setNavigation` call, navigation would be stale.

**Fix:** Removed `useState` + `setNavigation`; replaced with:
```typescript
const navigation = useMemo(() => convertTreeToNavigation(tree), [tree]);
```
Navigation is now always derived from the current tree — no sync risk.

**`wiki.ts` — `buildDocNode` shared helper**

The document-to-TreeNode mapping was inlined identically in two places:
1. Inside `buildFolderNode` (for child docs)
2. In the `rootDocs` mapping for root-level mirror node documents

**Fix:** Extracted `buildDocNode(d: any): TreeNode` function used at both sites. 9 lines of duplication removed.

**`WikiSyncService.ts` — `ensureFolderNode` depth>0 fallback warning**

The `else` branch for depth>0 in `ensureFolderNode` was silently setting `folderName = driveFolderId`, meaning a failed parent-upsert would cause a raw Drive ID string to appear as a folder name in the UI with no log entry.

**Fix:** Added `console.warn(...)` so the condition is visible in Cloud Run logs.

**Commit:** `e1b5bea`

### Skipped (justified)

- **N+1 in `ensureFolderNode`**: The SELECT before UPSERT is necessary — for depth>0 recursive calls, the row exists but the UUID isn't threaded through. Removing the SELECT requires passing the DB ID through recursion (Phase 2 refactor).
- **Parallel folder recursion**: `Promise.all()` for sub-folder traversal is a real win (~18–30s saved) but risks FK race conditions if not designed carefully. Noted for Phase 2.
- **100ms doc throttle**: Minor, probably removable, but needs quota testing.

---

## Key Technical Learnings

### `useMemo` vs `useState` for derived state

When one state value is a pure function of another, `useState` creates a synchronisation obligation that can be violated. `useMemo` makes the derivation explicit and eliminates the obligation entirely. The cost is minor: `convertTreeToNavigation` runs on every render where `tree` reference changes, but tree updates are infrequent (once per load).

### "Ensure before iterate" is not just a correctness pattern — it's also a N+1 source

The `ensureFolderNode` SELECT exists because the UUID isn't available at the call site. Threading IDs through recursive calls (instead of re-fetching) would eliminate the N+1 AND simplify the function signature. Pattern for Phase 2: pass `folderDbId` as a parameter to `syncFolder` so `ensureFolderNode` is only called for depth=0 (root mirror creation).

---

## Notion Tasks Created

### Phase 2 (this session closure)
- Cloud Scheduler 2h recurring wiki sync job
- /admin/wiki management panel (folder manager, sync log, error log, Sync Now)
- Phase 3 optional: Drive push webhooks + inline images + Google Chat notifications

### Phase 2 (user request, this session)
- Map Compass Wiki to Platform Map + related Notion tables
- Embed document controls into Compass Wiki
- Embed Wiki Feedback into Compass Wiki

---

## Builds

- Frontend: `edfafaf2` (queued 2026-03-14)
- Backend: `acae4dbd` (queued 2026-03-14)
