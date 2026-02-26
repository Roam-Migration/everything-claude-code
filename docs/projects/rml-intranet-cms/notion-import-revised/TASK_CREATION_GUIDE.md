# CMS Project - Task Creation Guide
## Using Your Existing Notion Tasks Database

**Date:** February 19, 2026

---

## Overview

This guide shows how to create the 223 CMS tasks in your existing Notion Tasks database using the Notion plugin in Claude Code.

---

## Prerequisites

1. ✅ Notion plugin installed in Claude Code
2. ✅ "CMS Transformation Project" page created in Notion
3. ✅ Existing Tasks database accessible
4. ✅ OAuth authentication completed with Notion

---

## Method 1: Using Claude Code Notion Plugin (Recommended)

### Step 1: Verify Setup

```bash
# In Claude Code, test Notion access
/Notion:search "Tasks"
```

This should find your Tasks database.

### Step 2: Create Project Page First

1. In Notion, create page: "CMS Transformation Project"
2. Copy content from `PROJECT_PAGE_CONTENT.md`
3. Paste into the Notion page
4. Note the page URL (you'll need this)

### Step 3: Bulk Create Tasks

In Claude Code, say:

```
"Using the Notion plugin, create tasks in my Tasks database for the CMS Transformation project.

For each of the 223 tasks listed in the strategic documents:
1. Create task in Tasks database
2. Set Project relation to 'CMS Transformation Project'
3. Set Status to 'Planning'
4. Map priority: P0 → High, P1 → Medium, P2 → Low
5. Add phase info to task description
6. Set due dates based on phase timeline

Start with Phase 1 tasks (47 tasks)."
```

Claude will use the Notion plugin to:
- Find your Tasks database
- Create each task
- Set appropriate properties
- Link to project page

### Step 4: Verify Creation

After bulk creation:

1. Open your Tasks database in Notion
2. Filter by: Project = "CMS Transformation Project"
3. Verify task count and properties
4. Adjust as needed

---

## Method 2: Manual Creation (Small Batches)

If you prefer more control, create tasks in batches:

### Phase 1 Tasks (47 tasks)

**Week 1 Tasks (Day 1-2):**

```bash
/Notion:create-task "Set up staging GCP project structure" Feb 21
/Notion:create-task "Build staging Docker image" Feb 21
/Notion:create-task "Deploy staging Cloud Run service" Feb 21
# ... continue for all Phase 1 tasks
```

For each task:
- Use `/Notion:create-task [task name] [due date]`
- Then manually set:
  - Project → "CMS Transformation Project"
  - Priority → Based on original priority (P0=High, P1=Medium, P2=Low)
  - Add description with phase, category, estimated hours, dependencies

---

## Method 3: Using Task Template

Create a Notion template for CMS tasks:

### Template Properties:
- **Title:** [Set per task]
- **Status:** Planning (default)
- **Priority:** [High/Medium/Low]
- **Due Date:** [Based on phase]
- **Project:** CMS Transformation Project (pre-linked)
- **Agent status:** (empty)
- **Agent blocked:** unchecked

### Template Description Format:
```markdown
**Phase:** [Phase number and name]
**Category:** [Frontend/Backend/DevOps/Testing/Documentation/Design]
**Estimated Hours:** [Hours]
**Dependencies:** [Task names or "None"]

## Description
[What needs to be done]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Notes
[Additional context]
```

---

## Task Examples

### Example 1: Phase 1 Task

**Title:** Set up staging Supabase project
**Status:** Planning
**Priority:** High (P0)
**Due Date:** Feb 22, 2026
**Project:** CMS Transformation Project

**Description:**
```markdown
**Phase:** Phase 1 - Foundation
**Category:** Database
**Estimated Hours:** 2
**Dependencies:** Deploy staging Cloud Run service

## Description
Create new Supabase project for staging environment named "rml-intranet-staging"

## Acceptance Criteria
- [ ] Supabase project created
- [ ] Connection details documented
- [ ] Project shared with team

## Notes
Document connection string and anon key in secure location
```

### Example 2: Phase 2 Task

**Title:** Create HeroBlock component
**Status:** Planning
**Priority:** High (P0)
**Due Date:** Mar 11, 2026
**Project:** CMS Transformation Project

**Description:**
```markdown
**Phase:** Phase 2 - Page Builder
**Category:** Frontend
**Estimated Hours:** 2
**Dependencies:** Create BlockRenderer component

## Description
Build Hero section block component with title, subtitle, background, and CTA

## Acceptance Criteria
- [ ] Component created in src/app/components/PageBuilder/blocks/
- [ ] Props interface defined
- [ ] Renders correctly in canvas
- [ ] Configurable via property panel

## Notes
Support background image/color, adjustable text alignment
```

### Example 3: Phase 6 Task

**Title:** Write E2E tests with Playwright
**Status:** Planning
**Priority:** High (P0)
**Due Date:** May 26, 2026
**Project:** CMS Transformation Project

**Description:**
```markdown
**Phase:** Phase 6 - Polish & Testing
**Category:** Testing
**Estimated Hours:** 8
**Dependencies:** Write integration tests for APIs

## Description
Create comprehensive E2E test suite covering all user workflows

## Acceptance Criteria
- [ ] Page builder workflow tested
- [ ] Form builder workflow tested
- [ ] Publishing workflow tested
- [ ] All tests passing
- [ ] Tests run in CI/CD

## Notes
Full user workflows from login to page publish
```

---

## Task Properties Reference

### Priority Mapping

| Original | Your System |
|----------|-------------|
| P0 (Critical) | High |
| P1 (High) | Medium |
| P2 (Medium) | Low |

### Status Progression

1. **Planning** → Initial state, not started
2. **In Progress** → Currently working on
3. **Done** → Completed and verified

### Due Date Calculation

Based on phase timelines:

| Phase | Start Date | End Date | Duration |
|-------|------------|----------|----------|
| Phase 1 | Feb 19 | Mar 4 | 2 weeks |
| Phase 2 | Mar 5 | Mar 25 | 3 weeks |
| Phase 3 | Mar 26 | Apr 8 | 2 weeks |
| Phase 4 | Apr 9 | Apr 15 | 1 week |
| Phase 5 | Apr 16 | Apr 22 | 1 week |
| Phase 6 | Apr 23 | May 13 | 3 weeks |

Distribute task due dates throughout each phase.

---

## Recommended Workflow

### Week-by-Week Approach

#### Week 1 (Feb 19-25): Create Phase 1 Tasks
1. Create all 47 Phase 1 tasks
2. Link to project page
3. Set due dates (Feb 21 - Mar 4)
4. Assign if known

#### Week 2 (Feb 26 - Mar 4): Begin Execution + Create Phase 2
1. Start working on Phase 1 tasks
2. Create all 65 Phase 2 tasks
3. Link and schedule for Mar 5-25

#### Week 3-12: Progressive Task Creation
- Create next phase tasks while working on current phase
- Adjust due dates based on actual progress
- Add notes and learnings to task descriptions

---

## Automation Options

### Option 1: Notion API Script

If you have programming access, create a script:

```javascript
// Example structure (not runnable code)
const tasks = require('./TASKS_BULK_CREATE.json');

for (const task of tasks) {
  await notion.pages.create({
    parent: { database_id: TASKS_DB_ID },
    properties: {
      'Title': { title: [{ text: { content: task.name } }] },
      'Status': { select: { name: 'Planning' } },
      'Priority': { select: { name: mapPriority(task.priority) } },
      'Due Date': { date: { start: task.dueDate } },
      'Project': { relation: [{ id: PROJECT_PAGE_ID }] }
    },
    children: [/* task description */]
  });
}
```

### Option 2: Notion Integration

Use Notion's import features (if available for your plan).

### Option 3: Claude Code Batch

Tell Claude Code:

```
"Read the tasks from the strategic documentation and create them in batches of 10-20 tasks at a time in my Notion Tasks database."
```

---

## Verification Checklist

After creating tasks:

### Database Level
- [ ] All 223 tasks created
- [ ] All linked to "CMS Transformation Project"
- [ ] Status set to "Planning"
- [ ] Priorities mapped correctly (P0→High, P1→Medium, P2→Low)
- [ ] Due dates distributed across phase timelines

### Task Level
- [ ] Task names clear and actionable
- [ ] Descriptions include phase, category, hours, dependencies
- [ ] Acceptance criteria present
- [ ] Notes added where relevant

### Views Setup
- [ ] "CMS - Board by Phase" view created
- [ ] "CMS - This Week" view created
- [ ] "CMS - By Priority" view created
- [ ] "CMS - Timeline" view created

---

## Troubleshooting

### Issue: Can't find Tasks database
**Solution:** Use `/Notion:search "Tasks"` to locate it. If multiple results, choose the one you use for project tasks.

### Issue: Project relation not working
**Solution:** Ensure "CMS Transformation Project" page exists and is accessible. Copy its URL for linking.

### Issue: Too many tasks to create manually
**Solution:** Use Claude Code with Notion plugin for bulk creation, or create in batches of 20-30 tasks.

### Issue: Tasks not showing in filtered view
**Solution:** Verify:
1. Project relation is set correctly
2. Filter criteria match (Project = "CMS Transformation Project")
3. Refresh Notion page

---

## Next Steps

1. ✅ Create "CMS Transformation Project" page
2. ✅ Verify Notion plugin access
3. ✅ Start with Phase 1 tasks (47 tasks)
4. ✅ Set up custom views
5. ✅ Begin execution

---

## Support

**Need help with task creation?**
- Review this guide
- Use Claude Code's Notion plugin for assistance
- Reference the strategic documentation for task details

**Questions about task content?**
- See `/strategic/CMS-IMPLEMENTATION-GUIDE.md` for technical details
- See `/strategic/CMS-IMMEDIATE-ACTION-PLAN.md` for Week 1 specifics
- See `PROJECT_PAGE_CONTENT.md` for complete project overview

---

**Status:** ✅ Ready to create tasks
**Estimated Time:** 2-4 hours for all 223 tasks (with plugin)
**Recommended:** Create in batches by phase
