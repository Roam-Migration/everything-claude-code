# Notion MCP Write Workflow Skill

## Purpose

Reliable protocol for writing to Notion databases via MCP. Prevents the three most common failure modes: expired tokens causing silent mid-session failures, using the wrong UUID (page ID vs collection ID), and property name mismatches.

## When to Use

- Creating pages in any Notion database via MCP
- Querying databases via MCP
- At the start of any session involving Notion writes
- After receiving an auth error from a Notion MCP tool

## Core Problem

The Notion MCP token expires silently. A session can start with a valid token, work fine for 20 minutes, then begin silently failing. By the time the failure is noticed, data may be partially written. This skill prevents that by validating the token first and discovering the correct database identifiers before any writes.

**Database UUIDs are not the same as page IDs.** A database has both:
- A page URL ID (visible in the browser URL) — used for REST API reads
- A collection UUID (`collection://...`) — required for `notion-mcp` write operations

These share an opening segment but differ in the middle. Using the wrong one causes silent 404s.

---

## Workflow

### Phase 1: Token Validation

**Always the first step before any Notion write.**

Fetch a known, stable page to confirm the token is active:

```
notion-fetch: https://www.notion.so/2ece1901e36e806e8d7ac3ebf84b9b73
(Notion Core Data page — stable, always exists)
```

**If this succeeds:** Token is valid, proceed.

**If this fails with 401 / auth error:**
1. Run `/mcp` in Claude Code to re-authenticate
2. Re-fetch the Core Data page to confirm new token works
3. Then proceed

**Never skip this step** — a failed write mid-session is harder to recover from than a 30-second token check at the start.

---

### Phase 2: Database Discovery

**Never assume you know the collection UUID** — always discover it fresh from the database page.

1. **Fetch the database's page URL:**
   ```
   notion-fetch: https://www.notion.so/[database-page-id]
   ```

2. **Find the collection UUID** in the response — look for:
   ```html
   <data-source url="collection://[UUID]">
   ```
   or
   ```json
   "data_source_id": "collection://[UUID]"
   ```

3. **Extract the UUID portion** after `collection://` — this is your `data_source_id` for write operations

**Example:**
- Page URL ID (from browser): `4b3348c5-136e-4339-8166-b3680e3b6396`
- Collection UUID (from fetch): `4b3348c5-136e-4339-8166-b3680e3b6396` ← may differ in middle segments

**When to do this:** Any time you're unsure of the collection UUID, or if it's been more than a session since you last used a database. Don't rely on cached values from memory.

---

### Phase 3: Schema Enumeration

**Property names in Notion are exact and case-sensitive.** One character mismatch causes a failed write with no indication of which property is wrong.

Before writing, fetch one existing page from the database to see the property structure:

```
notion-fetch: https://www.notion.so/[database-page-id]
→ Look at the properties section of any existing row
```

Build a reference map:

| Notion Property Name | Type | Valid Values / Format |
|---------------------|------|----------------------|
| `Name` | title | string |
| `Status` | select | "Not started", "In progress", "Done" (exact strings) |
| `Driver` | person | user ID (not email) — see Phase 3a |
| `Due date` | date | ISO 8601 string |
| `Project` | relation | page ID of related project |

**For select/multi-select properties:** fetch an existing page to see the exact option strings — these are often capitalized in non-obvious ways ("Not started" not "not started").

**Phase 3a — Person Properties:**
Person properties require a user ID, not a name or email. Known IDs:
- Jackson Taylor: `cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87`

To find other users:
```
notion-get-users
```

---

### Phase 4: Write Operation

