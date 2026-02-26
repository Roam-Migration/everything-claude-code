#!/usr/bin/env python3
"""
RML Calendar Sync Service

Syncs three calendar sources into htmigration SQL Server tables:
  1. Employment Hero iCal    → staff_leave_days (calendar_source='employment_hero')
  2. Contractor leave GCal   → staff_leave_days (calendar_source='contractor')
  3. AU public holidays GCal → public_holidays  (country='AU')
  4. MY public holidays GCal → public_holidays  (country='MY')

Run daily via Cloud Run Job or cron. Requires METABASE_API_KEY env var.

Contractor GCal event SUMMARY format (same as EH):
  "{Leave Type}: {Staff Name}"   e.g. "Annual Leave: Frances Lee"
"""

import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime, timedelta

# ─── Config ───────────────────────────────────────────────────────────────────

METABASE_API_KEY = os.environ.get('METABASE_API_KEY', '')
METABASE_URL     = 'https://wealth-fish.metabaseapp.com/api'
METABASE_DB_ID   = 34

EH_ICAL_URL = (
    'https://employmenthero.yourpayroll.com.au/PublicCalendar/Feed/'
    '%24ev2%24RGRURi9SWGpRcmJLdTVOa09wTlpxUT09'
)
CONTRACTOR_ICAL_URL = (
    'https://calendar.google.com/calendar/ical/'
    'c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837'
    '%40group.calendar.google.com/'
    'private-ede6aea6c1a62dc86b8752399fadc4e6/basic.ics'
)
AU_HOLIDAYS_URL = (
    'https://calendar.google.com/calendar/ical/'
    'en.australian%23holiday%40group.v.calendar.google.com/public/basic.ics'
)
MY_HOLIDAYS_URL = (
    'https://calendar.google.com/calendar/ical/'
    'en-gb.malaysia%23holiday%40group.v.calendar.google.com/public/basic.ics'
)

# Years to sync public holidays for (current + next catches tentative future dates)
SYNC_YEARS = [date.today().year, date.today().year + 1]

# Melbourne Cup Day — first Tuesday of November (VIC only, not in Google AU feed)
MELBOURNE_CUP_DAYS = {
    2026: date(2026, 11, 3),
    2027: date(2027, 11, 2),
    2028: date(2028, 11, 7),
}


# ─── Metabase API ─────────────────────────────────────────────────────────────

