# RML Intranet CMS MVP Assessment & Roadmap

**Date:** February 18, 2026
**Purpose:** Transform RML Intranet into a marketable CMS product
**Status:** Strategic Planning Phase

---

## Executive Summary

The RML Intranet has evolved from a custom internal tool into a sophisticated platform that demonstrates strong CMS product potential. This document assesses the current architecture against CMS MVP requirements and provides a comprehensive roadmap to product launch.

**Key Findings:**
- ✅ **Solid Foundation:** Modern React/TypeScript stack with extensive UI component library
- ✅ **Cloud-Native:** Production-ready deployment on Google Cloud Run with IAP
- ✅ **Integration Layer:** Notion API + Google Workspace integration established
- ⚠️ **Critical Gaps:** No staging environment, no visual page builder, limited content management
- 🎯 **Time to MVP:** 8-12 weeks with focused development

---

## Current State Analysis

### Technology Stack (Production-Ready)

```
Frontend:
├── React 18.3 + TypeScript
├── React Router v7 (multi-page SPA)
├── Vite 6.4 (build system)
├── Tailwind CSS v4 (styling)
├── Radix UI + shadcn/ui (50+ components)
└── Motion, Recharts, React Hook Form

Backend:
├── Node.js/Express API (separate service)
├── Notion API integration (@notionhq/client v5.9)
├── Google Workspace Directory API
├── Supabase (database)
└── JWT authentication

Infrastructure:
├── Google Cloud Run (containerized)
├── Identity-Aware Proxy (IAP)
├── Nginx reverse proxy
├── Docker multi-stage builds
└── Cloud Build CI/CD (basic)
```

### Existing Features ✅

#### 1. **Authentication & Authorization**
- Google Workspace SSO via IAP
- Domain restriction (@roammigrationlaw.com)
- Role-based access control (admin, hr, legal-staff, operations, etc.)
- User context management

#### 2. **Content Integration**
- Notion database embedding (`<NotionTable>`)
- Server-side proxy (API key protection)
- Auto-refresh with 5-min cache
- Filtered views with Notion API syntax
- Rate limiting (10 req/s per IP)

#### 3. **Page Architecture**
- Multi-section layout (People, Legal Hub, Operations, etc.)
- Sidebar navigation with nested routes
- Hash anchor scrolling
- Breadcrumb navigation
- Recently viewed tracking

#### 4. **Forms System**
- Separate backend API (`rml-intranet-forms-api`)
- Notion-backed form submissions
- Basic form rendering

#### 5. **Admin Features**
- User management interface
- Role switching (testing)
- Cache management API
- Staff directory

#### 6. **UI Component Library**
- 50+ Radix UI components (buttons, dialogs, dropdowns, etc.)
- Accordion, Alert, Avatar, Badge, Breadcrumb
- Calendar, Card, Carousel, Chart, Checkbox
- Collapsible, Command, Context Menu, Dialog
- Drawer, Dropdown Menu, Form, Hover Card
- Input, Label, Menubar, Navigation Menu
- Pagination, Popover, Progress, Radio Group
- Resizable, Scroll Area, Select, Separator
- Sheet, Sidebar, Skeleton, Slider, Switch
- Table, Tabs, Textarea, Toast, Toggle, Tooltip
- **React DnD** (drag-and-drop library already installed!)

---

## CMS MVP Requirements Analysis

### Core CMS Features (Industry Standard)

