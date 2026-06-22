'use client';

import { Calendar, Star, Users } from 'lucide-react';
import { Project } from '@/types/ProjectInterface';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/lib/api';

interface ProjectCardProps {
  project: Project;
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-400' },
  IN_REVIEW: { label: 'In Review', color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', color: 'text-slate-600 bg-slate-100', dot: 'bg-slate-400' },
  PAUSED: { label: 'Paused', color: 'text-purple-600 bg-purple-50', dot: 'bg-purple-400' },
};

// Generate initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Generate consistent color from email
function getColorFromEmail(email: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
  ];
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// Format date to relative time
function formatRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const queryClient = useQueryClient();
  const sc = statusConfig[project.status] || statusConfig.ACTIVE;
  const memberCount = project.members?.length || 0;
  const progress = project.progress || 0;

  const toggleFavoriteMutation = useMutation({
    mutationFn: () => projectApi.toggleFavorite(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', project.org_id] });
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate();
  };

  return (
    <Link href={`/workspace/${project.org_id}/projects/${project.id}`}>
      <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer relative">
        {/* Favorite Star */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 transition-colors z-10"
          aria-label="Toggle favorite"
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              project.is_favorite
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-300 hover:text-yellow-400'
            }`}
          />
        </button>

        {/* Project Color Strip */}
        {project.color && (
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ backgroundColor: project.color }}
          />
        )}

        <div className="flex justify-between items-start mb-4 pr-8">
          <div>
            <h3 className="font-semibold text-lg text-slate-900 group-hover:text-brand transition-colors">
              {project.title}
            </h3>
            {project.description && (
              <p className="text-sm text-slate-500 line-clamp-2 mt-1">{project.description}</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${sc.color}`}>
            {sc.label}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium text-slate-700">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand to-brand-dark rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Users className="w-4 h-4" />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">{formatRelativeTime(project.updated_at)}</span>
          </div>
        </div>

        {/* Members Avatars */}
        {project.members && project.members.length > 0 && (
          <div className="flex -space-x-2 mt-4">
            {project.members.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="relative group/avatar"
                title={member.user.name}
              >
                {member.user.profile_picture ? (
                  <img
                    src={member.user.profile_picture}
                    alt={member.user.name}
                    className="w-7 h-7 rounded-full ring-2 ring-white object-cover"
                  />
                ) : (
                  <div
                    className={`w-7 h-7 rounded-full ${getColorFromEmail(member.user.email)} text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white`}
                  >
                    {getInitials(member.user.name)}
                  </div>
                )}
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
    </Link>
  );
}