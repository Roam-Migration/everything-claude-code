# Pattern: Non-Blocking Data Loading

**Category:** Performance, UX
**Use Case:** Loading data from APIs without blocking initial render
**Source:** RML Intranet UX Improvements (Feb 2026)

---

## Problem

Traditional data loading patterns block the initial render:

```typescript
// ❌ BLOCKING PATTERN
const [data, setData] = useState(null)
const [isLoading, setIsLoading] = useState(true) // ← Blocks render

useEffect(() => {
  loadData() // Must complete before showing content
}, [])

return isLoading ? <Spinner /> : <Content data={data} />
```

**Issues:**
- User sees spinner for 500ms-2s
- Page feels slow even if total time is same
- No content shown until API responds
- Poor perceived performance

---

## Solution: Start with Fallback Data

```typescript
// ✅ NON-BLOCKING PATTERN
const [data, setData] = useState(fallbackData) // ← Start with data
const [isLoading, setIsLoading] = useState(false) // ← Not blocking

useEffect(() => {
  // Load in background, update when ready
  loadData()
}, [])

return <Content data={data} /> // Always shows content
```

**Benefits:**
- User sees content instantly
- Page feels fast (even if API is slow)
- Graceful degradation if API fails
- Better perceived performance

---

## Implementation

### 1. Basic Pattern

```typescript
import React from 'react'
import { fallbackData } from './config'
import { fetchData } from './api'

export function MyPage() {
  // Start with fallback data
  const [data, setData] = React.useState(fallbackData)
  const [isLoading, setIsLoading] = React.useState(false)
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null)

  // Load data in background
  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const freshData = await fetchData()
      setData(freshData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load data:', error)
      // Fallback data is already showing
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Content data={data} />
      {lastUpdate && (
        <div className="text-xs text-gray-500">
          Updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
```

### 2. With Loading Indicator

Show subtle loading indicator without blocking content:

```typescript
return (
  <div>
    {isLoading && <LoadingBar />} {/* Subtle top bar */}
    <Content data={data} />
  </div>
)
```

### 3. With Skeleton on First Load

Only show skeleton if there's truly no data:

```typescript
// Show skeleton ONLY on very first load
{isLoading && data.length === 0 ? (
  <Skeleton />
) : (
  <Content data={data} />
)}
```

### 4. With Toast Notifications

Combine with toast for errors:

```typescript
import { toast } from 'sonner'

const loadData = async () => {
  setIsLoading(true)
  try {
    const freshData = await fetchData()
    setData(freshData)
  } catch (error) {
    toast.error('Failed to load data', {
      description: 'Using cached data. Please try again later.'
    })
  } finally {
    setIsLoading(false)
  }
}
```

---

## Real-World Example: RML Intranet

**Before (Blocking):**
```typescript
const [priorities, setPriorities] = useState([])
const [isLoading, setIsLoading] = useState(true) // ← Blocked render

useEffect(() => {
  loadNotionData() // 1.43s to show content
}, [])
```

**After (Non-Blocking):**
```typescript
const [priorities, setPriorities] = useState(homePageConfig.priorities) // ← Instant
const [isLoading, setIsLoading] = useState(false)

useEffect(() => {
  loadNotionData() // Happens in background
}, [])
```

**Impact:** Home page load time from 1.43s to instant (content visible immediately)

---

## When to Use This Pattern

### ✅ Good Use Cases

1. **Dashboard/Home Pages** - Users want quick access
2. **List Views** - Show cached/fallback data while refreshing
3. **Metrics/Stats** - Approximate numbers better than spinner
4. **Content Pages** - Static content while dynamic parts load
5. **Background Sync** - Update data without user noticing

### ❌ Not Suitable For

1. **Critical Actions** - Payment forms, destructive operations
2. **User-Specific Data** - Must ensure correct user data shown
3. **Empty States** - If fallback data would be misleading
4. **Security-Sensitive** - Can't show placeholder for sensitive data
5. **Single-Use Data** - No benefit if data won't be reused

---

## Considerations

### Cache Strategy

Pair with caching for best results:

```typescript
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedData() {
  const cached = localStorage.getItem('data')
  if (!cached) return null

  const { data, timestamp } = JSON.parse(cached)
  const age = Date.now() - timestamp

  if (age > CACHE_DURATION) {
    return null
  }

  return data
}

// Use cached data as fallback
const [data, setData] = useState(getCachedData() || fallbackData)
```

### Stale Data Indicator

Show users when data is stale:

```typescript
const isStale = lastUpdate && (Date.now() - lastUpdate.getTime()) > STALE_THRESHOLD

return (
  <div>
    <Content data={data} />
    {isStale && (
      <Badge variant="warning">Data may be outdated</Badge>
    )}
  </div>
)
```

### Optimistic Updates

For mutations, update UI immediately:

```typescript
const handleDelete = async (id: string) => {
  // Optimistic: Remove from UI immediately
  setData(data.filter(item => item.id !== id))

  try {
    await api.delete(id)
    toast.success('Deleted')
  } catch (error) {
    // Rollback on error
    setData(originalData)
    toast.error('Failed to delete')
  }
}
```

---

## Testing

### Unit Tests

```typescript
describe('Non-blocking data loading', () => {
  it('shows fallback data immediately', () => {
    const { getByText } = render(<MyPage />)
    expect(getByText('Fallback Item')).toBeInTheDocument()
  })

  it('updates when API responds', async () => {
    mockApi.resolve({ items: ['Fresh Item'] })
    const { findByText } = render(<MyPage />)
    expect(await findByText('Fresh Item')).toBeInTheDocument()
  })

  it('keeps fallback data on error', async () => {
    mockApi.reject(new Error('Network error'))
    const { getByText } = render(<MyPage />)
    await waitFor(() => {
      expect(getByText('Fallback Item')).toBeInTheDocument()
    })
  })
})
```

### Performance Testing

```typescript
// Measure perceived load time
const start = performance.now()
render(<MyPage />)
const firstPaint = performance.now() - start

expect(firstPaint).toBeLessThan(100) // Should be instant
```

---

## Variations

### 1. Stale-While-Revalidate

```typescript
const [data, setData] = useState(cachedData)

useEffect(() => {
  // Show cached data immediately
  // Fetch fresh data in background
  fetchFreshData().then(setData)
}, [])
```

### 2. Progressive Enhancement

```typescript
const [basicData, setBasicData] = useState(fallbackData)
const [enrichedData, setEnrichedData] = useState(null)

useEffect(() => {
  // Load enriched data lazily
  loadEnrichedData().then(setEnrichedData)
}, [])

return <Content data={enrichedData || basicData} />
```

### 3. Polling with Non-Blocking

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadData() // Refresh in background every 30s
  }, 30000)

  return () => clearInterval(interval)
}, [])
```

---

## Related Patterns

- **Skeleton Loaders** - Show structure while loading (only on first load)
- **Optimistic UI** - Update UI before server confirms
- **Suspense for Data Fetching** - React 18+ declarative loading
- **SWR (Stale-While-Revalidate)** - Library implementing this pattern

---

## References

- [React docs: useEffect](https://react.dev/reference/react/useEffect)
- [SWR library](https://swr.vercel.app/) - Implements stale-while-revalidate
- [TanStack Query](https://tanstack.com/query) - Advanced data fetching with caching

---

**Pattern Validated:** ✅ RML Intranet (Feb 2026)
**Performance Impact:** 1.43s → instant (100% improvement in perceived load time)
**Maintainability:** High - Simple pattern, easy to understand
