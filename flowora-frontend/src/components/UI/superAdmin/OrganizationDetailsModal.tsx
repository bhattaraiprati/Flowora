'use client';

import {
  X,
  Users,
  Calendar,
  Globe,
  Mail,
  Briefcase,
  Activity,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Clock
} from 'lucide-react';

interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  email: string;
  industry: string;
  size: string;
  website?: string;
  description?: string;
  status: 'pending' | 'approved' | 'suspended';
  createdAt: string;
  adminName: string;
  memberCount: number;
  projectCount: number;
  taskCount: number;
  activityStats: {
    totalLogins: number;
    lastLoginAt: string;
    tasksCompleted: number;
    projectsCreated: number;
  };
}

interface OrganizationDetailsModalProps {
  organization: OrganizationDetails;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrganizationDetailsModal({
  organization,
  isOpen,
  onClose,
}: OrganizationDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl font-bold">
                {organization.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{organization.name}</h2>
                <p className="text-purple-100 text-sm">@{organization.slug}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Basic Information</h3>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Admin Email</p>
                  <p className="text-sm font-medium text-slate-900">{organization.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Industry</p>
                  <p className="text-sm font-medium text-slate-900">{organization.industry}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Organization Size</p>
                  <p className="text-sm font-medium text-slate-900">{organization.size}</p>
                </div>
              </div>

              {organization.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Website</p>
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-purple-600 hover:underline"
                    >
                      {organization.website}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(organization.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Statistics</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <Users className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{organization.memberCount}</p>
                  <p className="text-xs text-slate-600">Members</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <FolderKanban className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{organization.projectCount}</p>
                  <p className="text-xs text-slate-600">Projects</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <CheckSquare className="w-8 h-8 text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{organization.taskCount}</p>
                  <p className="text-xs text-slate-600">Tasks</p>
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <Activity className="w-8 h-8 text-amber-600 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{organization.activityStats.totalLogins}</p>
                  <p className="text-xs text-slate-600">Total Logins</p>
                </div>
              </div>

              <div className="flex items-start gap-3 mt-4 p-4 bg-slate-50 rounded-lg">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Last Activity</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(organization.activityStats.lastLoginAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {organization.description && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-sm text-slate-700">{organization.description}</p>
            </div>
          )}

          {/* Activity Overview */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border border-slate-200 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-slate-900">{organization.activityStats.tasksCompleted}</p>
                <p className="text-xs text-slate-500">Tasks Completed</p>
              </div>
              <div className="text-center p-4 border border-slate-200 rounded-lg">
                <FolderKanban className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-slate-900">{organization.activityStats.projectsCreated}</p>
                <p className="text-xs text-slate-500">Projects Created</p>
              </div>
              <div className="text-center p-4 border border-slate-200 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-slate-900">{organization.activityStats.totalLogins}</p>
                <p className="text-xs text-slate-500">Total Logins</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
