// app/workspace/[organizationId]/chats/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Hash, MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { chatApi } from '@/lib/api';
import { ChatRoomSummary } from '@/types/ChatInterface';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AllChatsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  const [search, setSearch] = useState('');

  const { data: chatRooms = [], isLoading } = useQuery<ChatRoomSummary[]>({
    queryKey: ['chat-rooms'],
    queryFn: () => chatApi.getUserChatRooms(),
    refetchOnWindowFocus: true, // refresh when user comes back to tab
  });

  const filteredRooms = chatRooms.filter((room) =>
    room.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenChat = (projectId: string) => {
    router.push(`/workspace/${organizationId}/projects/${projectId}/chat`);
  };

  return (
    // ✅ h-full works here because the layout above now correctly chains
    // h-screen → overflow-hidden → min-h-0 all the way down
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
        <h1 className="text-xl font-semibold text-slate-900 mb-3">Chats</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Chat list — this is the part that scrolls internally */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filteredRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-brand" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">
              {search ? 'No matching chats' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs">
              {search
                ? 'Try a different search term.'
                : 'Join or create a project to start chatting with your team.'}
            </p>
          </div>
        )}

        {!isLoading &&
          filteredRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleOpenChat(room.id)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left"
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: room.color ? `${room.color}20` : '#EEF2FF' }}
              >
                <Hash
                  className="w-5 h-5"
                  style={{ color: room.color || '#6366F1' }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm text-slate-900 truncate">
                    {room.title}
                  </h3>
                  {room.lastMessage && (
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {formatRelativeTime(room.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-sm text-slate-500 truncate">
                    {room.lastMessage
                      ? `${room.lastMessage.senderName}: ${room.lastMessage.text}`
                      : 'No messages yet'}
                  </p>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}