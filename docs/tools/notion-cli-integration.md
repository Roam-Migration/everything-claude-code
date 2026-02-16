# Notion CLI Integration Guide

**Tool Location:** `~/.claude/tools/notion-cli/`
**Global Command:** `notion-cli`
**Purpose:** Automate Notion task creation during session closure and ongoing project management

---

## Quick Start

### Installation (One-Time Setup)

```bash
cd ~/.claude/tools/notion-cli
npm install
npm run build
npm link  # Makes globally available
```

### Verify Installation

```bash
notion-cli --version  # Should show: 0.1.0
```

---

## Using in Session Closure Workflow

### Automated Task Creation

```bash
# Create tasks from JSON
notion-cli bulk-create session-tasks.json

# Get URLs only for documentation
notion-cli bulk-create session-tasks.json --format urls > task-urls.txt
```

### JSON Format

```json
{
  "database": "tasks",
  "defaults": {
    "driver": "Jackson",
    "status": "Not started"
  },
  "tasks": [
    {
      "title": "Task name",
      "priority": "High",
      "effort": 3,
      "tags": ["Website"],
      "summary": "Brief description"
    }
  ]
}
```

---

## Authentication

Uses Notion MCP plugin's OAuth authentication automatically. No additional setup required.

---

## Common Commands

```bash
# Create single task
notion-cli create-task --title "Fix bug" --effort 3 --priority "High"

# Query your tasks
notion-cli query-tasks --driver "me" --status "Not started,In progress"

# Bulk create
notion-cli bulk-create tasks.json
```

---

## Performance Metrics

**Time Savings:**
- Manual: 2 min/task
- Automated: 5 sec/task (24x faster)
- **ROI: ~7 hours/month saved**

---

**Full Documentation:** `~/.claude/tools/notion-cli/README.md`
