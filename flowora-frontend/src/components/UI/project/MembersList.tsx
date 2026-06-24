'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Shield, Crown, Eye, User, Trash2 } from 'lucide-react';
import { Member, MemberRole } from '@/types/MemberInterface';
import { memberApi } from '@/lib/api';

interface MembersListProps {
  members: Member[];
  projectId?: string;
  organizationId?: string;
  currentUserRole: MemberRole;
  currentUserId: string;
}

const roleConfig: Record<MemberRole, { label: string; color: string; icon: any }> = {
  ADMIN: { label: 'Admin', color: 'text-purple-600 bg-purple-100', icon: Crown },
  MANAGER: { label: 'Manager', color: 'text-blue-600 bg-blue-100', icon: Shield },
  MEMBER: { label: 'Member', color: 'text-emerald-600 bg-emerald-100', icon: User },
  VIEWER: { label: 'Viewer', color: 'text-slate-600 bg-slate-100', icon: Eye },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromEmail(email: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
  ];
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function MembersList({
  members,
  projectId,
  organizationId,
  currentUserRole,
  currentUserId,
}: MembersListProps) {
  const queryClient = useQueryClient();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const canManageMembers = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER';

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => {
      if (projectId) {
        return memberApi.removeProjectMember(projectId, memberId);
      } else if (organizationId) {
        return memberApi.removeOrganizationMember(organizationId, memberId);
      }
      return Promise.reject('No ID provided');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      setOpenMenuId(null);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: MemberRole }) => {
      if (projectId) {
        return memberApi.updateProjectMemberRole(projectId, memberId, role);
      } else if (organizationId) {
        return memberApi.updateOrganizationMemberRole(organizationId, memberId, role);
      }
      return Promise.reject('No ID provided');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      setOpenMenuId(null);
    },
  });

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  const handleRoleChange = (memberId: string, role: MemberRole) => {
    updateRoleMutation.mutate({ memberId, role });
  };

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const role = roleConfig[member.role];
        const RoleIcon = role.icon;
        const isCurrentUser = member.user_id === currentUserId;
        const showMenu = openMenuId === member.id;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              {member.user.profile_picture ? (
                <img
                  src={member.user.profile_picture}
                  alt={member.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full ${getColorFromEmail(member.user.email)} text-white text-sm font-bold flex items-center justify-center`}
                >
                  {getInitials(member.user.name)}
                </div>
              )}

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-900">
                    {member.user.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-slate-500 font-normal">(You)</span>
                    )}
                  </h4>
                </div>
                <p className="text-sm text-slate-500">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${role.color} text-sm font-medium`}>
                <RoleIcon className="w-4 h-4" />
                {role.label}
              </div>

              {/* Actions Menu */}
              {canManageMembers && !isCurrentUser && (
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(showMenu ? null : member.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-600" />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                        {/* Change Role */}
                        <div className="px-3 py-2 text-xs font-medium text-slate-500 border-b border-slate-100">
                          Change Role
                        </div>
                        {Object.entries(roleConfig).map(([roleKey, roleValue]) => {
                          if (roleKey === member.role) return null;
                          if (roleKey === 'ADMIN' && currentUserRole !== 'ADMIN') return null;

                          const Icon = roleValue.icon;
                          return (
                            <button
                              key={roleKey}
                              onClick={() => handleRoleChange(member.id, roleKey as MemberRole)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                            >
                              <Icon className="w-4 h-4 text-slate-600" />
                              <span className="text-sm text-slate-700">{roleValue.label}</span>
                            </button>
                          );
                        })}

                        {/* Remove Member */}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 transition-colors text-left text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm">Remove</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
