# SPQR Dashboard Project — Overview

**Last updated:** 2026-03-09
**Database:** htmigration (SQL Server, Metabase DB ID: 34)
**Metabase:** wealth-fish.metabaseapp.com — Collection 133 (SPQR Dashboards)
**Status:** Phase 5 complete (Active Matters + KPI tracking). Phase 6 (visualisation cards) pending.

---

## What Is SPQR?

SPQR is RML's internal operational intelligence system — a set of Metabase dashboards built on top of the Actionstep matter management database (`htmigration`, SQL Server). It gives leadership and team members visibility into:

- **Active matters** — who owns what, what stage it's at, upcoming deadlines, urgency
- **Staff time tracking** — actual hours vs KPI targets per person per week/month/quarter
- **Billing performance** — actual invoiced fees vs monthly KPI targets per Case Manager
- **Workload distribution** — matters by staff, by type, by stage

The name "SPQR" is Jackson's internal codename for the project.

---

## Data Pipeline

```
Actionstep (matter management SaaS)
    → SQL Server: htmigration database (synced automatically)
        → Metabase (wealth-fish.metabaseapp.com, DB ID 34)
            → Dashboards displayed in RML Intranet (via signed URL iframes)
```

Metabase connects directly to the `htmigration` SQL Server database. All queries run against that DB. There is no ETL layer — data is live from Actionstep.

---

## Billing Architecture (Critical Context)

RML is a **fixed-fee firm**. This has major implications for data interpretation:

| Concept | Fixed-Fee Reality |
|---|---|
| `billable_hours` in time_entries | Always 0 — do not use |
| `billable_amount` in time_entries | Always 0 — do not use |
| Invoice creation | Manual in Actionstep, linked to matters (not time entries) |
| Time tracking purpose | Capacity planning and matter health — NOT billing |
| Revenue source of truth | `client_billing_invoices.total_exclusive` (ex-GST) |

**Implication:** Joshua Taylor (Finance) appears in billing views as the staff member who creates invoices. He is not a fee earner. Filter him out with:
```sql
WHERE staff.participant_name != 'Joshua Taylor'
-- or exclude via participant_id
```

---

## Key Tables

