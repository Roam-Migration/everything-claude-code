# Notion CMS Project Import Guide

This directory contains structured data for importing the CMS transformation project into Notion.

## Files Included

1. **PROJECT_OVERVIEW.md** - Main project page content
2. **phases-database.csv** - Phases database structure
3. **tasks-database.csv** - Detailed tasks database (200+ tasks)
4. **decisions-database.csv** - Decision tracking
5. **risks-database.csv** - Risk register
6. **resources-database.csv** - Documentation and resources

## How to Import

### Option 1: Manual Setup (Recommended for Full Control)

1. **Create Main Project Page**
   - In Notion, create a new page: "CMS Transformation Project"
   - Copy content from `PROJECT_OVERVIEW.md`
   - Paste into Notion page

2. **Create Phases Database**
   - Create new database (table view)
   - Name: "CMS Phases"
   - Import `phases-database.csv`
   - Add to project page as inline database

3. **Create Tasks Database**
   - Create new database (board view recommended)
   - Name: "CMS Tasks"
   - Import `tasks-database.csv`
   - Configure views:
     - Board by Phase
     - Board by Status
     - Table by Priority
     - Timeline by Due Date

4. **Create Supporting Databases**
   - Import `decisions-database.csv` → "Decisions"
   - Import `risks-database.csv` → "Risk Register"
   - Import `resources-database.csv` → "Resources & Docs"

### Option 2: Quick Import

1. Go to Notion
2. Click "Import" in sidebar
3. Select "CSV" option
4. Import each CSV file as separate database
5. Link databases together using relations

### Option 3: Notion API (Automated)

If you have Notion API access, run:
```bash
cd /tmp/Rmlintranetdesign/docs/notion-import
node import-to-notion.js
```

## Database Relationships

```
┌─────────────────┐
│ CMS Project     │ (Main page)
└────────┬────────┘
         │
         ├──► Phases Database
         │    └──► Tasks Database (related to phase)
         │         ├──► Status: Not Started, In Progress, Done
         │         ├──► Priority: P0, P1, P2
         │         └──► Assignee: Team members
         │
         ├──► Decisions Database
         ├──► Risk Register
         └──► Resources & Docs
```

## Database Properties

### Phases Database
- **Name** (Title)
- **Week** (Number)
- **Duration** (Text)
- **Status** (Select): Planning, In Progress, Complete
- **Tasks** (Relation to Tasks)
- **Deliverables** (Text)
- **Dependencies** (Text)

### Tasks Database
- **Task Name** (Title)
- **Phase** (Relation to Phases)
- **Status** (Select): Not Started, In Progress, Blocked, Done
- **Priority** (Select): P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- **Assignee** (Person)
- **Due Date** (Date)
- **Estimated Hours** (Number)
- **Category** (Multi-select): Backend, Frontend, Database, DevOps, Design, Testing, Documentation
- **Dependencies** (Text)
- **Notes** (Text)
- **Related Docs** (Relation to Resources)

### Decisions Database
- **Decision** (Title)
- **Status** (Select): Pending, Approved, Rejected
- **Decision Date** (Date)
- **Owner** (Person)
- **Impact** (Select): High, Medium, Low
- **Context** (Text)
- **Options Considered** (Text)
- **Outcome** (Text)

### Risk Register
- **Risk** (Title)
- **Impact** (Select): High, Medium, Low
- **Likelihood** (Select): High, Medium, Low
- **Mitigation** (Text)
- **Owner** (Person)
- **Status** (Select): Open, Mitigated, Closed

### Resources Database
- **Resource Name** (Title)
- **Type** (Select): Documentation, API Reference, Design File, Code Example
- **URL** (URL)
- **Description** (Text)
- **Related Phase** (Relation to Phases)

## Recommended Views

### For Project Manager
1. **Dashboard** - Gallery view showing phase progress
2. **This Week** - Tasks due this week, filtered by due date
3. **Blocked Items** - Tasks with status "Blocked"
4. **P0 Tasks** - Critical priority items

### For Developers
1. **My Tasks** - Filtered by assignee
2. **Backend Tasks** - Filtered by category "Backend"
3. **Frontend Tasks** - Filtered by category "Frontend"
4. **Timeline** - Timeline view for planning

### For Stakeholders
1. **Phase Progress** - Board grouped by phase
2. **Decisions Pending** - Decisions awaiting approval
3. **Risk Dashboard** - High-impact risks

## Next Steps After Import

1. **Assign Team Members**
   - Add team members to workspace
   - Assign tasks to specific people

2. **Set Due Dates**
   - Review timeline in `phases-database.csv`
   - Adjust dates based on start date

3. **Customize Properties**
   - Add company-specific fields
   - Adjust status options
   - Configure automations

4. **Link External Docs**
   - Link to GitHub repo
   - Link to Figma designs
   - Link to Google Drive folders

5. **Set Up Notifications**
   - Configure Slack notifications
   - Set up email reminders
   - Enable mentions

## Tips for Using the Project

- **Daily Standups:** Filter "In Progress" tasks by team member
- **Weekly Planning:** Review upcoming week's tasks, adjust priorities
- **Phase Reviews:** Use phase database to track deliverables
- **Decision Log:** Document all architectural decisions
- **Risk Reviews:** Monthly review of risk register

---

**Questions?** Contact the project team or refer to the main CMS documentation.
