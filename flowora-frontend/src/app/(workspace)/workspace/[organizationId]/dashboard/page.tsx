'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '@/lib/api';
import MainContent from '@/components/UI/dashboard/MainContent';
import RightPanel from '@/components/UI/dashboard/RightPanel';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { Plus, Users, Building2 } from 'lucide-react';

export default function OrganizationDashboardPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const { user, isTokenValid, clearAuth } = useAuthStore();
  const router = useRouter();

  const { data: organizations, isLoading, isError, error } = useQuery({
    queryKey: ['myOrganizations'],
    queryFn: organizationApi.getMyOrganizations,
    retry: false,
  });

  // Check token validity
  useEffect(() => {
    if (!isTokenValid()) {
      clearAuth();
      router.replace('/login');
    }
  }, [isTokenValid, clearAuth, router]);

  // Handle authentication errors
  useEffect(() => {
    if (isError && error) {
      const axiosError = error as any;
      if (axiosError?.response?.status === 401) {
        clearAuth();
        router.replace('/login');
      }
    }
  }, [isError, error, clearAuth, router]);

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
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-brand" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              No Organization Found
            </h2>
            <p className="text-slate-600 text-lg">
              You don't have access to this organization or it doesn't exist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Organization Card */}
            <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-6 text-white hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                 onClick={() => router.push('/create-organization')}>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Organization</h3>
              <p className="text-white/90 text-sm mb-4">
                Start your own workspace and invite your team to collaborate
              </p>
              <div className="flex items-center text-sm font-medium">
                <span>Get Started</span>
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Join Organization Card */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-brand hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                 onClick={() => router.push('/dashboard')}>
              <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Join Organization</h3>
              <p className="text-slate-600 text-sm mb-4">
                View your invitations or browse organizations you're part of
              </p>
              <div className="flex items-center text-sm font-medium text-brand">
                <span>View Dashboard</span>
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Need Help?
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Check your email for organization invitations</li>
              <li>• Ask your team admin to invite you to the organization</li>
              <li>• Create a new organization if you want to start fresh</li>
            </ul>
          </div>
        </div>
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
