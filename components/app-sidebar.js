'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';
import {
  Library,
  Bookmark,
  Compass,
  PlusCircle,
  DownloadCloud,
  Settings,
  LogOut,
  Terminal,
  User,
  LogIn,
} from 'lucide-react';

export function AppSidebar({ user, onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  const navSections = [
    {
      title: 'EXPLORE',
      items: [
        {
          href: '/public',
          label: 'Community Skills',
          icon: Compass,
          requireAuth: false,
        },
      ],
    },
    {
      title: 'WORKSPACE',
      items: [
        {
          href: '/dashboard',
          label: 'My Skills',
          icon: Library,
          requireAuth: true,
        },
        {
          href: '/favorites',
          label: 'Favorites',
          icon: Bookmark,
          requireAuth: true,
        },
      ],
    },
    {
      title: 'MANAGE',
      items: [
        {
          href: '/skills/new',
          label: 'New Skill',
          icon: PlusCircle,
          requireAuth: true,
        },
        {
          href: '/import',
          label: 'Import from GitHub',
          icon: DownloadCloud,
          requireAuth: true,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 flex flex-col h-full bg-[#0b0f17] border-r border-[#1c2536] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#1c2536] justify-between">
        <Link
          href="/public"
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 shrink-0">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm tracking-tight text-slate-100 whitespace-nowrap">
              Skill<span className="text-blue-400">Vault</span>
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#161d2d] text-slate-400 border border-[#1c2536] leading-none">
              v0.1
            </span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => !item.requireAuth || !!user);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' &&
                      item.href !== '/public' &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        isActive
                          ? 'border-l-2 border-blue-500 bg-blue-500/[0.08] text-slate-100 font-semibold'
                          : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-blue-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Section at Bottom */}
      <div className="p-3 border-t border-[#1c2536] bg-[#0b0f17]">
        {user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-[#111624] border border-[#1c2536]">
            <Link
              href="/settings"
              onClick={onNavigate}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              <div className="h-7 w-7 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                {user.handle ? user.handle.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate">@{user.handle}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <Link
                href="/settings"
                onClick={onNavigate}
                title="Account Settings"
                aria-label="Account Settings"
                className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md border border-[#1c2536] bg-[#111624] text-xs font-semibold text-slate-200 hover:bg-slate-800/60 hover:text-white transition-colors"
          >
            <LogIn className="h-3.5 w-3.5 text-blue-400" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
