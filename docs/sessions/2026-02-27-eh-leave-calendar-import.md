# Session: EH Leave Calendar — Backfill and Public Holidays

**Date:** 2026-02-27
**Project:** RML Intranet / Google Workspace Automation
**Branch:** `fix/p1-documentation-updates` (ECC), `troubleshoot/notion-integration` (Intranet)
**Continued from:** `docs/sessions/2026-02-26-eh-leave-calendar-sync.md`

---

## What Was Accomplished

1. **Apps Script deployment type confirmed** — no deployment needed; runs via time-based triggers only
2. **Historical EH leave emails scanned** — `processEHLeaveEmails()` run manually in Apps Script editor to backfill all unprocessed emails
3. **Public holiday gap diagnosed and fixed** — two separate systems; iCal feeds added to intranet embeds
4. **Schedule spreadsheet imported** — 34 contractor leave/schedule events created on the Contractor GCal

---

## Apps Script Deployment Type

The `processEHLeaveEmails()` script requires **no deployment** (no web app, API executable, add-on, or library). It runs via three time-based triggers (Mon–Fri 8 am/12 pm/5 pm Melbourne). To backfill historical emails, run the function directly from the Apps Script editor — it will catch all threads without the `eh-leave-processed` Gmail label.

---

## Public Holidays — Two Separate Systems

Public holidays were not appearing in the intranet calendar embed because two distinct pipelines exist:

| System | Input | Output |
|--------|-------|--------|
| Apps Script (`Code.gs`) | Aaron's Gmail (EH leave emails) | Events on Contractor GCal |
| Cloud Run job (`sync.py`) | AU/MY iCal feeds | `htmigration.dbo.public_holidays` (SQL) |

The SQL table feeds the **Metabase working-days formula**. The **intranet calendar embed** (iframes) is independent — it reads directly from Google Calendar sources.

**Fix:** Added AU and MY public holiday Google Calendar IDs as additional `src` parameters to all three embed pages:

```
&src=en.australian%23holiday%40group.v.calendar.google.com
&src=en-gb.malaysia%23holiday%40group.v.calendar.google.com
```

**Files changed:**
- `src/app/pages/LeavePage.tsx`
- `src/app/pages/PeoplePage.tsx`
- `src/app/pages/HomePage.tsx`

**Commit:** `2f5f6a6` on `troubleshoot/notion-integration`

**Colour scheme added:** AU holidays display in green (`#0B8043`), MY holidays in orange (`#F4511E`). The `color` parameter in a GCal embed URL applies to the **immediately preceding** `src` parameter — ordering matters.

Final embed URL pattern:
```
https://calendar.google.com/calendar/embed
  ?src=j2gm8g6u0rp038bn2j4oee5ha107el40%40import.calendar.google.com
  &src=c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837%40group.calendar.google.com
  &src=en.australian%23holiday%40group.v.calendar.google.com&color=%230B8043
  &src=en-gb.malaysia%23holiday%40group.v.calendar.google.com&color=%23F4511E
  &ctz=Australia%2FMelbourne&showTitle=0&showPrint=0&showTabs=1&showCalendars=1
```

**Deploys completed:**
| Commit | Description |
|--------|-------------|
| `114120b` | Add AU/MY public holiday calendar sources to all three embeds |
| `604a4f5` | Add colour scheme (green AU, orange MY) |

Both deployed via:
```bash
cd /tmp/Rmlintranetdesign
gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet --quiet
```

---

## Schedule Spreadsheet Import

### Problem

The existing `bulkImportFromSheet()` Apps Script function expects a tall format (Name | LeaveType | StartDate | EndDate). The RML schedule spreadsheet uses a wide format — dates as columns, people as rows, with status values (`Taking leave`, `Half Day`, `Work day`, etc.).

### Solution

Built `scripts/schedule-sheet-import/import_schedule_leave.py` — a Python script that:

