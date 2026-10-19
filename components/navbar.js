'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';
import { ThemeToggle } from '@/components/theme-toggle.js';
import {
  Menu,
  X,
  Library,
  Compass,
  PlusCircle,
  DownloadCloud,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  const navLinks = user
    ? [
        { href: '/dashboard', label: 'My Skills', icon: Library },
        { href: '/public', label: 'Community Skills', icon: Compass },
        { href: '/skills/new', label: 'New Skill', icon: PlusCircle },
        { href: '/import', label: 'Import from GitHub', icon: DownloadCloud },
      ]
    : [{ href: '/public', label: 'Community Skills', icon: Compass }];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Left: Brand & Desktop Nav */}
        <div className="flex items-center gap-6">
          <Link
            href={user ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>
              <span className="text-blue-600 dark:text-blue-400">Skill</span>
              <span className="text-foreground">Vault</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions, User / Auth, Mobile Toggle */}
        <div className="flex items-center gap-1 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/40 px-2 sm:px-3 py-1 text-xs font-medium max-w-[80px] sm:max-w-[150px] truncate text-foreground shadow-2xs">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate">@{user.handle}</span>
              </div>

              <Link
                href="/settings"
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-input bg-background/80 px-3 py-1.5 min-h-[44px] sm:min-h-[32px] text-xs font-medium hover:bg-accent transition-colors shadow-2xs text-foreground"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Settings</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg bg-muted/80 px-2 sm:px-3 py-1.5 min-h-[44px] sm:min-h-[32px] text-xs font-medium text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all duration-150 cursor-pointer shadow-2xs shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex min-h-[44px] sm:min-h-[32px] items-center rounded-lg border border-input bg-background/80 px-3.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors text-foreground shadow-2xs"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex min-h-[44px] sm:min-h-[32px] items-center rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Drawer Trigger (min-h-[44px] touch target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-input bg-background text-foreground shadow-2xs hover:bg-accent transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Backdrop & Sheet */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-40 lg:hidden border-b border-border bg-card/95 backdrop-blur-lg px-4 pt-3 pb-6 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
              {user && (
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {user.handle?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">@{user.handle}</div>
                      <div className="text-[11px] text-muted-foreground">{user.email || ''}</div>
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex flex-col gap-1.5">
                {navLinks.map((link) => {
                  const active = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {user ? (
                  <>
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Account Settings</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
