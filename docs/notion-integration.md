# Notion Integration Handover for Claude Code

**Generated:** 2026-02-13  
**Purpose:** Enable Claude Code to produce correctly formatted Notion task content for Roam Migration Law's workspace

---

## 1. Workspace Structure

Let me fetch the workspace details and database schemas.Let me search for the Tasks database instead:Now let me fetch the Projects database:Now let me add the requested task to the Tasks database. First, let me create the task:I need to format the Driver property correctly. Let me try again:Perfect! The task has been created. Now let me compile the complete handover document:

---

## Results

**Evidence**:
- **Task Created**: https://www.notion.so/306e1901e36e8168b74ce17d846bd2a0
- **Database Fetched**: All Staff Tasks (Collection ID: `4b3348c5-136e-4339-8166-b3680e3b6396`)

**Blockers**: None

**Next**: Document ready for export to `/home/jtaylor/everything-claude-code/docs/notion-integration.md`

---

# Complete Handover Document

```markdown
# Notion Integration Handover for Claude Code

**Generated:** 2026-02-13  
**Workspace:** Roam Migration Law  
**Authenticated User:** Jackson (j.taylor@roammigrationlaw.com)  
**User ID:** cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87

---

## 1. Workspace Structure

### Core Databases

The following databases are central to engineering and project management workflows:

| Database Name | Database/Collection ID | Purpose |
|--------------|------------------------|---------|
| **All Staff Tasks** | `4b3348c5-136e-4339-8166-b3680e3b6396` (Collection ID) | Primary task tracking database for all staff |
| **Projects** | `7e62ecf2-0379-4fa5-9a54-99788a80af99` (Collection ID) | Project portfolio management |
| **IT Systems Registry** | `778bf039-89f1-4486-9f41-c32be1cc4717` (Collection ID) | Central governance for all IT systems |
| **Session Log** | `2ece1901-e36e-8119-a5ad-000be2f0a766` (Collection ID) | Development session tracking |
| **People** | `6c0f8ab0-1b6e-4166-a723-f93e18560ccb` (Collection ID) | Staff directory |
| **Meetings** | `84c0eaf1-d559-463d-bcb2-4ee71da8f581` (Collection ID) | Meeting management |
| **Roles** | `9cd79b7e-39f9-4033-8a7a-b309c0780bd6` (Collection ID) | Organizational roles |

**Important:** Collection IDs are used when creating pages (`parent.data_source_id`). Database IDs are different and used for schema modifications.

---

## 2. Task Database Details

### Database: All Staff Tasks

**Collection ID:** `4b3348c5-136e-4339-8166-b3680e3b6396`  
**Database URL:** https://www.notion.so/502c024ad46441a4938ca25e852e4f91

### Required Properties

The following properties are **required** when creating new tasks:

- **Task** (Title): The task name/title
- **Status** (Status): Current task status

### Property Schema

| Property | Type | Valid Options/Format | Notes |
|----------|------|---------------------|-------|
| **Task** | Title | Text | Required. Main task identifier |
| **Summary** | Text | Plain text | Brief description |
| **Status** | Status | `Not started`, `Proposed`, `On hold`, `In progress`, `Approved`, `For Review`, `Changes Required`, `Done`, `Deprecated` | Required. Grouped into: To-do, In progress, Complete |
| **Priority** | Select | `🔴 Urgent`, `High`, `🟡 Normal`, `⚪ Low` | Task priority level |
| **Effort** | Select | `1`, `2`, `3`, `4`, `5`, `8` | Story points (Fibonacci-ish) |
| **Driver** | Person | Single user ID | Person responsible for execution |
| **Approver** | Person | Single user ID | Person who approves completion |
| **Consulted** | Person | Array of user IDs | Stakeholders to consult |
| **Informed** | Person | Array of user IDs | Stakeholders to inform |
| **Project** | Relation | Single page URL (to Projects collection) | Parent project |
| **Tags** | Multi-select | `Website`, `Mobile`, `Email`, `Brand Marketing`, `SEO`, `Social Media`, `Email List`, `Complize`, `Video`, `Content creation`, `KPI`, `Cz-KB` | Topic tags |
| **Start Date** | Date | ISO-8601 format (expanded: `date:Start Date:start`, `date:Start Date:end`, `date:Start Date:is_datetime`) | When work begins |
| **Completion Date** | Date | ISO-8601 format (expanded) | When work completes |
| **Completed** | Checkbox | `__YES__` or `__NO__` | Task completion flag |
| **Approved** | Checkbox | `__YES__` or `__NO__` | Approval status |
| **Parent item** | Relation | Single page URL (to Tasks collection) | Parent task |
| **Sub-item** | Relation | Array of page URLs (to Tasks collection) | Child tasks |
| **Blocked by** | Relation | Array of page URLs (to Tasks collection) | Dependencies |
| **Is blocking** | Relation | Array of page URLs (to Tasks collection) | Dependent tasks |
| **userDefined:URL** | URL | Valid URL | Related resource link |

### Status Lifecycle

**To-do Group:**
- `Not started` - Default initial state
- `Proposed` - Under consideration
- `On hold` - Temporarily paused

**In Progress Group:**
- `In progress` - Active work
- `For Review` - Awaiting review
- `Approved` - Approved but not complete
- `Changes Required` - Needs revision

**Complete Group:**
- `Done` - Successfully completed
- `Deprecated` - No longer relevant

### Common Task Assignment Pattern

For engineering tasks:
1. **Driver**: The engineer doing the work (Jackson for most dev tasks)
2. **Approver**: Technical lead or product owner
3. **Project**: Link to parent project (e.g., "Intranet Launch", "SPQR Dashboard")
4. **Status**: Start with `Not started` or `Proposed`
5. **Priority**: Default to `🟡 Normal` unless urgent
6. **Effort**: Use story points (1-8)

---

## 3. Conventions & Templates

### Task Title Format

**Pattern:** `[Action Verb] [Object/Component] [Context]`

**Examples:**
- ✅ `Migrate Intranet (Rmlintranetdesign) to consume @roam-migration/components`
- ✅ `Implement SPQR Dashboard user authentication`
- ✅ `Fix navigation bug in mobile menu`
- ✅ `Refactor Task database schema for performance`

**Avoid:**
- ❌ `Update stuff`
- ❌ `Fix it`
- ❌ `Work on project`

### Task Description Structure

Use markdown sections:

```markdown
[Brief summary sentence]

