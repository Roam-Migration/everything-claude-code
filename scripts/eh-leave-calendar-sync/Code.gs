/**
 * EH Leave → Contractor GCal Sync
 *
 * Watches Aaron's Gmail for Employment Hero leave notifications and
 * automatically adds contractor leave events to the shared contractor
 * Google Calendar. Employee leave is skipped (EH syncs that directly).
 *
 * Polling interval : every 15 minutes (time-based trigger)
 * Runs as          : Aaron's Google Workspace account
 * Idempotency      : processed threads are labelled; never re-processed
 *
 * Quick start:
 *   1. script.google.com → New project → paste this file
 *   2. Run setupContractorSheet() once → copy the Sheet ID into CONFIG below
 *   3. Add contractor names to the "Contractors" tab (one per row, column A)
 *   4. Verify Aaron has write access to the contractor GCal (see README)
 *   5. Run createTrigger() once to register the Mon–Fri 8 am/12 pm/5 pm triggers
 *   6. Authorise all permissions when prompted
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = {

  // Contractor GCal – the calendar embedded in the intranet Leave Calendar iframe.
  // To find this ID: Google Calendar → contractor calendar → Settings → "Calendar ID"
  CONTRACTOR_CAL_ID: 'c_780037334b62950858dce88ea7dbdd73803a28349bbb9a3d6a71cdc972a17837@group.calendar.google.com',

  // Employment Hero notification filter
  EH_SENDER:        'no-reply@employmenthero.com',
  SUBJECT_PREFIX:   'New leave calendar event for ',

  // Gmail label applied to processed threads (prevents re-processing)
  PROCESSED_LABEL:  'eh-leave-processed',

  // Google Sheet containing the contractor roster.
  // After running setupContractorSheet(), paste the Sheet ID here.
  // Sheet ID is the long string in the URL: .../spreadsheets/d/<SHEET_ID>/edit
  CONTRACTORS_SHEET_ID: 'REPLACE_WITH_YOUR_SHEET_ID',

  // Tab names inside that Sheet
  CONTRACTORS_TAB: 'Contractors',
  LOG_TAB:         'Log',

};

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Called by the 15-minute time trigger.
 * Searches for unprocessed EH leave emails and syncs contractor events to GCal.
 */
function processEHLeaveEmails() {
  // Run on weekdays only — triggers fire daily so we exit early on weekends
  const day = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) {
    console.log('Weekend — skipping.');
    return;
  }

  if (CONFIG.CONTRACTORS_SHEET_ID === 'REPLACE_WITH_YOUR_SHEET_ID') {
    console.error('CONFIG.CONTRACTORS_SHEET_ID is not set. Run setupContractorSheet() first.');
    return;
  }

  const contractors     = getContractorNames();
  const processedLabel  = getOrCreateLabel(CONFIG.PROCESSED_LABEL);
  const cal             = CalendarApp.getCalendarById(CONFIG.CONTRACTOR_CAL_ID);

  if (!cal) {
    console.error('Contractor calendar not found — check CONTRACTOR_CAL_ID in CONFIG.');
    return;
  }

  const query   = `from:${CONFIG.EH_SENDER} subject:"${CONFIG.SUBJECT_PREFIX}" -label:${CONFIG.PROCESSED_LABEL}`;
  const threads = GmailApp.search(query, 0, 50);

  if (threads.length === 0) {
    console.log('No unprocessed EH leave emails.');
    return;
  }

  console.log(`Processing ${threads.length} thread(s)…`);

  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      try {
        processMessage(message, contractors, cal);
      } catch (err) {
        console.error(`Error processing message "${message.getSubject()}": ${err.message}`);
        logRow('ERROR', '', '', '', err.message);
      }
    }
    // Label the thread regardless of outcome — prevents infinite retry on bad data
    thread.addLabel(processedLabel);
  }
}

// ─── Per-message logic ───────────────────────────────────────────────────────

