'use client';

import { ChatMessage } from '@/types/ChatInterface';
import { MoreVertical, Reply, Smile, Trash2, Edit3 } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  message: ChatMessage;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
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

function formatMessageTime(date: string): string {
  const now = new Date();
  const msgDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - msgDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  // Show date if older than 24h
  const isToday = msgDate.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === msgDate.toDateString();

  if (isToday) {
    return msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (isYesterday) {
    return 'Yesterday';
  }

  return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChatMessageComponent({
  message,
  isOwn,
  isFirstInGroup,
  isLastInGroup,
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
        isFirstInGroup ? 'mt-4' : 'mt-1'
      }`}
    >
      <div
        className={`flex gap-2 group max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 self-end">
          {isLastInGroup ? (
            message.user.profile_picture ? (
              <img
                src={message.user.profile_picture}
                alt={message.user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full ${getColorFromEmail(
                  message.user.email
                )} text-white text-xs font-bold flex items-center justify-center`}
              >
                {getInitials(message.user.name)}
              </div>
            )
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>

        {/* Message Content */}
        <div className="min-w-0">
          {isFirstInGroup && !isOwn && (
            <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
              <span className="font-semibold text-xs text-slate-600">
                {message.user.name}
              </span>
            </div>
          )}

          <div
            className={`relative px-3 py-2 rounded-2xl ${
              isOwn
                ? 'bg-indigo-500 text-white rounded-br-md'
                : 'bg-slate-100 text-slate-800 rounded-bl-md'
            }`}
          >
            <div className="text-sm break-words whitespace-pre-wrap">
              {message.message}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={`flex items-center gap-2 p-2 rounded-lg w-fit ${
                      isOwn ? 'bg-indigo-400/30' : 'bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      isOwn ? 'bg-indigo-300/30' : 'bg-slate-50'
                    }`}>
                      {attachment.type === 'image' ? '🖼️' : '📎'}
                    </div>
                    <div className="text-xs">
                      <div className={`font-medium ${isOwn ? 'text-white' : 'text-slate-700'}`}>
                        {attachment.name}
                      </div>
                      <div className={isOwn ? 'text-indigo-200' : 'text-slate-400'}>
                        {(attachment.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
              <span className={`text-[10px] ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                {formatMessageTime(message.created_at)}
              </span>
              {message.is_edited && (
                <span className={`text-[10px] ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                  · edited
                </span>
              )}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
              {message.reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs transition-colors border border-slate-200"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-slate-600 font-medium">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-center">
            <button
              className="p-1 hover:bg-slate-200 rounded-md transition-colors"
              title="Add reaction"
            >
              <Smile className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              className="p-1 hover:bg-slate-200 rounded-md transition-colors"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {isOwn && (
              <>
                <button
                  className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  className="p-1 hover:bg-red-100 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </>
            )}
            <button className="p-1 hover:bg-slate-200 rounded-md transition-colors">
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
