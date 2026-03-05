# Actionstep API Skill

## Purpose

Workflow and reference for interacting with the Actionstep practice management system via Claude Code. Covers matter lookup, contact management, time entries, file notes, tasks, disbursements, and custom fields using the Zapier MCP tools available in claude.ai sessions.

## When to Use

- User asks to look up, create, or update a matter in Actionstep
- Logging a time entry, file note, or task against a matter
- Finding or creating a contact in Actionstep
- Working with matter custom fields (e.g., visa type, case stage data)
- Building or testing AS Gmail Plugin functionality
- Any workflow that reads from or writes to RML's Actionstep instance

## Prerequisites

- Zapier MCP connected in claude.ai (provides `mcp__claude_ai_Zapier__actionstep_*` tools)
- RML Zapier account authenticated to Actionstep
- No additional credentials needed for Zapier MCP path

## Access Paths

### Current: Zapier MCP (Ready)

All 22 tools available as `mcp__claude_ai_Zapier__actionstep_*` in claude.ai sessions. Load with:

```
ToolSearch: "select:mcp__claude_ai_Zapier__actionstep_find_matter" (or any actionstep tool)
```

### Planned: Direct REST API (Pending)

OAuth2 credentials requested from Actionstep dev team (2026-02-26). Will enable direct API calls for intranet and Gmail plugin backend. Base URL: `https://ap-southeast-2.actionstep.com/api/rest`

## Available Tools

### Contacts

| Tool | Use |
|------|-----|
| `actionstep_find_contact` | Find a contact by ID |
| `actionstep_search_for_a_contact` | Search by name or email |
| `actionstep_create_individual_contact` | Create a new person contact |
| `actionstep_create_company_contact` | Create a new company contact |
| `actionstep_update_individual_contact` | Update person contact fields |
| `actionstep_update_company_contact` | Update company contact fields |

### Matters

| Tool | Use |
|------|-----|
| `actionstep_find_matter` | Retrieve a matter by ID |
| `actionstep_search_for_matter` | Search matters by name/reference |
| `actionstep_create_matter` | Create a new matter |
| `actionstep_update_matter` | Update matter status, name, or fields |
| `actionstep_add_participant_to_matter` | Add a contact in a role to a matter |
| `actionstep_find_matter_custom_field` | Find a custom field definition |
| `actionstep_retrieve_matter_custom_field_value` | Get a custom field value on a matter |
| `actionstep_update_matter_custom_field_value` | Set a custom field value on a matter |

### Tasks

| Tool | Use |
|------|-----|
| `actionstep_create_task` | Create a task linked to a matter |
| `actionstep_update_task` | Update task status, assignee, or due date |

### Time & Billing

| Tool | Use |
|------|-----|
| `actionstep_create_time_entry` | Log billable time against a matter |
| `actionstep_create_disbursement` | Create an expense/disbursement entry |
| `actionstep_find_tax_code` | Look up a tax code by name |

### File Notes

| Tool | Use |
|------|-----|
| `actionstep_create_file_note` | Create a file note on a matter |
| `actionstep_update_file_note` | Update an existing file note |

### Raw API

| Tool | Use |
|------|-----|
| `actionstep_api_request_beta` | Execute a raw Actionstep REST request (beta, use sparingly) |

## Key Workflows

### Lookup a Matter

1. Ask user for matter name or reference number
2. Use `actionstep_search_for_matter` with the name/reference
3. If multiple results, present the list and ask user to confirm
4. Use `actionstep_find_matter` with the confirmed ID for full detail

### Log a Time Entry

1. Confirm the matter ID (use search if not known)
2. Confirm: staff member, duration (in minutes or hours), date, description, activity code
3. Use `actionstep_find_tax_code` if GST/tax code is needed
4. Call `actionstep_create_time_entry` with all confirmed fields
5. Confirm entry was created and report the time entry ID

### Create a File Note

1. Confirm the matter ID
2. Confirm: note content, date, note type (if applicable)
3. Call `actionstep_create_file_note`
4. Report the created file note ID

### Add a Contact to a Matter

1. Search or create the contact using contact tools
2. Confirm the matter ID and the participant role (e.g., "Client", "Employer")
3. Call `actionstep_add_participant_to_matter` with contact ID, matter ID, and role

### Work with Custom Fields

1. Use `actionstep_find_matter_custom_field` to find the field definition by name
2. Use `actionstep_retrieve_matter_custom_field_value` to read the current value
3. Use `actionstep_update_matter_custom_field_value` to write a new value

## Key Concepts

- **Matter** — Core record for a client legal file. Has: unique ID, action type (e.g., visa subclass), status, participants, custom fields, tasks, file notes, time entries.
- **Participant** — A contact attached to a matter in a specific role (Client, Employer, Agent, etc.). One matter can have multiple participants.
- **File Note** — A logged communication or event on a matter. Used to record calls, emails, meetings.
- **Time Entry** — A billable time record. Requires a matter, staff member, duration, and activity code.
- **Disbursement** — A cost/expense entry on a matter (e.g., filing fees, courier costs).
- **Custom Field** — RML-specific fields configured in Actionstep. Must look up field definition before setting values.
- **Action Type** — The matter type/workflow in Actionstep (corresponds to visa subclass or matter category).

## RML-Specific Context

- **Region:** `ap-southeast-2` (Sydney) — all API calls go to `ap-southeast-2.actionstep.com`
- **Matter types:** Primarily visa subclasses (482, 186, 189, 190, etc.) and compliance matters
- **Actionstep Matters Stages:** Reference page at notion.so/21de1901e36e807980c2eef13d371721
- **Actionstep Contacts DB:** notion.so/17ae1901e36e80a6856de29991a51234

## Anti-Patterns to Avoid

- **Do not assume matter IDs** — always search or confirm before using
- **Do not create duplicate contacts** — always search before creating
- **Do not use `actionstep_api_request_beta` for standard operations** — use the specific tools; the beta request tool has less error handling
- **Do not log time without confirming the activity code** — incorrect codes affect billing reports
- **Do not update matter custom fields without reading the current value first** — avoid overwriting existing data unintentionally

## Relation to Other Projects

- **AS Gmail Plugin** (311e1901) — primary consumer; Phase 2+ blocked on direct OAuth2 credentials
- **RML Intranet** (307e1901) — planned Q2 2026 matter data integration
- **Actionstep API Integration project** (31ae1901) — tracks this integration in Notion Projects DB
- **IT Systems Registry** (31ae1901-e36e-81fd) — system documented as "Actionstep API (Claude Integration)"

## Resources

- Notion project: https://www.notion.so/31ae1901e36e818c8715e98a6b18ee39
- IT Systems Registry entry: https://www.notion.so/31ae1901e36e81fdbd0df8ab17a21289
- API access statement session notes: `docs/sessions/2026-02-26-actionstep-api-access-statement.md`
- AS Gmail Plugin project: https://www.notion.so/311e1901e36e805c98e4cb1b55ebe88a
