'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening across your Flowora workspace today.
          </p>
        </div>
        <button className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-medium shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]">
          + New Project
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">Active Projects</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-gray-900">4</span>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+1 this week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">My Tasks</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-gray-900">12</span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">3 due soon</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">Team Members</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-gray-900">8</span>
            <span className="text-xs font-semibold text-brand bg-brand-light px-2 py-0.5 rounded-full">Active now</span>
          </div>
        </div>
      </div>

      {/* Projects and Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Projects</h2>
          <div className="space-y-4">
            {[
              { name: 'Flowora Web App Redesign', dept: 'Engineering', progress: '75%', color: 'bg-brand' },
              { name: 'Marketing Campaign Q3', dept: 'Marketing', progress: '40%', color: 'bg-amber-500' },
              { name: 'API Security Audit', dept: 'Security', progress: '90%', color: 'bg-emerald-500' },
            ].map((proj, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors">
                <div>
                  <h3 className="font-semibold text-gray-800">{proj.name}</h3>
                  <span className="text-xs text-gray-500">{proj.dept}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">{proj.progress}</span>
                  <div className="w-24 bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className={`h-full ${proj.color}`} style={{ width: proj.progress }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Urgent Tasks</h2>
          <div className="space-y-4">
            {[
              { title: 'Fix auth store token persistence', project: 'Flowora Web App', due: 'Today', priority: 'High', pColor: 'text-red-600 bg-red-50' },
              { title: 'Update project board views', project: 'Flowora Web App', due: 'Tomorrow', priority: 'Medium', pColor: 'text-amber-600 bg-amber-50' },
              { title: 'Draft team onboarding checklist', project: 'Internal', due: 'In 3 days', priority: 'Low', pColor: 'text-blue-600 bg-blue-50' },
            ].map((task, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors">
                <div className="space-y-1">
                  <h3 className="font-medium text-gray-800">{task.title}</h3>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500">{task.project}</span>
                    <span className="text-[10px]">•</span>
                    <span className="text-xs text-gray-500">Due {task.due}</span>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${task.pColor}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
