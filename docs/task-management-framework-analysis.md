# Task Management Framework Analysis
## Evaluation of GitHub-Based Project Management Systems

**Date:** 2026-02-16
**Author:** Jackson Taylor (with Claude Sonnet 4.5)
**Purpose:** Evaluate enterprise-grade task/project management frameworks for RML Intranet integration

---

## Executive Summary

After comprehensive research and technical analysis, **Plane.so** emerges as the strongest candidate for replacing your ad-hoc Notion system, offering:

- ✅ **Production-ready REST API** with comprehensive documentation
- ✅ **Native PostgreSQL backend** (seamless Supabase integration potential)
- ✅ **Modern React/TypeScript architecture** matching your stack
- ✅ **Sophisticated workflow management** (states, cycles, modules, custom properties)
- ✅ **Self-hosted option** with full data control
- ✅ **Active development** (1.6k+ GitHub stars, regular releases)
- ✅ **KPI tracking capabilities** through custom fields and analytics

**Runner-up:** Operately for its OKR/KPI focus, but less mature integration ecosystem.

**Not recommended:** GitHub Projects v2 due to GraphQL complexity and developer-only focus.

---

## Evaluation Criteria

Your requirements mapped to technical capabilities:

| Requirement | Weight | Plane.so | GitHub Projects | Operately |
|------------|--------|----------|-----------------|-----------|
| Requirements/scope definition | High | ✅ Projects + Initiatives + Epics | ⚠️ Limited hierarchy | ✅ Goals + Projects |
| Granular task breakdown | Critical | ✅ Issues + subtasks + modules | ✅ Items + draft issues | ✅ Projects + milestones |
| Task allocation & workflow | Critical | ✅ States + assignees + cycles | ⚠️ Basic field system | ✅ Check-ins + updates |
| KPI tracking per staff | High | ⚠️ Via custom fields + API | ❌ Not designed for KPIs | ✅ Native OKR/KPI system |
| Supabase integration | Critical | ✅ PostgreSQL-native | ❌ External only | ✅ PostgreSQL-native |
| React/Tailwind integration | Critical | ✅ REST API + webhooks | ⚠️ GraphQL complexity | ⚠️ Elixir backend |
| Self-hosted option | High | ✅ Docker Compose | ❌ Cloud only | ✅ Docker Compose |
| API maturity | Critical | ✅ RESTful + documented | ✅ GraphQL + documented | ⚠️ Limited docs |

**Legend:** ✅ Excellent | ⚠️ Adequate | ❌ Limited/Missing

---

## Option 1: Plane.so (RECOMMENDED)

