// components/UI/dashboard/MainContent.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const priorityConfig: Record<string, { dot: string; text: string; bg: string }> = {
  LOW: { dot: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" },
  MEDIUM: { dot: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50" },
  HIGH: { dot: "bg-orange-400", text: "text-orange-600", bg: "bg-orange-50" },
  URGENT: { dot: "bg-red-400", text: "text-red-600", bg: "bg-red-50" },
};

const statusVerb: Record<string, string> = {
  TODO: "created",
  IN_PROGRESS: "started working on",
  REVIEW: "moved to review",
  DONE: "completed",
};

function formatDueLabel(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const due = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round(
    (new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000
  );
  if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MainContent() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", organizationId],
    queryFn: () => dashboardApi.getDashboard(organizationId),
    enabled: !!organizationId,
  });

  const stats = [
    { label: "Active Projects", value: data?.stats.activeProjects ?? 0 },
    { label: "Tasks Due Today", value: data?.stats.tasksDueToday ?? 0 },
    { label: "Team Members", value: data?.stats.teamMembers ?? 0 },
    { label: "Completed This Week", value: data?.stats.completedThisWeek ?? 0 },
  ];

  if (isLoading) {
    return (
      <main className="flex-1 min-w-0 p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 min-w-0 p-6 space-y-6 overflow-y-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-[22px] font-semibold text-slate-800 tracking-tight">
          Good morning, {user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Here's what's happening across your workspaces.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two-col lower section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {(data?.recentActivity ?? []).length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No recent activity</p>
            )}
            {data?.recentActivity.map((a) => (
              <div
                key={a.taskId}
                onClick={() => router.push(`/workspace/${organizationId}/projects/${a.projectId}`)}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {a.actorName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 leading-snug">
                    <span className="font-medium text-slate-800">{a.actorName}</span>{" "}
                    {statusVerb[a.status] ?? "updated"}{" "}
                    <span className="font-medium text-slate-800">"{a.taskTitle}"</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">{a.projectTitle}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-[11px] text-slate-400">{formatRelativeTime(a.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">My Tasks</h2>
            <button
              onClick={() => router.push(`/workspace/${organizationId}/tasks`)}
              className="text-xs text-brand hover:text-brand-dark font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {(data?.myTasks ?? []).length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">You're all caught up</p>
            )}
            {data?.myTasks.map((t) => {
              const pc = priorityConfig[t.priority] ?? priorityConfig.MEDIUM;
              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/workspace/${organizationId}/projects/${t.project.id}`)}
                  className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded border border-slate-200 group-hover:border-brand mt-0.5 flex-shrink-0 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                          {t.priority.toLowerCase()}
                        </span>
                        <span className="text-[11px] text-slate-400">{t.project.title}</span>
                        <span className="text-[11px] text-slate-400 ml-auto font-medium">
                          {formatDueLabel(t.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}