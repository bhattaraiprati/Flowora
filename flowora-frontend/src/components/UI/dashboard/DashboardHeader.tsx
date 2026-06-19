"use client";

import { useState, useRef, useEffect } from "react";
import Logo from "../logo";
import { Settings, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { organizationApi } from "@/lib/api";

const notifications = [
  { id: 1, text: "Anika commented on Sprint #4", time: "2m ago", read: false },
  { id: 2, text: "New member joined Design Team", time: "1h ago", read: false },
  { id: 3, text: "Task 'API Integration' is overdue", time: "3h ago", read: true },
  { id: 4, text: "Rajeev moved a card to Done", time: "Yesterday", read: true },
];

export default function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const params = useParams();
  const router = useRouter();
  const activeOrgId = params.organizationId as string;

  const { data: organizations } = useQuery({
    queryKey: ['myOrganizations'],
    queryFn: organizationApi.getMyOrganizations,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-4 sticky top-0 z-10">
      <div className="flex items-center gap-2 min-w-[180px]">
        <Logo/>
      </div>

      {/* Organization Switcher */}
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
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
          <option disabled>──────────</option>
          <option value="create_new">+ Create New Organization</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>

      {/* Search */}
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
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50">
                <span className="text-sm font-semibold text-slate-700">Notifications</span>
                <button className="text-xs text-brand hover:text-brand-dark font-medium">Mark all read</button>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? "bg-brand-light/40" : ""}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-brand" : "bg-transparent"}`} />
                  <div>
                    <p className="text-sm text-slate-700 leading-snug">{n.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Menu */}
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