## Steps

- Step 1
- Step 2
- Step 3

## Context

[Why this matters, what changed, dependencies]

## Definition of Done

- [ ] Criterion 1
- [ ] Criterion 2

## Links

- Related PR: [link]
- Documentation: [link]
```

### Linking to GitHub

Use the `userDefined:URL` property or include in the description:

```markdown
## Links

- **GitHub PR**: https://github.com/roammigrationlaw/repo-name/pull/123
- **Repository**: https://github.com/roammigrationlaw/repo-name
- **Deployed URL**: https://app.roammigrationlaw.com
```

### Project/Label Conventions

**Project Tags:**
- Use relation to Projects database (Collection ID: `7e62ecf2-0379-4fa5-9a54-99788a80af99`)
- Search for existing projects first: "Intranet Launch", "SPQR Dashboard", "RML Shared Components"

**Tags:**
- `Website` - Frontend/web application work
- `Mobile` - Mobile app work
- `Email` - Email systems/templates
- `SEO` - Search optimization
- `Content creation` - Documentation/content
- `KPI` - Metrics/analytics

### Well-Written Task Examples

**Example 1: Feature Implementation**
```
Title: Implement OAuth integration for Google Workspace
Priority: High
Effort: 8
Status: Not started
Tags: Website

Description:
Add Google OAuth 2.0 authentication to allow users to sign in with their 
Google Workspace accounts.

