# Session Notes — 2026-03-15 — Gmail Addon v2 Analysis

## What Was Done

- Located Drive backup of existing Apps Script addon at: https://drive.google.com/drive/u/0/folders/18_sOVNxeSJXUXBeMegeckroGtdUfIJjb
- Analysed all three backup versions (v2, v3 workspace migration, v4)
- Confirmed the addon is owned by another user's Google account — cannot edit original script directly; full source is available via Drive backup
- Extracted confirmed working Actionstep API endpoints, OAuth config, function inventory, and hardcoded credentials from source
- Made and documented strategic decision: reuse existing v2 OAuth client for v3 Chrome Extension rather than registering a new one
- Updated Notion project page (AS Gmail Plugin — Chrome Extension v3) with three targeted edits: Dependencies, Active Blocker, Risk Assessment
- Drafted instructions for Ravi to retrieve live script details (Script ID, Properties, redirect URI, Deployment ID) from the owner's account

## Confirmed Working Actionstep API Endpoints

All on base `https://ap-southeast-2.actionstep.com`, `Bearer` auth, `application/vnd.api+json`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/matters/lookup?q={q}&pageSize=5` | GET | Matter search |
| `/api/rest/actionparticipants?action={id}&include=participant,participantType&...` | GET | Matter participants |
| `/api/rest/actiontypes?isDisabled=F&fields=name&sort=name` | GET | Matter types list |
| `/api/v2/email-templates/` | GET | All templates |
| `/api/v2/email-templates/lookup?filter=matterType.id={id}&pageSize=50&...` | GET | Templates by matter type |
| `/api/v2/email-templates/{id}/generate` | POST | Render template with variables |

OAuth: `https://go.actionstep.com/api/oauth/authorize` + `https://api.actionstep.com/api/oauth/token`

## Existing OAuth Credentials (v2 — already approved by AS)

- `CLIENT_ID`: `16929HammondBC2E11460FE6F5AE2751`
- `CLIENT_SECRET`: `1DB0AE5D0AB6C3652A0E9EB83848B0E7`
- Current redirect URI: `https://script.google.com/macros/d/{scriptId}/usercallback`
- v3 Chrome Extension redirect URI will be: `https://{ext-id}.chromiumapp.org/`

**Do not hardcode these in Chrome Extension source** — store in `chrome.storage.local` via background service worker.

## v2 vs v4 Function Differences

v2 functions (28): core matter search, template selection, compose card, OAuth flow
v4 additions (12 new): `homePageFunction`, `bookmarksLinksSelect`, links/bookmarks system (reads from Google Sheet), `testAuth`

v4 also adds team quick-links: `go.roammigrationlaw.com`, `online.immi.gov.au`, `legend.online.immi.gov.au`

## Strategic Decision: Credential Reuse

Rather than registering a new OAuth application with AS (full review cycle), the Chrome Extension v3 should:
1. Reuse `CLIENT_ID`/`CLIENT_SECRET` from v2 (already approved)
2. Ask AS only to add the new Chrome Extension redirect URI to the existing OAuth client
3. This reframes the ask from "new application review" to a config change

Documented in Notion project: https://www.notion.so/311e1901e36e805c98e4cb1b55ebe88a

## Remaining Work

- [ ] Ravi to retrieve live script details from owner's account (Script ID, Properties, redirect URI, Deployment ID)
- [ ] Contact AS to request adding Chrome Extension redirect URI to existing OAuth client `16929HammondBC2E11460FE6F5AE2751`
- [ ] Start Phase 1 Chrome Extension shell (unblocked — no AS approval needed)
- [ ] Build Postman collection for all v3 endpoints using v2 credentials (run during AS wait)

## Key IDs / References

| Resource | ID/URL |
|----------|--------|
| Drive backup folder | https://drive.google.com/drive/u/0/folders/18_sOVNxeSJXUXBeMegeckroGtdUfIJjb |
| v2 backup | Subfolder: `1u9AM5iys6FsrdW3QmbXldpWIJTlh6cuQ` |
| v4 backup | Subfolder: `166t1g310j7YuDAoEdVwlJLMJPk_0qigL` |
| Gmail Plugin Notion project | https://www.notion.so/311e1901e36e805c98e4cb1b55ebe88a |
| GitHub repo (v3 wireframe) | https://github.com/Roam-Migration/Gmailaddonv3 |
| AS OAuth authorize URL | `https://go.actionstep.com/api/oauth/authorize` |
| AS token URL | `https://api.actionstep.com/api/oauth/token` |
