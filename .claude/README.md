# .claude Directory

This directory contains project-level Claude Code configuration.

## File Types

### Team-Wide (Committed to Git)
- **`package-manager.json`** - Default package manager (bun, npm, pnpm, yarn)
- **`settings.example.json`** - Template for plugin configuration

### User-Specific (Gitignored)
- **`settings.json`** - Your personal plugin settings
- **`settings.local.json`** - Local overrides (merged with settings.json)
- **`*.local.json`** - Any local configuration files

## Setup

1. **Copy example settings:**
   ```bash
   cp .claude/settings.example.json .claude/settings.json
   ```

2. **Enable/disable plugins** in your `settings.json`:
   ```json
   {
     "enabledPlugins": {
       "Notion@claude-plugins-official": true,
       "context7@claude-plugins-official": false
     }
   }
   ```

3. **Add local overrides** (optional):
   Create `.claude/settings.local.json` for machine-specific settings that override `settings.json`.

## Recommended Plugins for This Project

Based on team usage, these plugins are recommended:
- **Notion** - For task/project management integration
- **frontend-design** - For UI/UX development
- **context7** - For live documentation lookup
- **github** - For GitHub operations
- **supabase** - For database operations

## Notes

- `settings.json` and `settings.local.json` are gitignored to prevent committing user-specific configurations
- `settings.example.json` serves as the team reference
- Changes to recommended plugins should be made in `settings.example.json`