| Table | Purpose | Notes |
|---|---|---|
| `actions` | Matter records | Filter `current_step != 'Finalised'` for active matters |
| `action_participants` | Maps contacts to matters in roles | `participant_type_name` defines role |
| `time_entries` | All time records | Use BASE TABLE, not `View_time_entries_actions` |
| `client_billing_invoices` | Invoice records | Use `sale_purchase_date` and `total_exclusive` |
| `participant_kpis` | Monthly KPI targets per staff | Monthly totals, not daily rates (except Jan 2026 bug) |
| `view_combination_key_dates` | Consolidated key dates (Sochan's model #232) | Long-format: multiple rows per matter |

### action_participants — Role Reference

The most important table for understanding who is doing what:

| participant_type_name | Meaning |
|---|---|
| `Case_Manager` | Supervising lawyer / migration agent |
| `Responsible_Partner_Senior_Associate` | Supervising partner or senior associate |
| `Paralegal` | Assigned paralegal |
| `Client` | Applicant (not staff) |
| `Employer` | Sponsoring employer (not staff) |
| `Contact` | General associated contact |

**Critical data quality issue:** ~100 matters have **two Case_Manager entries** — staff not removed from matters on handover. Most common: Vikneswaran+Jisha, Varsha+Jisha. Always deduplicate:
```sql
ROW_NUMBER() OVER (PARTITION BY action_id ORDER BY participant_id DESC) AS rn
-- Filter: AND rn = 1
```

### view_combination_key_dates

Long-format view consolidating 24+ `dc_##_key_dates` tables. Key fields:
- `action_id` — matter ID
- `Date` — the date value
- `EventType` — type of date event
- `Event` — event name/description

Relevant EventType values for "next deadline" calculation:
- `Visa Expiry` (1,807 records)
- `RFI Due Date` (851 records)
- `Deadline to Lodge` (34 records)

Exclude placeholder dates: `AND d.Date != '1900-01-01'`

---

## Active Matters Dashboard

**Model:** "Active Matters Overview v2" (Metabase model, GUI-compatible)
**Dashboard:** ID TBC — Collection 133

### Key Query Decisions

1. **Participant join pattern:**
```sql
-- LEFT JOINs for each role to avoid excluding matters with no paralegal
LEFT JOIN action_participants cm ON cm.action_id = a.action_id AND cm.participant_type_name = 'Case_Manager'
LEFT JOIN action_participants sa ON sa.action_id = a.action_id AND sa.participant_type_name = 'Responsible_Partner_Senior_Associate'
LEFT JOIN action_participants pl ON pl.action_id = a.action_id AND pl.participant_type_name = 'Paralegal'
```

2. **Next deadline via ROW_NUMBER (not CTE — CTE breaks Metabase model conversion):**
```sql
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY action_id ORDER BY Date ASC) AS rn
    FROM view_combination_key_dates
    WHERE EventType IN ('Visa Expiry', 'RFI Due Date', 'Deadline to Lodge')
      AND Date > GETDATE()
      AND Date != '1900-01-01'
) d WHERE d.rn = 1
```

3. **Active matter filter:**
```sql
WHERE a.action_status = 'Active'
  AND a.current_step != 'Finalised'
```

4. **Urgency and staleness flags:**
```sql
CASE WHEN days_until_deadline <= 14 THEN 'Urgent'
     WHEN days_since_activity > 30 THEN 'Stale'
     ELSE 'Normal' END AS matter_status
```

5. **Field filter parameters (Metabase syntax):**
```sql
WHERE 1=1
  [[AND {{case_manager}}]]
  [[AND {{matter_type}}]]
  [[AND {{stage}}]]
```
Field filters must map to the source table column in Metabase settings. Dashboard filter → card column mapping is set per-card in the dashboard editor.

### Performance Benchmark
- Initial query with correlated subqueries: 93 seconds (unacceptable)
- After removing correlated subqueries: 4.9 seconds (production-ready)
- **Key lesson:** Correlated subqueries in SQL Server are O(n) per row — avoid in dashboard queries

---

## Staff KPI & Billing Dashboard

**Dashboard ID:** 661 (Staff Time Management)
**Session:** 2026-02-25

### Key Query Patterns

**KPI-aware staff list** (excludes former staff and Service Account):
```sql
staff AS (
    SELECT participant_id, first_name + ' ' + last_name AS participant_name
    FROM participant_kpis
    WHERE year = 2026 AND month IN (1, 2, 3)
    GROUP BY participant_id, first_name, last_name
    HAVING MAX(actual_hours) > 0 OR MAX(total_sales) > 0
)
```

**Actual hours — always use base table:**
```sql
FROM "htmigration"."dbo"."time_entries"
WHERE timesheet_date >= '2026-01-01'
  AND timesheet_date <= GETDATE()   -- REQUIRED: guards against 3716-01-19 bad date
```

**Invoice attribution to Case Manager:**
```sql
JOIN cm_primary cm ON bi.action_id = cm.action_id AND cm.rn = 1
```
`cm_primary` is the deduplicated Case_Manager CTE above.

**KPI Performance % (safe division):**
```sql
CASE WHEN ISNULL(kpi_value, 0) > 0
     THEN CAST(actual_value / kpi_value * 100 AS DECIMAL(10,1))
     ELSE 0
END AS [Metric %]
```

### participant_kpis Data Issues

| Issue | Detail | Fix |
|---|---|---|
| Jan 2026 `actual_hours = 7.6` | Daily rate entered instead of monthly total in Actionstep | Display Jan Hrs% as unreliable; use Feb+ |
| `year` and `month` are SQL reserved words | May cause syntax warnings | Wrap in brackets: `[year]`, `[month]` |

---

## Metabase Technical Patterns

### SQL Server Syntax (NOT PostgreSQL)
- Row limiting: `SELECT TOP N` (not `LIMIT N`)
- Current time: `GETDATE()` (not `NOW()`)
- String concat: `'Name: ' + @param` (not `||`)
- Null coalesce: `ISNULL(value, default)` (not `COALESCE` where possible)
- Qualified names: `"htmigration"."dbo"."table_name"` (three-part)

### Metabase Field Filter Syntax
```sql
WHERE 1=1
  [[AND column_name = {{parameter_name}}]]    -- single value
  [[AND column_name IN ({{parameter_name}})]] -- multi-select
```
Configure parameter type as "Field Filter" → map to the actual DB column.

### GUI Builder vs Native SQL
- GUI builder queries automatically work with dashboard filters (filter mapping is automatic)
- Native SQL requires explicit `{{parameter}}` syntax and manual filter mapping per card
- SQL pivot tables (`display: "pivot"`) do **not** work with native SQL cards — use SQL conditional aggregation instead

### API Notes (Metabase v1.58.7)
- POST `/api/dashboard/{id}/cards` is deprecated since v1.49
- Use PUT `/api/dashboard/{id}` with full `dashcards` array instead
- Dashboard ID is an integer, not UUID

---

## Known Data Quality Issues (Actionstep → htmigration)

| Issue | Table | Detail | Impact |
|---|---|---|---|
| Jan 2026 KPI hours = 7.6 | `participant_kpis` | Daily rate entered instead of monthly target | Jan Hrs% ~2000% — misleading |
| Dual Case Managers (~100 matters) | `action_participants` | Staff not removed on handover | Invoice attribution drift ~$2k–$5k per affected staff |
| Bad timesheet date 3716-01-19 | `time_entries` | Single corrupted record | Breaks week-boundary calculations without `GETDATE()` guard |
| Finalised matters still marked Active | `actions` | `action_status='Active'` but `current_step='Finalised'` | Inflates active matter counts — always add `current_step != 'Finalised'` |
| Davaan 29-hour gap (Jan 2026) | `time_entries` | 114.4 in Metabase vs 143.4 in Actionstep | Likely entries under secondary participant_id |
| Placeholder dates 1900-01-01 | `dc_##_key_dates` | Actionstep default for empty date fields | Appears as 125-year-old deadlines — always exclude |

---

## Dashboard Build Workflow (Recommended)

1. **Validate data model first** — run SELECTs against candidate tables before writing the full query. The Active Matters session wasted 90 minutes because `assigned_to_participant_name` was assumed to be the Case Manager (it's actually the current step assignee).

2. **Use GUI builder for visualisation cards** — bar charts, donut charts, KPI tiles. GUI cards automatically inherit dashboard filter parameters. Native SQL charts require manual filter wiring.

3. **Use native SQL for complex queries** — pivots, multi-CTE patterns, the Participant KPI Summary. Convert to a Metabase Model for GUI builder compatibility (avoid CTEs in model definitions — use nested subqueries).

4. **Test filter parameter connectivity** — after adding a card to the dashboard, click the filter parameter settings icon and verify each dashboard filter maps to the correct column in each card.

5. **Performance test before deployment** — run the query directly and measure execution time. Target <10s for dashboard cards.

---

## Related Documentation

| File | Content |
|---|---|
| `htmigration-billing-data-model.md` | Full table reference, SQL patterns, deployed cards |
| `spqr-dashboard-inventory.md` | All deployed dashboards and cards with IDs |
| `spqr-mvp-iteration-summary.md` | Feb 15 iteration (12 exploratory cards) |
| `spqr-troubleshooting-guide.md` | Common Metabase issues and fixes |
| `docs/sessions/2026-02-16-spqr-advanced-dashboard-mvp.md` | Active Matters dashboard build session |
| `docs/sessions/2026-02-25-spqr-metabase-time-tracking-dashboard.md` | Staff Time Management dashboard build |
| `docs/sessions/2026-03-09-spqr-participant-kpi-summary.md` | Participant KPI Summary card (billing vs targets) |
