# Session Notes — Dashboard 529 Card Updates
**Date:** 2026-03-12 (session 2)
**Project:** SPQR / Metabase BI
**Dashboard:** 529 (Intranet Basic)

---

## What Was Completed

### 1. Stale Matter Count — Drill-Down Wired (Card 2445 → Card 2575)

Created **Card 2575 "Stale Matters — Detail"** in collection 133.

- Lists all active, non-finalised matters stale >3 business days (same logic as Card 1688)
- Columns: matter_id (Actionstep link), matter_name (link), matter_type, stage, client_name, case_manager, senior_associate, last_activity_date, business_days_stale
- Sorted by `business_days_stale DESC` (worst first)
- Uses `ROW_NUMBER()` dedup for Case Managers — avoids duplicate rows on ~100 dual-CM matters
- Added `click_behavior` to Card 2445 pointing to Card 2575

### 2. Dashboard 529 Layout Updated

Scalar strip (row 2) changed from:

| col=0 | col=6 | col=12 | col=18 |
|---|---|---|---|
| Active Matter Count | Stale Matter % | Urgent Matter Count | KPI Hours % |

To:

| col=0 | col=6 | col=12 | col=18 |
|---|---|---|---|
| Active Matter Count | Stale Matter % | **Stale Matter Count** | **Urgent Matter Count** |

KPI Hours % (Prorated to Today) — Card 2450 — removed from dashboard.

### 3. Card 2451 — Rebuilt as Hours & Billings KPI Table

Renamed: **"KPI % by Staff — Hours & Billings (Prorated)"**

Replaced the single `kpi_pct_prorated` column with two percentage columns:

| Column | Display name | What it shows |
|---|---|---|
| `hrs_pct` | Time Tracking | Actual hours ÷ prorated hours target × 100 |
| `billings_pct` | Billings | Actual billings ÷ prorated billings target × 100 |

Both formatted with `%` suffix. Raw figures (actual_hrs, prorated_target_hrs, actual_billings, prorated_target_billings) remain in the query but hidden.

**Billing attribution pattern** (from Card 2278):
- Billing target: `participant_kpis.total_sales`
- Actual billings: `SUM(client_billing_invoices.total_exclusive)` joined via `cm_primary` (Case Manager, ROW_NUMBER dedup)
- Prorated: `target * DAY(GETDATE()) / DAY(EOMONTH(GETDATE()))`

Sample data (March 12, day 12 UTC):
| Staff | Time Tracking | Billings |
|---|---|---|
| Hani Azid | 93.3% | 120.4% |
| Sarah Fazal | 106.1% | 38.6% |
| Nabilah Amani | 67.4% | 94.6% |

### 4. Filter Mappings Restored

All 5 dashboard filters re-wired to Card 1688 after being wiped by a PUT call:
Status, Matter Type, Step, CM, SA.

---

## Unresolved

### Scalar Card Drill-Down Click-Through (Not Working)

Both Stale Matter Count (2445 → 2575) and Urgent Matter Count (2449 → 2542) have `click_behavior` set correctly at the dashcard level, but clicking does not navigate to the detail card.

Notion task: https://www.notion.so/321e1901e36e8118b77ac4e8bf2ce36e

Possible causes:
- `linkType: "question"` not supported in signed iframe embedding context
- Metabase v1.59 limitation on scalar card click-through in embed mode

---

## Critical API Learnings — Metabase v1.59

### PUT /api/dashboard/:id/cards — Destructive Replace

`PUT /api/dashboard/:id/cards` **replaces the entire dashcard list**. Any card not included is deleted. Any `parameter_mappings: []` silently wipes filter wiring.

**Safe PUT checklist:**
1. GET the dashboard first to capture all existing dashcard IDs, positions, and parameter_mappings
2. Include ALL dashcards in the PUT payload
3. Carry forward `parameter_mappings` from GET — never pass `[]` unless intentionally clearing
4. Use `"id": -1` (negative integer) to create a new dashcard inline — POST endpoint returns 404 in v1.59

**Recovery:** `POST /api/revision/revert` with `{"entity": "dashboard", "id": 529, "revision_id": <id>}` reliably restores any prior state. Always check revision history before giving up.

### Click Behavior — Card Level vs Dashcard Level

- `visualization_settings.click_behavior` on the **card** itself: fires when viewing the card directly
- `visualization_settings.click_behavior` on the **dashcard** (within the dashboard): required for click-through to work in dashboard context

Both must be set independently if both contexts are needed. Setting only the card level does nothing inside a dashboard.

### Column Formatting (Native SQL)

```json
"column_settings": {
  "[\"name\",\"col_name\"]": {
    "suffix": "%",
    "column_title": "Display Name"
  }
}
```

`"number_style": "percent"` divides by 100 — wrong for pre-computed percentages. Use `"suffix": "%"` instead.

---

## Dashboard 529 — Current Dashcard Map

| dashcard | card | row | col | name |
|---|---|---|---|---|
| 2546 | — | 0 | 0 | Text: Global KPI Measures |
| 2543 | 2444 | 2 | 0 | Active Matter Count |
| 2544 | 2446 | 2 | 6 | Stale Matter % |
| 2550 | 2445 | 2 | 12 | Stale Matter Count (→ 2575) |
| 2545 | 2449 | 2 | 18 | Urgent Matter Count (→ 2542) |
| 2547 | — | 6 | 0 | Text: Filter-Dependent View |
| 2548 | 2451 | 8 | 0 | KPI % by Staff — Hours & Billings (Prorated) |
| 2542 | 1688 | 20 | 0 | Staff WIP |
