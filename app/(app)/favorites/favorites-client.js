'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Star,
  Clock,
  FileCode,
  Download,
  Copy,
  Check,
  Terminal,
  Grid,
  List,
  Compass,
  Loader2,
  GitFork,
} from 'lucide-react';
import { toast } from 'sonner';
import { Github } from '@/components/icons/github.js';

export function FavoritesClient({
  initialSkills = [],
  initialTotal = 0,
  initialCursor = null,
  user,
}) {
  const [skills, setSkills] = useState(initialSkills);
  const [total, setTotal] = useState(initialTotal);
  const [cursor, setCursor] = useState(initialCursor);

  const [viewMode, setViewMode] = useState('grid');
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedSkillId, setCopiedSkillId] = useState(null);
  const [unfavoritingId, setUnfavoritingId] = useState(null);

  const handleCopyCli = (e, skill) => {
    e.preventDefault();
    e.stopPropagation();
    const cmd = `npx skillvault add @${skill.owner.handle}/${skill.slug}`;
    navigator.clipboard.writeText(cmd);
    setCopiedSkillId(skill.id);
    toast.success('Copied CLI install command to clipboard');
    setTimeout(() => {
      setCopiedSkillId((current) => (current === skill.id ? null : current));
    }, 2000);
  };

  const handleToggleFavorite = async (e, skill) => {
    e.preventDefault();
    e.stopPropagation();

    if (unfavoritingId === skill.id) return;
    setUnfavoritingId(skill.id);

    try {
      const res = await fetch(`/api/skills/${skill.id}/favorite`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to update favorite status');
      }

      // Remove from favorites view immediately
      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.info(`Removed "${skill.name}" from favorites`);
    } catch {
      toast.error('Unable to update favorite status. Please try again.');
    } finally {
      setUnfavoritingId(null);
    }
  };

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ cursor, limit: '20' });
      const res = await fetch(`/api/me/favorites?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setSkills((prev) => [...prev, ...json.data.skills]);
        setCursor(json.data.nextCursor);
      }
    } catch {
      toast.error('Failed to load more favorites.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c2536] pb-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Bookmark className="h-6 w-6 text-amber-400" />
            <span>Favorites</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            AI agent skills you have saved for quick access and reference.
          </p>
        </div>

        {skills.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-2">
              <strong className="text-slate-200">{total}</strong> saved
            </span>
            <div className="hidden sm:flex border border-[#1c2536] rounded-md overflow-hidden bg-[#0b0f17]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#1c2536] text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#1c2536] text-white font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="List view"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-16 bg-[#111624] border border-[#1c2536] rounded-lg space-y-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Star className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="font-semibold text-slate-200 text-sm sm:text-base">
              No favorites saved yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Browse public skills from the community and click the star icon to save them here for fast retrieval.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/public"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-2xs"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Community Skills</span>
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="group flex flex-col justify-between rounded-xl border border-[#1e293b]/80 bg-gradient-to-b from-[#131b2c] to-[#0d1320] p-5 hover:border-blue-500/40 hover:from-[#162035] hover:to-[#0f1728] shadow-md hover:shadow-xl hover:shadow-blue-950/20 transition-all duration-200"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-inner mt-0.5">
                      <Terminal className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/s/${skill.owner.handle}/${skill.slug}`}
                        className="font-bold text-base tracking-tight text-slate-100 hover:text-blue-400 transition-colors line-clamp-1 block group-hover:text-blue-300"
                      >
                        {skill.name}
                      </Link>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>by</span>
                        <span className="font-medium text-slate-300 hover:text-blue-400 transition-colors">
                          @{skill.owner.handle}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono bg-[#0b0f17] text-slate-400 px-2 py-0.5 rounded-md border border-[#1c2536] font-medium shadow-2xs">
                      v{skill.currentVersion?.number || 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, skill)}
                      disabled={unfavoritingId === skill.id}
                      aria-label="Remove from favorites"
                      title="Remove from favorites"
                      className="p-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {skill.description || 'No description provided.'}
                </p>

                {skill.tags && skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skill.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="bg-[#0b0f17] border border-[#1c2536] px-2 py-0.5 rounded text-[11px] text-slate-400 font-mono hover:border-blue-500/30 transition-colors"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* CLI Install Snippet */}
                <div className="pt-0.5">
                  <div className="flex items-center justify-between rounded-lg border border-[#1c2536] bg-[#0b0f17] px-3 py-2 font-mono text-xs text-slate-300 shadow-inner group/cli hover:border-slate-700 transition-colors">
                    <span className="truncate flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-blue-400/80 shrink-0" />
                      <span className="text-slate-500 font-medium">npx claude-code-templates@latest --skill</span>
                      <span className="text-amber-400 font-medium truncate">
                        {skill.owner.handle}/{skill.slug}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyCli(e, skill)}
                      title="Copy install command"
                      aria-label="Copy install command"
                      className="ml-2 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      {copiedSkillId === skill.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Attribution Badges */}
                {(skill.forkedFromSnapshot || skill.sourceUrl) && (
                  <div className="flex flex-wrap gap-1.5">
                    {skill.forkedFromSnapshot && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-slate-400 bg-[#0b0f17] px-2 py-0.5 rounded border border-[#1c2536]">
                        <GitFork className="w-3 h-3 shrink-0 text-slate-500" />
                        <span className="truncate max-w-[170px]">
                          @{skill.forkedFromSnapshot.ownerHandle}/{skill.forkedFromSnapshot.slug}
                        </span>
                      </span>
                    )}
                    {skill.sourceUrl && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-slate-400 bg-[#0b0f17] px-2 py-0.5 rounded border border-[#1c2536]">
                        <Github className="w-3 h-3 shrink-0 text-slate-500" />
                        <span>GitHub</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-[#1c2536] flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center space-x-1">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{skill.currentVersion?._count?.files || 0} files</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(skill.updatedAt).toLocaleDateString('en-US')}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/skills/${skill.id}/download`}
                    download
                    title="Download ZIP"
                    aria-label="Download ZIP"
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <Link
                    href={`/s/${skill.owner.handle}/${skill.slug}`}
                    className="text-xs font-semibold text-blue-400 hover:underline"
                  >
                    Inspect &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#1c2536] bg-[#111624] p-3.5 hover:border-slate-700 hover:bg-[#131b2c] transition-all duration-150"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <Link
                    href={`/s/${skill.owner.handle}/${skill.slug}`}
                    className="font-semibold text-sm tracking-tight text-slate-100 hover:text-blue-400 transition-colors truncate"
                  >
                    {skill.name}
                  </Link>
                  <span className="text-[11px] font-mono bg-[#0b0f17] text-slate-400 px-1.5 py-0.5 rounded border border-[#1c2536]">
                    v{skill.currentVersion?.number || 1}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    @{skill.owner.handle}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {skill.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={(e) => handleCopyCli(e, skill)}
                  title="Copy install command"
                  aria-label="Copy install command"
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0b0f17] border border-[#1c2536] text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedSkillId === skill.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>npx skillvault add</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(e, skill)}
                  disabled={unfavoritingId === skill.id}
                  aria-label="Remove from favorites"
                  title="Remove from favorites"
                  className="p-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </button>

                <a
                  href={`/api/skills/${skill.id}/download`}
                  download
                  title="Download ZIP"
                  aria-label="Download ZIP"
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <span className="text-[11px]">{new Date(skill.updatedAt).toLocaleDateString('en-US')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {cursor && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex min-h-[38px] items-center justify-center rounded-md border border-[#1c2536] bg-[#111624] px-5 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-[#1c2536] transition-colors disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                <span>Loading more favorites...</span>
              </>
            ) : (
              <span>Load more favorites</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
