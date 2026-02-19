# Session: RML Intranet — Stub Coverage, BI Cleanup & Admin Hub

**Date:** 2026-02-19
**Branch:** `troubleshoot/notion-integration`
**Commits:** `4e3d0eb`, `e11cbb9`

---

## What Was Accomplished

### 1. ComingSoon Component (new)

Created `/src/app/components/ComingSoon.tsx` — a reusable stub indicator component with three variants:

- `page` — full-page replacement (plum gradient hero + white card + back link)
- `section` — inline placeholder (dashed cream-tinted border box, pulsing `animate-ping` ring)
- `overlay` — wraps existing children with blur/dim + frosted glass panel on top

**Props:** `variant`, `title`, `description`, `estimatedDate`, `icon`, `children`, `showBackLink`, `minHeight`

### 2. Hero Search → SearchModal Connection

- Added `onSearchClick?: () => void` to `HeroProps`
- Search bar div becomes `role="button"` with `onClick` handler when prop is provided
- Input is `readOnly` when acting as trigger (prevents mobile keyboard pop)
- Added `⌘K` hint badge to the search bar
- `HomePage` now passes `onSearchClick={() => setSearchOpen(true)}` and renders `<SearchModal>`

### 3. Stub Coverage Across All Pages

Replaced all bare placeholder divs with `<ComingSoon variant="section">`:

| Page | Feature | Notes |
|---|---|---|
| `HomePage` | Team Calendar | `minHeight={400}` |
| `PeoplePage` | Leave Calendar | `minHeight={300}` |
| `CoreOperationsPage` | Team Timelines | Dynamic title from active tab |
| `LegalHubPage` | SLA Summary | `minHeight={128}` |

Also added 3 **new stub sections** to `LegalHubPage` (were in platform map but had no page presence):
- `#sop-downloads` — SOP Downloads
- `#application-checklists` — Application Checklists
- `#legal-precedents` — Legal Precedents

`content-config.ts` routes updated: `null → '/legal-hub#anchor'` for all three.

### 4. Business Intelligence Cleanup

Removed Executive Dashboard and Team Leader Dashboard from **all 5 reference locations**:

1. `navigation.ts` — removed from `businessIntelligenceNavigation`
2. `BusinessIntelligenceSection.tsx` — removed `executive` + `team-leader` routes + "Future routes" comment
3. `BusinessIntelligencePage.tsx` — removed commented `activeDashboard` state + commented multi-dashboard selector section
4. `SearchModal.tsx` — removed two search index entries
5. `content-config.ts` — removed `static-bi-4`, `static-bi-5` platform map entries + commented multi-dashboard config block

### 5. Admin Hub Platform Map Section

Added new "Admin Hub" section to `platformMapConfig` with 9 features:

| Feature | Status | Data Source |
|---|---|---|
| Daily Updates Management | Functional | Notion |
| Critical Updates Management | Functional | Notion |
| Forms Management | Partial | Supabase |
| User Management | Functional | External |
| Announcements | Stub | None |
| Content Publishing | Stub | None |
| System Settings | Stub | None |
| Usage Analytics | Stub | None |
| Notion Integration Status | Partial | Notion |

**Computed progress: ~44%** (3 Functional + 2 Partial × 0.5 = 4.0 / 9)

Also:
- Extended `DataSource` type in `platform-map.ts` with `'Supabase'`
- Imported `Shield` into `PlatformMapPage.tsx` and added to `SECTION_ICONS` resolver

### 6. Admin Routing Consolidation (second commit)

- `App.tsx`: Replaced flat `/admin` + `/admin/users` routes with `/admin/*` wildcard → `<AdminSection />`
- `additional-navigation.ts`: Added `adminNavigation` (6 items with hash anchors for each section)
- `content-config.ts`: Reverted BI dashboard ID from 628 → 529 (stable production dashboard)

---

## Technical Decisions

### Three-variant ComingSoon design
**Why:** Different contexts need different treatments. Full-page stubs (pages not built yet) need a full-page replacement to avoid blank pages. Section stubs (features not wired) need an inline indicator that doesn't break layout. Overlay stubs are available for future use when partial content exists alongside a stub area.

