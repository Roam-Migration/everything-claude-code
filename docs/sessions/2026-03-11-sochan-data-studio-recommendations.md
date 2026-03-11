# Sochan's Dashboard System — Data Studio Recommendations
**Prepared:** 2026-03-11
**For:** Sochan (future Claude session)
**Context:** Metabase v59+ Data Studio features available on Starter plan: Measures, Segments, Glossary, Data Structure
**Scope:** Dashboard 662 (Navigation Hub) + Dashboards 663–668 (SPQR system)

---

## System Overview (reviewed 2026-03-11)

Sochan has built a 7-dashboard SPQR system via the GUI query builder:

| Dashboard | Purpose | Filters |
|-----------|---------|---------|
| 662 — Navigation Hub | Role-based landing page | None |
| 663 — Executive Overview | High-level KPIs | Date Range, Matter Type |
| 664 — Matter Profitability | Margin & budget burn | Date Range, Staff, Matter Type, Status |
| 665 — Staff Performance | Leaderboards & utilisation | Date Range, Staff, Matter Type |
| 666 — Collections Pipeline | Invoice & cash flow | Date Range, Client, Status |
| 667 — Operations Tracker | Active matters & deadlines | Date Range, Assigned To, Matter Type, Status |
| 668 — WIP Analysis | Unbilled work & write-offs | Date Range, Staff, Matter Type |

All cards are **GUI query builder** type — this is ideal. Measures and Segments plug directly into the GUI builder with no card rewrites needed.

---

## Priority 1: Measures

**Why:** Several metric names appear across multiple dashboards. Without a shared Measure definition, each card implements its own formula. If the definition of "Margin %" ever changes, every card needs updating individually.

**How to create a Measure:** Data Studio (grid icon top-right) → select the source table → "New Measure" → define aggregation → name it → Save.

### Measure: `Avg Margin %`
**Critical — appears in 3 dashboards:**
- Card 2049 (Executive Overview)
- Card 2058 (Matter Profitability)
- Card 2063 (Staff Performance)

**Action:** Open all three cards and verify they use the **same formula** before creating the Measure. If they differ, decide the canonical definition, create the Measure, and update the outlier cards to use it.

**Suggested definition:** `AVG(margin_amount / total_revenue * 100)` — confirm column names against actual card aggregations.

---

### Measure: `Revenue This Month`
**Appears in 2 dashboards under different names:**
- Card 2052 — "Revenue This Month" (Executive)
- Card 2064 — "Total Revenue" (Staff Performance)

**Action:** Check whether both scope to the same time period (current month) or if one is all-time. If the same, consolidate into one Measure named `Revenue (Current Month)` for clarity.

---

### Measure: `Active Matter Count`
**Card 2146** (Executive) — used as a KPI tile and implicitly referenced across all dashboards as the base denominator for percentage metrics (Stale %, Urgent %, Collection Rate).

**Suggested definition:** `COUNT(action_id)` where `status = 'Active'`

Making this a Measure means "At Risk %" and "Collection Rate" can reference it without reimplementing the count.

---

### Measure: `Collection Rate`
**Card 2072** (Collections Pipeline) — this is a ratio and likely the most complex metric in the system.

