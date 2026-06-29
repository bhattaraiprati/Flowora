'use client';

import React from 'react';
import { Clock, CheckCircle, XCircle, Building2, Mail, Calendar, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';

interface PendingApproval {
  id: string;
  organizationName: string;
  adminName: string;
  email: string;
  industry: string;
  createdAt: string;
  website?: string;
}

interface PendingApprovalsProps {
  data?: {
    count: number;
    organizations: PendingApproval[];
  };
  isLoading: boolean;
  detailed?: boolean;
}

export default function PendingApprovals({ data, isLoading, detailed = false }: PendingApprovalsProps) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: (orgId: string) => superAdminApi.approveOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (orgId: string) => superAdminApi.rejectOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Pending Approvals</h3>
              <p className="text-sm text-slate-500">
                {data?.count || 0} organization{(data?.count || 0) !== 1 ? 's' : ''} awaiting review
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!data?.organizations || data.organizations.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-500 mt-1">No pending approvals at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.organizations.slice(0, detailed ? undefined : 3).map((org) => (
              <div
                key={org.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {org.organizationName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{org.organizationName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{org.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(org.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600">Admin:</span>
                    <span className="font-medium text-slate-900">{org.adminName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">{org.email}</span>
                  </div>
                  {org.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">Website:</span>
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline"
                      >
                        {org.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveMutation.mutate(org.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(org.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}

            {!detailed && data.organizations.length > 3 && (
              <button className="w-full py-3 text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center justify-center gap-2 border border-slate-200 rounded-lg hover:border-purple-300 transition-colors">
                View All {data.count} Approvals
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
