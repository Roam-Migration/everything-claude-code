# Session: Integrated Calendar Pipeline Setup

**Date:** 2026-02-25
**Project:** 2026 Planning Implementation + SPQR BI Dashboard
**Branch:** fix/p1-documentation-updates

---

## What Was Accomplished

1. **Scoped and created 4 new Notion tasks** linked to 2026 Planning Implementation project
2. **Investigated Employment Hero iCal feed structure** — confirmed calendar format, event schema, staff name patterns
3. **Created 3 SQL Server tables** in `htmigration.dbo` via Metabase API
4. **Seeded all tables** with initial data: 20 staff name mappings, 26 public holidays (AU+MY), 49 leave day rows from current iCal

---

## Architecture: Integrated Calendar Pipeline

```
EH iCal feed ─────────────────────────────────────┐
  (leave events, future only)                      │
                                                   ▼
Contractor leave GCal ─────────────────> iCal → htmigration sync job
  (to be created)                                  │
                                                   ▼
AU/MY public holiday GCals ───────────> [public_holidays] table
  (to be configured)                    [staff_leave_days] table
                                        [staff_name_lookup] table (static config)
                                                   │
                              ┌────────────────────┤
                              ▼                    ▼
                   Metabase SQL queries      RML Intranet
                   (working-days formula)   calendar embed
```

---

## iCal Feed Investigation Findings

### Feed Details
| Property | Value |
|---|---|
| **EH native iCal URL** | `https://employmenthero.yourpayroll.com.au/PublicCalendar/Feed/%24ev2%24RGRURi9SWGpRcmJLdTVOa09wTlpxUT09` |
| **GCal Calendar ID** | `j2gm8g6u0rp038bn2j4oee5ha107el40@import.calendar.google.com` |
| **GCal iCal URL** | `https://calendar.google.com/calendar/ical/j2gm8g6u0rp038bn2j4oee5ha107el40%40import.calendar.google.com/public/basic.ics` |
| **GCal embed URL** | `https://calendar.google.com/calendar/embed?src=j2gm8g6u0rp038bn2j4oee5ha107el40%40import.calendar.google.com&ctz=Australia%2FMelbourne` |

### Key Technical Facts
- **Single shared calendar** — all staff leave in one feed (not per-person)
- **Future events only** — no historical data available via iCal
- **All-day events** — `DTSTART;VALUE=DATE` format (not datetime)
- **DTEND is exclusive** — a 1-day event on Apr 7 has `DTEND=Apr 8`
- **Multi-day events** — blocks must be expanded into individual daily rows
- **CRLF line endings** — strip `\r` when parsing field values

### SUMMARY Parsing Rule
```python
# Format: "{Leave Type}: {Staff Name}"  or  "{Leave Type} - {Variant}: {Staff Name}"
leave_type = summary.split(':', 1)[0].strip()
eh_name    = summary.split(':', 1)[1].strip()
```

### Leave Types Observed
- `Annual Leave`
- `Annual Leave - B` (variant type)
- Others likely exist (Sick Leave, Personal Leave) — not in current dataset

### Staff Name Inconsistencies (CRITICAL)
EH uses legal names; Actionstep uses preferred/display names. These differ:

| EH iCal name | Actionstep name | participant_id |
|---|---|---|
| `Farrahani Azid` | Hani Azid | 30734 |
| `Aaron Heath Taylor` | Aaron Taylor | 2013 |
| `Sarah Najihah Fazal` | Sarah Fazal | 3733 |
| `A Rum Han` | Emily Han (legal: Arum Han) | 24 |

**Recommendation:** Use the EH native feed (not GCal synced) — GCal re-generates UIDs on import.

---

## Tables Created in `htmigration.dbo`

### `dbo.public_holidays`
```sql
id            INT IDENTITY(1,1) PRIMARY KEY
holiday_date  DATE          NOT NULL
holiday_name  NVARCHAR(255) NOT NULL
country       NVARCHAR(10)  NOT NULL   -- 'AU', 'MY'
synced_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
UNIQUE (holiday_date, country, holiday_name)
INDEX ix_public_holidays_date (holiday_date)
```

