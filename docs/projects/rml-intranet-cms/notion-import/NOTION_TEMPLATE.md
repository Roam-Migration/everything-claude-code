# Notion CMS Project Template Structure

This document describes the ideal Notion workspace structure for the CMS Transformation project.

## Page Hierarchy

```
📁 CMS Transformation Project (Main Page)
│
├── 📊 Project Overview (Dashboard)
│   ├── Status Summary
│   ├── Timeline Gantt
│   ├── Team & Roles
│   └── Quick Links
│
├── 🗂️ Phases Database (Inline)
│   ├── Phase 1: Foundation
│   ├── Phase 2: Page Builder
│   ├── Phase 3: Form Builder
│   ├── Phase 4: Publishing Workflow
│   ├── Phase 5: Asset Management
│   └── Phase 6: Polish & Testing
│
├── ✅ Tasks Database (Linked)
│   ├── View: Board by Phase
│   ├── View: Board by Status
│   ├── View: Table by Priority
│   ├── View: Timeline by Due Date
│   ├── View: My Tasks
│   └── View: This Week
│
├── 🎯 Decisions Database (Linked)
│   ├── View: Pending Decisions
│   ├── View: Approved Decisions
│   └── View: All Decisions
│
├── ⚠️ Risk Register (Linked)
│   ├── View: High Impact Risks
│   ├── View: Open Risks
│   └── View: Risk Matrix
│
├── 📚 Resources & Docs (Linked)
│   ├── View: By Type
│   ├── View: By Phase
│   └── View: All Resources
│
├── 📝 Meeting Notes
│   ├── Weekly Planning Template
│   ├── Daily Standup Template
│   └── Stakeholder Review Template
│
├── 📈 Progress Reports
│   ├── Week 1 Report
│   ├── Week 2 Report
│   └── ... (weekly)
│
└── 🗃️ Archive
    └── Completed Items
```

## Database Views Setup

### Tasks Database Views

#### 1. Board by Phase
- **Type:** Board
- **Group By:** Phase (relation)
- **Sort By:** Priority (P0 first), then Due Date
- **Filter:** Status is not "Done"

#### 2. Board by Status
- **Type:** Board
- **Group By:** Status
- **Sort By:** Priority
- **Filter:** None (show all)

#### 3. Table by Priority
- **Type:** Table
- **Group By:** Priority
- **Sort By:** Priority, then Phase
- **Visible Properties:** Task Name, Phase, Status, Assignee, Due Date, Estimated Hours
- **Filter:** Status is not "Done"

#### 4. Timeline by Due Date
- **Type:** Timeline
- **Date Property:** Due Date
- **Sort By:** Due Date
- **Filter:** Status is not "Done" AND Due Date is not empty
- **Color By:** Phase

#### 5. My Tasks
- **Type:** Table
- **Sort By:** Priority, then Due Date
- **Filter:** Assignee is @Me AND Status is not "Done"
- **Visible Properties:** Task Name, Phase, Status, Priority, Due Date, Notes

#### 6. This Week
- **Type:** Table
- **Sort By:** Due Date, then Priority
- **Filter:** Due Date is This Week AND Status is not "Done"
- **Visible Properties:** Task Name, Phase, Status, Priority, Assignee, Estimated Hours

### Decisions Database Views

#### 1. Pending Decisions
- **Type:** Table
- **Sort By:** Impact (High first), then Decision Date
- **Filter:** Status is "Pending"
- **Visible Properties:** Decision, Impact, Owner, Decision Date, Context

#### 2. Approved Decisions
- **Type:** Table
- **Sort By:** Decision Date (newest first)
- **Filter:** Status is "Approved"
- **Visible Properties:** Decision, Impact, Decision Date, Outcome

### Risk Register Views

#### 1. High Impact Risks
- **Type:** Table
- **Sort By:** Likelihood (High first)
- **Filter:** Impact is "High" AND Status is "Open"
- **Visible Properties:** Risk, Impact, Likelihood, Mitigation, Owner

#### 2. Risk Matrix
- **Type:** Board
- **Group By:** Impact
- **Sub-Group By:** Likelihood
- **Filter:** Status is "Open"

### Resources & Docs Views

#### 1. By Type
- **Type:** Gallery
- **Group By:** Type
- **Sort By:** Resource Name (A-Z)
- **Card Preview:** Description
- **Card Size:** Medium

#### 2. By Phase
- **Type:** Table
- **Group By:** Related Phase
- **Sort By:** Resource Name
- **Visible Properties:** Resource Name, Type, URL, Description

## Templates

