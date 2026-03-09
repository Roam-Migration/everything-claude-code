# htmigration Billing Data Model

**Database:** htmigration (SQL Server, Metabase DB ID: 34)
**Last verified:** 2026-03-09

Reference guide for building billing and KPI cards in Metabase. Documents the correct tables, columns, join patterns, and traps to avoid.

---

## Billing Architecture at RML

RML operates on a **fixed-fee billing model**. Key implications:
- `billable_hours` and `billable_amount` in time entry tables are always 0 or meaningless — do not use them
- Invoices are created manually in Actionstep and linked to matters, not to time entries
- `View_Billing_Schedule_Time_Entries_Actions` is only useful for time-linked billing (not applicable at RML)
- Joshua Taylor is the Finance/accounts staff — will always appear in billing views even if no client work

---

## Table Reference

### client_billing_invoices

The primary source of invoice data.

| Column | Type | Notes |
|---|---|---|
| `sale_purchase_id` | int | Primary key |
| `action_id` | int | Links to matter |
| `sale_purchase_date` | date | Invoice date — use this for date filtering (NOT `invoice_date`) |
| `total_exclusive` | numeric | Invoice amount excluding GST — use this for revenue figures |
| `total_inclusive` | numeric | Invoice amount including GST |
| `status` | nvarchar | All invoices at RML are Finalized or Approved — no draft filtering needed |

**Date filter pattern:**
```sql
WHERE bi.sale_purchase_date >= '2026-01-01'
  AND bi.sale_purchase_date < '2026-04-01'
```

### participant_kpis

Monthly KPI targets per staff member. Stores **pre-calculated monthly totals** — not daily rates.

| Column | Type | Notes |
|---|---|---|
| `participant_id` | int | Links to staff |
| `first_name` | nvarchar | |
| `last_name` | nvarchar | |
| `year` | int | **Reserved SQL keyword** — wrap in brackets if needed: `[year]` |
| `month` | int | **Reserved SQL keyword** — wrap in brackets if needed: `[month]` |
| `actual_hours` | numeric | Monthly hours KPI target (e.g., 152.0 = 20 working days × 7.6 hrs) |
| `total_sales` | numeric | Monthly invoice KPI target (e.g., 36,080) |
| `billable_hours` | numeric | Not used at RML |

**Known data quality issue:** January 2026 `actual_hours` = 7.6 for all staff (daily rate accidentally entered instead of monthly total). Feb = 152.0, Mar = 167.2 are correct.

### action_participants

Maps contacts (staff and clients) to matters in specific roles.

| Column | Type | Notes |
|---|---|---|
| `action_id` | int | Matter ID |
| `participant_id` | int | Contact/staff ID |
| `participant_type_name` | nvarchar | Role name — see below |

**Common role names:**
- `Case_Manager` — the supervising lawyer/migration agent for the matter
- `Client` — applicant
- `Employer` — sponsoring employer
- `Contact` — general associated contact

**Data quality issue — dual Case Managers:** ~100 matters have two `Case_Manager` entries (staff not removed on handover). Always deduplicate when attributing invoices to a single Case Manager:

```sql
cm_primary AS (
    SELECT action_id, participant_id,
           ROW_NUMBER() OVER (PARTITION BY action_id ORDER BY participant_id DESC) AS rn
    FROM "htmigration"."dbo"."action_participants"
    WHERE participant_type_name = 'Case_Manager'
)
-- Then JOIN with: AND cm.rn = 1
```

### time_entries (BASE TABLE)

The authoritative source for all time recorded by staff.

| Column | Type | Notes |
|---|---|---|
| `time_entry_id` | int | Primary key |
| `timekeeper_participant_id` | int | Staff participant ID |
| `timekeeper` | nvarchar | Staff display name |
| `timesheet_date` | date | Date of entry |
| `action_id` | int | Matter ID |
| `actual_hours` | numeric | Hours recorded |
| `billable_hours` | numeric | Always 0 at RML (fixed-fee firm) |
| `billable_amount` | numeric | Always 0 at RML |

**Critical:** Always add an upper bound date guard — there is a record with `timesheet_date = '3716-01-19'` (Actionstep data entry error):
```sql
AND timesheet_date <= GETDATE()
```

**Do NOT use `View_time_entries_actions` for historical reporting.** The view filters to currently-active matters only, causing time entries on closed/finalised matters to disappear. Use the base table directly.

### View_time_entries_actions