### `dbo.staff_leave_days`
```sql
id              INT IDENTITY(1,1) PRIMARY KEY
participant_id  INT           NOT NULL   -- FK to action_participants (INT type)
leave_date      DATE          NOT NULL
leave_type      NVARCHAR(100) NOT NULL   -- 'Annual Leave', 'Sick Leave', etc.
eh_display_name NVARCHAR(255) NOT NULL   -- raw EH name, for audit/debugging
calendar_source NVARCHAR(50)  NOT NULL DEFAULT 'employment_hero'
                                         -- 'employment_hero' or 'contractor'
synced_at       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
UNIQUE (participant_id, leave_date, calendar_source)
INDEX ix_staff_leave_days_date        (leave_date)
INDEX ix_staff_leave_days_participant (participant_id)
```

### `dbo.staff_name_lookup`
```sql
id              INT IDENTITY(1,1) PRIMARY KEY
eh_display_name NVARCHAR(255) NOT NULL   -- name as it appears in EH iCal SUMMARY
participant_id  INT           NOT NULL   -- maps to action_participants.participant_id
notes           NVARCHAR(500) NULL
UNIQUE (eh_display_name)
```

---

## staff_name_lookup — Confirmed vs Estimated

All 20 @roammigrationlaw.com staff seeded. Status:

| Status | Count | Notes |
|---|---|---|
| CONFIRMED | 3 | Verified against iCal feed |
| CONFIRMED (name variant) | 2 | Farrahani Azid, Sarah Najihah Fazal — confirmed by user |
| ESTIMATED | 15 | Using Actionstep display name; update if EH uses different format |

**Confirmed entries:**
- `A Rum Han` → pid=24 (legal: Arum Han, goes by Emily)
- `Aaron Heath Taylor` → pid=2013 (goes by Aaron Taylor)
- `Sochan Mao` → pid=38786 (active systemuser record)
- `Farrahani Azid` → pid=30734 (goes by Hani Azid; email: f.azid@rml)
- `Sarah Najihah Fazal` → pid=3733 (goes by Sarah Fazal; email: s.najihah@rml)

---

## public_holidays Initial Seed

- **AU (Victoria) 2026:** 12 holidays — all confirmed
- **MY (Federal) 2026:** 14 holidays — 7 fixed-date confirmed, 7 marked `(approx)` for lunar calendar dates

MY approximate entries (will be corrected by Google Calendar sync job):
`Hari Raya Aidilfitri Day 1 & 2`, `Wesak Day`, `Hari Raya Aidiladha`, `Maulidur Rasul`, `Deepavali`

---

## staff_leave_days Initial Seed

49 rows from current EH iCal (future leave only):

| Staff | Dates | Days | Leave Type |
|---|---|---|---|
| Arum Han (pid=24) | 2026-03-16 | 1 | Annual Leave |
| Arum Han (pid=24) | 2026-04-07 | 1 | Annual Leave |
| Sochan Mao (pid=38786) | 2026-04-03 to 2026-04-17 | 15 | Annual Leave |
| Aaron Taylor (pid=2013) | 2026-05-12 to 2026-06-12 | 32 | Annual Leave - B |

---

## Metabase API Pattern (for sync job)

All DDL and data operations used the Metabase `/api/dataset` endpoint directly — no MCP tools needed:

```python
import subprocess, json

def run_sql(sql):
    r = subprocess.run([
        'curl', '-s', '-X', 'POST',
        'https://wealth-fish.metabaseapp.com/api/dataset',
        '-H', 'X-API-Key: ' + API_KEY,
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({'database': 34, 'type': 'native', 'native': {'query': sql}})
    ], capture_output=True, text=True)
    d = json.loads(r.stdout)
    # INSERT/DDL returns this "error" — it means success
    if d.get('error') == 'The statement did not return a result set.':
        return []
    return d['data']['rows']
```

**Database:** 34 (htmigration SQL Server), `dbo` schema, all tables `snake_case`

---

## Next Session: Build iCal → htmigration Sync Service

### Task
Notion: https://www.notion.so/312e1901e36e8140a356eb71a74cd934

### What to Build
A scheduled service (Cloud Run Job or standalone script) that:
1. Fetches EH iCal → inserts/updates `staff_leave_days` (calendar_source='employment_hero')
2. Fetches contractor leave GCal → inserts/updates `staff_leave_days` (calendar_source='contractor')
3. Fetches AU + MY public holiday GCals → inserts/updates `public_holidays`
4. Runs daily (AEST 06:00 or similar)

### Sync Design Decisions (already made)

