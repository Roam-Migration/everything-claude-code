# Session Notes — 2026-03-12 — Platform Map Visibility & Reconciliation

## What was done

### Goal
Three workstreams:
1. Add visibility toggle system to /platform-map (feature-level + section-level)
2. Fix the admin toggle never appearing and table visibility being non-interactive
3. Reconcile platform map entries against actual site content — remove duplicates, fix statuses

---

## Workstream 1: Feature-level visibility (initial)

### `src/app/pages/PlatformMapPage.tsx`
- Added `visible: boolean` filter to `visibleSections` — features with `visible=false` now hidden from staff by default (was previously ignored despite field existing in the type)
- Added `showHidden` state + **"Admin view"** toggle button in filter bar (admin role only)
- "Coming soon" visual treatment for Stub/Planned features: dashed border + Clock badge instead of raw status label
- Hidden features shown with dimmed opacity + EyeOff badge when admin view is active
- Stats bar shows "Hidden (N)" count pill for admins
- Section progress bar computed from visible features only

### `src/app/services/notion.ts`
- Added `updateFeatureVisible(featureId, visible)` — PATCHes `Visible` checkbox on a Platform Feature page via nginx proxy

---

## Workstream 2: Interactive controls + fixes

### Bug: Admin toggle never appeared
The "Show hidden" button was gated by `hiddenCount > 0`, but since all items (static + Notion) had `visible=true`, `hiddenCount` was always 0. Fixed: button now always renders for admin role.

### Table view — Visibility column now interactive
- Visibility cell is a `<button>` for admins — click to flip Visible ↔ Hidden
- Optimistic UI update with Notion write-back; reverts on error with toast

### Card view — per-row admin controls
- When admin view is active, each FeatureRow shows an Eye/EyeOff icon button
- Click to toggle `visible` on that individual feature (Notion write-back)

---

## Workstream 3: Section-level visibility

### `src/app/services/notion.ts`
- Added `updateSectionVisible(featureIds[], visible)` — bulk PATCHes all features in a section
- Fixed `navVisible` derivation: was hardcoded `true`; now `false` when all section features are `visible=false`, inheriting static config baseline

### `src/app/pages/PlatformMapPage.tsx`
- Added `handleToggleSectionVisibility` — optimistic bulk toggle with Notion write-back
- Section card header shows Eye/EyeOff button in admin mode (next to section name)
- Nav-hidden sections appear dimmed + dashed border; still shown in admin view so they can be re-enabled
- Filter keeps nav-hidden sections visible in admin+showHidden mode even with zero visible features

### Result
Sales & Marketing and Finance are now hidden from staff nav. Toggle via Admin view on /platform-map.

---

## Workstream 4: Platform Map Reconciliation

### Notion DB audit (RML Platform Features)
Queried all entries via Notion MCP. Found duplicates from the 2026-03-10 24-entry batch overlapping with existing entries.

### Duplicates suppressed (Visible set to false in Notion; manually deleted by Jackson):
| Entry | Duplicate of | Action |
|-------|-------------|--------|
| Active Matters Overview (31ee1901) | Active Matters Report (31fe1901) | Deleted |
| Training Request Form (31ae1901, Mar 5) | Request Training Form (31fe1901, Mar 10) | Deleted |
| Daily Pulse (30be1901, Feb 18) | Legacy entry superseded by Daily Updates | Deleted |

### Status corrections (Notion + static config):
| Feature | Was | Now |
|---------|-----|-----|
| Fee Calculator | Stub, route: null, source: None | Functional, route: /legal-hub/fees/calculator, source: Static |
| Training Sessions List | Stub, source: None | Functional, source: Notion |

### Static config (`src/app/config/platform-map-config.ts`)
Same corrections applied to fallback data to keep it in sync.

---

## Commits (Rmlintranetdesign)

| Hash | Message |
|------|---------|
| `97dd165` | feat(platform-map): visibility toggle — respect Notion Visible field, admin show-hidden, coming-soon styling |
| `10d01d8` | feat(platform-map): interactive visibility toggle — admin view always on, card + table controls, Notion write-back |
| `939d7bd` | feat(platform-map): section-level nav visibility toggle with Notion write-back |
| `bdda4d3` | fix(platform-map): reconcile static config with actual site content |
| `d944517` | chore: add googleapis dependency |

All pushed to `origin/main` (GitHub: Roam-Migration/Rmlintranetdesign).

---

## Architecture notes

- `visible` on `PlatformFeature` was already typed and mapped from Notion — just not used in the filter
- `navVisible` on `PlatformSectionData` was hardcoded `true` from Notion; now derived from feature visibility
- Visibility writes use the existing nginx proxy (`/api/notion/v1/pages/{id}`) — no backend changes needed
- Optimistic UI pattern used throughout: local state flipped instantly, Notion PATCH in background, revert on error
- Section visibility = bulk feature visibility (no separate Notion "Section" DB needed)
- "Coming soon" is auto-derived from `status=Stub|Planned` + `visible=true` — no extra Notion property

---

## Outstanding / future work

- Add a "Visibility" select property (Visible/Coming Soon/Hidden) to Notion for 3-way explicit control, rather than deriving Coming Soon from status
- Update remaining Notion Platform Feature entries that still have empty Notes fields
- Add `My Workspace` and `Admin Hub` icon entries to `SECTION_ICONS` in PlatformMapPage.tsx (currently falls back to `Layout`)
- Wire up Supabase data source in the legend
- Consider role-based visibility per feature (groundwork laid — `isAdmin` check is in place)