def run_sql(sql):
    payload = json.dumps({
        'database': METABASE_DB_ID,
        'type':     'native',
        'native':   {'query': sql},
    }).encode('utf-8')
    req = urllib.request.Request(
        METABASE_URL + '/dataset',
        data=payload,
        headers={
            'X-API-Key':     METABASE_API_KEY,
            'Content-Type':  'application/json',
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.loads(r.read().decode('utf-8'))
    if d.get('error') == 'The statement did not return a result set.':
        return []
    if 'error' in d:
        raise RuntimeError(f"SQL error: {d['error']}\nSQL: {sql[:300]}")
    return d.get('data', {}).get('rows', [])


# ─── iCal parsing ─────────────────────────────────────────────────────────────

def fetch_ical(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'RML-CalSync/1.0'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode('utf-8')


def unfold(text):
    """Remove iCal line folding — continuation lines start with a space or tab."""
    return re.sub(r'\r?\n[ \t]', '', text)


def parse_date(s):
    return date(int(s[:4]), int(s[4:6]), int(s[6:8]))


def parse_events(ical_text):
    """
    Parse VEVENT blocks. Returns list of dicts with keys:
      summary, dtstart (date), dtend (date, exclusive), description
    """
    text = unfold(ical_text)
    events = []
    for block in re.findall(r'BEGIN:VEVENT.*?END:VEVENT', text, re.DOTALL):
        def field(name):
            m = re.search(rf'^{name}[^:\n]*:(.+)$', block, re.MULTILINE)
            return m.group(1).strip().rstrip('\r') if m else ''

        summary  = field('SUMMARY')
        dtstart  = re.search(r'^DTSTART[^:\n]*:(\d{8})', block, re.MULTILINE)
        dtend    = re.search(r'^DTEND[^:\n]*:(\d{8})',   block, re.MULTILINE)
        desc_raw = field('DESCRIPTION')

        if not (summary and dtstart and dtend):
            continue

        events.append({
            'summary':     summary,
            'dtstart':     parse_date(dtstart.group(1)),
            'dtend':       parse_date(dtend.group(1)),
            'description': desc_raw.replace('\\n', ' ').replace('\\,', ','),
        })
    return events


def expand_dates(dtstart, dtend):
    """Yield each date in [dtstart, dtend). DTEND is exclusive in iCal RFC 5545."""
    d = dtstart
    while d < dtend:
        yield d
        d += timedelta(days=1)


# ─── Staff leave sync ─────────────────────────────────────────────────────────

def sync_staff_leave(ical_url, calendar_source):
    label = f'leave:{calendar_source}'
    print(f'\n[{label}] Fetching feed...')
    try:
        ical_text = fetch_ical(ical_url)
    except Exception as e:
        print(f'  ERROR fetching feed: {e}', file=sys.stderr)
        return

    events = parse_events(ical_text)
    print(f'  {len(events)} events in feed')

    name_lookup = {
        r[0]: r[1]
        for r in run_sql('SELECT eh_display_name, participant_id FROM staff_name_lookup')
    }

    today = date.today()

    # Delete all future leave for this source — re-sync from current iCal state.
    # This handles cancellations (removed from iCal = removed from our table).
    safe_src = calendar_source.replace("'", "''")
    deleted = run_sql(f"""
        SELECT COUNT(*) FROM staff_leave_days
        WHERE calendar_source = '{safe_src}' AND leave_date >= '{today}'
    """)
    run_sql(f"""
        DELETE FROM staff_leave_days
        WHERE calendar_source = '{safe_src}' AND leave_date >= '{today}'
    """)
    print(f'  Cleared {deleted[0][0] if deleted else "?"} future rows for re-sync')

    inserted  = 0
    skipped   = 0
    unmatched = set()

    for ev in events:
        summary = ev['summary']
        if ':' not in summary:
            unmatched.add(f'(no colon) {summary}')
            continue

        leave_type = summary.split(':', 1)[0].strip()
        eh_name    = summary.split(':', 1)[1].strip()
        pid        = name_lookup.get(eh_name)

        if pid is None:
            unmatched.add(eh_name)
            continue

        safe_lt   = leave_type.replace("'", "''")
        safe_name = eh_name.replace("'", "''")
        event_days = list(expand_dates(ev['dtstart'], ev['dtend']))
        future_days = [d for d in event_days if d >= today]

        if not future_days:
            skipped += 1
            continue

        for leave_date in future_days:
            run_sql(f"""
                INSERT INTO staff_leave_days
                    (participant_id, leave_date, leave_type, eh_display_name, calendar_source)
                VALUES
                    ({pid}, '{leave_date}', '{safe_lt}', '{safe_name}', '{safe_src}')
            """)
            inserted += 1

        num_days = (ev['dtend'] - ev['dtstart']).days
        last_day = ev['dtend'] - timedelta(days=1)
        print(f'  pid={pid:<6}  {eh_name:<30}  {ev["dtstart"]} – {last_day}  ({num_days}d, {leave_type})')

    if unmatched:
        print(f'  UNMATCHED (add to staff_name_lookup): {sorted(unmatched)}')
    print(f'  Inserted {inserted} rows  |  Skipped {skipped} past events')


# ─── Public holidays sync ─────────────────────────────────────────────────────

def is_victoria_holiday(ev):
    """
    AU filter — include if:
    - DESCRIPTION contains 'Public holiday'
    - AND either no state list (national) OR description contains 'Victoria'
    """
    desc = ev['description']
    if 'Public holiday' not in desc:
        return False
    # National: description is just "Public holiday" with nothing after
    if re.match(r'^Public holiday\b', desc) and 'holiday in' not in desc:
        return True
    return 'Victoria' in desc


def is_federal_my_holiday(ev):
    """
    MY filter — include if:
    - DESCRIPTION contains 'Public holiday'
    - AND '(regional holiday)' NOT in SUMMARY
    """
    if 'Public holiday' not in ev['description']:
        return False
    return '(regional holiday)' not in ev['summary']


def strip_regional_suffix(name):
    """Remove '(regional holiday)' suffix Google adds to state-specific entries."""
    return re.sub(r'\s*\(regional holiday\)\s*', '', name, flags=re.IGNORECASE).strip()


def sync_public_holidays(ical_url, country, filter_fn):
    label = f'holidays:{country}'
    print(f'\n[{label}] Fetching feed...')
    try:
        ical_text = fetch_ical(ical_url)
    except Exception as e:
        print(f'  ERROR fetching feed: {e}', file=sys.stderr)
        return

    events = parse_events(ical_text)
    qualifying = [
        ev for ev in events
        if ev['dtstart'].year in SYNC_YEARS and filter_fn(ev)
    ]
    print(f'  {len(qualifying)} qualifying holidays across years {SYNC_YEARS}')

    safe_country = country.replace("'", "''")

    # Delete and re-insert for sync years.
    # Preserves Melbourne Cup Day (not in AU feed — managed separately).
    for year in SYNC_YEARS:
        run_sql(f"""
            DELETE FROM public_holidays
            WHERE country = '{safe_country}'
              AND YEAR(holiday_date) = {year}
              AND holiday_name != 'Melbourne Cup Day'
        """)

    inserted = 0
    for ev in qualifying:
        name      = strip_regional_suffix(ev['summary'])
        safe_name = name.replace("'", "''")
        run_sql(f"""
            INSERT INTO public_holidays (holiday_date, holiday_name, country)
            VALUES ('{ev['dtstart']}', '{safe_name}', '{safe_country}')
        """)
        inserted += 1
        print(f'  {ev["dtstart"]}  {name}')

    print(f'  Inserted {inserted} rows')


def ensure_melbourne_cup_days():
    """Melbourne Cup Day is VIC-only and not published in the Google AU feed."""
    print('\n[holidays:AU] Ensuring Melbourne Cup Day...')
    for year, cup_date in MELBOURNE_CUP_DAYS.items():
        if year not in SYNC_YEARS:
            continue
        run_sql(f"""
            IF NOT EXISTS (
                SELECT 1 FROM public_holidays
                WHERE holiday_date = '{cup_date}' AND country = 'AU'
            )
            INSERT INTO public_holidays (holiday_date, holiday_name, country)
            VALUES ('{cup_date}', 'Melbourne Cup Day', 'AU')
        """)
        print(f'  {cup_date}  Melbourne Cup Day')


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    if not METABASE_API_KEY:
        print('ERROR: METABASE_API_KEY environment variable not set', file=sys.stderr)
        sys.exit(1)

    start = datetime.now()
    print(f'RML Calendar Sync — {start.strftime("%Y-%m-%d %H:%M:%S UTC")}')
    print(f'Syncing holiday years: {SYNC_YEARS}')

    errors = []

    for label, fn, args in [
        ('EH leave sync',          sync_staff_leave,      (EH_ICAL_URL,      'employment_hero')),
        ('Contractor leave sync',  sync_staff_leave,      (CONTRACTOR_ICAL_URL, 'contractor')),
        ('AU holidays sync',       sync_public_holidays,  (AU_HOLIDAYS_URL,  'AU', is_victoria_holiday)),
        ('MY holidays sync',       sync_public_holidays,  (MY_HOLIDAYS_URL,  'MY', is_federal_my_holiday)),
        ('Melbourne Cup Day',      ensure_melbourne_cup_days, ()),
    ]:
        try:
            fn(*args)
        except Exception as e:
            msg = f'ERROR in {label}: {e}'
            print(f'\n{msg}', file=sys.stderr)
            errors.append(msg)

    elapsed = (datetime.now() - start).total_seconds()
    print(f'\nSync complete in {elapsed:.1f}s')

    if errors:
        print(f'\n{len(errors)} error(s):')
        for e in errors:
            print(f'  - {e}')
        sys.exit(1)


if __name__ == '__main__':
    main()
