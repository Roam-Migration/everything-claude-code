# Session Notes — Metabase Data Studio + Dashboard 529 Rebuild
**Date:** 2026-03-12
**Project:** SPQR / Metabase BI
**Dashboards touched:** 529 (Intranet Basic), 662–668 (Sochan — recommendations only)

---

## What Was Completed

### 1. Metabase Data Studio Skill (ECC)

Created `skills/metabase-data-studio/SKILL.md` — comprehensive skill covering all four Starter plan features:
- **Measures** — reusable saved aggregations
- **Segments** — reusable saved filter conditions
- **Glossary** — business term definitions for humans and AI
- **Data Structure** — table/column metadata and semantic types

Key SPQR content included: 7 Measures, 6 Segments, 10 Glossary terms, column annotation tables for 5 tables. 3-session rollout plan + pre-session checklist + common issues section.

**Critical finding:** Metabase instance is on v1.58.7 — Data Studio UI panel (grid icon) not yet available. Upgrade to v1.59 required for Measures and Glossary UI. Segments and column annotation work via API in v58.

---

### 2. Sochan Dashboard Recommendations Doc

Created `docs/sessions/2026-03-11-sochan-data-studio-recommendations.md`.

Reviewed Sochan's 7-dashboard SPQR system (662 Navigation Hub + 663–668):
- All cards are GUI query builder — ideal for Measures/Segments, no rewrites needed
- Identified 6 Measures to create, 6 Segments, 14 Glossary terms
- Flagged cross-dashboard inconsistency: "Staff" vs "Assigned To" filter naming (same field, 4 different dashboards)
- Flagged "Avg Margin %" appearing in 3 dashboards — verify formula consistency before creating Measure
- Provided 3-session rollout plan for Sochan

---

### 3. Dashboard 529 — Data Studio Improvements Applied

#### Segments created via API
| ID | Name | Table | Condition |
|----|------|-------|-----------|
| 2 | Active Matters | actions | status = 'Active' |
| 3 | Stale Matters | actions | (via MBQL filter) |
| 4 | Urgent Matters | view_combination_key_dates | deadline within 14 days |

#### Column annotations via PUT /api/field/:id
18 fields annotated across: `actions`, `action_participants`, `contacts`, `participant_kpis`, `vw_staff_members`. Includes semantic types (Entity Key, Email, Name).

#### Measure cards created
Created as saved questions in collection 133, then added to Dashboard 529:

| Card ID | Name | Type | Method |
|---------|------|------|--------|
| 2444 | Active Matter Count | Scalar | GUI |
| 2445 | Stale Matter Count | Scalar | GUI |
| 2446 | Stale Matter % | Scalar | GUI |
| 2449 | Urgent Matter Count | Scalar | GUI |
| 2448 | KPI Hours Actual | Scalar | GUI |
| 2450 | KPI Hours % (Current Month) | Scalar | API |
| 2451 | KPI Hours % by Staff (Current Month) | Table | API |

**KPI Hours % — key technical detail:** Naive JOIN inflates denominator (time_entries has many rows per staff, participant_kpis has one). Fix: pre-aggregate each side in subqueries before joining:
```sql
SELECT CAST(SUM(a.actual_hrs) AS FLOAT) / NULLIF(SUM(t.target_hrs), 0) * 100
FROM (
    SELECT timekeeper_participant_id, SUM(actual_hours) AS actual_hrs
    FROM "htmigration"."dbo"."time_entries"
    WHERE YEAR(timesheet_date) = YEAR(GETDATE()) AND MONTH(timesheet_date) = MONTH(GETDATE())
    GROUP BY timekeeper_participant_id
) a
INNER JOIN (
    SELECT participant_id, SUM(actual_hours) AS target_hrs
    FROM "htmigration"."dbo"."participant_kpis"
    WHERE year = YEAR(GETDATE()) AND month = MONTH(GETDATE())
    GROUP BY participant_id
) t ON a.timekeeper_participant_id = t.participant_id
```

**GUI expression builder limitation (v58):** `dateAdd()` and `dateDiff()` are not available. Date arithmetic for Stale Matter % required switching to native SQL.

#### Dashboard 529 final layout
| Row | Content |
|-----|---------|
| 0 | Text header: "Global KPI Measures" |
| 2 | Active Matter Count · Stale Matter % · Urgent Matter Count · KPI Hours % (4 tiles, 6 wide each) |
| 6 | Text header: "Filter-Dependent View" |
| 8 | KPI Hours % by Staff table (pagination enabled, height 12) |
| 20 | Staff WIP full table (dashcard 2412, card 1688) |

---

## API Patterns Learned (v58 — critical)

### Negative ID sentinel for new dashcards
`PUT /api/dashboard/:id` ignores new dashcards without an `id` field. Use unique negative IDs (-1, -2, -3...) as sentinels — Metabase assigns real IDs on save.

**Fatal mistake:** Multiple dashcards with the same `id: -1` collapse to zero additions. Each new dashcard needs a distinct negative ID.

### PUT /api/dashboard/:id/cards — FULL REPLACEMENT
This endpoint replaces the **entire** dashcards array. Any partial PUT deletes everything not included. Safe pattern:
1. `GET /api/dashboard/:id` to retrieve current `dashcards` array
2. Modify the array in-place (update existing, add new with negative IDs)
3. `PUT /api/dashboard/:id` with the full modified array

**Incident this session:** Pagination fix sent only dashcard 2412 in the PUT body → all other dashcards deleted. Recovered by re-adding all cards from saved questions.

### POST /api/dashboard/:id/cards → 404 in v58
Does not exist. Always use PUT.

---

## Known Issues Carried Forward

1. **Colour coding not appearing** — Stale and Urgent row highlighting on Staff WIP table not visible. Likely needs conditional formatting on the dashcard or the underlying card. Investigate next session.
2. **BI page: table vs card display** — Business Intelligence page currently shows the Staff WIP table directly. Should investigate whether iframe/card format is better UX.
3. **Urgent Matters drill-down** — Card 2449 shows a count only. Should add click-through to detail view of urgent matter list.
4. **Progressive KPI Hours** — Current KPI % compares actual hours to full-month target regardless of date. Should calculate a prorated target based on working days elapsed (e.g. 12 days into March → target = full_month_target × 12/31). This makes the metric meaningful mid-month.

---

## Staff KPI Data (March 2026, 12 days in)
For awareness — 11 staff with KPI records this month:
Sarah Fazal 41.1%, Hani Azid 36.1%, Carolina Fernandez Ruys 34.9%, Vikneswaran Khetre 29.6%, Nabilah Amani 26.1%, Davaan Jayabalan 22.6%, Frances Lee 15.1%, Yashvinee Sivalingam 10.8%, Ahmad Iqmal 9.3%, Taashahyani Parmeswaran 2.6%, Varsha Kattoor 1.6%.

Note: these figures are at 12/31 days elapsed. Varsha and Taasha are significantly behind even accounting for partial month.