function processMessage(message, contractors, cal) {
  const subject = message.getSubject();

  if (!subject.startsWith(CONFIG.SUBJECT_PREFIX)) return;

  const emailName = subject.substring(CONFIG.SUBJECT_PREFIX.length).trim();

  // ── Match against contractor roster (fuzzy prefix) ────────────────────────
  // EH sends names inconsistently: sometimes first name only ("nabilah"),
  // sometimes full name ("nabilah amani"). findContractor() handles both.
  const matchedName = findContractor(emailName, contractors);

  if (!matchedName) {
    console.log(`Skip: "${emailName}" — no contractor match (employee or unrecognised name).`);
    logRow('SKIPPED', emailName, '', '', 'No contractor match — employee or name not in roster');
    return;
  }

  const displayName = matchedName !== emailName
    ? `${matchedName} (email: "${emailName}")`
    : matchedName;

  // ── Parse ICS attachment ──────────────────────────────────────────────────
  const icsText = getICSAttachment(message);
  if (!icsText) {
    console.warn(`No ICS attachment found for "${displayName}".`);
    logRow('ERROR', matchedName, '', '', `No .ics attachment — email name was "${emailName}"`);
    return;
  }

  const event = parseICS(icsText);
  if (!event) {
    console.warn(`ICS parse failed for "${displayName}".`);
    logRow('ERROR', matchedName, '', '', 'Failed to parse DTSTART/DTEND from ICS');
    return;
  }

  // ── Duplicate guard ───────────────────────────────────────────────────────
  // Use the canonical roster name so duplicates are caught regardless of
  // whether the email came through as "nabilah" or "nabilah amani".
  if (isDuplicate(cal, matchedName, event.start, event.end)) {
    console.log(`Duplicate: "${matchedName}" already has an event ${fmtDate(event.start)}–${fmtDate(event.end)}.`);
    logRow('DUPLICATE', matchedName, fmtDate(event.start), fmtDate(event.end), event.summary || '');
    return;
  }

  // ── Create calendar event ─────────────────────────────────────────────────
  // ICS DTEND for all-day events is exclusive (day after last leave day).
  // Apps Script createAllDayEvent endDate is also exclusive — pass DTEND directly.
  // Always use the canonical roster name in the title for consistency.
  const title = event.summary || `${matchedName} – Leave`;
  const isSingleDay = (event.end - event.start) <= 86400000; // ≤ 1 day in ms

  if (isSingleDay) {
    cal.createAllDayEvent(title, event.start);
  } else {
    cal.createAllDayEvent(title, event.start, event.end);
  }

  console.log(`Created: "${title}" ${fmtDate(event.start)}–${fmtDate(event.end)}`);
  logRow('CREATED', matchedName, fmtDate(event.start), fmtDate(event.end), title);
}

// ─── ICS parsing ─────────────────────────────────────────────────────────────

function getICSAttachment(message) {
  const attachments = message.getAttachments();
  for (const att of attachments) {
    const isICS = att.getName().toLowerCase().endsWith('.ics')
               || att.getContentType().includes('calendar');
    if (isICS) return att.getDataAsString();
  }
  return null;
}

/**
 * Extracts DTSTART, DTEND, and SUMMARY from an iCalendar string.
 * Handles:
 *   DTSTART;VALUE=DATE:20260301          (all-day, date only)
 *   DTSTART:20260301T090000Z             (datetime with Z)
 *   DTSTART;TZID=Australia/Melbourne:... (datetime with timezone)
 *
 * Returns { start: Date, end: Date, summary: string|null } or null on failure.
 */
function parseICS(icsText) {
  // Normalise line endings, then unfold continuation lines (RFC 5545 §3.1)
  const normalised = icsText
    .replace(/\r\n?/g, '\n')
    .replace(/\n[ \t]/g, '');

  const lines = normalised.split('\n');

  const find = (key) => {
    const line = lines.find(l => l === key + ':' || l.startsWith(key + ':') || l.startsWith(key + ';'));
    if (!line) return null;
    return line.substring(line.indexOf(':') + 1).trim();
  };

  const dtStartRaw = find('DTSTART');
  const dtEndRaw   = find('DTEND');
  const summaryRaw = find('SUMMARY');

  if (!dtStartRaw || !dtEndRaw) return null;

  const start = parseICSDate(dtStartRaw);
  const end   = parseICSDate(dtEndRaw);

  if (!start || !end) return null;

  return {
    start,
    end,
    summary: summaryRaw ? unescapeICS(summaryRaw) : null,
  };
}

