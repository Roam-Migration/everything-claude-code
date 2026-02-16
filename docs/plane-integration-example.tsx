// Example: Plane.so Integration with RML Intranet
// File: src/lib/plane-api.ts

import { createClient } from '@supabase/supabase-js'

interface PlaneConfig {
  baseUrl: string
  apiKey: string
}

interface PlaneIssue {
  id: string
  name: string
  description: string
  state: {
    id: string
    name: string
    group: 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled'
    color: string
  }
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none'
  assignees: Array<{
    id: string
    display_name: string
    avatar: string
  }>
  project: {
    id: string
    name: string
    identifier: string
  }
  due_date: string | null
  estimate_point: number | null
  labels: Array<{
    id: string
    name: string
    color: string
  }>
  created_at: string
  updated_at: string
}

interface TaskFilters {
  status?: string[]
  priority?: string[]
  assignee?: string
  sortBy?: 'priority' | 'due_date' | 'created_at'
}

export class PlaneAPI {
  private config: PlaneConfig
  private supabase: ReturnType<typeof createClient>

  constructor(config: PlaneConfig) {
    this.config = config
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // Fetch user's assigned tasks
  async getUserTasks(userId: string, filters?: TaskFilters) {
    const params = new URLSearchParams()
    if (filters?.assignee) params.append('assignees', filters.assignee)

    const response = await fetch(
      `${this.config.baseUrl}/workspaces/rml/issues?${params}`,
      {
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Plane API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Group by state for Kanban view
    const grouped = {
      notStarted: [] as PlaneIssue[],
      inProgress: [] as PlaneIssue[],
      forReview: [] as PlaneIssue[],
      completed: [] as PlaneIssue[]
    }

    data.results.forEach((issue: PlaneIssue) => {
      if (issue.state.group === 'backlog' || issue.state.group === 'unstarted') {
        grouped.notStarted.push(issue)
      } else if (issue.state.group === 'started') {
        grouped.inProgress.push(issue)
      } else if (issue.state.name === 'For Review') {
        grouped.forReview.push(issue)
      } else if (issue.state.group === 'completed') {
        grouped.completed.push(issue)
      }
    })

    return grouped
  }

  // Create new issue
  async createIssue(projectId: string, issueData: Partial<PlaneIssue>) {
    const response = await fetch(
      `${this.config.baseUrl}/workspaces/rml/projects/${projectId}/issues`,
      {
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(issueData)
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to create issue: ${response.statusText}`)
    }

    return response.json()
  }

  // Update issue state
  async updateIssueState(issueId: string, stateId: string) {
    const response = await fetch(
      `${this.config.baseUrl}/workspaces/rml/issues/${issueId}`,
      {
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        method: 'PATCH',
        body: JSON.stringify({ state: stateId })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update issue: ${response.statusText}`)
    }

    return response.json()
  }

  // Sync KPIs to Supabase (called by cron job)
  async syncKPIsToSupabase(userId: string) {
    // Fetch all user's tasks
    const tasks = await this.getUserTasks(userId)

    // Calculate metrics
    const completedThisWeek = tasks.completed.filter(task => {
      const completedAt = new Date(task.updated_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return completedAt >= weekAgo
    }).length

    const avgCompletionTime = this.calculateAvgCompletionTime(tasks.completed)
    const velocity = this.calculateVelocity(tasks.completed)

    // Upsert to Supabase
    const { data, error } = await this.supabase
      .from('staff_kpis')
      .upsert({
        user_id: userId,
        period: new Date().toISOString().split('T')[0],
        tasks_completed: completedThisWeek,
        tasks_in_progress: tasks.inProgress.length,
        tasks_not_started: tasks.notStarted.length,
        avg_completion_time: avgCompletionTime,
        velocity: velocity,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,period'
      })

    if (error) {
      throw new Error(`Failed to sync KPIs: ${error.message}`)
    }

    return data
  }

  // Helper: Calculate average completion time
  private calculateAvgCompletionTime(completedTasks: PlaneIssue[]): number {
    if (completedTasks.length === 0) return 0

    const totalHours = completedTasks.reduce((sum, task) => {
      const created = new Date(task.created_at)
      const completed = new Date(task.updated_at)
      const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60)
      return sum + hours
    }, 0)

    return Math.round(totalHours / completedTasks.length)
  }

  // Helper: Calculate velocity (story points per week)
  private calculateVelocity(completedTasks: PlaneIssue[]): number {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const pointsThisWeek = completedTasks
      .filter(task => new Date(task.updated_at) >= weekAgo)
      .reduce((sum, task) => sum + (task.estimate_point || 0), 0)

    return pointsThisWeek
  }

  // Get project analytics
  async getProjectAnalytics(projectId: string) {
    const response = await fetch(
      `${this.config.baseUrl}/workspaces/rml/projects/${projectId}/analytics`,
      {
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`)
    }

    return response.json()
  }
}

// Initialize client
export const planeApi = new PlaneAPI({
  baseUrl: process.env.PLANE_API_URL || 'https://api.plane.so/api/v1',
  apiKey: process.env.PLANE_API_KEY!
})

// ---

// File: src/components/TaskDashboard.tsx

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { planeApi } from '@/lib/plane-api'
import { cn } from '@/lib/utils'

interface TaskDashboardProps {
  userId: string
}

export function TaskDashboard({ userId }: TaskDashboardProps) {
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['user-tasks', userId],
    queryFn: () => planeApi.getUserTasks(userId),
    refetchInterval: 60000 // Refresh every minute
  })

  if (isLoading) return <TaskSkeleton />
  if (error) return <ErrorState error={error as Error} />

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-plum">My Tasks</h2>
        <CreateTaskButton />
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TaskColumn
          title="Not Started"
          tasks={tasks?.notStarted || []}
          color="gray"
        />
        <TaskColumn
          title="In Progress"
          tasks={tasks?.inProgress || []}
          color="coral"
        />
        <TaskColumn
          title="For Review"
          tasks={tasks?.forReview || []}
          color="plum"
        />
      </div>
    </div>
  )
}

function TaskColumn({
  title,
  tasks,
  color
}: {
  title: string
  tasks: PlaneIssue[]
  color: 'gray' | 'coral' | 'plum'
}) {
  const colorClasses = {
    gray: 'border-gray-300 bg-gray-50',
    coral: 'border-coral/30 bg-coral/5',
    plum: 'border-plum/30 bg-plum/5'
  }

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-plum">{title}</h3>
        <span className="rounded-full bg-plum/10 px-2 py-0.5 text-xs font-medium text-plum">
          {tasks.length}
        </span>
      </div>

      <div
        className={cn(
          'flex-1 space-y-3 rounded-lg border-2 border-dashed p-4',
          colorClasses[color]
        )}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <p className="text-center text-sm text-gray-500">No tasks</p>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: PlaneIssue }) {
  const priorityColors = {
    urgent: 'bg-coral text-white',
    high: 'bg-plum text-white',
    medium: 'bg-gray-200 text-gray-700',
    low: 'bg-gray-100 text-gray-500',
    none: 'bg-gray-50 text-gray-400'
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'cursor-pointer rounded-lg border bg-white p-4 transition-all hover:shadow-md',
        isOverdue ? 'border-coral border-l-4' : 'border-plum/20'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-plum line-clamp-2">{task.name}</h4>
          <p className="text-xs text-plum/60">{task.project.name}</p>
        </div>

        <span
          className={cn(
            'shrink-0 rounded px-2 py-1 text-xs font-medium',
            priorityColors[task.priority]
          )}
        >
          {task.priority === 'urgent' ? '🔴' : ''}
          {task.priority.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {task.estimate_point && (
          <span className="text-xs text-plum/60">
            {task.estimate_point} pts
          </span>
        )}

        {task.due_date && (
          <span
            className={cn(
              'text-xs',
              isOverdue ? 'font-semibold text-coral' : 'text-plum/60'
            )}
          >
            {isOverdue && '⚠️ '}
            {new Date(task.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        )}

        {task.labels.length > 0 && (
          <div className="flex gap-1">
            {task.labels.slice(0, 2).map(label => (
              <span
                key={label.id}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function TaskSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {[1, 2, 3].map(col => (
        <div key={col} className="space-y-3">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map(card => (
              <div
                key={card}
                className="h-32 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---

// File: src/components/KPIDashboard.tsx

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface KPIData {
  period: string
  tasks_completed: number
  tasks_in_progress: number
  avg_completion_time: number
  velocity: number
}

export function KPIDashboard({ userId }: { userId: string }) {
  const { data: kpis } = useQuery<KPIData[]>({
    queryKey: ['kpis', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_kpis')
        .select('*')
        .eq('user_id', userId)
        .order('period', { ascending: false })
        .limit(30)

      if (error) throw error
      return data
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  })

  const latestKPI = kpis?.[0]
  const trend = calculateTrend(kpis || [], 'tasks_completed')

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-plum">Your KPIs</h2>
        <p className="text-sm text-plum/60">Last 30 days of performance metrics</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPIMetricCard
          title="Completed"
          value={latestKPI?.tasks_completed || 0}
          subtitle="this week"
          trend={trend}
          icon="✓"
        />
        <KPIMetricCard
          title="In Progress"
          value={latestKPI?.tasks_in_progress || 0}
          subtitle="active tasks"
          icon="⟳"
        />
        <KPIMetricCard
          title="Avg Time"
          value={`${latestKPI?.avg_completion_time || 0}h`}
          subtitle="to complete"
          icon="⏱"
        />
        <KPIMetricCard
          title="Velocity"
          value={latestKPI?.velocity || 0}
          subtitle="points/week"
          icon="⚡"
        />
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VelocityChart data={kpis || []} />
        <CompletionTimeChart data={kpis || []} />
      </div>
    </div>
  )
}

function KPIMetricCard({
  title,
  value,
  subtitle,
  trend,
  icon
}: {
  title: string
  value: string | number
  subtitle: string
  trend?: 'up' | 'down' | 'neutral'
  icon: string
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-coral',
    neutral: 'text-gray-400'
  }

  return (
    <div className="rounded-lg border border-plum/20 bg-cream p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-plum/60">{title}</p>
          <p className="mt-2 text-3xl font-bold text-plum">{value}</p>
          <p className="mt-1 text-xs text-plum/50">{subtitle}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>

      {trend && (
        <div className={cn('mt-3 flex items-center gap-1 text-sm', trendColors[trend])}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span className="font-medium">
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </span>
        </div>
      )}
    </div>
  )
}

function VelocityChart({ data }: { data: KPIData[] }) {
  const chartData = data
    .slice()
    .reverse()
    .map(kpi => ({
      date: new Date(kpi.period).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      velocity: kpi.velocity
    }))

  return (
    <div className="rounded-lg border border-plum/20 bg-white p-6">
      <h3 className="mb-4 font-semibold text-plum">Velocity Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#52224120" />
          <XAxis dataKey="date" stroke="#522241" fontSize={12} />
          <YAxis stroke="#522241" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f6dfb6',
              border: '1px solid #522241',
              borderRadius: '8px'
            }}
          />
          <Line
            type="monotone"
            dataKey="velocity"
            stroke="#d05c3d"
            strokeWidth={2}
            dot={{ fill: '#d05c3d', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CompletionTimeChart({ data }: { data: KPIData[] }) {
  const chartData = data
    .slice()
    .reverse()
    .map(kpi => ({
      date: new Date(kpi.period).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      hours: kpi.avg_completion_time
    }))

  return (
    <div className="rounded-lg border border-plum/20 bg-white p-6">
      <h3 className="mb-4 font-semibold text-plum">Avg Completion Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#52224120" />
          <XAxis dataKey="date" stroke="#522241" fontSize={12} />
          <YAxis stroke="#522241" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f6dfb6',
              border: '1px solid #522241',
              borderRadius: '8px'
            }}
          />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="#522241"
            strokeWidth={2}
            dot={{ fill: '#522241', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function calculateTrend(data: KPIData[], field: keyof KPIData): 'up' | 'down' | 'neutral' {
  if (data.length < 2) return 'neutral'

  const recent = data.slice(0, 7)
  const previous = data.slice(7, 14)

  const recentAvg = recent.reduce((sum, kpi) => sum + Number(kpi[field]), 0) / recent.length
  const previousAvg = previous.reduce((sum, kpi) => sum + Number(kpi[field]), 0) / previous.length

  const change = ((recentAvg - previousAvg) / previousAvg) * 100

  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'neutral'
}

// ---

// File: supabase/migrations/001_staff_kpis.sql

-- Create staff KPIs table
CREATE TABLE IF NOT EXISTS staff_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period DATE NOT NULL, -- Daily snapshots

  -- Task metrics (from Plane)
  tasks_completed INT DEFAULT 0,
  tasks_in_progress INT DEFAULT 0,
  tasks_not_started INT DEFAULT 0,

  -- Time metrics
  avg_completion_time INT DEFAULT 0, -- Hours

  -- Velocity metrics
  velocity INT DEFAULT 0, -- Story points per week
  story_points_completed INT DEFAULT 0,

  -- Quality metrics
  tasks_reopened INT DEFAULT 0,

  -- Custom metrics (flexible JSON)
  custom_metrics JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period)
);

-- Indexes
CREATE INDEX idx_staff_kpis_user_period ON staff_kpis(user_id, period DESC);
CREATE INDEX idx_staff_kpis_period ON staff_kpis(period DESC);

-- Row-Level Security
ALTER TABLE staff_kpis ENABLE ROW LEVEL SECURITY;

-- Users can only read their own KPIs
CREATE POLICY "Users can view own KPIs"
  ON staff_kpis FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update (for Plane sync)
CREATE POLICY "Service role can manage all KPIs"
  ON staff_kpis FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_kpis_updated_at
  BEFORE UPDATE ON staff_kpis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to sync Plane metrics (called by cron)
CREATE OR REPLACE FUNCTION sync_plane_metrics()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- For each user, fetch Plane data and update KPIs
  -- (Implementation would use Supabase Edge Functions to call Plane API)

  FOR user_record IN SELECT id FROM auth.users LOOP
    -- This would be implemented as an Edge Function
    -- calling the Plane API for each user
    RAISE NOTICE 'Syncing metrics for user: %', user_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule daily sync (requires pg_cron extension)
-- SELECT cron.schedule('sync-plane-kpis', '0 2 * * *', 'SELECT sync_plane_metrics()');
