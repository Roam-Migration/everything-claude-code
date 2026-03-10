# RML Intranet — GCal DWD + intranet_role Sync Fix

**Date:** 2026-03-10 (session 2)
**Project:** RML Intranet (`/tmp/Rmlintranetdesign`)
**Session picks up from:** 2026-03-10-rml-intranet-my-workspace-redesign.md

---

## What Was Completed

### Fix: intranet_role Preservation in Org Sync

**File:** `backend/src/services/notion-sync.ts` — `syncPeople()`

**Root cause confirmed:** `syncPeople()` builds a `PersonRow` payload that does not include `intranet_role`. Supabase upsert should not overwrite unincluded columns — BUT if the DB default for `intranet_role` is `'staff'` and a person's row doesn't yet exist (e.g. after legacy cleanup), the INSERT path assigns the default, overwriting any previously set admin role.

**Fix:** Before upserting, fetch existing `{ notion_id, intranet_role }` from Supabase. Re-include the existing value in each upsert row for people who already exist. New people (first sync) continue to get the DB default.

```typescript
const { data: existingPeople } = await supabase
  .from('people')
  .select('notion_id, intranet_role')
  .in('notion_id', rows.map((r) => r.notion_id));

const existingRoleMap = new Map(...);
const rowsWithRole = rows.map((r) =>
  existingRoleMap.has(r.notion_id)
    ? { ...r, intranet_role: existingRoleMap.get(r.notion_id) }
    : r,
);
```

**Deployed:** Backend (07:25 UTC)

---

### GCal Service Account (DWD) Integration for My Schedule Widget

**Backend:** `backend/src/routes/calendar.ts` — new `GET /api/calendar/my-events`

Uses Application Default Credentials with `clientOptions: { subject: userEmail }` to trigger domain-wide delegation (DWD). The Cloud Run service account impersonates the user's Google account to read their primary calendar.

Returns:
- `{ dwd_available: true, events: [...] }` when DWD is configured
- `{ dwd_available: false, events: [] }` when DWD is not configured (401/403 from Google)

**Frontend:** `src/app/components/MyWorkspace/MyScheduleWidget.tsx` — rewritten

State machine: `loading → [embed | ready(events) | ready(empty) | error]`

- `dwd_available: false` → falls back to Google Calendar iframe embed (existing behavior, no regression)
- `dwd_available: true` → native event list grouped by date (Today/Tomorrow/day labels), shows time + location, links to Google Calendar

**Deployed:** Frontend + Backend (07:27, 07:28 UTC)

**⚠️ Admin action required for DWD activation:**
1. Google Admin Console → Security → API Controls → Domain-wide Delegation
2. Add service account client ID: `624089053441-compute@developer.gserviceaccount.com`
   - Client ID: find at GCP Console → IAM & Admin → Service Accounts → Details → OAuth 2 Client ID
3. OAuth scope: `https://www.googleapis.com/auth/calendar.readonly`
4. No redeployment needed — activates on next request.

---

### Documentation

- `docs/patterns/notion-my-tasks-widget.md` — Notion v5 query pattern, property names, nginx routing, gotchas
- `docs/patterns/gcal-schedule-widget.md` — embed vs DWD architecture, admin setup, state machine

---

### Linter Change: DEPT_COLORS in notion-sync.ts

Added `DEPT_COLORS` constant to `syncDepartments()` — maps department names to hex colours
for the `departments.color` column (previously hardcoded `null`). Applied by linter/user
post-session and committed to HEAD.

---

## Deployments

| Build | Status | What |
|-------|--------|------|
| Backend `07:18 UTC` | SUCCESS | intranet_role sync fix (notion-sync.ts) |
| Backend `07:25 UTC` | SUCCESS | my-events endpoint (calendar.ts) |
| Frontend `07:27 UTC` | SUCCESS | MyScheduleWidget DWD + native list |

---

## Pattern Docs Written

- `docs/patterns/notion-my-tasks-widget.md` — v5 SDK query, property names, nginx routing, gotchas
- `docs/patterns/gcal-schedule-widget.md` — embed vs DWD, admin setup, state machine, timezone

---

## Handover for Ravi (SysAdmin)

Notion page created with step-by-step DWD setup instructions:
https://www.notion.so/31fe1901e36e815ebaf8d1c7759279f0

Key details:
- Client ID: `103726231682011200791`
- Scope: `https://www.googleapis.com/auth/calendar.readonly`
- Admin URL: `admin.google.com/ac/owl/domainwidedelegation`
- No redeployment needed once saved

---

## Outstanding

- **Task 7: User test Dashboard 529** — manual testing with team members. No code needed.
- **GCal DWD admin setup** — Ravi to complete. Notion page sent: https://www.notion.so/31fe1901e36e815ebaf8d1c7759279f0
