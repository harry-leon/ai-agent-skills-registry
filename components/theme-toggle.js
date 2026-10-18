'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeToggle({ className = '', ghost = false }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={
          ghost
            ? `inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 opacity-60 ${className}`
            : `inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background/80 text-muted-foreground opacity-70 ${className}`
        }
        disabled
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const getThemeTitle = () => {
    if (theme === 'dark') return 'Dark theme (click for Light)';
    if (theme === 'light') return 'Light theme (click for System)';
    return 'System theme (click for Dark)';
  };

  const iconClass = ghost ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const baseButtonClass = ghost
    ? `inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer ${className}`
    : `inline-flex min-h-[38px] min-w-[38px] sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-input bg-background/80 text-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={getThemeTitle()}
      aria-label={getThemeTitle()}
      className={baseButtonClass}
    >
      {theme === 'dark' ? (
        <Moon className={`${iconClass} text-slate-400 hover:text-blue-400 transition-colors duration-150`} />
      ) : theme === 'light' ? (
        <Sun className={`${iconClass} text-slate-400 hover:text-amber-400 transition-colors duration-150`} />
      ) : (
        <Laptop className={`${iconClass} text-slate-400 hover:text-slate-200 transition-colors duration-150`} />
      )}
    </button>
  );
}
