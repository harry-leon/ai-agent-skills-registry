'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppSidebar } from '@/components/app-sidebar.js';
import { AuthModal } from '@/components/auth-modal.js';
import { StackProvider } from '@/components/stack-builder-context.js';
import { StackBuilderDrawer } from '@/components/stack-builder-drawer.js';
import { Menu, X } from 'lucide-react';

export function AppShell({ user, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
      <div className="flex h-[100dvh] w-full overflow-hidden bg-[#0b0f17] text-slate-100">
        {/* Desktop Fixed Sidebar */}
        <div className="hidden lg:flex shrink-0 h-full transition-all duration-300">
          <AppSidebar
            user={user}
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        </div>

        {/* Mobile Drawer Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Content */}
            <div className="relative z-10 h-full w-64 max-w-[85vw] bg-[#0b0f17] shadow-2xl animate-in slide-in-from-left duration-200">
              <AppSidebar
                user={user}
                isCollapsed={false}
                onNavigate={() => setMobileSidebarOpen(false)}
                onClose={() => setMobileSidebarOpen(false)}
                onOpenAuthModal={() => {
                  setMobileSidebarOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full border-r border-[#1c2536]"
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Mobile-only slim top bar for drawer access */}
          <div className="lg:hidden h-14 border-b border-[#1c2536] bg-[#0b0f17] flex items-center justify-between px-3 sm:px-4 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Toggle navigation menu"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#1c2536] text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/public"
              prefetch={false}
              className="flex items-center gap-2 font-bold text-sm tracking-tight text-slate-100 active:scale-95 transition-transform"
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
            <div className="flex items-center justify-end">
              {user ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/30">
                  {user.handle?.[0]?.toUpperCase() || 'U'}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex min-h-[36px] items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer active:scale-95 shadow-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          <main className="flex-1 overflow-y-auto w-full">
            <div className="w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">{children}</div>
          </main>
        </div>
        <StackBuilderDrawer />

        {/* Global Auth Modal rendered via Portal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            window.location.reload();
          }}
        />
      </div>
    </StackProvider>
  );
}
