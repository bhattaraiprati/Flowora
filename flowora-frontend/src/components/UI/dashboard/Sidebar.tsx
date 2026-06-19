'use client'

import { MessagesSquare } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  {
    label: "Home",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Projects",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
  {
    label: "My Tasks",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    badge: 5,
  },
  {
    label: "Team",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Chat",
    icon: (
      <MessagesSquare />
    ),
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { organizationId } = useParams(); // or get from context/params

  const [active, setActive] = useState("Home");

  // Auto highlight based on current route
  useEffect(() => {
    if (pathname?.includes("/projects")) {
      setActive("Projects");
    } else if (pathname?.includes("/dashboard") || pathname?.endsWith("/")) {
      setActive("Home");
    }
  }, [pathname]);

  const handleNavClick = (label: string) => {
    setActive(label);


    if (label === "Projects") {
      router.push(`/workspace/${organizationId}/projects`);
    } else if (label === "Home") {
      router.push(`/workspace/${organizationId}/dashboard`);
    }
    // Add more routes as needed
  };

  return (
    <aside className="w-56 shrink-0 hidden md:flex scroll-auto flex-col bg-white border-r border-slate-100 h-[calc(100vh-56px)] sticky  overflow-y-auto">
      <div className="p-3 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavClick(item.label)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left group
              ${active === item.label
                ? "bg-brand-light text-brand"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
          >
            <span className={`transition-colors ${active === item.label ? "text-brand" : "text-slate-400 group-hover:text-slate-500"}`}>
              {item.icon}
            </span>
            {item.label}
            {item.badge && (
              <span className="ml-auto bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* <div className="mt-4 px-3">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Workspaces</p>
        {workspaces.map((ws) => (
          <button
            key={ws.name}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all w-full text-left"
          >
            <span className={`w-6 h-6 rounded-md ${ws.color} text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0`}>
              {ws.initials}
            </span>
            {ws.name}
          </button>
        ))}
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-brand hover:bg-brand-light/50 transition-all w-full text-left mt-0.5">
          <span className="w-6 h-6 rounded-md border border-dashed border-slate-300 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          New workspace
        </button>
      </div> */}

      <div className="mt-auto p-3 border-t border-slate-100 mx-3">
        <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all w-full text-left">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>
    </aside>
  );
}