'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Logo from '@/components/UI/logo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 font-medium">Checking session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between shrink-0">
        <div className="p-6 space-y-8">
          {/* Logo container */}
          <div className="pt-2">
            <Logo />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <a
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl bg-white/10 text-white transition-colors"
            >
              <span>📊</span> Dashboard
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span>📁</span> Projects
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span>✅</span> My Tasks
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span>⚙️</span> Settings
            </a>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center font-bold text-sm text-white uppercase">
              {user?.name ? user.name.substring(0, 2) : 'US'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-white">{user?.name || 'User'}</p>
              <p className="text-xs truncate text-gray-400 uppercase tracking-wider font-medium">
                {user?.role || 'Member'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all active:scale-[0.985]"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}