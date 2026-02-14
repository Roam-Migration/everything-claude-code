# Pattern: Toast Notification Integration (Sonner)

**Category:** UX, User Feedback
**Use Case:** Non-intrusive notifications for user actions
**Library:** Sonner
**Source:** RML Intranet UX Improvements (Feb 2026)

---

## Why Toast Notifications?

Users need feedback for actions, but modals are disruptive. Toasts provide:
- ✅ Non-blocking confirmation
- ✅ Auto-dismiss after reading
- ✅ Stack multiple notifications
- ✅ Clear success/error states
- ✅ Progress indication for long operations

---

## Why Sonner?

**Compared to alternatives:**

| Feature | Sonner | react-hot-toast | react-toastify |
|---------|--------|-----------------|----------------|
| Size | ~30KB | ~12KB | ~50KB |
| Promise support | ✅ | ❌ | ❌ |
| Rich content | ✅ | ✅ | ✅ |
| Customization | ✅ | ⚠️ Limited | ✅ |
| Loading states | ✅ Native | Manual | Manual |
| DX | Excellent | Good | Good |
| Modern | ✅ | ✅ | Dated API |

**Decision:** Sonner chosen for promise support and loading states

---

## Installation

```bash
npm install sonner
```

---

## Setup

### 1. Add Toaster Component

```typescript
// App.tsx
import { Toaster } from 'sonner'

export default function App() {
  return (
    <>
      {/* Your app */}
      <YourRoutes />

      {/* Add Toaster at root level */}
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            background: '#fff',
            color: '#522241',
            border: '1px solid #e0e0e0',
          },
        }}
      />
    </>
  )
}
```

### 2. Brand Styling (Optional)

Add custom CSS for brand colors:

```css
/* index.css or globals.css */

/* Toast base styling */
[data-sonner-toast] {
  font-family: 'Inter', sans-serif;
}

/* Color-coded left borders */
[data-sonner-toast][data-type="success"] {
  border-left: 4px solid #10b981;
}

[data-sonner-toast][data-type="error"] {
  border-left: 4px solid #ef4444;
}

[data-sonner-toast][data-type="loading"] {
  border-left: 4px solid #522241; /* Brand color */
}

[data-sonner-toast][data-type="info"] {
  border-left: 4px solid #3b82f6;
}

/* Typography */
[data-sonner-toast] [data-title] {
  font-weight: 600;
  color: #522241; /* Brand color */
}

[data-sonner-toast] [data-description] {
  color: #666666;
  font-size: 0.875rem;
}
```

---

## Usage Patterns

### 1. Simple Success Toast

```typescript
import { toast } from 'sonner'

function handleSubmit() {
  // Do something
  toast.success('Changes saved!')
}
```

### 2. Toast with Description

```typescript
toast.success('Data refreshed', {
  description: `Updated at ${new Date().toLocaleTimeString()}`
})
```

### 3. Error Toast

```typescript
toast.error('Failed to save', {
  description: 'Please check your connection and try again.'
})
```

### 4. Loading States (Promise Pattern)

**Method 1: Manual State Management**
```typescript
const handleRefresh = async () => {
  const toastId = toast.loading('Refreshing data...')

  try {
    await refreshData()
    toast.success('Refreshed successfully', { id: toastId })
  } catch (error) {
    toast.error('Refresh failed', { id: toastId })
  }
}
```

**Method 2: Promise API (Recommended)**
```typescript
const handleRefresh = async () => {
  toast.promise(
    refreshData(),
    {
      loading: 'Refreshing data...',
      success: 'Refreshed successfully',
      error: 'Refresh failed',
    }
  )
}
```

### 5. Info Toast

```typescript
toast.info('New update available', {
  description: 'Click here to refresh the page',
  action: {
    label: 'Refresh',
    onClick: () => window.location.reload()
  }
})
```

### 6. Custom Duration

```typescript
// Auto-dismiss after 10 seconds
toast.success('Changes saved', {
  duration: 10000
})

// Never auto-dismiss
toast.error('Critical error', {
  duration: Infinity
})
```

---

