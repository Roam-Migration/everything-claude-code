# Session: Google Chat Notifications for Daily and Critical Updates

**Date:** 2026-02-26
**Project:** RML Intranet
**Repo:** `/tmp/Rmlintranetdesign` (branch: `troubleshoot/notion-integration`)
**Commit:** `8f8ed05`

---

## What Was Accomplished

Implemented end-to-end Google Chat notifications for the RML Intranet's Daily Update and Critical Update forms. When a staff member submits a Daily Update or an admin posts a Critical Update, the content is automatically broadcast to the "Roam Updates" Google Chat space.

### Deliverables

| File | Purpose |
|------|---------|
| `backend/src/services/GoogleChatService.ts` | Builds Google Chat Cards v1 payloads and POSTs to incoming webhook |
| `backend/src/routes/updates.ts` | New `/api/updates/daily` and `/api/updates/critical` routes |
| `backend/src/index.ts` | Registered `/api/updates` router |
| `nginx.conf.template` | Added `/api/updates/` proxy location block |
| `backend/cloudbuild.yaml` | Added `google-chat-webhook-url` secret mapping |
| `src/app/services/notion.ts` | `createDailyUpdate` and `createCriticalUpdate` now call backend |

---

## Architecture Decisions

### Why new dedicated routes instead of hooking the existing Notion proxy

The key discovery: nginx proxies `/api/notion/pages` **directly to `api.notion.com/v1/`** — the Express backend is completely bypassed for those routes. There was no intercept point in the existing architecture for form submissions.

Creating dedicated `/api/updates/` routes was the correct fix because:
1. Business logic (Notion upsert + side effects) belongs in the backend, not nginx
2. Enables Google Chat notifications as a natural post-write side effect
3. Moves the Notion API key handling fully server-side
4. Opens the door for future side effects (email, audit log, etc.) without frontend changes

### Notification delivery: fire-and-forget

`notifyDailyUpdate()` and `notifyCriticalUpdate()` are called **after** `res.json({ success: true })` is sent. The `.catch()` only logs — it never rejects. Form submission success is entirely independent of whether the webhook call succeeds. This is intentional: a Google Chat outage should never break the intranet form.

### Cards v1 vs cardsV2

Used Google Chat's legacy **Cards v1** format (`"cards": [...]`). The newer `cardsV2` is only available for bot messages via the Chat API — it is not supported by incoming webhooks. Cards v1 is fully supported by all webhook endpoints.

### Sections populated conditionally

The Daily Update card only includes sections (Leave, Announcements, Business Updates) that have content. If all three are empty the notification is suppressed entirely. This avoids empty/noise messages when a staff member submits a minimal entry.

### @all mention for Critical Updates

Critical Update cards include `"text": "<users/all>"` in the payload alongside the card. This works because:
- The webhook is configured on a **Space** (not a group chat or DM) — `<users/all>` only works in spaces
- Cards v1 supports combining `text` and `cards` in the same payload

---

## Technical Challenges

### Challenge 1: TypeScript strict typing on `Response.json()`

**Error:** `src/routes/updates.ts(101,37): error TS2339: Property 'results' does not exist on type '{}'`

The project's TypeScript config types `fetch().json()` as `{}` rather than `any` (stricter than the default `lib.dom.d.ts`). The fix was explicit casting:

```typescript
// Before (TS error)
const queryData = await queryResp.json();
const existingPage = queryData?.results?.[0];

// After
const queryData: any = await queryResp.json();
const existingPage = queryData?.results?.[0];
```

Also changed `let notionResp: Response` to `let notionResp: Awaited<ReturnType<typeof fetch>>` to avoid potential ambiguity between the DOM `Response` type and the project's fetch type context.

### Challenge 2: Shell CWD reset between commands

The Bash tool resets the working directory between calls. For Cloud Run deploys that must run from a specific subdirectory (`/tmp/Rmlintranetdesign/backend`), the `cd` and `gcloud builds submit` must be chained with `&&` in a single command. Splitting them across tool calls causes the second command to run from the wrong directory.

---

## Infrastructure Notes

- **Secret:** `google-chat-webhook-url` (GCP Secret Manager, project: `rmlintranet`) — stores the webhook URL for the Roam Updates space
- **Env var:** `GOOGLE_CHAT_WEBHOOK_URL` — mapped via `--update-secrets` in `cloudbuild.yaml`
- **Service account permissions:** Cloud Run default SA (`624089053441-compute@developer.gserviceaccount.com`) needs `roles/secretmanager.secretAccessor` on the new secret
- **Deployed revisions:** Backend `rml-intranet-forms-api-00054-6qs`, frontend `d06522cd`

---

## What Was NOT Changed

- The existing nginx Notion proxy (`/api/notion/`) — still bypasses backend for read operations
- Notion DB IDs, Supabase integration, or any other existing form flows
- No additional role restrictions on `/api/updates/daily` (any authenticated staff can submit)
- `/api/updates/critical` requires `admin` or `manager` role (via `requireRole` middleware)

---

## Future Considerations

- **Deduplication for Daily Updates:** The upsert pattern means multiple submissions on the same day each fire a separate Google Chat notification. Could add a "first submission of the day only" guard if noise becomes an issue.
- **Webhook rotation:** If the webhook URL leaks, rotate via Google Chat space settings → Apps & Integrations, then update the GCP Secret Manager version.
- **Additional channels:** The `GoogleChatService` is generic — adding a second space (e.g., a team-specific channel) is a matter of adding a second `GOOGLE_CHAT_*_WEBHOOK_URL` env var and a parallel `notifyX()` call.
- **Critical Update archiving:** Currently posts every Critical Update, including updates that later get archived/deprecated. Could filter by checking the Type before notifying.