| Feature | Status | Priority | Complexity |
|---------|--------|----------|------------|
| **1. Environment Management** |
| Staging environment | ❌ Missing | P0 | Medium |
| Production environment | ✅ Exists | - | - |
| Environment promotion workflow | ❌ Missing | P0 | Medium |
| Content preview (draft mode) | ❌ Missing | P1 | Medium |
| **2. Visual Content Builder** |
| Drag-and-drop page builder | ❌ Missing | P0 | High |
| Card/block library | ⚠️ Partial | P0 | Medium |
| Visual layout editor | ❌ Missing | P0 | High |
| Real-time preview | ❌ Missing | P1 | Medium |
| **3. Form Builder** |
| Visual form designer | ❌ Missing | P0 | High |
| Form field library | ⚠️ Partial | P0 | Low |
| Form validation rules | ⚠️ Partial | P1 | Medium |
| Submission handling | ✅ Exists | - | - |
| **4. Content Management** |
| Page CRUD operations | ❌ Missing | P0 | Medium |
| Asset management | ❌ Missing | P1 | Medium |
| Version history | ❌ Missing | P1 | High |
| Content templates | ⚠️ Partial | P1 | Medium |
| **5. User Management** |
| User roles & permissions | ✅ Exists | - | - |
| Team collaboration | ⚠️ Partial | P1 | Medium |
| Audit logs | ❌ Missing | P2 | Medium |
| **6. Publishing Workflow** |
| Draft → Review → Publish | ❌ Missing | P0 | Medium |
| Scheduled publishing | ❌ Missing | P1 | Medium |
| Rollback capability | ❌ Missing | P1 | High |

**Legend:**
- ✅ Complete and production-ready
- ⚠️ Partially implemented, needs enhancement
- ❌ Not implemented
- P0 = Critical for MVP
- P1 = Important for MVP
- P2 = Nice-to-have, post-MVP

---

## Gap Analysis & Impact Assessment

### Critical Gaps (Blocking MVP Launch)

#### 1. **No Staging Environment**
**Impact:** Cannot safely test content changes
**Risk:** Production bugs, data corruption, user frustration

**Current State:**
- Only production deployment exists
- No safe testing environment
- Changes go live immediately

**Required:**
- Staging Cloud Run service (`rml-intranet-staging`)
- Staging database/Notion integration
- Environment promotion workflow
- Preview URLs for content review

#### 2. **No Visual Page Builder**
**Impact:** Requires developer for every content change
**Risk:** Not scalable, defeats CMS purpose

**Current State:**
- Pages are hardcoded React components
- Content changes require code deployment
- No non-technical user access

**Required:**
- Drag-and-drop interface
- Component/card library
- Layout grid system
- Save/load page configurations

#### 3. **No Form Builder**
**Impact:** Cannot create forms without coding
**Risk:** Major feature gap for CMS product

**Current State:**
- Forms hardcoded in React
- Basic submission API exists
- No visual designer

**Required:**
- Visual form designer
- Field type library (text, email, select, file, etc.)
- Validation rule builder
- Conditional logic (show/hide fields)
- Styling options

### Important Gaps (Needed for Market Viability)

#### 4. **Limited Content Management**
- No page creation UI
- No asset/media library
- No content versioning
- No content scheduling

#### 5. **No Publishing Workflow**
- No draft mode
- No review/approval process
- No rollback mechanism

#### 6. **Limited Collaboration Features**
- No multi-user editing
- No comment system
- No change notifications

---

## Proposed Architecture Enhancements

### 1. Multi-Environment Setup

```
┌─────────────────────────────────────────────────────┐
│                  Development                         │
│  Local dev environment (npm run dev)                │
│  - Mock data                                        │
│  - Hot reload                                       │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                    Staging                          │
│  staging.intranet.roammigrationlaw.com              │
│  - Cloud Run: rml-intranet-staging                  │
│  - Staging database (Supabase)                      │
│  - Test Notion workspace                            │
│  - IAP: limited access (developers + testers)       │
└─────────────────────────────────────────────────────┘
                         ↓
              [Promotion Process]
                         ↓
┌─────────────────────────────────────────────────────┐
│                  Production                         │
│  intranet.roammigrationlaw.com                      │
│  - Cloud Run: rml-intranet                          │
│  - Production database                              │
│  - Production Notion workspace                      │
│  - IAP: @roammigrationlaw.com                       │
└─────────────────────────────────────────────────────┘
```

**Implementation:**
- Duplicate Cloud Run services with `-staging` suffix
- Environment-specific configuration
- Blue-green deployment strategy
- Automated promotion scripts

