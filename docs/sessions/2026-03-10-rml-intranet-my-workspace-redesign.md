# RML Intranet — My Workspace Redesign + Bug Fixes

**Date:** 2026-03-10
**Project:** RML Intranet (`/tmp/Rmlintranetdesign`)
**Session picks up from:** 2026-03-10-spqr-handover.md

---

## What Was Completed

### My Workspace Redesign — WIP Widget + Inline KPI Embeds (Task: High, Effort 5)

**Backend — `GET /api/metabase/wip-url`**
- `lookupDisplayNameByEmail()` — queries `contacts` table directly for `display_name` (simpler than participant_kpis join, doesn't require a KPI row to exist)
- `generateWIPDashboardUrl(name)` — signs Dashboard 529 JWT with `case_manager: [name]` (array — Metabase multi-select requires array even for single value lock)
- `wipDashboardId` = 529 (env: `METABASE_WIP_DASHBOARD_ID`)
- 10-minute in-process cache, same pattern as participant cache

**`MyWIPWidget.tsx`** (new component, full-width row below 4-card grid)
- `legal-staff` → fetches `/api/metabase/wip-url`, renders signed iframe filtered to their matters
- `team-leader` / `manager` → direct link card to Dashboard 529 (they use filters themselves)
- Returns `null` for all other roles

**`MyKPIsWidget.tsx`** (upgraded)
- `legal-staff` → inline Dashboard 694 embed (was: link to `/my-performance`)
- `team-leader` / `manager` → inline Dashboard 694 embed + Team Performance link
- Falls back to link if user has no participant record
- `admin` role: removed special embed — intranet role ≠ job role. Admin shows "not configured" same as contractor.

**`MyWorkspacePage.tsx`** — 4-card 2-col grid unchanged; WIP widget in full-width row below via `space-y-6`

---

### Phase 5 — KPI Dashboard Links on Position Description Cards

**Backend — `GET /api/position-descriptions/kpi-links`**
- Returns static `KPI_DASHBOARD_LINKS` map: KPI name → `{ intranet_path, link_label }`
- Must be registered BEFORE `/:id` route to avoid Express wildcard swallowing it
- Migration `003_kpi_dashboard_links.sql` documents intended Supabase schema — **applied this session**

**KPI mappings:**
| KPI Name | Route |
|----------|-------|
| Billable Hours, Case/Application/Appeal Success Rate, Client Satisfaction | `/my-performance` |
| Case Load Management, Cases Supported, Operational Efficiency | `/business-intelligence/active-matters` |
| Team Productivity | `/team-performance` |

**`PositionDescriptionCard.tsx`** — KPI items show `ExternalLink` icon if a mapping exists; `e.stopPropagation()` prevents card click
**`PeoplePage.tsx`** — fetches `kpiLinks` on mount, passes to each card

---

### Team Tab Removed from Dashboard 529
- Jackson removed via Metabase UI (Tab ID 133 "Team", 2 cards)
- Individual tab (ID 67) remains as the only tab

---

### Bug Fixes

**`/api/notion/my-tasks` 403 → nginx routing**
- Root cause: `location ~ ^/api/notion/(documents|cache)` routed those paths to backend; `my-tasks` fell through to `api.notion.com` proxy and failed the endpoint allowlist
- Fix: `^/api/notion/(documents|cache|my-tasks)`

**`/api/notion/my-tasks` 500 → wrong property names**
- `sorts: [{ property: 'Due' }]` → Tasks DB has no `Due` property (throws 400 from Notion)
- `p.Due?.date?.start` → always null; correct field is `p['Completion Date']?.date?.start`
- Priority values include emoji prefix (`"🔴 Urgent"`) — stripped with regex before returning
- Added `Status != Done/Deprecated` filter to only show open tasks
- Removed server-side sort (client-side `sortTasks()` handles ordering)

**`MyScheduleWidget` — Google Calendar 404**
- Root cause: FullCalendar Google Calendar plugin uses the API, which requires OAuth or public calendar. Private Google Workspace calendars return 404 with a bare API key.
- Fix: replaced FullCalendar entirely with a Google Calendar embed iframe (`calendar.google.com/calendar/embed?src=EMAIL&mode=AGENDA`)
- Embed uses the user's existing browser Google session (staff always authenticated via IAP/Google Workspace)
- No API key required, no 404, shows personal calendar only

**Jackson's `intranet_role` reverted to `admin`**
- Found as `staff` in Supabase `people` table (ID `76ea90f7-15a8-40d4-a864-a6a534dd4ebb`)
- Updated via PATCH to `admin`
- Note: org sync from Notion may be overwriting intranet_role — check if sync preserves it

---

## Key Patterns

**WIP embed vs performance embed:**
- Dashboard 529 (WIP) filters on `case_manager` string → JWT param must be `[displayName]` (array)
- Dashboard 694 (Performance) filters on `participant_id` integer → JWT param is scalar
- Different backend lookups: WIP uses `contacts.display_name`; performance uses `participant_kpis.participant_id`

**Intranet role ≠ job role:**
- `admin` is an intranet permission level (can see admin hub, all BI dashboards)
- KPI dashboards should be assigned based on position, not intranet access level
- Currently configured: `legal-staff`, `team-leader`, `manager`

**Google Calendar embed vs API:**
- API (FullCalendar plugin) = requires OAuth or public calendar → wrong for private Workspace calendars
- Embed iframe = uses browser Google session → works for any staff member logged into Google

---

## Deployments

| Build | Revision | What |
|-------|----------|------|
| Frontend | `rml-intranet-00115-bc9` | WIP widget + KPI embeds |
| Backend | `rml-intranet-forms-api-00064-5sn` | wip-url endpoint |
| Frontend | `rml-intranet-00116-m6q` | Phase 5 KPI links |
| Backend | `rml-intranet-forms-api-00067-wnt` | kpi-links route |
| Frontend | `rml-intranet-00117-ng7` | nginx my-tasks routing fix |
| Backend | `rml-intranet-forms-api-00068-lh9` | getTasksByUser property fixes |
| Frontend | `rml-intranet-00118-6sf` | GCal embed widget |
| Frontend | `rml-intranet-00124-nmv` | Remove admin KPI embed |

---

## Known Issues / Not Fixed

1. **CSP inline style warnings** — Set by Google IAP on authenticated responses. FullCalendar (still used in leave calendar on PeoplePage) sets inline styles that violate IAP's nonce-based CSP. Console-only, no user impact.
2. **Google Calendar OAuth** — embed approach works but is read-only and shows Google Calendar UI chrome. Proper integration (event list in native UI) requires domain-wide delegation service account.
3. **`intranet_role` sync stability** — Jackson's role reverted from `admin` to `staff` at some point. Likely the Notion→Supabase org sync is overwriting it. The sync should preserve `intranet_role` when updating people records.

---

## Outstanding Tasks (Notion)

- Task 7: User test Dashboard 529 with team members (High, manual)
- Google Calendar proper integration (OAuth/service account delegation)
- intranet_role preservation in org sync
- Document My Tasks Widget (Notion integration pattern)
- Document My Schedule Widget (GCal embed pattern)
