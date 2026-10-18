'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Grid,
  List,
  Clock,
  FileCode,
  GitFork,
  X,
  Loader2,
  Compass,
  Tag,
  Star,
  Download,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';
import { Github } from '@/components/icons/github.js';

export function PublicClient({
  initialSkills = [],
  initialTotal = 0,
  initialCursor = null,
  user = null,
}) {
  const [skills, setSkills] = useState(initialSkills);
  const [total, setTotal] = useState(initialTotal);
  const [cursor, setCursor] = useState(initialCursor);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedSkillId, setCopiedSkillId] = useState(null);
  const [favoritingSkillId, setFavoritingSkillId] = useState(null);

  // Extract common tags from available skills
  const availableTags = Array.from(
    new Set(
      skills
        .flatMap((s) => s.tags || [])
        .map((t) => t.toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 15);

  const fetchSkills = async ({
    q = searchQuery,
    tag = selectedTag,
    sort = sortBy,
    nextCursor = null,
  } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    if (sort) params.set('sort', sort);
    if (nextCursor) params.set('cursor', nextCursor);
    params.set('limit', '20');

    const res = await fetch(`/api/skills?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    return null;
  };

  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    const data = await fetchSkills({ q: searchQuery, tag: selectedTag, sort: sortBy });
    if (data) {
      setSkills(data.skills);
      setTotal(data.total);
      setCursor(data.nextCursor);
    }
    setLoading(false);
  };

  const handleTagClick = async (tag) => {
    const newTag = selectedTag === tag ? '' : tag;
    setSelectedTag(newTag);
    setLoading(true);
    const data = await fetchSkills({ q: searchQuery, tag: newTag, sort: sortBy });
    if (data) {
      setSkills(data.skills);
      setTotal(data.total);
      setCursor(data.nextCursor);
    }
    setLoading(false);
  };

  const handleSortChange = async (newSort) => {
    setSortBy(newSort);
    setLoading(true);
    const data = await fetchSkills({ q: searchQuery, tag: selectedTag, sort: newSort });
    if (data) {
      setSkills(data.skills);
      setTotal(data.total);
      setCursor(data.nextCursor);
    }
    setLoading(false);
  };

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchSkills({
      q: searchQuery,
      tag: selectedTag,
      sort: sortBy,
      nextCursor: cursor,
    });
    if (data) {
      setSkills((prev) => [...prev, ...data.skills]);
      setCursor(data.nextCursor);
    }
    setLoadingMore(false);
  };

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

    if (!user) {
      toast.info('Please sign in to save skills to your favorites.');
      return;
    }

    if (favoritingSkillId === skill.id) return;
    setFavoritingSkillId(skill.id);

    try {
      const res = await fetch(`/api/skills/${skill.id}/favorite`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to update favorite status');
      }

      const json = await res.json();
      const favorited = json.data?.favorited;
      const count = json.data?.count ?? 0;

      setSkills((prev) =>
        prev.map((s) =>
          s.id === skill.id
            ? { ...s, isFavorited: favorited, favoritesCount: count }
            : s,
        ),
      );

      if (favorited) {
        toast.success(`Saved "${skill.name}" to favorites`);
      } else {
        toast.info(`Removed "${skill.name}" from favorites`);
      }
    } catch {
      toast.error('Unable to update favorite status. Please try again.');
    } finally {
      setFavoritingSkillId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-[#1c2536] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <Compass className="h-6 w-6 text-blue-400" />
          <span>Community Skills</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Open-source AI agent skills curated by the community. Browse, inspect code, install via CLI, or fork to your library.
        </p>
      </div>

      {/* Unified Search and Filters Bar */}
      <div className="flex flex-col gap-3 bg-[#111624] border border-[#1c2536] rounded-lg p-3 sm:p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search skills, prompts, workflows, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 min-h-[40px] rounded-md border border-[#1c2536] bg-[#0b0f17] text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchSkills({ q: '', tag: selectedTag, sort: sortBy }).then((d) => {
                    if (d) {
                      setSkills(d.skills);
                      setTotal(d.total);
                      setCursor(d.nextCursor);
                    }
                  });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 p-1 cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              aria-label="Sort skills"
              className="min-h-[40px] rounded-md border border-[#1c2536] bg-[#0b0f17] px-3 py-1.5 text-xs sm:text-sm text-slate-300 focus-visible:outline-none focus-visible:border-blue-500/60 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-colors cursor-pointer"
            >
              <option value="updated">Recently updated</option>
              <option value="name">Name (A-Z)</option>
              {searchQuery && <option value="relevance">Relevance</option>}
            </select>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-blue-600 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              <span>Search</span>
            </button>

            {/* View mode toggle */}
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
        </form>

        {/* Tag Filter Pills */}
        {availableTags.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-[#1c2536]/80">
            <span className="text-[11px] text-slate-500 mr-1 flex items-center">
              <Tag className="w-3 h-3 mr-1" /> Tags:
            </span>
            {availableTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`text-[11px] px-2.5 py-0.5 rounded font-mono transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border border-blue-500/50 bg-blue-500/15 text-blue-400 font-semibold'
                      : 'border border-[#1c2536] bg-[#0b0f17] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
        <span>
          Showing <strong className="text-slate-200 font-semibold">{total}</strong> community skills
          {selectedTag ? ` with tag #${selectedTag}` : ''}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </span>
      </div>

      {/* Skills Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-lg border border-[#1c2536] bg-[#111624] p-4 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-800 rounded w-1/2" />
                <div className="h-3.5 bg-slate-800 rounded w-12" />
              </div>
              <div className="h-3 bg-slate-800/80 rounded w-full" />
              <div className="h-3 bg-slate-800/80 rounded w-3/4" />
              <div className="pt-3 border-t border-[#1c2536] flex justify-between">
                <div className="h-3 bg-slate-800/60 rounded w-16" />
                <div className="h-3 bg-slate-800/60 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-16 bg-[#111624] border border-[#1c2536] rounded-lg space-y-3">
          <div className="h-10 w-10 rounded-full bg-slate-800/50 text-slate-400 flex items-center justify-center mx-auto border border-[#1c2536]">
            <Compass className="h-5 w-5" />
          </div>
          <p className="text-slate-400 font-medium text-xs sm:text-sm max-w-sm mx-auto">
            No community skills found matching your search criteria.
          </p>
          {(searchQuery || selectedTag) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('');
                fetchSkills({ q: '', tag: '', sort: sortBy }).then((d) => {
                  if (d) {
                    setSkills(d.skills);
                    setTotal(d.total);
                    setCursor(d.nextCursor);
                  }
                });
              }}
              className="inline-flex min-h-[38px] items-center text-xs text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View: Developer Package Manager Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="group relative flex flex-col justify-between rounded-xl border border-[#1e293b]/80 bg-gradient-to-b from-[#131b2c] to-[#0d1320] p-5 hover:border-blue-500/40 hover:from-[#162035] hover:to-[#0f1728] shadow-md hover:shadow-xl hover:shadow-blue-950/20 transition-all duration-200"
            >
              <div className="space-y-3.5">
                {/* Header: Icon, Title, Tags, Star Button */}
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

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono bg-[#0b0f17] text-slate-400 px-2 py-0.5 rounded-md border border-[#1c2536] font-medium shadow-2xs">
                      v{skill.currentVersion?.number || 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, skill)}
                      disabled={favoritingSkillId === skill.id}
                      aria-label={skill.isFavorited ? 'Remove from favorites' : 'Save to favorites'}
                      className={`px-2 py-1 rounded-md border text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        skill.isFavorited
                          ? 'border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold shadow-amber-500/10'
                          : 'border-[#1c2536] bg-[#0b0f17] text-slate-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-[#121927]'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 transition-transform group-hover/star:scale-110 ${
                          skill.isFavorited ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                      {skill.favoritesCount > 0 && (
                        <span className="text-[11px] font-mono">{skill.favoritesCount}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {skill.description || 'No description provided.'}
                </p>

                {/* Tags */}
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
                    {skill.tags.length > 3 && (
                      <span className="text-[10px] font-mono text-slate-500 self-center px-1">
                        +{skill.tags.length - 3}
                      </span>
                    )}
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
                      className="ml-2.5 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
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
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {skill.forkedFromSnapshot && (
                      <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 bg-[#0b0f17] px-2 py-0.5 rounded border border-[#1c2536]">
                        <GitFork className="w-3 h-3 shrink-0 text-slate-500" />
                        <span className="truncate max-w-[170px]">
                          @{skill.forkedFromSnapshot.ownerHandle}/{skill.forkedFromSnapshot.slug}
                        </span>
                      </span>
                    )}
                    {skill.sourceUrl && (
                      <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 bg-[#0b0f17] px-2 py-0.5 rounded border border-[#1c2536]">
                        <Github className="w-3 h-3 shrink-0 text-slate-500" />
                        <span>GitHub</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-[#1c2536]/80 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3.5">
                  <span className="flex items-center space-x-1.5">
                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                    <span>{skill.currentVersion?._count?.files || 0} files</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(skill.updatedAt).toLocaleDateString('en-US')}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/skills/${skill.id}/download`}
                    download
                    title="Download ZIP"
                    aria-label="Download ZIP"
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-[#1a2334] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <Link
                    href={`/s/${skill.owner.handle}/${skill.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors group-hover:translate-x-0.5"
                  >
                    <span>Inspect</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
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
                {skill.tags && skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {skill.tags.map((t) => (
                      <span
                        key={t}
                        className="bg-[#0b0f17] border border-[#1c2536] px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
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
                  disabled={favoritingSkillId === skill.id}
                  aria-label={skill.isFavorited ? 'Remove from favorites' : 'Save to favorites'}
                  className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                    skill.isFavorited
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-[#1c2536] bg-[#0b0f17] text-slate-400 hover:text-amber-400 hover:border-slate-700'
                  }`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      skill.isFavorited ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                  {skill.favoritesCount > 0 && (
                    <span className="text-[10px] font-mono">{skill.favoritesCount}</span>
                  )}
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

      {/* Pagination - Load More */}
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
                <span>Loading more skills...</span>
              </>
            ) : (
              <span>Load more skills</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
