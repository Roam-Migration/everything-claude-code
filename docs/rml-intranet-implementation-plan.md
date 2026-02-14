# RML Intranet - Focused Implementation Plan

**Last Updated:** February 14, 2026
**Status:** Active Development

---

## 🎯 Active Priorities (In Order)

### Priority 1: Fix Search Functionality ⭐ CRITICAL
**Status:** Ready to implement
**Effort:** 2-3 hours
**Issue:** Ctrl+K keyboard shortcut not opening search modal

**Tasks:**
- [ ] Debug keyboard event listener in Header.tsx
- [ ] Verify SearchModal rendering and z-index
- [ ] Test modal state management
- [ ] Verify search results display
- [ ] Test ESC to close
- [ ] Test "/" shortcut as well

**Files to modify:**
- `/src/app/components/Header.tsx` (lines 19-33)
- `/src/app/components/SearchModal.tsx`

**Acceptance criteria:**
- ✅ Ctrl+K opens search modal
- ✅ "/" opens search modal
- ✅ ESC closes modal
- ✅ Search results appear correctly
- ✅ Clicking result navigates properly

---

### Priority 2: Visual Design Improvements
**Status:** Ready after Priority 1
**Effort:** 2-3 days

**Tasks:**
- [ ] Enhance card design system with elevation
- [ ] Add micro-interactions (hover states, transitions)
- [ ] Implement glassmorphism for hero sections
- [ ] Improve color consistency
- [ ] Polish shadows and spacing
- [ ] Enhance typography hierarchy

**Design system updates:**
```tsx
// Card elevation levels
const cardStyles = {
  level1: "shadow-sm hover:shadow-md transition-shadow duration-200",
  level2: "shadow-md hover:shadow-lg transition-shadow duration-200",
  level3: "shadow-lg hover:shadow-xl transition-shadow duration-200",
  interactive: "shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
}

// Button micro-interactions
const buttonStyles = {
  primary: "bg-[#522241] hover:bg-[#6b2d54] active:scale-95 transition-all duration-150",
  secondary: "bg-[#d05c3d] hover:bg-[#e06d4d] active:scale-95 transition-all duration-150"
}

// Glassmorphism for heroes
const heroOverlay = "backdrop-blur-sm bg-white/10 border border-white/20"
```

**Files to modify:**
- `/src/app/components/Card.tsx`
- `/src/app/components/Hero.tsx`
- `/src/app/pages/*.tsx` (all pages)
- Create `/src/app/styles/design-system.ts`

**Acceptance criteria:**
- ✅ Cards have subtle elevation and hover effects
- ✅ Buttons have smooth active states
- ✅ Hero sections have improved visual depth
- ✅ Consistent spacing throughout
- ✅ Professional, modern aesthetic

---

### Priority 5: Navigation Improvements
**Status:** Ready after Priority 2
**Effort:** 1 day

**Tasks:**
- [ ] Verify sticky header is working (audit shows static)
- [ ] Enhance active page indicators
- [ ] Add smooth scroll to top on navigation
- [ ] Improve hover states on nav items
- [ ] Ensure consistent nav height
- [ ] Add subtle animation to active indicator

**Current issue:**
- Header has `sticky top-0` in code but appears static in audit
- May be CSS conflict or z-index issue

**Files to modify:**
- `/src/app/components/Header.tsx`
- `/src/app/components/Breadcrumbs.tsx`

**Acceptance criteria:**
- ✅ Header stays at top when scrolling
- ✅ Active page clearly indicated
- ✅ Smooth transitions between pages
- ✅ Hover states feel responsive

---

### Priority 6: Reduce Animations
**Status:** Ready after Priority 5
**Effort:** 1-2 hours

**Current state:**
- **378 animations on Home page** (excessive!)
- 249 on Legal Hub
- 218 on People
- 186 on Operations
- 116 on Business Intelligence

**Target:** < 50 purposeful animations per page

**Tasks:**
- [ ] Audit all `animate-*` classes
- [ ] Remove auto-playing animations
- [ ] Keep only: hover states, loading indicators, transitions
- [ ] Remove decorative animations
- [ ] Test performance improvement

