'use client';

import DashboardHeader from '@/components/UI/dashboard/DashboardHeader';
import Sidebar from '@/components/UI/dashboard/Sidebar';
import React, { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 ">
      {/* <DashboardHeader /> */}
      <div className="overflow-hidden">
        {/* <Sidebar /> */}
        {children}
      </div>
    </div>
  );
}