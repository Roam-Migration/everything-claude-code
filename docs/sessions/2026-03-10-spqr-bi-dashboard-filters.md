# SPQR Session — Business Intelligence Dashboard Filter Fixes

**Date:** 2026-03-10
**Project:** SPQR / RML Intranet Business Intelligence page
**Dashboard:** 529 (Staff WIP / Intranet Basic)

---

## Completed This Session

### Task 1 — Matter Type and Step filters not working

**Symptom:** CM and SA filters worked on Dashboard 529. Matter Type and Step showed in
Metabase but produced "there was a problem displaying this chart" when used.

**Root cause A (widget-type mismatch):**
Dashboard parameters used `type: "string/="` (dropdown) but the card's template tags for
`matter_type` and `stage` had `widget-type: "string/contains"` (free text). Fixed by
changing both template tag widget-types to `"string/="` via the Metabase card PUT API.

**Root cause B (SQL Server alias binding — the real error):**
```
"The multi-part identifier "dbo.actions.action_type_name" could not be bound."
```
Metabase field filter expansion generates fully-qualified `schema.table.column` references.
SQL Server cannot bind those when the same table has an alias in the FROM clause (`actions`
aliased as `a`). CM/SA worked because they used a subquery against `vw_staff_members` (no
alias in that subquery's FROM).

**Fix:** Rewrote the WHERE clause to use the same alias-safe subquery pattern:
```sql
-- BROKEN (alias binding error)
[[AND {{matter_type}}]]
[[AND {{stage}}]]

-- FIXED (subquery references unaliased table — Metabase expansion resolves correctly)
[[AND a.action_type_name IN (SELECT DISTINCT action_type_name FROM htmigration.dbo.actions WHERE {{matter_type}})]]
[[AND a.current_step IN (SELECT DISTINCT current_step FROM htmigration.dbo.actions WHERE {{stage}})]]
```

---

### Task 2 — Add Actionstep Status filter (Active / Inactive / Closed)

**Context:** `action_status` was hardcoded as `WHERE a.action_status = 'Active'`. Data:
Active (1,824 matters), Inactive (7,519), Closed (17).

**Changes:**
1. Removed hardcoded `AND a.action_status = 'Active'` from base WHERE
2. Added `action_status` template tag (field 7322, `string/=`, dimension type)
3. Added filter line using same subquery pattern:
   ```sql
   [[AND a.action_status IN (SELECT DISTINCT action_status FROM htmigration.dbo.actions WHERE {{action_status}})]]
   ```
4. Added "Status" dashboard parameter (slug: `action_status`, type: `string/=`, default: `["Active"]`)
5. Wired parameter → template tag in dashcard 2412
6. Added `action_status: "enabled"` to dashboard 529 `embedding_params`

---

### Task 3 — Filters not visible in intranet embed (two rounds of debugging)

**Round 1 — 400 Bad Request on dashcard API:**

Error body: `"Unknown parameter :action_status."`

Metabase signed embedding has TWO independent layers:
1. Dashboard parameters (what shows in Metabase UI)
2. `embedding_params` (what the embed JWT is allowed to reference)

Parameters not in `embedding_params` cause a 400 even if they exist on the dashboard.
Fix: `PUT /api/dashboard/529` with `embedding_params` including `action_status: "enabled"`.

**Also fixed:** Orphaned null dashcard 2413 (created as artifact of bulk PUT) removed
via PUT /api/dashboard/529/cards with only dashcard 2412 in the payload.

**Also fixed:** `generateWIPDashboardUrl` was using wrong slug `case_manager` instead of
`cm` (the dashboard parameter slug). Silently failed to lock the CM filter for legal-staff.

**Round 2 — Filters visible in Metabase but not in intranet embed:**

Changing from `params: {}` to explicit `params: { action_status: null, ... }` suppressed
filter widgets in the embed. The correct behaviour:

- `params: {}` → Metabase shows ALL `"enabled"` embedding_params as editable filter widgets
- `params: { key: null }` → Metabase interprets explicit null differently → filters hidden

**Fix:** Reverted `generateIntranetDashboardUrl` back to `params: {}`. The
`embedding_params: "enabled"` entry is sufficient to expose the filter. Only include a
param in the JWT when you want to **lock** it to a specific value.

---

## Final State — Dashboard 529 Filters

| Filter | Slug | Template Tag | Values | Default |
|--------|------|-------------|--------|---------|
| Status | `action_status` | `action_status` | Active / Inactive / Closed | Active |
| Matter Type | `matter_type` | `matter_type` | 26 visa types | — |
| Step | `step` | `stage` | 33 steps | — |
| CM | `cm` | `case_manager` | ~40 staff (vw_staff_members) | — |
| SA | `sa` | `senior_associate` | ~40 staff (vw_staff_members) | — |

---

## Key Patterns / Rules

### Metabase field filter alias binding rule
Field filter expansion generates `schema.table.column`. Use the subquery pattern when the
table has an alias in the main query:
```sql
[[AND alias.col IN (SELECT DISTINCT col FROM schema.dbo.table WHERE {{tag}})]]
```

### Metabase signed embedding: three-layer parameter model
1. **Dashboard parameter** — slug, type, default (controls the filter widget in Metabase UI)
2. **embedding_params** — must include the slug as `"enabled"` for the embed to recognise it
3. **JWT params** — only include when locking a value (`{ cm: ["Jackson Taylor"] }`).
   `params: {}` = all "enabled" embedding_params show as editable. Explicit `null` values
   suppress filter display.

### Dashcard ID lifecycle
`PUT /api/dashboard/{id}/cards` (bulk) replaces ALL dashcards and issues new IDs. Any
dashcard not included is deleted. Always fetch current state before a bulk PUT.

### embedding_params values
- `"enabled"` = editable filter widget shown to users
- `"locked"` = value must be in JWT, hidden from users
- `"disabled"` = hidden entirely

---

## Environment Reference
- Dashboard 529: Staff WIP | Dashcard 2412 (card 1688)
- htmigration DB ID: 34 | Field IDs: action_status=7322, action_type_name=7321, current_step=7326
- Backend service: `rml-intranet-forms-api` | MetabaseService.ts
