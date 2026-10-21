'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';
import {
  Library,
  Bookmark,
  Compass,
  PlusCircle,
  DownloadCloud,
  Settings,
  KeyRound,
  LogOut,
  Terminal,
  User,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Bot,
  ChevronRight,
  SlidersHorizontal,
  Link2,
  CloudDownload,
  Code2,
  Package,
  X,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/github.js';
import { AuthModal } from '@/components/auth-modal.js';
import { ComponentGuideModal } from '@/components/component-guide-modal.js';
import { HelpCircle, Info } from 'lucide-react';

export function AppSidebar({
  user,
  isCollapsed = false,
  onToggleCollapse,
  onNavigate,
  onClose,
  onOpenAuthModal,
  className = '',
}) {
  const pathname = usePathname();
  const [currentType, setCurrentType] = useState('skills');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCurrentType(params.get('type') || 'skills');
    }
  }, [pathname]);

  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push('/public');
    router.refresh();
  }

  const navSections = [
    {
      title: 'COMMUNITY',
      items: [
        {
          href: '/public?type=skills',
          label: 'Skills',
          icon: Layers,
          count: '891',
          typeKey: 'skills',
          requireAuth: false,
        },
        {
          href: '/public?type=agents',
          label: 'Agents',
          icon: Bot,
          count: '422',
          typeKey: 'agents',
          requireAuth: false,
        },
        {
          href: '/public?type=commands',
          label: 'Commands',
          icon: ChevronRight,
          count: '288',
          typeKey: 'commands',
          requireAuth: false,
        },
        {
          href: '/public?type=settings',
          label: 'Settings',
          icon: SlidersHorizontal,
          count: '76',
          typeKey: 'settings',
          requireAuth: false,
        },
        {
          href: '/public?type=hooks',
          label: 'Hooks',
          icon: Link2,
          count: '63',
          typeKey: 'hooks',
          requireAuth: false,
        },
        {
          href: '/public?type=mcps',
          label: 'MCPs',
          icon: CloudDownload,
          count: '107',
          typeKey: 'mcps',
          requireAuth: false,
        },
        {
          href: '/public?type=mods',
          label: 'Mods',
          icon: Code2,
          count: '44',
          typeKey: 'mods',
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
          label: 'New Skill / Component',
          icon: PlusCircle,
          requireAuth: true,
        },
        {
          href: '/import',
          label: 'Import from GitHub',
          icon: DownloadCloud,
          requireAuth: true,
        },
        {
          href: '/about',
          label: 'About',
          icon: Info,
          requireAuth: false,
        },
      ],
    },
  ];

  return (
    <aside
      className={`flex flex-col h-full bg-[#0b0f17] border-r border-[#1c2536] text-slate-300 select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Brand Header */}
      <div
        className={`h-14 flex items-center border-b border-[#1c2536] transition-all px-3.5 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <Link
          href="/public"
          prefetch={false}
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity"
          title="Skillary Home"
        >
          <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-blue-500/30 bg-blue-500/10 shrink-0 flex items-center justify-center p-0.5 shadow-sm">
            <Image
              src="/logo.png"
              alt="Skillary Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 min-w-0 animate-in fade-in duration-200">
              <span className="font-bold text-sm tracking-tight text-slate-100 whitespace-nowrap">
                Skill<span className="text-blue-400">ary</span>
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#161d2d] text-blue-300 border border-[#1c2536] leading-none">
                v1.0
              </span>
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button (Desktop Only) */}
        {onToggleCollapse && !isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}

        {/* Close Drawer Button (Mobile Only) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close menu"
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {onToggleCollapse && isCollapsed && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {navSections.map((section) => {
          return (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-500 uppercase animate-in fade-in duration-150">
                  <span>{section.title}</span>
                  {section.title === 'COMMUNITY' && (
                    <button
                      type="button"
                      onClick={() => setGuideModalOpen(true)}
                      title="View components classification guide"
                      className="inline-flex items-center gap-1 text-[10px] lowercase tracking-normal text-blue-400 hover:text-blue-300 transition-colors cursor-pointer normal-case"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Guide</span>
                    </button>
                  )}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isPublic = pathname === '/public';
                  const isActive = item.typeKey
                    ? isPublic && currentType === item.typeKey
                    : pathname === item.href ||
                      (item.href !== '/dashboard' &&
                        item.href !== '/public' &&
                        pathname.startsWith(item.href));

                  const Icon = item.icon;
                  const isLocked = item.requireAuth && !user;
                  const targetHref = isLocked ? '#' : item.href;

                  return (
                    <div key={item.href} className="relative group">
                      <Link
                        href={targetHref}
                        prefetch={false}
                        onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault();
                            setAuthModalOpen(true);
                            if (onNavigate) onNavigate(e);
                            return;
                          }
                          if (item.typeKey) {
                            setCurrentType(item.typeKey);
                            if (typeof window !== 'undefined') {
                              window.dispatchEvent(
                                new CustomEvent('nav-type-change', { detail: item.typeKey }),
                              );
                            }
                          }
                          if (onNavigate) onNavigate(e);
                        }}
                        className={`flex items-center rounded-md transition-colors ${
                          isCollapsed
                            ? 'justify-center p-2.5 mx-auto'
                            : 'justify-between px-3 py-2 text-xs font-medium'
                        } ${
                          isActive
                            ? 'border-l-2 border-blue-500 bg-blue-500/[0.12] text-slate-100 font-semibold'
                            : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive
                                ? 'text-blue-400'
                                : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && item.count && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                              isActive
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 font-semibold'
                                : 'bg-[#111624] text-slate-500 border-[#1c2536] group-hover:text-slate-400'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}

                        {!isCollapsed && item.requireAuth && !user && (
                          <span className="text-[10px] text-slate-600 group-hover:text-slate-400 font-mono transition-colors">
                            Lock
                          </span>
                        )}
                      </Link>

                      {/* Floating Tooltip when Collapsed */}
                      {isCollapsed && (
                        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#162035] border border-[#1f2d48] text-xs font-semibold text-slate-100 shadow-xl whitespace-nowrap z-50 animate-in fade-in duration-150">
                          <span>{item.label}</span>
                          {item.requireAuth && !user && (
                            <span className="text-[10px] text-amber-400 font-mono">
                              (Login required)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Section at Bottom */}
      <div className="p-2 border-t border-[#1c2536] bg-[#0b0f17] space-y-1.5">
        {/* GitHub Repo Button (Placed above Sign In / User Profile) */}
        <a
          href="https://github.com/harry-leon/ai-agent-skills-registry"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
          className={`flex items-center rounded-md border border-[#1c2536] bg-[#111624] text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 hover:border-slate-700 transition-colors ${
            isCollapsed ? 'justify-center p-2' : 'gap-2.5 w-full py-2 px-3'
          }`}
        >
          <GithubIcon className="h-4 w-4 text-slate-400 group-hover:text-white shrink-0" />
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">GitHub Repo</span>
              <span className="text-[10px] font-mono text-slate-500 bg-[#0b0f17] px-1.5 py-0.5 rounded border border-[#1c2536]">
                ★ Star
              </span>
            </div>
          )}
        </a>

        {user ? (
          <div
            className={`flex items-center rounded-md bg-[#111624] border border-[#1c2536] ${
              isCollapsed ? 'justify-center p-1.5' : 'justify-between gap-2 p-2'
            }`}
          >
            <Link
              href="/settings"
              prefetch={false}
              onClick={onNavigate}
              title={`@${user.handle}`}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              <div className="h-7 w-7 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                {user.handle ? user.handle.slice(0, 2).toUpperCase() : 'U'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">@{user.handle}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href="/change-password"
                  prefetch={false}
                  onClick={onNavigate}
                  title="Change Password"
                  aria-label="Change Password"
                  className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/settings"
                  prefetch={false}
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
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (onOpenAuthModal) {
                onOpenAuthModal();
              } else {
                setAuthModalOpen(true);
              }
            }}
            title="Sign In"
            className={`flex items-center justify-center min-h-[44px] rounded-xl border border-blue-500/30 bg-blue-600/10 text-xs font-semibold text-blue-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer ${
              isCollapsed ? 'p-2' : 'gap-2 w-full py-2.5 px-3'
            }`}
          >
            <LogIn className="h-4 w-4" />
            {!isCollapsed && <span>Sign In</span>}
          </button>
        )}
      </div>

      {/* Auth Modal Popup */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
        onSuccess={() => {
          setAuthModalOpen(false);
          window.location.reload();
        }}
      />

      {/* Component Guide Modal */}
      <ComponentGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        onSelectType={(typeKey) => {
          setCurrentType(typeKey);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nav-type-change', { detail: typeKey }));
          }
        }}
      />
    </aside>
  );
}
