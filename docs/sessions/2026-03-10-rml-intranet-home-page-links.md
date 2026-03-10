# Session: RML Intranet — Home Page Quick Actions + Calendar Wiring

**Date:** 2026-03-10
**Repo:** Roam-Migration/Rmlintranetdesign
**Commit:** c3f17cf
**Deployed:** Yes — https://intranet.roammigrationlaw.com

---

## What Was Done

### 1. Quick Actions — all placeholder URLs wired

`src/app/components/RoleBasedQuickActions.tsx`

All `url: '#'` entries resolved across 5 roles (Legal Staff, Team Leader, Operations, HR, Admin).

| Action | Destination |
|---|---|
| My Timesheet (was Upload Document) | Actionstep timesheet, dynamic date via `new Date().toISOString().split('T')[0]` |
| Document Hub (all roles) | `/core-operations` |
| Request / Review Leave (all roles) | `https://secure.employmenthero.com/users/quick_sign_in` |
| IT Ticket (renamed from IT Support) | IT Support Google Form |
| Room Booking (all roles) | Room booking responder Google Form |
| Training Schedule | `/training-competency` |
| Staff Directory | `/people` |
| CPD Tracking (HR) | Google Sheets CPD log |
| Policy Updates (HR) | Internal Policies Drive folder |
| Team Calendar (Team Leader) | Team Google Calendar |
| Approve Time (Team Leader) | Actionstep timekeeping |
| Matter Review (Team Leader) | Actionstep matter search |
| Assign Tasks (Team Leader) | Actionstep main |
| Executive Dashboard (Admin) | `/business-intelligence` |
| Financial Reports (Admin) | `/finance` |
| Staff Overview (Admin) | `/admin/users` |
| System Settings (Admin) | `/admin` |

External links auto-open in new tab via `isExternal = url.startsWith('http')` check on each action.

URL constants extracted to module-level (`EMPLOYMENT_HERO_URL`, `IT_SUPPORT_FORM_URL`, etc.) to avoid duplication across roles.

### 2. Actionstep URL corrections

- Log Time: `...time-entry/edit?action_id=` (trailing query param required)
- New Matter: `...workflow/actions/create` (not `create-select-type`)

### 3. Intranet Feedback button — Daily Pulse header

Added filled `#d05c3d` button with `MessageSquare` icon next to the Daily Pulse heading. Removed "Intranet Feedback" from the Support card in Quick Resources (now more prominent at the top).

### 4. Employment Hero URL corrected

Correct URL: `https://secure.employmenthero.com/users/quick_sign_in`
Updated in: `RoleBasedQuickActions.tsx`, `content-config.ts`, `PeoplePage.tsx`

### 5. People page leave buttons

REQUEST LEAVE and VIEW BALANCE converted from `<button onClick={navigate}>` / wrong EH URL to `<a>` tags pointing to Employment Hero (open in new tab).

### 6. Support card cleanup

Removed "Weekly KPI Report" from the Quick Resources Support card (`content-config.ts`).

### 7. Google Calendar API key — Secret Manager

- Secret created: `google-calendar-api-key` in GCP Secret Manager (`rmlintranet` project)
- `cloudbuild.yaml` updated: switched from empty `${_GOOGLE_CALENDAR_API_KEY}` substitution variable to `availableSecrets` pattern (same as `SUPABASE_ANON_KEY`)
- Removed the now-unused `substitutions` block entry
- Deployed — team leave and contractor calendar should now render in TeamCalendar

**Caveat:** Calendars are set to "visible to Roam users" (org-restricted). If events still don't appear post-deploy, the issue is that API keys are unauthenticated and cannot read org-restricted calendars. Fix would be: make calendars fully public, or switch to a service account with domain-wide delegation.

---

## Files Changed

| File | Change |
|---|---|
| `src/app/components/RoleBasedQuickActions.tsx` | All URLs wired, labels renamed, new tab logic |
| `src/app/config/content-config.ts` | Actionstep URLs corrected, EH URL updated, Weekly KPI removed |
| `src/app/pages/HomePage.tsx` | Feedback button added to Daily Pulse header |
| `src/app/pages/PeoplePage.tsx` | Leave buttons → Employment Hero links |
| `cloudbuild.yaml` | Google Calendar API key via Secret Manager |

---

## Remaining / Follow-up

- **Room Booking label**: originally discussed renaming to "Equipment Ticket" — user corrected mid-session to keep "Room Booking" with the responder form URL. Worth confirming if a separate Equipment Ticket action is still wanted.
- **Calendar visibility**: verify team leave is rendering post-deploy. If not, calendar sharing settings need review (public vs org-only).
- **Onboard Staff** (Operations + HR): still `url: '#'` — no onboarding system exists yet.
