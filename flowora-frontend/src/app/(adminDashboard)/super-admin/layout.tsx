'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/UI/logo';
import { Shield, LogOut } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth, isTokenValid } = useAuthStore();
  const router = useRouter();

  useEffect(() => {

    console.log("is token valid ", isTokenValid()); // Debugging line
    if (!isTokenValid()) {
      clearAuth();
      router.replace('/login');
      return;
    }

    // Check if user has super admin role
    console.log("checking the User role:", user?.role); // Debugging line
    setTimeout(() => {
      if (user?.role !== 'SUPER_ADMIN') {
        console.log("User is not super admin, redirecting to dashboard"); // Debugging line
        router.replace('/dashboard');
      }
    }, 100); // Delay to ensure user state is updated
    // if (user?.role !== 'SUPER_ADMIN') {
    //   router.replace('/dashboard');
    // }
  }, [user, isTokenValid, clearAuth, router]);

  const handleLogout = async () => {
    clearAuth();
    router.push('/login');
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br rounded-xl p-1">
              <Logo />
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-slate-900">Super Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-purple-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
