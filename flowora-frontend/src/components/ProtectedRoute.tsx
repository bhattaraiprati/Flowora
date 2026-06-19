'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { NextResponse } from 'next/server';

/**
 * Wrap any layout or page with this component to guard it.
 * - While Zustand is still rehydrating from localStorage, it shows a blank
 *   loading screen so there is no flash of protected content.
 * - Once hydrated, if the user is not authenticated it immediately redirects
 *   to /login (the 401 axios interceptor handles mid-session expiry, this
 *   component handles the "cold" case – user opens a protected URL directly).
 */
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Only act after the persist store has finished rehydrating
    // if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Show nothing until we know the auth state to avoid a flash
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → redirect is in flight, render nothing
  if (!isAuthenticated) {
    // return null;
    // NextResponse.
  }

  return <>{children}</>;
}
