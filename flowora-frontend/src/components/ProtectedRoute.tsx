'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Wrap any layout or page with this component to guard it.
 * - While Zustand is still rehydrating from localStorage, it shows a loading screen.
 * - Once hydrated, validates the token and redirects to /login if invalid or expired.
 * - Continuously checks token validity to handle mid-session expiration.
 */
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, _hasHydrated, isTokenValid, clearAuth } = useAuthStore();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Wait for hydration
    if (!_hasHydrated) return;

    // Check authentication and token validity
    if (!isAuthenticated || !isTokenValid()) {
      clearAuth();
      router.replace('/login');
      return;
    }

    setIsValidating(false);

    // Set up periodic token validation (every 30 seconds)
    const interval = setInterval(() => {
      if (!isTokenValid()) {
        clearAuth();
        router.replace('/login');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [_hasHydrated, isAuthenticated, isTokenValid, clearAuth, router]);

  // Show loading while hydrating or validating
  if (!_hasHydrated || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → redirect is in flight, render nothing
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
