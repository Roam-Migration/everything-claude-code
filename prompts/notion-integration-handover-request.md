# Task: Notion Integration Handover for Claude Code

**Purpose:** Provide Claude Code (CLI agent) with everything it needs to interact with Roam Migration Law's Notion workspace — either via MCP server or structured manual workflows.

---

## What I need from you

You have access to our Notion workspace. Claude Code (our CLI development agent) does not. We need a handover document so Claude Code can either integrate directly or produce correctly formatted task requests for Notion.

Please provide the following:

### 1. Workspace Structure

- What is the Notion workspace name and ID?
- List all databases Claude Code would interact with (e.g., Tasks, Projects, Sprints, Documentation)
- For each database, provide:
  - Database ID
  - Property schema (property names, types, select/multi-select options)
  - Any required fields when creating entries
  - Common views/filters used

### 2. Task Database Details

- What database do engineering tasks live in?
- What are the status options (e.g., Backlog, To Do, In Progress, Done)?
- What are the priority levels?
- How are tasks assigned (People property? Text field?)?
- Are there project/team/label tags? What are the valid options?
- What's the typical format for task titles and descriptions?
- Is there a sprint or milestone property?

### 3. Conventions & Templates

- How are tasks currently written (title format, description structure)?
- Are there task templates? Provide examples of well-written tasks.
- How do we link tasks to GitHub PRs or repos?
- Any naming conventions for projects, labels, or tags?

### 4. Integration Options

- Is there a Notion API integration/token already set up for automation?
- If yes, what's the integration name and what pages/databases does it have access to?
- If no, what permissions would be needed to create one?
- Are there any existing automations (Zapier, Make, etc.) that touch the task database?

### 5. Immediate Task to Add

Please add this task to the appropriate database now:

**Title:** Migrate Intranet (`Rmlintranetdesign`) to consume `@roam-migration/components`

**Description:**
Replace the Intranet's 20 local `src/app/components/ui/` shadcn component files with imports from the shared library `@roam-migration/components@0.2.0` (just published to GitHub Packages).

Steps:
- Install `@roam-migration/components@0.2.0` in Rmlintranetdesign
- Import `@roam-migration/components/theme` CSS and configure Tailwind preset
- Replace all local `src/app/components/ui/` imports with `@roam-migration/components` imports
- Delete the 20 redundant local component files
- Verify deployed UI at intranet.roammigrationlaw.com is unchanged

Context: PR #5 in rml-shared-components extracted these components. This is deduplication — no visual/functional change. Also a prerequisite for compass-wiki to share the same component set.

**Priority:** Low
**Project:** RML Shared Components / Intranet
**Labels/Tags:** refactor, shared-components, intranet

### 6. Output Format

Please return all of the above as a single structured document (Markdown) that I can save to our `everything-claude-code` repo at:
```
/home/jtaylor/everything-claude-code/docs/notion-integration.md
```

This document will be referenced by Claude Code in future sessions to produce correctly formatted Notion task content or to configure a Notion MCP server.
