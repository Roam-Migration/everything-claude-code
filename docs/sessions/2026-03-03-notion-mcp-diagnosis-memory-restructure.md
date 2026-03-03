# Notion MCP Diagnosis & Memory Restructure — 2026-03-03

**Commits:** `e4fe334`, `bc2696f`
**Repo:** everything-claude-code (main)
**Files changed:** `docs/notion-operations-checklist.md`, `CLAUDE.md`, plus memory files and plugin skill cache

---

## Background

Last session (ECC CI workflow fixes) ended with a note that Notion MCP was "proving difficult" — each attempt to write a session doc surfaced a different required field error. A blank test page was left at `318e1901-e36e-8171-a4ac-da441693796e`. This session diagnosed the root cause and fixed it systemically.

---

## Root Cause Analysis

Four compounding structural problems in the Notion MCP plugin:

### 1. Mandatory Two-Step Discovery (primary cause of "different required field each time")

Creating a database row requires a `data_source_id` (a `collection://UUID`) that is:
- **Different** from the database page ID (shared opening segment, different middle bytes)
- Only obtainable by calling `notion-fetch` on the database first and extracting `<data-source url="collection://...">` from the response

Without this, each attempt tries a different parameter path (database ID, page ID, etc.), each of which fails with a different error message. This is why the problem felt like "parameter discovery" when it was actually a mandatory prerequisite step.

### 2. Schema Must Be Fetched Per Session

Property names are workspace-specific, exact, and case-sensitive. They cannot be guessed. One `notion-fetch` call upfront costs ~500 tokens; skipping it costs 3–5 failed writes = 3,000+ tokens.

### 3. Silent OAuth Token Expiry

The Notion MCP OAuth token expires without warning. The failure surfaces only on the first API call after expiry: `"MCP server requires re-authorization (token expired)"`. If this happens mid-workflow (after completing the discovery steps), all prior work is lost.

**Confirmed this session:** Calling `notion-fetch` at session start immediately returned `"requires re-authorization"` — validating the diagnosis.

### 4. No Delete/Archive Tool

The plugin exposes 12 tools but none support archiving (`PATCH /pages/{id}` with `{"archived": true}`). Orphaned test pages (like the blank one from last session) must be removed manually in the Notion UI.

---

## The Deeper Bug: MEMORY.md Truncation

Investigation revealed a second problem: the Notion guidance in MEMORY.md was at line 240 — past the 200-line hard truncation limit. The file was 488 lines, meaning:

- "Notion Best Practices (CRITICAL)" at line 258: **never loading**
- "Session Start Workflow" at line 267: **never loading**
- "Session Closure Workflow" at line 374: **never loading**

The guidance existed but was never being read. Every Notion session started cold.

---

## Changes Made

### Memory Restructure

**MEMORY.md** rewritten: 488 lines → 119 lines.
- Notion MCP pre-flight protocol now at **line 3** (was line 240)
- Session Start and Session Closure workflows now load (were beyond truncation)
- Gull Force WP detail moved to `memory/gull-force.md`

**New topic files created:**
- `memory/notion-mcp.md` — full diagnosis, safe workflow, property format table, error reference, all collection IDs
- `memory/gull-force.md` — all Gull Force WP Site details (80 lines extracted from MEMORY.md)

### Plugin Skill Files Updated

`~/.claude/plugins/cache/claude-plugins-official/Notion/0.1.0/commands/create-task.md`
`~/.claude/plugins/cache/claude-plugins-official/Notion/0.1.0/commands/create-database-row.md`

Both now include a mandatory pre-flight block:
1. Validate OAuth token via `notion-fetch`
2. Fetch target database to get `data_source_id` + schema
3. Use exact property names from schema

### ECC Repo (committed)

`docs/notion-operations-checklist.md` — new "Step 0: Validate Token" section prepended, explaining the silent expiry problem and the fail-fast rationale.

`CLAUDE.md` — corrected GitHub plugin entry to note that the MCP plugin requires Copilot; `gh` CLI is the correct tool.

---

## Key Insight: Structured vs. Unstructured Friction

The Notion MCP difficulty isn't random — it's a predictable four-step prerequisite chain:

```
1. Validate token (notion-fetch any known page)
2. Fetch target database (notion-fetch <db_url>)
3. Extract collection:// UUID from <data-source url="...">
4. Write using that UUID as parent.data_source_id
```

Every prior failure was skipping one of these steps. Now that the pre-flight is documented in MEMORY.md (loads every session), the plugin skills (runs on skill invocation), and the checklist (reference doc), the pattern is captured at all three layers where it can be consulted.

---

## Remaining Manual Action

The blank test page at `318e1901-e36e-8171-a4ac-da441693796e` in Notion needs manual deletion (no MCP archive tool available).

---

## Lessons Learned

1. **MEMORY.md truncation is a real bug vector** — any instruction past line 200 is silently never loaded. Check line count when adding memory.
2. **Diagnose first, don't retry** — the right response to repeated Notion failures was to stop and trace the prerequisite chain, not attempt another parameter variant.
3. **Plugin cache is editable** — `~/.claude/plugins/cache/` files persist until the plugin is explicitly updated. Editing them is a valid way to improve default behavior for the current installation.
