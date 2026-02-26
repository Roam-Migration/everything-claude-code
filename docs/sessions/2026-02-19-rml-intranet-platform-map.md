# Session: RML Intranet Platform Map

**Date:** 2026-02-19
**Project:** RML Intranet (`/tmp/Rmlintranetdesign`)
**Branch:** `troubleshoot/notion-integration`

---

## What Was Accomplished

1. **Analysed the entire RML Intranet codebase** — mapped all 8 sections, feature status, integrations, and role coverage into a structured platform feature map document.

2. **Created `docs/rml-intranet-platform-feature-map.md`** — comprehensive dev reference with:
   - Mermaid IA diagram
   - Feature status matrix (Functional / Partial / Stub / Planned) for all 35 features across 8 sections
   - Integration map (Notion, Metabase, External)
   - Role coverage table (admin / hr / senior_lawyer / lawyer / paralegal)
   - Gap analysis and prioritised development phases

3. **Built `/platform-map` page** — standalone intranet page (no sidebar) showing feature status in real time, backed by Notion:
   - 3-column section card grid with progress bars
   - Filter tabs: All / Functional / Partial / Stub / Planned
   - Color-coded status badges (emerald / amber / neutral / blue)
   - Functional features are clickable React Router links
   - Skeleton loaders, Sonner toast on refresh, "Synced with Notion" timestamp
   - Static fallback (35 features) works without Notion configured

4. **Created Notion "RML Platform Features" database** — seeded all 35 features with Status, Priority, Section, Description, Data Source, Notes, Visible properties. DB ID: `e38debd2-2692-4e42-ae29-5b5a13fff724`

5. **Added Platform Map to Admin Hub** — card under "User & System Management" section

6. **Fixed and deployed to production** — `https://intranet.roammigrationlaw.com/platform-map`

---

## Technical Decisions

### Standalone page (no sidebar)
Matches the `KPIPage` / `FeedbackPage` pattern. Platform Map is a cross-cutting view of all sections — a sidebar belonging to one section would be misleading.

### Fallback-first state initialisation
```typescript
const [sections, setSections] = React.useState(platformMapConfig.sections); // immediate render
```
Page is usable instantly. Notion fetch happens in background and updates state if successful. `isStale` flag drives the "Showing static data" indicator.

### Static config IS the seed data
`platformMapConfig` in `content-config.ts` doubles as both the static fallback and the initial seed for the Notion database. Single source of truth for the initial 35 features.

### `sectionIconMap` in `fetchPlatformFeatures()`
Notion doesn't store Lucide icon names natively in a usable way. The fetch function builds a map from the static config's icon values (keyed by section name) so the correct icons are preserved when Notion data overrides features.

---

## Critical Deployment Fix

**Root cause of "not visible on production":** `.env` is in `.dockerignore`. Vite bakes `VITE_*` vars into the JS bundle at compile time — Cloud Run's runtime env vars arrive too late. The value must flow through the Docker build pipeline.

**Fix applied:**

`Dockerfile`:
```dockerfile
ARG VITE_NOTION_PLATFORM_FEATURES_DB=
ENV VITE_NOTION_PLATFORM_FEATURES_DB=$VITE_NOTION_PLATFORM_FEATURES_DB
```

`cloudbuild.yaml`:
```yaml
- '--build-arg'
- 'VITE_NOTION_PLATFORM_FEATURES_DB=e38debd2-2692-4e42-ae29-5b5a13fff724'
```

**Pattern to follow for ALL future `VITE_*` variables:**
1. Add `ARG` + `ENV` pair to `Dockerfile` (before `RUN npm run build`)
2. Add `--build-arg` to the docker build step in `cloudbuild.yaml`
3. `.env` is local dev only — never affects production

---

## Files Changed (Intranet)

| File | Change |
|------|--------|
| `src/app/types/platform-map.ts` | Created — types for PlatformFeature, PlatformSectionData, PlatformFeaturesResult |
| `src/app/pages/PlatformMapPage.tsx` | Created — full page component |
| `src/app/config/content-config.ts` | Added `platformMapConfig` export + nav item |
| `src/app/services/notion.ts` | Added `fetchPlatformFeatures()` + `clearPlatformFeaturesCache()` |
| `src/app/App.tsx` | Added route `/platform-map` |
| `src/app/pages/AdminPage.tsx` | Added Platform Map card |
| `Dockerfile` | Added `VITE_NOTION_PLATFORM_FEATURES_DB` build arg |
| `cloudbuild.yaml` | Passed `VITE_NOTION_PLATFORM_FEATURES_DB` to Docker build |

**Commit:** `f7021a3` — `feat: add /platform-map page with Notion live sync`

---

## Gotchas

- **Hero `height` prop**: Only `'short' | 'medium' | 'full'` are valid. `'compact'` throws a TypeScript error.
- **`Card` double-padding**: `Card` has no padding by default (padding is on `CardContent`), but using both `Card` padding and `CardContent` `p-5` stacks. Use `noPadding` on Card when managing layout manually.
- **`SECTION_ICONS` map**: Lucide icon components must be imported and mapped by string name. Notion can't store React components directly.

---

## Lessons Learned

1. **Vite env vars in Docker**: `.env` → local dev only. Production = Docker build args in `cloudbuild.yaml` + `Dockerfile`. This will bite any new `VITE_*` variable added without following the pattern.
2. **Fallback-first pattern is correct for Notion-backed pages**: Initialise with static data, fetch async, update if successful. Never block render on external data.
3. **Platform Map is a living document**: The Notion DB needs to be updated as features are built. Status updates in Notion flow through to staff within the 30-min cache window.

---

## Notion Database

- **Name:** RML Platform Features
- **ID:** `e38debd2-2692-4e42-ae29-5b5a13fff724`
- **URL:** https://www.notion.so/69eba1aab2ba46578130db2b74dd686d
- **Env var:** `VITE_NOTION_PLATFORM_FEATURES_DB=e38debd2-2692-4e42-ae29-5b5a13fff724`
- **Seeded with:** 35 features across 8 sections (Feb 19, 2026)
