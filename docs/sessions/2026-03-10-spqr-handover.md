# SPQR Session Handover — 2026-03-10

**Written:** 2026-03-10
**Picks up from:** 2026-03-09-spqr-handover.md

---

## What Was Completed This Session

### Task 3 — Staff Dropdown Filtering (DONE)
- Created `dbo.vw_staff_members` on htmigration SQL Server (field ID 8746, table ID 1057)
- Filters to staff roles + `is_company = 'F'` — 40 staff, no clients/sponsors
- Remapped `case_manager` and `senior_associate` variables in question 1688 (Staff WIP)
  from `action_participants.display_name` (field 4232) to `vw_staff_members.display_name`
- Widget type changed to `String is` for dropdown behaviour
- Dashboard 529 filter dropdowns now show ~40 staff names only

### Task 4 — MyKPIsWidget Links (DONE)
- `legal-staff` → "My Performance" link → `/my-performance`
- `team-leader`, `manager`, `hr` → "My Performance" + "Team Performance" links
- Already deployed (committed in prior session, deployed 2026-03-09)

### Task 5 — Active Matters Page (DONE)
- `/business-intelligence/active-matters` — direct link to Dashboard 727
- Nav item added, route added, Platform Map entry created
- Already deployed

---

## Remaining Tasks (Priority Order)

### Task — My Workspace Redesign: WIP Widget + Role-based KPI Embeds
**Notion:** https://www.notion.so/31fe1901e36e81de8550f8402739bcd4
**Priority:** High | **Effort:** 5

**The proposal (agreed this session):**

Layout:
```
[ My Tasks ]    [ My KPIs (role-based) ]
[ My Role  ]    [ My Schedule          ]
[ My WIP — full width, legal roles only ]
```

**WIP Widget:**
- New `MyWIPWidget.tsx` — full-width, below existing 4 cards
- `legal-staff`: signed embed of Dashboard 529 with `case_manager` locked to user's display_name
- `team-leader`/`manager`: direct link to Dashboard 529 (unfiltered — they use filters themselves)
- New backend endpoint required: `GET /api/metabase/wip-url`
  - Same pattern as `GET /api/metabase/performance-url`
  - Lookup user's `display_name` from `contacts` table via participant_id
  - Sign Dashboard 529 JWT with `case_manager` parameter locked
  - Return signed URL
- Key files:
  - Backend: `MetabaseService.ts`, `backend/src/routes/metabase.ts`
  - Frontend: `MyWorkspacePage.tsx`, new `MyWIPWidget.tsx`
  - Reference: `MyPerformancePage.tsx` for iframe pattern

**My KPIs widget (future upgrade — not yet built):**
Upgrade from link-based to inline embed by role:
| Role | Content |
|------|---------|
| legal-staff | Metabase Dashboard 694 signed embed (inline) |
| team-leader/manager | Dashboard 694 inline + team Dashboard 695 link |
| sales | HubSpot embed (future) |
| operations | Notion embed |
| hr | Team KPIs link |
Currently ships links only — inline embed upgrade is part of this task.

**Build order:**
1. Backend `GET /api/metabase/wip-url` (needs display_name lookup from contacts)
2. `MyWIPWidget.tsx` — full-width iframe with loading/error states
3. Wire into `MyWorkspacePage.tsx` conditionally by role
4. Upgrade `MyKPIsWidget` from links to inline embed for legal roles

---

### Task — Remove Team Tab from Dashboard 529
**Notion:** https://www.notion.so/31fe1901e36e8164a0d4fa486cba9deb
**Priority:** Low | **Effort:** 1

Metabase UI only. Edit Dashboard 529 → delete Team tab. Senior Associate filter on
Individual tab covers the team leader use case.

---

### Task — Document My Tasks Widget (Notion Integration)
**Notion:** https://www.notion.so/31fe1901e36e8151a188ea6ad5b998cb
**Priority:** Normal | **Effort:** 2

`MyTasksWidget.tsx` in My Workspace pulls from Notion Tasks DB. Needs:
- Platform Map entry (currently undocumented)
- Technical doc: auth pattern, DB query, token expiry handling
- File: `src/app/components/MyWorkspace/MyTasksWidget.tsx`

---

### Task — Document My Schedule Widget (Google Calendar Integration)
**Notion:** https://www.notion.so/31fe1901e36e81b69888e7b0406a30c3
**Priority:** Normal | **Effort:** 2

`MyScheduleWidget.tsx` pulls from Google Calendar. Needs:
- Platform Map entry (currently undocumented)
- Technical doc: GCal API pattern, OAuth scopes, auth flow
- File: `src/app/components/MyWorkspace/MyScheduleWidget.tsx`

---

### Task 6 — Phase 5: Link Position Description KPIs to Metabase Dashboards
**Notion:** https://www.notion.so/309e1901e36e812ebc2ff2322048fb01
**Priority:** High | **Effort:** 5

Create KPI mapping table in Supabase linking PD KPIs to Metabase dashboard URLs.
Not scoped this session — fetch task page at session start for details.

---

### Task 7 — User Test SPQR Dashboard with Team Members
**Notion:** https://www.notion.so/308e1901e36e81cdbf3bee66650e51cc
**Priority:** High | **Effort:** 2

Share Dashboard 529 with 2-3 team members. Test:
- Dropdown multi-select filters (now showing ~40 staff — verify)
- Data accuracy vs Actionstep
- Combinations: staff + matter type + stage

Dashboard URL: https://wealth-fish.metabaseapp.com/dashboard/529-intranet-basic

---

## Environment Quick Reference

### Metabase
- Instance: `wealth-fish.metabaseapp.com`
- API key: GCP Secret Manager `metabase-api-key` (project: `rmlintranet`)
- DB ID: 34 (htmigration SQL Server) | Collection: 133 (SPQR Dashboards)
- Dashboard 529: Staff WIP (question 1688, filters: case_manager/senior_associate/stage/matter_type)
- Dashboard 694: Individual Performance (signed embed, participant_id locked)
- Dashboard 695: Team KPI Summary (all-staff)
- Dashboard 727: Active Matters Overview (direct link, no signing)
- `vw_staff_members`: table 1057, field 8746

### RML Intranet
- Frontend repo: `/tmp/Rmlintranetdesign`
- Backend repo: `/tmp/Rmlintranetdesign/backend`
- Deploy frontend: `gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet` (from repo root)
- Deploy backend: `cd /tmp/Rmlintranetdesign/backend && gcloud builds submit --config cloudbuild.yaml --project=rmlintranet`
- Live: `intranet.roammigrationlaw.com`

### htmigration Key Tables
- `actions` — matters
- `action_participants` — participants per matter (participant_type_name for role)
- `contacts` — staff details including `display_name`, `e_mail`, `is_company`
- `vw_staff_members` — staff-only display names (created this session)
- `participant_kpis` — KPI targets by participant/year/month
- `view_combination_key_dates` — deadline dates per matter

### Known Issues
1. 4 staff missing from vw_staff_members: Ahmad Iqmal (blank email in contacts, but IS in view via is_company fix), Frances Lee (same) — actually both now present. Martin Russell and Taashahyani Parmeswaran still absent (not in contacts by those names).
2. "Service Account" and "SYSTEM ADMINISTRATOR" appear in vw_staff_members (is_company=F) — minor, harmless for filtering.
3. 4 staff without email see 404 on `/my-performance`: Ahmad Iqmal, Frances Lee, Martin Russell, Taashahyani Parmeswaran. Fix: add email in Actionstep → contacts.e_mail.
4. Jan 2026 KPI hours appear as 7.6 (daily rate) — Actionstep data entry issue, management aware.
