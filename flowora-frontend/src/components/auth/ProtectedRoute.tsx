'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  fallbackUrl?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallbackUrl = '/login',
}: ProtectedRouteProps) {
  const { user, isTokenValid, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isTokenValid()) {
      clearAuth();
      router.replace(fallbackUrl);
      return;
    }

    if (requiredRole) {
      const roleHierarchy = {
        USER: 0,
        ADMIN: 1,
        SUPER_ADMIN: 2,
      };

      const userRoleLevel = roleHierarchy[user?.role || 'USER'];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        router.replace('/dashboard');
      }
    }
  }, [user, requiredRole, isTokenValid, clearAuth, router, fallbackUrl]);

  if (!isTokenValid() || (requiredRole && user?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