### 2. Content Management Database Schema

```typescript
// New Supabase tables

// Pages
pages {
  id: uuid
  slug: string (unique)
  title: string
  status: 'draft' | 'published' | 'archived'
  layout_config: jsonb  // Page builder output
  meta: jsonb  // SEO, og tags
  author_id: uuid
  created_at: timestamp
  updated_at: timestamp
  published_at: timestamp
  parent_id: uuid (for nested pages)
}

// Page Versions (for history/rollback)
page_versions {
  id: uuid
  page_id: uuid
  version_number: integer
  layout_config: jsonb
  created_at: timestamp
  created_by: uuid
  change_summary: text
}

// Forms
forms {
  id: uuid
  name: string
  slug: string
  fields_config: jsonb  // Form builder output
  validation_rules: jsonb
  status: 'active' | 'inactive'
  created_at: timestamp
  updated_at: timestamp
}

// Form Submissions
form_submissions {
  id: uuid
  form_id: uuid
  data: jsonb
  submitted_by: uuid
  submitted_at: timestamp
  ip_address: string
  status: 'pending' | 'processed' | 'archived'
}

// Content Blocks (reusable components)
content_blocks {
  id: uuid
  name: string
  type: string  // 'hero', 'card-grid', 'table', 'chart', etc.
  config: jsonb
  is_template: boolean
  created_at: timestamp
}

// Assets
assets {
  id: uuid
  filename: string
  type: string  // 'image', 'video', 'pdf', 'document'
  url: string  // GCS bucket URL
  size: integer
  uploaded_by: uuid
  uploaded_at: timestamp
  alt_text: text
  tags: text[]
}

// Audit Log
audit_log {
  id: uuid
  entity_type: string  // 'page', 'form', 'user', etc.
  entity_id: uuid
  action: string  // 'create', 'update', 'delete', 'publish'
  changes: jsonb
  performed_by: uuid
  performed_at: timestamp
}
```

### 3. Page Builder Architecture

```typescript
// Component-based architecture

interface PageBuilderBlock {
  id: string;
  type: BlockType;
  config: BlockConfig;
  children?: PageBuilderBlock[];
  order: number;
}

type BlockType =
  | 'hero'
  | 'text'
  | 'image'
  | 'card-grid'
  | 'notion-table'
  | 'chart'
  | 'form'
  | 'accordion'
  | 'tabs'
  | 'video'
  | 'spacer'
  | 'container'
  | 'column-layout';

interface BlockConfig {
  // Common properties
  id: string;
  className?: string;
  style?: React.CSSProperties;

  // Type-specific properties
  [key: string]: any;
}

// Page builder stores array of blocks
interface PageLayout {
  blocks: PageBuilderBlock[];
  metadata: {
    title: string;
    description: string;
    lastModified: Date;
  };
}
```

**Rendering Strategy:**
1. **Edit Mode:** Drag-and-drop interface with React DnD
2. **Preview Mode:** Rendered React components (read-only)
3. **Published Mode:** Optimized static rendering

### 4. Form Builder Architecture

```typescript
interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalRule[];
  order: number;
  config: FieldConfig;
}

type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'date'
  | 'time'
  | 'url';

interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

interface ConditionalRule {
  condition: 'show' | 'hide';
  when: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan';
    value: any;
  }[];
}
```

**Form Builder Features:**
- Drag-and-drop field ordering
- Live preview
- Validation rule builder
- Conditional logic designer
- Styling options (using existing Tailwind classes)
- Integration with existing form submission API

---

## MVP Feature Roadmap

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 Staging Environment Setup
- [ ] Create `rml-intranet-staging` Cloud Run service
- [ ] Set up staging database (Supabase)
- [ ] Configure staging Notion workspace
- [ ] Create `staging.intranet.roammigrationlaw.com` subdomain
- [ ] Implement environment-specific configuration
- [ ] Create deployment scripts for staging

**Deliverable:** Fully functional staging environment

