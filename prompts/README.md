# Prompts Directory

This directory contains prompt templates and examples for common tasks.

## Structure

- **Team templates** (committed) - Reusable prompt patterns
- **User drafts** (gitignored via `*.draft.md`) - Work-in-progress prompts

## Current Templates

### Notion Integration
- **`notion-integration-handover-request.md`** - Template for requesting Notion workspace documentation
- **`notion-task-supabase-tiptap.md`** - Example task: Evaluating Supabase + Tiptap as Notion replacement

These show the structured format for creating Notion tasks via Claude Browser integration.

## Usage

### Creating Your Own Prompts

1. **For personal use:**
   ```bash
   cp prompts/notion-task-template.md prompts/my-task.draft.md
   # Edit my-task.draft.md
   # .draft.md files are gitignored
   ```

2. **For team sharing:**
   - Create without `.draft` suffix
   - Commit to repository
   - Add description to this README

## Best Practices

- Use descriptive filenames (e.g., `notion-task-[topic].md`)
- Include context and examples in templates
- Reference `docs/notion-integration.md` for property formats
- Keep credentials/API keys out of prompts

## Gitignore Pattern

Files matching these patterns are gitignored:
- `*.draft.md` - Personal prompt drafts
- `*.local.md` - Machine-specific prompts
- `*.tmp` - Temporary working files
