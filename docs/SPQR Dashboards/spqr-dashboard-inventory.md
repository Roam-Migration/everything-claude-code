# SPQR Dashboard Inventory

**Last updated:** 2026-03-09 (Task 2 complete)
**Metabase:** wealth-fish.metabaseapp.com
**Collection:** 133 (SPQR Dashboards)

---

## Dashboards

| ID | Name | Status | Session |
|----|------|--------|---------|
| 661 | Staff Time Management | Live | 2026-02-25 |
| 727 | Active Matters Overview | Live | 2026-03-09 |
| 694 | Individual Performance Dashboard | Live | 2026-03-09 |
| 695 | Team KPI Summary — Jan–Mar 2026 | Live | 2026-03-09 |

---

## Cards — Active Matters

| Card ID | Name | Type | Notes |
|---------|------|------|-------|
| 1585 | Active Matters - All Fields | Table | Original MVP — complete view |
| 1618 | Active Matters by Type | Bar | Count grouped by matter_type |
| 1619 | Active Matters by Staff | Bar | Workload distribution by case_manager |
| 1620 | Active Matters by Current Step | Bar | Pipeline visualisation |
| 1621 | Recent Activity - Last 30 Days | Table | Filtered by recent activity |
| 1622 | KPI: Total Active Matters | Scalar | Single count metric |
| 1623 | Activity Timeline (Last 90 Days) | Line | Trend over time |
| 1624 | Matter Type Distribution | Pie | Proportion by visa type |
| 1625 | Top 10 Busiest Staff | Table | Aggregated with 7-day activity |
| 1628 | Filterable by Staff | Table | Optional text search parameter |
| 1629 | Date Range Filter | Table | Optional date range parameter |
| 1630 | Advanced Multi-Filter | Table | 5 filters combined |

### Active Matters Overview v2 (Advanced)
- Native SQL with field filter parameters (case_manager, matter_type, stage, senior_associate)
- Conditional formatting: Red = Urgent (deadline ≤14 days), Orange = Stale (no activity >30 days)
- Based on Metabase model for GUI builder compatibility
- Performance: 4.9s (optimised from original 93s)

## Cards — Active Matters Overview (Dashboard 727)

| Card ID | Name | Type | Dashboard row | Notes |
|---------|------|------|---------------|-------|
| 2347 | KPI: Total Active Matters | Scalar | 0 | COUNT(*) active matters |
| 2348 | KPI: % Stale Matters | Scalar | 0 | Stale / total × 100 |
| 2349 | KPI: Urgent Matters | Scalar | 0 | COUNT where is_urgent=1 |
| 2344 | Matters by Case Manager | Bar (horizontal) | 4 | Group by case_manager, count; series = stage |
| 2346 | Matters by Visa Type | Donut | 4 | Slice by matter_type, count |
| 2345 | Matters by Stage | Bar (horizontal) | 16 | Group by stage, count |

### SQL approach
- All 6 cards use native SQL against `htmigration.dbo.actions` (NOT the Active Matters Overview v2 model — that model has `SELECT TOP 100` which caps aggregation)
- Deduplication: `ROW_NUMBER() OVER (PARTITION BY action_id ORDER BY participant_id DESC) AS rn` to handle dual Case Manager assignments
- `is_stale` = no activity in 30+ days; `is_urgent` = deadline within 14 days or fewer

### CDN limitation
Metabase Cloud CDN blocks dashboard PUT requests with 7+ dashcards (returns HTML 404 "Metabase instance not found"). Maximum 6 dashcards per PUT. Card 1630 (Advanced Multi-Filter) was not added to Dashboard 727 due to this limit. Can be added manually via Metabase UI.

---

## Cards — Staff Time Management (Dashboard 661)

| Card ID | Name | Type | Notes |
|---------|------|------|-------|
| 1919 | Weekly Time by Staff Member | Bar | Week × timekeeper series breakdown |
| 1920 | Time by Matter – Staff Breakdown (Current Month) | Table | SQL pivot — manual column per staff |
| 1921 | Total Time by Staff Member (Last 13 Weeks) | Bar | 13-week rolling window |
| 1948 | KPI: Total Hours This Week | Scalar | Live weekly total |
| 1949 | KPI: Total Hours This Month | Scalar | MTD total |
| 1950 | KPI: Total Hours This Quarter | Scalar | QTD total |
| 1951 | Hours by Staff Member – Current Month | Pie | Distribution rings |
| 1952 | Hours by Matter Type – Current Month | Pie | Admin vs client time |
| 1953 | Week-over-Week: Hours by Staff | Grouped bar | Trend comparison |
| 1954 | Matter vs Admin Time by Staff – Current Month | Stacked bar | Client vs non-client |
| 1955 | Recording Compliance – % of Working Days | Table | Days with entries vs working days |
| 1956 | Staff Performance Summary – vs KPI Target | Table | Hours% vs KPI per person |

---

## Cards — Billing / KPI Performance

| Card ID | Name | Type | Notes |
|---------|------|------|-------|
| 2278 | Participant KPI Summary — Jan–Mar 2026 | Table | All-staff view. Replicates Actionstep KPI Summary report. 16 staff, 6 months × (Act Hrs, KPI Hrs, Hrs%, Act Inv, KPI Inv, Inv%) |
| 2311 | My KPI Summary — Jan–Mar 2026 | Table | Single-person view of Card 2278. Template tag: `{{participant_id}}` (number). Used in Dashboard 694. |
| 2312 | My Monthly Performance Trend — 2026 | Bar | Unpivoted monthly data — one row per month per person. Template tag: `{{participant_id}}`. X=Month, Y=Actual vs KPI hours. |
| 2313 | My Open Matters | Table | Active matters where participant is Case Manager. Template tag: `{{participant_id}}`. Columns: File Ref, Matter Name, Visa Type, Stage, Days Open, Last Activity. |

---

## Pending Cards

*(None — all planned visualization cards delivered)*

---

## Pending Tasks (Open Notion Tasks)

| Task | Priority | URL |
|------|----------|-----|
| Build Individual & Team KPI Dashboards via Signed Embedding | **DONE** | https://www.notion.so/31ee1901e36e813ebb0acbf9a6cb6f5e |
| Add visualization cards to SPQR Active Matters dashboard | **DONE** | https://www.notion.so/309e1901e36e8105bca5e1edfb633b37 |
| Optimize SPQR dashboard staff dropdown filtering | Normal | https://www.notion.so/309e1901e36e81bbbcdfd24842cd8796 |
| Configure Metabase KPI dashboards for legal staff My Workspace | Normal | https://www.notion.so/31ae1901e36e813b8b18fefd81463bfb |
| Deploy SPQR dashboard link to RML Intranet | TBC | https://www.notion.so/309e1901e36e8165babbf28c710d14a1 |
| Phase 5: Link Position Description KPIs to Metabase dashboards | TBC | https://www.notion.so/309e1901e36e812ebc2ff2322048fb01 |
| User test SPQR dashboard with team members | TBC | https://www.notion.so/308e1901e36e81cdbf3bee66650e51cc |