1. Reads all 6 monthly tabs (Jan–Jun 2026) in a **single Sheets API batchGet call** (avoids the 429 rate limit from the CSV export endpoint)
2. Maps short names to full contractor names via `CONTRACTOR_MAP`
3. Differentiates `Annual Leave` vs `Scheduled` events per person
4. Consolidates consecutive leave days into date ranges (merges gaps ≤ 4 days to bridge weekends)
5. Checks Google Calendar API for duplicate events before creating

### Contractor Configuration

```python
CONTRACTOR_MAP = {
    'Frances': 'Frances Lee',
    'Vicky':   'Vikneswaran Khetre',
    'Iqmal':   'Ahmad Iqmal',
    'Tasha':   'Taashahyani Parmeswaran',
    'Taasha':  'Taashahyani Parmeswaran',
    'Bathma':  'Bathmawathy Khetre',
    'Shahrul': 'Shahrul Izwani',
    'Amani':   'Nabilah Amani',
}
```

**Not contractors** (confirmed): Rebecca Spoor, Abeer Omi — removed from earlier draft.

**Unconfirmed** (not included): Noor, Martin, Alex — status unknown.

### Frances Lee — Work Schedule Pattern

Frances has a regular part-time pattern (Thursday half-days). These are recorded as `Scheduled: Frances Lee` rather than `Annual Leave: Frances Lee` to distinguish them from genuine leave.

```python
SCHEDULE_PEOPLE  = {'Frances'}
SCHEDULE_EVENT_PREFIX = 'Scheduled'
LEAVE_EVENT_PREFIX    = 'Annual Leave'
```

### Results

```
34 created  |  5 duplicates skipped  |  0 errors
```

| Contractor | Events |
|---|---|
| Frances Lee | 1 × Annual Leave + 25 × Scheduled (Thu half-days) |
| Ahmad Iqmal | 3 × Annual Leave |
| Bathmawathy Khetre | 4 × Annual Leave |
| Taashahyani Parmeswaran | 2 × Annual Leave |
| Vikneswaran Khetre | 2 × Annual Leave (already existed — deduplicated) |
| Nabilah Amani | 1 × Annual Leave (already existed — deduplicated) |
| Shahrul Izwani | 2 × Annual Leave (already existed — deduplicated) |

The 5 duplicates confirm that Option A (email scan) and the spreadsheet import were consistent — the same leave periods were correctly identified by both sources.

### Usage for Future Schedule Sheets

```bash
# Dry run (safe — no changes made)
python3 scripts/schedule-sheet-import/import_schedule_leave.py

# Live import
python3 scripts/schedule-sheet-import/import_schedule_leave.py --live
```

To add Jul–Dec 2026 tabs, update `TABS` in the script with the new gid values (visible in the spreadsheet URL as `?gid=...`).

---

## OAuth Token Note

The Google Drive MCP OAuth token had expired. Refreshed via:
```python
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "client_id=...&client_secret=...&refresh_token=...&grant_type=refresh_token"
```

The token file is at `~/.config/google-drive-mcp/tokens.json`. The script refreshes automatically on each run.

---

## Outstanding Items

1. ~~**Deploy intranet frontend**~~ — **DONE** (commits `114120b` and `604a4f5`, both deployed this session)
2. **Confirm Noor, Martin, Alex** — unknown whether these are contractors or employees; if contractors, add to `CONTRACTOR_MAP` and re-run script
3. **Add Shahrul + Amani to Apps Script roster** — the `Code.gs` contractor roster sheet in Aaron's Google Drive needs these two names added so future EH leave emails for them are auto-processed
4. **Jul–Dec 2026 import** — once the schedule sheet for H2 is available, run the import script with updated `TABS`

---

## Key File Paths

| File | Purpose |
|------|---------|
| `scripts/schedule-sheet-import/import_schedule_leave.py` | Schedule sheet → GCal import |
| `scripts/eh-leave-calendar-sync/Code.gs` | Apps Script (email-based sync) |
| `src/app/pages/LeavePage.tsx` | Intranet leave page (embed updated) |
| `src/app/pages/PeoplePage.tsx` | Intranet people page (embed updated) |
| `src/app/pages/HomePage.tsx` | Intranet home page (embed updated) |
