'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '@/lib/api';
import Logo from '@/components/UI/logo';
import {  Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function DashboardIndexPage() {
  const router = useRouter();
  const { user, isTokenValid, clearAuth } = useAuthStore();

  const { data: organizations, isLoading, isError, error } = useQuery({
    queryKey: ['myOrganizations'],
    queryFn: organizationApi.getMyOrganizations,
    retry: false,
  });

  // Check token validity before making requests
  useEffect(() => {
    if (!isTokenValid()) {
      clearAuth();
      router.replace('/login');
    }
  }, [isTokenValid, clearAuth, router]);

  useEffect(() => {
    if (organizations && organizations.length > 0) {
      // Redirect to the first organization's dashboard
      router.replace(`/workspace/${organizations[0].id}/dashboard`);
    }
  }, [organizations, router]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // if (isError) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500">
  //       Failed to load workspaces. Please try again.
  //     </div>
  //   );
  // }

  // if (organizations && organizations.length > 0) {
  //   // Return null while redirecting
  //   return null;
  // }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 sticky top-0 z-50">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.name || 'User'}!
            </h1>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              It looks like you don't belong to any organizations yet. Let's get you set up to start collaborating.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <Link href="/create-organization" className="group">
              <div className="h-full bg-white rounded-2xl border border-slate-200 p-8 hover:border-brand hover:shadow-lg transition-all text-center space-y-4">
                <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Create Organization</h3>
                  <p className="text-sm text-slate-500">Start a new workspace for your team or company.</p>
                </div>
              </div>
            </Link>

            <button className="group text-left" onClick={() => alert('Invitation functionality coming soon.')}>
              <div className="h-full bg-white rounded-2xl border border-slate-200 p-8 hover:border-brand hover:shadow-lg transition-all text-center space-y-4 cursor-pointer">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Join Organization</h3>
                  <p className="text-sm text-slate-500">Enter an invite code or accept a pending invitation.</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
