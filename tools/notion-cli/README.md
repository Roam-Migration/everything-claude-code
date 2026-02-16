# Notion CLI

CLI tool for automating Notion task creation and management.

## Installation

```bash
cd ~/.claude/tools/notion-cli
npm install
npm run build
npm link  # Make globally available as 'notion-cli'
```

## Quick Start

### 1. Initialize Configuration

```bash
notion-cli init --token YOUR_NOTION_TOKEN
```

The tool will automatically detect your Notion token from MCP config if available.

### 2. Create a Single Task

```bash
notion-cli create-task \
  --title "Fix bug in login" \
  --status "Not started" \
  --priority "High" \
  --effort 3 \
  --driver "Jackson" \
  --project "RML Intranet" \
  --tags "Website,Bug" \
  --summary "Login form validation not working"
```

### 3. Create Tasks in Bulk

```bash
notion-cli bulk-create tasks.json
```

See `templates/tasks.example.json` for format.

### 4. Query Tasks

```bash
# Get my open tasks
notion-cli query-tasks --driver "me" --status "Not started,In progress"

# Get tasks for a project
notion-cli query-tasks --project "RML Intranet" --limit 20

# Export as URLs only
notion-cli query-tasks --driver "Jackson" --format urls
```

## Configuration

Configuration is stored in `~/.claude/notion-cli.json`:

```json
{
  "auth": {
    "token": "secret_...",
    "workspace": "roammigrationlaw"
  },
  "databases": {
    "tasks": {
      "id": "502c024ad46441a4938ca25e852e4f91",
      "collection_id": "4b3348c5-136e-4339-8166-b3680e3b6396"
    }
  },
  "users": {
    "jackson": "cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87"
  },
  "defaults": {
    "driver": "jackson",
    "status": "Not started"
  }
}
```

## Task Properties

| Property | Type | Example | Required |
|----------|------|---------|----------|
| title | string | "Add dark mode" | ✅ Yes |
| status | string | "Not started", "In progress", "Done" | No (uses default) |
| priority | string | "🔴 Urgent", "High", "🟡 Normal", "⚪ Low" | No |
| effort | number | 1, 2, 3, 5, 8 (Fibonacci) | No |
| driver | string | "Jackson", "me", or user ID | No (uses default) |
| project | string | "RML Intranet" or page URL | No |
| tags | array | ["Website", "KPI"] | No |
| summary | string | "Brief description" | No |
| url | string | "https://github.com/..." | No |
| content | string | "# Details\n\nContent here..." | No |

## Bulk Create Format

```json
{
  "database": "tasks",
  "defaults": {
    "driver": "Jackson",
    "status": "Not started",
    "project": "RML Intranet"
  },
  "tasks": [
    {
      "title": "Task 1",
      "priority": "High",
      "effort": 3,
      "tags": ["Website"]
    },
    {
      "title": "Task 2",
      "effort": 5
    }
  ]
}
```

Defaults are applied to all tasks, but individual task properties override them.

## Integration with Claude Sessions

Use in session closure workflow:

```bash
# Generate tasks from session analysis
cat > /tmp/session-tasks.json << 'EOF'
{
  "database": "tasks",
  "defaults": {
    "driver": "Jackson",
    "status": "Not started",
    "project": "Current Project"
  },
  "tasks": [
    {"title": "Phase 2: Add filtering", "effort": 2},
    {"title": "Phase 3: Implement search", "effort": 2}
  ]
}
EOF

# Create tasks
notion-cli bulk-create /tmp/session-tasks.json --format urls > /tmp/task-urls.txt

# Tasks created and URLs saved for documentation
```

## Troubleshooting

### "Notion API token not configured"

Run `notion-cli init --token YOUR_TOKEN` or add token to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "plugin:Notion:notion": {
      "env": {
        "NOTION_API_KEY": "secret_..."
      }
    }
  }
}
```

### "Unknown user: Jackson"

Add user mapping to config:

```bash
# Edit ~/.claude/notion-cli.json
{
  "users": {
    "jackson": "cd2bebb6-f5c0-46aa-a3d3-86116bbdcc87"
  }
}
```

### "Invalid property value"

Check property names match Notion database schema. Common issues:
- Status values must match exactly: "Not started" not "not started"
- Priority values: "🔴 Urgent", "High", "🟡 Normal", "⚪ Low"
- Effort must be: 1, 2, 3, 5, or 8

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Test
npm run build && node dist/index.js --help
```

## License

MIT
