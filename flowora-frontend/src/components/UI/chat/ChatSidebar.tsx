'use client';

import { ProjectMember } from '@/types/MemberInterface';
import { X, UserPlus, Search } from 'lucide-react';
import { useState } from 'react';

interface ChatSidebarProps {
  members: ProjectMember[];
  onClose: () => void;
}

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

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  MANAGER: 'bg-purple-100 text-purple-700',
  MEMBER: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-slate-100 text-slate-600',
};

export default function ChatSidebar({ members, onClose }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter((member) =>
    member.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-l border-slate-100 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Members ({members.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">No members found</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {member.user.profile_picture ? (
                  <img
                    src={member.user.profile_picture}
                    alt={member.user.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-lg ${getColorFromEmail(
                      member.user.email
                    )} text-white text-sm font-bold flex items-center justify-center`}
                  >
                    {getInitials(member.user.name)}
                  </div>
                )}
                {/* Online Status Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {member.user.name}
                  </p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      roleColors[member.role]
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{member.user.email}</p>
              </div>

              {/* Message Button on Hover */}
              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-brand hover:bg-brand-light p-1.5 rounded-lg">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-100">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-light text-brand rounded-lg hover:bg-brand hover:text-white transition-colors font-medium text-sm">
          <UserPlus className="w-4 h-4" />
          Invite Members
        </button>
      </div>
    </div>
  );
}
