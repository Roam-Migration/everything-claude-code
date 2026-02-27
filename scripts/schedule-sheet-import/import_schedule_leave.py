#!/usr/bin/env python3
"""
RML Schedule Sheet → Contractor GCal Import

Reads the RML schedule spreadsheet (wide format: dates as columns, people as rows)
for Jan–Jun 2026 and creates leave events on the Contractor GCal.

The schedule sheet format is incompatible with bulkImportFromSheet() in Code.gs,
which expects Name|LeaveType|StartDate|EndDate columns. This script handles the
transposed layout directly via Google Sheets + Calendar APIs.

Usage:
  python3 import_schedule_leave.py            # dry run (prints what would be created)
  python3 import_schedule_leave.py --live     # creates events on GCal

Auth: Uses ~/.config/google-drive-mcp/ OAuth credentials (must have calendar scope).
"""

import csv
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta

# ─── Config ───────────────────────────────────────────────────────────────────

SHEET_ID = '1opOF2YbsY_qdwAF3ZQgqWiEHeJszTQU0ti3GElCb3-8'

# Jan–Jun 2026 tabs (tab name → gid)
TABS = [
    ('Jan 2026',  1273183523),
    ('Feb 2026',  1724779893),
    ('Mar 2026',  805413047),
    ('Apr 2026',  1607651524),
    ('May 2026',  1001082780),
    ('June 2026', 1311866197),
]

CONTRACTOR_CAL_ID = (
    'c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837'
    '@group.calendar.google.com'
)

# Sheet short name → canonical full name for GCal event titles.
# Names must match what Aaron entered in the Apps Script contractor roster
# so that the duplicate guard (name-in-title check) works across both systems.
CONTRACTOR_MAP = {
    'Frances': 'Frances Lee',
    'Vicky':   'Vikneswaran Khetre',
    'Iqmal':   'Ahmad Iqmal',
    'Tasha':   'Taashahyani Parmeswaran',
    'Taasha':  'Taashahyani Parmeswaran',   # spelling variant across tabs
    'Bathma':  'Bathmawathy Khetre',
    'Shahrul': 'Shahrul Izwani',
    'Amani':   'Nabilah Amani',
    # 'Noor':  '???',  # unconfirmed
}

# Cell values that count as annual leave (case-insensitive)
LEAVE_STATUSES = {'taking leave', 'half day'}

# People whose "Half Day" cells reflect their regular work schedule (not leave).
# "Taking leave" entries for these people are still recorded as annual leave.
# "Half Day" entries are recorded with SCHEDULE_EVENT_PREFIX instead.
SCHEDULE_PEOPLE = {'Frances'}
SCHEDULE_EVENT_PREFIX = 'Scheduled'    # → "Scheduled: Frances Lee"
LEAVE_EVENT_PREFIX    = 'Annual Leave' # → "Annual Leave: Frances Lee"

MONTH_MAP = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,  'May': 5,  'Jun': 6,
    'June': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
}

# ─── Auth ─────────────────────────────────────────────────────────────────────

def get_access_token():
    tokens_path = os.path.expanduser('~/.config/google-drive-mcp/tokens.json')
    creds_path  = os.path.expanduser('~/.config/google-drive-mcp/gcp-oauth.keys.json')

    with open(tokens_path) as f:
        tokens = json.load(f)
    with open(creds_path) as f:
        creds = list(json.load(f).values())[0]

    data = urllib.parse.urlencode({
        'client_id':     creds['client_id'],
        'client_secret': creds['client_secret'],
        'refresh_token': tokens['refresh_token'],
        'grant_type':    'refresh_token',
    }).encode()

    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['access_token']


