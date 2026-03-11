# RML Intranet — Phases 3, 4, 5 + Platform Map sync
**Date:** 2026-03-11
**Repo:** /tmp/Rmlintranetdesign
**Commit:** 2d2023f

---

## Work done

### Task 5 — Platform Map: Admin Forms Management entry
- Created Notion entry in RML Platform Features DB (`collection://e38debd2...`)
- Properties: Name=Admin Forms Management, Section=Admin Hub, Status=Functional, Priority=Medium, Route=/admin/forms, Data Source=Supabase, Visible=true
- Notion page: https://www.notion.so/320e1901e36e81118fb5e793520d109b

### Phase 3 — Lazy loading + code splitting
- `App.tsx`: all 21 page-level imports converted to `React.lazy(() => import('./pages/X').then(m => ({ default: m.X })))`
- Single `<Suspense fallback={<PageLoader />}>` wraps all routes
- All 9 Section files updated with lazy + Suspense: AdminSection, BusinessIntelligenceSection, CoreOperationsSection, FinanceSection, LegalHubSection, OperationsSection, PeopleSection, SalesMarketingSection, TrainingCompetencySection
- Created `src/app/components/PageLoader.tsx` — shared spinner used as Suspense fallback
- Named exports require `.then(m => ({ default: m.X }))` bridge — React.lazy only understands default exports
- BusinessIntelligenceSection had partial lazy loading (OrgIntelligencePage only) — standardised to full pattern and removed inline OrgLoadingFallback

### Phase 4 — State management refactor
- All 4 MyWorkspace widgets converted from promise chains to `async/await + try/catch + finally`
  - MyTasksWidget, MyKPIsWidget (PerformanceEmbed), MyScheduleWidget, MyWIPWidget (LegalStaffEmbed)
- **Bug fixed**: MyScheduleWidget called `r.json()` without checking `r.ok` first — non-2xx responses were silently parsed and potentially produced undefined-shape data. Fixed with explicit `if (!res.ok) throw new Error(...)` before `.json()`
- `finally` block used for `setLoading(false)` — eliminates the duplicate call in both success and error branches
- 404 handling (MyKPIsWidget, MyWIPWidget) preserved correctly — checked before `!res.ok` throw
- Position descriptions service already had 30-min in-memory cache — no duplicate fetch issue

### Phase 5 — Shared component library
Created `src/app/components/shared/`:
- `StatPill.tsx` — unified pill supporting both usage patterns:
  - `value`/`variant` style (OrgIntelligencePage): color-coded background (default/warn/danger/functional/partial/stub/planned)
  - `count`/`dotClass` style (PlatformMapPage): dot indicator + bordered card style
  - Inline `StatPill` function removed from both pages; import replaced with shared version
- `StatusBadge.tsx` — generic badge with semantic variants (default/success/warning/danger/info/muted) and optional className override for one-off colors
- `ExternalLinkRow.tsx` — two variants:
  - `row` (default): full-width bordered card with label, sublabel, ExternalLink icon, hover effects
  - `inline`: compact text link with inline ExternalLink icon
- `LoadingOverlay.tsx` — embedded spinner, `absolute` (fills relative parent) or `inline` (py-10 block)
- `index.ts` barrel export for clean `import { StatPill, StatusBadge, ... } from '../components/shared'`
- ~150+ identified adoption sites for StatusBadge + ExternalLinkRow (not yet wired — future task)

---

## Patterns learned

### React.lazy with named exports
```typescript
// Named exports need the .then() bridge
const MyPage = lazy(() => import('./pages/MyPage').then(m => ({ default: m.MyPage })));
```

### async/await in useEffect (standard pattern)
```typescript
useEffect(() => {
  const load = async () => {
    try {
      const res = await fetch('/api/endpoint', { credentials: 'include' });
      if (res.status === 404) { setNotFound(true); return; }  // special case first
      if (!res.ok) throw new Error(res.statusText);           // general error second
      const data = await res.json();
      setState(data);
    } catch (err) {
      setError('...');
    } finally {
      setLoading(false);  // always runs — no duplication
    }
  };
  load();
}, [deps]);
```

### Unified component with dual prop styles
When two inline components solve the same problem with different prop shapes, support both in one component via optional props. Consumer call sites don't change; only the implementation is centralised.

---

## Remaining work
- Deploy Phase 3–5 to production (`gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet`)
- Adopt StatusBadge + ExternalLinkRow across 50+ existing pages
- Triage 4 Dependabot high vulnerabilities on Rmlintranetdesign
