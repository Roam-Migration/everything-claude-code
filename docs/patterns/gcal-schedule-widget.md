# Pattern: Google Calendar Schedule Widget (My Schedule)

**App:** RML Intranet
**File:** `src/app/components/MyWorkspace/MyScheduleWidget.tsx`
**Backend:** `backend/src/routes/calendar.ts` → `GET /api/calendar/my-events`

---

## Two Modes

### Mode A — Embed (current default, no admin setup needed)

```
Frontend → iframe src="https://calendar.google.com/calendar/embed?src=EMAIL&..."
```

- Uses the user's **existing browser Google session** — works for any staff member authenticated via IAP/Google Workspace
- Shows Google Calendar UI chrome (not native intranet styling)
- No API key required, no backend involvement
- Does NOT work in incognito or for users not logged into Google

### Mode B — DWD / Service Account (requires one-time admin setup)

```
Frontend → GET /api/calendar/my-events
Backend → Google Calendar API (impersonating userEmail via DWD)
Frontend → native event list in intranet styling
```

The widget checks `dwd_available` in the response and renders accordingly. Mode B activates automatically once DWD is configured — no redeployment needed.

---

## DWD Admin Setup (one-time, requires Google Workspace Super Admin)

1. Go to [Google Admin Console](https://admin.google.com) → **Security** → **API Controls** → **Domain-wide Delegation**
2. Click **Add new** and enter:
   - **Client ID:** find at GCP Console → IAM & Admin → Service Accounts → `624089053441-compute@developer.gserviceaccount.com` → Details → OAuth 2 Client ID
   - **OAuth Scopes:** `https://www.googleapis.com/auth/calendar.readonly`
3. Save. No Cloud Run redeployment needed — the next request will succeed.

---

## Backend: `GET /api/calendar/my-events`

```ts
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  clientOptions: { subject: userEmail },   // DWD — impersonate user
});
```

- Uses Application Default Credentials (ADC) — the Cloud Run service account key
- `subject` triggers domain-wide delegation
- Returns `{ dwd_available: true, events: [...] }` on success
- Returns `{ dwd_available: false, events: [] }` if 401/403 (DWD not configured)
- Events: `id, summary, start, end, allDay, location, htmlLink` — 20 max, 14-day window

---

## Nginx

`/api/calendar` is already proxied to the backend. No additional nginx changes needed.

---

## Why Embed First?

- **FullCalendar Google Calendar plugin** uses the Google Calendar API directly from the browser. Private Google Workspace calendars require OAuth or a public calendar — a bare API key gets 404.
- **The embed** uses the user's browser session — works instantly for authenticated staff, zero config
- **DWD** is superior UX (native styling, event details, click-to-open) but requires admin setup

---

## Frontend State Machine

```
loading → fetch /api/calendar/my-events
  ├─ dwd_available: false → state: embed (render iframe)
  ├─ dwd_available: true, events: [] → state: ready (empty state message)
  ├─ dwd_available: true, events: [...] → state: ready (native list)
  └─ fetch error → state: error
```

Events are grouped by date with Today/Tomorrow labels. All-day events show "All day" instead of a time. Each event links to `htmlLink` (opens in Google Calendar).

---

## Timezone

`Australia/Melbourne` (`TZ` constant). Used in embed URL params and in local date formatting via `toLocaleDateString('en-AU', { timeZone: TZ })`.
