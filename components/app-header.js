'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Command } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle.js';
import { AuthModal } from '@/components/auth-modal.js';

export function AppHeader({ user, onToggleSidebar }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const handleFocusSearch = () => {
    const input = document.querySelector(
      'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]',
    );
    if (input) {
      input.focus();
    }
  };

  return (
    <header className="h-14 border-b border-[#1c2536] bg-[#0b0f17]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Hamburger menu toggle on mobile */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-md border border-[#1c2536] text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Center: Command Palette Trigger (Linear style) */}
      <div className="flex-1 max-w-sm mx-4 hidden sm:block">
        <button
          type="button"
          onClick={handleFocusSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md border border-[#1c2536] bg-[#111624] text-slate-400 hover:border-slate-700 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <span>Quick search...</span>
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-slate-500 font-mono bg-[#0b0f17] px-1.5 py-0.5 rounded border border-[#1c2536]">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </span>
        </button>
      </div>

      {/* Right: Theme Toggle & User Info / Action */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle className="h-8 w-8 min-h-[32px] min-w-[32px] sm:h-8 sm:w-8 text-xs border-[#1c2536] bg-[#111624] hover:bg-slate-800/60 text-slate-400 hover:text-slate-200" />

        {user ? (
          <Link
            href="/settings"
            prefetch={false}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-md border border-[#1c2536] bg-[#111624] hover:bg-slate-800/60 transition-colors"
          >
            <div className="h-6 w-6 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono text-[11px] font-semibold">
              {user.handle ? user.handle.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-300 hidden md:inline">
              @{user.handle}
            </span>
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs cursor-pointer"
            >
              Sign In
            </button>
            <AuthModal
              isOpen={authModalOpen}
              onClose={() => setAuthModalOpen(false)}
              initialMode="login"
              onSuccess={() => {
                setAuthModalOpen(false);
                window.location.reload();
              }}
            />
          </>
        )}
      </div>
    </header>
  );
}
