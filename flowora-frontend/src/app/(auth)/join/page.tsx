'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2, UserPlus } from 'lucide-react';
import { inviteApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Invitation } from '@/types/MemberInterface';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { isTokenValid, user } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'accepted' | 'error'>('loading');
  const hasAccepted = useRef(false);

  const { data: invitation, isLoading, isError } = useQuery<Invitation>({
    queryKey: ['invitation', token],
    queryFn: () => inviteApi.getInvitationByToken(token!),
    enabled: !!token,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => inviteApi.acceptInvitation(token!),
    onSuccess: (data) => {
      setStatus('accepted');
      setTimeout(() => {
        if (data.project_id) {
          router.push(`/workspace/${data.organization_id}/projects/${data.project_id}`);
        } else {
          router.push(`/workspace/${data.organization_id}/dashboard`);
        }
      }, 2000);
    },
    onError: () => {
      setStatus('error');
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    if (isError) {
      setStatus('invalid');
      return;
    }

    if (invitation && !hasAccepted.current) {
      if (invitation.status === 'EXPIRED' || invitation.status === 'REVOKED') {
        setStatus('invalid');
      } else if (invitation.status === 'ACCEPTED') {
        setStatus('accepted');
        if (isTokenValid()) {
          setTimeout(() => {
            if (invitation.project_id) {
              router.push(`/workspace/${invitation.organization_id}/projects/${invitation.project_id}`);
            } else {
              router.push(`/workspace/${invitation.organization_id}/dashboard`);
            }
          }, 2000);
        }
      } else {
        setStatus('valid');
        if (!isTokenValid()) {
          localStorage.setItem('redirect_after_login', `/join?token=${token}`);
          router.push(`/login?redirect=/join?token=${token}`);
        } else if (!hasAccepted.current) {
          hasAccepted.current = true;
          acceptMutation.mutate();
        }
      }
    }
  }, [token, invitation, isError, isTokenValid, router]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-brand mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Verifying Invitation</h2>
            <p className="text-slate-500">Please wait while we check your invitation...</p>
          </div>
        );

      case 'valid':
        return (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-brand mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Accepting Invitation</h2>
            <p className="text-slate-500">Adding you to {invitation?.scope === 'PROJECT' ? 'the project' : 'the organization'}...</p>
          </div>
        );

      case 'accepted':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Welcome Aboard!</h2>
            <p className="text-slate-500 mb-4">
              You've successfully joined {invitation?.scope === 'PROJECT' ? 'the project' : 'the organization'}
            </p>
            <p className="text-sm text-slate-400">Redirecting you...</p>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Invalid Invitation</h2>
            <p className="text-slate-500 mb-6">
              This invitation link is invalid, expired, or has already been used.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-medium transition-colors"
            >
              Go to Login
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Something Went Wrong</h2>
            <p className="text-slate-500 mb-6">
              We couldn't process your invitation. Please try again or contact support.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-medium transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light via-white to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-brand-light rounded-xl">
            <UserPlus className="w-8 h-8 text-brand" />
          </div>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
