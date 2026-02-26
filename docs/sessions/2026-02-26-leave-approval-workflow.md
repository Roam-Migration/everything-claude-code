# Session: Leave Approval Workflow

**Date:** 2026-02-26
**Project:** RML Intranet
**Branch:** `troubleshoot/notion-integration`
**Continued from:** `docs/sessions/2026-02-26-calendar-pipeline-completion.md`

---

## What Was Accomplished

1. **Calendar embeds live** — PeoplePage Leave Calendar and HomePage Team Calendar now show live GCal iframes (EH leave + contractor GCal combined)
2. **Leave approval workflow built and deployed** — full request → approval flow via intranet forms
3. **Frances Lee part-time configured** — `days_per_week = 2.5` in `staff_name_lookup`
4. **Metabase cards 1955 + 1956 updated** — denominators scale by `days_per_week / 5.0` per person

---

## Calendar Embeds

Both pages now use this combined embed URL (EH + contractor in one iframe):
```
https://calendar.google.com/calendar/embed
  ?src=j2gm8g6u0rp038bn2j4oee5ha107el40%40import.calendar.google.com
  &src=c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837%40group.calendar.google.com
  &ctz=Australia%2FMelbourne&showTitle=0&showPrint=0&showTabs=1&showCalendars=1
```

"Add to Google Calendar" link points to contractor GCal via `siteConfig.externalLinks.googleCalendar`.

---

## Leave Approval Workflow

### Architecture
- **Frontend**: `/people/leave` → `LeavePage.tsx` — request form + my history + manager approval panel
- **Backend**: `/api/leave/*` — new `backend/src/routes/leave.ts`
- **Storage**: Supabase `form_submissions` table (via self-bootstrapping `leave-request` form definition)
- **Notifications**: Notion dual-write (creates page in `NOTION_LEAVE_REQUESTS_DB_ID` if configured)

### API Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/leave/request` | IAP user | Submit leave request |
| `GET`  | `/api/leave/requests` | IAP user | List (own for staff, all for manager) |
| `PATCH`| `/api/leave/requests/:id/status` | manager/admin | Approve or reject |

### Form Fields
- Leave Type: Annual Leave / Personal/Carer's Leave / Long Service Leave / Time in Lieu / Other
- Start Date, End Date
- Working Days (auto-calculated Mon–Fri, editable for part-time staff)
- Notes (optional)

### Role Behaviour
- **Staff/Contractor**: see own requests only; can submit new requests
- **Manager/Admin**: additionally see Pending Approvals section at top of page; can approve/reject with optional comment

### Post-Approval Process
After approval in the intranet:
- Notion page status updated to `Approved`
- **Manual step required**: HR/manager enters leave in Employment Hero (EH staff) OR adds event to contractor GCal (contractors) so nightly sync picks it up for Metabase

### Self-Bootstrapping Form Definition
On first request to `/api/leave/*`, the route checks for `slug = 'leave-request'` in Supabase `form_definitions`. If absent, it creates the definition with the correct schema. No manual seeding required.

---

## Frances Lee Part-Time Configuration

- `staff_name_lookup.days_per_week` column added: `DECIMAL(3,1) NOT NULL DEFAULT 5.0`
- Frances Lee (pid=22684): `days_per_week = 2.5`
- All other staff: `5.0` (full-time)

### Future updates
If other part-time staff are onboarded, update:
```sql
UPDATE staff_name_lookup SET days_per_week = <N> WHERE participant_id = <pid>
```

---

## Metabase Cards Updated

**Cards:** 1955 (Recording Compliance) and 1956 (Staff Performance Summary)

### Change
`adj` CTE now includes `snl.days_per_week` in both SELECT and GROUP BY.
Denominators now scale working days by the person's schedule:

```sql
-- Before
NULLIF(w.mth_elapsed - ISNULL(d.adj_mth, 0), 0)

-- After
NULLIF(w.mth_elapsed * ISNULL(d.days_per_week, 5.0) / 5.0 - ISNULL(d.adj_mth, 0), 0)
```

For Frances (2.5 days/week): a 20-working-day month = 10 expected days (50% scale).
Full-time staff (5.0/5.0 = 1.0): no change in behaviour.

---

## Outstanding Items

1. **Leave approval process — post-approval reminder flow**: currently manual. Future: could auto-notify HR via email or Slack on approval.
2. **GCal → Notion Meetings DB sync** — not yet built (separate task)
3. **Country column cleanup** — Nabilah Amani and Shahrul Izwani candidates for MY; requires confirmation
4. **Notion `NOTION_LEAVE_REQUESTS_DB_ID`** — not configured in backend env; Notion dual-write for leave requests is currently silently skipped. Create a Notion DB for leave requests and add the env var to `backend/cloudbuild.yaml` → `--update-secrets`.

---

## Key File Paths

| File | Purpose |
|------|---------|
| `src/app/pages/LeavePage.tsx` | Leave request + approval UI |
| `src/app/services/leave.ts` | Frontend API client |
| `backend/src/routes/leave.ts` | Leave API backend |
| `src/app/pages/PeopleSection.tsx` | Routes `/people/leave` to LeavePage |
| `src/app/pages/PeoplePage.tsx` | REQUEST LEAVE button → navigate |
| `src/app/pages/HomePage.tsx` | Team Calendar embed |
| `src/app/config/content-config.ts` | googleCalendar URL |
