# Supabase + PostgREST Patterns Skill

## Purpose

Reference guide and workflow for Supabase/PostgREST operations in RML projects. Covers the non-obvious behaviors that cause silent bugs, failed queries, and data corruption — particularly in the Org Intelligence schema.

## When to Use

- Writing Supabase client queries (PostgREST)
- Designing or modifying RML Org Intelligence schema
- Debugging unexpected query results (especially filtering bugs)
- Adding RLS policies or security-definer views
- Needing DDL when the Supabase CLI is unavailable

---

## Critical: The UUID Quoting Bug

**This is a silent data-corruption bug — no error is thrown, but wrong data is affected.**

### The Problem

PostgREST's `.not('col', 'in', ...)` operator requires bare UUIDs without quotes. Single-quoted UUIDs are treated as literal strings and never match bare UUID column values — causing `NOT IN` to match everything (all rows pass the filter).

**WRONG — corrupts data:**
```typescript
// Single-quoted UUIDs never match → NOT IN matches ALL rows → all rows deactivated
.not('notion_id', 'in', `(${ids.map(id => `'${id}'`).join(',')})`)
```

**CORRECT:**
```typescript
// Bare UUIDs match correctly
.not('notion_id', 'in', `(${ids.join(',')})`)
```

**When this matters:** Any sync operation that deactivates rows not in a current list. A single-quoted UUID bug will deactivate your entire table.

**Detection:** If a sync operation sets `active = false` on more rows than expected (or all rows), check for this bug first.

---

## RLS (Row-Level Security) Policies

### Default Behavior

Supabase tables with RLS enabled block ALL access by default — including the `anon` (unauthenticated) role. This means even server-side queries using the anon key will fail silently (return empty arrays, not errors).

### Adding Anon Read Policies

```sql
-- Allow anon read on a table:
CREATE POLICY anon_read_people ON people
  FOR SELECT
  TO anon
  USING (true);

-- Takes effect immediately — no restart needed
-- Apply to each table individually (does not cascade)
```

### Common Pattern: Views Bypass RLS

```sql
-- Views with SECURITY DEFINER run as the view's owner, bypassing RLS
-- Use this for aggregation views that join multiple restricted tables:
CREATE OR REPLACE VIEW v_org_hierarchy
WITH (security_invoker = false)  -- or omit for SECURITY DEFINER default
AS
  SELECT ...
  FROM people p
  JOIN roles r ON r.person_id = p.id;
```

`SECURITY DEFINER` views work with the anon key without additional RLS policies. Use this pattern for complex views that would otherwise require policies on every underlying table.

### Checking Active Policies

```sql
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Supabase Management API (DDL Without CLI)

When the Supabase CLI is unavailable or access is blocked, use the Management API directly.

### Endpoint

```
POST https://api.supabase.com/v1/projects/{ref}/database/query
Authorization: Bearer {sbp_PAT_token}
Content-Type: application/json
```

Project ref: `spybbjljplimivkiipar`

### Usage (via Python + curl)

```python
import json

payload = {
    "query": """
        ALTER TABLE people
        ADD COLUMN IF NOT EXISTS intranet_role VARCHAR(50);
    """
}

with open('/tmp/ddl_payload.json', 'w') as f:
    json.dump(payload, f)
```

```bash
curl -s -X POST \
  "https://api.supabase.com/v1/projects/spybbjljplimivkiipar/database/query" \
  -H "Authorization: Bearer $SBP_PAT" \
  -H "Content-Type: application/json" \
  -d @/tmp/ddl_payload.json
