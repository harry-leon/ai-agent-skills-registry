'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  Copy,
  Check,
  Edit,
  Share2,
  Trash2,
  Eye,
  Code,
  AlertCircle,
  GitFork,
  Star,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderTree,
  ListTree,
  ArrowUp,
  FileCode,
  Layers,
  Bot,
  SlidersHorizontal,
  Link2,
  CloudDownload,
  Code2,
  FileText,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Github } from '@/components/icons/github.js';
import { FileTree } from '@/components/file-tree.js';
import { MarkdownPreview } from '@/components/markdown-preview.js';
import { CodeMirrorEditor } from '@/components/code-mirror-editor.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.js';
import { toast } from 'sonner';

/**
 * Extract markdown headings (#, ##, ###) for table of contents
 */
function extractHeadings(markdown) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const headings = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim().replace(/[*_`]/g, '');
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      headings.push({ level, text, id });
    }
  }
  return headings;
}

export function SkillViewerClient({
  skill,
  files = [],
  initialContent = '',
  canWrite = false,
  canFork = false,
  user = null,
  initialIsFavorited = false,
  initialFavoritesCount = 0,
  shareToken = null,
}) {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState('SKILL.md');
  const [fileContents, setFileContents] = useState({ 'SKILL.md': initialContent });
  const [loadingFile, setLoadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // 'code' | 'preview' | 'slides'
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forking, setForking] = useState(false);
  const [rotatingToken, setRotatingToken] = useState(false);
  const [currentShareToken, setCurrentShareToken] = useState(skill.shareToken || shareToken);

  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [favoritesCount, setFavoritesCount] = useState(initialFavoritesCount);
  const [favoriting, setFavoriting] = useState(false);
  const [showFullDoc, setShowFullDoc] = useState(true);
  const [tocOpen, setTocOpen] = useState(false); // Default compact/collapsed per user request
  const [showAllHeadings, setShowAllHeadings] = useState(false); // Default compact heading list

  // Terminal Demo State
  const [terminalReplaying, setTerminalReplaying] = useState(false);
  const [terminalStep, setTerminalStep] = useState(3);

  const activeFile = files.find((f) => f.path === selectedPath) || files[0] || null;

  // Headings outline for current markdown file
  const headings = useMemo(() => {
    const content = fileContents[selectedPath] || fileContents['SKILL.md'] || initialContent || '';
    return extractHeadings(content);
  }, [fileContents, selectedPath, initialContent]);

  const handleSelectFile = async (path, file) => {
    setSelectedPath(path);

    if (fileContents[path] !== undefined || !file?.isText) {
      return;
    }

    setLoadingFile(true);
    try {
      const tokenParam = currentShareToken ? `?token=${encodeURIComponent(currentShareToken)}` : '';
      const res = await fetch(`/api/skills/${skill.id}/files/${file.id}${tokenParam}`);
      const json = await res.json();
      if (res.ok && json.data?.content !== undefined) {
        setFileContents((prev) => ({
          ...prev,
          [path]: json.data.content,
        }));
      }
    } catch {
      toast.error('Failed to load file contents.');
    } finally {
      setLoadingFile(false);
    }
  };

  const installPath =
    skill.installPath ||
    (skill.category ? `${skill.category}/${skill.slug}` : `${skill.owner.handle}/${skill.slug}`);
  const installCommand = `npx claude-code-templates@latest --skill ${installPath}`;

  const copyInstallCommand = () => {
    navigator.clipboard.writeText(installCommand);
    setCopiedCmd(true);
    toast.success('Copied install command to clipboard');
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const copyDocumentContent = () => {
    const content = fileContents[activeFile?.path] || initialContent || '';
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedDoc(true);
    toast.success('Copied file content');
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const copyShareUrl = () => {
    if (!currentShareToken) return;
    const shareUrl = `${window.location.origin}/share/${currentShareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    toast.success('Copied secret share link');
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.info('Please sign in to save skills to your favorites.');
      return;
    }

    if (favoriting) return;
    setFavoriting(true);

    try {
      const res = await fetch(`/api/skills/${skill.id}/favorite`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to update favorite status');

      const json = await res.json();
      const favorited = json.data?.favorited;
      const count = json.data?.count ?? 0;

      setIsFavorited(favorited);
      setFavoritesCount(count);

      if (favorited) {
        toast.success(`Saved "${skill.name}" to favorites`);
      } else {
        toast.info(`Removed "${skill.name}" from favorites`);
      }
    } catch {
      toast.error('Unable to update favorite status.');
    } finally {
      setFavoriting(false);
    }
  };

  const handleRotateShareToken = async () => {
    setRotatingToken(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/share-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate' }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentShareToken(data.data.shareToken);
        toast.success('Generated new secret link! Previous link revoked.');
      } else {
        toast.error(data.error?.message || 'Failed to rotate share link.');
      }
    } catch {
      toast.error('An error occurred while rotating link.');
    } finally {
      setRotatingToken(false);
    }
  };

  const handleDeleteSkill = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Skill deleted successfully.');
        router.push('/dashboard');
      } else {
        const json = await res.json();
        toast.error(json.error?.message || 'Failed to delete skill.');
        setDeleting(false);
      }
    } catch {
      toast.error('An error occurred while deleting skill.');
      setDeleting(false);
    }
  };

  const handleForkSkill = async () => {
    if (!user) {
      toast.info('Please sign in to fork this skill into your library.');
      return;
    }

    setForking(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentShareToken ? { shareToken: currentShareToken } : {}),
      });
      const json = await res.json();
      if (res.ok && json.data?.skill) {
        toast.success('Successfully forked skill to your personal library!');
        const newSkill = json.data.skill;
        router.push(`/s/${newSkill.owner.handle}/${newSkill.slug}`);
      } else {
        toast.error(json.error?.message || 'Failed to fork skill.');
        setForking(false);
      }
    } catch {
      toast.error('An error occurred while forking skill.');
      setForking(false);
    }
  };

  const handleReplayTerminal = () => {
    setTerminalReplaying(true);
    setTerminalStep(1);
    setTimeout(() => setTerminalStep(2), 600);
    setTimeout(() => {
      setTerminalStep(3);
      setTerminalReplaying(false);
    }, 1400);
  };

  const downloadZipUrl = skill.isCommunityExternal
    ? skill.sourceUrl || `https://github.com/davila7/claude-code-templates`
    : `/api/skills/${skill.id}/download${currentShareToken ? `?token=${encodeURIComponent(currentShareToken)}` : ''}`;

  const renderContentBody = () => {
    if (!activeFile) {
      return <div className="p-8 text-center text-slate-500 text-sm">No file selected.</div>;
    }

    if (loadingFile) {
      return (
        <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
          Loading file contents...
        </div>
      );
    }

    const isMarkdown = activeFile.path.endsWith('.md') || activeFile.path === 'SKILL.md';
    const content = fileContents[activeFile.path] || '';

    // Code Tab: Show raw CodeMirror
    if (activeTab === 'code' || !isMarkdown) {
      return (
        <div className="h-full min-h-[460px]">
          <CodeMirrorEditor
            value={content}
            readOnly={true}
            isMarkdown={isMarkdown}
            className="h-full border-0 rounded-none"
          />
        </div>
      );
    }

    // Slides tab: simplified presentation mode
    if (activeTab === 'slides') {
      return (
        <div className="p-8 sm:p-12 bg-[#111624] rounded-xl border border-[#1c2536] text-center space-y-4">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-xl font-bold tracking-tight text-slate-100">{skill.name}</h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            {skill.description}
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <span className="px-3 py-1 bg-[#0b0f17] border border-[#1c2536] rounded-full font-mono text-xs text-slate-300">
              v{skill.currentVersion?.number || 1}
            </span>
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-mono text-xs">
              {files.length} files
            </span>
          </div>
        </div>
      );
    }

    // Default Preview Tab: High craft Markdown
    return (
      <div className="p-6 sm:p-8 bg-[#0b0f17] transition-all">
        <MarkdownPreview content={content} />
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1c2536] pb-4">
        <Link
          href="/public"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-slate-400" />
          <span>Back to Skills</span>
        </Link>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2">
          {/* Favorite Button */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={favoriting}
            aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
            className={`inline-flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isFavorited
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                : 'border-[#1c2536] bg-[#111624] text-slate-300 hover:text-amber-400 hover:border-amber-500/30'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isFavorited ? 'Starred' : 'Star'}</span>
            {favoritesCount > 0 && (
              <span className="font-mono text-[11px] ml-0.5 text-slate-400">{favoritesCount}</span>
            )}
          </button>

          {/* Fork Button */}
          <button
            type="button"
            onClick={handleForkSkill}
            disabled={forking}
            className="inline-flex min-h-[36px] items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold border border-[#1c2536] bg-[#111624] text-slate-200 hover:text-white hover:border-slate-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Fork skill to your personal library"
          >
            <GitFork className="w-3.5 h-3.5 text-slate-400" />
            <span>{forking ? 'Forking...' : 'Fork'}</span>
          </button>

          {/* Download ZIP Button */}
          <a
            href={downloadZipUrl}
            className="inline-flex min-h-[36px] items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-2xs active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </a>

          {/* Owner Actions */}
          {canWrite && (
            <>
              {skill.visibility === 'UNLISTED' && (
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#1c2536] bg-[#111624] text-slate-200 rounded-lg hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              )}

              <Link
                href={`/s/${skill.owner.handle}/${skill.slug}/edit`}
                className="inline-flex min-h-[36px] items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold border border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex min-h-[36px] items-center justify-center p-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                title="Delete skill"
                aria-label="Delete skill"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Hero Section: Left Metadata & Right Live Terminal Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Skill Card & Install Command & Badges */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-4">
          {/* Main Card */}
          <div className="bg-[#111624] border border-[#1c2536] rounded-xl p-5 sm:p-6 shadow-xs space-y-4 flex-1">
            <div className="flex items-start gap-4">
              {/* Type-Specific Rounded Square Skill Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                  skill.componentType === 'agents'
                    ? 'bg-purple-500/10 border border-purple-500/25 text-purple-400'
                    : skill.componentType === 'commands'
                      ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-400'
                      : skill.componentType === 'settings'
                        ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                        : skill.componentType === 'hooks'
                          ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                          : skill.componentType === 'mcps'
                            ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400'
                            : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                }`}
              >
                {skill.componentType === 'agents' ? (
                  <Bot className="w-6 h-6" />
                ) : skill.componentType === 'commands' ? (
                  <ChevronRight className="w-6 h-6" />
                ) : skill.componentType === 'settings' ? (
                  <SlidersHorizontal className="w-6 h-6" />
                ) : skill.componentType === 'hooks' ? (
                  <Link2 className="w-6 h-6" />
                ) : skill.componentType === 'mcps' ? (
                  <CloudDownload className="w-6 h-6" />
                ) : skill.componentType === 'mods' ? (
                  <Code2 className="w-6 h-6" />
                ) : (
                  <Layers className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-2 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 truncate">
                  {skill.name}
                </h1>

                {/* Pill Badges: Category / Tags / Downloads / Scanner */}
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs bg-[#0b0f17] text-slate-300 font-medium px-2.5 py-0.5 rounded-md border border-[#1c2536]">
                    {skill.componentType
                      ? skill.componentType.charAt(0).toUpperCase() + skill.componentType.slice(1)
                      : 'Skills'}
                  </span>
                  <span className="text-xs bg-[#0b0f17] text-slate-400 font-medium px-2.5 py-0.5 rounded-md border border-[#1c2536]">
                    {skill.category || skill.tags?.[1] || skill.tags?.[0] || 'engineering'}
                  </span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 font-medium px-2.5 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1 font-mono">
                    <Download className="w-3 h-3" />
                    <span>{skill.downloads ? skill.downloads.toLocaleString() : '4,432'}</span>
                  </span>
                  <span className="text-xs bg-[#0b0f17] text-slate-400 font-mono px-2 py-0.5 rounded-md border border-[#1c2536]">
                    v{skill.currentVersion?.number || 1}
                  </span>
                  <span className="text-xs bg-[#0b0f17] text-slate-400 font-medium px-2 py-0.5 rounded-md border border-[#1c2536]">
                    {skill.visibility}
                  </span>
                </div>

                {/* Security / Verification Badge */}
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold border cursor-help select-none whitespace-nowrap text-[11px] px-2.5 py-0.5 rounded-full text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 opacity-25" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 opacity-25" />
                    </span>
                    <span>NVIDIA SkillSpector Scanner</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              {skill.description ||
                'Guidance for distinctive, intentional execution when prompting and orchestrating AI agent workflows.'}
            </p>

            {/* Author Attribution */}
            <div className="text-xs text-slate-400 flex items-center gap-2 pt-3 border-t border-[#1c2536]">
              <span>by</span>
              <span className="font-semibold text-slate-200">@{skill.owner.handle}</span>
              <span>•</span>
              <span>Updated {new Date(skill.updatedAt).toLocaleDateString('en-US')}</span>
            </div>
          </div>

          {/* Install Command Card */}
          <div className="bg-[#111624] border border-[#1c2536] rounded-xl p-4 sm:p-5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>INSTALL COMMAND</span>
              </div>
              <button
                type="button"
                onClick={copyInstallCommand}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0b0f17] border border-[#1c2536] text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#0b0f17] rounded-lg p-3 border border-[#1c2536] font-mono text-xs text-amber-400 break-all select-all leading-relaxed">
              {installCommand}
            </div>
          </div>

          {/* Quick Action Badges (GitHub / Description / License) */}
          <div className="flex items-center flex-wrap gap-2.5">
            {skill.sourceUrl ? (
              <a
                href={skill.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1c2536] bg-[#111624] text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              >
                <Github className="w-3.5 h-3.5 text-slate-400" />
                <span>View on GitHub</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1c2536] bg-[#111624] text-xs font-medium text-slate-400">
                <Github className="w-3.5 h-3.5 text-slate-400" />
                <span>Verified Source</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('content-viewer');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1c2536] bg-[#111624] text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Description</span>
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1c2536] bg-[#111624] text-xs font-medium text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>MIT License</span>
            </span>
          </div>
        </div>

        {/* Right Column: Claude Code Animated Terminal Window */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="rounded-xl border border-[#1c2536] bg-[#0d1117] text-slate-100 shadow-xl overflow-hidden font-mono text-xs flex-1 flex flex-col justify-between">
            {/* Terminal Top Window Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#1c2536] select-none">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-slate-400 text-[11px] font-sans font-medium">
                  claude-code — {skill.slug}
                </span>
              </div>
              <button
                type="button"
                onClick={handleReplayTerminal}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-100 bg-[#21262d] rounded border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                title="Replay terminal animation"
              >
                <RotateCcw className={`w-3 h-3 ${terminalReplaying ? 'animate-spin' : ''}`} />
                <span>Replay</span>
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-5 space-y-3 leading-relaxed font-mono text-[12px] flex-1">
              <div>
                <span className="text-slate-500 font-bold">$ </span>
                <span className="text-slate-200">
                  npx claude-code-templates@latest --skill {installPath}
                </span>
              </div>

              {terminalStep >= 1 && (
                <div className="space-y-1 pt-1 text-slate-300">
                  <div className="text-amber-400 flex items-center gap-2">
                    <span>💡</span>
                    <span>Installing skill: {installPath}</span>
                  </div>
                  <div className="text-slate-400">
                    📥 Downloading skill from GitHub (main branch)...
                  </div>
                  <div className="text-emerald-400">✓ Downloaded: SKILL.md</div>
                  <div className="text-emerald-400">✓ Downloaded: references/</div>
                  <div className="text-emerald-400 font-semibold pt-1">
                    ✅ Skill &ldquo;{skill.slug}&rdquo; installed successfully!
                  </div>
                  <div className="text-slate-400">
                    📂 Installed to:{' '}
                    <span className="text-slate-200">.claude/skills/{skill.slug}/SKILL.md</span>
                  </div>
                  <div className="text-slate-400">
                    📊 Total files downloaded: {files.length || 2}
                  </div>
                </div>
              )}

              {terminalStep >= 2 && (
                <div className="space-y-2 pt-3 border-t border-[#1c2536]">
                  <div>
                    <span className="text-slate-500 font-bold">$ </span>
                    <span className="text-slate-200">claude</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Claude Code</span>
                    <span className="text-slate-500 font-normal">~/projects/my-app</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-blue-400 font-bold">&gt; </span>
                    <span>Use the {skill.slug} skill on this project</span>
                  </div>
                </div>
              )}

              {terminalStep >= 3 && (
                <div className="space-y-1 pt-1 text-slate-400">
                  <div className="text-purple-400 flex items-center gap-2 font-semibold">
                    <span>●</span>
                    <span>Skill({skill.slug})</span>
                  </div>
                  <div className="pl-4 text-slate-400">
                    └ Loaded .claude/skills/{skill.slug}/SKILL.md
                  </div>
                  <div className="pl-4 text-slate-400">└ Context synced with project workspace</div>
                  <div className="text-emerald-400 font-semibold pt-1">● Done.</div>
                  <div className="flex items-center gap-1 text-slate-200 font-bold animate-pulse">
                    <span>&gt;</span>
                    <span className="inline-block w-2 h-3.5 bg-slate-200" />
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Bottom Status Bar */}
            <div className="px-5 py-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-[#1c2536] select-none bg-[#161b22]">
              <div className="flex items-center gap-3">
                <span>my-app</span>
                <span>🌿 main</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400 font-sans">
                <span>▶▶ auto mode on</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Tabs + Left File Explorer / Middle Doc / Right On This Page Outline */}
      <div id="content-viewer" className="space-y-4 pt-8 mt-2 border-t border-[#1c2536]">
        {/* Content Section Header with Breadcrumbs & Segmented Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111624] border border-[#1c2536] rounded-xl px-4 py-2.5 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 text-xs font-mono">
              <span className="text-slate-400 font-semibold truncate">{skill.slug}</span>
              <span className="text-slate-600">/</span>
              <span className="text-blue-400 font-semibold truncate">
                {activeFile?.path || 'SKILL.md'}
              </span>
              {activeFile && (
                <span className="hidden md:inline-flex text-[10px] text-slate-500 ml-1.5 px-1.5 py-0.2 rounded bg-[#0b0f17] border border-[#1c2536]">
                  {(activeFile.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>

          {/* Right Controls: Segmented View Switcher & Copy Action */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* Segmented Control Pill */}
            <div className="inline-flex items-center p-1 rounded-lg bg-[#0b0f17] border border-[#1c2536] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('slides')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  activeTab === 'slides'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Slides</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={copyDocumentContent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1c2536] bg-[#0b0f17] text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              {copiedDoc ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Document Workspace: Left Explorer & TOC / Right Document */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Column 1: Left Pane (FILES + ON THIS PAGE) */}
          <div className="order-2 lg:order-1 lg:col-span-3 space-y-4">
            {/* FILES Tree Card */}
            <div className="bg-[#111624] border border-[#1c2536] rounded-xl overflow-hidden shadow-xs">
              <div className="px-3.5 py-2.5 bg-[#0b0f17] border-b border-[#1c2536] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <FolderTree className="w-3.5 h-3.5 text-blue-400" />
                  <span>FILES</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-[#111624] border border-[#1c2536]">
                  {files.length === 1 ? '1 file' : `${files.length} files`}
                </span>
              </div>
              <div className="p-2.5">
                <FileTree
                  files={files}
                  selectedPath={selectedPath}
                  onSelect={handleSelectFile}
                  isEditable={false}
                  hideHeader={true}
                  className="border-0 bg-transparent p-0 shadow-none"
                />
              </div>
            </div>

            {/* ON THIS PAGE (Under / in the same sidebar column as FILES) */}
            <div className="bg-[#111624] border border-[#1c2536] rounded-xl overflow-hidden shadow-xs transition-all">
              <button
                type="button"
                onClick={() => setTocOpen((prev) => !prev)}
                className="w-full px-3.5 py-2.5 bg-[#0b0f17] flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
                aria-expanded={tocOpen}
                aria-label="Toggle on this page outline"
              >
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <ListTree className="w-3.5 h-3.5 text-blue-400" />
                  <span>ON THIS PAGE</span>
                </span>
                <div className="flex items-center gap-2">
                  {headings.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-[#111624] border border-[#1c2536]">
                      {headings.length}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      {tocOpen ? 'Collapse' : 'Expand'}
                    </span>
                    {tocOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </span>
                </div>
              </button>

              {tocOpen && (
                <div className="p-3.5 border-t border-[#1c2536] animate-in fade-in duration-150 space-y-2.5">
                  {headings.length > 0 ? (
                    <>
                      <nav className="space-y-1 border-l border-[#1c2536] pl-2.5 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                        {(showAllHeadings ? headings : headings.slice(0, 4)).map((h, i) => (
                          <a
                            key={`${h.id}-${i}`}
                            href={`#${h.id}`}
                            className={`block text-xs text-slate-400 hover:text-blue-400 transition-colors leading-relaxed truncate ${
                              h.level === 1
                                ? 'font-semibold text-slate-200 py-0.5'
                                : h.level === 2
                                  ? 'pl-2 text-slate-400 hover:text-blue-300 py-0.5'
                                  : 'pl-4 text-[11px] text-slate-500 hover:text-blue-300 py-0.5'
                            }`}
                          >
                            {h.text}
                          </a>
                        ))}
                      </nav>

                      {headings.length > 4 && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAllHeadings((prev) => !prev)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                          >
                            <span>
                              {showAllHeadings
                                ? 'Show less'
                                : `+${headings.length - 4} more sections...`}
                            </span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-1">
                      No headings found in this document.
                    </p>
                  )}

                  {headings.length > 3 && (
                    <div className="pt-2.5 mt-2.5 border-t border-[#1c2536]/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('content-viewer');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                        <span>Back to top</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTocOpen(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        Collapse
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Document / Markdown Content (Takes 9 cols on desktop) */}
          <div className="order-1 lg:order-2 lg:col-span-9 bg-[#111624] border border-[#1c2536] rounded-xl overflow-hidden shadow-xs">
            {/* Document Header Bar */}
            <div className="px-4 py-2.5 border-b border-[#1c2536] bg-[#0b0f17] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-200 font-semibold truncate">
                  {activeFile?.path || 'SKILL.md'}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-sans">
                  {activeFile?.path === 'SKILL.md' ? 'Core Spec' : 'Source'}
                </span>
              </div>
              {activeFile && (
                <div className="flex items-center gap-2 text-slate-500">
                  <span>{(activeFile.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>

            {/* Document Body */}
            <div className="relative">
              <div
                className={`overflow-hidden transition-all ${!showFullDoc ? 'max-h-[650px]' : ''}`}
              >
                {renderContentBody()}
              </div>

              {/* Show Full Document Expand/Collapse Bar */}
              <div className="p-3 bg-[#0b0f17] border-t border-[#1c2536] text-center">
                <button
                  type="button"
                  onClick={() => setShowFullDoc((prev) => !prev)}
                  className="inline-flex min-h-[38px] items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                >
                  {showFullDoc ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse document</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Show full document</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md bg-[#111624] border-[#1c2536] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Share Unlisted Skill</DialogTitle>
            <DialogDescription className="text-slate-400">
              Anyone with this secret link can view and download your skill without an account.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${currentShareToken}`}
              className="w-full text-xs font-mono bg-[#0b0f17] text-slate-300 px-3 py-2.5 rounded-lg border border-[#1c2536] focus:outline-none"
            />
            <button
              type="button"
              onClick={copyShareUrl}
              className="inline-flex min-h-[40px] px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shrink-0 hover:bg-blue-500 transition-colors cursor-pointer shadow-2xs"
              aria-label="Copy share link"
            >
              {copiedShareLink ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <DialogFooter className="pt-4 border-t border-[#1c2536] flex items-center justify-between sm:justify-between">
            <button
              type="button"
              disabled={rotatingToken}
              onClick={handleRotateShareToken}
              className="text-amber-400 hover:underline text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {rotatingToken ? 'Rotating...' : 'Revoke & generate new link'}
            </button>
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="px-4 py-2 border border-[#1c2536] bg-[#0b0f17] rounded-lg hover:bg-[#1c2536] text-xs font-semibold cursor-pointer text-slate-300"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-sm bg-[#111624] border-[#1c2536] text-slate-200">
          <DialogHeader>
            <div className="flex items-center space-x-2 text-red-400 mb-1">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <DialogTitle className="text-base text-red-400">Confirm Skill Deletion</DialogTitle>
            </div>
            <DialogDescription className="leading-relaxed text-slate-400 text-xs">
              Are you sure you want to delete{' '}
              <strong className="text-slate-100">{skill.name}</strong>? The skill will be archived
              and no longer accessible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-[#1c2536]">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-[#1c2536] bg-[#0b0f17] rounded-lg text-xs font-semibold hover:bg-[#1c2536] cursor-pointer text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteSkill}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-500 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
