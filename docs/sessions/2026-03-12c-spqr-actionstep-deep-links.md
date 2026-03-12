# Session Notes — Actionstep Deep Link Investigation
**Date:** 2026-03-12 (session 3)
**Project:** SPQR / RML Intranet
**Topic:** Resolving Actionstep matter link navigation from Dashboard 529

---

## Problem

Clicking Actionstep matter links in Card 1688 (Staff WIP) redirects to the Actionstep
home page rather than the specific matter, even when the user is already logged into
Actionstep in the same browser.

**Root cause confirmed:** SameSite=Strict session cookies.

When a link click originates inside a cross-site iframe (Metabase on
`wealth-fish.metabaseapp.com`), the browser does not send Actionstep's session cookie
on the resulting navigation — regardless of whether the user is logged in. Actionstep
falls back to home. This is a Chrome 80+ browser security behaviour, not a bug.

The Actionstep API does not help with this directly — OAuth tokens give server-side API
access, not browser sessions.

---

## Solution: Actionstep Deep Link API

Actionstep provides a deep link mechanism that encodes session information in the URL
itself, bypassing the need for a browser cookie entirely.

**Docs:** https://docs.actionstep.com/tutorial-deep-links/

**How it works:**
1. Call `GET {api_endpoint}/api/rest/as-common/application-meta-data` with the user's
   OAuth access token (requires `AsCommon` scope + `X-API-EXTENSION: AsCommon` header)
2. Response includes `deepLinkUrl` — a user-specific base URL:
   ```
   https://go.actionstep.com/frontend/external/deep-link/launch?s=822&l=36407&o=redstone
   ```
3. Append target fragment: `&target=view-action&action_id={matterId}`
4. The resulting URL is token-based — no browser cookie required

**Available targets:**
| Target | Fragment |
|---|---|
| View Matter | `&target=view-action&action_id={id}` |
| Matter Participants | `&target=view-action-participants&action_id={id}` |
| Matter File Notes | `&target=view-action-filenotes&action_id={id}` |
| Matter Tasks | `&target=view-action-tasks&action_id={id}` |

**Key constraints:**
- Deep link base URL is **user-specific** — each user needs their own (fetched via their
  OAuth token)
- Valid for the duration of the OAuth access token lifetime — needs refresh on expiry
- Users not logged in are still prompted with Actionstep login (but redirected to the
  correct matter after)

---

## Implementation Plan

### Backend (rml-intranet-forms-api)

**1. Actionstep OAuth flow**
- Add `GET /api/actionstep/auth` — redirects user to Actionstep OAuth authorization URL
- Add `GET /api/actionstep/callback` — exchanges code for token, stores in Supabase
  `people` table as `actionstep_access_token` + `actionstep_token_expiry`
- Scope required: `AsCommon` (plus any others needed for future API use)

**2. Deep link relay route**
- Add `GET /api/actionstep/matter/:id`
- Looks up the user's stored access token from Supabase (by `req.user.email`)
- If token missing/expired → redirect to OAuth connect flow
- Calls `GET {api_endpoint}/api/rest/as-common/application-meta-data` with token
- Redirects to `{deepLinkUrl}&target=view-action&action_id=:id`

**3. Token storage in Supabase**
- Add `actionstep_access_token TEXT` and `actionstep_token_expiry TIMESTAMPTZ` columns
  to `public.people` table

### Metabase

**Update Card 1688 (Staff WIP) click behavior:**

Change link template from:
```
https://ap-southeast-2.actionstep.com/mym/asfw/workflow/action/overview/action_id/{{matter_id}}
```
To:
```
https://intranet.roammigrationlaw.com/api/actionstep/matter/{{matter_id}}
```

Apply same change to Card 2542 (Urgent Matters — Detail) and Card 2575 (Stale Matters
— Detail).

### Frontend (optional)

- Add "Connect Actionstep" button to Settings page — initiates OAuth flow
- Show connection status (connected / token expiry)

---

## Notion Task

https://www.notion.so/[to-be-created] — "Implement Actionstep OAuth deep link relay"

---

## Related

- Session 2026-03-12b: Dashboard 529 card updates, parameter mappings
- SPQR memory: `memory/spqr.md`
- Existing Notion task (drill-down click-through): https://www.notion.so/321e1901e36e8118b77ac4e8bf2ce36e
