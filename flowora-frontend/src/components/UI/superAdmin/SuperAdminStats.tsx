'use client';

import React from 'react';
import {
  Building2,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon: Icon, trend, trendLabel, color, bgColor }: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-3 h-3" />;
    if (trend > 0) return <TrendingUp className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-slate-500 bg-slate-100';
    if (trend > 0) return 'text-green-600 bg-green-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {trendLabel && (
          <p className="text-xs text-slate-500">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}

interface SuperAdminStatsProps {
  stats?: {
    totalOrganizations: number;
    pendingApprovals: number;
    activeUsers: number;
    suspendedOrganizations: number;
    trends?: {
      organizations: number;
      users: number;
      activity: number;
    };
  };
  isLoading: boolean;
}

export default function SuperAdminStats({ stats, isLoading }: SuperAdminStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-8 bg-slate-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Organizations',
      value: stats?.totalOrganizations || 0,
      icon: Building2,
      trend: stats?.trends?.organizations,
      trendLabel: 'vs last month',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: Users,
      trend: stats?.trends?.users,
      trendLabel: 'vs last month',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Suspended Orgs',
      value: stats?.suspendedOrganizations || 0,
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