## Steps
- Configure Google Cloud project OAuth credentials
- Implement OAuth callback handler in Next.js API routes
- Add "Sign in with Google" button to login page
- Store OAuth tokens securely in session
- Test with multiple Google Workspace accounts

## Definition of Done
- [ ] Users can sign in with Google accounts
- [ ] OAuth tokens refresh automatically
- [ ] Error handling for failed auth
- [ ] Unit tests pass
```

**Example 2: Refactoring**
```
Title: Extract shared UI components to @roam-migration/components
Priority: Normal
Effort: 5
Status: Done
Tags: Website

Description:
Create shared component library to deduplicate UI code across Intranet 
and Compass Wiki projects.

## Context
Both projects use the same shadcn/ui components with identical styling. 
Publishing as NPM package enables version-controlled component sharing.

## Steps
- Create monorepo package structure
- Extract 20 shadcn components
- Configure TypeScript exports
- Publish to GitHub Packages
- Update consuming projects

## Links
- PR: https://github.com/roammigrationlaw/rml-shared-components/pull/5
- Package: @roam-migration/components@0.2.0
```

---

## 4. Integration Options

### Current Integration Status

**Notion API Access:** ✅ Available via Claude Browser  
**Direct API Token:** ❌ Not configured for Claude Code  
**Automation Tools:** None currently configured (no Zapier/Make)

### Recommended Workflow for Claude Code

Since Claude Code (CLI agent) **does not** have direct Notion API access, use this workflow:

#### Option A: Manual Task Creation (Recommended)

1. Claude Code produces task content in structured markdown
2. Jackson (or Claude Browser) manually creates the Notion task
3. Claude Code receives task URL for reference

**Template Output from Claude Code:**

```markdown
## Task Request for Notion

**Title:** [Action] [Object] [Context]
**Priority:** [🔴 Urgent | High | 🟡 Normal | ⚪ Low]
**Effort:** [1|2|3|4|5|8]
**Status:** Not started
**Project:** [Project Name or ID]
**Tags:** [Website, Mobile, etc.]

**Description:**
[Full task description with steps, context, links]
```

#### Option B: Notion MCP Server (Future)

To enable direct integration:

1. Create Notion API integration at https://www.notion.so/my-integrations
2. Grant access to "All Staff Tasks" and "Projects" databases
3. Configure MCP server with integration token
4. Claude Code can then create/update tasks directly

**Permissions Needed:**
- Read content
- Update content
- Insert content

---

## 5. Task Successfully Created

I've created the requested task in your Notion workspace:

**Task URL:** https://www.notion.so/306e1901e36e8168b74ce17d846bd2a0

**Details:**
- **Title:** Migrate Intranet (Rmlintranetdesign) to consume @roam-migration/components
- **Summary:** Replace Intranet's 20 local shadcn component files with shared library imports
- **Priority:** ⚪ Low
- **Status:** Not started
- **Tags:** Website

**Full Description:**
```
Replace the Intranet's 20 local `src/app/components/ui/` shadcn component 
files with imports from the shared library `@roam-migration/components@0.2.0` 
(just published to GitHub Packages).

## Steps

- Install `@roam-migration/components@0.2.0` in Rmlintranetdesign
- Import `@roam-migration/components/theme` CSS and configure Tailwind preset
- Replace all local `src/app/components/ui/` imports with 
  `@roam-migration/components` imports
- Delete the 20 redundant local component files
- Verify deployed UI at intranet.roammigrationlaw.com is unchanged

## Context

PR #5 in rml-shared-components extracted these components. This is 
deduplication — no visual/functional change. Also a prerequisite for 
compass-wiki to share the same component set.

## Project/Labels

- Project: RML Shared Components / Intranet
- Labels: refactor, shared-components, intranet
```

---

## 6. Property Formatting Reference

### Critical Formatting Rules

#### Checkbox Properties
```json
{
  "Completed": "__YES__",  // ✅ Correct
  "Approved": "__NO__"     // ✅ Correct
}