#### 1.2 Database Schema Implementation
- [ ] Create Supabase migrations for new tables
- [ ] Implement `pages` table with versioning
- [ ] Implement `forms` and `form_submissions` tables
- [ ] Implement `content_blocks` library
- [ ] Implement `assets` table (media library)
- [ ] Set up Row Level Security (RLS) policies

**Deliverable:** Content management database ready

#### 1.3 Backend API Extensions
- [ ] Create pages API endpoints (CRUD)
- [ ] Create page versions API (save/load/rollback)
- [ ] Create forms API endpoints (builder + runtime)
- [ ] Create assets API (upload/manage)
- [ ] Implement draft/publish workflow API
- [ ] Add audit logging middleware

**Deliverable:** Complete backend API for CMS features

### Phase 2: Page Builder (Weeks 3-5)

#### 2.1 Page Builder UI Foundation
- [ ] Create PageBuilder component with React DnD
- [ ] Implement drag-and-drop zones
- [ ] Create block selector sidebar
- [ ] Implement block property inspector
- [ ] Add undo/redo functionality
- [ ] Implement save/load page configurations

**Deliverable:** Working drag-and-drop page builder

#### 2.2 Content Block Library
- [ ] Convert existing components to blocks:
  - [ ] Hero block
  - [ ] Card grid block
  - [ ] Text/rich text block
  - [ ] Image block
  - [ ] Notion table block (existing)
  - [ ] Chart block (Recharts)
  - [ ] Accordion block
  - [ ] Tabs block
  - [ ] Video embed block
  - [ ] Container/layout blocks
- [ ] Create block configuration UI for each type
- [ ] Implement block templates

**Deliverable:** 10+ ready-to-use content blocks

#### 2.3 Page Management UI
- [ ] Create page list/grid view
- [ ] Implement page creation flow
- [ ] Add page settings (SEO, permissions)
- [ ] Create page preview mode
- [ ] Implement page publish workflow
- [ ] Add page search/filter

**Deliverable:** Complete page management interface

### Phase 3: Form Builder (Weeks 6-7)

#### 3.1 Form Builder UI
- [ ] Create FormBuilder component
- [ ] Implement field drag-and-drop
- [ ] Create field type selector
- [ ] Build field configuration panel
- [ ] Add validation rule UI
- [ ] Implement conditional logic UI
- [ ] Add form styling options

**Deliverable:** Visual form builder

#### 3.2 Form Rendering Engine
- [ ] Create dynamic form renderer
- [ ] Implement real-time validation
- [ ] Add conditional logic execution
- [ ] Build submission handler
- [ ] Add success/error states
- [ ] Implement form analytics

**Deliverable:** Forms work end-to-end from builder to submission

#### 3.3 Form Templates
- [ ] Contact form template
- [ ] Feedback form template
- [ ] Registration form template
- [ ] Survey form template
- [ ] File upload form template

**Deliverable:** 5 ready-to-use form templates

### Phase 4: Publishing Workflow (Week 8)

#### 4.1 Draft/Publish System
- [ ] Implement draft mode for pages
- [ ] Create publish action
- [ ] Add unpublish/archive
- [ ] Implement scheduled publishing
- [ ] Create publish history view

**Deliverable:** Complete publishing workflow

#### 4.2 Version Control
- [ ] Implement auto-save drafts
- [ ] Create version comparison UI
- [ ] Add rollback functionality
- [ ] Build version history timeline
- [ ] Implement version restoration

**Deliverable:** Full version control for content

#### 4.3 Environment Promotion
- [ ] Create staging → production promotion UI
- [ ] Implement content diff view
- [ ] Add bulk promotion (multiple pages)
- [ ] Create promotion approval workflow
- [ ] Add rollback for promotions

**Deliverable:** Safe content promotion pipeline

### Phase 5: Asset Management (Week 9)

#### 5.1 Media Library
- [ ] Create media library UI
- [ ] Implement file upload (drag-and-drop)
- [ ] Add image optimization
- [ ] Build thumbnail generation
- [ ] Create file browser
- [ ] Add search/filter/tags

