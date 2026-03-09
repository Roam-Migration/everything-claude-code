# SPQR Session Handover — Next Session Starting Point

**Written:** 2026-03-09
**Covers:** Sessions completed today + context for task 3 onward

---

## What Was Completed This Session (2026-03-09)

### Task 1 — Individual & Team KPI Dashboards via Signed Embedding (DONE)

- **Dashboard 694** — Individual Performance Dashboard (signed embed, `participant_id` locked in JWT)
- **Dashboard 695** — Team KPI Summary — Jan–Mar 2026 (all-staff, no locked params)
- **Cards:** 2311 (My KPI Summary), 2312 (My Monthly Trend), 2313 (My Open Matters)
- **Backend:** `MetabaseService.ts` — `lookupParticipantIdByEmail()`, `generatePerformanceDashboardUrl()`, `generateTeamDashboardUrl()`
- **Routes:** `GET /api/metabase/performance-url`, `GET /api/metabase/team-performance-url`
- **Frontend:** `MyPerformancePage.tsx` (`/my-performance`), `TeamPerformancePage.tsx` (`/team-performance`)
- Both routes deployed and live at intranet.roammigrationlaw.com

### Task 2 — Add Visualization Cards to Active Matters Dashboard (DONE)

- **Dashboard 727** — Active Matters Overview (Collection 133)
- **Cards:** 2344 (by Case Manager), 2345 (by Stage), 2346 (by Visa Type), 2347 (KPI: Total), 2348 (KPI: % Stale), 2349 (KPI: Urgent)
- Native SQL on `htmigration.dbo.actions` — model 1685 excluded (has `SELECT TOP 100`)
- Dedup pattern: `ROW_NUMBER() OVER (PARTITION BY action_id ORDER BY participant_id DESC)`
- **CDN limitation:** Metabase Cloud blocks PUT /api/dashboard/{id} with 7+ dashcards. Hard limit is 6 per PUT. Card 1630 (Advanced Multi-Filter) not added — do via Metabase UI manually if needed.
- Dashboard not yet linked from RML Intranet (separate task below)

---

## Remaining Tasks (Priority Order)

### Task 3 — Optimize SPQR Dashboard Staff Dropdown Filtering
**Notion:** https://www.notion.so/309e1901e36e81bbbcdfd24842cd8796
**Priority:** Normal

**Problem:** Case manager and senior associate filter dropdowns show ALL participants (clients, sponsors, suppliers). Root cause: filters map to `action_participants.display_name` which includes all participant types.

**Recommended approach — Option A: Metabase Linked Filters**
1. Open Dashboard (Active Matters Overview v2 — the original MVP dashboard with filters)
2. Edit dashboard → open `case_manager` filter settings
3. Toggle "Limit this filter's choices" ON → link to: `matter_type`, `stage` filters
4. Repeat for `senior_associate` filter

This narrows dropdown to only staff who appear in the current filtered result set. No database changes needed.

**Fallback — Option B: Create staff view (if Option A insufficient)**
```sql
CREATE VIEW htmigration.dbo.vw_staff_members AS
SELECT DISTINCT display_name
FROM htmigration.dbo.action_participants
WHERE participant_type_name IN (
    'Case_Manager',
    'Responsible_Partner_Senior_Associate',
    'Paralegal',
    'Registered_Migration_Agent'
)
```
Remap filter parameters to `vw_staff_members.display_name`. Requires DB CREATE VIEW permission — verify with Metabase MCP first (`validate-sql-server-query`).

**Note:** The Active Matters Overview v2 dashboard with native filter parameters is a DIFFERENT dashboard from the new Dashboard 727 (which has native SQL cards, no filter connectivity). The filtering task applies to the original MVP dashboard.

**Success criteria:** Dropdowns show <50 values, no clients or sponsors visible.

---

### Task 4 — Configure Metabase KPI Dashboards for Legal Staff My Workspace
**Notion:** https://www.notion.so/31ae1901e36e813b8b18fefd81463bfb
**Priority:** Normal

**Context:** `MyWorkspacePage.tsx` has a `MyKPIsWidget` component that shows a placeholder for legal-staff, team-leader, and manager roles. Dashboard 694 (Individual Performance Dashboard) now exists and is signed-embedded at `/my-performance`.

