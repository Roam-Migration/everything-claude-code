# RML Intranet - Scope & Priority Notes

**Last Updated:** February 14, 2026

---

## 🎯 Project Scope

### Primary Focus: Desktop Experience for Internal Staff

**Context:** The RML Intranet is designed for internal use by staff working in an office environment on desktop computers. The focus is on functional features and business value, not compliance or mobile accessibility.

---

## ⚠️ Deferred Features (NOT Priorities)

The following features are documented for completeness but are **NOT priorities** and should be deferred:

### 1. Mobile Responsiveness
- **Status:** Deferred indefinitely
- **Reason:** Desktop-only intranet for office use
- **Impact:** Low - staff access from office computers
- **Items affected:**
  - Mobile navigation menu
  - Mobile-first layouts
  - Touch gestures
  - Bottom navigation bars
  - Mobile optimization work

### 2. Accessibility Compliance (WCAG)
- **Status:** Deferred / Not a priority
- **Reason:** Internal tool for staff, not public-facing
- **Impact:** Low for current user base
- **Items affected:**
  - Skip navigation links
  - ARIA landmarks
  - Screen reader optimization
  - Keyboard-only navigation
  - WCAG 2.1 AA compliance testing
  - Alt text enforcement
  - Focus indicators (beyond browser defaults)

### 3. Progressive Web App (PWA)
- **Status:** Deferred indefinitely
- **Reason:** No mobile/offline requirement
- **Impact:** N/A for desktop users
- **Items affected:**
  - Service workers
  - Install prompts
  - Offline mode
  - Push notifications (mobile)
  - App manifest

### 4. Tablet Optimization
- **Status:** Deferred
- **Reason:** No tablet usage in current workflow
- **Impact:** Low
- **Items affected:**
  - Tablet-specific layouts
  - Side drawer navigation
  - Landscape orientation optimization

---

## ✅ Active Priorities

### High Priority (This Week)
1. **Search functionality** - Fix Ctrl+K bug ⭐ CRITICAL
2. **Placeholder links** - Replace with real URLs or "Coming soon"
3. **Performance optimization** - Home page load time
4. **Real functionality** - Connect external tools, build missing pages

### Medium Priority (This Month)
1. **Department pages** - One page per department ⭐ HIGH VALUE
2. **Feedback system** - Bug reports, feature requests
3. **Team directory** - Searchable staff directory
4. **Dark mode** - Theme toggle option (nice to have)

### Lower Priority (Future)
1. **Personalization** - Customizable dashboards
2. **Collaboration tools** - Internal messaging
3. **Advanced search** - Filters, natural language
4. **Analytics** - Usage tracking, insights

---

## 🖥️ Desktop-First Design Principles

Since this is a desktop-focused application for internal staff:

### Do Prioritize:
- ✅ Desktop screen sizes (1280px - 1920px+)
- ✅ Core functionality (department pages, feedback, directory)
- ✅ Visual polish (modern design, smooth interactions)
- ✅ Multi-column layouts
- ✅ Desktop browser compatibility (Chrome, Edge)
- ✅ Performance (fast page loads)
- ✅ Business value features

### Don't Prioritize:
- ❌ Mobile viewport (320px - 768px)
- ❌ Accessibility compliance (WCAG, ARIA, screen readers)
- ❌ Keyboard-only navigation
- ❌ Touch targets and gestures
- ❌ Mobile Safari compatibility
- ❌ Compliance testing
- ❌ Alt text enforcement

---

## 📐 Supported Screen Sizes

**Primary Target:** 1920x1080 (Full HD) - most common office monitor
**Secondary Target:** 1280x720, 1366x768, 2560x1440

**Minimum Supported:** 1024px width (small laptop)

**Not Supported:** < 1024px width (mobile/small tablet)

---

## 🌐 Browser Support

**Primary:**
- Chrome (latest 2 versions)
- Edge (latest 2 versions)

**Secondary:**
- Firefox (latest 2 versions)
- Safari (desktop, latest 2 versions)

**Not Tested:**
- Mobile browsers (Safari iOS, Chrome Android)
- Internet Explorer (end of life)
- Screen readers
- Keyboard-only usage

---

## 🔄 Scope Change Process

If accessibility or mobile becomes a requirement in the future:

### For Accessibility:
- **Trigger:** Legal requirement or organizational policy change
- **Effort:** 5-8 days (ARIA, skip links, screen reader testing, keyboard nav)
- **Priority:** Would need to be assessed against feature work

