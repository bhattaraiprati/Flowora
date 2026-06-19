'use client';

import { Calendar, Users } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    progress: number;
    status: string;
    taskCount: number;
    memberCount: number;
    lastUpdated: string;
    members?: Array<{ initials: string; color: string }>;
  };
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-400' },
  IN_REVIEW: { label: 'In Review', color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', color: 'text-slate-600 bg-slate-100', dot: 'bg-slate-400' },
  PAUSED: { label: 'Paused', color: 'text-purple-600 bg-purple-50', dot: 'bg-purple-400' },
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const sc = statusConfig[project.status] || statusConfig.ACTIVE;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 group-hover:text-brand transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mt-1">{project.description}</p>
          )}
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${sc.color}`}>
          {sc.label}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500">Progress</span>
          <span className="font-medium text-slate-700">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand to-brand-dark rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Users className="w-4 h-4" />
          <span>{project.memberCount} members</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="w-4 h-4" />
          <span className="text-xs">{project.lastUpdated}</span>
        </div>
      </div>

      {/* Members Avatars */}
      {project.members && project.members.length > 0 && (
        <div className="flex -space-x-2 mt-4">
          {project.members.slice(0, 4).map((member: any, i: number) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full ${member.color} text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white`}
            >
              {member.initials}
            </div>
          ))}
          {project.members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              +{project.members.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}