## Real-World Examples

### Example 1: Data Refresh with Feedback

```typescript
import { toast } from 'sonner'
import { clearCache, fetchData } from './api'

const handleRefresh = async () => {
  const toastId = toast.loading('Refreshing data from Notion...')

  try {
    clearCache()
    await loadNotionData()

    toast.success('Data refreshed successfully', {
      id: toastId,
      description: `Updated at ${new Date().toLocaleTimeString()}`
    })
  } catch (error) {
    toast.error('Failed to refresh data', {
      id: toastId,
      description: 'Please check your connection and try again.'
    })
  }
}

return (
  <button onClick={handleRefresh} disabled={isLoading}>
    <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
    Refresh
  </button>
)
```

### Example 2: Form Submission

```typescript
const handleSubmit = async (data: FormData) => {
  toast.promise(
    submitForm(data),
    {
      loading: 'Submitting...',
      success: (response) => `Ticket #${response.id} created`,
      error: (err) => err.message || 'Submission failed'
    }
  )
}
```

### Example 3: Background Sync

```typescript
React.useEffect(() => {
  const syncData = async () => {
    try {
      const result = await backgroundSync()
      if (result.changed) {
        toast.info('New data available', {
          description: `${result.count} items updated`
        })
      }
    } catch (error) {
      // Silent fail for background sync
      console.error('Background sync failed:', error)
    }
  }

  const interval = setInterval(syncData, 60000) // Every minute
  return () => clearInterval(interval)
}, [])
```

---

## Common Patterns

### Pattern 1: Loading → Success/Error

```typescript
const processData = async () => {
  const id = toast.loading('Processing...')

  try {
    await process()
    toast.success('Complete!', { id })
  } catch (error) {
    toast.error('Failed', { id, description: error.message })
  }
}
```

### Pattern 2: Multi-Step Process

```typescript
const importData = async () => {
  let toastId = toast.loading('Step 1: Validating...')

  try {
    await validate()
    toast.loading('Step 2: Importing...', { id: toastId })

    await import()
    toast.loading('Step 3: Syncing...', { id: toastId })

    await sync()
    toast.success('Import complete!', { id: toastId })
  } catch (error) {
    toast.error('Import failed', {
      id: toastId,
      description: error.message
    })
  }
}
```

### Pattern 3: Silent Background Load with Error Toast

```typescript
React.useEffect(() => {
  const loadData = async () => {
    try {
      const data = await fetchData()
      setData(data)
      // No toast on success (silent)
    } catch (error) {
      // Only toast on error
      toast.error('Failed to load data', {
        description: 'Using cached data. Please try again later.'
      })
    }
  }

  loadData()
}, [])
```

---

## Best Practices

### ✅ Do

1. **Use loading toasts for operations > 1 second**
   ```typescript
   const id = toast.loading('Saving...')
   ```

2. **Provide actionable error messages**
   ```typescript
   toast.error('Upload failed', {
     description: 'File size exceeds 10MB. Please compress and try again.'
   })
   ```

3. **Include context in descriptions**
   ```typescript
   toast.success('Changes saved', {
     description: `Updated ${count} records at ${time}`
   })
   ```

4. **Use consistent positioning**
   - Recommendation: `bottom-right` (doesn't block content)

5. **Match toast type to outcome**
   - Success: Confirmation of completed action
   - Error: Something failed, user needs to know
   - Info: FYI, no action required
   - Loading: Operation in progress

### ❌ Don't

1. **Don't toast everything**
   - ❌ Toast for every navigation
   - ❌ Toast for expected slow operations (use progress bar)
   - ❌ Toast for actions with immediate visual feedback

2. **Don't use toasts for critical decisions**
   - Use modals/dialogs for confirmations
   - Toasts auto-dismiss; modals don't

3. **Don't make toasts too long**
   - Keep titles under 50 characters
   - Descriptions under 100 characters

4. **Don't stack too many toasts**
   - Sonner stacks automatically, but don't abuse
   - Consider consolidating related notifications

5. **Don't forget mobile**
   - Test toast positioning on small screens
   - Ensure readable font sizes

---

## Accessibility

### Keyboard Support

Sonner handles keyboard nav automatically:
- Tab to focus toast
- Enter to trigger action
- Escape to dismiss

### Screen Readers

Toasts are announced via `aria-live`:
```typescript
// Automatically handled by Sonner
<div role="status" aria-live="polite" aria-atomic="true">
  Toast content