// ❌ WRONG:
{
  "Completed": true,       // Will fail
  "Approved": "true"       // Will fail
}
```

#### Date Properties (Expanded Format)
```json
{
  "date:Start Date:start": "2026-02-13",
  "date:Start Date:end": null,
  "date:Start Date:is_datetime": 0  // 0 = date only, 1 = datetime
}

// For datetime:
{
  "date:Start Date:start": "2026-02-13T09:00:00",
  "date:Start Date:is_datetime": 1
}
```

#### Person Properties
```json
{
  "Driver": "cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87",    // Single person — plain UUID, NO extra quoting
  "Consulted": "[\"user-id-1\", \"user-id-2\"]"        // Multi-person (Consulted, Informed) — JSON array string
}
```

#### Relation Properties
```json
{
  "Project": "\"https://www.notion.so/page-id\"",  // Single relation (JSON string of page URL)
  "Sub-item": "[\"https://www.notion.so/page-1\", \"https://www.notion.so/page-2\"]"  // Multiple (JSON array)
}
```

#### Select Properties
```json
{
  "Priority": "🟡 Normal",     // Must match exact option name
  "Status": "Not started",     // Case-sensitive
  "Effort": "5"                // Even numbers are strings
}
```

#### Multi-Select Properties
```json
{
  "Tags": "[\"Website\", \"Mobile\"]"  // JSON array of option names
}
```

### Special Property Names

Properties named "id" or "url" (case-insensitive) must be prefixed:

```json
{
  "userDefined:URL": "https://github.com/roammigrationlaw/repo",  // ✅ Correct
  "URL": "https://..."  // ❌ Will fail - reserved name
}
```

---

## 7. Quick Reference: Creating Tasks

### Minimum Viable Task

```json
{
  "parent": {
    "data_source_id": "4b3348c5-136e-4339-8166-b3680e3b6396"
  },
  "pages": [
    {
      "properties": {
        "Task": "Task title here",
        "Status": "Not started"
      },
      "content": "Task description in markdown"
    }
  ]
}
```

### Typical Engineering Task

```json
{
  "parent": {
    "data_source_id": "4b3348c5-136e-4339-8166-b3680e3b6396"
  },
  "pages": [
    {
      "properties": {
        "Task": "Implement feature X",
        "Summary": "Brief one-liner",
        "Status": "Not started",
        "Priority": "🟡 Normal",
        "Effort": "5",
        "Tags": "[\"Website\"]",
        "userDefined:URL": "https://github.com/org/repo/pull/123"
      },
      "content": "## Steps\n\n- Step 1\n- Step 2\n\n## Context\n\n[Details]"
    }
  ]
}
```

---

## 8. Common Workflows

### Workflow 1: Create Task from GitHub PR

When Claude Code creates a PR, generate this task request:

```markdown
## Task Request for Notion

**Title:** Review and merge PR #123: Add user authentication
**Priority:** High
**Effort:** 3
**Status:** For Review
**Tags:** Website

**Description:**

## PR Details
- **Repository:** roammigrationlaw/intranet
- **PR:** https://github.com/roammigrationlaw/intranet/pull/123
- **Changes:** Implemented OAuth 2.0 Google Workspace integration

## Review Checklist
- [ ] Code review completed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Approved by security team

## Links
- PR: https://github.com/roammigrationlaw/intranet/pull/123
- CI: https://github.com/roammigrationlaw/intranet/actions/runs/456
```

### Workflow 2: Break Down Epic into Tasks

When a large feature needs decomposition:

1. Create parent task (Epic)
2. Create child tasks with `Parent item` relation
3. Link all to same `Project`

```markdown
## Epic Task Request

**Title:** Implement SPQR Dashboard Phase 1
**Priority:** High
**Effort:** 8
**Status:** In progress
**Project:** AS SPQR BI Dashboard Project