**Deliverable:** Complete media library

#### 5.2 Asset Integration
- [ ] Integrate with page builder (image blocks)
- [ ] Add to rich text editor
- [ ] Implement asset picker component
- [ ] Add CDN integration (Google Cloud Storage)
- [ ] Implement lazy loading

**Deliverable:** Assets usable throughout CMS

### Phase 6: Polish & Testing (Weeks 10-12)

#### 6.1 UI/UX Refinement
- [ ] Conduct usability testing
- [ ] Refine page builder interactions
- [ ] Improve form builder UX
- [ ] Add onboarding tour
- [ ] Create help documentation
- [ ] Polish animations/transitions

**Deliverable:** Production-quality UX

#### 6.2 Performance Optimization
- [ ] Optimize page builder rendering
- [ ] Implement lazy loading for blocks
- [ ] Add caching strategies
- [ ] Optimize database queries
- [ ] Reduce bundle size

**Deliverable:** Fast, responsive CMS

#### 6.3 Testing & Quality Assurance
- [ ] Write unit tests for critical paths
- [ ] Create E2E tests with Playwright
- [ ] Test all user workflows
- [ ] Load testing
- [ ] Security audit
- [ ] Browser compatibility testing

**Deliverable:** Tested, stable MVP

#### 6.4 Documentation
- [ ] User guide (content editors)
- [ ] Admin guide (administrators)
- [ ] Developer guide (customization)
- [ ] API documentation
- [ ] Video tutorials
- [ ] Migration guide

**Deliverable:** Complete documentation suite

---

## UI/UX Design Recommendations

### 1. Page Builder Interface Design

```
┌────────────────────────────────────────────────────────────┐
│  [RML Logo]  Page Builder          [Preview] [Save] [Publish]│
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌──────────────────────────┐  ┌─────────┐│
│  │            │  │                          │  │         ││
│  │ Blocks     │  │  Canvas (Drag Zone)      │  │ Config  ││
│  │            │  │                          │  │         ││
│  │ ┌────────┐ │  │  ┌─────────────────┐    │  │ Title:  ││
│  │ │ Hero   │ │  │  │ Hero Block      │    │  │ [____]  ││
│  │ └────────┘ │  │  │ [Title text]    │    │  │         ││
│  │            │  │  └─────────────────┘    │  │ BG:     ││
│  │ ┌────────┐ │  │                        │  │ [____]  ││
│  │ │ Cards  │ │  │  [Drop zone]           │  │         ││
│  │ └────────┘ │  │                        │  │ [Apply] ││
│  │            │  │  ┌─────────────────┐    │  │         ││
│  │ ┌────────┐ │  │  │ Card Grid       │    │  └─────────┘│
│  │ │ Table  │ │  │  │ [3 cards]       │    │             │
│  │ └────────┘ │  │  └─────────────────┘    │             │
│  │            │  │                          │             │
│  │ [+ Custom] │  │  [Drop zone]             │             │
│  │            │  │                          │             │
│  └────────────┘  └──────────────────────────┘             │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Three-column layout:** Blocks library | Canvas | Configuration panel
- **Visual feedback:** Highlight drop zones, show block outlines
- **Context menu:** Right-click on blocks for quick actions
- **Keyboard shortcuts:** Cmd+Z (undo), Cmd+S (save), Cmd+P (preview)
- **Mobile responsive:** Builder works on tablets

### 2. Form Builder Interface Design

```
┌────────────────────────────────────────────────────────────┐
│  [RML Logo]  Form Builder         [Preview] [Save] [Publish]│
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌──────────────────────────┐  ┌─────────┐│
│  │            │  │  Form Preview            │  │         ││
│  │ Fields     │  │                          │  │ Field   ││
│  │            │  │  Contact Us Form         │  │ Settings││
│  │ ┌────────┐ │  │                          │  │         ││
│  │ │ Text   │ │  │  Name *                  │  │ Label:  ││
│  │ └────────┘ │  │  [____________]          │  │ [Name]  ││
│  │            │  │                          │  │         ││
│  │ ┌────────┐ │  │  Email *                 │  │ ☑ Req   ││
│  │ │ Email  │ │  │  [____________]          │  │         ││
│  │ └────────┘ │  │                          │  │ Rules:  ││
│  │            │  │  Message *               │  │ • Email ││
│  │ ┌────────┐ │  │  [____________]          │  │         ││
│  │ │ Select │ │  │  [____________]          │  │ [Apply] ││
│  │ └────────┘ │  │                          │  │         ││
│  │            │  │  [Submit]                │  └─────────┘│
│  │ [+ More]   │  │                          │             │
│  │            │  └──────────────────────────┘             │
│  └────────────┘                                            │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Live preview:** See form as you build it
- **Drag to reorder:** Click and drag fields to rearrange
- **Quick validation:** Add common validation rules with checkboxes
- **Conditional logic:** "Show this field when..."
- **Mobile preview:** Toggle to see mobile form layout