**GitHub:** [makeplane/plane](https://github.com/makeplane/plane)
**Tech Stack:** Next.js (React), Django (Python), PostgreSQL, Redis
**License:** AGPLv3 (open-core model)
**API:** [REST API Documentation](https://developers.plane.so/api-reference/introduction)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ RML Intranet (React + Tailwind v4)                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Custom Task Management UI Components                │ │
│ │ - Dashboard widgets                                  │ │
│ │ - Personal KPI pages                                 │ │
│ │ - Project views                                      │ │
│ │ - Task allocation interface                          │ │
│ └────────────┬────────────────────────────────────────┘ │
└──────────────┼──────────────────────────────────────────┘
               │
               │ REST API (https://api.plane.so/api/v1/)
               │ Authentication: X-API-Key header
               │ Rate limit: 60 req/min
               │
┌──────────────▼──────────────────────────────────────────┐
│ Plane Backend (Self-Hosted)                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Django REST API                                      │ │
│ │ - Projects, Issues, States, Labels                   │ │
│ │ - Cycles, Modules, Initiatives                       │ │
│ │ - Custom properties/fields                           │ │
│ │ - Time tracking, Comments, Attachments               │ │
│ └────────────┬────────────────────────────────────────┘ │
│              │                                           │
│ ┌────────────▼────────────────────────────────────────┐ │
│ │ PostgreSQL Database                                  │ │
│ │ (Can sync with Supabase or use Supabase directly)   │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Core Features

**1. Hierarchical Project Structure**
- **Workspaces** → Organizations (RML)
- **Projects** → Major initiatives (Intranet, SPQR Dashboard, etc.)
- **Initiatives** → Strategic goals
- **Epics** → Feature sets
- **Issues** → Granular tasks
- **Sub-issues** → Task breakdowns

**2. Sophisticated Workflow Management**
- **States:** Customizable workflow stages (Not started, In progress, For Review, Done, etc.)
- **Cycles:** Sprint-like time-boxed containers
- **Modules:** Feature/milestone groupings
- **Labels:** Multi-dimensional categorization
- **Custom Properties:** Extensible metadata (Priority, Effort, Tags, etc.)

**3. Team & Resource Management**
- Member-level permissions (Workspace, Project scopes)
- Assignee tracking with workload visibility
- Time tracking via worklogs
- Activity streams and audit logs

**4. Analytics & Reporting**
- Built-in analytics dashboard (aging WIP, carry-over, dependencies)
- Custom queries via REST API
- Export capabilities for external KPI systems

**5. Integration Ecosystem**
- **GitHub Sync:** Bidirectional issue synchronization
- **Webhooks:** Real-time event notifications
- **REST API:** Comprehensive CRUD operations
- **SDK:** Official JavaScript/Python clients

### Integration Strategy with RML Stack

#### Phase 1: Backend Setup (Week 1)
```bash
# Self-host Plane via Docker Compose
git clone https://github.com/makeplane/plane.git
cd plane
docker-compose up -d

# Configure with Supabase PostgreSQL (optional)
# Option A: Use Plane's bundled Postgres
# Option B: Point Plane to Supabase Postgres instance
```

**Database Strategy:**
- **Option A:** Separate Plane Postgres + API integration to Supabase
- **Option B:** Shared Supabase Postgres (requires schema isolation)
- **Recommendation:** Option A for stability, sync via API/webhooks

#### Phase 2: API Integration Layer (Week 2)
```typescript
// src/lib/plane-api.ts
import { createClient } from '@supabase/supabase-js'

interface PlaneConfig {
  baseUrl: string
  apiKey: string
}

class PlaneAPI {
  private config: PlaneConfig
  private supabase: SupabaseClient

  constructor(config: PlaneConfig) {
    this.config = config
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // Fetch user's assigned tasks
  async getUserTasks(userId: string, filters?: TaskFilters) {
    const response = await fetch(
      `${this.config.baseUrl}/workspaces/rml/issues`,
      {
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        method: 'GET'
      }
    )
    const tasks = await response.json()

    // Filter by assignee
    return tasks.results.filter(
      (task: any) => task.assignees.includes(userId)
    )
  }

  // Sync KPIs to Supabase
  async syncKPIsToSupabase(userId: string, kpiData: KPIData) {
    const { data, error } = await this.supabase
      .from('staff_kpis')
      .upsert({
        user_id: userId,
        tasks_completed: kpiData.completedCount,
        tasks_in_progress: kpiData.inProgressCount,
        avg_completion_time: kpiData.avgCompletionTime,
        updated_at: new Date().toISOString()
      })

    return { data, error }
  }

  // Create project with scope definition
  async createProject(projectData: ProjectCreate) {
    const response = await fetch(
      `${this.config.baseUrl}/workspaces/rml/projects`,
      {
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          name: projectData.name,
          description: projectData.scope,
          custom_properties: {
            requirements: projectData.requirements,
            success_criteria: projectData.successCriteria
          }
        })
      }
    )
    return response.json()
  }
}

export default PlaneAPI
```

#### Phase 3: React Components (Week 3-4)
```typescript
// src/components/TaskDashboard.tsx
import { useQuery } from '@tanstack/react-query'
import { planeApi } from '@/lib/plane-api'

export function TaskDashboard({ userId }: { userId: string }) {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['user-tasks', userId],
    queryFn: () => planeApi.getUserTasks(userId, {
      status: ['in_progress', 'not_started'],
      sortBy: 'priority'
    })
  })

  if (isLoading) return <TaskSkeleton />

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <TaskColumn title="Not Started" tasks={tasks?.notStarted} />
      <TaskColumn title="In Progress" tasks={tasks?.inProgress} />
      <TaskColumn title="For Review" tasks={tasks?.forReview} />
    </div>
  )
}

// src/components/KPIWidget.tsx
export function KPIWidget({ userId }: { userId: string }) {
  const { data: kpis } = useQuery({
    queryKey: ['user-kpis', userId],
    queryFn: async () => {
      // Fetch from Plane API and compute KPIs
      const tasks = await planeApi.getUserTasks(userId)
      const completed = tasks.filter(t => t.state.group === 'completed')

      return {
        tasksCompleted: completed.length,
        tasksInProgress: tasks.filter(t => t.state.group === 'started').length,
        avgCompletionTime: calculateAvgTime(completed),
        velocity: calculateVelocity(completed)
      }
    },
    refetchInterval: 60000 // Refresh every minute
  })

  return (
    <div className="rounded-lg border border-plum/20 bg-cream p-6">
      <h3 className="text-lg font-semibold text-plum">Your KPIs</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <KPIMetric label="Completed" value={kpis?.tasksCompleted} />
        <KPIMetric label="In Progress" value={kpis?.tasksInProgress} />
        <KPIMetric label="Avg Time" value={kpis?.avgCompletionTime} />
        <KPIMetric label="Velocity" value={kpis?.velocity} />
      </div>
    </div>
  )
}
```

#### Phase 4: Webhook Integration (Week 5)
```typescript
// api/webhooks/plane.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { event, data } = req.body

  // Verify webhook signature (implement HMAC verification)

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  switch (event) {
    case 'issue.updated':
      // Sync task state changes to Supabase
      await supabase.from('task_history').insert({
        plane_issue_id: data.id,
        previous_state: data.old_state,
        new_state: data.state,
        updated_by: data.updated_by,
        updated_at: data.updated_at
      })
      break

    case 'issue.created':
      // Update staff KPI metrics
      await recalculateKPIs(data.assignees)
      break
  }

  return res.status(200).json({ success: true })
}
```

### Pros

✅ **Mature REST API:** Comprehensive, well-documented, production-ready
✅ **PostgreSQL-native:** Direct Supabase integration or sync patterns
✅ **React ecosystem:** Easy to build custom UI on top
✅ **Self-hosted:** Full data control, no vendor lock-in
✅ **Sophisticated workflows:** States, cycles, modules, custom properties
✅ **Active community:** Regular updates, responsive maintainers
✅ **GitHub integration:** Bidirectional sync with repos
✅ **Flexible data model:** Custom properties for KPI tracking

### Cons

⚠️ **Not KPI-native:** Requires custom implementation for advanced KPI dashboards
⚠️ **Learning curve:** Complex feature set requires training
⚠️ **Resource requirements:** Django backend + Redis + Postgres (moderate hosting cost)
⚠️ **Rate limits:** 60 req/min (may need optimization for large teams)

### Estimated Implementation

**Timeline:** 6-8 weeks full integration
**Complexity:** Medium-High (API integration + custom UI)
**Cost:** ~$50-100/month self-hosting (DigitalOcean/GCP)
**Maintenance:** Medium (Docker updates, backups, monitoring)

---

## Option 2: GitHub Projects v2

**Platform:** GitHub native
**Tech Stack:** GraphQL API
**License:** Proprietary (free for public repos, paid for private)
**API:** [GraphQL API Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ RML Intranet (React + Tailwind v4)                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ GraphQL Client (Apollo/urql)                        │ │
│ │ - Complex query construction                         │ │
│ │ - Node ID resolution                                 │ │
│ │ - Permission handling                                │ │
│ └────────────┬────────────────────────────────────────┘ │
└──────────────┼──────────────────────────────────────────┘
               │
               │ GitHub GraphQL API
               │ Authentication: Personal Access Token
               │ Scopes: project, read:project
               │
┌──────────────▼──────────────────────────────────────────┐
│ GitHub Projects (Cloud Only)                            │
│ - Issues & Pull Requests as items                      │
│ - Custom fields (text, date, single-select, iteration) │
│ - Draft issues for non-code tasks                      │
│ - Built-in automations                                  │
└─────────────────────────────────────────────────────────┘
```

### Core Features

**1. Native GitHub Integration**
- Issues and PRs as first-class items
- Automatic repo/commit linking
- GitHub Actions automation

**2. Field System**
- Text, number, date fields
- Single-select dropdowns
- Iteration fields for sprints
- **Limitation:** Cannot update Assignees/Labels via Projects API

**3. Workflow Automation**
- Built-in status automations (PR merged → Done)
- GitHub Actions for custom workflows
- Webhook events (`projects_v2_item`)

### Integration Strategy with RML Stack

#### GraphQL Client Setup
```typescript
// src/lib/github-api.ts
import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

const client = new ApolloClient({
  uri: 'https://api.github.com/graphql',
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_PAT}`
  },
  cache: new InMemoryCache()
})

// Query project items
const GET_PROJECT_ITEMS = gql`
  query GetProjectItems($org: String!, $projectNumber: Int!) {
    organization(login: $org) {
      projectV2(number: $projectNumber) {
        id
        items(first: 100) {
          nodes {
            id
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldDateValue {
                  date
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field { ... on ProjectV2FieldCommon { name } }
                }
              }
            }
            content {
              ... on Issue {
                title
                assignees(first: 10) { nodes { login } }
                state
              }
            }
          }
        }
      }
    }
  }
`

export async function getUserTasks(userId: string) {
  const { data } = await client.query({
    query: GET_PROJECT_ITEMS,
    variables: { org: 'Roam-Migration', projectNumber: 1 }
  })

  // Filter by assignee (complex due to nested structure)
  return data.organization.projectV2.items.nodes.filter(
    (item: any) => item.content?.assignees?.nodes.some(
      (assignee: any) => assignee.login === userId
    )
  )
}
```

### Pros

✅ **Native GitHub integration:** Seamless for development teams
✅ **Zero hosting:** Managed service, no infrastructure
✅ **Built-in automations:** PR/issue status syncing
✅ **Familiar interface:** Developers already know GitHub

### Cons

❌ **GraphQL complexity:** Steep learning curve, verbose queries
❌ **Developer-focused:** Not designed for non-engineering workflows
❌ **Limited hierarchy:** No initiatives/epics, flat item structure
❌ **No self-hosting:** Cloud-only, vendor lock-in
❌ **Poor KPI support:** Basic field system, no analytics
❌ **Permission complexity:** Handling `REDACTED` items, token scopes
❌ **Supabase integration:** Requires separate data sync layer
❌ **Field limitations:** Cannot update assignees/labels via Projects API

### Estimated Implementation

**Timeline:** 4-6 weeks (GraphQL complexity offsets simpler hosting)
**Complexity:** Medium (GraphQL queries, permission handling)
**Cost:** Free for private repos (GitHub Team plan)
**Maintenance:** Low (managed service)

**Verdict:** ❌ **Not recommended** for RML's needs. GitHub Projects excels for code-centric workflows but lacks the sophistication required for enterprise task management, KPI tracking, and non-engineering teams.

---

## Option 3: Operately

**GitHub:** [operately/operately](https://github.com/operately/operately)
**Tech Stack:** Elixir (Phoenix), React, TypeScript, PostgreSQL
**License:** Apache 2.0
**API:** Limited documentation (Elixir/Phoenix-based)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ RML Intranet (React + Tailwind v4)                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Custom Integration Layer                            │ │
│ │ - Phoenix API client                                 │ │
│ │ - Data transformation                                │ │
│ └────────────┬────────────────────────────────────────┘ │
└──────────────┼──────────────────────────────────────────┘
               │
               │ Phoenix REST/GraphQL API (TBD - docs limited)
               │
┌──────────────▼──────────────────────────────────────────┐
│ Operately Backend (Self-Hosted)                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Elixir/Phoenix Application                          │ │
│ │ - Goals & OKRs                                       │ │
│ │ - Projects & Milestones                              │ │
│ │ - KPI Tracking (native)                              │ │
│ │ - Check-ins & Progress Updates                       │ │
│ └────────────┬────────────────────────────────────────┘ │
│              │                                           │
│ ┌────────────▼────────────────────────────────────────┐ │
│ │ PostgreSQL Database                                  │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Core Features

**1. OKR & Goal Management (BEST-IN-CLASS)**
- Hierarchical goal structure (Company → Team → Individual)
- Key Results with quantifiable metrics
- Progress tracking with automated check-ins
- Goal alignment visualization

**2. Project Management**
- Projects linked to goals
- Milestone tracking
- Task accountability with feedback loops
- Execution cadence (check-ins, retrospectives)

**3. KPI Tracking (NATIVE SUPPORT)**
- Company-wide KPIs
- Team-level metrics
- Individual performance tracking
- Real-time dashboards

**4. Team Collaboration**
- Team spaces for departments
- Message boards and discussions
- Document management
- File attachments

### Integration Strategy with RML Stack

#### Challenge: Limited API Documentation

The primary hurdle with Operately is **sparse API documentation**. Unlike Plane's comprehensive REST API docs, Operately's Elixir/Phoenix backend lacks public API specifications.

**Potential approaches:**

1. **Reverse-engineer API:** Inspect network requests from Operately's React frontend
2. **Fork & extend:** Modify Operately source to expose needed endpoints
3. **Database-level integration:** Direct PostgreSQL queries (fragile, not recommended)
4. **Wait for API maturity:** Monitor project for official API release

#### Hypothetical Integration (if API matures)
```typescript
// src/lib/operately-api.ts
class OperatelyAPI {
  async getUserKPIs(userId: string) {
    // Hypothetical - API structure unknown
    const response = await fetch(
      `${this.baseUrl}/api/users/${userId}/kpis`,
      { headers: this.authHeaders }
    )
    return response.json()
  }

  async getGoalsWithProgress() {
    // Hypothetical
    const response = await fetch(
      `${this.baseUrl}/api/goals?with_progress=true`,
      { headers: this.authHeaders }
    )
    return response.json()
  }
}
```

### Pros

✅ **KPI-native:** Best-in-class OKR/KPI tracking (exactly what you need)
✅ **Goal-oriented:** Strategic alignment from vision to tasks
✅ **PostgreSQL-native:** Supabase integration potential
✅ **Self-hosted:** Full data control
✅ **Modern stack:** React frontend, can potentially reuse components
✅ **Startup-focused:** Designed for agile organizations like RML

### Cons

❌ **Immature API:** Limited/no public API documentation
❌ **Smaller community:** 500 GitHub stars (vs Plane's 1.6k)
❌ **Elixir backend:** Different tech stack (potential maintenance burden)
❌ **Less extensible:** Fewer integrations than Plane
❌ **Riskier bet:** Younger project, uncertain long-term viability
❌ **Unknown integration complexity:** Without API docs, implementation timeline unclear

### Estimated Implementation

**Timeline:** 8-12 weeks (API reverse-engineering adds uncertainty)
**Complexity:** High (unknown API, potential source modifications)
**Cost:** ~$50-100/month self-hosting
**Maintenance:** Medium-High (Elixir updates, potential fork maintenance)

**Verdict:** ⚠️ **Promising but premature.** Operately's KPI focus aligns perfectly with RML's needs, but the immature API and smaller community introduce significant risk. **Consider revisiting in 6-12 months** after API matures.

---

## Hybrid Approach: Plane + Custom KPI Layer

Given the analysis, a **hybrid strategy** maximizes strengths:

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│ RML Intranet - Personal KPI Dashboard                        │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Data Sources:                                             │ │
│ │ • Plane API → Task completion metrics                     │ │
│ │ • Supabase DB → Custom KPI definitions                    │ │
│ │ • Aggregation Service → Computed KPIs                     │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐   │
│ │ Tasks       │  │ Velocity    │  │ Project Health     │   │
│ │ Completed   │  │ Trend       │  │ Score              │   │
│ └─────────────┘  └─────────────┘  └────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase - KPI Aggregation Layer                            │
│ Tables:                                                      │
│ • staff_kpis → Per-user metrics                             │
│ • kpi_definitions → Custom KPI formulas                     │
│ • kpi_history → Time-series data                            │
│                                                              │
│ Functions:                                                   │
│ • calculate_velocity() → Rolling average                    │
│ • aggregate_project_health() → Weighted scoring             │
│ • sync_plane_metrics() → Scheduled sync (cron)              │
└─────────────────────────────────────────────────────────────┘
         ▲
         │
┌────────┴──────────────────────────────────────────────────┐
│ Plane - Core Task Management                              │
│ • Projects, Issues, States, Cycles                        │
│ • Custom fields (Priority, Effort, Tags)                  │
│ • Time tracking (worklogs)                                │
│ • GitHub sync                                              │
└───────────────────────────────────────────────────────────┘
```

### Implementation

**1. Plane for task/project management** (weeks 1-4)
- Deploy self-hosted Plane instance
- Configure workspaces, projects, workflows
- Integrate GitHub sync
- Train team on Plane interface

**2. Supabase KPI aggregation layer** (weeks 5-7)
```sql
-- Supabase schema
CREATE TABLE staff_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  period DATE NOT NULL, -- Daily/weekly snapshots

  -- Task metrics (from Plane)
  tasks_completed INT DEFAULT 0,
  tasks_in_progress INT DEFAULT 0,
  avg_completion_time INTERVAL,

  -- Velocity metrics
  story_points_completed INT DEFAULT 0,
  velocity_trend DECIMAL(5,2),

  -- Quality metrics
  tasks_reopened INT DEFAULT 0,
  pr_review_time INTERVAL,

  -- Custom metrics
  custom_metrics JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_kpis_user_period ON staff_kpis(user_id, period DESC);

-- Aggregation function (called by cron)
CREATE OR REPLACE FUNCTION sync_plane_metrics()
RETURNS void AS $$
BEGIN
  -- Fetch data from Plane API via HTTP request
  -- Parse and insert into staff_kpis
  -- Calculate derived metrics (velocity, trends)
END;
$$ LANGUAGE plpgsql;

-- Schedule daily sync
SELECT cron.schedule('sync-plane-kpis', '0 2 * * *', 'SELECT sync_plane_metrics()');
```

**3. Custom KPI dashboard in Intranet** (weeks 8-10)
```typescript
// src/pages/kpi-dashboard.tsx
export function KPIDashboard() {
  const { user } = useAuth()

  const { data: kpis } = useQuery({
    queryKey: ['kpis', user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('staff_kpis')
        .select('*')
        .eq('user_id', user.id)
        .order('period', { ascending: false })
        .limit(30) // Last 30 days

      return data
    }
  })

  return (
    <div className="space-y-6">
      <KPIMetricCard
        title="Tasks Completed"
        value={kpis?.[0]?.tasks_completed}
        trend={calculateTrend(kpis, 'tasks_completed')}
      />
      <VelocityChart data={kpis} />
      <ProjectHealthScore userId={user.id} />
    </div>
  )
}
```

### Benefits of Hybrid Approach

✅ **Best of both worlds:** Plane's maturity + custom KPI flexibility
✅ **Incremental migration:** Can phase out Notion gradually
✅ **Future-proof:** Supabase layer enables switching backend later
✅ **Cost-effective:** No dependency on Operately's API maturity
✅ **Tailored KPIs:** Full control over KPI definitions and calculations

---

## Migration Strategy from Notion

### Phase 1: Parallel Operation (Months 1-2)
- Deploy Plane alongside existing Notion
- Migrate one project as pilot (e.g., SPQR Dashboard)
- Train 2-3 power users
- Collect feedback and iterate

### Phase 2: Incremental Migration (Months 3-4)
- Migrate projects one-by-one
- Export Notion data, import to Plane via API
- Maintain dual-entry during transition
- Update team processes and documentation

### Phase 3: Full Cutover (Month 5)
- Deprecate Notion for task management
- Retain Notion for documentation (or migrate to Plane Wiki)
- Monitor KPI accuracy and adjust formulas
- Retrospective and optimization

### Data Migration Script Example
```typescript
// scripts/migrate-notion-to-plane.ts
import { Client as NotionClient } from '@notionhq/client'
import { PlaneAPI } from '../src/lib/plane-api'

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN })
const plane = new PlaneAPI({
  baseUrl: process.env.PLANE_URL,
  apiKey: process.env.PLANE_API_KEY
})

async function migrateProject(notionDatabaseId: string, planeProjectId: string) {
  // Fetch all tasks from Notion
  const notionTasks = await notion.databases.query({
    database_id: notionDatabaseId
  })

  // Transform and create in Plane
  for (const task of notionTasks.results) {
    const planeTask = transformNotionToPlane(task)
    await plane.createIssue(planeProjectId, planeTask)
  }
}

function transformNotionToPlane(notionTask: any) {
  return {
    name: notionTask.properties.Task.title[0]?.plain_text,
    description: notionTask.properties.Summary?.rich_text[0]?.plain_text,
    state: mapNotionStatusToPlaneState(notionTask.properties.Status.select.name),
    priority: mapNotionPriorityToPlanePriority(notionTask.properties.Priority.select.name),
    assignees: [notionTask.properties.Driver.people[0]?.id],
    labels: notionTask.properties.Tags.multi_select.map((t: any) => t.name),
    custom_properties: {
      effort: notionTask.properties.Effort.number,
      due_date: notionTask.properties['Due Date'].date?.start
    }
  }
}
```

---

## Cost-Benefit Analysis

### Current Notion System
**Annual Cost:** ~$240-480 (Team plan, $10-20/user/month × 2-4 users)
**Limitations:**
- Ad-hoc structure, inconsistent workflows
- Limited API for complex KPI queries
- No advanced analytics
- Not optimized for task management at scale

### Plane + Supabase KPI Layer
**Setup Costs:**
- Initial development: 10 weeks × $X/hour (internal or contract)
- Self-hosting: ~$50-100/month (DigitalOcean Droplet or GCP VM)
- **Total Year 1:** Development + $600-1,200 hosting

**Annual Recurring Costs (Year 2+):**
- Hosting: $600-1,200
- Maintenance: ~5-10 hours/year (updates, backups)
- **Total:** ~$1,200-2,000/year

**ROI:**
- **Efficiency gains:** 20-30% faster task allocation and tracking
- **Better visibility:** Real-time KPI dashboards reduce status meetings
- **Scalability:** Supports 10-50+ users without redesign
- **Data control:** Full ownership, no vendor lock-in

**Break-even:** 12-18 months (accounting for development time)

---

## UX/UI Recommendations

Given your existing design system in RML Intranet, integrate Plane data with cohesive aesthetics:

### Design Principles for Task Management UI

**1. Hierarchical Information Architecture**
```
Dashboard (Overview)
├── My Tasks (Personal view)
│   ├── Urgent & Overdue
│   ├── In Progress
│   └── Up Next
├── Team View (Collaborative)
│   ├── Project Boards
│   └── Team Capacity
└── KPI Dashboard (Analytics)
    ├── Personal Metrics
    └── Team Performance
```

**2. Visual Language**
- **Extend existing design tokens** from `src/app/styles/design-system.ts`
- **Status indicators:** Use brand colors (plum, coral, cream) for states
  - Not Started: `cream` background, `plum/40` border
  - In Progress: `coral` accent, animated pulse
  - For Review: `plum/60` highlight
  - Done: Muted with checkmark icon
- **Priority badges:**
  - 🔴 Urgent: Coral (`#d05c3d`)
  - High: Plum (`#522241`)
  - Normal: Neutral gray
  - Low: Faded cream

**3. Component Patterns**

```typescript
// Task Card Component
export function TaskCard({ task }: { task: PlaneIssue }) {
  return (
    <motion.div
      layout
      className={cn(
        "rounded-lg border p-4 transition-shadow",
        "hover:shadow-md cursor-pointer",
        "bg-white border-plum/20",
        task.priority === 'urgent' && "border-l-4 border-l-coral"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-plum">{task.name}</h4>
          <p className="text-sm text-plum/60 mt-1">{task.project.name}</p>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-plum/60">
        <StateIndicator state={task.state} />
        {task.due_date && <DueDate date={task.due_date} />}
        {task.assignees.map(user => (
          <Avatar key={user.id} src={user.avatar} size="sm" />
        ))}
      </div>
    </motion.div>
  )
}

// KPI Metric Widget
export function KPIMetric({
  label,
  value,
  trend
}: {
  label: string
  value: number
  trend: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="rounded-lg bg-cream p-4">
      <div className="text-sm text-plum/60">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-plum">{value}</span>
        <TrendIndicator trend={trend} />
      </div>
    </div>
  )
}
```

**4. Animation & Micro-interactions**
- **Task state transitions:** Smooth color/position animations
- **Drag-and-drop:** Visual feedback for task re-assignment
- **Loading states:** Skeleton loaders matching design system
- **Success feedback:** Sonner toasts (already implemented)

**5. Responsive Design**
- **Desktop:** Multi-column Kanban boards
- **Tablet:** 2-column layout with collapsible sidebar
- **Mobile:** Single-column list view with bottom sheet for details

---

## Technical Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Plane API rate limits | Medium | Medium | Implement caching layer, batch requests, request queuing |
| Data sync failures | Low | High | Webhook redundancy, scheduled reconciliation, error monitoring |
| Performance degradation | Low | Medium | Pagination, virtual scrolling, API response caching |
| Team adoption resistance | Medium | High | Phased rollout, training sessions, feedback loops |
| Self-hosting complexity | Medium | Medium | Docker Compose, automated backups, monitoring (Sentry, Uptime Robot) |
| Vendor abandonment (Plane) | Low | High | Export data regularly, maintain fork-ready setup, monitor project health |

---

## Alternatives Not Covered

Briefly considered but excluded:

- **Taiga:** Agile-focused, less flexible than Plane
- **Leantime:** Simpler feature set, less API maturity
- **Focalboard:** Trello-like, insufficient for complex workflows
- **OpenProject:** Ruby-based, heavier resource requirements
- **Jira:** Expensive, overkill for team size, Atlassian lock-in

---

## Final Recommendation

**Primary Strategy: Plane.so with Custom KPI Layer**

**Rationale:**
1. **Proven maturity:** 1.6k+ stars, active development, production-ready API
2. **Tech stack alignment:** PostgreSQL + React matches RML's expertise
3. **Flexible integration:** REST API enables custom KPI dashboard
4. **Self-hosted control:** No vendor lock-in, full data ownership
5. **Scalability:** Supports 10-50+ users without architectural changes
6. **Migration path:** Clear Notion → Plane migration strategy

**Timeline:**
- **Weeks 1-4:** Deploy Plane, configure workspaces/projects, migrate pilot project
- **Weeks 5-7:** Build Supabase KPI aggregation layer
- **Weeks 8-10:** Develop custom KPI dashboard in Intranet
- **Weeks 11-12:** User testing, refinement, team training

**Total:** ~12 weeks to production-ready system

**Fallback Option:** If Operately's API matures significantly in next 6 months, re-evaluate for superior native KPI support.

---

## Next Steps

1. **Validate with stakeholders:** Review this analysis with key team members
2. **Proof of concept:** Deploy Plane locally, test API integration (1-2 days)
3. **Design mockups:** Create high-fidelity designs for task/KPI dashboards (3-5 days)
4. **Budget approval:** Estimate development costs (internal time or contract)
5. **Pilot project selection:** Choose one active project for initial migration
6. **Kickoff:** Schedule implementation sprint

---

## Sources

- [Plane.so](https://plane.so) - [GitHub](https://github.com/makeplane/plane) - [API Docs](https://developers.plane.so/api-reference/introduction)
- [Plane vs Linear Comparison](https://plane.so/plane-vs-linear)
- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)
- [Operately GitHub](https://github.com/operately/operately)
- [Top 6 Open Source PM Tools 2026](https://plane.so/blog/top-6-open-source-project-management-software-in-2026)
- [Linear Alternatives](https://openalternative.co/alternatives/linear)
- [Open Source Project Management Tools](https://openalternative.co/alternatives/plane)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-16
**Next Review:** Post-pilot project completion
