"use client";

const stats = [
  { label: "Active Projects", value: "12", delta: "+2 this week", up: true, color: "from-brand to-brand-dark", pulse: true },
  { label: "Tasks Due Today", value: "7", delta: "3 completed", up: false, color: "from-amber-400 to-orange-500", pulse: false },
  { label: "Team Members", value: "24", delta: "+1 joined", up: true, color: "from-emerald-400 to-teal-500", pulse: false },
  { label: "Completed This Week", value: "38", delta: "↑ 12% vs last", up: true, color: "from-purple-400 to-violet-500", pulse: false },
];

const recentActivity = [
  { user: "Anika S.", action: "moved", item: "API Integration", to: "In Review", project: "Flowora Backend", time: "2m ago", avatar: "AS", color: "bg-pink-400" },
  { user: "You", action: "created", item: "Sprint #5 Planning", to: "Backlog", project: "Flowora Frontend", time: "18m ago", avatar: "P", color: "bg-brand" },
  { user: "Rohan K.", action: "commented on", item: "Design System v2", to: "", project: "Design Team", time: "45m ago", avatar: "RK", color: "bg-emerald-400" },
  { user: "Meera J.", action: "completed", item: "User Auth Flow", to: "Done", project: "MediQ", time: "1h ago", avatar: "MJ", color: "bg-purple-400" },
  { user: "You", action: "updated", item: "DB Schema", to: "In Progress", project: "Flowora Backend", time: "2h ago", avatar: "P", color: "bg-brand" },
];

const upcomingTasks = [
  { title: "Review PR #42 — Auth Module", due: "Today", priority: "high", project: "Flowora" },
  { title: "Finalize wireframes for onboarding", due: "Tomorrow", priority: "medium", project: "Design" },
  { title: "Write BullMQ queue integration tests", due: "Jun 18", priority: "medium", project: "Flowora" },
  { title: "Update MediQ README", due: "Jun 20", priority: "low", project: "MediQ" },
];

const priorityConfig: Record<string, { dot: string; text: string; bg: string }> = {
  high: { dot: "bg-red-400", text: "text-red-600", bg: "bg-red-50" },
  medium: { dot: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50" },
  low: { dot: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" },
};

export default function MainContent() {
  return (
    <main className="flex-1 min-w-0 p-6 space-y-6 overflow-y-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-[22px] font-semibold text-slate-800 tracking-tight">Good morning, Pratik</h1>
        <p className="text-sm text-slate-400 mt-0.5">Here's what's happening across your workspaces.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">{s.value}</p>
              </div>
              {/* <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 relative`}>
                {s.pulse && (
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand to-brand-dark animate-pulse opacity-40" />
                )}
                <span className="w-3 h-3 bg-white/70 rounded-sm relative z-10" />
              </div> */}
            </div>
            <p className={`text-xs mt-2 font-medium ${s.up ? "text-emerald-500" : "text-amber-500"}`}>
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Two-col lower section */}
      <div className="grid grid-cols-0  ">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Recent Activity - Last(5)</h2>
            {/* <button className="text-xs text-brand hover:text-brand-dark font-medium">View all</button> */}
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                <div className={`w-7 h-7 rounded-full ${a.color} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {a.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 leading-snug">
                    <span className="font-medium text-slate-800">{a.user}</span>
                    {" "}{a.action}{" "}
                    <span className="font-medium text-slate-800">"{a.item}"</span>
                    {a.to && <> → <span className="text-brand font-medium">{a.to}</span></>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">{a.project}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-[11px] text-slate-400">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        {/* <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">My Tasks</h2>
            <button className="text-xs text-brand hover:text-brand-dark font-medium">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingTasks.map((t, i) => (
              <div key={i} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded border border-slate-200 group-hover:border-brand mt-0.5 flex-shrink-0 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${priorityConfig[t.priority].bg} ${priorityConfig[t.priority].text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[t.priority].dot}`} />
                        {t.priority}
                      </span>
                      <span className="text-[11px] text-slate-400">{t.project}</span>
                      <span className="text-[11px] text-slate-400 ml-auto font-medium">{t.due}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </main>
  );
}