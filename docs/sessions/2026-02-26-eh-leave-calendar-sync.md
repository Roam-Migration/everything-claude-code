# Session: EH Leave Calendar Sync

**Date:** 2026-02-26
**Project:** RML Intranet / Google Workspace Automation
**Branch:** `fix/p1-documentation-updates` (ECC)
**Continued from:** `docs/sessions/2026-02-26-leave-approval-workflow.md`

---

## Context

During leave workflow design it was discovered that:
- All staff (employees and contractors) submit leave through Employment Hero
- EH has no export API or webhook — leave data is not programmatically accessible
- When leave is submitted, Aaron receives an email from `no-reply@employmenthero.com`
  with subject `New leave calendar event for [Name]` and an `invite.ics` attachment
- Employee leave already syncs to the EH calendar feed embedded in the intranet
- Contractor leave was being manually added to the "Roam Contractor Leave" GCal

This session automated that manual step via Google Apps Script.

---

## What Was Accomplished

1. **EH Leave → Contractor GCal sync built** — Google Apps Script polls Aaron's Gmail, parses ICS attachments, and creates events on the contractor GCal
2. **Intranet leave form deprecated** — LeavePage simplified to EH redirect for all roles
3. **Role type bug fixed** — `UserRoleContext.tsx` was missing `contractor` and `manager` role values
4. **Fuzzy name matching implemented** — handles EH's inconsistent name formats (first-name-only vs full name)
5. **Trigger schedule configured** — Mon–Fri at 8 am, 12 pm, 5 pm Melbourne time
6. **Transfer ownership process documented** — trigger must be created by Aaron (not Jackson) to bind to Aaron's Gmail

---

## Google Apps Script Architecture

**File:** `scripts/eh-leave-calendar-sync/Code.gs`
**Deployed:** `script.google.com` (standalone project, owned by Aaron after transfer)

### Flow
```
Gmail search: from:no-reply@employmenthero.com subject:"New leave calendar event for" -label:eh-leave-processed
    │
    ├─ findContractor(emailName, roster) → fuzzy prefix match
    │    └─ No match → SKIPPED (employee) + label thread
    │
    ├─ getICSAttachment() → parse invite.ics
    │    └─ parseICS() → { start, end, summary }
    │
    ├─ isDuplicate() → check GCal for existing event in date window
    │
    └─ createAllDayEvent() → Roam Contractor Leave GCal
         └─ label thread as "eh-leave-processed"
```

### Key Implementation Details

**Idempotency:** Gmail label `eh-leave-processed` is applied to every processed thread. Gmail search permanently excludes labelled threads — no database or state needed.

**ICS date handling:** Both ICS DTEND and Apps Script `createAllDayEvent` use exclusive end dates. ICS DTEND is passed directly — no off-by-one adjustment required.

**Weekday guard:** Apps Script can't combine day-of-week + time-of-day in one trigger. Three daily `atHour()` triggers fire every day; the function exits immediately on `getDay() === 0 || 6`.

**Trigger ownership:** `GmailApp` reads the authenticated user's Gmail. Triggers must be created by Aaron's account — creating under Jackson's account reads the wrong inbox.

### Fuzzy Name Matching

EH sends names inconsistently:
- `nabilah` → matches roster `Nabilah Amani`
- `shahrul` → matches roster `Shahrul Izwani`
- `ahmad iqmal ashraf bin sahrudin` → exact match

```javascript
function findContractor(emailName, contractors) {
  const query = emailName.toLowerCase().trim();
  for (const fullName of contractors) {
    const stored = fullName.toLowerCase().trim();
    if (stored === query) return fullName;                  // exact
    if (stored.startsWith(query + ' ')) return fullName;   // email is first-name prefix
    if (query.startsWith(stored + ' ')) return fullName;   // roster is shorter
  }
  return null;
}
```

The `+ ' '` suffix prevents partial word matches.

**Multi-prefix names:** If EH alternates between starting words (e.g. `"ahmad"` vs `"iqmal"` for Ahmad Iqmal Ashraf Bin Sahrudin), add a second roster row with the alternative as the leading name. No code changes required.

### Roster Sheet

Google Sheet: "EH Leave Sync – Contractor Roster"
- **Contractors tab**: Column A — canonical full names (one per row)
- **Log tab**: Auto-populated audit trail (CREATED / SKIPPED / DUPLICATE / ERROR)

---

## Leave Form Deprecation

Intranet leave form (`backend/src/routes/leave.ts`, `src/app/services/leave.ts`) was deprecated:
- **Root cause**: All staff use EH for leave — intranet form was unnecessary double-handling
- **Frontend**: `LeavePage.tsx` simplified to EH redirect (two CTA buttons + policy reminders + calendar embed)
- **Backend routes preserved**: `backend/src/routes/leave.ts` retained — no harm, removes need for backend deploy
- **Role fork removed**: Removed `isContractor` conditional; all roles now see EH buttons

---

## Role Type Bug Fix

`UserRoleContext.tsx` defined `UserRole` as:
```typescript
type UserRole = 'legal-staff' | 'operations' | 'hr' | 'admin' | 'team-leader'
```

`LeavePage.tsx` checked `role === 'contractor'` and `role === 'manager'` — both always false.

**Fix:** Added `'contractor'` and `'manager'` to the type and the `RoleSwitcher.tsx` ROLES array.

**Lesson:** When adding role-gated features, check `UserRoleContext.tsx` first — the type is the source of truth for valid role values. The `RoleSwitcher` dropdown drives all dev testing.

---

## Calendars Reference

| Calendar | ID | Purpose |
|----------|----|---------|
| EH leave feed | `j2gm8g6u0rp038bn2j4oee5ha107el40@import.calendar.google.com` | Nightly sync from Employment Hero (employees) |
| Roam Contractor Leave | `c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837@group.calendar.google.com` | Manual contractor leave events (now auto-populated by Apps Script) |

Both are combined in the intranet Leave Calendar and Team Calendar iframes.

---

## Setup Checklist (for Aaron)

- [ ] Apps Script transferred to Aaron's Google Drive
- [ ] Roster Sheet transferred to Aaron's Google Drive
- [ ] Contractor names added to Contractors tab (verify against email subject formats)
- [ ] Aaron has write access to "Roam Contractor Leave" GCal
- [ ] Aaron runs `createTrigger()` under his own account
- [ ] Aaron authorises Gmail + Calendar + Sheets scopes
- [ ] Verify: forward one EH leave email → check Log tab for CREATED row

---

## Outstanding Items

1. **GCal → Notion Meetings DB sync** — still not built (separate task)
2. **Country column cleanup** — Nabilah Amani and Shahrul Izwani candidates for `country = 'MY'`; requires confirmation
3. **Post-approval reminder flow** — leave approval still manual; no auto-notify to HR on contractor approval

---

## Key File Paths

| File | Purpose |
|------|---------|
| `scripts/eh-leave-calendar-sync/Code.gs` | Google Apps Script (ECC repo) |
| `scripts/eh-leave-calendar-sync/README.md` | Setup guide |
| `src/app/pages/LeavePage.tsx` | Simplified EH redirect page |
| `src/app/contexts/UserRoleContext.tsx` | Role type definitions — add new roles here |
| `src/app/components/RoleSwitcher.tsx` | Dev role switcher — add new roles to ROLES array |
| `backend/src/routes/leave.ts` | Leave API (retained, unused by frontend) |