/** Converts an ICS date/datetime value to a local Date object. */
function parseICSDate(value) {
  // Strip everything after the first 8 digits (handles T and Z suffixes)
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length < 8) return null;

  const y = parseInt(digits.substring(0, 4), 10);
  const m = parseInt(digits.substring(4, 6), 10) - 1; // JS months are 0-indexed
  const d = parseInt(digits.substring(6, 8), 10);

  return new Date(y, m, d);
}

/** RFC 5545 text unescaping. */
function unescapeICS(text) {
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

/**
 * Returns true if the contractor GCal already has an event in the [start, end)
 * window whose title contains the person's name (case-insensitive).
 */
function isDuplicate(cal, name, start, end) {
  // Expand the search window slightly to catch same-day events
  const searchEnd = new Date(end.getTime() + 86400000);
  const existing  = cal.getEvents(start, searchEnd);
  const lower     = name.toLowerCase();
  return existing.some(e => e.getTitle().toLowerCase().includes(lower));
}

// ─── Contractor roster ────────────────────────────────────────────────────────

/**
 * Reads the contractor names from column A of the Contractors tab (skips header).
 * Returns an Array<string> of canonical full names for fuzzy matching.
 */
function getContractorNames() {
  const ss    = SpreadsheetApp.openById(CONFIG.CONTRACTORS_SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.CONTRACTORS_TAB);

  if (!sheet) {
    throw new Error(`Tab "${CONFIG.CONTRACTORS_TAB}" not found in the spreadsheet.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const names  = [];

  for (const [name] of values) {
    const trimmed = name?.toString().trim();
    if (trimmed) names.push(trimmed);
  }

  console.log(`Loaded ${names.length} contractor name(s): ${names.join(', ')}`);
  return names;
}

/**
 * Fuzzy-matches an email name against the contractor roster.
 *
 * EH sends names inconsistently — sometimes first name only ("nabilah"),
 * sometimes full name ("nabilah amani"). This handles both by checking
 * word-boundary prefixes in both directions.
 *
 * Examples:
 *   "nabilah"        matches "Nabilah Amani"      (email is first-name prefix)
 *   "nabilah amani"  matches "Nabilah Amani"      (exact, case-insensitive)
 *   "vikneswaran"    matches "Vikneswaran Khetre"  (email is first-name prefix)
 *
 * Returns the canonical roster name (as entered in the Sheet), or null.
 */
function findContractor(emailName, contractors) {
  const query = emailName.toLowerCase().trim();

  for (const fullName of contractors) {
    const stored = fullName.toLowerCase().trim();

    if (stored === query) return fullName;                     // exact match
    if (stored.startsWith(query + ' ')) return fullName;      // email is first-name only
    if (query.startsWith(stored + ' ')) return fullName;      // roster has fewer words (unusual)
  }

  return null;
}

// ─── Gmail label ─────────────────────────────────────────────────────────────

function getOrCreateLabel(labelName) {
  return GmailApp.getUserLabelByName(labelName)
      || GmailApp.createLabel(labelName);
}

// ─── Log sheet ───────────────────────────────────────────────────────────────

function logRow(action, name, start, end, notes) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.CONTRACTORS_SHEET_ID);
    let log  = ss.getSheetByName(CONFIG.LOG_TAB);

    if (!log) {
      log = ss.insertSheet(CONFIG.LOG_TAB);
      log.appendRow(['Timestamp', 'Action', 'Name', 'Start', 'End', 'Notes']);
      log.getRange('1:1').setFontWeight('bold');
      log.setFrozenRows(1);
    }

    log.appendRow([new Date(), action, name, start, end, notes]);
  } catch (err) {
    // Non-fatal — don't let logging errors break the main flow
    console.warn('Log write failed:', err.message);
  }
}

function fmtDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd MMM yyyy');
}

// ─── One-time setup helpers ───────────────────────────────────────────────────

/**
 * Run ONCE to create the Google Sheet with the correct structure.
 * After running, copy the Sheet ID printed in the console into CONFIG.CONTRACTORS_SHEET_ID.
 */
function setupContractorSheet() {
  const ss = SpreadsheetApp.create('EH Leave Sync – Contractor Roster');

  // Contractors tab
  const contractorsSheet = ss.getActiveSheet();
  contractorsSheet.setName(CONFIG.CONTRACTORS_TAB);
  contractorsSheet.appendRow(['Name']);
  contractorsSheet.getRange('1:1').setFontWeight('bold');
  contractorsSheet.setFrozenRows(1);
  contractorsSheet.setColumnWidth(1, 260);
  // Example row — replace with real contractor names
  contractorsSheet.appendRow(['Example Contractor (replace me)']);

  // Log tab
  const logSheet = ss.insertSheet(CONFIG.LOG_TAB);
  logSheet.appendRow(['Timestamp', 'Action', 'Name', 'Start', 'End', 'Notes']);
  logSheet.getRange('1:1').setFontWeight('bold');
  logSheet.setFrozenRows(1);
  [80, 100, 200, 100, 100, 400].forEach((w, i) => logSheet.setColumnWidth(i + 1, w));

  const id  = ss.getId();
  const url = ss.getUrl();

  console.log('─────────────────────────────────────────────────────');
  console.log('Sheet created successfully.');
  console.log(`URL : ${url}`);
  console.log(`ID  : ${id}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Replace CONFIG.CONTRACTORS_SHEET_ID with the ID above.');
  console.log('  2. Open the Sheet and add contractor full names to column A.');
  console.log('  3. Run createTrigger() to start the Mon–Fri 8 am/12 pm/5 pm triggers.');
  console.log('─────────────────────────────────────────────────────');
}

/**
 * Run ONCE to register three daily triggers: 8 am, 12 pm, 5 pm (Melbourne time).
 * Triggers fire every day; the weekday guard at the top of processEHLeaveEmails()
 * exits early on Saturday and Sunday.
 * Safe to call multiple times — skips creation if 3 triggers already exist.
 */
function createTrigger() {
  const existingCount = ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processEHLeaveEmails').length;

  if (existingCount >= 3) {
    console.log(`${existingCount} trigger(s) already registered. Run deleteTrigger() first to reconfigure.`);
    return;
  }

  const hours = [8, 12, 17]; // 8 am, 12 pm, 5 pm
  for (const hour of hours) {
    ScriptApp.newTrigger('processEHLeaveEmails')
      .timeBased()
      .atHour(hour)
      .nearMinute(0)
      .inTimezone('Australia/Melbourne')
      .everyDays(1)
      .create();
  }

  console.log('Triggers created: 8 am, 12 pm, 5 pm Melbourne time (weekdays only via code guard).');
}

/**
 * Removes the polling trigger (useful for maintenance or reconfiguration).
 */
function deleteTrigger() {
  const triggers = ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processEHLeaveEmails');

  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  console.log(`Removed ${triggers.length} trigger(s).`);
}

/**
 * Test helper — run manually to process a single email by Gmail message ID.
 * Useful for verifying ICS parsing without waiting for the trigger.
 * Find a message ID in Gmail via: GmailApp.search('...')[0].getMessages()[0].getId()
 */
function testSingleMessage(messageId) {
  const message     = GmailApp.getMessageById(messageId);
  const contractors = getContractorNames();
  const cal         = CalendarApp.getCalendarById(CONFIG.CONTRACTOR_CAL_ID);

  console.log(`Subject : ${message.getSubject()}`);
  console.log(`From    : ${message.getFrom()}`);

  const icsText = getICSAttachment(message);
  if (!icsText) { console.log('No ICS attachment found.'); return; }

  console.log('ICS preview:');
  console.log(icsText.substring(0, 500));

  const event = parseICS(icsText);
  console.log('Parsed event:', JSON.stringify({
    start:   event?.start?.toDateString(),
    end:     event?.end?.toDateString(),
    summary: event?.summary,
  }));

  // Uncomment to actually create the event:
  // processMessage(message, contractors, cal);
}
