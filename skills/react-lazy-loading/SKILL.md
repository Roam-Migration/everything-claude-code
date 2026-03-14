# React Lazy Loading Skill

## Purpose

Systematic workflow for implementing code-splitting via `React.lazy()` and `Suspense` in a Vite/React SPA. Covers the non-obvious named export bridge pattern, error boundaries, and the `absolute inset-0` fix for full-height components (ReactFlow, maps, charts) inside flex containers.

## When to Use

- Adding code-splitting to a React SPA to reduce initial bundle size
- Converting eager imports to lazy imports on a page-by-page basis
- A component using `h-full` isn't rendering at full height inside a flex container
- Adding ReactFlow, Leaflet, or other canvas/SVG components that need full viewport height

---

## Core Principle

`React.lazy()` requires a **default export**. Named exports need a bridge:

```typescript
// DEFAULT export — works directly:
const MyPage = lazy(() => import('./MyPage'))

// NAMED export — requires bridge:
const MyPage = lazy(() => import('./MyPage').then(m => ({ default: m.MyPage })))
```

Forgetting the bridge causes a runtime error: `Element type is invalid: expected a string... but got: undefined`.

---

## Workflow

### Phase 1: Audit Current Import Patterns

Before converting anything, identify which imports are candidates:

1. **Find all page-level imports** in the router file (e.g., `App.tsx`):
   ```bash
   grep -n "^import" src/App.tsx
   ```

2. **Classify each import:**
   - Large page components → lazy candidates
   - Small shared components (buttons, inputs) → keep eager
   - Third-party libraries (ReactFlow, charts) → lazy candidates (large bundles)

3. **Check export type** in each file:
   ```typescript
   // Default export:
   export default function MyPage() { ... }

   // Named export (needs bridge):
   export function MyPage() { ... }
   export const MyPage = () => { ... }
   ```

**Gate:** Complete audit before converting any imports.

---

### Phase 2: Add Suspense Wrapper

Lazy components must be wrapped in `<Suspense>`. Add this once at the router level:

```typescript
import { lazy, Suspense } from 'react'

// In your route/app component:
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    {/* ... */}
  </Routes>
</Suspense>
```

Create a `PageLoader` component for the fallback:

```typescript
// src/app/components/shared/PageLoader.tsx
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}
```

**One `<Suspense>` boundary wrapping all routes is usually sufficient.** Nested boundaries are only needed when you want different loading states for specific sections.

---

### Phase 3: Convert Default Exports

For pages that already use default exports:

```typescript
// Before:
import DashboardPage from './pages/DashboardPage'

// After:
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
```

No other changes needed. TypeScript types are preserved.

---

### Phase 4: Convert Named Exports (Bridge Pattern)

For pages that use named exports:

```typescript
// Before:
import { DashboardPage } from './pages/DashboardPage'

// After:
const DashboardPage = lazy(
  () => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
)
```

**For section files** that re-export from an index:

```typescript
// If the export chain is: index.ts → SectionFile.tsx → Component
const MyComponent = lazy(
  () => import('./sections/MySection').then(m => ({ default: m.MyComponent }))
)
```

**TypeScript note:** The bridge `.then()` return type is `{ default: ComponentType }` — TypeScript infers this correctly without explicit annotation.

---

### Phase 5: Add Error Boundary

Wrap lazy-loaded routes in an error boundary to handle chunk loading failures (e.g., stale deployments where old chunk URLs are 404):

```typescript
import { Component, ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class LazyErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-gray-600">Failed to load page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

Usage:
```typescript
<LazyErrorBoundary>
  <Suspense fallback={<PageLoader />}>
    <Routes>...</Routes>
  </Suspense>
</LazyErrorBoundary>
```

---

### Phase 6: Full-Height Components (ReactFlow, Charts, Maps)

**`h-full` fails inside `flex-1` chains** when the root flex container uses `min-h-screen` (not `height: 100vh`). CSS-definite height rules mean `height: 100%` resolves to `auto` = 0.

**Symptom:** Component renders with 0 height, or only shows a thin line.

**Fix: Use `absolute inset-0` instead of `h-full`:**

```typescript
// Parent container — must have position: relative
<div className="flex-1 relative overflow-hidden">

  {/* Full-height component — absolute fills the rendered container */}
  <div className="absolute inset-0">
    <ReactFlow nodes={nodes} edges={edges} />
  </div>

  {/* Overlays also use absolute inset-0 for consistency */}
  {loading && (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
      <PageLoader />
    </div>
  )}
</div>
```

**Why this works:** `absolute inset-0` fills based on the *rendered pixel dimensions* of the positioned ancestor, not on CSS-computed height values. The flex container renders at a real height; `absolute inset-0` then fills that.

**Why `h-full` fails:** `flex-1` creates a flex item with `flex-grow: 1`, but its CSS `height` is still `auto`. `h-full` on a child computes `height: 100%` of `auto`, which is `auto` = 0.

**Rule:** Any component that needs to fill its parent in a flex chain should use `absolute inset-0` on its immediate wrapper, with `position: relative` on the parent.

---

## Pre-Conversion Checklist

- [ ] All page imports audited and classified (default vs named)
- [ ] `<Suspense fallback={<PageLoader />}>` wraps all lazy routes
- [ ] `<LazyErrorBoundary>` wraps the Suspense boundary
- [ ] Named exports use `.then(m => ({ default: m.X }))` bridge
- [ ] Full-height components (ReactFlow, charts) use `absolute inset-0` pattern
- [ ] TypeScript compiles without errors after conversion
- [ ] Each lazy route loads correctly in dev (navigate to each page)
- [ ] Bundle size reduction confirmed in build output (`vite build --report` or Rollup stats)

---

## Error Reference

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined` | Named export without bridge | Add `.then(m => ({ default: m.ComponentName }))` |
| Component renders with 0 height | `h-full` in flex-1 chain | Switch to `absolute inset-0` pattern (Phase 6) |
| `Loading chunk X failed` | Chunk URL invalid after redeployment | Add error boundary with reload button (Phase 5) |
| Type error on `lazy()` call | Import path wrong or component not exported | Check file path and export name |
| Suspense fallback never shows | Suspense boundary outside the Router | Move `<Suspense>` inside the Router provider |
| Page flash on navigation | No Suspense fallback | Add `<Suspense fallback={<PageLoader />}>` |

---

## Bundle Size Validation

After converting imports to lazy:

```bash
cd /tmp/Rmlintranetdesign
npx vite build 2>&1 | grep -E "(chunks|kB|gzip)"
```

Expect to see:
- Smaller initial chunk (main entry point)
- Multiple smaller page chunks (one per lazy route)
- Third-party libraries in separate chunks if using `manualChunks`

---

## Anti-Patterns to Avoid

❌ **Using `React.lazy()` on small shared components** — adds chunk overhead without meaningful bundle savings; only lazy-load page-level components

❌ **Forgetting the `.then()` bridge on named exports** — causes a runtime undefined error that only appears when the route is first navigated to

❌ **`h-full` on a component inside `flex-1`** — resolves to 0 height when parent uses `min-h-screen`; use `absolute inset-0` instead

❌ **No error boundary** — chunk loading failures (stale deploys, network errors) show blank pages with no recovery path

❌ **Nested Suspense boundaries without purpose** — creates confusing loading state UX; one boundary at the router level is usually correct

❌ **Lazy-loading components imported by multiple routes** — each lazy import creates a separate chunk per call site; extract to a shared import if used in 3+ places