Use the discovered collection UUID as `data_source_id`. **Properties use SQLite value format** (what the MCP tool's schema shows), NOT the raw Notion REST API format:

```json
{
  "parent": {
    "type": "data_source_id",
    "data_source_id": "[UUID-from-Phase-2]"
  },
  "pages": [{
    "properties": {
      "Task": "Page title here",
      "Status": "Not started",
      "Driver": "cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87",
      "Project": "[\"https://www.notion.so/page-id\"]",
      "date:Start Date:start": "2026-03-20",
      "date:Start Date:is_datetime": 0
    }
  }]
}
```

**SQLite property value formats (MCP tool):**

| Type | Format | Notes |
|------|--------|-------|
| `title` | `"My Task"` | Plain string |
| `text` | `"Summary text"` | Plain string |
| `select` | `"Not started"` | Exact option name, no prefix |
| `multi_select` | `"[\"Tag1\", \"Tag2\"]"` | JSON array string |
| `date` | `"date:Prop:start": "YYYY-MM-DD"` + `"date:Prop:is_datetime": 0` | Expanded keys |
| `person` (single) | `"cd2bebb6-..."` | **Plain UUID — no extra quoting** |
| `person` (multi) | `"[\"uuid1\", \"uuid2\"]"` | JSON array string (Consulted, Informed) |
| `relation` (single) | `"[\"https://www.notion.so/page-id\"]"` | JSON array string with full URL |
| `relation` (multi) | `"[\"url1\", \"url2\"]"` | JSON array string |
| `number` | `42` | JS number, not string |
| `checkbox` | `"__YES__"` or `"__NO__"` | Not `true`/`false` |
| `url` | `"https://..."` | Plain string; prefix name with `userDefined:` if named "url"/"id" |

---

### Phase 5: Verify Write

After creating a page, verify it appears in the database:

```
notion-fetch: https://www.notion.so/[database-page-id]
→ Confirm new page appears in results
```

Or fetch the newly created page directly using the `id` returned from the create operation.

If the page is missing:
1. Check the collection UUID was correct (most common cause)
2. Check required properties were set (Notion may silently reject if required fields missing)
3. Try fetching the database again — sometimes there's a propagation delay

---

## Quick Reference: Known Database IDs

| Database | Page URL ID | Collection UUID |
|----------|-------------|-----------------|
| Tasks | `tasks` — see MEMORY.md | `4b3348c5-136e-4339-8166-b3680e3b6396` |
| Projects | see MEMORY.md | `7e62ecf2-0379-4fa5-9a54-99788a80af99` |
| Platform Map | `69eba1aab2ba46578130db2b74dd686d` | `e38debd2-2692-4e42-ae29-5b5a13fff724` |
| Training Sessions | `edc8672307ff4575ba2a4882c799154a` | `840a130f-fbec-4c12-a377-7151f50c9f66` |

**Always validate these against a fresh fetch** — collection UUIDs can change when Notion databases are migrated.

---

## Error Reference

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `401 Unauthorized` | Token expired | Re-auth via `/mcp`, re-run Phase 1 |
| Page created but missing from database | Wrong collection UUID | Re-run Phase 2 on the database page |
| `Could not find property 'Name'` | Case mismatch | Re-run Phase 3 and check exact casing |
| `Invalid select option` | Select value doesn't match enum | Fetch existing row to see valid options |
| Person property fails | Using email or extra JSON-quoting (`\"uuid\"`) | Use plain UUID string; get ID from `notion-get-users` |
| Relation property fails | Page ID format wrong | Use bare UUID without `notion.so/` prefix |
| Write succeeds but data looks wrong | `@Name` format in v5 API | Strip `@` prefix from person name; derive last_name from email |

---

## Pre-Write Checklist

- [ ] Token validated (Phase 1 — Core Data page fetched successfully)
- [ ] Collection UUID discovered via fresh fetch (Phase 2)
- [ ] Property names and types confirmed (Phase 3)
- [ ] Person properties use user IDs, not emails or names
- [ ] Select/multi-select values match exact option strings
- [ ] Write operation uses `collection://UUID` format for data_source_id
- [ ] Write result verified with a follow-up fetch

---

## Anti-Patterns to Avoid

❌ **Skipping token validation** — token expires silently; a mid-session failure is harder to diagnose than a pre-flight check

❌ **Using the page URL ID as the collection UUID** — they look similar but differ; silent 404 on write

❌ **Guessing property names** — Notion is case-sensitive; always fetch schema first

❌ **Using email addresses in person properties** — always use the UUID from `notion-get-users`

❌ **Trusting cached collection UUIDs** — always re-fetch if there's any doubt; the cost of one fetch is less than debugging a failed write

❌ **No delete/archive tool exists** — orphaned pages from failed attempts must be deleted manually in the Notion UI; get the write right first time
