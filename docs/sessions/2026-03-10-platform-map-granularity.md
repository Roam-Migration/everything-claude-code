# Session Notes — 2026-03-10 — Platform Map Granularity

## What was done

### Goal
Make the RML Intranet platform map more granular: show all items on each page, whether they are functional, what data source they use (Notion/Metabase/Supabase/External/Static), and capture build decisions as notes.

---

## Code changes (Rmlintranetdesign)

### `src/app/types/platform-map.ts`
Added `notes: string` field to `PlatformFeature` interface. Used for internal wiring notes (API endpoints, DB IDs, architectural decisions) visible in table view.

### `src/app/services/notion.ts`
Maps `props.Notes?.rich_text?.[0]?.plain_text` from the Notion Platform Map DB to `feature.notes`. The Notes column already existed in Notion but was never surfaced in the UI.

### `src/app/pages/PlatformMapPage.tsx`
Three new UI capabilities:

1. **Data source filter row** — Second filter row below status tabs. Pills: All / Notion / Metabase / Supabase / External / Static / None. Combines with status filter (AND logic).

2. **Grid/Table view toggle** — Cards (existing) or Table mode. Table view shows dense developer-facing rows: Feature | Section | Route | Status | Source | Description/Notes. Feature names are clickable links when a route exists.

3. **Data source badge on each feature row** — Coloured small badge appears below the status badge on every card row. Badge colours: Notion=violet, Metabase=blue, Supabase=emerald, External=indigo, LocalStorage=amber, Static=neutral, None=muted.

4. **Notes display on feature rows** — Shows as italic muted secondary text below the description when present.

### `src/app/config/content-config.ts`
Expanded `platformMapConfig.sections` static fallback from ~50 items to ~60 granular items. Key additions:

- **My Workspace** (new section): 5 widgets — My Tasks (Notion, Partial), My KPIs (Metabase, Functional), My Role (Notion, Functional), My Schedule (External, Partial), My WIP (Metabase, Functional, role-gated)
- **Admin Hub** (new section): 9 items — Daily Updates Mgmt, Critical Updates Mgmt, Forms Management, User Management, Admin Settings, Notion Integration Status, Announcements (stub), Usage Analytics (stub), Content Publishing Queue (stub)
- **Home**: split into 8 items — Critical Updates Banner, Daily Updates Feed, Daily Updates Archive (/daily-updates), Critical Updates Archive (/critical-updates), Team Calendar Embed, Role-Based Quick Actions, Quick Access Links, Global Search
- **People & Culture**: added Staff Directory & Org Chart (Supabase), Org Intelligence Dashboard (Supabase), Leave Management (External, Partial)
- **Core Operations**: added Document Hub (Notion, Functional)
- **Training & Competency**: added Request Training Form (Notion, Functional), Certifications Register
- **Business Intelligence**: added My Performance Dashboard (/my-performance, Metabase), Team Performance Dashboard (/team-performance, Metabase), Active Matters Report (/business-intelligence/active-matters, Metabase, Partial)

Every item now has a `notes` field documenting: component filename, API endpoint, Notion DB ID, Supabase view/table, or wiring status.

### `CLAUDE.md`
- Section values updated: added `My Workspace` and `Admin Hub`
- Platform Map DB schema documented as a property table (Name, Section, Status, Priority, Route, Description, Data Source, Notes, Visible)

### `src/app/components/org-diagram/OrgDiagram.tsx`
Changed container from `w-full h-full` to `absolute inset-0` to correctly fill the parent flex container.

---

## Notion DB updates (RML Platform Features)

### Schema changes
- **Section select**: added `My Workspace` (gray) and `Admin Hub` (brown)
- **Data Source select**: added `Supabase` (green)

### 24 new entries created
- My Workspace section: 5 items (all with Notes)
- Admin Hub section: 9 items (all with Notes)
- Business Intelligence: My Performance, Team Performance, Active Matters
- People & Culture: Staff Directory & Org Chart, Org Intelligence Dashboard, Leave Management
- Home: Daily Updates Archive, Critical Updates Archive
- Core Operations: Document Hub
- Training & Competency: Request Training Form

---

## Commits (Rmlintranetdesign)

| Hash | Message |
|------|---------|
| `dc64212` | feat: Platform Map — data source filter, grid/table toggle, notes field |
| `59388c6` | docs: platform map — add My Workspace + Admin Hub sections, DB schema table |
| `e84f068` | fix: OrgDiagram use absolute inset-0 to fill parent container |

---

## Outstanding / future work

- Deploy platform map changes to production (Cloud Run `rml-intranet`)
- Update existing Notion Platform Map entries with Notes (currently only new items have notes; old items fetched from Notion have empty notes)
- Deduplicate any Notion entries that overlap with pre-existing items (Daily Pulse, KPI Submissions, etc. may now have duplicates)
- Add `My Workspace` and `Admin Hub` icon entries to `SECTION_ICONS` in `PlatformMapPage.tsx` (currently falls back to `Layout` — could use `User` for My Workspace, `Shield` for Admin Hub)
- Hook up Supabase source colour in the legend section of PlatformMapPage.tsx (legend hardcodes STATUS_CONFIG, not data sources — a data source legend would be useful)
- Wire up remaining stub features across all sections
