// app/workspace/[organizationId]/tasks/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Calendar, ChevronRight, Filter, X } from 'lucide-react';
import { taskApi} from '@/lib/api';
import { TaskWithProject } from '@/types/TaskInterface';

// ── Visual config matching your real enum values ──────────────────────────────

const STATUS_CONFIG: Record<TaskWithProject['status'], { label: string; dot: string; bg: string; text: string }> = {
  TODO: { label: 'To Do', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-600' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
  REVIEW: { label: 'Review', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  DONE: { label: 'Done', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

const PRIORITY_CONFIG: Record<TaskWithProject['priority'], { label: string; bg: string; text: string }> = {
  LOW: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-500' },
  MEDIUM: { label: 'Medium', bg: 'bg-blue-50', text: 'text-blue-600' },
  HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-600' },
  URGENT: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-600' },
};

function formatDueDate(dateStr: string | null): { label: string; isOverdue: boolean; isToday: boolean } {
  if (!dateStr) return { label: 'No due date', isOverdue: false, isToday: false };

  const due = new Date(dateStr);
  const now = new Date();
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDateOnly.getTime() - nowDateOnly.getTime()) / 86400000);

  const isOverdue = diffDays < 0;
  const isToday = diffDays === 0;

  if (isToday) return { label: 'Due today', isOverdue: false, isToday: true };
  if (isOverdue) return { label: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true, isToday: false };
  if (diffDays === 1) return { label: 'Due tomorrow', isOverdue: false, isToday: false };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, isOverdue: false, isToday: false };

  return {
    label: `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    isOverdue: false,
    isToday: false,
  };
}

const ALL_STATUSES: TaskWithProject['status'][] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const ALL_PRIORITIES: TaskWithProject['priority'][] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export default function MyTasksPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;

  const [statusFilter, setStatusFilter] = useState<Set<TaskWithProject['status']>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<TaskWithProject['priority']>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { data: tasks = [], isLoading } = useQuery<TaskWithProject[]>({
    queryKey: ['my-tasks', organizationId],
    queryFn: () => taskApi.getMyTasks(organizationId),
    refetchOnWindowFocus: true,
  });

  // Client-side filtering — fast toggle UX without refetching on every click.
  // (Could move to server-side query params for large task counts; fine for now.)
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter.size > 0 && !statusFilter.has(task.status)) return false;
      if (priorityFilter.size > 0 && !priorityFilter.has(task.priority)) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  const toggleStatus = (status: TaskWithProject['status']) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const togglePriority = (priority: TaskWithProject['priority']) => {
    setPriorityFilter((prev) => {
      const next = new Set(prev);
      next.has(priority) ? next.delete(priority) : next.add(priority);
      return next;
    });
  };

  const clearFilters = () => {
    setStatusFilter(new Set());
    setPriorityFilter(new Set());
  };

  const activeFilterCount = statusFilter.size + priorityFilter.size;

  const handleTaskClick = (task: TaskWithProject) => {
    // Navigate to the project — same pattern as your other "open project" flows
    router.push(`/workspace/${organizationId}/projects/${task.project.id}`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-slate-900">My Tasks</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilterCount > 0
                ? 'bg-brand-light text-brand'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-brand text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <p className="text-sm text-slate-500">
          Tasks assigned to you across all projects in this workspace
        </p>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      statusFilter.has(status)
                        ? `${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].text} border-transparent`
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {STATUS_CONFIG[status].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Priority</p>
              <div className="flex flex-wrap gap-2">
                {ALL_PRIORITIES.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => togglePriority(priority)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      priorityFilter.has(priority)
                        ? `${PRIORITY_CONFIG[priority].bg} ${PRIORITY_CONFIG[priority].text} border-transparent`
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {PRIORITY_CONFIG[priority].label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task list — scrolls internally */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
              <Calendar className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">
              {activeFilterCount > 0 ? 'No tasks match your filters' : "You're all caught up"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs">
              {activeFilterCount > 0
                ? 'Try adjusting or clearing your filters.'
                : 'No tasks are currently assigned to you.'}
            </p>
          </div>
        )}

        {!isLoading &&
          filteredTasks.map((task) => {
            const due = formatDueDate(task.due_date);
            const statusCfg = STATUS_CONFIG[task.status];
            const priorityCfg = PRIORITY_CONFIG[task.priority];

            return (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left group"
              >
                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-slate-900 truncate">{task.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{
                        backgroundColor: `${task.project.color}15`,
                        color: task.project.color,
                      }}
                    >
                      {task.project.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${priorityCfg.bg} ${priorityCfg.text}`}>
                      {priorityCfg.label}
                    </span>
                  </div>
                </div>

                {/* Due date */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs font-medium ${
                      due.isOverdue ? 'text-red-600' : due.isToday ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {due.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}