# Notion Operations Checklist

## Step 0: Validate Token (ALWAYS FIRST)

Before starting any multi-step Notion workflow:

```
notion-fetch(<any known page URL>)
```

If this returns `"requires re-authorization (token expired)"`:
- **Stop immediately** — do not continue with the workflow
- Run `/mcp` to re-authenticate via OAuth
- Then restart the workflow from the beginning

**Why this matters:** Token expiry is silent. You will complete the discovery steps (fetching schema, getting data_source_id) only to have the write step fail with a re-auth error — wasting all prior context. One validation call at the start prevents this.

---

## Before Creating Pages in Any Database

- [ ] **Fetch the database schema** using `notion-fetch <database-id>` to see:
  - Exact property names (case-sensitive)
  - Property types (select, relation, person, etc.)
  - SQLite schema for correct value formats

- [ ] **Fetch an existing page** from the database to see actual property values:
  - How person properties are formatted
  - How relation properties are formatted
  - How select properties are formatted

- [ ] **Check for existing Notion skills** via `ToolSearch` or task list

## Property Format Reference (from actual examples)

### Person Properties
```json
"Driver": "[\"cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87\"]"  // JSON array
```

### Relation Properties
```json
"Project": "[\"https://www.notion.so/page-id\"]"  // JSON array of URLs
```

### Select Properties
```json
"Status": "Not started",  // Direct value, NO "select:" prefix
"Priority": "High"
```

### Multi-Select Properties
```json
"Tags": "[\"Website\", \"KPI\"]"  // JSON array
```

### Date Properties
```json
"date:Created Date:start": "2026-02-14",
"date:Created Date:is_datetime": 0
```

### Checkbox Properties
```json
"Active": "__YES__"  // or "__NO__"
```

## Never Assume - Always Verify

If you're unsure about ANY property format:
1. Fetch an example
2. Use the exact format you see
3. Don't guess or try variants

**Cost of getting it wrong**: 3-5 failed API calls = thousands of wasted tokens
**Cost of checking first**: 1 fetch call = ~500 tokens

## When to Search for Skills

Before implementing any Notion automation or complex operation:
- [ ] Check if a skill exists: `ToolSearch query:"notion"`
- [ ] Check task list for similar prior work: `TaskList`
- [ ] Review `docs/notion-integration.md` for established patterns