### Weekly Planning Meeting Template

```markdown
# Weekly Planning - [Week of MM/DD]

**Attendees:** [Names]
**Date:** [Date]
**Duration:** 1 hour

## Last Week Review
- [ ] Review completed tasks
- [ ] Discuss blockers
- [ ] Celebrate wins

## This Week Planning
### Phase: [Current Phase]
**Goal:** [Weekly objective]

**Tasks:**
1. [Task 1] - Assigned to [Name]
2. [Task 2] - Assigned to [Name]
3. [Task 3] - Assigned to [Name]

### Blockers & Risks
- [Any blockers identified]

### Decisions Needed
- [Any decisions needed this week]

## Action Items
- [ ] [Action 1] - @Owner - Due [Date]
- [ ] [Action 2] - @Owner - Due [Date]

## Next Meeting
**Date:** [Next week same time]
```

### Daily Standup Template

```markdown
# Daily Standup - [Date]

## @[Team Member 1]
**Yesterday:** [What I worked on]
**Today:** [What I'm working on]
**Blockers:** [Any blockers]

## @[Team Member 2]
**Yesterday:**
**Today:**
**Blockers:**

## @[Team Member 3]
**Yesterday:**
**Today:**
**Blockers:**

## Action Items
- [ ] [Quick action if needed]
```

### Stakeholder Review Template

```markdown
# Stakeholder Review - [Date]

**Phase:** [Current Phase]
**Progress:** [X]% complete

## Accomplishments This Period
- ✅ [Achievement 1]
- ✅ [Achievement 2]
- ✅ [Achievement 3]

## Demos
1. [Feature 1 demo]
2. [Feature 2 demo]

## Upcoming Milestones
- [Milestone 1] - [Date]
- [Milestone 2] - [Date]

## Challenges & Risks
- [Challenge 1] - Mitigation: [Plan]
- [Risk 1] - Status: [Update]

## Decisions Needed
1. [Decision 1] - Context: [Brief context]

## Q&A

## Action Items
- [ ] [Action] - @Owner - Due [Date]
```

## Formulas

### Task Completion %
```
prop("Status") == "Done" ? 100 : 0
```

### Days Until Due
```
dateBetween(prop("Due Date"), now(), "days")
```

### Is Overdue
```
and(prop("Due Date") < now(), prop("Status") != "Done")
```

### Risk Score
```
if(and(prop("Impact") == "High", prop("Likelihood") == "High"), "Critical",
  if(or(and(prop("Impact") == "High", prop("Likelihood") == "Medium"),
        and(prop("Impact") == "Medium", prop("Likelihood") == "High")), "High",
    if(or(and(prop("Impact") == "High", prop("Likelihood") == "Low"),
          and(prop("Impact") == "Medium", prop("Likelihood") == "Medium"),
          and(prop("Impact") == "Low", prop("Likelihood") == "High")), "Medium",
      "Low")))
```

## Automations (if using Notion API)

### 1. Task Assigned Notification
- **Trigger:** When Assignee is set
- **Action:** Send Slack message to assignee

### 2. Overdue Task Alert
- **Trigger:** Daily at 9am
- **Condition:** Task is overdue
- **Action:** Send notification to task owner

### 3. Phase Completion
- **Trigger:** When all tasks in phase marked Done
- **Action:** Update phase status to Complete, notify team

### 4. High Priority Task Created
- **Trigger:** When Priority is set to P0
- **Action:** Send Slack notification to #cms-project channel

## Color Coding

### Task Status Colors
- **Not Started:** Gray
- **In Progress:** Blue
- **Blocked:** Red
- **Done:** Green

### Priority Colors
- **P0 (Critical):** Red
- **P1 (High):** Orange
- **P2 (Medium):** Yellow
- **P3 (Low):** Gray

### Phase Colors
- **Phase 1:** Purple
- **Phase 2:** Blue
- **Phase 3:** Green
- **Phase 4:** Orange
- **Phase 5:** Pink
- **Phase 6:** Brown

## Tips for Maintaining the Workspace

1. **Update tasks daily** - Mark progress, update status
2. **Review weekly** - Check overdue tasks, adjust dates
3. **Document decisions** - Add context for why decisions made
4. **Track risks actively** - Update mitigations, close resolved risks
5. **Link liberally** - Use relations to connect tasks, phases, decisions
6. **Use templates** - Consistent meeting notes structure
7. **Archive completed** - Move done items to archive after 2 weeks
8. **Backup regularly** - Export workspace weekly

---

**Ready to import?** Follow the instructions in `README.md` to import all CSV files.
