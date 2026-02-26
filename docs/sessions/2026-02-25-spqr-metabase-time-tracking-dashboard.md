# Session: SPQR Metabase Time Tracking Dashboard

**Date:** 2026-02-25
**Project:** SPQR Dashboard / htmigration
**Branch:** fix/p1-documentation-updates

---

## What Was Accomplished

Built a complete staff time management dashboard in Metabase (Collection 133 — SPQR Dashboards) from scratch, including SQL queries, card creation, and dashboard layout.

### Cards Created

| Card ID | Name | Type |
|---|---|---|
| 1919 | Weekly Time by Staff Member | Bar (week × timekeeper series) |
| 1920 | Time by Matter – Staff Breakdown (Current Month) | Table (SQL pivot) |
| 1921 | Total Time by Staff Member (Last 13 Weeks) | Bar |
| 1948 | KPI: Total Hours This Week | Scalar |
| 1949 | KPI: Total Hours This Month | Scalar |
| 1950 | KPI: Total Hours This Quarter | Scalar |
| 1951 | Hours by Staff Member – Current Month | Pie |
| 1952 | Hours by Matter Type – Current Month | Pie |
| 1953 | Week-over-Week: Hours by Staff | Grouped bar |
| 1954 | Matter vs Admin Time by Staff – Current Month | Stacked bar |
| 1955 | Recording Compliance – % of Working Days | Table |
| 1956 | Staff Performance Summary – vs KPI Target | Table |

### Dashboard

- **ID:** 661
- **URL:** https://wealth-fish.metabaseapp.com/dashboard/661
- **Name:** Staff Time Management
- **Layout:** KPI row → Distribution rings → Weekly trend → Comparison bars → Compliance grid → Performance table

---

## Key Technical Decisions

### 1. SQL Pivot Instead of Metabase Pivot Display

Metabase's `display: "pivot"` fails on native SQL queries with error: _"Pivot tables can only be used with aggregated queries."_ Root cause: native SQL cards lack the aggregation metadata Metabase's UI pivot requires.

**Fix:** Use SQL conditional aggregation — one `SUM(CASE WHEN timekeeper = '...' THEN hours END)` column per staff member. Produces a regular table with no Metabase feature dependency.

```sql
CAST(SUM(CASE WHEN timekeeper = 'Hani Azid' THEN actual_hours ELSE 0 END) AS DECIMAL(10,2)) AS [Hani Azid],
```

### 2. Working Days Formula (Monday Anchor)

Standard `DATEDIFF(day, ...)` counts calendar days. To count Mon–Fri days exclusively, use the `'1900-01-01'` Monday anchor:

```sql
-- wd(d) = Mon-Fri days from anchor to day d (exclusive)
d/7*5 + CASE WHEN d%7 < 5 THEN d%7 ELSE 5 END

-- Weekdays from period_start to today (inclusive):
wd(DATEADD(day,1,GETDATE())) - wd(period_start_date)
```

Since `'1900-01-01'` was a Monday, `d % 7` gives `0=Mon, 1=Tue, ..., 5=Sat, 6=Sun`. No `SET DATEFIRST` dependency.

**Critical gotcha:** Using `GETDATE()` (not `DATEADD(day,1,GETDATE())`) as the end boundary excludes today from the count. Always use `+1 day` for inclusive calculation.

### 3. KPI Target Join

Staff KPI targets live in `participant_kpis` (daily rate, `actual_hours = 7.6` hrs/day for most staff in 2026). Join via `timekeeper_participant_id = participant_id`.

- Performance % = `actual_hours / (kpi_daily × working_days_elapsed) × 100`
- Current week denominator = days elapsed Mon–today (not always 5), so Monday at 100% means they recorded today
- Prior weeks always denominator = 5 (complete weeks)
- Staff without a KPI record default to `7.6` via `ISNULL(k.kpi_daily, 7.6)`

**Data issue found:** Sarah Fazal had `kpi_daily = 21.0` for Feb 2026 (data entry error in Actionstep). User corrected it during session.

### 4. Metabase Dashboard API (v1.58.7)

The POST `/api/dashboard/{id}/cards` endpoint is deprecated in v1.49+. Use:

```
PUT /api/dashboard/{id}/cards
Body: {"cards": [{"id": -1, "card_id": ..., "row": ..., "col": ..., "size_x": ..., "size_y": ..., "parameter_mappings": [], "visualization_settings": {}}]}
```

Temporary negative IDs (`-1, -2, ...`) are used for new cards being placed.

### 5. Date Guard on View_time_entries_actions

The view contains a record with `timesheet_date = '3716-01-19'` (Actionstep data entry error). Always add `AND timesheet_date <= GETDATE()` as an upper bound to prevent this corrupting week-boundary calculations.

---

## Database Reference

- **View:** `"htmigration"."dbo"."View_time_entries_actions"` (snake_case columns, no brackets needed)
- **KPI table:** `"htmigration"."dbo"."participant_kpis"` (year/month as VARCHAR, actual_hours = daily rate in 2026)
- **Join key:** `timekeeper_participant_id = participant_id`
- **Deployment:** PYTHONPATH="/home/jtaylor/google-cloud-sdk/lib/third_party" python3 script.py (no `requests` module in system Python)

---

## Leave / Holiday Reconciliation (Scoped for Next Session)

Current working days formula counts Mon–Fri with no awareness of:
- Public holidays (AU and MY — firm has staff in both)
- Annual leave
- Contractor leave

**Finding:** `htmigration` has no leave or holiday tables. No leave entries in time entry descriptions.

**Proposed approach (next session):** Sync from Google Calendar, which already consolidates:
- Employment Hero leave → company calendar
- Contractor leave → calendar
- AU and MY public holidays → Google's built-in holiday calendars

**Architecture:**
```
Google Calendar → daily sync job (Cloud Scheduler + Cloud Run) → two reference tables in htmigration
   - public_holidays (date, name, country)
   - staff_leave_days (participant_id, leave_date)
Metabase SQL subtracts these from working_days denominator
```

**Open question:** Employment Hero calendar event format — need to confirm whether leave events are in a single shared calendar or per-person calendars, and how staff names appear in event titles.

---

## Lessons Learned

1. **Always test Metabase pivot on native SQL first** — the feature has a silent incompatibility with native queries; SQL pivot is more reliable and portable.
2. **Verify KPI data before building % calculations** — the Sarah Fazal 21.0 anomaly would have produced confusing results silently.
3. **The `+1 day` boundary fix** for inclusive working day counts is easy to miss and produces off-by-one errors in compliance percentages.
4. **Metabase API version matters** — dashboard card placement API changed in v1.49; check version before using POST vs PUT.
