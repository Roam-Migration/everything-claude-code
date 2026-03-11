# RML Intranet — UX Optimization Phase 1 + Phase 2

**Date:** 2026-03-11
**Repo:** Roam-Migration/Rmlintranetdesign
**Commit:** `1b8d0ed`

---

## Context

Audit identified the platform was at risk of sprawling due to test pages, dead routes, monolithic files, and missing access control. Two phases executed in this session.

---

## Phase 1: Nav Gating + Route Cleanup

### What was built

**`PageVisibilityContext`** (`src/app/contexts/PageVisibilityContext.tsx`)
- Fetches `fetchPlatformFeatures()` from Notion Platform Features DB on mount
- Maps section names to routes via `SECTION_NAME_TO_ROUTE` lookup
- Exposes `isRouteVisible(path): boolean` — returns `true` while loading (fail-open, prevents flash)
- Section visibility = has ≥1 Notion feature with `Visible: true` in that section

**`NavGatedSection`** (`src/app/components/NavGatedSection.tsx`)
- Wraps every section route in `App.tsx`
- Renders `<ComingSoon variant="page">` when `isRouteVisible(route)` is false
- Uses `useLocation().pathname` to detect current route

**`ProtectedRoute`** (`src/app/components/ProtectedRoute.tsx`)
- Role-based access control at route level
- Props: `roles: UserRole[]`, `children: ReactNode`
- Renders shared access-denied UI (styled card with Shield icon) if role not in allowed list
- Applied to `/admin/*` with `roles={['admin', 'hr']}`

**`NotFoundPage`** (`src/app/pages/NotFoundPage.tsx`)
- 404 page with "Back to Home" link
- Registered as `<Route path="*">` catch-all in App.tsx

**Deleted test pages:**
- `NotionTestPage.tsx` (511L)
- `NotionTest2Page.tsx` (1,213L)
- `RolesTestPage.tsx` (99L)

**Dead stub routes removed** from: LegalHubSection, OperationsSection, SalesMarketingSection, FinanceSection

**Static section navVisible** added to all 10 sections in `content-config.ts`:
- Sales & Marketing: `navVisible: false`
- Finance: `navVisible: false`
- All others: `navVisible: true`

**`platformMapConfig` extracted** to `src/app/config/platform-map-config.ts` (809L):
- `content-config.ts` reduced from 1,472L → 665L (55% smaller)
- Extracted file uses `import type { PlatformSectionData }` only (icon names are strings)

**Header** filtered via `isRouteVisible()` — nav items for hidden sections don't appear.

---

## Phase 2: Admin Split + Role Cleanup

### AdminPage split (834L → ~270L)

`AdminFormsPage` extracted with:
- Supabase `forms` table query (`loadForms()`)
- `submissionCounts` state
- `formsLoading` state
- `getFormTypeColor()`, `getFormTypeLabel()` helpers
- Forms Management table (status, submissions, actions)
- Direct Integration Forms table (Actionstep, Xero)

`AdminPage` retains:
- Stats row (3 cards: Forms, Users, Settings)
- Operational cards (Content, Forms link, Users, Settings, Analytics, Data)
- No more forms state/effects

### Route
`AdminSection.tsx` → added `<Route path="forms" element={<AdminFormsPage />} />`
`additional-navigation.ts` → Forms Management path fixed to `/admin/forms`

### UserRole type fix
`'manager'` removed from `UserRole` union — was never a valid backend role, all routes using it were unreachable. Replaced with `'staff'`.
- `UserRoleContext.tsx` — knownRoles array updated
- `MyWIPWidget.tsx` — removed `role === 'manager'` condition
- `MyKPIsWidget.tsx` — same fix

### Redundant isAdmin guards removed
`AdminUsersPage.tsx`, `AdminSettingsPage.tsx` — removed `const isAdmin` + early-return block. `ProtectedRoute` at route level handles authorization.

---

## Key Patterns Learned

### Notion-driven nav visibility (fail-open)
When async data drives UI visibility, default to `true` (visible) while loading. Only hide after data confirms the section should be hidden. Prevents flash of "Coming Soon" on page load for functional routes.

### Route-level vs component-level auth
Component-level guards (`if (!isAdmin) return <AccessDenied />`) scatter auth logic and are easy to miss. Route-level `ProtectedRoute` wrapper in `App.tsx` is the single source of truth — simpler to audit.

### Monolith extraction checklist
When extracting a large config array:
1. Check what types it imports — if using string icon names (not Lucide components), the extracted file needs no icon imports
2. Use `sed` or `head`/`tail` to split precisely at line boundaries
3. Update all import sites (`notion.ts`, `PlatformMapPage.tsx`)

---

## Future Work (Phases 3–5 from audit)

- Phase 3: Performance — lazy loading, route-based code splitting, React.memo on heavy components
- Phase 4: State management — replace scattered local state with Zustand or TanStack Query
- Phase 5: Component library — extract shared patterns (cards, tables, stat widgets) into `@roam-migration/components`
- Deploy validation: run `vite build` in CI on every PR (currently manual)
- Platform Map Notion entry: add entries for `AdminFormsPage` (/admin/forms)
- Dependabot: 4 high vulnerabilities flagged on push — triage and resolve
