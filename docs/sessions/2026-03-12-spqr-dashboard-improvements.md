# Session Notes — SPQR Dashboard Improvements
**Date:** 2026-03-12
**Project:** SPQR / Metabase BI + RML Intranet
**Dashboards touched:** 529 (Staff WIP), 727 (Active Matters Overview)

---

## What Was Completed

### 1. Progressive KPI Hours — Cards 2450 & 2451

Updated both KPI cards to prorate the monthly target to the current day, making the metric meaningful mid-month.

**Formula:**
```sql
prorated_target = monthly_target
    * CAST(DAY(GETDATE()) AS FLOAT)
    / CAST(DAY(EOMONTH(GETDATE())) AS FLOAT)
```

`EOMONTH(GETDATE())` returns the last day of the current month — `DAY()` on that gives total days in the month without a CASE table.

**Results (March 12, day 11 UTC):**
| Staff | Actual | Prorated Target | % of Pace |
|---|---|---|---|
| Sarah Fazal | 68.7h | 59.3h | 115.8% |
| Hani Azid | 60.4h | 59.3h | 101.8% |
| Carolina F.R. | 58.4h | 59.3h | 98.3% |
| Vikneswaran | 49.5h | 59.3h | 83.4% |
| Nabilah | 43.6h | 59.3h | 73.5% |
| Davaan | 37.8h | 59.3h | 63.7% |
| Frances Lee | 17.7h | 41.5h | 42.7% |
| Yashvinee | 18.1h | 59.3h | 30.5% |
| Ahmad | 15.5h | 59.3h | 26.1% |
| Taasha | 4.4h | 59.3h | 7.3% |
| Varsha | 2.7h | 59.3h | 4.6% |

Firm total: 59.3% of prorated pace. Card 2450 renamed "KPI Hours % (Prorated to Today)", card 2451 renamed "KPI Hours % by Staff (Prorated)". New `prorated_target_hrs` column added to 2451 table.

**Note:** Server is UTC — proration uses UTC day (day 11 on March 12 AEDT morning). Consistently applied across all staff.

---

### 2. Urgent Matters Drill-Down — Card 2449 → Card 2542

Created **Card 2542 "Urgent Matters — Detail"** in collection 133.

- Shows all urgent matters (deadline ≤14 days, active, non-finalised) sorted by deadline ASC
- Columns: matter ID (Actionstep link), matter name (Actionstep link), type, stage, client, CM, SA, deadline date, event type, days remaining
- Click behaviour on Card 2449 (scalar count) set to `linkType: "question", targetId: 2542`

**Live urgent matters at session time:**
| Matter | CM | Deadline | Days |
|---|---|---|---|
| Taruna Raghuwanshi — 186 Visa | Varsha Kattoor | Mar 13 | 1 |
| Shounak Vijay — 186 DE | Davaan Jayabalan | Mar 13 | 1 |
| Shane Keating — 482V | Davaan Jayabalan | Mar 16 | 4 |
| Jithu George — 186 Visa | Jisha John | Mar 24 | 12 |
| Lin Lin — 186 DE | Carolina F.R. | Mar 26 | 14 |

**Metabase click_behavior format for scalar cards:**
```json
{
  "type": "link",
  "linkType": "question",
  "targetId": 2542
}
```
Goes at the top level of `visualization_settings` (not inside `column_settings`).

---

### 3. Active Matters Page — Upgraded to Signed Iframe

**Problem:** `/bi/active-matters` was a placeholder with a link-out to Dashboard 727. Required separate Metabase login, bad UX.

**Fix:**
- Enabled embedding on Dashboard 727 via `PUT /api/dashboard/727 { enable_embedding: true, embedding_params: {} }`
- Added `GET /api/metabase/active-matters-url` backend route (defaults to dashboard 727, configurable via `METABASE_ACTIVE_MATTERS_DASHBOARD_ID`)
- Rewrote `ActiveMattersPage.tsx` to use signed iframe with postMessage auto-resize, matching `BusinessIntelligencePage` pattern exactly
- Removed placeholder colour guide cards (not applicable to Dashboard 727 which is charts, not a table)

**Deployed:** commit `8c428a4` to intranet `main`, both frontend and backend builds succeeded.

Dashboard 727 has: Total Active Matters, % Stale Matters, Urgent Matters KPI tiles + Matters by CM / Visa Type / Stage charts.

---

## Known Issue Carried Forward — Row Colour Coding (UNRESOLVED)

**Card:** 1688 (Staff WIP), Dashboard 529

**What was tried:**

**Attempt 1 (earlier this session):**
```json
"table.conditional_formatting": [{
  "columns": ["matter_status"],  // WRONG — plural, name array
  "operator": "=",
  "value": "Stale",
  "color": "#F9D45C",
  "highlight_row": true
}]
```

**Attempt 2:**
```json
"table.conditional_formatting": [{
  "column": ["field", "matter_status", {"base-type": "type/Text"}],  // MBQL field ref
  "operator": "=",
  "value": "Stale",
  "color": "#F9D45C",
  "highlight_row": true
}]
```

Both accepted by the API without error but colours did not render on the dashboard.

**SQL is correct:** `matter_status` column returns 'Urgent', 'Stale', 'Normal' correctly. With the updated logic (3 business days, exempt steps), distribution is: Normal 699 / Stale 946 / Urgent 5.

**Stale logic update (applied even though colours not showing):**
- Changed from 30 calendar days → 3 business days (weekday formula)
- Added exempt steps (not stale): Active, Approved, Approved - Permanent Visa, Approved - Temporary Visa, Case File initiated, Closed, Expired, File Closed Pre-Finalisation, Finalised, Lodged, Matter Type Change, Prospect Closed, Subscription Active, Withdrawn

**Business days formula (SQL Server, DATEFIRST=7):**
```sql
DATEDIFF(day, a.last_activity, CAST(GETDATE() AS DATE))
- (DATEDIFF(week, a.last_activity, CAST(GETDATE() AS DATE)) * 2)
- CASE WHEN DATEPART(weekday, a.last_activity) = 1 THEN 1 ELSE 0 END
+ CASE WHEN DATEPART(weekday, CAST(GETDATE() AS DATE)) = 7 THEN 1 ELSE 0 END
```

**Suspected root cause:** Metabase v58 may not support conditional formatting on hidden columns for native SQL queries. The `matter_status` column is `"enabled": false` in `table.columns`.

**Next session:** Try enabling `matter_status` as a visible column and re-test. If that works, the fix is confirmed — hidden columns don't trigger conditional formatting in v58. Can then either leave it visible or investigate whether there's a workaround (e.g. using `days_since_activity` as the conditional column since it's already in the results).

---

## API Patterns Confirmed This Session

### Conditional formatting format (Metabase v58, native SQL)
The correct format is `"column"` (singular) with MBQL field ref:
```json
{
  "id": "uuid",
  "type": "single",
  "operator": "=",
  "value": "Stale",
  "color": "#F9D45C",
  "highlight_row": true,
  "column": ["field", "column_name", {"base-type": "type/Text"}]
}
```
Despite this being the correct format, colours still did not render — see above.

### Click behaviour on scalar cards
```json
"visualization_settings": {
  "click_behavior": {
    "type": "link",
    "linkType": "question",
    "targetId": <card_id>
  }
}
```

### Prorated KPI metric
Pre-aggregate each side in subqueries before joining to avoid denominator inflation. See `fetchParticipantKpiCurrentMonth` in `MetabaseService.ts` for the same pattern applied to the backend.
