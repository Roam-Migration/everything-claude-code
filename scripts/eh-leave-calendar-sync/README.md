# EH Leave → Contractor GCal Sync

Watches Aaron's Gmail for Employment Hero leave notifications and automatically
adds contractor leave events to the shared contractor Google Calendar.

Employee leave is **skipped** — EH already syncs employee leave to the EH
calendar feed that is embedded in the intranet.

---

## How it works

```
EH sends "New leave calendar event for [Name]" to Aaron's Gmail
    │
    ▼
Apps Script (runs every 15 min under Aaron's account)
    │
    ├─ Name not in Contractors sheet → label as processed, skip
    │
    ├─ Parse invite.ics attachment → extract DTSTART, DTEND, SUMMARY
    │
    ├─ Duplicate check → event already on contractor GCal? → skip
    │
    └─ createAllDayEvent() on contractor GCal → log to Sheet → label thread
```

---

## Setup (one-time)

### Prerequisites

- Aaron's Google account has **write access** to the contractor GCal
  - Google Calendar → contractor calendar → Settings → "Share with specific people"
  - Add Aaron with "Make changes to events" permission
- Aaron's account is the one used to open `script.google.com`

### Steps

1. **Create the Apps Script project**
   - Go to [script.google.com](https://script.google.com) while signed in as Aaron
   - Click **New project**
   - Rename it (e.g. "EH Leave Sync")
   - Paste the contents of `Code.gs` into the editor

2. **Create the contractor roster Sheet**
   - In the Apps Script editor, run `setupContractorSheet()` (select it from the
     function dropdown → click Run)
   - Copy the **Sheet ID** printed in the Execution Log

3. **Configure the script**
   - In `Code.gs`, replace `REPLACE_WITH_YOUR_SHEET_ID` with the copied ID:
     ```js
     CONTRACTORS_SHEET_ID: '1abc...xyz',
     ```
   - Save (Ctrl+S)

4. **Add contractor names**
   - Open the created Sheet ("EH Leave Sync – Contractor Roster")
   - In the **Contractors** tab, add each contractor's full name to column A
     (one per row, starting at row 2)
   - Names **must match exactly** how they appear in the EH email subject:
     `New leave calendar event for [Name]`
   - Check an existing EH email in Aaron's Gmail to confirm the format

5. **Register the trigger**
   - In the Apps Script editor, run `createTrigger()`
   - Authorise all requested permissions when prompted:
     - Read Gmail
     - Read/write Google Calendar
     - Read/write Google Sheets

6. **Verify**
   - The script will run every 15 minutes from now on
   - Forward one existing EH leave email to Aaron (or wait for the next real one)
   - Check the **Log** tab in the Sheet for a `CREATED` or `SKIPPED` row

---

## Contractor Sheet format

| Tab | Column A | Purpose |
|-----|----------|---------|
| Contractors | Full name (e.g. `James Smith`) | Names checked against EH email subject |
| Log | Auto-populated | Audit trail of every processed email |

**Updating contractors:** Add or remove rows in the Contractors tab. No script changes needed.

---

## Log actions

| Action | Meaning |
|--------|---------|
| `CREATED` | Event added to contractor GCal |
| `SKIPPED` | Name not in contractor list (employee or name mismatch) |
| `DUPLICATE` | Event already exists on the calendar — not created again |
| `ERROR` | Something failed — check the Notes column for details |

---

## Name mismatches

If a contractor's event is being `SKIPPED` with "Not in contractor list", the name
in the Sheet doesn't match the EH email subject exactly. Check:

1. Open Aaron's Gmail, search: `from:no-reply@employmenthero.com`
2. Look at the subject: `New leave calendar event for [Name]`
3. Copy that name exactly into the Contractors tab

---

## Troubleshooting

**Script not running**
- Check Apps Script → Triggers — the trigger should show `processEHLeaveEmails` every 15 min
- Re-run `createTrigger()` if it's missing

**Calendar events not appearing**
- Verify Aaron has write access to the contractor GCal (Settings → check sharing)
- Check the Log tab for ERROR rows
- Run `testSingleMessage(messageId)` with a real EH email message ID to debug the ICS parsing

**Duplicate emails being processed**
- The `eh-leave-processed` Gmail label is applied to processed threads
- If emails are being re-processed, check Aaron's Gmail for the label

**To test with a specific email**
```js
// In Apps Script editor, run this to get the message ID of the first matching email:
function getTestMessageId() {
  const threads = GmailApp.search('from:no-reply@employmenthero.com subject:"New leave calendar event for"', 0, 1);
  if (threads.length === 0) { console.log('No EH leave emails found.'); return; }
  const msg = threads[0].getMessages()[0];
  console.log('Message ID:', msg.getId());
  console.log('Subject:', msg.getSubject());
}
```
Then pass that ID to `testSingleMessage('message-id-here')`.

---

## Contractor GCal ID

```
c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837@group.calendar.google.com
```

This is the calendar embedded in the RML Intranet Leave Calendar iframe.
