# Initialize New RML Internal Application

You are helping set up a new internal tool for Roam Migration Law.

## Context

All RML internal apps:
- Deploy to Google Cloud Run with Identity-Aware Proxy (IAP)
- Use @roammigrationlaw.com Google Workspace for SSO
- Follow opinionated design system via `@roam-migration/components`
- Use Tailwind CSS for styling
- TypeScript strict mode required

## Your Tasks

### 1. Clone Deployment Template

Determine app type and copy appropriate template:

**For SPA (React, Vue, Vite):**
```bash
cp -r ~/projects/rml-deployment-templates/vite-react-spa/* .
```

**For Next.js SSR:**
```bash
cp -r ~/projects/rml-deployment-templates/nextjs-ssr/* .
```

### 2. Initialize Project

**For Vite + React (Tailwind v4):**
```bash
npm create vite@latest . -- --template react-ts
npm install -D tailwindcss @tailwindcss/vite
```

**For Vite + React (Tailwind v3):**
```bash
npm create vite@latest . -- --template react-ts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**For Next.js:**
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

### 3. Add RML Shared Components
```bash
npm install @roam-migration/components
```

Or if using GitHub Packages:
```bash
npm install @roam-migration/components --registry=https://npm.pkg.github.com
```

### 4. Configure Tailwind

**Tailwind v4 (Vite):** Create `src/styles/tailwind.css`:
```css
@import 'tailwindcss' source(none);
@source '../**/*.{js,ts,jsx,tsx}';
```

Then add the `@tailwindcss/vite` plugin to `vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Define theme tokens in `src/styles/theme.css` using CSS custom properties
(reference `@roam-migration/components` design tokens: `--rml-primary: #522241`, etc.).

**Tailwind v3 (Next.js or legacy Vite):** Update `tailwind.config.js`:
```javascript
module.exports = {
  presets: [require('@roam-migration/components/tailwind.preset')],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './node_modules/@roam-migration/components/**/*.{js,ts,jsx,tsx}'
  ]
};
```

### 5. Set Up Authentication

**src/App.tsx** (or **app/layout.tsx** for Next.js):
```tsx
import { IAPAuthProvider, AppShell, SecureRoute } from '@roam-migration/components';

export default function App() {
  return (
    <IAPAuthProvider>
      <AppShell appName="My RML App">
        <SecureRoute>
          {/* Your app content */}
        </SecureRoute>
      </AppShell>
    </IAPAuthProvider>
  );
}
```

### 6. Create Project Structure

**For Vite React:**
```
src/
├── components/       # App-specific components
├── pages/            # Route components
├── hooks/            # Custom hooks
├── utils/            # Helper functions
├── App.tsx           # Main app with IAPAuthProvider
└── main.tsx          # Entry point
```

**For Next.js:**
```
app/
├── layout.tsx        # Root layout with IAPAuthProvider
├── page.tsx          # Home page
├── components/       # App-specific components
└── api/              # API routes (if needed)
```

### 7. Create `.claude/config.json`
```json
{
  "project": {
    "name": "[Your App Name]",
    "type": "vite-react-spa",
    "gcp_project": "rmlintranet",
    "gcp_service_name": "[service-name]",
    "domain": "[subdomain].roammigrationlaw.com"
  },
  "shared_components": {
    "repo": "https://github.com/Roam-Migration/rml-shared-components.git",
    "import_alias": "@roam-migration/components"
  },
  "deployment": {
    "template_repo": "https://github.com/Roam-Migration/rml-deployment-templates.git",
    "template_type": "vite-react-spa",
    "region": "us-central1"
  },
  "standards": [
    "Use TypeScript strict mode",
    "Follow RML design system (Tailwind + @roam-migration/components)",
    "All routes require authentication via IAPAuthProvider",
    "Port 8080 for all containers",
    "No CSS modules, use Tailwind utilities"
  ],
  "claude_prompts": {
    "initialization": "../rml-claude-prompts/project-init.md",
    "deployment": "../rml-claude-prompts/deploy-to-gcp.md",
    "component": "../rml-claude-prompts/component-generation.md"
  }
}
```

### 8. Initial Git Commit
```bash
git init
git add .
git commit -m "chore(init): initialize [App Name]

- Set up [Vite/Next.js] with TypeScript
- Configure Tailwind with RML preset
- Add @roam-migration/components authentication
- Add deployment configuration for GCP Cloud Run"
```

## Deliverables

- [ ] App runs locally (`npm run dev`)
- [ ] Authentication wrapper configured (IAPAuthProvider)
- [ ] Tailwind configured with RML design tokens
- [ ] Dockerfile and nginx.conf ready (for SPA)
- [ ] README.md with setup instructions
- [ ] `.claude/config.json` created
- [ ] Initial git commit

## Next Steps

After initialization:
1. Develop app features
2. Test locally
3. Deploy to GCP: `./deploy.sh --service=[service-name]`
4. Configure IAP and custom domain
