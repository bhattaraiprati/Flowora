'use client';

import React from 'react';
import DashboardHeader from '@/components/UI/dashboard/DashboardHeader';
import Sidebar from '@/components/UI/dashboard/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <DashboardHeader />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
