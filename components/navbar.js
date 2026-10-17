'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';

export default function Navbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  const navLinks = user
    ? [
        { href: '/dashboard', label: 'Thư viện' },
        { href: '/explore', label: 'Khám phá' },
        { href: '/skills/new', label: 'Thêm kỹ năng' },
        { href: '/import', label: 'Nhập từ GitHub' },
      ]
    : [{ href: '/explore', label: 'Khám phá' }];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-6">
          <Link
            href={user ? '/dashboard' : '/'}
            className="flex items-center gap-2 font-bold text-xl tracking-tight"
          >
            <span className="text-blue-600">Skill</span>Vault
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span>@{user.handle}</span>
              </div>

              <Link
                href="/settings"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
              >
                Cài đặt
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
