# SPQR Session — Staff Filter, Active Matters, My Workspace Proposal

**Date:** 2026-03-10
**Project:** SPQR Dashboard / RML Intranet

---

## Completed This Session

### Task 3 — Staff Dropdown Filtering (vw_staff_members SQL view)

**Problem:** Case manager and senior associate filter dropdowns in Dashboard 529
(question 1688 Staff WIP) showed all participants including clients, sponsors, and
company accounts (e.g. "ActionStep Licensing New Zealand Ltd").

**Solution path:**
- Option A (Metabase Linked Filters) blocked — error: "Incompatible filters. There
  needs to be a foreign-key relationship between the fields connected to these filters."
- Option B (SQL view) succeeded.

**View created on htmigration SQL Server:**
```sql
CREATE VIEW dbo.vw_staff_members AS
SELECT DISTINCT ap.display_name
FROM dbo.action_participants ap
INNER JOIN dbo.contacts c ON c.display_name = ap.display_name
WHERE ap.participant_type_name IN (
    'Case_Manager',
    'Responsible_Partner_Senior_Associate',
    'Paralegal',
    'Registered_Migration_Agent'
)
AND c.is_company = 'F'
```

**Key learnings:**
- First attempt used `c.e_mail LIKE '%@roammigrationlaw.com'` — excluded 4 staff with
  blank emails (Ahmad Iqmal, Frances Lee, Alexander Long name casing mismatch,
  Martin Russell/Taashahyani Parmeswaran not in contacts by that name)
- `is_company = 'F'` is the correct discriminator — excludes company accounts cleanly
- "ActionStep Licensing NZ Ltd" had `participant_type_name = 'Case_Manager'` + `is_company = 'T'`
- Result: 40 staff members (vs 1000+ previously)
- "Service Account" and "SYSTEM ADMINISTRATOR" remain (is_company=F, have RML emails) — minor
- Metabase DDL via `/api/dataset`: "The statement did not return a result set" = **success**
  for DDL statements — not an error

**Metabase remapping steps:**
1. Admin → Databases → htmigration → Sync database schema
2. Admin → Re-scan field values
3. Question 1688 → Edit → Variables panel (`{x}` icon)
4. `case_manager` variable: Field to map to → `Vw Staff Members > Display Name`
5. `senior_associate` variable: same
6. Widget type changed from `String contains` to `String is` for dropdown behaviour

**Metabase field IDs:**
- `action_participants.display_name` = field 4232
- `vw_staff_members.display_name` = field 8746 (table ID 1057)

---

### Task 4 — MyKPIsWidget Wired to KPI Dashboard Links

`MyKPIsWidget.tsx` updated — replaced `MetabasePlaceholder` stub with real navigation:
- `legal-staff` → "My Performance" link → `/my-performance`
- `team-leader`, `manager`, `hr` → "My Performance" + "Team Performance" links
- `admin` → unchanged (inline Dashboard 529 embed)
- `operations` → unchanged (Notion placeholder)
- Removed unused `METABASE_ROLES` constant

---

### Task 5 — Active Matters Page Deployed

New page: `/business-intelligence/active-matters`

**Files changed:**
- `src/app/pages/ActiveMattersPage.tsx` — direct link to Dashboard 727, usage guide
  cards (filtering, urgent/stale indicators)
- `src/app/pages/BusinessIntelligenceSection.tsx` — added route
- `src/app/config/navigation.ts` — added "Active Matters" nav item

**Platform Map entry:** https://www.notion.so/31ee1901e36e8126bcb9fbf128747442
- Section: Business Intelligence, Status: Functional, Data Source: Metabase

---

## Architecture Decision: My Workspace Redesign Proposal

Discussed and documented as a Notion task. Key design decisions:

**Layout:**
```
[ My Tasks ]    [ My KPIs (role-based) ]
[ My Role  ]    [ My Schedule          ]
[ My WIP — full width, legal roles only ]
```

**WIP Widget:**
- Full-width `MyWIPWidget` below existing 4 cards, shown for legal-staff/team-leader/manager
- `legal-staff`: signed embed of Dashboard 529 with `case_manager` locked to user's display_name
- `team-leader`/`manager`: direct link to Dashboard 529 (unfiltered, use filters themselves)
- Requires new backend endpoint: `GET /api/metabase/wip-url`
- Signs Dashboard 529 with `case_manager` parameter locked (same pattern as performance-url)

**My KPIs by role (inline embeds, not just links):**
| Role | Content |
|------|---------|
| legal-staff | Metabase Dashboard 694 signed embed |
| team-leader/manager | Dashboard 694 + team Dashboard 695 link |
| sales | HubSpot embed (future) |
| operations | Notion embed |
| hr | Team KPIs link |

**Why WIP and KPIs stay separate dashboards:**
- Dashboard 529 (WIP) = filter-based, multi-user
- Dashboard 694 (KPIs) = JWT-signed, participant_id locked per user
- Architecturally incompatible in a single Metabase dashboard

**Team tab on Dashboard 529:** Remove — Senior Associate filter on Individual tab
covers team leader use case completely.

---

## Notion Tasks Created

| Task | Priority | URL |
|------|----------|-----|
| My Workspace Redesign — WIP Widget + Role-based KPI Embeds | High | https://www.notion.so/31fe1901e36e81de8550f8402739bcd4 |
| Remove Team tab from Dashboard 529 | Low | https://www.notion.so/31fe1901e36e8164a0d4fa486cba9deb |
| Document and wire My Tasks widget (Notion integration) | Normal | https://www.notion.so/31fe1901e36e8151a188ea6ad5b998cb |
| Document and wire My Schedule widget (Google Calendar integration) | Normal | https://www.notion.so/31fe1901e36e81b69888e7b0406a30c3 |

## Tasks Marked Done

- Task 3: Optimize SPQR dashboard staff dropdown filtering
- Task 4: Configure Metabase KPI Dashboards for Legal Staff My Workspace
- Task 5: Deploy SPQR Dashboard Link to RML Intranet

---

## Environment Reference

- htmigration DB ID: 34 | Metabase collection: 133
- Dashboard 529: Staff WIP (question 1688 — case_manager/senior_associate/stage/matter_type filters)
- Dashboard 694: Individual Performance (signed embed, participant_id locked)
- Dashboard 695: Team KPI Summary (all-staff)
- Dashboard 727: Active Matters Overview (direct link, no signing needed)
- vw_staff_members: table ID 1057, display_name field ID 8746
