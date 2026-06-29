// components/UI/dashboard/RightPanel.tsx
"use client";

import { CreateboardModal } from "@/components/modal/createBoardModal";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { dashboardApi } from "@/lib/api";

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RightPanel() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["dashboard", organizationId],
    queryFn: () => dashboardApi.getDashboard(organizationId),
    enabled: !!organizationId,
  });

  const boards = data?.recentBoards ?? [];

  return (
    <aside className="w-72 shrink-0 hidden lg:flex flex-col gap-4 p-4 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
      {/* Create new board CTA */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -right-2 w-16 h-16 bg-white/5 rounded-full" />
        <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">New Board</p>
        <h3 className="text-base font-semibold leading-snug mb-3">Start a fresh project board</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white text-brand text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Board
        </button>
      </div>

      {/* Recent Boards */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex-1">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">Recent Boards</h2>
          <button
            onClick={() => router.push(`/workspace/${organizationId}/projects`)}
            className="text-xs text-brand hover:text-brand-dark font-medium"
          >
            All projects
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {boards.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">No projects yet</p>
          )}
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => router.push(`/workspace/${organizationId}/projects/${board.id}`)}
              className="px-4 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-slate-800 group-hover:text-brand transition-colors leading-snug">
                  {board.title}
                </p>
              </div>

              {/* Progress bar — real % from task completion */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${board.progress}%`, backgroundColor: board.color }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                  {board.progress}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {board.members.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="w-5 h-5 rounded-full bg-brand text-white text-[8px] font-bold flex items-center justify-center ring-1 ring-white"
                    >
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {board.members.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[8px] font-bold flex items-center justify-center ring-1 ring-white">
                      +{board.members.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatRelativeTime(board.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-50">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-200 text-sm text-slate-400 hover:text-brand hover:border-brand hover:bg-brand-light/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New project
          </button>
        </div>
      </div>

      <CreateboardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        organizationId={organizationId}
      />
    </aside>
  );
}