**What needs doing:**
1. In `MyWorkspacePage.tsx`, add a link/widget that points to `/my-performance` for all staff roles, and `/team-performance` for team-leader/admin/hr
2. The widget should not embed the dashboard again (that's what `/my-performance` does) — just show a card with a link + brief description
3. Alternatively: if `MyKPIsWidget` was intended to embed the dashboard inline within My Workspace, extend `GET /api/metabase/performance-url` to also work within the widget context (same endpoint, same signed URL)

**Key files:**
- `MyWorkspacePage.tsx`: `/tmp/Rmlintranetdesign/src/app/pages/MyWorkspacePage.tsx`
- `MyPerformancePage.tsx`: `/tmp/Rmlintranetdesign/src/app/pages/MyPerformancePage.tsx` (reference for iframe pattern)
- Backend endpoint: `GET /api/metabase/performance-url` already returns a signed URL

---

### Task 5 — Deploy SPQR Dashboard Link to RML Intranet
**Notion:** https://www.notion.so/309e1901e36e8165babbf28c710d14a1
**Priority:** High

**Context:** Dashboard 727 (Active Matters Overview) is live in Metabase but not accessible from the intranet. Unlike the KPI dashboards (which use signed embedding), this dashboard is non-sensitive — team members can access it directly in Metabase.

**What needs doing:**
1. Decide: direct Metabase link, or signed embedding? Direct link is simpler (no backend needed, dashboard is not sensitive)
2. Add a link in the Business Intelligence section of the intranet (`BusinessIntelligenceSection.tsx`)
3. Dashboard URL: `https://wealth-fish.metabaseapp.com/dashboard/727`
4. Or create an embedded page like `BusinessIntelligencePage.tsx` using a signed URL if embedding is preferred
5. Create Platform Map Notion entry for the new page/link
6. Announce to team (chat or meeting)

**User training points (from task page):**
- Red rows = Urgent (deadline ≤14 days)
- Orange rows = Stale (>30 days no activity)
- Filters = dropdowns for case manager, matter type, stage

---

### Task 6 — Phase 5: Link Position Description KPIs to Metabase Dashboards
**Notion:** https://www.notion.so/309e1901e36e812ebc2ff2322048fb01
**Priority:** TBC — fetch this task page at session start, content not loaded this session

---

### Task 7 — User Test SPQR Dashboard with Team Members
**Notion:** https://www.notion.so/308e1901e36e81cdbf3bee66650e51cc
**Priority:** TBC — fetch at session start for specifics

---

## Environment Quick Reference

### Metabase
- Instance: `wealth-fish.metabaseapp.com`
- API key: GCP Secret Manager — `metabase-api-key` (project: `rmlintranet`)
- DB ID: 34 (htmigration SQL Server)
- Collection: 133 (SPQR Dashboards)
- CDN limit: max 6 dashcards per PUT `/api/dashboard/{id}`

### RML Intranet
- Frontend repo: `/tmp/Rmlintranetdesign`
- Backend repo: `/tmp/Rmlintranetdesign/backend`
- Deploy frontend: `gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet` (from repo root)
- Deploy backend: `cd /tmp/Rmlintranetdesign/backend && gcloud builds submit --config cloudbuild.yaml --project=rmlintranet`
- Live: `intranet.roammigrationlaw.com` (IAP-protected, Google login)

### Metabase MCP (for SQL validation)
- Location: `~/.claude/mcp-servers/metabase/`
- Tools: `get-database-schema`, `validate-sql-server-query`, `test-metabase-query`
- Always validate SQL Server syntax before using in cards — SQL Server ≠ PostgreSQL

### htmigration Key Tables
- `actions` — matters (status, matter_type, case_manager, relevant dates)
- `action_participants` — participants per matter (participant_type_name for role filtering)
- `participant_kpis` — KPI targets by participant, year, month
- `contacts` — staff contact details including `e_mail` for participant_id lookup
- `view_combination_key_dates` — last activity dates per matter

---

## Known Issues / Follow-ups Carried Forward

1. **Card 1630 on Dashboard 727** — Advanced Multi-Filter not added (CDN 6-card limit). Add via Metabase UI.
2. **4 staff without email in htmigration** — Ahmad Iqmal, Frances Lee, Martin Russell, Taashahyani Parmeswaran. They see 404 on `/my-performance`. Fix: add email in Actionstep → contacts.e_mail.
3. **Jan 2026 KPI hours** — appear as 7.6 (daily rate) due to Actionstep data entry issue. Management aware.
