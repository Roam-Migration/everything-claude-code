# Session: SPQR Active Matters — Visualization Cards

**Date:** 2026-03-09
**Project:** SPQR Dashboard
**Notion Task:** https://www.notion.so/309e1901e36e8105bca5e1edfb633b37 (DONE)

---

## What Was Built

Full delivery of Notion task "Add visualization cards to SPQR Active Matters dashboard".

New dashboard created: **Active Matters Overview** (ID 727, Collection 133).

---

## New Cards Created

| Card ID | Name | Type | SQL approach |
|---------|------|------|--------------|
| 2344 | Matters by Case Manager | Bar (horizontal) | GROUP BY case_manager, stage — deduped with ROW_NUMBER() |
| 2345 | Matters by Stage | Bar (horizontal) | GROUP BY stage — deduped |
| 2346 | Matters by Visa Type | Donut | GROUP BY matter_type — deduped |
| 2347 | KPI: Total Active Matters | Scalar | COUNT(*) active matters |
| 2348 | KPI: % Stale Matters | Scalar | stale / total × 100, formatted as % |
| 2349 | KPI: Urgent Matters | Scalar | COUNT where is_urgent=1 |

---

## Dashboard Layout (Dashboard 727)

| Row | Col | Size | Card | Content |
|-----|-----|------|------|---------|
| 0 | 0 | 8×4 | 2347 | KPI: Total Active Matters |
| 0 | 8 | 8×4 | 2348 | KPI: % Stale Matters |
| 0 | 16 | 8×4 | 2349 | KPI: Urgent Matters |
| 4 | 0 | 14×12 | 2344 | Matters by Case Manager |
| 4 | 14 | 10×12 | 2346 | Matters by Visa Type |
| 16 | 0 | 24×8 | 2345 | Matters by Stage |

---

## Key Technical Decisions

### Why native SQL instead of the Active Matters Overview v2 model?

Model ID 1685 (Active Matters Overview v2) includes `SELECT TOP 100` which caps the result set at 100 rows. This prevents correct aggregation for cards that GROUP BY or COUNT(*). All 6 new cards use native SQL directly against `htmigration.dbo.actions`.

### Deduplication pattern

Some active matters have dual Case Manager assignments (2 rows per action_id in `action_participants`). Without deduplication, counts are inflated. Pattern used:

```sql
WITH dedupe AS (
  SELECT a.*,
    ROW_NUMBER() OVER (PARTITION BY a.action_id ORDER BY ap.participant_id DESC) AS rn
  FROM htmigration.dbo.actions a
  LEFT JOIN htmigration.dbo.action_participants ap
    ON a.action_id = ap.action_id AND ap.participant_type_name = 'Case Manager'
  WHERE a.status = 'Active'
)
SELECT ... FROM dedupe WHERE rn = 1
```

### Staleness / urgency definitions

- **Stale:** No activity recorded in 30+ days. Used `view_combination_key_dates` for last activity date.
- **Urgent:** Deadline (relevant date field) falls within 14 days from today.

---

## CDN Limitation Discovery

Metabase Cloud CDN blocks `PUT /api/dashboard/{id}` requests with 7+ dashcards, returning HTML 404 ("Metabase instance not found"). This is not a body-size limit — a 563-byte 7-card payload also fails, while an 821-byte 6-card payload succeeds. The CDN appears to enforce a 6-dashcard maximum per PUT.

**Workaround:** Build dashboards in multiple PUT calls of ≤6 cards. On each PUT, supply the existing dashcard IDs (from a prior GET) alongside any new cards (id=-1).

**Impact:** Card 1630 (Advanced Multi-Filter — existing MVP card) was not added to Dashboard 727 due to this limit. All 6 required new visualization cards are present.

**Manual step:** Add card 1630 to Dashboard 727 via Metabase UI if needed.

---

## Endpoints Used

- `POST /api/card` — create each new card
- `POST /api/dashboard` — create dashboard 727
- `GET /api/dashboard/727` — retrieve dashcard IDs before each PUT
- `PUT /api/dashboard/727` — add dashcards in 2-3 batches of ≤6

All authenticated via `x-api-key` header (GCP Secret Manager: `metabase-api-key`).

---

## Known Follow-ups

1. **Card 1630 on Dashboard 727** — add via Metabase UI (CDN blocks 7-card API PUT)
2. **Dashboard 727 not yet linked from RML Intranet** — Notion task "Deploy SPQR dashboard link to RML Intranet" still open
3. **Filter connectivity** — current cards use native SQL and do not inherit dashboard filter parameters. If dashboard-level filters are added later, cards will need to be rebuilt via GUI Query Builder using the model.
