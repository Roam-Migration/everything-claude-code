# Session Notes — 2026-03-14 — Notion Driver Property Fix

## What Was Done

### Goal
Investigate and fix the Driver property failure from the previous session, where 4 Notion tasks were created without Driver=Jackson set.

### Root Cause Identified

The memory and docs contained the wrong write format for Notion person properties:

**Wrong (was in memory):** `"\"cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87\""` — extra JSON-escaped quotes around the UUID

**Correct (confirmed by live test):** `"cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87"` — plain UUID string, no wrapping quotes

The confusion stemmed from the `notion-create-pages` MCP tool's Phase 4 example in the skill, which was written using raw Notion REST API format (`{"people": [{"id": "uuid"}]}`). That format is not what the MCP tool accepts — the MCP tool uses **SQLite value format** (plain strings, per the SQLite schema comments in the `notion-fetch` response).

Multi-person fields (Consulted, Informed) still correctly use a JSON array string: `"[\"uuid1\", \"uuid2\"]"`

### Fixes Applied

1. **Live test confirmed** — created test task with plain UUID for Driver, fetched back and verified `Driver: ["<mention-user url=\"user://cd2bebb6-...\">"]` resolved correctly

2. **4 orphaned tasks patched** — set Driver=Jackson on all 4 tasks from the previous session:
   - Fix Project Map route link in OperationsPage
   - Deploy Project Map to production
   - Populate Department relation on IT projects
   - Backfill Project relation on existing Platform Map entries

3. **Memory updated** — `memory/notion-mcp.md` Person row + error table row corrected; `MEMORY.md` pre-flight section now includes inline Person format note

4. **Docs updated** — `docs/notion-operations-checklist.md` and `docs/notion-integration.md` Person format examples + error message corrected

5. **Skill updated** — `skills/notion-mcp-write-workflow/SKILL.md` Phase 4 fully rewritten from raw REST API format to correct MCP SQLite format; comprehensive property type table added

---

## Remaining Work

- [ ] Delete test task "DRIVER FORMAT TEST — delete me" manually in Notion UI
  - URL: https://www.notion.so/323e1901e36e81c8b0dddf865e6fb62c
- [ ] Stale `SearchModal.tsx` modification in Rmlintranetdesign — investigate or discard before next deploy

---

## Key IDs / References

| Resource | ID/URL |
|----------|--------|
| Test task (delete me) | https://www.notion.so/323e1901e36e81c8b0dddf865e6fb62c |
| Correct Person format | plain UUID: `"cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87"` |
| Updated skill | `skills/notion-mcp-write-workflow/SKILL.md` |
