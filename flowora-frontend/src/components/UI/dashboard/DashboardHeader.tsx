// components/UI/dashboard/DashboardHeader.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Logo from "../logo";
import { Settings, User, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationApi, notificationApi } from "@/lib/api";
import { Notification } from "@/types/NotificationInterface";
import { notificationSocketService } from "@/lib/notificationSocket";

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ✅ Maps reference_type + reference_id to a route.
// Adjust the TASK/CHAT paths if your actual routes differ — these match
// the project/task and project-chat routes built earlier in this project.
function getNotificationRoute(
  notification: Notification,
  organizationId: string,
  projectIdFromMetadata?: string
): string | null {
  const { reference_type, reference_id, metadata } = notification;

  if (!reference_type || !reference_id) return null;

  switch (reference_type) {
    case 'TASK': {
      // Tasks live inside a project — metadata should carry project_id
      // (set this when creating the notification on the backend)
      const projectId = metadata?.project_id || projectIdFromMetadata;
      if (!projectId) return null;
      return `/workspace/${organizationId}/projects/${projectId}`;
    }
    case 'PROJECT':
      return `/workspace/${organizationId}/projects/${reference_id}`;
    case 'CHAT':
      return `/workspace/${organizationId}/projects/${reference_id}/chat`;
    case 'INVITATION':
      return `/invitations/${reference_id}`;
    default:
      return null;
  }
}

export default function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const params = useParams();
  const router = useRouter();
  const activeOrgId = params.organizationId as string;
  const queryClient = useQueryClient();

  const { data: organizations } = useQuery({
    queryKey: ['myOrganizations'],
    queryFn: organizationApi.getMyOrganizations,
  });

  // ── Initial load via REST ───────────────────────────────────────────────────
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(1, 20),
    refetchOnWindowFocus: false, // socket handles live updates
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchOnWindowFocus: false,
  });

  const notifications = notificationsData?.data ?? [];
  const unreadCount = unreadData?.count ?? 0;

  // ── WebSocket: live updates ──────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = notificationSocketService.connect(token);

    const handleNewNotification = (notification: Notification) => {
      // Prepend new notification to the cached list
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return { ...old, data: [notification, ...old.data] };
      });
      // Bump unread count locally — socket may also emit unread_count separately
      queryClient.setQueryData(['notifications-unread-count'], (old: any) => ({
        count: (old?.count ?? 0) + 1,
      }));
    };

    const handleUnreadCount = ({ count }: { count: number }) => {
      queryClient.setQueryData(['notifications-unread-count'], { count });
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:unread_count', handleUnreadCount);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:unread_count', handleUnreadCount);
    };
  }, [queryClient]);

  // ── Click-outside handling (unchanged) ───────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handleMarkAllRead = useCallback(async () => {
    // Optimistic update
    queryClient.setQueryData(['notifications'], (old: any) => {
      if (!old) return old;
      return { ...old, data: old.data.map((n: Notification) => ({ ...n, is_read: true })) };
    });
    queryClient.setQueryData(['notifications-unread-count'], { count: 0 });

    // Prefer socket if connected (instant + syncs other open tabs via server broadcast)
    const socket = notificationSocketService.getSocket();
    if (socket?.connected) {
      notificationSocketService.markAllAsRead();
    } else {
      await notificationApi.markAllAsRead();
    }
  }, [queryClient]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Mark as read (optimistic)
      if (!notification.is_read) {
        queryClient.setQueryData(['notifications'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n: Notification) =>
              n.id === notification.id ? { ...n, is_read: true } : n
            ),
          };
        });
        queryClient.setQueryData(['notifications-unread-count'], (old: any) => ({
          count: Math.max(0, (old?.count ?? 1) - 1),
        }));

        const socket = notificationSocketService.getSocket();
        if (socket?.connected) {
          notificationSocketService.markAsRead(notification.id);
        } else {
          notificationApi.markAsRead(notification.id);
        }
      }

      setShowNotifications(false);

      // Navigate based on reference_type + reference_id
      const route = getNotificationRoute(notification, activeOrgId);
      if (route) {
        router.push(route);
      }
    },
    [queryClient, activeOrgId, router]
  );

  const handleDeleteNotification = useCallback(
    (e: React.MouseEvent, notificationId: string) => {
      e.stopPropagation(); // don't trigger handleNotificationClick

      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return { ...old, data: old.data.filter((n: Notification) => n.id !== notificationId) };
      });

      const socket = notificationSocketService.getSocket();
      if (socket?.connected) {
        notificationSocketService.deleteNotification(notificationId);
      } else {
        notificationApi.deleteNotification(notificationId);
      }
    },
    [queryClient]
  );

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-4 sticky top-0 z-10">
      <div className="flex items-center gap-2 min-w-[180px]">
        <Logo/>
      </div>

      {/* Organization Switcher — unchanged */}
      <div className="relative">
        <select
          className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent cursor-pointer"
          value={activeOrgId || ''}
          onChange={(e) => {
            if (e.target.value === 'create_new') {
              router.push('/create-organization');
            } else if (e.target.value) {
              router.push(`/workspace/${e.target.value}/dashboard`);
            }
          }}
        >
          {organizations?.map((org: any) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
          <option disabled>──────────</option>
          <option value="create_new">+ Create New Organization</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>

      {/* Search — unchanged */}
      <div className={`flex-1 max-w-md mx-auto transition-all duration-200 ${searchFocused ? "max-w-lg" : ""}`}>
        <div className={`relative flex items-center bg-slate-50 rounded-lg border transition-all duration-200 ${searchFocused ? "border-brand shadow-[0_0_0_3px_rgba(16,122,196,0.1)]" : "border-slate-200"}`}>
          <svg className="absolute left-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search projects, tasks, members…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-9 pr-4 py-2 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none rounded-lg"
          />
          <kbd className="absolute right-3 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hidden sm:block">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5M9 17H4l1.405-1.405A2.032 2.032 0 006 14.158V11a6 6 0 016-6M13 21a1 1 0 01-2 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50 sticky top-0 bg-white">
                <span className="text-sm font-semibold text-slate-700">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand hover:text-brand-dark font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No notifications yet
                </div>
              )}

              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group flex gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                    !n.is_read ? "bg-brand-light/40" : ""
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? "bg-brand" : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 leading-snug truncate">{n.title}</p>
                    <p className="text-xs text-slate-500 leading-snug mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteNotification(e, n.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-md transition-all flex-shrink-0 self-start"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Menu — unchanged */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-xs font-semibold">
              P
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">Pratik</span>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-50 mb-1">
                <p className="text-sm font-semibold text-slate-800">Pratik</p>
                <p className="text-xs text-slate-400">pratik@flowora.io</p>
              </div>
              {[
                { icon: User, label: "View Profile" },
                { icon: Settings, label: "Settings" },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              <div className="border-t border-slate-50 mt-1 pt-1">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}