A view that JOINs `time_entries` to `actions` with an active-matters filter.

- **Safe to use for:** current-month dashboards showing active-matter workload
- **Not safe for:** historical KPI reports, staff performance over a period, any scenario where staff work on matters that have been closed/finalised

---

## Standard Patterns

### Invoice Attribution to Staff (Case Manager)

```sql
cm_primary AS (
    SELECT action_id, participant_id,
           ROW_NUMBER() OVER (PARTITION BY action_id ORDER BY participant_id DESC) AS rn
    FROM "htmigration"."dbo"."action_participants"
    WHERE participant_type_name = 'Case_Manager'
),
invoice_actual AS (
    SELECT cm.participant_id,
           MONTH(bi.sale_purchase_date) AS month_num,
           CAST(SUM(bi.total_exclusive) AS DECIMAL(12,2)) AS invoice_amount
    FROM "htmigration"."dbo"."client_billing_invoices" bi
    JOIN cm_primary cm ON bi.action_id = cm.action_id AND cm.rn = 1
    WHERE bi.sale_purchase_date >= '2026-01-01'
      AND bi.sale_purchase_date < '2026-04-01'
    GROUP BY cm.participant_id, MONTH(bi.sale_purchase_date)
)
```

### KPI-Aware Staff List (Excludes Former Staff and Service Account)

```sql
staff AS (
    SELECT
        participant_id,
        first_name + ' ' + last_name AS participant_name
    FROM "htmigration"."dbo"."participant_kpis"
    WHERE year = 2026
      AND month IN (1, 2, 3)
    GROUP BY participant_id, first_name, last_name
    HAVING MAX(actual_hours) > 0 OR MAX(total_sales) > 0
)
```

This automatically excludes:
- Former staff (no KPI record for the period)
- Service Account (KPI record exists but all values are 0)

### Actual Hours (All Matters, Including Closed)

```sql
hours_actual AS (
    SELECT timekeeper_participant_id AS participant_id,
           MONTH(timesheet_date) AS month_num,
           CAST(SUM(actual_hours) AS DECIMAL(10,1)) AS actual_hours
    FROM "htmigration"."dbo"."time_entries"
    WHERE timesheet_date >= '2026-01-01'
      AND timesheet_date <= GETDATE()       -- guards against 3716-01-19 bad date
      AND timesheet_date < '2026-04-01'
    GROUP BY timekeeper_participant_id, MONTH(timesheet_date)
)
```

### KPI Performance % (Safe Division)

```sql
CASE WHEN ISNULL(kpi_value, 0) > 0
     THEN CAST(ISNULL(actual_value, 0) / kpi_value * 100 AS DECIMAL(10,1))
     ELSE 0
END AS [Metric %]
```

Always guard division — participants without a KPI target (Yashvinee, Shahrul, etc.) will have `kpi_invoice = 0`.

---

## Tables to Avoid for Invoice Attribution

| Table/View | Why Not |
|---|---|
| `client_billing_invoice_allocations` | GL fee splits, not staff attribution. Amounts are ~30% of invoice total. |
| `View_Billing_Schedule_Time_Entries_Actions` | Time-linked billing only. Returns nothing useful at RML (fixed-fee firm). |
| `View_client_billing_invoices_total_billed_MTD` | MTD aggregation view — not suitable for multi-month breakdowns. |

---

## Deployed Cards (Billing-Related)

| Card ID | Name | Key Tables |
|---|---|---|
| 2278 | Participant KPI Summary — Jan–Mar 2026 | participant_kpis, time_entries, client_billing_invoices, action_participants |
| 1919–1956 | Staff Time Management Dashboard (661) | View_time_entries_actions, participant_kpis |

---

## Known Data Quality Issues

| Issue | Detail | Impact |
|---|---|---|
| Jan 2026 KPI Hrs = 7.6 | Daily rate entered in Actionstep instead of monthly total | All Jan Hrs% figures ~2000% — misleading |
| Dual Case Managers (~100 matters) | Vikneswaran+Jisha and Varsha+Jisha most common | Invoice attribution drift of ~$2k–$5k per affected staff member |
| Bad timesheet date (3716-01-19) | Single corrupted record in time_entries | Causes week-boundary calculations to break without the `<= GETDATE()` guard |
| Davaan Jan hours gap (29 hrs) | 143.4 in Actionstep vs 114.4 in our query | Likely entries under a secondary participant_id; under investigation |