</div>
```

### Reduced Motion

Respect user preferences:
```typescript
// Add to your CSS
@media (prefers-reduced-motion: reduce) {
  [data-sonner-toast] {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { toast } from 'sonner'
import { render, screen } from '@testing-library/react'

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  }
}))

it('shows success toast on save', async () => {
  const { getByRole } = render(<MyComponent />)
  const button = getByRole('button', { name: 'Save' })

  await userEvent.click(button)

  expect(toast.success).toHaveBeenCalledWith('Changes saved!')
})
```

### E2E Tests (Playwright)

```typescript
test('shows toast on refresh', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("Refresh")')

  // Wait for toast to appear
  const toast = page.locator('[data-sonner-toast]')
  await expect(toast).toContainText('Refreshed successfully')

  // Wait for auto-dismiss
  await expect(toast).toBeHidden({ timeout: 5000 })
})
```

---

## Troubleshooting

### Toast Not Appearing

1. **Check Toaster is mounted**
   ```typescript
   // Must be in App.tsx or root component
   <Toaster />
   ```

2. **Check import**
   ```typescript
   import { toast } from 'sonner' // ✅
   import toast from 'sonner' // ❌ Wrong
   ```

3. **Check z-index**
   ```css
   [data-sonner-toaster] {
     z-index: 9999 !important;
   }
   ```

### Toast Behind Elements

```css
/* Ensure toasts are above everything */
[data-sonner-toaster] {
  z-index: 9999;
}

/* Or adjust specific element z-index */
.my-modal {
  z-index: 999; /* Lower than toasts */
}
```

### Styling Not Applied

1. **Import Sonner styles**
   ```typescript
   // Should be automatic, but if not:
   import 'sonner/dist/styles.css'
   ```

2. **Check CSS specificity**
   ```css
   /* May need !important for overrides */
   [data-sonner-toast] {
     background: white !important;
   }
   ```

---

## Performance

### Bundle Size Impact

- Sonner: ~30KB (~10KB gzipped)
- Added to RML Intranet: JS increased from 357KB to 393KB (+36KB)
- Trade-off: Worth it for comprehensive UX feedback

### Optimization

1. **Lazy load if needed**
   ```typescript
   const showToast = async () => {
     const { toast } = await import('sonner')
     toast.success('Loaded!')
   }
   ```

2. **Debounce rapid toasts**
   ```typescript
   const debouncedToast = debounce(() => {
     toast.info('Multiple updates')
   }, 1000)
   ```

---

## Migration from Other Libraries

### From react-hot-toast

```typescript
// Before (react-hot-toast)
import toast from 'react-hot-toast'
toast.success('Success!')

// After (Sonner)
import { toast } from 'sonner' // Note: named import
toast.success('Success!')
```

### From react-toastify

```typescript
// Before (react-toastify)
import { toast } from 'react-toastify'
toast.success('Success!')

// After (Sonner) - mostly the same!
import { toast } from 'sonner'
toast.success('Success!')
```

---

## Related Patterns

- **Non-Blocking Data Loading** - Use toasts for background load errors
- **Optimistic UI** - Toast to confirm optimistic updates
- **Form Validation** - Toast for form submission feedback
- **Error Boundaries** - Toast for caught errors

---

## References

- [Sonner Docs](https://sonner.emilkowal.ski/)
- [Sonner GitHub](https://github.com/emilkowalski/sonner)
- [Toast UX Best Practices](https://www.nngroup.com/articles/toast-notifications/)

---

**Pattern Validated:** ✅ RML Intranet (Feb 2026)
**User Feedback:** Positive - clear action confirmation
**Adoption Rate:** Used in 8+ components across app
**Bundle Impact:** +30KB acceptable for UX improvement
