'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Mail, Copy, Check, UserPlus, Building2, FolderKanban } from 'lucide-react';
import { inviteApi } from '@/lib/api';
import { MemberRole, InviteScope } from '@/types/MemberInterface';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  projectId?: string;
  defaultScope?: InviteScope;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  organizationId,
  projectId,
  defaultScope = 'PROJECT',
}: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<InviteScope>(defaultScope);
  const [formData, setFormData] = useState({
    email: '',
    role: 'MEMBER' as MemberRole,
  });
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const createInviteMutation = useMutation({
    mutationFn: (data: any) => inviteApi.createInvitation(data),
    onSuccess: (data) => {
      setInviteLink(data.invite_link);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create invitation');
    },
  });

  const handleClose = () => {
    setFormData({ email: '', role: 'MEMBER' });
    setError('');
    setInviteLink('');
    setCopied(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const inviteData: any = {
      email: formData.email.toLowerCase().trim(),
      role: formData.role,
      scope,
      organization_id: organizationId,
    };

    if (scope === 'PROJECT' && projectId) {
      inviteData.project_id = projectId;
    }

    createInviteMutation.mutate(inviteData);
  };

  const handleCopyLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-light rounded-lg">
              <UserPlus className="w-5 h-5 text-brand" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Invite Member</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {inviteLink ? (
            /* Success State - Show Invite Link */
            <div className="space-y-4">
              <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span className="font-medium">Invitation created successfully!</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Invitation Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Share this link with <strong>{formData.email}</strong> to join
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• The recipient will click the invitation link</li>
                  <li>• If registered, they'll join immediately</li>
                  <li>• If not registered, they'll be prompted to sign up</li>
                  <li>• After verification, they'll join automatically</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInviteLink('');
                    setFormData({ email: '', role: 'MEMBER' });
                  }}
                  className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-medium transition-colors"
                >
                  Invite Another
                </button>
              </div>
            </div>
          ) : (
            /* Invite Form */
            <>
              {/* Scope Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Invite To
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {projectId && (
                    <button
                      type="button"
                      onClick={() => setScope('PROJECT')}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        scope === 'PROJECT'
                          ? 'border-brand bg-brand-light'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${scope === 'PROJECT' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className={`font-medium ${scope === 'PROJECT' ? 'text-brand' : 'text-slate-900'}`}>
                          Project Only
                        </div>
                        <div className="text-xs text-slate-500">This project</div>
                      </div>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setScope('ORGANIZATION')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      scope === 'ORGANIZATION'
                        ? 'border-brand bg-brand-light'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${scope === 'ORGANIZATION' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className={`font-medium ${scope === 'ORGANIZATION' ? 'text-brand' : 'text-slate-900'}`}>
                        Organization
                      </div>
                      <div className="text-xs text-slate-500">All projects</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
                    placeholder="colleague@example.com"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as MemberRole })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
                >
                  <option value="VIEWER">Viewer - Can view only</option>
                  <option value="MEMBER">Member - Can create and edit</option>
                  <option value="MANAGER">Manager - Can manage tasks and members</option>
                  {scope === 'ORGANIZATION' && <option value="ADMIN">Admin - Full access</option>}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  {scope === 'PROJECT'
                    ? 'Defines permissions within this project'
                    : 'Defines permissions across the organization'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInviteMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createInviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
