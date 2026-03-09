# Session: SPQR Individual & Team KPI Dashboard — Signed Embedding

**Date:** 2026-03-09
**Project:** SPQR Dashboard / RML Intranet
**Notion Task:** https://www.notion.so/31ee1901e36e813ebb0acbf9a6cb6f5e (DONE)

---

## What Was Built

Full end-to-end implementation of Notion task "Build Individual & Team KPI Dashboards via Signed Embedding". All 5 architecture steps completed.

---

## Metabase: New Cards

| Card | ID | SQL approach |
|---|---|---|
| My KPI Summary — Jan–Mar 2026 | 2311 | Card 2278 SQL + `AND participant_id = {{participant_id}}` in staff CTE |
| My Monthly Performance Trend — 2026 | 2312 | Unpivoted monthly data (3 rows × 7 columns). Template tag: `participant_id`. Bar chart viz. |
| My Open Matters | 2313 | `actions` JOIN `action_participants` WHERE Case_Manager = {{participant_id}} AND status=Active. Columns: File Ref, Matter Name, Visa Type, Stage, Days Open, Last Activity. |

All cards use `{{participant_id}}` as a `number` template tag (required).

## Metabase: New Dashboards

| Dashboard | ID | Cards | Embedding |
|---|---|---|---|
| Individual Performance Dashboard | 694 | 2311, 2312, 2313 | `participant_id = locked` — JWT must supply value, user cannot change |
| Team KPI Summary — Jan–Mar 2026 | 695 | 2278 | No locked params — all staff visible |

Signed embedding enabled on both. Embed secret already in GCP Secret Manager as `metabase-embed-secret`.

---

## Backend Changes (`rml-intranet-forms-api`)

### MetabaseService.ts

New methods added:
- `lookupParticipantIdByEmail(email)` — queries htmigration via Metabase `/api/dataset` API. Caches result in-process (10-min TTL) to avoid repeat DB round-trips.
- `generatePerformanceDashboardUrl(participantId)` — signs JWT with `participant_id` locked, 30-min expiry.
- `generateTeamDashboardUrl()` — signs JWT with empty params, 30-min expiry.

### routes/metabase.ts

New endpoints:
- `GET /api/metabase/performance-url` — resolves current user's participant_id from IAP email, returns signed URL for Dashboard 694. Returns 404 if email not in htmigration.
- `GET /api/metabase/team-performance-url` — restricted to admin/hr/team-leader via `requireRole`. Returns signed URL for Dashboard 695.

### cloudbuild.yaml

Added env vars:
- `METABASE_PERFORMANCE_DASHBOARD_ID=694`
- `METABASE_TEAM_DASHBOARD_ID=695`

Added secret:
- `METABASE_API_KEY=metabase-api-key:latest` (already existed in GCP Secret Manager)

---

## Frontend Changes (RML Intranet)

### New pages

| File | Route | Access |
|---|---|---|
| `MyPerformancePage.tsx` | `/my-performance` | All authenticated staff |
| `TeamPerformancePage.tsx` | `/team-performance` | admin / hr / team-leader only |

Both pages use same iframe pattern as `BusinessIntelligencePage.tsx`:
- Fetch signed URL from backend on mount
- Metabase postMessage resize listener (debounced, no pixel buffer)
- Loading / error / not-found states
- Lock icon + note about Jan 2026 KPI data quality issue

### App.tsx

Two new routes added:
```tsx
<Route path="/my-performance" element={<MyPerformancePage />} />
<Route path="/team-performance" element={<TeamPerformancePage />} />
```

---

## Platform Map

Two new Notion Platform Map entries created:
- My Performance Dashboard — `/my-performance` — Business Intelligence — Functional — Metabase
- Team Performance Dashboard — `/team-performance` — Business Intelligence — Functional — Metabase

---

## Email → participant_id Mapping

Resolved live at request time via `contacts.e_mail` field in htmigration. Full mapping discovered:

| Name | participant_id | Email |
|---|---|---|
| Ahmad Iqmal | 24002 | (none) |
| Carolina Fernandez | 1683 | c.fernandezruys@roammigrationlaw.com |
| Davaan Jayabalan | 3687 | d.jayabalan@roammigrationlaw.com |
| Frances Lee | 22684 | (none) |
| Hani Azid | 30734 | f.azid@roammigrationlaw.com |
| Jackson Taylor | 63 | j.taylor@roammigrationlaw.com |
| Jisha John | 2494 | j.john@roammigrationlaw.com |
| Kylie Treser | 1836 | k.treser@roammigrationlaw.com |
| Martin Russell | 62843 | (none) |
| Nabilah Amani | 18227 | n.amani@roammigrationlaw.com |
| Sarah Fazal | 3733 | s.najihah@roammigrationlaw.com |
| Shahrul Izwani | 1767 | s.izwani@roammigrationlaw.com |
| Taashahyani Parmeswaran | 64691 | (none) |
| Varsha Kattoor | 175 | v.kattoor@roammigrationlaw.com |
| Vikneswaran Khetre | 3688 | v.khetre@roammigrationlaw.com |
| Yashvinee Sivalingam | 14729 | y.sivalingam@roammigrationlaw.com |

**4 staff without emails in contacts table** (Ahmad, Frances, Martin, Taashahyani). They will see the 404/not-found state when visiting `/my-performance`. To fix: add their email addresses in Actionstep → contacts.e_mail.

---

## Deploy

Both backend and frontend deployed via Cloud Build. Build IDs:
- Backend: `336dfbf7-0ac9-47d3-a9fc-f73e23fe74d6` — SUCCESS
- Frontend: `a82bf71b-6dfd-4c55-a1ab-cf7e4a0cb6fe` — SUCCESS

Routes live at: https://intranet.roammigrationlaw.com/my-performance and /team-performance (IAP-protected, redirect to Google login for unauthenticated users).

---

## Known Follow-ups

1. **4 staff without email mappings** — Ahmad Iqmal, Frances Lee, Martin Russell, Taashahyani Parmeswaran. Add email addresses in Actionstep to enable their individual dashboard access.
2. **Jan 2026 KPI hours** — still 7.6 (daily rate). Will resolve once Actionstep data is corrected by management.
3. **MyWorkspace integration** — Notion task "Configure Metabase KPI dashboards for legal staff My Workspace" (https://www.notion.so/31ae1901e36e813b8b18fefd81463bfb) — add a `/my-performance` link widget to the MyWorkspacePage.