### 3. Page Management Dashboard

```
┌────────────────────────────────────────────────────────────┐
│  Pages                     [Search...] [+ New Page] [Filter]│
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ☑ All  ☐ Published  ☐ Draft  ☐ Archived                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Home Page                                   Published│   │
│  │ /                                                    │   │
│  │ Last edited 2 hours ago by Jackson                  │   │
│  │ [Edit] [Preview] [Duplicate] [⋮]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Legal Hub                                   Draft    │   │
│  │ /legal-hub                                           │   │
│  │ Last edited 1 day ago by Jackson                    │   │
│  │ [Edit] [Preview] [Publish] [⋮]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ People Directory                            Published│   │
│  │ /people                                              │   │
│  │ Last edited 3 days ago by Sarah                     │   │
│  │ [Edit] [Preview] [Duplicate] [⋮]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Status badges:** Visual indicators for published/draft/archived
- **Quick actions:** Edit, preview, duplicate without opening page
- **Bulk operations:** Select multiple pages for bulk actions
- **Smart search:** Search by title, slug, content, author
- **Sort options:** By date, title, status, author

### 4. Admin Dashboard Design

```
┌────────────────────────────────────────────────────────────┐
│  RML CMS Admin                          [User: Jackson]    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 45 Pages     │  │ 12 Forms     │  │ 234 Assets   │     │
│  │ 8 drafts     │  │ 145 sub/week │  │ 2.3 GB used  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  Recent Activity                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • Sarah published "Team Updates"          2 min ago │   │
│  │ • Jackson edited "Legal Hub"              10 min ago│   │
│  │ • Form submission: Contact Form           1 hr ago  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Quick Actions                                             │
│  [Create Page] [Create Form] [Upload Assets] [View Users] │
│                                                             │
│  Environment Status                                        │
│  Production: ✅ Healthy    Staging: ✅ Healthy            │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Plugin Architecture (Future Expansion)

### Plugin System Design

```typescript
interface CMSPlugin {
  name: string;
  version: string;
  description: string;
  author: string;

  // Lifecycle hooks
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onActivate?: () => Promise<void>;
  onDeactivate?: () => Promise<void>;

  // Extension points
  blocks?: BlockDefinition[];        // Add custom blocks
  fields?: FieldDefinition[];        // Add form field types
  routes?: RouteDefinition[];        // Add admin routes
  apiEndpoints?: APIDefinition[];    // Add backend endpoints

  // UI extensions
  adminMenuItems?: MenuItem[];
  settingsPages?: SettingsPage[];

  // Data hooks
  beforePageSave?: (page: Page) => Promise<Page>;
  afterPagePublish?: (page: Page) => Promise<void>;
}
```

### Planned Plugin Categories

1. **Integration Plugins:**
   - Slack notifications
   - Email marketing (Mailchimp, SendGrid)
   - Analytics (Google Analytics, Plausible)
   - CRM integrations (Salesforce, HubSpot)

2. **Content Plugins:**
   - Rich text editor (TipTap, Slate)
   - Code syntax highlighting
   - Markdown support
   - LaTeX math rendering

