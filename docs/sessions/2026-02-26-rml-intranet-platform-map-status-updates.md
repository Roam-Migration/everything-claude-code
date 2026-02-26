# Session: RML Intranet Platform Map Status Updates

**Date:** 2026-02-26
**Branch:** `troubleshoot/notion-integration`
**Commit:** `4439e7f`

---

## What Was Accomplished

Updated the status of two Home section features on the Platform Map from incomplete states to **Functional**:

| Feature | Before | After |
|---------|--------|-------|
| Daily Updates | Partial | Functional |
| Team Calendar | Stub | Functional |

Changes were made across three layers (all must stay in sync):

1. **Notion database** — "RML Platform Features" (`e38debd2-2692-4e42-ae29-5b5a13fff724`)
   - Updated `Status`, `Description`, `Data Source`, `Notes` fields on both pages
   - This is the live source of truth for production

2. **`src/app/config/content-config.ts`** (`platformMapConfig`)
   - Static fallback used when Notion is unavailable
   - `static-home-3` (Daily Updates): status Partial → Functional, description updated
   - `static-home-4` (Team Calendar): status Stub → Functional, route null → `/`, dataSource None → External

3. **`docs/rml-intranet-platform-feature-map.md`** (ECC documentation)
   - Feature Status Matrix updated for both rows
   - Gap Analysis: removed "Live Daily Updates" and "Team Calendar" rows
   - Phase 1 priorities: removed item 3 (Connect DailyUpdatesCard to Notion — complete)
   - Last Updated bumped to 2026-02-26

Deployed via Cloud Build: build `365860d3` — SUCCESS (2m18s).

---

## Architecture Insight: Three-Layer Platform Map

The Platform Map has three representations that must be kept in sync:

```
Notion DB (live)          ← production reads this first
    ↓ fallback
content-config.ts         ← used when Notion unavailable
    ↓ documents
ECC docs/platform-map.md  ← human reference / team docs
```

When updating feature status, always update all three. The Notion DB is authoritative for what staff see; the static config is the safety net; the ECC doc is the team's reference.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/config/content-config.ts` | Static fallback — `platformMapConfig` section |
| `src/app/pages/PlatformMapPage.tsx` | Page component — reads Notion via `fetchPlatformFeatures()` |
| `src/app/types/platform-map.ts` | Type definitions for `PlatformFeature`, `FeatureStatus` |
| `src/app/services/notion.ts` | `fetchPlatformFeatures()` — Notion DB fetch + cache |
| `docs/rml-intranet-platform-feature-map.md` | ECC team reference doc |

Notion DB env var: `VITE_NOTION_PLATFORM_FEATURES_DB=e38debd2-2692-4e42-ae29-5b5a13fff724`

---

## Lessons Learned

- The `/platform-map` intranet route (`https://intranet.roammigrationlaw.com/platform-map`) is the live page — not the ECC doc. Always check the GH repo for the actual source.
- `gcloud builds submit` submits current working tree (not just committed files), so deploys reflect uncommitted changes too. Commit first to keep history clean.
- The Notion page IDs for platform features follow the pattern `30be1901-e36e-****-****-************` (all under the same parent database).
