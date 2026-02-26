# Add Component to rml-shared-components

You are adding a new component to the shared component library.

## When to Add to Shared Library

Add a component to `@roam-migration/components` when:
- Used in 2+ applications
- Represents core RML branding/patterns
- Generic enough for reuse (not app-specific)

**Examples of shared components:**
- Button, Card, Typography (UI primitives)
- AppShell, Navigation (layouts)
- IAPAuthProvider, SecureRoute (auth)

**Keep in app when:**
- Specific to one application's domain
- Unlikely to be reused
- Tightly coupled to app's business logic

## Process

### 1. Clone rml-shared-components
```bash
cd ~/projects
git clone git@github.com:Roam-Migration/rml-shared-components.git
cd rml-shared-components
```

### 2. Create Component File

**Location:** `src/[category]/ComponentName.tsx`

**Categories:**
- `src/ui/` - Visual primitives (Button, Input, Card)
- `src/auth/` - Authentication (IAPAuthProvider, SecureRoute)
- `src/layouts/` - Page structures (AppShell, Grid)
- `src/utils/` - Helper functions (apiClient, formatters)

**Example:** `src/ui/Input.tsx`
```tsx
import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * RML standard text input with label and error states
 *
 * @example
 * <Input label="Email" placeholder="Enter email" error="Email is required" />
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <input
        className={`block w-full rounded-md border ${error ? 'border-rml-danger' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rml-primary ${className}`}
        {...props}
      />

      {error && (
        <p className="text-sm text-rml-danger">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
```

### 3. Export from index.ts

**Update:** `src/index.ts`
```typescript
// Add to appropriate section
export { Input } from './ui/Input';
export type { InputProps } from './ui/Input';
```

### 4. Build and Test Locally
```bash
# Build library
npm run build

# Verify no TypeScript errors
npm run typecheck
```

### 5. Version Bump

**Update:** `package.json`
```json
{
  "version": "0.2.0"  // Bump from 0.1.0
}
```

**Versioning:**
- Patch (0.1.0 -> 0.1.1): Bug fixes
- Minor (0.1.0 -> 0.2.0): New components/features
- Major (0.1.0 -> 1.0.0): Breaking changes

### 6. Commit and Push
```bash
git add .
git commit -m "feat(ui): add Input component

- Add text input with label and error states
- Support all standard input attributes
- Include helper text for additional context
- Follow RML design tokens for styling"

git push origin main
```

### 7. Publish to GitHub Packages
```bash
npm run build
npm publish
```

**If first-time publish:**
1. Create GitHub Personal Access Token (PAT)
2. Add to `.npmrc`:
```
   //npm.pkg.github.com/:_authToken=YOUR_PAT
   @rml:registry=https://npm.pkg.github.com
```

### 8. Update Consuming Apps

**In each app that uses @roam-migration/components:**
```bash
cd ~/projects/[app-name]

# Update dependency
npm update @roam-migration/components

# Or specify version
npm install @roam-migration/components@0.2.0
```

**Use new component:**
```tsx
import { Input } from '@roam-migration/components';

<Input label="Email" error="Email is required" />
```

## Component Standards Checklist

Before adding to shared library:

- [ ] TypeScript strict mode (no `any`)
- [ ] Props interface exported
- [ ] JSDoc comment with @example
- [ ] Tailwind styling only (no CSS modules)
- [ ] Uses RML design tokens (bg-rml-*, text-rml-*)
- [ ] Accessible (ARIA labels, semantic HTML)
- [ ] Responsive design (works on mobile)
- [ ] No external dependencies (unless necessary)
- [ ] Exported from src/index.ts

## Updating Existing Components

**To update:**

1. Modify component file in `src/[category]/`
2. Bump version in package.json (patch for fixes, minor for features)
3. Commit with clear message
4. Publish new version
5. Update apps selectively (or wait for next dependency update)

**Breaking changes:**
- Bump major version
- Document migration in README
- Notify team before publishing