3. **SEO Plugins:**
   - Meta tag optimizer
   - Sitemap generator
   - Schema markup
   - Social media preview

4. **Security Plugins:**
   - Two-factor authentication
   - IP whitelist
   - Rate limiting per user
   - Content encryption

5. **Workflow Plugins:**
   - Approval workflows
   - Comment system
   - Change notifications
   - Scheduled content

---

## Success Metrics & KPIs

### MVP Launch Criteria

**Technical:**
- [ ] 99.9% uptime for 30 days
- [ ] < 2s page load time (p95)
- [ ] Zero critical security vulnerabilities
- [ ] 90%+ test coverage for critical paths
- [ ] Complete documentation

**Feature:**
- [ ] Page builder works for 10+ block types
- [ ] Form builder supports 10+ field types
- [ ] Staging → production promotion workflow functional
- [ ] User can create, edit, publish page without developer
- [ ] User can create form without developer

**User Experience:**
- [ ] Non-technical user can create page in < 10 minutes
- [ ] Non-technical user can create form in < 5 minutes
- [ ] Onboarding tour completed by 90%+ new users
- [ ] < 3 support tickets per week per 100 users

### Post-MVP Growth Metrics

**Adoption:**
- Number of active pages
- Number of forms created
- Number of form submissions
- Number of active users

**Engagement:**
- Pages created per week
- Forms created per week
- Time spent in page builder
- Feature usage (which blocks/fields most popular)

**Performance:**
- API response times
- Build times
- Asset delivery speed
- Database query performance

**Business:**
- Cost per user (infrastructure)
- Revenue per customer (if productized)
- Customer satisfaction score
- Feature request → implementation time

---

## Risk Assessment & Mitigation

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Database schema changes break existing data | High | Medium | Comprehensive migrations, backup/restore testing |
| Page builder performance issues with complex pages | Medium | Medium | Lazy loading, virtualization, optimization |
| Staging/prod sync failures | High | Low | Automated testing, rollback procedures |
| Security vulnerabilities in user-generated content | High | Medium | Input sanitization, CSP headers, XSS prevention |
| React DnD performance on large pages | Medium | Medium | Virtualization, chunking, progressive loading |

### Product Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Users find page builder too complex | High | Medium | User testing, onboarding tour, documentation |
| Form builder lacks required field types | Medium | High | Extensible architecture, quick field addition |
| Migration from hardcoded pages too difficult | High | Low | Migration scripts, documentation, support |
| Staging environment not used properly | Medium | High | Enforce workflow, training, clear guidelines |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Development takes longer than 12 weeks | Medium | Medium | Phased rollout, MVP scope control |
| Infrastructure costs increase significantly | Medium | Low | Cost monitoring, optimization, alerts |
| Competition from established CMS platforms | High | High | Focus on niche (internal intranets), unique integrations |
| User adoption is slow | Medium | Medium | Training, documentation, change management |

---

## Cost Analysis

### Development Costs (12 weeks)

**Assumptions:**
- 1 full-time senior developer
- 0.5 designer/UX specialist
- 0.25 DevOps/infrastructure

**Estimated Hours:**
- Development: 480 hours ($100-150/hr = $48k-72k)
- Design/UX: 240 hours ($80-120/hr = $19k-29k)
- DevOps: 120 hours ($120-150/hr = $14k-18k)

**Total Development: $81k-119k**

### Infrastructure Costs (Monthly)

**Staging Environment:**
- Cloud Run (staging): $5-8
- Database (staging): $5-10
- Cloud Storage (staging): $2-5

**Production Environment:**
- Cloud Run (production): $10-15
- Database (production): $10-20
- Cloud Storage (assets): $5-10
- Cloud CDN: $5-15

**Total Infrastructure: $42-83/month**

### ROI Analysis

**Current State (Hardcoded):**
- Developer time per content change: 30-60 minutes
- Changes per week: ~5-10
- Annual developer hours: 130-260 hours
- Annual cost: $13k-39k in developer time

