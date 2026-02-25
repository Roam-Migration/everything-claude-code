# Google App Scripts — RML

**Status:** Stub — to be completed by Aaron Taylor during ECC onboarding (T19)
**Last updated:** 2026-02-25

---

## Overview

Google Apps Script is a JavaScript-based scripting platform built into Google Workspace. Scripts can automate actions across Google Sheets, Docs, Gmail, Calendar, and Drive — without leaving the Google ecosystem.

Think of it as Excel macros, but for Google Workspace, with access to the full Google APIs.

---

## Finding Existing Scripts

To see all scripts associated with your Google account:
1. Visit https://script.google.com (log in with @roammigrationlaw.com)
2. Browse "My Projects" for standalone scripts
3. For scripts attached to a Sheets/Doc: open the file > Extensions > Apps Script

---

## Current Scripts

> Fill in each script you find. Use the format below.

### Script: [Name]

| Field | Value |
|-------|-------|
| **Location** | Standalone / Attached to [Sheet/Doc name] |
| **Trigger** | [Manual / Time-based / On edit / On form submit / etc.] |
| **What it does** | [Plain English description] |
| **Outputs** | [What it produces — email, row in sheet, calendar event, etc.] |
| **Status** | Active / Broken / Deprecated |
| **Owner** | [Who wrote/maintains it] |
| **Script URL** | [Link from script.google.com] |

---

## Common Use Cases at RML

> Check which of these apply and add notes.

- [ ] Auto-format or process Google Sheets data
- [ ] Send templated emails from Gmail
- [ ] Create or update Google Calendar events
- [ ] Process Google Form submissions
- [ ] Pull data from external APIs into Sheets
- [ ] Generate Google Docs from templates
- [ ] Other: ___

---

## Interaction with Zapier

Some automations can be built with either Zapier or Apps Script. General guidance:

| Use Zapier when... | Use Apps Script when... |
|--------------------|------------------------|
| Connecting two different tools (e.g., Notion + Gmail) | Automating within Google Workspace only |
| No coding required | Logic is complex or needs loops |
| Speed of setup matters | Deep Google API access needed |

---

## Limitations and Gotchas

- Scripts run with the authorising user's permissions — if that person leaves, scripts may break
- Daily execution limits apply (6 min/execution, 90 min/day for free Workspace)
- OAuth tokens for external APIs must be refreshed periodically
- `Logger.log()` output is visible in the script editor > Executions log

---

## Related Docs

- `docs/tools/zapier-integration.md` — Zapier workflows (alternative automation layer)
- `docs/tools/tool-ecosystem-map.md` — full RML tool stack overview
