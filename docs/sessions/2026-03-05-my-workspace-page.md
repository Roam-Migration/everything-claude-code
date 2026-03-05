# Session: My Workspace Page — RML Intranet

**Date:** 2026-03-05
**Branch:** main
**Commits:** `8b41201` (training requests), `c2b5f57` (My Workspace)
**Deployed:** both frontend + backend to production

---

## What Was Built

### My Workspace Page (`/my-workspace`)
Personal command centre for all RML staff. Replaces Platform Map in the nav (route retained).

**Files created:**
- `src/app/pages/MyWorkspacePage.tsx` — 2×2 widget grid, dark header with time-aware greeting
- `src/app/components/MyWorkspace/MyTasksWidget.tsx`
- `src/app/components/MyWorkspace/MyKPIsWidget.tsx`
- `src/app/components/MyWorkspace/MyRoleWidget.tsx`
- `src/app/components/MyWorkspace/MyScheduleWidget.tsx`

**Files modified:**
- `src/app/config/content-config.ts` — nav swap: Platform Map → My Workspace
- `src/app/App.tsx` — added `/my-workspace` route
- `src/app/contexts/UserRoleContext.tsx` — added `userEmail`; `/api/user` fetch on mount now hydrates email, name, role from IAP identity (overwrites localStorage — IAP is authoritative)
- `backend/src/services/notion.ts` — added `getTasksByUser(email)` + `NotionTask` interface
- `backend/src/routes/notion.ts` — added `GET /api/notion/my-tasks`

---

## Technical Decisions

### Two-step Notion identity resolution
`getTasksByUser` can't filter by email directly — Notion people properties store Notion user IDs, not emails.
Flow: `notion.users.list()` → match `person.email` → get Notion user ID → `dataSources.query` with `Driver: { contains: notionUser.id }`.

**Gotcha:** `@notionhq/client` v5 removed `notion.databases.query` — use `notion.dataSources.query({ data_source_id, filter, sorts })` exclusively. First backend deploy failed on this; caught in build logs and fixed before frontend deploy.

### UserRoleContext IAP hydration
The new `useEffect` in UserRoleProvider calls `/api/user` on mount and authoratively sets role/name/email from the backend. This means:
- The role switcher in Settings will be overridden on next page load
- No stale role in localStorage after a role change in Notion
- `userEmail` is always IAP-verified (empty string only during the brief mount window)

### Notion Tasks DB ID
From memory: `4b3348c5-136e-4339-8166-b3680e3b6396`
Overridable via `NOTION_TASKS_DB_ID` env var in `backend/cloudbuild.yaml`.

**Important:** The Notion integration token needs **"Read user information"** capability enabled in Notion Settings → Integrations → your integration. Without it, `notion.users.list()` returns an empty array and all users get empty task lists.

### MyScheduleWidget
Uses FullCalendar `listWeek` view with `googleCalendarId: userEmail`. Works within Google Workspace domain without extra OAuth — calendar API key + default "See all event details" domain sharing is sufficient. Falls back gracefully if `VITE_GOOGLE_CALENDAR_API_KEY` not set.

### MyKPIsWidget
Role-conditional rendering:
- `admin` → Metabase signed-URL embed (dashboard 529)
- `legal-staff`, `team-leader`, `manager` → "KPI dashboards being configured" placeholder
- `operations`, `hr` → "Ops KPI tracking via Notion" placeholder
- `contractor` → generic "not configured" message

---

## Training Requests Feature (also committed this session)
Pre-existing work that was already deployed, committed in the same session:
- `src/app/components/RequestTrainingModal.tsx` — staff training request form
- `backend/src/routes/training-requests.ts` — creates Notion page in Training Requests DB
- `nginx.conf.template` — added `/api/training-requests` proxy location
- `src/app/components/TeamCalendar.tsx` + `src/app/data/publicHolidays.ts`

---

## Outstanding / Out of Scope

- **Actionstep task integration** — AS API access pending; placeholder note in widget
- **Ops Notion KPI DB** — DB ID not confirmed; placeholder only
- **Sales HubSpot integration** — planned but no `sales` role in UserRole type
- **Home page redesign (Option 4)** — post-My-Workspace trial
- **Notion integration token** — confirm "Read user information" capability is enabled

---

## Verification Checklist

1. ✅ Nav: My Workspace in header; Platform Map removed from nav (route still works)
2. ✅ `/my-workspace` loads without 404
3. ✅ Both builds deployed successfully: backend `6ec9037b`, frontend `0dc1bc7f`
4. ⬜ My Tasks: confirm tasks appear for a real user (requires Notion "Read user information" cap)
5. ⬜ My KPIs: admin sees Metabase embed; ops/hr see Notion placeholder
6. ⬜ My Schedule: FullCalendar shows personal events (requires VITE_GOOGLE_CALENDAR_API_KEY set and calendar accessible)
7. ⬜ Mobile: verify single-column stack below md breakpoint
