'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Calendar, LayoutGrid, Plus, Users, UserPlus, MessageSquare } from 'lucide-react';
import { projectApi, taskApi, memberApi } from '@/lib/api';
import { Project } from '@/types/ProjectInterface';
import { Task } from '@/types/TaskInterface';
import { ProjectMember } from '@/types/MemberInterface';
import { useAuthStore } from '@/store/authStore';
import KanbanBoard from '@/components/UI/task/KanbanBoard';
import CalendarView from '@/components/UI/task/CalendarView';
import { CreateTaskModal } from '@/components/modal/CreateTaskModal';
import { InviteMemberModal } from '@/components/modal/InviteMemberModal';
import MembersList from '@/components/UI/project/MembersList';

type ViewMode = 'kanban' | 'calendar' | 'members';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const organizationId = params.organizationId as string;
  const { isTokenValid, clearAuth, user } = useAuthStore();

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const isAuthChecked = useRef(false);

  useEffect(() => {
    if (!isAuthChecked.current && !isTokenValid()) {
      clearAuth();
      router.replace('/login');
    }
    isAuthChecked.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: project, isLoading: projectLoading, isError: projectError, error: projectErrorData } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: !!projectId,
    retry: false,
  });

  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError, error: tasksErrorData } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => taskApi.getProjectTasks(projectId),
    enabled: !!projectId,
    retry: false,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<ProjectMember[]>({
    queryKey: ['members', 'project', projectId],
    queryFn: () => memberApi.getProjectMembers(projectId),
    enabled: !!projectId,
    retry: false,
  });

  const handleAuthError = useCallback(() => {
    clearAuth();
    router.replace('/login');
  }, [clearAuth, router]);

  useEffect(() => {
    if ((projectError && projectErrorData) || (tasksError && tasksErrorData)) {
      const axiosError = (projectErrorData || tasksErrorData) as any;
      if (axiosError?.response?.status === 401) {
        handleAuthError();
      } else if (axiosError?.response?.status === 403) {
        router.replace(`/workspace/${organizationId}/projects`);
      }
    }
  }, [projectError, projectErrorData, tasksError, tasksErrorData, handleAuthError, router, organizationId]);

  const handleBack = () => {
    router.push(`/workspace/${organizationId}/projects`);
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (projectError) {
    const axiosError = projectErrorData as any;
    if (axiosError?.response?.status === 403) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-6">You don't have permission to access this project.</p>
            <button
              onClick={handleBack}
              className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-medium transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      );
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Project not found</p>
      </div>
    );
  }

  const currentMember = members.find((m) => m.user_id === user?.id);
  const currentUserRole = currentMember?.role || 'VIEWER';
  const canManageProject = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER';

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{project.title}</h1>
              {project.description && (
                <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/workspace/${organizationId}/projects/${projectId}/chat`)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            {viewMode === 'members' && canManageProject && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl transition-colors font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            )}
            {viewMode !== 'members' && (
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            )}
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'kanban'
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban Board
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'calendar'
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar View
          </button>
          <button
            onClick={() => setViewMode('members')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'members'
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Members
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {members.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'members' ? (
          <div className="h-full p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Project Members</h2>
                <p className="text-sm text-slate-500">
                  Manage who has access to this project and their permissions
                </p>
              </div>
              {membersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-lg mb-4">No members yet</p>
                  {canManageProject && (
                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="text-brand hover:text-brand-dark font-medium"
                    >
                      Invite your first member →
                    </button>
                  )}
                </div>
              ) : (
                <MembersList
                  members={members}
                  projectId={projectId}
                  currentUserRole={currentUserRole}
                  currentUserId={user?.id || ''}
                />
              )}
            </div>
          </div>
        ) : tasksLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard tasks={tasks} projectId={projectId} />
        ) : (
          <CalendarView tasks={tasks} projectId={projectId} />
        )}
      </div>

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={projectId}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationId={organizationId}
        projectId={projectId}
        defaultScope="PROJECT"
      />
    </div>
  );
}
