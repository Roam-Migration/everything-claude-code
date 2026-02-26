# Session: Calendar Pipeline Completion

**Date:** 2026-02-26
**Project:** 2026 Planning Implementation + SPQR BI Dashboard
**Branch:** fix/p1-documentation-updates
**Continued from:** `docs/sessions/2026-02-25-integrated-calendar-pipeline-setup.md`

---

## What Was Accomplished

1. **Contractor leave GCal confirmed** — URL provided and verified live (200 OK)
2. **AU and MY holiday GCal URLs confirmed** — feeds analysed, filter logic determined
3. **staff_name_lookup fully cleaned and confirmed** — all 20 entries verified
4. **iCal → htmigration sync service built and deployed** — Cloud Run Job + daily scheduler
5. **Metabase working-days formula updated** — cards 1955 and 1956 now deduct leave + holidays

---

## Calendar URLs (All Confirmed)

| Source | iCal URL |
|---|---|
| EH leave (native) | `https://employmenthero.yourpayroll.com.au/PublicCalendar/Feed/%24ev2%24RGRURi9SWGpRcmJLdTVOa09wTlpxUT09` |
| Contractor leave GCal | `https://calendar.google.com/calendar/ical/c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837%40group.calendar.google.com/private-ede6aea6c1a62dc86b8752399fadc4e6/basic.ics` |
| Contractor GCal Calendar ID | `c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837@group.calendar.google.com` |
| AU public holidays | `https://calendar.google.com/calendar/ical/en.australian%23holiday%40group.v.calendar.google.com/public/basic.ics` |
| MY public holidays | `https://calendar.google.com/calendar/ical/en-gb.malaysia%23holiday%40group.v.calendar.google.com/public/basic.ics` |

---

## staff_name_lookup Final State

**20 entries, all CONFIRMED.** Schema change: added `country NVARCHAR(2) NOT NULL DEFAULT 'AU'`.

### Changes made this session
| Change | Detail |
|---|---|
| Renamed | `Dawn Maree` → `Dawn Taylor` (pid=7733) — EH name is Dawn Taylor |
| Confirmed | All 15 previously estimated entries |
| Deleted | Yvette Gasic, Phoebe Yap, Kylie Treser, Alex Long (left business) |
| Added | Paul Gleeson (pid=1913), Ravi Kumar (pid=3858) |
| Added | Ahmad Iqmal (pid=24002), Frances Lee (pid=22684) — found via `time_entries` (no email in contacts) |
| Added `country` column | Default AU; Sochan Mao set to MY |

### Country column
- `MY`: Sochan Mao (pid=38786) — only confirmed MY staff
- `AU`: all others
- **Action needed**: update country for any other MY-based staff (Nabilah Amani, Shahrul Izwani candidates)
  ```sql
  UPDATE staff_name_lookup SET country = 'MY' WHERE participant_id IN (<pid>)
  ```

### Contractors without Actionstep records (cannot be tracked until added)
| Name | Email |
|---|---|
| Taashahyani Parmeswaran (Taash) | t.parmeswaran@roammigrationlaw.com |
| Bathmawathy Khetre | b.khetre@roammigrationlaw.com |
| Rowda Elmi Yusuf (Abeer Omi) | abeer.omi@roammigrationlaw.com |
| Rebecca Spoor | r.spoor@roammigrationlaw.com |

Once Actionstep contact records exist for these people, add rows to `staff_name_lookup` and the sync service will pick them up automatically.

### Contractor GCal event format
Events must use SUMMARY format: `{Leave Type}: {Staff Name}`
Example: `Annual Leave: Frances Lee`

---

## Sync Service

**Location:** `services/calendar-sync/sync.py` (ECC repo)
**Image:** `gcr.io/rmlintranet/calendar-sync:latest`
**Cloud Run Job:** `rml-calendar-sync` (us-central1)
**Schedule:** `rml-calendar-sync-daily` — daily 06:00 Melbourne time (Cloud Scheduler)
**Secret:** `metabase-api-key` in Secret Manager (rmlintranet project)

### Sync behaviour
- EH leave + contractor leave: DELETE future rows then re-INSERT from iCal (handles cancellations)
- Public holidays: DELETE + re-INSERT for current year + next year per country (handles tentative date changes)
- Melbourne Cup Day: hardcoded in script — not in Google AU feed
- Unmatched staff names logged as `UNMATCHED` in Cloud Run logs

### Manual trigger
```bash
gcloud run jobs execute rml-calendar-sync --project=rmlintranet --region=us-central1
```

### View logs
```
Cloud Console → Cloud Run → Jobs → rml-calendar-sync → Executions → [latest] → Logs
```

---

## Metabase Formula Update

**Cards updated:** 1955 (Recording Compliance) and 1956 (Staff Performance Summary)

### What changed
Added `adj` CTE that computes per-person deductions:
- Public holidays filtered by `staff_name_lookup.country` (AU or MY)
- Approved leave days from `staff_leave_days`

These are subtracted from each period's working-day denominator:
```sql
-- Before
ISNULL(k.kpi_daily, 7.6) * w.mth_elapsed

-- After
ISNULL(k.kpi_daily, 7.6) * NULLIF(w.mth_elapsed - ISNULL(d.adj_mth, 0), 0)
```

Applies to: This Wk, Last Wk, This Mth, Last Mth, This Qtr, YTD (card 1956) and Wk through Wk-4 (card 1955).

Staff not in `staff_name_lookup` get `ISNULL(d.adj_*, 0)` = 0 deductions (no impact, safe default).

---

## Holiday Filter Logic (for reference)

### AU — Victoria + national
- DESCRIPTION contains `Public holiday`
- AND (no "holiday in" state list) OR (description contains `Victoria`)
- Melbourne Cup Day manually seeded — not in Google AU feed

### MY — Federal only
- DESCRIPTION contains `Public holiday`
- AND `(regional holiday)` NOT in SUMMARY
- "(tentative)" holidays included — dates updated when Google confirms them

---

## Next Session: Display Calendar in RML Intranet + Leave Approval Process

### Tasks to work on

1. **Connect Google Calendar embeds in RML Intranet** (existing Intranet Launch task)
   - `PeoplePage.tsx` — staff leave calendar embed (currently a stub)
   - `HomePage.tsx` — team calendar embed (currently a stub)
   - GCal embed URL for EH leave: `https://calendar.google.com/calendar/embed?src=j2gm8g6u0rp038bn2j4oee5ha107el40%40import.calendar.google.com&ctz=Australia%2FMelbourne`
   - Contractor GCal ID: `c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837@group.calendar.google.com`

2. **Leave approval process**
   - Define the workflow (EH is source of truth for approved leave — no separate approval needed?)
   - Determine if contractor leave needs a separate approval workflow via the GCal
   - Clarify: does the contractor GCal require manual entry or is there an integration?

3. **GCal → Notion Meetings DB sync** (Notion: https://www.notion.so/312e1901e36e810cac9ddde5e76e79c1)
   - Sync team meeting events from Google Calendar into Notion Meetings database

### Key repo paths
- Intranet frontend: check `/tmp/Rmlintranetdesign` or rml-intranet Cloud Run service
- Calendar sync service: `services/calendar-sync/sync.py`
- Session notes: this file
