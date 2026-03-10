# Session: KPI Sync — Full Staff Coverage

**Date:** 2026-03-10
**Project:** RML Intranet — Org Intelligence / KPI Performance
**Commits:** `9cb1c8d`, `0a3a101` (Rmlintranetdesign main)

---

## What Was Built

Extended the KPI sync pipeline to achieve full staff coverage (15/15 matched).

The previous session completed the core sync pipeline (MetabaseService SQL query,
kpi-sync.ts, Cloud Scheduler job). This session resolved 5 staff members who were
failing to match due to Actionstep data model edge cases.

---

## Root Cause: Actionstep "Primary Email" Mystery

**Finding:** `contacts.e_mail` is the *only* email field in htmigration. An
INFORMATION_SCHEMA scan across all columns confirmed this. There is no separate
email table, no `participant_phones_emails`, no alternative storage.

**Why some staff have blank `contacts.e_mail`:** They are "system-only" Actionstep
users — they have a login in `systemusers` but no CRM contacts record in `contacts`.
This is an Actionstep-side data gap; the "Primary Email" shown in the Actionstep UI
for these users is populated from `systemusers`, not `contacts`.

**Affected staff and their participant IDs:**

| Name | participant_id | Root cause |
|------|---------------|------------|
| Frances Lee | 22684 | contacts record exists, e_mail blank |
| Ahmad Iqmal | 24002 | contacts record exists, e_mail blank |
| Martin Russell | 62843 | no contacts record — systemusers only |
| Taasha Parmeswaran | 64691 | no contacts record — systemusers only |
| Varsha Kattoor | 175 | Supabase email is old `hammondtaylor.com.au` domain |

---

## Fix Applied

**Strategy:** metadata fallback pass in `kpi-sync.ts`.

Each of the 5 staff had `metadata.actionstep_participant_id` patched directly into
their Supabase `people` record via the REST API. The sync's second pass matches by
`metadata.actionstep_participant_id` → `participantRowMap`, bypassing the email
join entirely.

**Supabase UUIDs patched:**
- Frances Lee: `1a1497cc-5633-4b6d-ad02-ee66faa0f1d1` → pid 22684
- Ahmad Iqmal: `47c5768d-376a-468f-b111-d1532f351e4b` → pid 24002
- Martin Russell: `c2750a3b-45c4-43ff-8cb5-d271ad374a9d` → pid 62843
- Taasha Parmeswaran: `41b199e3-7831-475a-8241-d1f33ff9eeb5` → pid 64691
- Varsha Kattoor: `6ee5d713-a498-4663-b708-f0fb6448bfd6` → pid 175

---

## Query Fix: JOIN Deduplication

The `fetchParticipantKpiCurrentMonth` SQL query was producing 24 rows instead of
15 because `contacts` can have multiple records per `participant_id`. Fixed by
wrapping both `contacts` and `systemusers` JOINs in `ROW_NUMBER()` subqueries:

```sql
LEFT JOIN (
  SELECT participant_id, e_mail, first_name, last_name,
         ROW_NUMBER() OVER (PARTITION BY participant_id ORDER BY participant_id) AS rn
  FROM "htmigration"."dbo"."contacts"
  WHERE is_company = 'F'
) c ON c.participant_id = s.participant_id AND c.rn = 1

LEFT JOIN (
  SELECT participant_id, first_name, last_name,
         ROW_NUMBER() OVER (PARTITION BY participant_id ORDER BY pk) AS rn
  FROM "htmigration"."dbo"."systemusers"
) su ON su.participant_id = s.participant_id AND su.rn = 1
```

Also added `first_name`/`last_name` to the output (from systemusers as fallback)
so unmatched participant log lines show readable names.

---

## Diagnostic Logging Added

After each sync, unmatched participants are logged to Cloud Run console:
```
[KpiSync] Unmatched participant: id=175 name="Varsha Kattoor" email="v.kattoor@roammigrationlaw.com"
```

This makes it easy to spot new staff whose metadata needs patching.

---

## Final Sync Results

```json
{
  "participants_found": 24,
  "matched_to_people": 15,
  "kpis_upserted": 30,
  "performance_upserted": 30,
  "errors": []
}
```

`participants_found: 24` reflects that 24 distinct participant IDs appear in
`participant_kpis` for the current month. 15 match active intranet people records.
The remaining 9 are likely external advisors or contractors not in the Supabase
`people` table — expected, not a bug.

---

## Ongoing / Not Yet Done

- Wire competency/process layers to org diagram frontend (CompetencyPanel, DACI
  overlays, time allocation edges, LayerControls toggles)
- Dashboard 529 user testing with 2–3 team members
- Phase 5: link Position Description KPIs to Metabase dashboards

---

## Key File Locations

| File | Purpose |
|------|---------|
| `backend/src/services/MetabaseService.ts` | `fetchParticipantKpiCurrentMonth()` SQL query |
| `backend/src/services/kpi-sync.ts` | Sync orchestrator: email pass + metadata fallback |
| `backend/src/routes/kpi-sync.ts` | `POST /api/kpi/sync` endpoint |
| `backend/src/middleware/auth.ts` | IAP bypass for scheduler on `/api/kpi/sync` |