**Action:** Note the exact formula used in Card 2072 (what's numerator? invoices collected vs total invoiced? matter stage = Approved?). Create as a Measure — this rate will likely be referenced in future Executive views.

---

### Measure: `Total WIP`
**Card 2083** (WIP Analysis) — foundational metric for the WIP dashboard.

**Note:** "WIP" in a fixed-fee firm is non-standard. Define the formula carefully (is it unbilled time × rate? value of open matters at current stage?). Glossary entry is also needed (see below).

---

### Measure: `At Risk WIP`
**Card 2084** (WIP Analysis) — paired with Total WIP, defines the risk threshold.

**Action:** Confirm the "at risk" threshold (days unbilled? stage? value?). Creating this as a Measure locks in the definition. Pairs with the `At Risk Matters` Segment below.

---

## Priority 2: Segments

**Why:** "Active", "At Risk", "Overdue", "Legal Staff" are filter conditions repeated implicitly across all 6 dashboards. Currently each card re-implements its own WHERE clause for these. A Segment defines it once; every new card gets it as a click.

**How to create a Segment:** Data Studio → select source table → "New Segment" → use filter builder → name it → Save. Appears as a filter option in any question built on that table.

**Important:** Segments are table-specific. If a condition requires joining two tables, create it on a Model that already has the join, or document the condition in Glossary instead.

---

### Segment: `Active Matters`
**Source table:** `actions`
**Condition:** `status = 'Active'`
**Impact:** Applies implicitly to every dashboard. Currently each card re-filters for this. As a Segment, it becomes a one-click filter and is consistent across new cards.

---

### Segment: `At Risk Matters`
**Source table:** `actions` (or `view_combination_key_dates` if deadline-based)
**Condition:** Verify from Card 2050 — likely matters where deadline is within a threshold OR no activity for N days.
**Impact:** Used in Card 2050 (Executive) and implicitly in Dashboard 667 (Operations).

---

### Segment: `Overdue Matters`
**Source table:** `actions` + deadline table
**Condition:** deadline_date < today AND status = 'Active'
**Why separate from "At Risk":** Card 2079 (Operations) tracks "Overdue" as a distinct status from "At Risk". These need separate Segments with clear names.

---

### Segment: `Overdue Invoices`
**Source table:** invoicing/billing table
**Condition:** payment_due_date < today AND status != 'Paid'
**Why separate from "Overdue Matters":** The Glossary entry for "Overdue" needs to distinguish these two. Card 2075 (Collections) and Card 2079 (Operations) both use "overdue" but for different things.

---

### Segment: `Legal Staff Only`
**Source table:** `action_participants` or `vw_staff_members`
**Condition:** `participant_type_name IN ('Case_Manager', 'Responsible_Partner_Senior_Associate', 'Paralegal', 'Registered_Migration_Agent')`
**Impact:** Dashboard 665 (Staff Performance) is scoped to legal staff — as a Segment this is reliable and reusable.

---

### Segment: `Current Month`
**Source table:** any table with a date column
**Condition:** date field is in current month
**Note:** Metabase has native date relative filters, so this may already exist as a built-in option. Check before creating — if the built-in "this month" filter already appears in the filter builder, no Segment needed.

---

## Priority 3: Glossary

**Why:** "Overdue", "At Risk", "WIP", "Margin", "Utilisation", "Collection Rate" are terms used in dashboards that have non-obvious, firm-specific meanings. Glossary makes these discoverable to new users and accurate for AI-assisted queries.

**How:** Data Studio → Glossary → "New Term" → fill name, definition, related columns.

### Terms to define:

| Term | Suggested Definition |
|------|---------------------|
| **Active Matter** | A matter with `status = 'Active'` in the actions table — currently in progress |
| **At Risk Matter** | An active matter at elevated risk of not completing on budget — confirm threshold from Card 2050 |
| **Overdue Matter** | An active matter past its key deadline date (deadline_date < today) — distinct from Overdue Invoice |
| **Overdue Invoice** | A client invoice past its payment due date and not yet paid — distinct from Overdue Matter |
| **Margin %** | Revenue minus cost expressed as a percentage of revenue. For fixed-fee matters: (fixed_fee − actual_cost) / fixed_fee × 100 |
| **WIP** | Work-in-progress: the accumulated value of unbilled time and costs on active matters |
| **At Risk WIP** | WIP that is at risk of write-off based on matter age, stage, or profitability threshold — confirm from Card 2084 |
| **Write-Off** | WIP value that cannot be billed and is removed from the books — confirm recognition rules used in Card 2085 |
| **Collection Rate** | Percentage of total invoiced revenue that has been collected — confirm formula from Card 2072 |
| **Utilisation** | Staff utilisation: hours worked on matters / total available hours × 100 — confirm basis from Card 2067 |
| **Budget Burn** | Percentage of a matter's fixed fee budget consumed by actual costs — from Card 2059 |
| **48-Hour Compliance** | Whether a matter had activity recorded within the last 48 hours — from Card 2082 |
| **Engaged** | Matter stage: initial engagement/retainer — from Card 2069 (Collections) |
| **Lodged** | Matter stage: application lodged with authority — from Card 2070 (Collections) |
| **Approved** | Matter stage: application approved — from Card 2071 (Collections) |

---

## Priority 4: Data Structure (Table Metadata)

**Why:** Sochan's dashboards use the GUI query builder, which surfaces raw column names from htmigration. Adding descriptions to key columns makes the builder more usable and reduces misconfiguration of filters.

**How:** Settings → Admin → Data Model → select `htmigration` → browse to table → click column → add description.

### Key columns to annotate (shared with SPQR):

| Table | Column | Description |
|-------|--------|-------------|
| `actions` | `action_id` | Unique matter identifier (Actionstep internal key) |
| `actions` | `action_name` | Matter display name |
| `actions` | `status` | Matter lifecycle: 'Active' = in progress, 'Closed' = complete |
| `actions` | `matter_type` | Visa category / matter type (e.g. '189 Skilled Independent') |
| `action_participants` | `participant_type_name` | Role in matter: Case_Manager, Responsible_Partner_Senior_Associate, Paralegal, client, etc. |
| `contacts` | `is_company` | 'F' = individual person, 'T' = company |

**Note:** If Jackson has already annotated these (SPQR session), Sochan benefits automatically — Data Structure is shared across all users of the `htmigration` database in Metabase.

---

## Cross-Dashboard Inconsistencies to Resolve

These are patterns discovered by reviewing all 6 dashboards that Sochan should address before or alongside Data Studio work:

### 1. Filter naming inconsistency: "Staff" vs "Assigned To"
- Dashboard 664, 665, 668 use filter named **"Staff"**
- Dashboard 667 uses filter named **"Assigned To"**

These likely map to the same underlying field. Standardise the filter name across all dashboards so team members know which filter to use when cross-referencing. Recommended name: **"Staff Member"** (matches Glossary term).

### 2. "Avg Margin %" in 3 dashboards — verify formula consistency
Cards 2049, 2058, 2063 all display "Avg Margin %" but the label alone doesn't confirm the formula is identical. Before creating a Measure, open each card in edit mode and compare the aggregation field selections. If any differ, document why.

### 3. "Revenue This Month" vs "Total Revenue" — confirm scope difference
If Card 2052 (Executive) is month-scoped and Card 2064 (Staff) is all-time, these are different metrics and should have distinct Measure names. If they're the same scope, align the display name.

---

## Recommended Session Order

**Session 1 — Glossary + quick Segments (2–3 hours)**
1. Define all 14 Glossary terms
2. Create Segments: Active Matters, Legal Staff Only
3. Create Segment: Overdue Matters (verify condition from Card 2079 first)
4. Create Segment: Overdue Invoices (verify condition from Card 2075 first)

**Session 2 — Measures (3–4 hours)**
1. Open Cards 2049, 2058, 2063 in edit mode — compare Avg Margin % formulas
2. Create Measure: `Avg Margin %` (canonical formula)
3. Create Measure: `Active Matter Count`
4. Create Measure: `Collection Rate` (verify Card 2072 formula)
5. Create Measures: `Total WIP`, `At Risk WIP` (verify thresholds from Cards 2083, 2084)

**Session 3 — Wire and standardise (2–3 hours)**
1. Resolve "Staff" vs "Assigned To" filter naming across all dashboards
2. Verify "Revenue This Month" vs "Total Revenue" — align or document
3. Annotate Data Structure columns (if Jackson hasn't already done so)
4. Test: build a new question using Measures and Segments to confirm they surface correctly in GUI builder

---

## What Not to Do

- **Do not upgrade to SQL Transforms** ($250/mo add-on) — Sochan's all-GUI system does not need write-back transforms. Measures and Segments achieve the same definitional consistency without it.
- **Do not rebuild cards as native SQL** — the GUI query builder is correct for this system. Measures and Segments are designed for GUI builder cards.
- **Do not create Segments for date ranges** if Metabase's built-in relative date filters already cover the need — check the filter builder first.

---

## Notes for Claude (when Sochan starts session)

1. Fetch this file at session start for full context
2. The Metabase API key is in GCP Secret Manager: `metabase-api-key` (project: `rmlintranet`)
3. Metabase instance: `wealth-fish.metabaseapp.com`
4. Collection 133 (SPQR Dashboards) contains both Jackson's and Sochan's cards — all in the same collection
5. Data Studio features confirmed on Starter plan: Measures, Segments, Glossary, Data Structure
6. SQL query content is NOT accessible via the API for GUI-built cards — must open cards in Metabase UI to see the actual aggregation/filter fields used
7. Before creating any Measure, open the card in edit mode in the Metabase UI to confirm the exact formula — do not assume from the card name alone
