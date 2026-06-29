'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/lib/api';
import {
  Building2,
  Activity,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';
import SuperAdminStats from '@/components/UI/superAdmin/SuperAdminStats';
import OrganizationTable from '@/components/UI/superAdmin/OrganizationTable';
import PlatformActivityChart from '@/components/UI/superAdmin/PlatformActivityChart';
import PendingApprovals from '@/components/UI/superAdmin/PendingApprovals';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'activity' | 'approvals'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['superAdminStats'],
    queryFn: superAdminApi.getStats,
  });

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['superAdminOrganizations', filterStatus, searchQuery],
    queryFn: () => superAdminApi.getOrganizations({ status: filterStatus, search: searchQuery }),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['platformActivity'],
    queryFn: () => superAdminApi.getPlatformActivity(),
  });

  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: superAdminApi.getPendingApprovals,
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'activity', label: 'Platform Activity', icon: TrendingUp },
    { id: 'approvals', label: 'Pending Approvals', icon: Clock, badge: pendingApprovals?.count || 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Super Admin Panel</h1>
                <p className="text-sm text-slate-500">Platform Management & Monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">System Healthy</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all relative ${
                    isActive
                      ? 'border-purple-600 text-purple-600 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8 max-w-[1600px] mx-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <SuperAdminStats stats={stats} isLoading={statsLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PlatformActivityChart data={activityData} isLoading={activityLoading} />
              </div>
              <div>
                <PendingApprovals data={pendingApprovals} isLoading={approvalsLoading} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organizations' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <OrganizationTable
              organizations={organizations}
              isLoading={orgsLoading}
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <PlatformActivityChart
              data={activityData}
              isLoading={activityLoading}
              detailed
            />
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <PendingApprovals
              data={pendingApprovals}
              isLoading={approvalsLoading}
              detailed
            />
          </div>
        )}
      </main>
    </div>
  );
}
