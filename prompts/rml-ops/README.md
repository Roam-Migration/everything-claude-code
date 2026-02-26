# RML Claude Code Prompts

Standardized prompts for Claude Code when working on RML internal applications.

## Purpose

Ensures consistent Claude Code behavior across all developers (Jackson, Sochan, etc.) by:
- Enforcing RML coding standards
- Following established deployment patterns
- Maintaining security best practices
- Using shared component library

## Usage

### In Claude Code Session

Reference prompts directly:
```
@claude, follow the instructions in ~/projects/rml-claude-prompts/project-init.md
```

### In .claude/config.json (Per-Project)

Link prompts in your app's `.claude/config.json`:
```json
{
  "claude_prompts": {
    "initialization": "../rml-claude-prompts/project-init.md",
    "deployment": "../rml-claude-prompts/deploy-to-gcp.md",
    "component": "../rml-claude-prompts/component-generation.md",
    "security": "../rml-claude-prompts/security-audit.md"
  }
}
```

Then trigger with:
```
@claude, initialize this project
@claude, deploy to GCP
@claude, generate a button component
@claude, run security audit
```

## Available Prompts

### `project-init.md`

**Use when:** Starting a new RML internal app

**What it does:**
- Copies deployment template (Vite SPA or Next.js)
- Initializes project with TypeScript + Tailwind
- Adds `@roam-migration/components` library
- Configures authentication (IAPAuthProvider)
- Creates `.claude/config.json`
- Makes initial git commit

**Example:**
```
@claude, initialize a new Vite React app for the quote calculator
```

---

### `deploy-to-gcp.md`

**Use when:** Deploying app to Google Cloud Run

**What it does:**
- Verifies prerequisites (Docker, port 8080, etc.)
- Runs `deploy.sh` script
- Monitors Cloud Build progress
- Provides post-deployment steps (IAP, domain mapping)
- Troubleshoots common deployment issues

**Example:**
```
@claude, deploy this app to GCP as rml-quote-calculator
```

---

### `component-generation.md`

**Use when:** Creating new React components

**What it does:**
- Generates TypeScript functional component
- Follows RML styling standards (Tailwind)
- Adds accessibility features
- Includes JSDoc documentation
- Suggests importing from `@roam-migration/components` when appropriate

**Example:**
```
@claude, create a data table component with sorting and filtering
```

---

### `troubleshoot-iap.md`

**Use when:** Debugging IAP authentication issues

**What it does:**
- Diagnoses common IAP problems (403 errors, redirect loops)
- Checks OAuth configuration
- Verifies access policies
- Provides step-by-step fixes
- Tests authentication flow

**Example:**
```
@claude, users are getting 403 errors even with @roammigrationlaw.com emails
```

---

### `add-shared-component.md`

**Use when:** Adding component to `@roam-migration/components` library

**What it does:**
- Guides through adding new component
- Ensures component meets shared library standards
- Handles versioning and publishing
- Updates consuming apps

**Example:**
```
@claude, add this Input component to rml-shared-components
```

---

### `security-audit.md`

**Use when:** Before deploying to production

**What it does:**
- Runs automated security checks (npm audit, etc.)
- Reviews authentication configuration
- Checks for hardcoded secrets
- Verifies IAP domain restriction
- Validates nginx security headers
- Tests external access denial

**Example:**
```
@claude, run a security audit before I deploy
```

## Best Practices

### 1. Always Reference Prompts Explicitly

**Good:**
```
@claude, follow project-init.md to set up this app
```

**Not as good:**
```
@claude, initialize this project
```

Why? Explicit reference ensures Claude loads the exact prompt file.

### 2. Combine Prompts for Complex Tasks
```
@claude, follow these steps:
1. Use project-init.md to initialize
2. Use component-generation.md to create a login form
3. Use deploy-to-gcp.md to deploy to staging
```

### 3. Update Prompts When Patterns Change

If you discover a better way to do something:
1. Update the relevant prompt file
2. Commit changes
3. Let team know via Notion/Slack

### 4. Keep Prompts Focused

Each prompt should do one thing well:
- project-init.md = initialization only
- deploy-to-gcp.md = deployment only
- Don't combine unrelated tasks

## Customization

### Per-App Overrides

If an app needs special handling, add to its `.claude/config.json`:
```json
{
  "standards": [
    "All standards from rml-claude-prompts",
    "EXCEPT: use Emotion instead of Tailwind"
  ]
}
```

### Team-Specific Prompts

Add your own prompts for team workflows:
```
rml-claude-prompts/
├── project-init.md
├── deploy-to-gcp.md
└── jackson-custom-workflow.md  # Team member specific
```

## Prompt Evolution

### Adding New Prompts

1. Create markdown file with clear:
   - Purpose (when to use)
   - Steps (what Claude should do)
   - Examples (show expected usage)
2. Add to this README
3. Commit and push
4. Update `.claude/config.json` templates if needed

### Versioning

Prompts don't have versions (they're living docs), but:
- **Breaking changes:** Announce to team first
- **New features:** Add, don't replace existing content
- **Deprecations:** Mark as "DEPRECATED" at top of file

## Related Repos

- [rml-shared-components](https://github.com/Roam-Migration/rml-shared-components) - Component library
- [rml-deployment-templates](https://github.com/Roam-Migration/rml-deployment-templates) - GCP templates

## Team

- **Jackson Taylor** - Created initial prompts
- **Sochan** - GCP expertise, contributed deployment prompts
- **Your Name** - (Add your contributions)
