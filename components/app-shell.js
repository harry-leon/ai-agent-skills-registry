'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar.js';
import { Menu, X, Terminal } from 'lucide-react';

export function AppShell({ user, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidebarOpen]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0b0f17] text-slate-100">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:flex shrink-0 h-full">
        <AppSidebar user={user} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0b0f17] z-10 shadow-2xl">
            <div className="absolute top-3.5 right-3.5">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close sidebar"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AppSidebar user={user} onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area - Header removed on desktop */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile-only slim top bar for drawer access */}
        <div className="lg:hidden h-12 border-b border-[#1c2536] bg-[#0b0f17] flex items-center justify-between px-4 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-md border border-[#1c2536] text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/public" className="flex items-center gap-2 font-bold text-sm tracking-tight text-slate-100">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600/15 border border-blue-500/30 text-blue-400">
              <Terminal className="h-3.5 w-3.5" />
            </div>
            <span>Skill<span className="text-blue-400">Vault</span></span>
          </Link>
          <div className="w-8" />
        </div>

        <main className="flex-1 overflow-y-auto w-full">
          <div className="w-full px-6 sm:px-8 lg:px-10 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
