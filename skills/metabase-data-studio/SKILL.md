# Metabase Data Studio Skill

## Purpose

Workflow for using Metabase Data Studio (v59+, Starter plan) to build a semantic layer on top of raw htmigration SQL Server data. Centralises shared metric definitions, standardises business terminology, and reduces copy-pasted SQL logic across cards.

## Plan: Starter (confirmed)

**Included:**
- Data Structure (table metadata / column descriptions)
- Glossary (business term definitions for humans and AI)
- Measures (reusable saved aggregations — define a metric once, reuse across questions)
- Segments (reusable saved filters — define a filter condition once, apply anywhere)

**NOT included (Starter plan):**
- SQL Transforms ($250/mo add-on — 2.5× base plan cost, not warranted at current scale)
- Dependency Graph / Diagnostics (confirm tier — may be Pro/Enterprise only)
- Library curation (confirm tier)

> Before using a feature in Metabase UI, verify it appears in your Data Studio panel. The four above (Data Structure, Glossary, Measures, Segments) are confirmed available.

---

## When to Use

- Defining a business metric used across multiple cards (KPI %, Stale %, Active Count) → **Measure**
- Defining a reusable filter condition (Active Matters, Stale Matters, Legal Staff) → **Segment**
- Documenting what a table column actually means → **Data Structure**
- Making business terms machine-readable for AI querying → **Glossary**
- Starting a new analytical area — define Segments + Measures before writing card SQL

---

## Feature 1: Measures

**What it is:** A saved, reusable aggregation expression. Define "KPI Hours %" once in Data Studio; reference it in any question that needs it instead of rewriting `SUM(te.hours) / SUM(pk.target_hours) * 100`.

**Why this matters for SPQR:** The KPI % formula is currently duplicated across Cards 2311 (My KPI Summary), 2312 (My Monthly Trend), and any team dashboard card. If the formula changes (e.g. we exclude leave hours), every card needs updating. A Measure makes it a single edit.

**How to create a Measure:**
1. Open Data Studio (grid icon, top-right in Metabase)
2. Navigate to the relevant table (e.g. `participant_kpis` or `time_entries`)
3. Click "New Measure" or "Add Metric"
4. Write the aggregation expression using Metabase's formula UI or SQL expression
5. Name it clearly: `[Domain] [What it measures]` — e.g. `KPI Hours Actual`, `KPI Hours %`, `Active Matter Count`
6. Save — it now appears as a field option when building questions on that table

**SPQR Measures to define (priority order):**

| Measure Name | Source Table | Expression | Used In |
|---|---|---|---|
| `Active Matter Count` | `actions` | `COUNT(action_id)` where `status = 'Active'` | Dashboard 727, 529 |
| `Stale Matter Count` | `actions` | `COUNT` where last_activity > 30 days ago | Dashboard 727 KPI tile |
| `Stale Matter %` | `actions` | `Stale Count / Active Count × 100` | Dashboard 727 KPI tile |
| `Urgent Matter Count` | `actions` | `COUNT` where deadline ≤ 14 days | Dashboard 727 KPI tile |
| `KPI Hours Actual` | `time_entries` | `SUM(hours)` for current month | Dashboard 694, 695 |
| `KPI Hours %` | `time_entries` + `participant_kpis` | `SUM(actual) / SUM(target) × 100` | Dashboard 694, 695 |
| `KPI Invoiced Actual` | `client_billing_invoices` | `SUM(amount)` for current month | Dashboard 694, 695 |

**Naming convention:** `[Domain] [Noun] [Unit or Type]`
- Good: `KPI Hours %`, `Active Matter Count`, `Stale Matter %`
- Avoid: `pct`, `calc1`, `metric`, names with IDs

---

## Feature 2: Segments

**What it is:** A saved, reusable filter condition. Define "Active Matters" as `status = 'Active'` once; apply it as a one-click filter in any question built on the `actions` table. No rewriting the WHERE clause.

**Why this matters for SPQR:** "Active", "Stale", "Urgent", and "Legal Staff" are filter conditions currently written inline in SQL across 6+ cards. If the definition of "Stale" changes from 30 to 45 days, every card needs editing. A Segment makes it one change.