| Decision | Choice | Reason |
|---|---|---|
| iCal source | EH native feed (not GCal synced) | GCal re-generates UIDs on import |
| Date expansion | `range(DTSTART, DTEND)` | DTEND is exclusive in iCal |
| Deduplication | UNIQUE constraint + IF NOT EXISTS | Tables already have constraints |
| Staff filtering | @roammigrationlaw.com staff only | staff_name_lookup restricted to RML |
| Name resolution | staff_name_lookup table | EH legal names ≠ Actionstep display names |
| Historical data | Forward-looking only | iCal only exposes future approved leave |
| Multi-day events | Expand to daily rows | Metabase SQL needs per-day granularity |

### Suggested Sync Logic

```python
from icalendar import Calendar  # pip install icalendar
import urllib.request, json
from datetime import date, timedelta

def fetch_ical(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'CalSync/1.0'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return Calendar.from_ical(r.read())

def expand_event_to_dates(dtstart, dtend):
    """DTEND is exclusive — yields each date in [dtstart, dtend)"""
    d = dtstart
    while d < dtend:
        yield d
        d += timedelta(days=1)

def sync_leave(cal, name_lookup, rml_pids, source):
    for component in cal.walk():
        if component.name != 'VEVENT':
            continue
        summary = str(component.get('SUMMARY', ''))
        if ':' not in summary:
            continue
        leave_type = summary.split(':', 1)[0].strip()
        eh_name    = summary.split(':', 1)[1].strip()
        pid = name_lookup.get(eh_name)
        if not pid or pid not in rml_pids:
            log_unmatched(eh_name)
            continue
        dtstart = component.decoded('DTSTART')
        dtend   = component.decoded('DTEND')
        for leave_date in expand_event_to_dates(dtstart, dtend):
            upsert_leave_day(pid, leave_date, leave_type, eh_name, source)
```

### Upsert Strategy for htmigration SQL Server
```sql
-- SQL Server MERGE (preferred over IF NOT EXISTS loop for bulk)
MERGE staff_leave_days AS target
USING (VALUES (@pid, @date, @type, @name, @source))
    AS source (participant_id, leave_date, leave_type, eh_display_name, calendar_source)
ON target.participant_id = source.participant_id
   AND target.leave_date = source.leave_date
   AND target.calendar_source = source.calendar_source
WHEN NOT MATCHED THEN
    INSERT (participant_id, leave_date, leave_type, eh_display_name, calendar_source)
    VALUES (source.participant_id, source.leave_date, source.leave_type,
            source.eh_display_name, source.calendar_source);
```

### Blocking Dependencies Before Build
1. **Contractor leave GCal** — create the calendar and get its iCal URL
   - Notion task: https://www.notion.so/312e1901e36e81d8b05ffbb5c69cd5e5
2. **AU/MY public holidays GCal** — subscribe and get calendar iCal URLs
   - Notion task: https://www.notion.so/312e1901e36e8130b0fdca4ce21555ba
3. **staff_name_lookup verification** — 15 estimated entries need verification against EH profiles

### Outstanding staff_name_lookup Entries to Verify
The following have Actionstep names as estimated EH names — check against EH employee profiles:
`Alex Long`, `Carolina Fernandez Ruys`, `Davaan Jayabalan`, `Dawn Maree`, `Jackson Taylor`,
`Jisha John`, `Joshua Taylor`, `Kylie Treser`, `Nabilah Amani`, `Phoebe Yap`,
`Shahrul Izwani`, `Sochan Mao`, `Varsha Kattoor`, `Vikneswaran Khetre`,
`Yashvinee Sivalingam`, `Yvette Gasic`

---

## Notion Tasks Completed This Session

| Task | Status | Notion URL |
|---|---|---|
| Investigate GCal structure for EH leave events | Done | https://www.notion.so/311e1901e36e81e480a1f5aafc2eed2a |
| Create public_holidays and staff_leave_days tables | Done | https://www.notion.so/311e1901e36e8110826ee304de567276 |

## Notion Tasks Created This Session

| Task | Notion URL |
|---|---|
| Build iCal → htmigration sync service | https://www.notion.so/312e1901e36e8140a356eb71a74cd934 |
| Set up contractor leave Google Calendar | https://www.notion.so/312e1901e36e81d8b05ffbb5c69cd5e5 |
| Add AU and MY public holiday calendars | https://www.notion.so/312e1901e36e8130b0fdca4ce21555ba |
| Implement GCal → Notion Meetings DB sync | https://www.notion.so/312e1901e36e810cac9ddde5e76e79c1 |
