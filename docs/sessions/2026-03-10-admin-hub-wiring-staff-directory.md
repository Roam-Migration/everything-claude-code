# Session: Admin Hub Wiring + Staff Directory Migration
**Date:** 2026-03-10
**Repo:** `/tmp/Rmlintranetdesign` (RML Intranet)
**Branch:** main

---

## Summary

Wired up the Admin Hub stat cards with live data, added Google Calendar leave auto-population to the Daily Update form, replaced the free-text staff name input with a searchable Supabase combobox, removed stub cards, and fully migrated the Staff Directory from the broken Notion `/api/staff` backend to direct Supabase queries.

---

## Changes Deployed

### 1. Admin Hub Stat Cards (`AdminPage.tsx`)
- **Total Users**: live count from `supabase.from('people').select('*', { count: 'exact', head: true }).ilike('employment_status', 'active')`
- **Today's Updates**: added `fetchTodaysUpdateCount()` to `src/app/services/notion.ts` — queries both `dailyUpdates` and `updates` Notion DBs, counts entries for today
- **Page Views**: left hardcoded at 1.2K (no analytics service exists)
- **Active Forms**: hardcoded (wired to forms register count in AdminPage already)
- Removed **Announcements** and **Content Publishing** cards (confirmed empty stubs, no backend)

### 2. Daily Update Form — Calendar Auto-Population (`DailyUpdateForm.tsx`)
- New service: `src/app/services/calendar.ts`
  - Fetches EH import calendar (`j2gm8g6u0rp038bn2j4oee5ha107el40@import.calendar.google.com`) using `VITE_GOOGLE_CALENDAR_API_KEY`
  - Contractor GCal (`c_780037...@group.calendar.google.com`) intentionally excluded — org-restricted, returns 404 with plain API key; requires OAuth/service account
  - Checks `publicHolidays.ts` for AU/MY holidays on the date
  - Returns `{ leaveEntries, publicHolidays, calendarAvailable }`
- On form open or date change: auto-populates Staff on Leave from calendar + shows public holiday amber banner
- Auto-populated entries get blue tint + calendar icon; editing them clears the `auto` flag
- "N from calendar" badge + Refresh button shown when calendar is available

### 3. Staff on Leave — Supabase Combobox (`DailyUpdateForm.tsx`)
- Replaced free-text name input with `StaffCombobox` component
- Uses `ReactDOM.createPortal` — dropdown renders at document body level to escape `overflow-y-auto` modal clipping
- Positioned via `getBoundingClientRect()` on the input ref
- `onMouseDown + e.preventDefault()` prevents blur before dropdown click registers
- Free text allowed for contractors not in the system
- `matchToStaff()` helper: exact → first-name-only → starts-with → contained-in matching

### 4. Admin Users Page — Supabase Migration (`AdminUsersPage.tsx`)
- **Removed**: all Notion/backend calls (`/api/staff`, `/api/staff/deduplicate`, role editing via Notion)
- **Added**: direct Supabase queries:
  - `people` table: `id, first_name, last_name, preferred_name, email, employment_type, employment_status, intranet_role`
  - `v_org_hierarchy` view: `person_id, dept_name, role_title` (note: `role_title` not `role_name`)
- Deduplicates `v_org_hierarchy` by `person_id` in JS (Map, first occurrence wins)
- Detects missing `intranet_role` column via `PGRST204` error → shows migration SQL notice, falls back to `'staff'` for all
- Role editing: `supabase.from('people').update({ intranet_role: newRole }).eq('id', personId)`
- Columns: Name, Email, Department, Position, Type, Intranet Role
- Removed: Notion link, "Clean Duplicates" button, name editing

### 5. `intranet_role` Migration (applied by user in Supabase SQL Editor)
```sql
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS intranet_role TEXT NOT NULL DEFAULT 'staff'
  CHECK (intranet_role IN ('admin','hr','team-leader','operations','legal-staff','contractor','staff'));
```

---

## Bugs Fixed

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `/admin/users` shows "No staff members" + Notion link | Page still called `GET /api/staff` (Notion-backed, returning 500) | Replaced with direct Supabase queries |
| `v_org_hierarchy` 400 error | Query used `role_name`; view actually exposes `role_title` | Changed column name throughout |
| Contractor calendar 404 | `@group.calendar.google.com` is org-restricted, plain API key returns 404 | Removed contractor calendar; fetch EH import only |

---

## Key Patterns Confirmed

- **`v_org_hierarchy` column name**: `role_title` (not `role_name`) — easy to mix up with the `roles` table column
- **Portal dropdown in modal**: `ReactDOM.createPortal` + `getBoundingClientRect()` is the correct pattern for dropdowns inside `overflow-y-auto` containers
- **Supabase count-only query**: `.select('*', { count: 'exact', head: true })` — zero payload, returns only the count
- **PostgREST column-not-found**: returns HTTP 400 with `code: '42703'` in JSON body

---

## Commits
- `6b48e66` feat: wire admin stats, staff combobox, calendar leave auto-populate, Supabase user directory
- `34b4da0` fix: use role_title (not role_name) in v_org_hierarchy query

---

## Remaining / Follow-up Work

### High Priority
1. **Backend `resolveUserRole` middleware** — currently reads intranet role from Notion (`getStaffByEmail`). Should be updated to read `people.intranet_role` from Supabase once confirmed stable. File: `backend/src/auth/auth.ts`.
2. **RLS UPDATE policy for intranet_role** — anon key may not have UPDATE permission on `people` table. If role editing silently fails, run:
   ```sql
   CREATE POLICY anon_update_intranet_role ON people
     FOR UPDATE TO anon
     USING (true)
     WITH CHECK (intranet_role IN ('admin','hr','team-leader','operations','legal-staff','contractor','staff'));
   ```
3. **Contractor leave auto-populate** — currently manual. Could be solved by switching to a service account with domain-wide delegation, or by adding a backend proxy endpoint.

### Lower Priority
4. **Page Views stat** — wire to a real analytics source (Google Analytics, Plausible, or Cloud Run request logs) if needed
5. **Cloud Scheduler for org sync** — daily cron for `POST /api/org/sync` not yet configured

---

## Handover

See handover section below. All changes are committed and deployed to production.
