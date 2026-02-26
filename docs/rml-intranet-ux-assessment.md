# RML Intranet - UI/UX Assessment & Feature Recommendations

**Project:** RML Intranet (intranet.roammigrationlaw.com)
**Date:** February 14, 2026
**Prepared by:** Claude Code
**Purpose:** Comprehensive analysis of UI/UX improvements and feature enhancements

---

## Executive Summary

The RML Intranet is well-structured with modern tech stack (React Router v7, Vite, Tailwind v4) and strong foundations. This assessment identifies **19 priority improvements** across UI/UX design and functionality to transform it into a best-in-class company intranet.

**Key Findings:**
- ✅ Strong foundation: Role-based views, search, authentication
- ⚠️ Missing: Department pages, feedback system, real-time updates
- 🎯 Opportunity: Enhanced visual hierarchy, personalization, collaboration features

---

## Part 1: UI/UX Design Improvements

### 1.1 Visual Hierarchy & Modern Design

#### Current State
- Clean, functional design with purple (#522241) and coral (#d05c3d) brand colors
- Basic card layouts with minimal visual differentiation
- Traditional navigation structure

#### Recommendations

**A. Enhanced Card Design System**
```tsx
// Implement elevation system (currently flat)
const cardStyles = {
  level1: "shadow-sm hover:shadow-md transition-shadow",
  level2: "shadow-md hover:shadow-lg transition-shadow",
  level3: "shadow-lg hover:shadow-xl transition-shadow",
  interactive: "shadow-md hover:shadow-xl hover:scale-[1.02] transition-all"
}
```

**B. Glassmorphism for Hero Sections**
- Apply frosted glass effect to hero overlays
- Improve text readability over images
- Modern, premium aesthetic

**C. Micro-interactions**
- Button hover states with subtle scale transformations
- Loading skeletons instead of spinners
- Toast notifications for actions (currently missing)
- Smooth page transitions

**D. Dark Mode Support**
- Critical for accessibility and user preference
- Leverage Tailwind's dark mode utilities
- Persist preference in localStorage

**Implementation Priority:** 🔴 High
**Effort:** Medium (2-3 days)
**Impact:** High (modern, premium feel)

---

### 1.2 Typography & Readability

#### Current State
- EB Garamond for headers (elegant)
- System fonts for body text
- Limited type scale

#### Recommendations

**A. Enhanced Typography Scale**
```css
/* Add intermediate sizes for better hierarchy */
.text-2xl-5: 1.75rem  /* Between xl and 2xl */
.text-3xl-5: 2.25rem  /* Between 2xl and 3xl */
```

**B. Improved Line Height & Letter Spacing**
- Body text: `line-height: 1.7` (currently likely 1.5)
- Headers: `letter-spacing: -0.02em` for premium feel
- Maximum line length: 65-75 characters for optimal readability

**C. Rich Text Formatting**
- Add support for formatted content in cards
- Markdown rendering for updates and announcements
- Syntax highlighting for technical documentation

**Implementation Priority:** 🟡 Medium
**Effort:** Low (1 day)
**Impact:** Medium (improved readability)

---

### 1.3 Responsive Design Enhancements

**⚠️ NOTE: Mobile compatibility is NOT a priority for this intranet**
This is a desktop-focused application for office use. Mobile optimizations are documented for future reference but are **deferred indefinitely**.

#### Current State
- Basic mobile menu (hamburger) - not functional
- Grid layouts collapse on mobile
- Search works on mobile (when fixed)

#### Recommendations (DEFERRED - Desktop Focus)

**A. Mobile-First Dashboard**
- Swipeable cards on mobile (like Tinder UX)
- Bottom navigation bar for mobile (easier thumb access)
- Pull-to-refresh gesture for updates

**B. Tablet Optimization**
- Hybrid layouts for tablet (2-column instead of 3)
- Side drawer navigation option
- Better use of landscape orientation

**C. Progressive Disclosure**
- Collapsible sections on mobile
- "Show more" functionality for long lists
- Modal overlays instead of new pages on mobile

**Implementation Priority:** 🔵 Low/Deferred (Desktop-only focus)
**Effort:** Medium (2-3 days)
**Impact:** Low (intranet accessed from office computers)

---

### 1.4 Data Visualization Improvements

#### Current State
- Basic metric cards with trend indicators
- Limited visual representation of data
- Text-heavy dashboards

#### Recommendations

**A. Interactive Charts**
```tsx
// Add lightweight charting library
import { LineChart, BarChart, DonutChart } from 'recharts'

// Example: WIP Value trend over time
<LineChart data={wipTrend} height={200}>
  <Line dataKey="value" stroke="#d05c3d" />
</LineChart>
```

**B. Sparklines in Cards**
- Mini trend charts next to metrics
- Visual at-a-glance insights
- No labels needed (contextual)

**C. Progress Indicators**
- Circular progress for goals (e.g., collection rate target)
- Linear progress bars for tasks/projects
- Animated counters for metrics

**Implementation Priority:** 🟢 Low-Medium
**Effort:** Medium (2 days)
**Impact:** Medium (better data comprehension)

---

### 1.5 Accessibility (WCAG 2.1 AA)

#### Current State
- Basic color contrast (likely passes)
- Limited keyboard navigation
- No ARIA labels visible in code

#### Recommendations

**A. Keyboard Navigation**
```tsx
// Add skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Tab trapping in modals
// Focus management on page navigation
```

**B. Screen Reader Support**
- Add ARIA landmarks (`role="main"`, `role="navigation"`)
- Live regions for dynamic content (`aria-live="polite"`)
- Descriptive alt text for images

**C. Focus Indicators**
- Visible focus rings (currently may be default)
- Custom focus styles matching brand
- Skip navigation links

**D. Color Contrast Audit**
- Check purple (#522241) on white: ✅ Passes
- Check coral (#d05c3d) on white: ⚠️ May need darkening
- Ensure all text meets 4.5:1 ratio

**Implementation Priority:** 🔴 High (legal requirement)
**Effort:** Medium (2 days)
**Impact:** High (compliance + inclusivity)

---

### 1.6 Loading States & Performance

#### Current State
- Basic loading spinner for Notion data
- No skeleton screens
- Flash of unstyled content possible

#### Recommendations

**A. Skeleton Screens**
```tsx
// Instead of spinners, show placeholder content
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

**B. Optimistic UI Updates**
- Show action result immediately
- Revert if API call fails
- Better perceived performance

**C. Image Optimization**
- Lazy loading for images
- WebP format with fallbacks
- Responsive images (`srcset`)

**D. Code Splitting**
- Route-based code splitting (may already be done by Vite)
- Lazy load components below fold
- Reduce initial bundle size

**Implementation Priority:** 🟡 Medium
**Effort:** Low-Medium (1-2 days)
**Impact:** High (perceived performance)

---

## Part 2: Functional Feature Enhancements

### 2.1 Department-Specific Pages (PRIORITY)

#### Current State
- 4 general pages: Legal Hub, Operations, People, Business Intelligence
- Content is role-agnostic within pages
- No dedicated department hubs

#### Recommendations

**A. Create Department Hub Pages**

1. **Legal Department** (`/departments/legal`)
   - Team roster with photos and expertise
   - Current team KPIs and metrics
   - Active matters by visa type
   - SOP quick access
   - Team calendar and schedules
   - Recent wins and case studies

2. **Operations Department** (`/departments/operations`)
   - IT support dashboard
   - Facilities management
   - Training schedule and materials
   - System status dashboard
   - Equipment booking
   - Vendor directory

3. **People & Culture** (`/departments/people`)
   - Team directory with search
   - Org chart (interactive)
   - Leave calendar
   - Onboarding materials
   - Culture initiatives
   - Recognition board

4. **Finance Department** (`/departments/finance`)
   - Billing processes
   - Expense submission
   - Budget tracking by team
   - Financial policies
   - Payment status
   - Month-end checklists

5. **Business Intelligence** (`/departments/bi`)
   - Dashboard library
   - Data request form
   - Reporting schedule
   - Training materials
   - SQL query repository
   - Analytics best practices

**B. Department Page Template**
```tsx
interface DepartmentPageProps {
  name: string
  hero: {
    title: string
    description: string
    image: string
  }
  team: TeamMember[]
  quickLinks: QuickLink[]
  metrics: Metric[]
  resources: Resource[]
  calendar: CalendarEvent[]
}

export function DepartmentPage({ ... }: DepartmentPageProps) {
  return (
    <>
      <DepartmentHero />
      <TeamRoster />
      <DepartmentMetrics />
      <QuickActions />
      <Resources />
      <UpcomingEvents />
    </>
  )
}
```

**C. Cross-Department Navigation**
- Sidebar with all departments
- "Related Departments" widget
- Department switcher in header

**Implementation Priority:** 🔴 Critical
**Effort:** High (5-7 days for all departments)
**Impact:** Very High (core intranet functionality)

---

### 2.2 Feedback & Support System

#### Current State
- No visible feedback mechanism
- IT support link goes to external form
- No bug reporting system

#### Recommendations

**A. Integrated Feedback Widget**
```tsx
// Floating feedback button (bottom-right)
<FeedbackButton>
  <ChatBubbleIcon />
</FeedbackButton>

// Feedback modal with categories
interface Feedback {
  type: 'bug' | 'feature' | 'improvement' | 'question'
  page: string
  description: string
  screenshot?: File
  priority: 'low' | 'medium' | 'high'
}
```

**B. Feedback Types**
1. **Bug Report**
   - Automatic page context
   - Screenshot capture tool
   - Browser info collection
   - Notion task creation

2. **Feature Request**
   - Description + use case
   - Vote on existing requests
   - Status tracking (submitted → planned → in progress → done)

3. **Content Improvement**
   - "Edit this page" button
   - Suggest content updates
   - Report broken links

4. **General Question**
   - FAQ search first
   - Submit to appropriate team
   - Track response time

**C. Feedback Dashboard** (`/feedback`)
- View all feedback (filtered by type)
- Vote on feature requests
- See what's in progress
- Release notes and updates

**D. Integration with Notion**
```typescript
// Auto-create Notion task from feedback
async function createFeedbackTask(feedback: Feedback) {
  await notion.createTask({
    database: FEEDBACK_DATABASE_ID,
    properties: {
      Title: feedback.description,
      Type: feedback.type,
      Page: feedback.page,
      Priority: feedback.priority,
      Status: 'Not started',
      Reporter: feedback.userId
    }
  })
}
```

**Implementation Priority:** 🔴 High
**Effort:** Medium (3-4 days)
**Impact:** High (continuous improvement culture)

---

### 2.3 Real-Time Notifications & Updates

#### Current State
- Static updates card
- Manual refresh for Notion data
- No real-time capabilities

#### Recommendations

**A. Notification System**
```tsx
// Toast notifications
<Toaster position="top-right" />

// Notification types
type Notification = {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  action?: { label: string, onClick: () => void }
  timestamp: Date
  read: boolean
}
```

**B. Notification Center**
- Bell icon in header with unread count
- Dropdown panel with recent notifications
- Mark as read/unread
- Clear all functionality
- Filter by type

**C. Real-Time Updates**
- WebSocket connection for live updates (optional)
- Or polling with exponential backoff
- Update indicators ("3 new updates")
- Auto-refresh with visual indication

**D. Email Digest Option**
- Daily/weekly email summaries
- Subscribe to specific categories
- Unsubscribe preferences

**Implementation Priority:** 🟡 Medium
**Effort:** High (5-6 days for full system)
**Impact:** Medium-High (better engagement)

---

### 2.4 Personalization & Customization

#### Current State
- Role-based views (good start)
- User name stored in localStorage
- Recently viewed widget

#### Recommendations

**A. Customizable Dashboard**
- Drag-and-drop widgets
- Show/hide cards
- Reorder sections
- Save layouts per role

**B. Bookmarks & Favorites**
- Star favorite resources
- Quick access bar
- Organize into folders
- Share bookmarks with team

**C. Personal Settings Page** (`/settings`)
```tsx
interface UserSettings {
  profile: {
    name: string
    role: string
    department: string
    avatar: string
  }
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: 'en' | 'zh' | 'es'  // If multilingual
    notifications: {
      email: boolean
      push: boolean
      categories: string[]
    }
    dashboard: {
      layout: WidgetLayout[]
      defaultView: string
    }
  }
  privacy: {
    showInDirectory: boolean
    allowMessages: boolean
  }
}
```

**D. Smart Recommendations**
- "Based on your role, you might need..."
- Frequently accessed by similar users
- Trending resources in your department

**Implementation Priority:** 🟡 Medium
**Effort:** High (6-8 days)
**Impact:** High (user satisfaction)

---

### 2.5 Collaboration Features

#### Current State
- Individual user experience
- No collaboration tools visible
- Links to external tools (Actionstep)

#### Recommendations

**A. Internal Messaging**
- Direct messages between team members
- Team channels by department/project
- @mentions and notifications
- File sharing in messages

**B. Team Directory** (`/directory`)
```tsx
interface DirectoryEntry {
  name: string
  role: string
  department: string
  email: string
  phone?: string
  avatar: string
  expertise: string[]
  location: string
  availability: 'available' | 'busy' | 'away' | 'offline'
  bio: string
  reportsTo?: string
}

// Features:
// - Search by name, role, department, expertise
// - Org chart view
// - "Who's in the office today?"
// - Birthday/anniversary notifications
// - Contact cards with quick actions (email, message, call)
```

**C. Shared Resources**
- Team document libraries
- Version control for documents
- Comments on resources
- Share links with expiry

**D. Polls & Surveys**
- Quick polls in updates
- Anonymous feedback surveys
- Event planning (lunch orders, etc.)
- Results visualization

**Implementation Priority:** 🟢 Low-Medium
**Effort:** Very High (10+ days)
**Impact:** Medium (depends on adoption)

---

### 2.6 Content Management System

#### Current State
- Hardcoded content in `content-config.ts`
- Notion integration for dynamic data
- No content versioning

#### Recommendations

**A. Admin Panel** (`/admin`)
- Edit page content
- Manage navigation
- Upload images
- Update quick links
- Publish/unpublish pages

**B. Content Versioning**
- Track changes over time
- Revert to previous versions
- See who changed what
- Audit trail

**C. Scheduled Publishing**
- Draft mode for pages
- Schedule announcements
- Auto-publish at specific times
- Preview before publishing

**D. Multi-Author Workflow**
- Draft → Review → Approved → Published
- Assign reviewers
- Comments and feedback
- Email notifications

**Implementation Priority:** 🟢 Low (later phase)
**Effort:** Very High (15+ days)
**Impact:** Medium (admin efficiency)

---

### 2.7 Search Enhancements

#### Current State
- Basic keyword search
- Category filters
- Searches pages and resources

#### Recommendations

**A. Advanced Search**
- Filters: Date range, author, department, type
- Sort: Relevance, date, popularity
- Search operators: AND, OR, NOT, exact phrase
- Save searches

**B. Search Result Improvements**
- Highlighted keywords in results
- Preview snippets with context
- Jump to section within page
- Related searches

**C. Search Analytics**
- Track popular searches
- Identify gaps in content
- Search with no results → content opportunities
- Auto-suggest based on trends

**D. Natural Language Search**
- "Show me legal resources" → filters to legal category
- "What's the fee for 482?" → direct to fee calculator
- Powered by simple NLP or LLM integration

**Implementation Priority:** 🟢 Low-Medium
**Effort:** Medium-High (4-5 days)
**Impact:** Medium (better discoverability)

---

### 2.8 Analytics & Insights

#### Current State
- No visible analytics
- No page view tracking
- No user behavior insights

#### Recommendations

**A. Usage Analytics**
- Page views by role
- Most popular resources
- Search trends
- Time of day usage patterns

**B. User Insights Dashboard** (`/admin/analytics`)
- Active users (daily/weekly/monthly)
- Top pages
- Average session duration
- Navigation paths
- Bounce rates

**C. Privacy-First Analytics**
- No PII tracking
- Aggregate data only
- Opt-out option
- GDPR compliant

**D. Actionable Insights**
- "70% of legal staff visit fee calculator weekly"
- "Operations page has low engagement"
- "Search for 'template' has no results"
- Automatic reports to admins

**Implementation Priority:** 🟢 Low
**Effort:** Medium (3-4 days)
**Impact:** Medium (data-driven improvements)

---

### 2.9 Mobile App (PWA)

#### Current State
- Responsive web design
- No app experience
- No offline capability

#### Recommendations

**A. Progressive Web App**
```json
// manifest.json
{
  "name": "Roam Intranet",
  "short_name": "Roaming Around",
  "icons": [...],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#522241",
  "background_color": "#ffffff"
}
```

**B. PWA Features**
- Install prompt on mobile
- Offline mode (cached pages)
- Push notifications
- App-like feel (no browser chrome)

**C. Service Worker**
- Cache static assets
- Background sync
- Offline fallback page
- Update notifications

**Implementation Priority:** 🟡 Medium
**Effort:** Medium (3-4 days)
**Impact:** High (mobile experience)

---

### 2.10 Onboarding & Help

#### Current State
- No visible onboarding
- No in-app help system
- Assumes user familiarity

#### Recommendations

**A. Interactive Onboarding**
```tsx
// First-time user experience
<ProductTour steps={[
  {
    target: '.search-button',
    content: 'Use Ctrl+K to search anything',
  },
  {
    target: '.role-switcher',
    content: 'Switch roles to see personalized content',
  },
  // ...
]} />
```

**B. Contextual Help**
- "?" icons next to complex features
- Tooltips on hover
- Video tutorials embedded
- Help articles by topic

**C. Help Center** (`/help`)
- FAQ by category
- Video tutorials
- Contact support
- Submit question
- AI chatbot (future)

**D. Keyboard Shortcuts**
- Shortcuts overlay (press `?`)
- Customizable shortcuts
- Power user features

**Implementation Priority:** 🟡 Medium
**Effort:** Medium (3-4 days)
**Impact:** High (adoption & satisfaction)

---

## Part 3: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Priority:** Critical foundational improvements

1. ✅ **Department Pages** (5-7 days)
   - Create 5 department hub pages
   - Implement shared template
   - Populate with initial content

2. ✅ **Feedback System** (3-4 days)
   - Floating feedback widget
   - Notion integration
   - Feedback dashboard

3. ✅ **Accessibility Audit** (2 days)
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader testing

**Deliverables:**
- 5 new department pages
- Feedback submission system
- WCAG compliant UI

---

### Phase 2: Enhancement (Weeks 3-4)
**Priority:** High-impact user experience

1. ✅ **Visual Design Upgrade** (2-3 days)
   - Enhanced card system
   - Micro-interactions
   - Loading states

2. ✅ **Notification System** (5-6 days)
   - Notification center
   - Toast notifications
   - Email digest opt-in

3. ✅ **PWA Implementation** (3-4 days)
   - Service worker
   - Install prompt
   - Offline mode

**Deliverables:**
- Modern, polished UI
- Real-time notifications
- Installable mobile app

---

### Phase 3: Personalization (Weeks 5-6)
**Priority:** Medium-high engagement features

1. ✅ **Customizable Dashboard** (4-5 days)
   - Drag-and-drop widgets
   - Save layouts
   - Bookmarks system

2. ✅ **Team Directory** (4-5 days)
   - Searchable directory
   - Org chart view
   - Contact cards

3. ✅ **Dark Mode** (1-2 days)
   - Theme toggle
   - Persist preference
   - Tailwind dark classes

**Deliverables:**
- Personalized user experience
- Enhanced team connectivity
- Theme options

---

### Phase 4: Advanced Features (Weeks 7-8)
**Priority:** Nice-to-have, long-term value

1. ✅ **Search Enhancements** (4-5 days)
   - Advanced filters
   - Natural language
   - Search analytics

2. ✅ **Data Visualizations** (2-3 days)
   - Charts and graphs
   - Sparklines
   - Interactive metrics

3. ✅ **Onboarding System** (3-4 days)
   - Product tour
   - Help center
   - Video tutorials

**Deliverables:**
- Power user features
- Better data insights
- Reduced support burden

---

### Phase 5: Collaboration (Weeks 9-10)
**Priority:** Future expansion

1. ✅ **Internal Messaging** (6-7 days)
   - DMs and channels
   - File sharing
   - Notifications

2. ✅ **Polls & Surveys** (2-3 days)
   - Quick polls
   - Anonymous surveys
   - Results viz

3. ✅ **Analytics Dashboard** (3-4 days)
   - Usage tracking
   - Admin insights
   - Reports

**Deliverables:**
- Collaboration tools
- Community features
- Usage insights

---

## Part 4: Quick Wins (Can Implement Now)

These can be done in 1-2 hours each:

### 1. Add Favicon & App Icons
```html
<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### 2. Meta Tags for Social Sharing
```html
<meta property="og:title" content="Roam Intranet" />
<meta property="og:description" content="Your daily hub for everything Roam" />
<meta property="og:image" content="/og-image.png" />
```

### 3. Loading Skeleton for Cards
Replace spinners with skeleton screens (better UX)

### 4. Error Boundary
Catch React errors and show friendly message

### 5. 404 Page
Custom not-found page with navigation

### 6. Print Styles
Optimize pages for printing (hide nav, adjust layout)

### 7. "Back to Top" Button
Floating button on long pages

### 8. Keyboard Shortcut Indicator
Visual hint for Ctrl+K search

### 9. Session Timeout Warning
Warn before IAP session expires

### 10. Release Notes Page
Document updates and changes (`/changelog`)

---

## Part 5: Technical Recommendations

### 5.1 Component Library Migration

**Current State:**
- Mix of custom components and shadcn/ui
- rml-shared-components available but not integrated

**Recommendation:**
- Migrate to rml-shared-components (v0.2.0)
- Benefits: Consistency across RML apps, easier maintenance
- Timeline: 2-3 days

### 5.2 State Management

**Current State:**
- Context API for role and recently viewed
- localStorage for persistence
- No global state management

**Recommendation:**
- Add Zustand for complex state (lightweight, simple)
- Use for: notifications, bookmarks, user preferences
- Avoid Redux (overkill for this app)

### 5.3 Testing

**Current State:**
- No visible test suite
- Manual testing only

**Recommendation:**
- Add Vitest + React Testing Library
- E2E tests with Playwright
- Test coverage: 60%+ for critical paths

### 5.4 Performance Monitoring

**Recommendation:**
- Add lightweight monitoring (e.g., Web Vitals)
- Track: LCP, FID, CLS
- Alert on performance degradation

### 5.5 CI/CD

**Current State:**
- Manual deployment via `deploy.sh`
- Cloud Build configured but not automated

**Recommendation:**
- GitHub Actions on push to main
- Automated testing in CI
- Preview deployments for PRs

---

## Part 6: Design System Documentation

### Colors
```typescript
const colors = {
  primary: {
    plum: '#522241',      // Headers, buttons
    coral: '#d05c3d',     // Accents, links
    cream: '#f6dfb6',     // Backgrounds
  },
  neutral: {
    50: '#f9f9f9',
    100: '#f0f0f0',
    200: '#e0e0e0',
    600: '#666666',
    900: '#1a1a1a',
  },
  semantic: {
    info: '#3b82f6',      // Blue
    warning: '#f59e0b',   // Orange
    success: '#10b981',   // Green
    error: '#ef4444',     // Red
  }
}
```

### Typography
```typescript
const typography = {
  fontFamily: {
    display: 'EB Garamond, serif',
    sans: 'system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  }
}
```

### Spacing
```typescript
const spacing = {
  xs: '0.5rem',   // 8px
  sm: '1rem',     // 16px
  md: '1.5rem',   // 24px
  lg: '2rem',     // 32px
  xl: '3rem',     // 48px
  '2xl': '4rem',  // 64px
}
```

---

## Part 7: Content Strategy

### 7.1 Information Architecture

**Proposed Site Map:**
```
Home
├── Dashboard (personalized)
├── Quick Actions (role-based)
└── Daily Pulse (priorities, updates)

Departments
├── Legal
├── Operations
├── People & Culture
├── Finance
└── Business Intelligence

Resources
├── Policies & Procedures
├── Templates & Forms
├── Training Materials
└── External Links

Tools
├── Fee Calculator
├── Visa Processing Times
├── Document Search
└── Time Entry

Directory
├── Team Directory
├── Org Chart
├── Expertise Finder
└── Who's in Office

Help & Support
├── FAQ
├── Submit Feedback
├── IT Support
├── Contact HR

Settings
├── Profile
├── Preferences
├── Notifications
└── Privacy
```

### 7.2 Content Governance

**Roles:**
- **Content Owners:** Department heads (own department pages)
- **Content Editors:** Designated team members (update content)
- **Content Approvers:** Senior leadership (approve major changes)
- **System Admins:** IT team (manage structure, users, integrations)

**Process:**
1. Editor creates/updates content
2. Owner reviews and provides feedback
3. Approver signs off (if needed)
4. Admin publishes
5. Quarterly content audits

---

## Conclusion

This assessment identifies **19 major improvement areas** across UI/UX design and functionality. The recommended implementation roadmap spans **10 weeks** and will transform the RML Intranet into a modern, user-centric platform.

**Immediate Next Steps:**
1. **Week 1:** Create 5 department hub pages (highest priority)
2. **Week 1-2:** Implement feedback system (critical for continuous improvement)
3. **Week 2:** Accessibility audit and fixes (compliance)

**Success Metrics:**
- User engagement: 50%+ increase in daily active users
- Satisfaction: 4.5+ /5 rating in feedback system
- Efficiency: 30% reduction in time to find information
- Adoption: 90%+ of staff using at least weekly

---

**Prepared by:** Claude Code
**Date:** February 14, 2026
**Status:** Ready for Review & Prioritization