---

## Sub-Task 1

**Title:** Set up SPQR Dashboard database schema
**Priority:** High
**Effort:** 5
**Parent:** [Epic task URL once created]
**Status:** Not started

---

## Sub-Task 2

**Title:** Build SPQR Dashboard API endpoints
**Priority:** High
**Effort:** 5
**Parent:** [Epic task URL once created]
**Status:** Not started
```

### Workflow 3: Update Task Status via Context

Since Claude Code can't update Notion directly, include status updates in PR descriptions:

```markdown
## PR Description

Implements user authentication flow.

**Notion Task:** https://www.notion.so/306e1901e36e8168b74ce17d846bd2a0
**Status Update:** Ready for review (change Status to "For Review")
```

Jackson can then manually update the task status in Notion.

---

## 9. Troubleshooting

### Common Errors

**Error:** `Id "xxx" is not a user id`
- **Fix:** Person properties must use plain UUID strings — no extra JSON-quoting: `"cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87"`

**Error:** `Could not find page with ID`
- **Fix:** You're using Database ID instead of Collection ID. Collection IDs are used for creating pages.

**Error:** `Property "Status" is required`
- **Fix:** All tasks must have a Status value (e.g., "Not started")

**Error:** `Invalid select value`
- **Fix:** Select/multi-select values are case-sensitive and must exactly match option names

### ID Type Reference

```
Database Page URL:        https://www.notion.so/502c024ad46441a4938ca25e852e4f91
   └─ Database ID:        502c024a-d464-41a4-938c-a25e852e4f91
   └─ Used for:           Schema updates (notion-update-database)

Collection URL:           collection://4b3348c5-136e-4339-8166-b3680e3b6396
   └─ Collection ID:      4b3348c5-136e-4339-8166-b3680e3b6396
   └─ Used for:           Creating pages (parent.data_source_id)
                          Relations to this database

Individual Page URL:      https://www.notion.so/306e1901e36e8168b74ce17d846bd2a0
   └─ Page ID:            306e1901-e36e-8168-b74c-e17d846bd2a0
   └─ Used for:           Updating pages (notion-update-page)
                          Fetching pages (notion-fetch)
```

---

## 10. Collection ID Quick Reference

Keep this handy for all Notion operations:

```bash
# Core Databases
IT_SYSTEMS_REGISTRY="778bf039-89f1-4486-9f41-c32be1cc4717"
PROJECTS="7e62ecf2-0379-4fa5-9a54-99788a80af99"
TASKS="4b3348c5-136e-4339-8166-b3680e3b6396"
SESSION_LOG="2ece1901-e36e-8119-a5ad-000be2f0a766"
PEOPLE="6c0f8ab0-1b6e-4166-a723-f93e18560ccb"
MEETINGS="84c0eaf1-d559-463d-bcb2-4ee71da8f581"
ROLES="9cd79b7e-39f9-4033-8a7a-b309c0780bd6"
TEAMS="83793035-0ed4-46df-b076-2f090fc22415"
POSITION_DESCRIPTIONS="72ce8cde-f3e5-40f5-b278-13a614cdcfbc"
DEPARTMENT="ad5189c0-0d6c-42f3-8896-733d61d00521"
```

---

## Summary

This document provides everything Claude Code needs to:

1. **Understand** the Notion workspace structure
2. **Format** task content correctly
3. **Request** manual task creation with proper metadata
4. **Reference** existing tasks, projects, and databases
5. **Troubleshoot** common integration issues

Since Claude Code doesn't have direct Notion API access, the recommended pattern is:

1. Claude Code performs development work
2. Claude Code outputs structured task requests (markdown)
3. Jackson or Claude Browser creates the actual Notion tasks
4. Task URLs are passed back to Claude Code for reference

For direct integration in the future, set up a Notion MCP server with appropriate API permissions.
```

---

