# Session Notes — 2026-03-10 — Quick Action IT Equipment Ticket

## What was done

Replaced the "Room Booking" quick action button with "IT Equipment Ticket" across all 5 role entries in `RoleBasedQuickActions.tsx`.

### Change

**File:** `src/app/components/RoleBasedQuickActions.tsx`

- All 5 role entries (Legal Staff, Team Leader, Operations, HR, Admin) had:
  `{ label: 'Room Booking', icon: Briefcase, url: ROOM_BOOKING_URL, group: 'operations' }`
- Changed to:
  `{ label: 'IT Equipment Ticket', icon: Ticket, url: IT_SUPPORT_FORM_URL, group: 'operations' }`
- `Ticket` icon and `IT_SUPPORT_FORM_URL` constant were already present in the file

### Commit

| Hash | Message |
|------|---------|
| `eeba3bc` | fix: replace Room Booking with IT Equipment Ticket in quick actions |

Deployed to production (`rml-intranet` Cloud Run) — build `0972882b`, 2m37s, SUCCESS.
