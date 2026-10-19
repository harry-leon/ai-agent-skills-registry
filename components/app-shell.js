'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppSidebar } from '@/components/app-sidebar.js';
import { StackProvider } from '@/components/stack-builder-context.js';
import { StackBuilderDrawer } from '@/components/stack-builder-drawer.js';
import { Menu, X } from 'lucide-react';

export function AppShell({ user, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar collapsed preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('skillvault_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('skillvault_sidebar_collapsed', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

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
    <StackProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#0b0f17] text-slate-100">
        {/* Desktop Fixed Sidebar */}
        <div className="hidden lg:flex shrink-0 h-full transition-all duration-300">
          <AppSidebar
            user={user}
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
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
              <AppSidebar
                user={user}
                isCollapsed={false}
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
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
            <Link
              href="/public"
              className="flex items-center gap-2 font-bold text-sm tracking-tight text-slate-100"
            >
              <div className="relative h-7 w-7 rounded overflow-hidden border border-blue-500/30 bg-blue-500/10 shrink-0 flex items-center justify-center p-0.5">
                <Image
                  src="/logo.png"
                  alt="Skillary Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span>
                Skill<span className="text-blue-400">ary</span>
              </span>
            </Link>
            <div className="w-8" />
          </div>

          <main className="flex-1 overflow-y-auto w-full">
            <div className="w-full px-6 sm:px-8 lg:px-10 py-6">{children}</div>
          </main>
        </div>
        <StackBuilderDrawer />
      </div>
    </StackProvider>
  );
}
