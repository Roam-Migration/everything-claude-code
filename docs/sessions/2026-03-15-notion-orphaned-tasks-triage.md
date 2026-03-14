# Session Notes — 2026-03-15 — Notion Orphaned Tasks Triage

## What Was Done

- Identified ~60 orphaned tasks (no Project relation) across the Notion Tasks DB
- Created **Gull Force Website** project in Projects DB (`323e1901e36e8149aef5e2017c251ea2`) — Status: In progress, CZ, Active Initiative on
- Assigned 58 tasks to projects across 6 buckets (see table below)
- Linked "Populate Department relation on TECH projects" to 2026 Planning Implementation project
- Kept 7 ECC-related tasks unlinked (user preference)
- User handled meta/admin and contractor tasks manually (B and C groups)

### Tasks assigned by project

| Project | Count |
|---|---|
| Gull Force Website (new) | 15 |
| Intranet Launch | 25 |
| IT Security Remediation | 5 |
| Org Intelligence Dashboard | 4 |
| Compass Wiki | 4 |
| 2026 Planning Implementation | 1 |

## Technical Patterns / Gotchas

### Notion search is semantic only — cannot filter by null property
`notion-search` has no WHERE clause equivalent. To find orphaned tasks (Project = null), the only approach is:
- Run multiple semantic searches with varied query terms
- Fetch each result individually to check the Project property
- Accept incomplete coverage — ~60 tasks found across many rounds

### Gull Force project creation — Driver property format
- The Driver property takes a **bare UUID string** (not JSON-quoted): `"cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87"`
- Double-quoting `"\"cd2bebb6-...\""` causes Notion to reject with: "Id ... is not a user id. It appears to be malformed and without the user prefix."
- This matches the existing memory pattern — confirmed again here.

### Parallel bulk updates strategy
- Search for task IDs using broad query terms covering 4-5 tasks per search call
- Run searches in parallel (4-5 at a time) to reduce round trips
- Once IDs confirmed, fire all `notion-update-page` calls in parallel batches of 10-15
- This session updated 58 tasks in ~8 API round-trip batches

## Key IDs / References

| Resource | ID/URL |
|---|---|
| Gull Force Website project | `https://www.notion.so/323e1901e36e8149aef5e2017c251ea2` |
| Intranet Launch project | `https://www.notion.so/2ece1901e36e819c8ee2d7ad5c1d0209` |
| IT Security Remediation project | `https://www.notion.so/313e1901e36e817d9e97fc875ad384f1` |
| Org Intelligence Dashboard project | `https://www.notion.so/31fe1901e36e81a18328cb26c6430786` |
| Compass Wiki project | `https://www.notion.so/2b6e1901e36e8067a71afbb1bc6ca27e` |
| 2026 Planning Implementation project | `https://www.notion.so/2ece1901e36e8148b147c2e33b7a6697` |
| Tasks DB | `collection://4b3348c5-136e-4339-8166-b3680e3b6396` |
| Projects DB | `collection://7e62ecf2-0379-4fa5-9a54-99788a80af99` |

## Remaining Work

- None — session goal (orphaned task triage) fully complete
- Further orphaned tasks may exist beyond the ~60 surfaced; a full audit would require paginating the Tasks DB directly (not possible via MCP search)