### For Mobile:
- **Trigger:** Remote work policy or field staff requirement
- **Effort:** 8-13 days (responsive layouts, mobile menu, touch optimization)
- **Priority:** Would need to be assessed against feature work

---

## 📝 Development Guidelines

### When Building New Features:

**DO:**
- Design for desktop screens first
- Focus on business value
- Optimize for mouse/trackpad interaction
- Test on Chrome and Edge (primary browsers)
- Use multi-column layouts
- Prioritize functionality over compliance

**DON'T:**
- Test on mobile devices (not required)
- Add ARIA labels unless needed for functionality
- Test with screen readers (not required)
- Enforce keyboard-only navigation
- Worry about viewport < 1024px
- Add skip links or accessibility features (deferred)

### CSS Media Queries:

```css
/* Use max-width sparingly, only for edge cases */
/* Focus on min-width for larger screens */

/* Small laptop (minimum supported) */
@media (min-width: 1024px) { ... }

/* Standard desktop */
@media (min-width: 1280px) { ... }

/* Large desktop */
@media (min-width: 1920px) { ... }

/* Mobile/Tablet - NOT a priority */
@media (max-width: 768px) {
  /* Only if graceful degradation is trivial */
}
```

---

## 🎓 Rationale

### Why Desktop-Only?

1. **Usage Context**
   - Staff work from office computers
   - No remote work requirement currently
   - All tools (Actionstep, Metabase) are desktop-centric

2. **Efficiency**
   - Faster development (no mobile testing)
   - Better use of screen real estate
   - Richer interactions (hover, multi-column)

3. **Resource Allocation**
   - Focus effort on high-value features
   - Department pages > mobile optimization
   - Feedback system > accessibility compliance

### Why Defer Accessibility?

1. **Internal Tool**
   - Not public-facing (no legal requirement)
   - Known user base (office staff)
   - No specific accessibility needs identified

2. **ROI**
   - Higher value in functional features
   - Department pages impact all users
   - Accessibility benefits uncertain at this stage

3. **Future-Ready**
   - Can add if needed (not removing existing basics)
   - Foundation exists (semantic HTML)
   - Just need to enhance, not rebuild

---

## 📊 Success Metrics (Desktop Only)

### Performance
- Page load < 1s on desktop
- First contentful paint < 500ms
- Time to interactive < 1.5s

### Functionality
- All placeholder links replaced
- All 5 department pages live
- Feedback system collecting input
- Search working correctly

### Browser Support
- 100% functionality in Chrome/Edge
- 95%+ functionality in Firefox/Safari (desktop)

### User Satisfaction
- 4.5+ /5 rating (desktop users)
- < 5% support tickets related to UI
- 90%+ staff using weekly

### Business Value
- Reduced time to find information (30%+)
- Increased engagement (50%+ more page views)
- Feedback loop established (bugs/features tracked)

---

## 🔮 Future Considerations

### If Accessibility Becomes Required:
- Add skip navigation links (30 min)
- Add ARIA landmarks (30 min)
- Screen reader testing (2-3 days)
- Keyboard navigation enhancement (2-3 days)
- WCAG audit and fixes (2-3 days)
- **Total:** ~5-8 days

### If Mobile Becomes Required:
- Fix mobile navigation (1-2 days)
- Responsive layout optimization (3-5 days)
- Touch interaction testing (2-3 days)
- Mobile browser testing (2-3 days)
- **Total:** ~8-13 days

---

## 📋 Current Focus Areas

**This Week:**
1. Fix search functionality (Ctrl+K)
2. Replace placeholder links with real URLs or "Coming soon"
3. Optimize home page load time

**This Month:**
1. Build 5 department pages (highest ROI)
2. Implement feedback system with Notion integration
3. Create team directory

**This Quarter:**
1. Personalization features
2. Dark mode
3. Advanced search
4. Collaboration tools

---

## Questions?

**Feature requires accessibility?** Note it, but it's not a blocker.

**User requesting mobile?** Document use case, defer to quarterly planning.

**Bug on mobile?** Note in backlog, mark as "mobile (deferred)".

**Accessibility compliance question?** Not currently required, defer.

---

**Maintained by:** Jackson Taylor
**Last Review:** February 14, 2026
**Next Review:** Quarterly planning meetings
