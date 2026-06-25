'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Hash, Users as UsersIcon } from 'lucide-react';
import { chatApi, projectApi, memberApi } from '@/lib/api';
import { ChatMessage } from '@/types/ChatInterface';
import { Project } from '@/types/ProjectInterface';
import { ProjectMember } from '@/types/MemberInterface';
import { useAuthStore } from '@/store/authStore';
import { socketService } from '@/lib/socket';
import ChatMessageComponent from '@/components/UI/chat/ChatMessage';
import ChatInput from '@/components/UI/chat/ChatInput';
import ChatSidebar from '@/components/UI/chat/ChatSidebar';

export default function ProjectChatPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const organizationId = params.organizationId as string;
  const { user, isTokenValid, clearAuth } = useAuthStore();
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAuthChecked = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(undefined);


  // Socket.io connection
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token || !projectId) {
      return;
    }

    const socket = socketService.connect(token);

    const handleConnect = () => {
      setIsSocketConnected(true);
      socketService.joinProject(projectId);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleNewMessage = (newMessage: ChatMessage) => {
      console.log(' New message via socket:', newMessage.id, newMessage.message);
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', projectId], (old = []) => {
        if (newMessage.user_id === user?.id) {
          const tempIndex = old.findIndex(
            (m) => m.id.startsWith('temp-') && m.message === newMessage.message
          );
          if (tempIndex !== -1) {
            const updated = [...old];
            updated[tempIndex] = newMessage;
            return updated;
          }
        }
        // Avoid duplicates
        if (old.some((m) => m.id === newMessage.id)) return old;
        return [...old, newMessage];
      });
      scrollToBottom();
    };

    const handleEditedMessage = ({ messageId, message: updatedMsg }: { messageId: string; message: any }) => {
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', projectId], (old = []) =>
        old.map((msg) => (msg.id === messageId ? { ...msg, message: updatedMsg.message || updatedMsg, is_edited: true } : msg))
      );
    };

    const handleDeletedMessage = ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', projectId], (old = []) =>
        old.filter((msg) => msg.id !== messageId)
      );
    };

    const handleReactionUpdated = ({ messageId, reactions }: { messageId: string; reactions: any[] }) => {
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', projectId], (old = []) =>
        old.map((msg) => (msg.id === messageId ? { ...msg, reactions } : msg))
      );
    };

    const handleTypingUser = ({ userId, userName }: { userId: string; userName: string }) => {
      if (userId !== user?.id) {
        setTypingUsers((prev) => (prev.includes(userName) ? prev : [...prev, userName]));
      }
    };

    const handleTypingStopped = ({ userName }: { userName: string }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== userName));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleEditedMessage);
    socket.on('message:deleted', handleDeletedMessage);
    socket.on('reaction:updated', handleReactionUpdated);
    socket.on('typing:user', handleTypingUser);
    socket.on('typing:stopped', handleTypingStopped);
    // If socket is already connected, join immediately
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socketService.leaveProject(projectId);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleEditedMessage);
      socket.off('message:deleted', handleDeletedMessage);
      socket.off('reaction:updated', handleReactionUpdated);
      socket.off('typing:user', handleTypingUser);
      socket.off('typing:stopped', handleTypingStopped);
    };

      
  }, [projectId, queryClient, user?.id]);

  useEffect(() => {
    if (!isAuthChecked.current && !isTokenValid()) {
      clearAuth();
      router.replace('/login');
    }
    isAuthChecked.current = true;
  }, [isTokenValid, clearAuth, router]);

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: !!projectId,
    retry: false,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', projectId],
    queryFn: () => chatApi.getProjectMessages(projectId),
    enabled: !!projectId,
    refetchOnWindowFocus: false, // Disabled - using Socket.io
  });

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ['members', 'project', projectId],
    queryFn: () => memberApi.getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const sendMessageMutation = useMutation({
  mutationFn: async (data: { message: string; reply_to?: string }) => {
    const socket = socketService.getSocket();
    console.log("here is the socket details", socket, "and", socket?.connected
    )
    if (socket?.connected) {
      const success = await socketService.sendMessage(projectId, data.message);
      if (success) return { sent: 'socket' };
    }

    // Fallback to REST if socket is not connected or failed
    return await chatApi.sendMessage(projectId, {
      message: data.message,
      reply_to: data.reply_to,
    });
  },

  // Optimistic update
  onMutate: async (data) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      project_id: projectId,
      user_id: user!.id,
      message: data.message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
      user: {
        id: user!.id,
        name: user!.name || 'You',
        email: user!.email || '',
      },
      reactions: [],
    } as ChatMessage;

    queryClient.setQueryData<ChatMessage[]>(
      ['chat-messages', projectId],
      (old = []) => [...old, optimisticMessage]
    );

    scrollToBottom();

    return { tempId, optimisticMessage };
  },

  onSuccess: (_, __, context) => {
    setMessage('');
    socketService.stopTyping(projectId);
  },

  onError: (err, __, context) => {
    if (context?.tempId) {
      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', projectId],
        (old = []) => old.filter((m) => m.id !== context.tempId)
      );
    }
    alert('Failed to send message: ' + (err as Error).message);
  },
});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    console.log('Sending message via socket. Connected:', isSocketConnected);
    console.log("here is the message", message)
      sendMessageMutation.mutate({ message: message });
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);

    // Typing indicator
    if (value.length > 0) {
      socketService.startTyping(projectId);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(projectId);
      }, 2000);
    } else {
      socketService.stopTyping(projectId);
    }
  };

  const handleBack = () => {
    router.push(`/workspace/${organizationId}/projects/${projectId}`);
  };

  if (projectLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Project not found</p>
      </div>
    );
  }


  return (
    <div 
    className="flex flex-1 h-screen overflow-hidden bg-slate-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center">
                  <Hash className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">{project.title}</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </p>
                    {isSocketConnected ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        Connecting...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
            >
              <UsersIcon className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mb-4">
                <Hash className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Welcome to #{project.title}
              </h3>
              <p className="text-sm text-slate-500 max-w-md">
                This is the beginning of your project chat. Start a conversation with your team!
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isFirstInGroup =
                  index === 0 || messages[index - 1].user_id !== msg.user_id;
                const isLastInGroup =
                  index === messages.length - 1 ||
                  messages[index + 1].user_id !== msg.user_id;

                return (
                  <ChatMessageComponent
                    key={msg.id}
                    message={msg}
                    isOwn={msg.user_id === user?.id}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="px-3 py-2 text-sm text-slate-500 italic">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ''} are typing...`}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-4 flex-shrink-0">
          <ChatInput
            value={message}
            onChange={handleMessageChange}
            onSend={handleSendMessage}
            placeholder={`Message #${project.title}`}
            disabled={sendMessageMutation.isPending}
          />
        </div>
      </div>

      {/* Right Sidebar - Members */}
      {isSidebarOpen && (
        <ChatSidebar
          members={members}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