```

Use `python3` to build complex JSON payloads (escaping is error-prone in bash heredocs).

---

## Org Intelligence Schema Reference

### Tables

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `people` | Staff records | `id`, `name`, `email`, `employment_status`, `intranet_role`, `notion_id`, `metadata` |
| `teams` | Team definitions | `id`, `name`, `color` |
| `roles` | Role definitions | `id`, `title`, `team_id`, `notion_level`, `tier` |
| `people_roles` | Person ↔ Role mapping | `person_id`, `role_id` (UNIQUE constraint required) |
| `people_teams` | Person ↔ Team mapping | `person_id`, `team_id` |
| `departments` | Department definitions | `id`, `name`, `color`, `dept_id` |
| `time_allocations` | Time split by matter type | `person_id`, `category`, `percentage` |
| `kpi_performance` | KPI metric rows | `person_id`, `metric`, `value`, `period` |

### UUID Prefix Conventions

Fixed prefix patterns identify record type at a glance:

| Prefix | Entity | Example |
|--------|--------|---------|
| `00000000-...-XXXXXX` | Teams | `00000000-0000-0000-0000-000000000001` |
| `10000000-...-XXXXXX` | Roles | `10000000-0000-0000-0000-000000000001` |
| `20000000-...-XXXXXX` | People | `20000000-0000-0000-0000-000000000001` |

### UNIQUE Constraint Required for Upsert

`people_roles` requires a UNIQUE constraint to enable `onConflict` upserts:

```sql
-- Required for: .upsert(data, { onConflict: 'person_id,role_id' })
ALTER TABLE people_roles
ADD CONSTRAINT people_roles_person_role_unique
UNIQUE (person_id, role_id);
```

Without this, upserts throw a constraint error and you must use insert + handle conflicts manually.

### Actionstep Participant ID Fallback

5 staff members have blank or mismatched `contacts.e_mail` in Actionstep — their bridge key is `metadata.actionstep_participant_id` on the `people` table:

| Name | Participant ID |
|------|---------------|
| Frances Lee | 22684 |
| Ahmad Iqmal | 24002 |
| Martin Russell | 62843 |
| Taasha Parmeswaran | 64691 |
| Varsha Kattoor | 175 |

Use `metadata->>'actionstep_participant_id'` as a fallback when email matching fails.

---

## v_org_hierarchy View Pattern

The org hierarchy view uses a LATERAL join to handle cross-team roles (Case Manager, etc.) where `roles.team_id IS NULL`:

```sql
CREATE OR REPLACE VIEW v_org_hierarchy AS
SELECT
    p.id as person_id,
    p.name,
    p.email,
    p.employment_status,
    p.notion_id as person_notion_id,
    r.title as role_title,
    r.notion_level,
    r.tier,
    COALESCE(t_direct.id, t_lateral.id) as team_id,
    COALESCE(t_direct.name, t_lateral.name) as team_name,
    d.id as dept_id,
    d.name as dept_name,
    d.color as dept_color
FROM people p
JOIN people_roles pr ON pr.person_id = p.id
JOIN roles r ON r.id = pr.role_id
LEFT JOIN teams t_direct ON t_direct.id = r.team_id
LEFT JOIN LATERAL (
    -- Fallback: find team via people_teams when role has no team
    SELECT t.id, t.name FROM teams t
    JOIN people_teams pt ON pt.team_id = t.id
    WHERE pt.person_id = p.id
    LIMIT 1
) t_lateral ON r.team_id IS NULL
LEFT JOIN departments d ON d.id = COALESCE(t_direct.dept_id, t_lateral.id)
WHERE LOWER(p.employment_status) = 'active';
```

---

## PostgREST Operator Reference

| Operation | Correct Syntax | Common Mistake |
|-----------|---------------|----------------|
| Not in list (UUIDs) | `.not('col', 'in', '(uuid1,uuid2)')` | `.not('col', 'in', "('uuid1','uuid2')")` — quoted causes silent match-all |
| Equals | `.eq('col', value)` | — |
| Contains (array) | `.contains('col', [value])` | — |
| JSONB field | `.eq('metadata->>key', value)` | `.eq('metadata.key', value)` — wrong syntax |
| Is null | `.is('col', null)` | `.eq('col', null)` — different behavior |
| Order + limit | `.order('col').limit(n)` | — |
| Upsert | `.upsert(data, { onConflict: 'col1,col2' })` | Requires UNIQUE constraint on those columns |

---

## Sync Route Reference

| Operation | Method + URL |
|-----------|-------------|
| Org sync | `POST https://rml-intranet-forms-api-hmff5nrb3q-uc.a.run.app/api/org/sync` |
| KPI sync | `POST .../api/kpi/sync` |

Both require `X-Goog-Authenticated-User-Email` header (IAP bypass — see Cloud Scheduler pattern in memory).

---

## Error Reference

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| All rows deactivated after sync | UUID quoting bug in `.not(..., 'in', ...)` | Use bare UUIDs, no single quotes |
| Empty array from query despite data existing | RLS blocking anon access | Add `CREATE POLICY anon_read_X ON table FOR SELECT TO anon USING (true)` |
| View query returns all rows including inactive | View missing `WHERE employment_status = 'active'` | Add filter in view definition |
| Upsert throws constraint error | Missing UNIQUE constraint | `ALTER TABLE X ADD CONSTRAINT X_unique UNIQUE (col1, col2)` |
| `metadata->>'key'` returns null | Key not set on that row | Check with `SELECT metadata FROM people WHERE id = 'X'` |
| 25/25 people in view | Expected — confirm lateral join handles cross-team roles | If fewer, check `employment_status` case in WHERE clause |

---

## Anti-Patterns to Avoid

❌ **Single-quoting UUIDs in `.not('col', 'in', ...)`** — silent data corruption; all rows match NOT IN

❌ **Assuming RLS is off** — new tables with RLS enabled will silently return empty results; always add anon policies explicitly

❌ **Using direct table queries for aggregation views** — use SECURITY DEFINER views to avoid needing policies on every joined table

❌ **Using `roles.team_id` as the sole team source** — cross-team roles have NULL team_id; use LATERAL join fallback via `people_teams`

❌ **Matching staff by email without fallback** — 5 staff have blank/mismatched emails; always have a `metadata.actionstep_participant_id` fallback path