**Strategy:**
```tsx
// REMOVE (unnecessary):
- Continuous spin/pulse on static elements
- Auto-playing entrance animations
- Decorative bounces/fades

// KEEP (purposeful):
- Loading spinners
- Hover scale/shadow transitions
- State change feedback
- Loading skeleton pulse
```

**Files to audit:**
- `/src/app/pages/HomePage.tsx` (priority - 378 animations!)
- `/src/app/components/RoleBasedMetrics.tsx`
- `/src/app/components/RoleBasedQuickActions.tsx`
- All other page components

**Acceptance criteria:**
- ✅ < 50 animations per page
- ✅ No performance lag
- ✅ Animations only on user interaction
- ✅ Smooth, professional feel (not distracting)

---

### Priority 7: Optimize Load Times
**Status:** Ready after Priority 6
**Effort:** 2-3 hours

**Current performance:**
| Page | Load Time | Target |
|------|-----------|--------|
| Home | 1.43s ⚠️ | < 1.0s |
| Legal Hub | 0.31s ✅ | - |
| Operations | 0.29s ✅ | - |
| People | 0.31s ✅ | - |
| Business Intelligence | 0.35s ✅ | - |

**Issue:** Home page is 4.6x slower due to blocking Notion API calls

**Tasks:**
- [ ] Implement React 18 Suspense for Notion data
- [ ] Add loading skeleton while fetching
- [ ] Cache Notion responses client-side (5 min)
- [ ] Load non-critical data after page render
- [ ] Optimize image loading (if any)
- [ ] Code splitting for route components

**Implementation approach:**
```tsx
// Don't block render on data
// Current (blocking):
const [data, setData] = useState(null);
useEffect(() => {
  fetchData().then(setData); // Page waits for this!
}, []);

// Better (non-blocking):
// 1. Show skeleton immediately
// 2. Fetch data async
// 3. Update when ready

<Suspense fallback={<Skeleton />}>
  <NotionData />
</Suspense>
```

**Files to modify:**
- `/src/app/pages/HomePage.tsx` (lines 26-54)
- `/src/app/services/notion.ts`
- Add client-side caching

**Acceptance criteria:**
- ✅ Home page loads in < 1 second
- ✅ No blocking on Notion API
- ✅ Skeleton appears immediately
- ✅ Content streams in when ready
- ✅ Perceived performance improvement

---

### Priority 8: Loading States & Toast Notifications
**Status:** Ready after Priority 7
**Effort:** 2-3 hours

**Part A: Loading States**

**Tasks:**
- [ ] Install skeleton library or create custom
- [ ] Replace all spinners with skeletons
- [ ] Add loading states for all async actions
- [ ] Implement optimistic UI updates

**Skeleton components needed:**
```tsx
<SkeletonCard />        // For dashboard cards
<SkeletonMetric />      // For metric displays
<SkeletonList />        // For list items
<SkeletonText />        // For text content
```

**Part B: Toast Notifications**

**Tasks:**
- [ ] Install sonner or react-hot-toast
- [ ] Add Toaster component to App.tsx
- [ ] Implement toast calls for actions
- [ ] Style toasts to match brand

**Use cases:**
```tsx
// Success actions
toast.success('Data refreshed successfully')
toast.success('Settings saved')

// Errors
toast.error('Failed to load data')
toast.error('Something went wrong')

// Info
toast.info('Syncing with Notion...')

// Loading (with promise)
toast.promise(fetchData(), {
  loading: 'Loading...',
  success: 'Done!',
  error: 'Failed'
})
```

**Recommendation:** Use **sonner** (by shadcn)
- Beautiful by default
- Matches design system
- Lightweight
- Great DX

**Files to modify:**
- `/src/app/App.tsx` (add Toaster)
- `/src/app/pages/HomePage.tsx` (add toast calls)
- All pages with async actions
- Create `/src/app/components/Skeleton.tsx`

**Acceptance criteria:**
- ✅ No spinners (replaced with skeletons)
- ✅ Toast appears for all user actions
- ✅ Toasts auto-dismiss (3-5 seconds)
- ✅ Toasts match brand colors
- ✅ Loading states feel instant

