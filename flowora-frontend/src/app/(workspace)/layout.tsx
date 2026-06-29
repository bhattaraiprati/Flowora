'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * This layout guards every route inside (workspace):
 *   /dashboard          – onboarding page (no-org state)
 *   /create-organization
 *   /workspace/[id]/…   – has its own nested layout, but this
 *                         catches the group boundary early
 */
export default function WorkspaceGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) 
{
  const { user, clearAuth, isTokenValid } = useAuthStore();
    const router = useRouter();
  
  useEffect(() => {
    if (!isTokenValid()) {
      clearAuth();
      router.replace('/login');
      return;
    }
    console.log("checking the User role in workspace layout", user?.role); // Debugging line
    setTimeout(() => {
      if (user?.role === 'SUPER_ADMIN') {
        console.log("User is super admin, allowing access"); // Debugging line
        router.replace('/super-admin');
      }
    }, 100);
  }, [user, isTokenValid, clearAuth, router]);

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
