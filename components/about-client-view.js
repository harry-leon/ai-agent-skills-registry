'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  Bot,
  SlidersHorizontal,
  CloudDownload,
  Code2,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  Boxes,
  Compass,
  ArrowLeft,
  Orbit,
  FastForward,
} from 'lucide-react';
import { GithubIcon } from '@/components/icons/github.js';
import { About3DScene, SOLAR_NODES } from './about-3d-scene.js';

export function AboutClientView() {
  const [selectedNodeId, setSelectedNodeId] = useState('skills');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);

  // Safety fallback: auto-reveal content after 5.5s if timer or tab paused
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroCompleted(true);
    }, 5500);
    return () => clearTimeout(timer);
  }, []);

  const selectedNode = SOLAR_NODES.find((n) => n.id === selectedNodeId) || SOLAR_NODES[2]; // Earth by default

  const handleCopyCli = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const nodeIcons = {
    skills: Layers,
    agents: Bot,
    commands: ChevronRight,
    settings: SlidersHorizontal,
    hooks: RefreshCw,
    mcps: CloudDownload,
    mods: Code2,
  };

  return (
    <div className="relative min-h-screen w-full bg-[#04060c] text-slate-100 overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      {/* 1. 3D WebGL Solar System Canvas */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <About3DScene
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          onIntroComplete={() => setIntroCompleted(true)}
        />
      </div>

      {/* Atmospheric lighting vignettes */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-t from-[#04060c] via-transparent to-[#04060c]/60" />
      <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#04060c]/25 to-[#04060c]/80" />

      {/* Intro Fly-in Status Pill & Skip Button */}
      {!introCompleted && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full border border-amber-500/30 bg-[#070d18]/85 backdrop-blur-md text-xs font-medium text-amber-300 shadow-xl">
            <Orbit className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Orbiting Planetary System (360°)...</span>
          </div>

          <button
            onClick={() => setIntroCompleted(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-sky-500/40 bg-[#0b1324]/90 backdrop-blur-md text-xs font-semibold text-sky-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-sky-950/40 active:scale-95"
          >
            <FastForward className="w-3.5 h-3.5 text-sky-400" />
            <span>Skip Intro</span>
          </button>
        </div>
      )}

      {/* 2. Floating Glassmorphism Top Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 px-3 sm:px-8 py-3 backdrop-blur-xl bg-[#04060c]/80 border-b border-slate-800/60 shadow-lg transition-all duration-700 ease-out ${
          introCompleted
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/public"
              className="flex items-center gap-2 group transition-transform active:scale-95"
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-sky-500 to-indigo-500 p-[1px] shadow-md shadow-sky-500/20">
                <div className="w-full h-full bg-[#070b14] rounded-[11px] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Skillary Logo"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </div>
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                SKILLARY
              </span>
            </Link>

            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[11px] font-semibold text-amber-300">
              <Orbit className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Solar System 3D</span>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
            <Link
              href="/public"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              Explore Registry
            </Link>
            <a
              href="#architecture"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              Architecture
            </a>
            <a
              href="#cli"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              CLI Tools
            </a>
            <a
              href="#author"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              Author
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://github.com/harry-leon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* 3. Main Hero Overlay Section (Fades & slides in when zoom-out completes) */}
      <main
        className={`relative z-10 pt-24 sm:pt-36 pb-20 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col justify-between min-h-[calc(100vh-5rem)] pointer-events-none transition-all duration-1000 ease-out ${
          introCompleted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Top Hero Text */}
        <div className="max-w-2xl space-y-4 sm:space-y-6 pointer-events-auto">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-[#0e1626]/85 backdrop-blur-md text-[11px] sm:text-xs font-medium text-amber-300 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              The Planetary Ecosystem for Autonomous AI Coding Agents
            </span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-slate-50 leading-[1.1]">
            Empower AI Agents with{' '}
            <span className="bg-gradient-to-r from-amber-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Precision Intelligence.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300/90 leading-relaxed max-w-xl font-normal">
            Skillary is the next-generation package registry and orchestration hub. Seamlessly
            discover, compose, and deploy standardized Skills, Agents, Commands, MCPs, and Hooks
            directly into Claude Code, Cursor, and Windsurf.
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/public"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-blue-700/30 transition-all cursor-pointer active:scale-95"
            >
              <span>Explore Public Registry</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => handleCopyCli('npx skillary add @claude/code-review')}
              className="inline-flex items-center gap-2 max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-700/80 bg-[#0c121e]/85 backdrop-blur-md hover:bg-slate-800 text-slate-200 font-mono text-[11px] sm:text-xs transition-colors cursor-pointer active:scale-95"
            >
              <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">npx skillary add @claude/code-review</span>
              {copiedCmd ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-auto" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
              )}
            </button>
          </div>

          {/* Micro metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 max-w-lg">
            <div className="p-2.5 sm:p-3 rounded-xl border border-slate-800/80 bg-[#090e18]/80 backdrop-blur-md text-center sm:text-left">
              <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono">1,890+</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                Solar Artifacts
              </div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl border border-slate-800/80 bg-[#090e18]/80 backdrop-blur-md text-center sm:text-left">
              <div className="text-lg sm:text-2xl font-black text-sky-400 font-mono">7 Orbits</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                Planetary Types
              </div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl border border-slate-800/80 bg-[#090e18]/80 backdrop-blur-md text-center sm:text-left">
              <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                SHA-256
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                CAS Security
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Interactive Planet Selector & HUD Inspector */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pointer-events-auto">
          {/* Planet Selector Pills */}
          <div className="lg:col-span-7 flex overflow-x-auto lg:flex-wrap gap-2 p-2 rounded-2xl border border-slate-800/70 bg-[#060a14]/85 backdrop-blur-xl shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {SOLAR_NODES.map((node) => {
              const Icon = nodeIcons[node.id] || Layers;
              const isSelected = selectedNodeId === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600/30 border border-blue-500/60 text-blue-200 shadow-md shadow-blue-500/20'
                      : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: isSelected ? node.hex : undefined }}
                  />
                  <span>
                    {node.name}
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">
                      ({node.planetName})
                    </span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-400 border border-slate-800">
                    {node.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Focused Planet HUD Card */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
                  style={{
                    backgroundColor: `${selectedNode.hex}18`,
                    borderColor: `${selectedNode.hex}45`,
                    color: selectedNode.hex,
                  }}
                >
                  {(() => {
                    const Icon = nodeIcons[selectedNode.id] || Layers;
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedNode.name}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      • {selectedNode.planetName}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-mono border"
                      style={{
                        backgroundColor: `${selectedNode.hex}15`,
                        borderColor: `${selectedNode.hex}40`,
                        color: selectedNode.hex,
                      }}
                    >
                      {selectedNode.badge}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{selectedNode.tagline}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-mono font-bold text-slate-100">
                  {selectedNode.count}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Cataloged
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {selectedNode.description}
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">
                Click planet in 3D orbit to focus & inspect
              </span>

              <Link
                href={`/public?type=${selectedNode.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                <span>Browse {selectedNode.name}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 5. Deep Architecture & Invariants Section */}
      <section
        id="architecture"
        className={`relative z-10 py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-slate-800/80 transition-opacity duration-1000 ${
          introCompleted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="space-y-4 max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Industrial-Grade Infrastructure</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-50">
            Built for Extreme Speed, Security & Scale
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Engineered with strict zero-trust invariants, cryptographic content-addressing, and
            Singapore-colocated edge compute.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md space-y-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">CAS Content-Addressable Storage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every skill package and file is SHA-256 hashed and immutable. Eliminates duplication,
              prevents code tampering, and enforces deterministic builds.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Sub-100ms Edge Latency</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vercel Serverless Functions colocated in Singapore (sin1) connecting directly to Neon
              PostgreSQL via PgBouncer pooled connections for near-instant response.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Cross-Agent Interoperability</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full native support for Claude Code, Cursor IDE, Windsurf, Roo Code, and Gemini CLI.
              Install directly into project roots without complex wrapper setups.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Bundle Stacks Orchestration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curate multiple Skills, MCPs, and Rules into customized project stacks. Export bulk
              installation manifests for rapid developer onboarding.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CLI & Quickstart Section */}
      <section
        id="cli"
        className={`relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-slate-800/80 transition-opacity duration-1000 ${
          introCompleted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="p-8 sm:p-12 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-[#070d1a]/90 to-indigo-950/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-300">
              <Terminal className="w-3.5 h-3.5" />
              <span>Universal CLI Integration</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Ready to Upgrade Your AI Coding Workflow?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join developers worldwide curating high-performance skills. Publish your own custom
              skills or download community-proven prompts with a single command.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/public"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-800/30 transition-all cursor-pointer active:scale-95"
            >
              Get Started for Free
            </Link>

            <a
              href="https://github.com/harry-leon/ai-agent-skills-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl border border-slate-700/80 bg-[#0e1424] hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors inline-flex items-center gap-2"
            >
              <GithubIcon className="w-4 h-4 text-slate-400" />
              <span>Star on GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>
      </section>

      {/* 6.5 Author Profile Section */}
      <section
        id="author"
        className={`relative z-10 py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-slate-800/80 transition-opacity duration-1000 ${
          introCompleted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-800 bg-[#080d1a]/85 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Subtle glow backdrop */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Avatar with gradient border */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-tr from-amber-500 via-sky-400 to-indigo-500 shadow-xl shadow-sky-500/20">
                <Image
                  src="https://avatars.githubusercontent.com/u/203934452?v=4"
                  alt="Ha Thuc Quoc Hung"
                  width={112}
                  height={112}
                  unoptimized
                  className="w-full h-full object-cover rounded-xl bg-slate-900"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#0d1322] border border-slate-700 text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-md">
                <span>🤖</span>
                <span>Creator</span>
              </div>
            </div>

            {/* Author details */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-xs font-semibold text-sky-300">
                <span>Meet the Author</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
                Ha Thuc Quoc Hung{' '}
                <span className="text-sm font-mono text-slate-400">(@harry-leon)</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Tác giả và kiến trúc sư trưởng của <strong>Skillary</strong> — hệ sinh thái mở quản
                lý, phân phối kỹ năng (Skills), MCPs, Hooks và Mods tối ưu cho các AI Coding Agents
                hiện đại (Claude Code, Cursor, Windsurf, Copilot).
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href="https://github.com/harry-leon"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-700/30 transition-all inline-flex items-center justify-center gap-2 active:scale-95"
              >
                <GithubIcon className="w-4 h-4 text-white" />
                <span>GitHub Profile</span>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>

              <a
                href="https://github.com/harry-leon/ai-agent-skills-registry"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-[#0e1424] hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span>Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-8 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Skillary Registry</span>
            <span>&copy; {new Date().getFullYear()} — MIT Licensed.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/public" className="hover:text-slate-200 transition-colors">
              Registry
            </Link>
            <Link href="/favorites" className="hover:text-slate-200 transition-colors">
              Favorites
            </Link>
            <a
              href="https://github.com/harry-leon/ai-agent-skills-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors"
            >
              Open Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