def api_get(token, url):
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def api_post(token, url, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': f'Bearer {token}',
        'Content-Type':  'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


# ─── Sheet parsing ─────────────────────────────────────────────────────────────

def fetch_all_tabs(token):
    """
    Fetches all tab data in a single Sheets API batchGet call.
    Returns dict of tab_name → list of rows (each row is a list of cell values).
    """
    ranges = [f"'{name}'!A:ZZ" for name, _ in TABS]
    params = '&'.join(f'ranges={urllib.parse.quote(r)}' for r in ranges)
    url = (
        f'https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}'
        f'/values:batchGet?{params}&valueRenderOption=FORMATTED_VALUE'
    )
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read())

    tab_data = {}
    for vr in result.get('valueRanges', []):
        # Range looks like "'Jan 2026'!A1:ZZ100" — extract the tab name
        raw_range = vr.get('range', '')
        tab_name  = raw_range.split('!')[0].strip("'")
        tab_data[tab_name] = vr.get('values', [])

    return tab_data


def parse_month_year(tab_name):
    """'Jan 2026' → (month_int, year_int)"""
    parts = tab_name.split()
    return MONTH_MAP[parts[0]], int(parts[1])


def parse_tab(rows, tab_name):
    """
    Parses the wide-format schedule sheet tab.

    Sheet layout:
      Row 0: "Day", "Thursday", "Friday", "Monday", ...
      Row 1: "Date", "1", "2", "5", "6", ...
      Row 2+: "PersonName", status, status, ...

    rows: list of lists (from Sheets API valueRanges.values)
    Returns: list of (short_name, date_obj) for every "taking leave" / "half day" cell.
    """
    month, year = parse_month_year(tab_name)

    if len(rows) < 3:
        return []

    date_row = rows[1]  # "Date", "1", "2", "5", ...

    # Map column index → date object
    col_dates = {}
    for col_idx, val in enumerate(date_row):
        if col_idx == 0:
            continue
        val = str(val).strip()
        if val.isdigit():
            day = int(val)
            try:
                col_dates[col_idx] = date(year, month, day)
            except ValueError:
                pass

    entries = []
    for row in rows[2:]:
        if not row or not row[0].strip():
            continue
        name = row[0].strip()
        if name.upper() == 'NOTES':
            continue
        for col_idx, status in enumerate(row):
            if col_idx == 0 or col_idx not in col_dates:
                continue
            status_lower = status.strip().lower()
            if status_lower in LEAVE_STATUSES:
                # 'half day' for schedule people is flagged as 'scheduled', not 'leave'
                is_schedule = (name in SCHEDULE_PEOPLE and status_lower == 'half day')
                entry_type  = 'scheduled' if is_schedule else 'leave'
                entries.append((name, col_dates[col_idx], entry_type))

    return entries


# ─── Date consolidation ────────────────────────────────────────────────────────

def consolidate_dates(dates):
    """
    Merges a list of dates into (start, end_inclusive) ranges.
    Dates within 4 calendar days of each other are merged — this bridges
    Fri→Mon (gap=3), and Fri→Tue when Mon is a public holiday (gap=4).
    """
    if not dates:
        return []
    dates = sorted(set(dates))
    ranges = []
    start = end = dates[0]

    for d in dates[1:]:
        if (d - end).days <= 4:
            end = d
        else:
            ranges.append((start, end))
            start = end = d

    ranges.append((start, end))
    return ranges


# ─── Calendar API ──────────────────────────────────────────────────────────────

def is_duplicate(token, cal_id, name, start, end_inclusive):
    """
    Returns True if the contractor GCal already has an event containing
    the person's name within the [start, end_inclusive] window.
    Mirrors the isDuplicate() logic in Code.gs.
    """
    time_min = f'{start}T00:00:00Z'
    time_max = f'{end_inclusive + timedelta(days=1)}T00:00:00Z'
    url = (
        f'https://www.googleapis.com/calendar/v3/calendars/'
        f'{urllib.parse.quote(cal_id, safe="")}/events'
        f'?timeMin={urllib.parse.quote(time_min)}'
        f'&timeMax={urllib.parse.quote(time_max)}'
        f'&singleEvents=true&maxResults=100'
    )
    result = api_get(token, url)
    name_lower = name.lower()
    for ev in result.get('items', []):
        if name_lower in ev.get('summary', '').lower():
            return True
    return False


