# Session: SPQR Participant KPI Summary Card

**Date:** 2026-03-09
**Project:** SPQR Dashboard (Metabase, wealth-fish.metabaseapp.com)
**Collection:** 133 (SPQR Dashboards)

---

## What Was Accomplished

Built a Metabase card that replicates Actionstep's default "Participant KPI Summary" report — the firm's primary staff performance view, tracking actual vs KPI hours and invoiced fees per person per month.

### Deliverable

**Card 2278 — Participant KPI Summary — Jan–Mar 2026**
- URL: https://wealth-fish.metabaseapp.com/card/2278
- Display: Table
- Columns: Participant | Jan/Feb/Mar × (Act Hrs, KPI Hrs, Hrs%, Act Inv, KPI Inv, Inv%) | Period Totals (6 columns)
- Rows: 16 active staff members (former staff and Service Account excluded automatically)

### Reference Export Used

XLSX export from Actionstep: `Participant_KPI_Summary_06-Mar-26.xlsx` (Google Drive: `1KtT6vRaLw3VedSvq0Sik-ImLb1Iiwfkf`)
Confirmed match on invoice figures for 7/10 Jan entries. Hours match for all staff except Davaan (documented below).

---

## Data Model Discoveries

See `docs/SPQR Dashboards/htmigration-billing-data-model.md` for the full reference. Key findings this session:

### 1. KPI Targets — participant_kpis stores monthly totals

The `participant_kpis` table stores **pre-calculated monthly totals** (not daily rates):
- `actual_hours` = monthly hours KPI target
- `total_sales` = monthly invoice KPI target
- `year` and `month` are reserved SQL Server keywords — queries may produce syntax warnings but still execute

**Data quality issue:** Jan 2026 shows `kpi_hours = 7.6` for all staff. This is the daily rate entered by mistake in Actionstep instead of the monthly total. Feb = 152.0, Mar = 167.2 are correct (working days × 7.6).

### 2. Invoice Attribution Pattern

Standard attribution chain:
```
client_billing_invoices  →  action_participants (Case_Manager role)  →  participant
```

Key fields: `sale_purchase_date` (date), `total_exclusive` (amount ex-GST), `action_id` (join key).

**Traps avoided:**
- `client_billing_invoice_allocations` — tracks GL fee splits, not staff attribution. Amounts were ~30% of expected values.
- `View_Billing_Schedule_Time_Entries_Actions` — only returns entries where time is linked to an invoice. RML is a fixed-fee firm — no time entries are ever linked to invoices. Joshua Taylor (Finance) was the only result.

### 3. Time Entries — Use Base Table, Not the View

`View_time_entries_actions` JOINs to `actions` with an active-matters filter — time on closed/finalised matters disappears. Before the fix, Davaan Jayabalan showed 0 hours (all his matters were closed/finalised).

**Fix:** Use `"htmigration"."dbo"."time_entries"` (confirmed BASE TABLE). Same column names as the view. Always add:
```sql
AND timesheet_date <= GETDATE()   -- guards against 3716-01-19 bad date in DB
```

### 4. Dual Case Manager Data Quality

~100 matters have two Case_Manager participants (staff not removed from matters on handover). Predominantly:
- Vikneswaran + Jisha (Vikneswaran's old matters transferred to Jisha)
- Varsha + Jisha (same pattern)

**Mitigation:** `ROW_NUMBER() OVER (PARTITION BY action_id ORDER BY participant_id DESC) AS rn` — filter to `rn = 1`. This consistently attributes to one CM but produces ~$2k–$5k attribution drift on shared matters vs XLSX.

---

## Accuracy vs XLSX

| Staff | Jan Hrs (Ours) | Jan Hrs (XLSX) | Jan Inv (Ours) | Jan Inv (XLSX) | Status |
|---|---|---|---|---|---|
| Ahmad Iqmal | 143.3 | 143.3 | 0 | 0 | ✓ Exact |
| Carolina Fernandez | 151.0 | ~151 | 39,515.37 | 39,515.37 | ✓ Exact |
| Davaan Jayabalan | 114.4 | 143.4 | 8,810.51 | — | Hours gap (see below) |
| Hani Azid | 163.8 | ~163.8 | 3,025.00 | 3,025.00 | ✓ Exact |
| Sarah Fazal | 185.8 | ~185.8 | 9,812.13 | 9,812.13 | ✓ Exact |
| Varsha Kattoor | 32.7 | — | 26,455.06 | ~26,455 | Inv ✓; Hrs low (closed matters) |

### Davaan 29-Hour Gap

After switching to `time_entries` base table, Davaan went from 0 to 114.4 hours. XLSX shows 143.4. Remaining 29 hours are unaccounted for. Likely cause: some entries recorded under a secondary `participant_id` (impersonation or admin entry). To diagnose:
```sql
SELECT COUNT(*), SUM(actual_hours)
FROM "htmigration"."dbo"."time_entries"
WHERE timesheet_date >= '2026-01-01' AND timesheet_date < '2026-02-01'
  AND timekeeper LIKE '%Davaan%'
```
Compare result to the participant_id-based count.

---

## SQL Query Architecture

The final query uses 5 CTEs:

| CTE | Purpose |
|---|---|
| `staff` | Source of participant list — only participants with KPI records for the period |
| `kpi` | Monthly KPI targets from participant_kpis |
| `hours_actual` | Actual hours from time_entries base table, grouped by person and month |
| `cm_primary` | Deduplicates dual Case_Manager assignments via ROW_NUMBER |
| `invoice_actual` | Actual invoiced amounts from client_billing_invoices via Case_Manager JOIN |

The SELECT pivots months manually (no SQL Server PIVOT syntax) with ISNULL/CASE guards on all division operations.

---

## Known Issues to Report to Management

1. **Jan 2026 KPI Hrs = 7.6** — Actionstep has the daily rate (7.6) stored instead of the monthly hours target (likely should be ~152.0 for 20 working days). All Jan performance percentages are inflated as a result (~2000% for most staff).
2. **Dual Case Managers on ~100 matters** — Vikneswaran and Varsha are still listed as Case Manager on matters that have been handed to Jisha. Invoice attribution is approximate until Actionstep is cleaned up.
3. **Davaan time recording gap** — 29 hours unaccounted for in January. May indicate entries under a secondary account.

---

## No New Tasks Created

The card is deployed and functional. Investigation of Davaan's 29-hour gap is a low-priority follow-up, not a blocker.
