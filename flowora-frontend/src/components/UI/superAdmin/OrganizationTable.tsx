'use client';

import React, { useState } from 'react';
import {
  MoreVertical,
  Eye,
  CheckCircle,
  Ban,
  Trash2,
  Clock,
  Building2,
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  industry: string;
  size: string;
  status: 'pending' | 'approved' | 'suspended';
  memberCount: number;
  projectCount: number;
  createdAt: string;
  adminName: string;
}

interface OrganizationTableProps {
  organizations?: Organization[];
  isLoading: boolean;
}

function StatusBadge({ status }: { status: Organization['status'] }) {
  const config = {
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    suspended: {
      label: 'Suspended',
      icon: Ban,
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };

  const { label, icon: Icon, className } = config[status] || {
    label: 'Unknown',
    icon: AlertCircle,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function ActionMenu({ organization }: { organization: Organization }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: (orgId: string) => superAdminApi.approveOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      setIsOpen(false);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (orgId: string) => superAdminApi.suspendOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
      setIsOpen(false);
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (orgId: string) => superAdminApi.unsuspendOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminStats'] });
      setIsOpen(false);
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-slate-600" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              onClick={() => window.open(`/super-admin/organizations/${organization.id}`, '_blank')}
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>

            {organization.status === 'pending' && (
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-green-600"
                onClick={() => approveMutation.mutate(organization.id)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="w-4 h-4" />
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
            )}

            {organization.status === 'approved' && (
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600"
                onClick={() => suspendMutation.mutate(organization.id)}
                disabled={suspendMutation.isPending}
              >
                <Ban className="w-4 h-4" />
                {suspendMutation.isPending ? 'Suspending...' : 'Suspend'}
              </button>
            )}

            {organization.status === 'suspended' && (
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-green-600"
                onClick={() => unsuspendMutation.mutate(organization.id)}
                disabled={unsuspendMutation.isPending}
              >
                <CheckCircle className="w-4 h-4" />
                {unsuspendMutation.isPending ? 'Unsuspending...' : 'Unsuspend'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrganizationTable({ organizations, isLoading }: OrganizationTableProps) {
  const orgsData: Organization[] = Array.isArray(organizations) 
    ? organizations 
    : (organizations as any)?.organizations || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!orgsData || orgsData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Organizations Found</h3>
        <p className="text-sm text-slate-500">No organizations match your current filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Organization
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Industry
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orgsData.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {org.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-500">@{org.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{org.adminName}</p>
                    <p className="text-xs text-slate-500">{org.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-700">{org.industry}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={org.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{org.memberCount}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(org.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <ActionMenu organization={org} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