---

## 🚫 Deferred Items

The following are **NOT in scope** for current sprint:

### Near-term Deferred:
- ❌ Placeholder links → Waiting on resource finalization
- ❌ Department pages → Delayed
- ❌ Feedback system → Delayed
- ❌ Team directory → Delayed
- ❌ Real-time in-app notifications → Using Google Chat webhooks instead

### Long-term Deferred:
- ❌ Mobile optimization
- ❌ Accessibility compliance
- ❌ PWA features
- ❌ Personalization
- ❌ Collaboration tools
- ❌ Advanced search
- ❌ Analytics dashboard
- ❌ Dark mode

---

## 🔔 Alternative: Google Chat Notifications

Instead of in-app real-time notifications, implement webhook integration:

**Benefits:**
- Notifications where staff already work (Google Chat)
- No need for in-app notification system
- Simpler implementation
- Better engagement

**Implementation (future):**
```typescript
// Webhook to Google Chat space
async function notifyGoogleChat(message: string) {
  await fetch(GOOGLE_CHAT_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: message,
      // or use card format for rich notifications
      cards: [...]
    })
  })
}

// Usage
await notifyGoogleChat('New update posted: Office closed Dec 24-26')
await notifyGoogleChat('New feedback submitted: Bug on home page')
```

**Triggers:**
- New critical updates
- Feedback submissions
- System status changes
- Important announcements

**Priority:** Deferred (implement after core features)

---

## 📋 Implementation Timeline

### Week 1 (Current)
- **Day 1:** Priority 1 - Fix search (2-3 hours)
- **Day 2-3:** Priority 2 - Visual design (2-3 days)
- **Day 4:** Priority 5 - Navigation (1 day)

### Week 2
- **Day 1:** Priority 6 - Reduce animations (1-2 hours)
- **Day 1-2:** Priority 7 - Optimize load times (2-3 hours)
- **Day 2-3:** Priority 8 - Loading states & toast (2-3 hours)
- **Day 3:** Testing and polish

**Total time:** ~6-8 days

---

## ✅ Success Criteria

### Technical Metrics:
- ✅ Search works perfectly (Ctrl+K + /)
- ✅ Home page loads in < 1 second
- ✅ < 50 animations per page
- ✅ All async actions have loading states
- ✅ Toast notifications for user feedback

### User Experience:
- ✅ Modern, polished visual design
- ✅ Smooth interactions and transitions
- ✅ Fast, responsive feel
- ✅ Clear feedback for all actions
- ✅ Professional aesthetic

### Performance:
- ✅ First Contentful Paint < 500ms
- ✅ Time to Interactive < 1.5s
- ✅ No performance lag or jank
- ✅ Smooth scrolling and animations

---

## 📦 Dependencies

**Libraries to install:**
```bash
# For toast notifications
npm install sonner

# For skeleton loading (optional - can build custom)
npm install react-loading-skeleton
# OR build custom skeletons with Tailwind
```

**No other dependencies needed** - everything else uses existing stack.

---

## 🎯 Next Steps

1. **Start with Priority 1** - Fix search functionality
2. **Get approval** on visual design direction before implementing
3. **Iterate through priorities** 1 → 2 → 5 → 6 → 7 → 8
4. **Test thoroughly** after each priority
5. **Deploy when complete** and stable

---

## 📞 Questions / Clarifications

**Visual Design (Priority 2):**
- Do you have any specific design references or examples you like?
- Any specific colors or styles to emphasize?
- Keep existing brand colors (#522241 plum, #d05c3d coral)?

**Navigation (Priority 5):**
- Any specific navigation improvements in mind?
- Current nav seems functional - what needs enhancement?

**Google Chat Webhooks:**
- Which Google Chat space should receive notifications?
- What types of events should trigger notifications?
- Who should have access to webhook URLs?

---

**Ready to start with Priority 1 (Search Fix)?**

Say the word and I'll begin debugging and fixing the search functionality right now!

---

**Maintained by:** Claude Code
**Last Updated:** February 14, 2026
**Status:** Ready to implement
