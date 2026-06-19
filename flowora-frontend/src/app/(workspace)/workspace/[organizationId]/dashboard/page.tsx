'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '@/lib/api';
import MainContent from '@/components/UI/dashboard/MainContent';
import RightPanel from '@/components/UI/dashboard/RightPanel';
import { useAuthStore } from '@/store/authStore';

export default function OrganizationDashboardPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const { user } = useAuthStore();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['myOrganizations'],
    queryFn: organizationApi.getMyOrganizations,
  });

  const activeOrg = organizations?.find((org: any) => org.id === organizationId);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeOrg) {
    return (
      <div className="flex flex-1 items-center justify-center text-red-500">
        Organization not found or you don't have access.
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Optional: Add a top banner indicating the current org and role */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{activeOrg.name} Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-700">{user?.name}</span> • 
            Role: <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-1 text-xs font-medium text-brand ring-1 ring-inset ring-brand/20 ml-2">{activeOrg.memberRole}</span>
          </p>
        </div>
      </div>
      
      <div className="flex flex-1 min-h-0">
        <MainContent />
        <RightPanel />
      </div>
    </div>
  );
}
