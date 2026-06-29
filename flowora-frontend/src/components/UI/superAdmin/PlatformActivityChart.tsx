'use client';

import React from 'react';
import { Activity, TrendingUp, ArrowUpRight } from 'lucide-react';

interface PlatformActivityChartProps {
  data?: {
    dailyActivity: Array<{
      date: string;
      users: number;
      organizations: number;
      projects: number;
      tasks: number;
    }>;
    summary: {
      totalLogins: number;
      newOrganizations: number;
      newProjects: number;
      newTasks: number;
    };
  };
  isLoading: boolean;
  detailed?: boolean;
}

export default function PlatformActivityChart({ data, isLoading, detailed = false }: PlatformActivityChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-6" />
        <div className="h-64 bg-slate-100 rounded" />
      </div>
    );
  }

  const maxValue = Math.max(...(data?.dailyActivity?.map(d => d.users) || [0]));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Platform Activity</h3>
              <p className="text-sm text-slate-500">Last 7 days overview</p>
            </div>
          </div>
          {data?.summary && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                {data.summary.totalLogins} logins
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Activity Chart */}
        <div className="space-y-4">
          {data?.dailyActivity?.map((day, index) => {
            const percentage = (day.users / maxValue) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-slate-600">{day.users} users</span>
                </div>
                <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end px-3">
                    <span className="text-xs font-semibold text-slate-600">
                      {day.projects} projects · {day.tasks} tasks
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Cards */}
        {detailed && data?.summary && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{data.summary.newOrganizations}</p>
              <p className="text-xs text-slate-500 mt-1">New Organizations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{data.summary.newProjects}</p>
              <p className="text-xs text-slate-500 mt-1">New Projects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{data.summary.newTasks}</p>
              <p className="text-xs text-slate-500 mt-1">New Tasks</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