### `readOnly` input on Hero search trigger
**Why:** Making the input `readOnly` when `onSearchClick` is set prevents mobile keyboards from popping up on tap, since the input is purely cosmetic — the `onClick` immediately opens the modal.

### `Supabase` added to `DataSource` type
**Why:** Forms Management reads from Supabase, not Notion and not an external link. Using `'External'` would have been misleading (`External` is reserved for outbound links like Actionstep/ImmiAccount). Adding the specific source keeps the platform map accurate as a diagnostic tool.

### Icon resolver pattern in PlatformMapPage
**Why:** The platform map config stores icon names as strings (so it can be driven by Notion data). `SECTION_ICONS` is the resolver map. Any new section icon must be: (1) imported at the top of the file, and (2) registered in `SECTION_ICONS`.

---

## Patterns Established

### "5-ring cleanup" for feature removal
When removing a feature entirely, check all 5 rings:
1. **Routing** — route definitions in section files
2. **Navigation config** — nav items in `navigation.ts` / `additional-navigation.ts`
3. **Page-level UI** — any commented or active JSX blocks
4. **Search index** — `SEARCH_INDEX` in `SearchModal.tsx`
5. **Data config** — platform map entries in `content-config.ts`

Missing any one ring leaves orphaned UI or broken links.

### Platform map audit process
Before adding a section to the platform map, audit each feature area:
- Can the button be clicked and does something happen? → `Functional` or `Partial`
- Is the data real or hardcoded? → affects `dataSource` and often `status`
- Does the route exist and render correctly? → determines `route` value

---

## Incomplete / Future Work

- **Announcements** (`/admin#content-management`) — wire up "Create Announcement" button to a form/Notion action
- **Content Publishing** (`/admin#content-management`) — replace hardcoded counts with real pending queue data
- **System Settings** (`/admin#user-system-management`) — implement Site Configuration, Navigation Menu, External Links management
- **Usage Analytics** (`/admin#analytics-insights`) — replace hardcoded 1,234 / 32 / 1.2K with real data (Plausible or server logs)
- **Notion Integration Status** (`/admin#data-management`) — replace hardcoded "Connected" with live ping checks; wire "Configure Databases" and "Sync Now"
- **Forms Management** (`/admin#forms-management`) — wire "View Submissions", "Edit Form", and "Create New Form" actions
- **Leave Calendar** (`/people`) — embed Google Calendar once configured
- **Team Calendar** (`/`) — embed Google Calendar once configured
- **SLA Metrics** (`/legal-hub`) — wire Metabase data source
- **Team Timelines** (`/operations`) — wire Metabase Gantt chart per team
- **SOP Downloads / Application Checklists / Legal Precedents** (`/legal-hub`) — link real PDF/document sources

---

## Files Changed

```
src/app/components/ComingSoon.tsx          (new)
src/app/pages/AdminSection.tsx             (new — was pre-existing untracked)
src/app/components/Hero.tsx                (onSearchClick prop)
src/app/components/SearchModal.tsx         (removed 2 BI stub entries)
src/app/config/content-config.ts           (stubs, platform map, BI cleanup)
src/app/config/navigation.ts               (removed BI nav items)
src/app/config/additional-navigation.ts    (added adminNavigation)
src/app/pages/AdminPage.tsx                (removed commented multi-dashboard code)
src/app/pages/BusinessIntelligencePage.tsx (removed commented code)
src/app/pages/BusinessIntelligenceSection.tsx (removed routes)
src/app/pages/CoreOperationsPage.tsx       (ComingSoon for timelines)
src/app/pages/HomePage.tsx                 (search connect, ComingSoon for calendar)
src/app/pages/LegalHubPage.tsx             (3 new sections + SLA ComingSoon)
src/app/pages/PeoplePage.tsx               (ComingSoon for leave calendar)
src/app/pages/PlatformMapPage.tsx          (Shield icon)
src/app/types/platform-map.ts             (Supabase DataSource)
src/app/App.tsx                            (admin/* routing)
```