def create_event(token, cal_id, title, start, end_inclusive):
    """Creates an all-day event. GCal end date is exclusive (day after last leave day)."""
    end_exclusive = end_inclusive + timedelta(days=1)
    payload = {
        'summary': title,
        'start':   {'date': str(start)},
        'end':     {'date': str(end_exclusive)},
    }
    url = (
        f'https://www.googleapis.com/calendar/v3/calendars/'
        f'{urllib.parse.quote(cal_id, safe="")}/events'
    )
    return api_post(token, url, payload)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    dry_run = '--live' not in sys.argv

    print(f'RML Schedule → Contractor GCal Import')
    print(f'Mode: {"DRY RUN (use --live to create events)" if dry_run else "LIVE"}')
    print()

    token = get_access_token()

    # Collect all leave dates per contractor across all tabs (single API call)
    print('Fetching all tabs in one request...')
    all_tab_data = fetch_all_tabs(token)
    print()

    # contractor_events: full_name → dict of entry_type → set of dates
    # e.g. {'Frances Lee': {'leave': {date(...)}, 'scheduled': {date(...)}}}
    contractor_events: dict[str, dict[str, set[date]]] = {}

    for tab_name, _ in TABS:
        rows = all_tab_data.get(tab_name, [])
        print(f'Parsing {tab_name} ({len(rows)} rows)...')
        entries = parse_tab(rows, tab_name)

        tab_counts: dict[str, int] = {}
        for short_name, leave_date, entry_type in entries:
            full_name = CONTRACTOR_MAP.get(short_name)
            if not full_name:
                continue
            contractor_events.setdefault(full_name, {}).setdefault(entry_type, set()).add(leave_date)
            tab_counts[full_name] = tab_counts.get(full_name, 0) + 1

        if tab_counts:
            for name, count in sorted(tab_counts.items()):
                print(f'  {name}: {count} day(s)')
        else:
            print('  No contractor entries found')

    print()
    print('=' * 65)
    print(f'{"DRY RUN — " if dry_run else ""}Processing events:')
    print('=' * 65)

    created = 0
    duplicates = 0
    errors = 0

    for full_name, type_dates in sorted(contractor_events.items()):
        for entry_type, dates in sorted(type_dates.items()):
            prefix = SCHEDULE_EVENT_PREFIX if entry_type == 'scheduled' else LEAVE_EVENT_PREFIX
            title  = f'{prefix}: {full_name}'
            ranges = consolidate_dates(list(dates))

            for start, end_inclusive in ranges:
                days = (end_inclusive - start).days + 1

                if dry_run:
                    print(f'  WOULD CREATE  [{prefix:<12}]  {full_name:<30} {start}  →  {end_inclusive}  ({days}d)')
                    created += 1
                    continue

                try:
                    if is_duplicate(token, CONTRACTOR_CAL_ID, full_name, start, end_inclusive):
                        print(f'  DUPLICATE     [{prefix:<12}]  {full_name:<30} {start}  →  {end_inclusive}')
                        duplicates += 1
                    else:
                        create_event(token, CONTRACTOR_CAL_ID, title, start, end_inclusive)
                        print(f'  CREATED       [{prefix:<12}]  {full_name:<30} {start}  →  {end_inclusive}  ({days}d)')
                        created += 1
                except Exception as e:
                    print(f'  ERROR         [{prefix:<12}]  {full_name:<30} {start}: {e}')
                    errors += 1

    print()
    print('=' * 65)
    if dry_run:
        print(f'{created} events would be created.')
        print('Run with --live to create them on the Contractor GCal.')
    else:
        print(f'{created} created  |  {duplicates} duplicates skipped  |  {errors} errors')


if __name__ == '__main__':
    main()
