'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

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
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