**Post-CMS State:**
- Content editor time per change: 5-10 minutes
- Developer time: 0 hours (except new features)
- Annual savings: $13k-39k
- **Payback period: 2-3 years**

**Additional Value:**
- Faster time-to-market for content changes
- Reduced bottleneck on developers
- Enables non-technical team members
- Potential to license to other companies (revenue)

---

## Next Steps & Immediate Actions

### Week 1 Priority Actions

1. **Approve MVP Scope**
   - Review this document with stakeholders
   - Confirm/adjust feature priorities
   - Approve budget and timeline

2. **Set Up Staging Environment**
   - Create Cloud Run staging service
   - Configure staging database
   - Set up CI/CD for staging

3. **Database Schema Design**
   - Review proposed schema
   - Create initial migrations
   - Set up RLS policies

4. **Kick-Off Development**
   - Assign development resources
   - Set up project management (Jira, Linear, etc.)
   - Schedule weekly check-ins

### Decision Points

**Architecture Decisions:**
- [ ] Approve multi-environment setup
- [ ] Approve database schema design
- [ ] Approve page builder architecture
- [ ] Approve form builder architecture

**Scope Decisions:**
- [ ] Confirm P0 features for MVP
- [ ] Approve timeline (8-12 weeks)
- [ ] Approve budget
- [ ] Identify potential early beta testers

**Process Decisions:**
- [ ] Define promotion workflow (staging → prod)
- [ ] Set up code review process
- [ ] Establish testing requirements
- [ ] Define documentation standards

---

## Appendix

### A. Technology Justification

**React + TypeScript:**
- ✅ Already implemented
- ✅ Large ecosystem
- ✅ Type safety
- ✅ Team familiarity

**React DnD:**
- ✅ Already installed
- ✅ Flexible, powerful
- ✅ Works with React 18
- ⚠️ Learning curve

**Supabase:**
- ✅ PostgreSQL-based
- ✅ RLS for security
- ✅ Real-time subscriptions
- ✅ Auto-generated APIs
- ⚠️ Vendor lock-in consideration

**Cloud Run:**
- ✅ Already deployed
- ✅ Scales to zero
- ✅ Cost-effective
- ✅ Easy multi-environment

### B. Competitor Analysis

**WordPress:**
- ✅ Mature plugin ecosystem
- ✅ Large community
- ⚠️ PHP-based (older tech)
- ⚠️ Security concerns
- ⚠️ Slow admin interface

**Contentful:**
- ✅ Headless CMS leader
- ✅ Great API
- ⚠️ Expensive ($300+/mo)
- ⚠️ Limited customization

**Strapi:**
- ✅ Open-source
- ✅ Node.js-based
- ⚠️ Requires hosting
- ⚠️ Limited page builder

**Our Advantage:**
- Tightly integrated with Google Workspace
- Custom Notion integration
- IAP authentication built-in
- Tailored for internal intranets
- Modern React/TypeScript stack

### C. User Personas

**Persona 1: Content Editor (Sarah)**
- **Role:** Operations Manager
- **Tech Skill:** Low-Medium
- **Goals:** Update pages quickly, create forms without IT
- **Pain Points:** Waiting for developers, learning complex tools
- **Needs:** Visual editor, templates, clear instructions

**Persona 2: Administrator (Jackson)**
- **Role:** IT Manager
- **Tech Skill:** High
- **Goals:** Manage users, monitor system, ensure security
- **Pain Points:** Lack of visibility, manual deployments
- **Needs:** Admin dashboard, logs, environment management

**Persona 3: Developer (Custom)**
- **Role:** Full-Stack Developer
- **Tech Skill:** Expert
- **Goals:** Extend CMS, add custom blocks, maintain system
- **Pain Points:** Poor documentation, rigid architecture
- **Needs:** Plugin API, clear docs, TypeScript support

---

**Document Version:** 1.0
**Last Updated:** February 18, 2026
**Next Review:** After MVP scope approval
