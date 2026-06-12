'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/UI/logo';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col font-sans overflow-x-hidden">
      {/* Top Navbar */}
      <header className="border-b border-gray-100 bg-white/75 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 text-brand">
            {/* We will wrap the Logo with brand styling or use a custom color */}
            <div className="bg-brand rounded-xl p-0.5">
              <Logo />
            </div>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark transition-all shadow-sm active:scale-[0.98]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-650 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?tab=register"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark transition-all shadow-sm active:scale-[0.98]"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-brand-light text-brand-dark text-xs font-semibold px-4 py-1.5 rounded-full">
            <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
            Introducing Flowora PM v1.0
          </div>
          <h1 className="text-5xl sm:text-6.5xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
            Where projects <span className="text-brand">flow</span>,<br />
            and teams <span className="italic font-serif font-normal text-brand-mid">thrive</span>.
          </h1>
          <p className="text-lg sm:text-xl text-gray-550 max-w-2xl mx-auto leading-relaxed">
            Flowora streamlines your team's workflow. Assign tasks, track progress with Kanban boards, and collaborate in real-time, all in one place.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/login?tab=register"}
              className="px-8 py-4 rounded-xl font-bold bg-brand text-white hover:bg-brand-dark transition-all shadow-md active:scale-[0.985] text-base"
            >
              Start Project Management Free
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="bg-gray-50 border-y border-gray-100 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything you need to deliver on time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-light text-brand flex items-center justify-center font-bold text-xl">
                  📋
                </div>
                <h3 className="text-xl font-bold text-gray-900">Visual Kanban Boards</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Drag and drop tasks through custom workflow columns. Monitor workloads and blockers instantly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-light text-brand flex items-center justify-center font-bold text-xl">
                  📅
                </div>
                <h3 className="text-xl font-bold text-gray-900">Unified Calendar</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Track project deadlines and milestones across all tasks. Stay aligned on delivery dates effortlessly.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-light text-brand flex items-center justify-center font-bold text-xl">
                  💬
                </div>
                <h3 className="text-xl font-bold text-gray-900">Real-Time Team Chat</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Discuss project status directly. Receive prompt updates and notifications without leaving the app.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Flowora PM. All rights reserved.</p>
      </footer>
    </div>
  );
}