**How to create a Segment:**
1. Open Data Studio → Segments tab (or via the table's metadata panel)
2. Select the source table
3. Click "New Segment"
4. Use the filter builder (GUI) to define the condition
5. Name it: `[What it selects]` — e.g. `Active Matters`, `Stale Matters`, `Legal Staff Only`
6. Save — it appears as a filter option in any question using that table

**SPQR Segments to define (priority order):**

| Segment Name | Source Table | Condition | Used In |
|---|---|---|---|
| `Active Matters` | `actions` | `status = 'Active'` | Dashboard 727, 529, 694, 695 |
| `Stale Matters` | `actions` + `view_combination_key_dates` | last_activity_date < 30 days ago | Dashboard 727 |
| `Urgent Matters` | `actions` + `view_combination_key_dates` | deadline_date ≤ DATEADD(day,14,GETDATE()) | Dashboard 727 |
| `Legal Staff Only` | `action_participants` | `participant_type_name IN ('Case_Manager', 'Responsible_Partner_Senior_Associate', 'Paralegal', 'Registered_Migration_Agent')` | Dashboard 529 filters |
| `Current Month` | any date table | date column in current month | Dashboard 694, 695 |
| `Current Year` | any date table | date column in current year | Dashboard 694, 695 |

**Note on cross-table Segments:** Metabase Segments are defined on a single table. If your condition requires a JOIN (e.g. Stale Matters needs `view_combination_key_dates`), you may need to:
- Use the Segment on a Model that already joins the tables, OR
- Define the condition in the card SQL and document it in Glossary instead

---

## Feature 3: Glossary

**What it is:** A business dictionary in Metabase, readable by both analysts and AI agents. Defines what your business terms mean in the context of your data.

**Why this matters for SPQR:** "Stale", "Urgent", "WIP", "KPI %" are informal terms currently only defined inside SQL comments. If an AI assistant or new team member queries Metabase, these terms are invisible. Glossary makes them first-class.

**How to add Glossary terms:**
1. Open Data Studio → Glossary tab
2. Click "New Term"
3. Provide: name, plain-English definition, related tables/columns, example
4. Save — the term is indexed for AI and searchable by analysts

**SPQR Glossary terms to define:**

| Term | Definition | Related Columns |
|---|---|---|
| **Active Matter** | A matter currently in progress: `actions.status = 'Active'` | `actions.status` |
| **Stale Matter** | An active matter with no recorded activity in more than 30 days | `view_combination_key_dates.last_activity_date` |
| **Urgent Matter** | An active matter with a key deadline within the next 14 calendar days | `view_combination_key_dates.deadline_date` |
| **WIP** | Work-in-progress: active matters currently assigned to a Case Manager | `action_participants.participant_type_name = 'Case_Manager'` |
| **KPI Hours Target** | Monthly target hours for a staff member, set per-participant in Actionstep | `participant_kpis.target_hours` |
| **KPI Hours %** | Actual hours logged / KPI target hours × 100 for a given month | `time_entries.hours` ÷ `participant_kpis.target_hours` |
| **Staff Member** | A person in htmigration contacts with `is_company = 'F'` and a legal participant role | `vw_staff_members.display_name` |
| **Participant ID** | Actionstep's internal ID linking a person across matters, KPIs, and contacts | `action_participants.participant_id` |
| **Case Manager** | The staff member responsible for progressing a matter: `participant_type_name = 'Case_Manager'` | `action_participants.participant_type_name` |
| **Senior Associate** | The supervising lawyer on a matter: `participant_type_name = 'Responsible_Partner_Senior_Associate'` | `action_participants.participant_type_name` |

---

## Feature 4: Data Structure (Table Metadata)

**What it is:** Human-readable descriptions added to tables and columns in Metabase's metadata layer. Makes GUI Query Builder usable for non-technical team members and improves AI query accuracy.

**Why this matters for SPQR:** `is_company`, `participant_type_name`, `action_id` are cryptic Actionstep field names. Without descriptions, team leaders using the GUI builder will guess wrong joins and produce incorrect results.

**How to add table/column descriptions:**
1. Settings → Admin → Data Model
2. Select the `htmigration` database → browse to the table
3. Click a column name → add a description
4. Optionally: set Semantic Type (e.g. mark `e_mail` as Email, `participant_id` as Entity Key)

**SPQR tables to annotate (priority order):**

| Table | Column | Description to add |
|---|---|---|
| `actions` | `action_id` | Unique matter ID (Actionstep internal key) |
| `actions` | `action_name` | Matter display name (e.g. "Smith Family – 189 Visa") |
| `actions` | `status` | Matter lifecycle status. 'Active' = currently in progress |
| `actions` | `matter_type` | Visa category (e.g. "189 Skilled Independent", "Partner Visa") |
| `action_participants` | `participant_type_name` | Role in matter: Case_Manager, Responsible_Partner_Senior_Associate, Paralegal, client, etc. |
| `action_participants` | `display_name` | Full name of the participant (staff or client) |
| `contacts` | `is_company` | 'F' = individual person, 'T' = company/organisation |
| `contacts` | `e_mail` | Google Workspace email — used to match intranet login to Actionstep record |
| `participant_kpis` | `target_hours` | Monthly KPI target hours for this participant |
| `participant_kpis` | `target_invoiced` | Monthly KPI invoicing target (AUD) |
| `vw_staff_members` | `display_name` | Staff-only filtered names — safe source for dashboard dropdowns |

**Semantic types to set:**
- `participant_id` fields → Entity Key
- `action_id` → Entity Key
- `e_mail` → Email
- `display_name` → Name / Full Name

---

## Integration with Card Creation Workflow

Data Studio is a **prerequisite layer** that sits before card creation. Updated workflow:

```
Before writing a new card:
  1. Check Glossary — are any terms already defined that apply?
  2. Check Segments — does a reusable filter cover your WHERE clause?
  3. Check Measures — does a saved metric already cover your aggregation?

Card creation (existing skill):
  4–10. Follow skills/metabase-card-creation/SKILL.md as usual
        Reference Segments and Measures in the GUI builder where possible
        Use raw SQL only for logic that can't be expressed via Segments/Measures

After completing a card:
  11. If a new business term was introduced → add to Glossary
  12. If a new filter pattern was written → consider creating a Segment
  13. If a new metric formula was written → consider creating a Measure
```

---

## SPQR Rollout Plan

### Session 1 — Quick wins (no code, pure Data Studio UI)
- [ ] Define 10 Glossary terms (see table above)
- [ ] Create Segments: Active Matters, Urgent Matters, Legal Staff Only
- [ ] Create Measures: Active Matter Count, Stale Matter %, Urgent Matter Count
- [ ] Annotate `actions` and `action_participants` column descriptions

### Session 2 — KPI Measures
- [ ] Create Measures: KPI Hours Actual, KPI Hours %, KPI Invoiced Actual
- [ ] Wire into Dashboard 694 / 695 card queries where possible
- [ ] Annotate `participant_kpis` and `time_entries` columns

### Session 3 — Full metadata coverage
- [ ] Annotate `contacts`, `vw_staff_members`, `view_combination_key_dates`
- [ ] Create remaining Segments (Stale Matters, Current Month, Current Year)
- [ ] Verify Segments/Measures appear correctly in GUI builder

### Deferred — revisit if scale grows
- SQL Transforms ($250/mo add-on): only worth it if we exceed 50+ tables or have heavy pre-aggregation needs. Current htmigration schema is well under this threshold.

---

## Pre-Session Checklist (Before Each Data Studio Session)

- [ ] Metabase v59+ confirmed (Settings > About)
- [ ] Data Studio panel accessible (grid icon top-right)
- [ ] Glossary, Measures, Segments tabs visible (confirm Starter plan features active)
- [ ] Target table/column names verified via `get-database-schema` before annotating
- [ ] Segment/Measure expressions validated before saving (use `validate-sql-server-query` for SQL expressions)

---

## Common Issues

**"Segment not appearing in GUI filter options"**
- Segments are table-specific. Confirm you're building a question on the same table the Segment was defined for.
- If using a Model as the source, Segments defined on the raw table may not carry over.

**"Measure result doesn't match raw SQL card"**
- Check whether the Measure uses the same date scope. Measures may apply implicitly different date filters.
- Cross-reference by running the raw SQL equivalent via `test-metabase-query`.

**"Cross-table Segment not supported"**
- Metabase Segments filter a single table. For conditions requiring a JOIN, define the condition in a Model first, then create the Segment on the Model.

**"Glossary term not surfaced by AI queries"**
- Confirm the term is saved and published (not draft).
- AI indexing may take a few minutes after saving.

---

## Resources

- Announcement: https://www.metabase.com/blog/meet-data-studio-semantic-layer (v59, Mar 2026)
- Card creation skill: `skills/metabase-card-creation/SKILL.md`
- SQL Server patterns: `skills/metabase-sql-server-patterns/SKILL.md`
- SPQR session context: `docs/sessions/2026-03-10-spqr-handover.md`
- MCP tools: `get-database-schema`, `validate-sql-server-query`, `test-metabase-query`
- Metabase instance: `wealth-fish.metabaseapp.com` | DB ID: 34 | Collection: 133
