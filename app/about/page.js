import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle.js';
import {
  ShieldCheck,
  GitBranch,
  Search,
  Sparkles,
  ArrowRight,
  Code2,
  Lock,
  Layers,
  Terminal,
} from 'lucide-react';
import { Github } from '@/components/icons/github.js';

export const metadata = {
  title: 'About SkillVault — AI Agent Skills Registry & Package Manager',
  description:
    'Store, organize, search, download, and fork versioned AI Agent skills securely.',
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>
              <span className="text-blue-600 dark:text-blue-400">Skill</span>Vault
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/public"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Community Skills
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
          {/* Subtle background glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col items-center text-center">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/40 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-2xs mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure, versioned AI Agent skills package manager</span>
            </div>

            {/* Heading */}
            <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
              One central registry for all your{' '}
              <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 decoration-wavy">
                AI Agent Skills
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Eliminate scattered prompts, unversioned scripts, and untracked tools. SkillVault provides
              a secure-by-default registry with instant CLI installation, SHA-256 content hashing, and one-click GitHub imports.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/register"
                className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                <span>Create Your Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/public"
                className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent active:scale-[0.98] transition-all shadow-2xs"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span>Browse Community Skills</span>
              </Link>
            </div>

            {/* Code / Skill Card Preview Mockup */}
            <div className="mt-14 w-full max-w-4xl rounded-xl border border-border/80 bg-card/90 shadow-2xl overflow-hidden backdrop-blur-sm text-left">
              {/* Window Titlebar */}
              <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    skillvault/data-analyst-pro/SKILL.md
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 border border-emerald-500/20">
                    v2.1.0 • verified
                  </span>
                </div>
              </div>

              {/* Code Snippet Content */}
              <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed bg-card text-foreground">
                <div className="text-muted-foreground">---</div>
                <div>
                  <span className="text-blue-500 font-semibold">name</span>: data-analyst-pro
                </div>
                <div>
                  <span className="text-blue-500 font-semibold">description</span>:{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    &quot;Automated multi-source data analysis with rigorous schema validation and PDF reporting&quot;
                  </span>
                </div>
                <div>
                  <span className="text-blue-500 font-semibold">version</span>: 2.1.0
                </div>
                <div>
                  <span className="text-blue-500 font-semibold">visibility</span>: PUBLIC
                </div>
                <div>
                  <span className="text-blue-500 font-semibold">hash</span>:
                  sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4...
                </div>
                <div className="text-muted-foreground">---</div>
                <div className="mt-3 text-muted-foreground"># Skill Instructions</div>
                <div className="mt-1 text-muted-foreground/80">
                  Comprehensive financial metrics analysis tools and scripts for autonomous AI Agents.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="border-t border-border/80 bg-muted/20 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Built for Developers & Autonomous Agents
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Engineered with defense-in-depth security standards and optimal runtime performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base">Private by Default</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Every skill is PRIVATE by default. Strict access control with secret unlisted share tokens or public community indexing.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base">Immutable & Deduplicated</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Cryptographically verified SHA-256 content hashes. Content-addressed storage ensures zero duplicate file storage.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Github className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base">Import from GitHub</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  One-click repository or subfolder imports with multi-stage SSRF protection and strict file size limits.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Terminal className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base">Instant CLI Install</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Install any community skill directly into your Claude Code, Cursor, or agent directory with a single terminal command.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70 py-8 text-center text-xs sm:text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">SkillVault</span>
            <span>—</span>
            <span>Secure AI Agent Skills Registry & Package Manager.</span>
          </div>
          <div>© {new Date().getFullYear()} SkillVault. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
