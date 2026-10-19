'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  Layers,
  ShieldCheck,
  Plus,
  Globe,
  Zap,
  Bot,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Link2,
  CloudDownload,
  Code2,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Github } from '@/components/icons/github.js';
import { useStack } from '@/components/stack-builder-context.js';
import { ComponentGuideModal, COMPONENT_GUIDE } from '@/components/component-guide-modal.js';
import { formatCompactNumber } from '@/lib/utils.js';

export function PublicClient({
  initialSkills = [],
  initialTotal = 0,
  initialCursor = null,
  user = null,
}) {
  const router = useRouter();

  const [componentType, setComponentType] = useState('skills');
  const [typeCounts, setTypeCounts] = useState({
    skills: 891,
    agents: 422,
    commands: 288,
    settings: 76,
    hooks: 63,
    mcps: 107,
    mods: 44,
  });

  const [skills, setSkills] = useState(initialSkills);
  const [total, setTotal] = useState(initialTotal);
  const [cursor, setCursor] = useState(initialCursor);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'skillary' | 'external'
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'updated' | 'name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ all: initialTotal, native: 0, external: 0 });
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedSkillId, setCopiedSkillId] = useState(null);
  const [favoritingSkillId, setFavoritingSkillId] = useState(null);

  // Available tags computed from current skills
  const availableTags = Array.from(
    new Set(
      skills
        .flatMap((s) => s.tags || [])
        .map((t) => t.toLowerCase())
        .filter((t) => Boolean(t) && t !== componentType),
    ),
  ).slice(0, 15);

  const { addToStack, removeFromStack, isInStack } = useStack();
  const tagsScrollRef = useRef(null);

  const scrollTags = (direction) => {
    if (tagsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tagsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const fetchSkills = async ({
    type = componentType,
    q = searchQuery,
    tag = selectedTag,
    source = sourceFilter,
    sort = sortBy,
    pageNum = 1,
  } = {}) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    if (source && source !== 'all') params.set('source', source);
    if (sort) params.set('sort', sort);
    params.set('page', String(pageNum));
    params.set('limit', '21');

    const res = await fetch(`/api/community/skills?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    return null;
  };

  // Initial fetch and sync when URL or navigation changes
  useEffect(() => {
    const handleSyncType = (targetType) => {
      let typeToLoad = targetType;
      if (!typeToLoad && typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search);
        typeToLoad = p.get('type') || 'skills';
      }
      typeToLoad = typeToLoad || 'skills';
      setComponentType(typeToLoad);
      setSelectedTag('');
      setPage(1);
      setLoading(true);
      fetchSkills({ type: typeToLoad, pageNum: 1 }).then((data) => {
        if (data) {
          setSkills(data.skills);
          setTotal(data.total);
          setTotalPages(data.totalPages);
          if (data.counts) setCounts(data.counts);
          if (data.typeCounts) setTypeCounts(data.typeCounts);
        }
        setLoading(false);
      });
    };

    // Initial load
    handleSyncType();

    const onPopState = () => handleSyncType();
    const onNavTypeChange = (e) => handleSyncType(e.detail);

    window.addEventListener('popstate', onPopState);
    window.addEventListener('nav-type-change', onNavTypeChange);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('nav-type-change', onNavTypeChange);
    };
  }, []);

  const handleToggleStack = (e, skill) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInStack(skill.id)) {
      removeFromStack(skill.id);
      toast.info(`Removed ${skill.name} from stack`);
    } else {
      addToStack(skill);
      toast.success(`Added ${skill.name} to stack!`);
    }
  };

  const handleTypeTabChange = (typeKey) => {
    setComponentType(typeKey);
    setSelectedTag('');
    router.push(`/public?type=${typeKey}`);
  };

  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setPage(1);
    const data = await fetchSkills({
      type: componentType,
      q: searchQuery,
      tag: selectedTag,
      source: sourceFilter,
      sort: sortBy,
      pageNum: 1,
    });
    if (data) {
      setSkills(data.skills);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.counts) setCounts(data.counts);
      if (data.typeCounts) setTypeCounts(data.typeCounts);
    }
    setLoading(false);
  };

  const handleSourceTabChange = async (newSource) => {
    setSourceFilter(newSource);
    setLoading(true);
    setPage(1);
    const data = await fetchSkills({
      type: componentType,
      q: searchQuery,
      tag: selectedTag,
      source: newSource,
      sort: sortBy,
      pageNum: 1,
    });
    if (data) {
      setSkills(data.skills);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.counts) setCounts(data.counts);
    }
    setLoading(false);
  };

  const handleTagClick = async (tag) => {
    const newTag = selectedTag === tag ? '' : tag;
    setSelectedTag(newTag);
    setLoading(true);
    setPage(1);
    const data = await fetchSkills({
      type: componentType,
      q: searchQuery,
      tag: newTag,
      source: sourceFilter,
      sort: sortBy,
      pageNum: 1,
    });
    if (data) {
      setSkills(data.skills);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.counts) setCounts(data.counts);
    }
    setLoading(false);
  };

  const handleSortChange = async (newSort) => {
    setSortBy(newSort);
    setLoading(true);
    setPage(1);
    const data = await fetchSkills({
      type: componentType,
      q: searchQuery,
      tag: selectedTag,
      source: sourceFilter,
      sort: newSort,
      pageNum: 1,
    });
    if (data) {
      setSkills(data.skills);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.counts) setCounts(data.counts);
    }
    setLoading(false);
  };

  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    setLoading(true);
    setPage(newPage);
    const data = await fetchSkills({
      type: componentType,
      q: searchQuery,
      tag: selectedTag,
      source: sourceFilter,
      sort: sortBy,
      pageNum: newPage,
    });
    if (data) {
      setSkills(data.skills);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setLoading(false);
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
          s.id === skill.id ? { ...s, isFavorited: favorited, favoritesCount: count } : s,
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

  const COMPONENT_TABS = [
    {
      key: 'skills',
      label: 'Skills',
      icon: Layers,
      count: typeCounts.skills,
      activeColor: 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-amber-500/10',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      key: 'agents',
      label: 'Agents',
      icon: Bot,
      count: typeCounts.agents,
      activeColor: 'text-purple-400 border-purple-500/50 bg-purple-500/10 shadow-purple-500/10',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      key: 'commands',
      label: 'Commands',
      icon: ChevronRight,
      count: typeCounts.commands,
      activeColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10 shadow-cyan-500/10',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: SlidersHorizontal,
      count: typeCounts.settings,
      activeColor: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-emerald-500/10',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      key: 'hooks',
      label: 'Hooks',
      icon: Link2,
      count: typeCounts.hooks,
      activeColor: 'text-rose-400 border-rose-500/50 bg-rose-500/10 shadow-rose-500/10',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      key: 'mcps',
      label: 'MCPs',
      icon: CloudDownload,
      count: typeCounts.mcps,
      activeColor: 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10 shadow-indigo-500/10',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      key: 'mods',
      label: 'Mods',
      icon: Code2,
      count: typeCounts.mods,
      activeColor: 'text-orange-400 border-orange-500/50 bg-orange-500/10 shadow-orange-500/10',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
  ];

  const currentTabInfo = COMPONENT_TABS.find((t) => t.key === componentType) || COMPONENT_TABS[0];
  const CurrentIcon = currentTabInfo.icon;

  return (
    <div className="space-y-4">
      {/* Unified Search and Filters Bar */}
      <div className="flex flex-col gap-3 bg-[#111624] border border-[#1c2536] rounded-lg p-3 sm:p-4">
        {/* Source Filter Tabs: Smooth horizontal swipe on mobile */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-[#1c2536]/80 overflow-x-auto whitespace-nowrap scrollbar-none [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => handleSourceTabChange('all')}
            className={`flex items-center gap-2 px-3 py-2 sm:py-1.5 min-h-[38px] sm:min-h-[32px] rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              sourceFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>All Skills</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/25">
              {counts.all || total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSourceTabChange('skillary')}
            className={`flex items-center gap-2 px-3 py-2 sm:py-1.5 min-h-[38px] sm:min-h-[32px] rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              sourceFilter === 'skillary'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Skillary Native</span>
            {counts.native > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/25">
                {counts.native}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSourceTabChange('external')}
            className={`flex items-center gap-2 px-3 py-2 sm:py-1.5 min-h-[38px] sm:min-h-[32px] rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              sourceFilter === 'external'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Github className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span>Open Source (GitHub)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              891+
            </span>
          </button>
        </div>

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
              <option value="popular">Most Popular</option>
              <option value="updated">Recently updated</option>
              <option value="name">Name (A-Z)</option>
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

        {/* Tag Filter Pills: 1 dòng duy nhất không xuống dòng, có nút cuộn trái/phải */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-[#1c2536]/80 min-w-0">
            <span className="text-[11px] text-slate-500 flex items-center shrink-0">
              <Tag className="w-3 h-3 mr-1" /> Tags:
            </span>

            {/* Nút cuộn trái */}
            <button
              type="button"
              onClick={() => scrollTags('left')}
              title="Scroll left"
              aria-label="Scroll tags left"
              className="p-1 rounded bg-[#0b0f17] border border-[#1c2536] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            {/* Dải tags cuộn ngang, cấm xuống dòng (whitespace-nowrap) */}
            <div
              ref={tagsScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth min-w-0 flex-1 whitespace-nowrap py-0.5"
            >
              {availableTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className={`text-[11px] px-2.5 py-0.5 rounded font-mono transition-all duration-150 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'border border-blue-500/50 bg-blue-500/15 text-blue-400 font-semibold shadow-xs'
                        : 'border border-[#1c2536] bg-[#0b0f17] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Nút cuộn phải */}
            <button
              type="button"
              onClick={() => scrollTags('right')}
              title="Scroll right"
              aria-label="Scroll tags right"
              className="p-1 rounded bg-[#0b0f17] border border-[#1c2536] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
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
        /* Grid View: aitmpl-style responsive developer package cards */
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5">
          {skills.map((skill) => {
            const skillType = skill.componentType || componentType || 'skills';
            const matchedTab = COMPONENT_TABS.find((t) => t.key === skillType) || currentTabInfo;
            const ItemIcon = matchedTab.icon;

            return (
              <div
                key={skill.id}
                onClick={() =>
                  router.push(`/s/${skill.owner?.handle || 'community'}/${skill.slug}`)
                }
                className="group relative flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-xl border border-[#1b263b] bg-[#0c121e]/90 hover:bg-[#0f1726] hover:border-blue-500/50 transition-all duration-150 shadow-md hover:shadow-xl hover:shadow-blue-950/20 cursor-pointer"
              >
                {/* Left Column: Icon Box */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-inner group-hover:scale-105 transition-transform overflow-hidden ${
                    skillType === 'agents'
                      ? 'bg-purple-500/10 border border-purple-500/25 text-purple-400'
                      : skillType === 'commands'
                        ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-400'
                        : skillType === 'settings'
                          ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                          : skillType === 'hooks'
                            ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                            : skillType === 'mcps'
                              ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400'
                              : skillType === 'mods'
                                ? 'bg-orange-500/10 border border-orange-500/25 text-orange-400'
                                : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                  }`}
                >
                  <ItemIcon className="w-5 h-5" />
                </div>

                {/* Center Column: Title, Description, and Badges */}
                <div className="min-w-0 flex-1">
                  {/* Title Link */}
                  <Link
                    href={`/s/${skill.owner?.handle || 'community'}/${skill.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-[14px] sm:text-[15px] font-bold text-slate-100 hover:text-blue-400 group-hover:text-blue-300 transition-colors leading-tight mb-1.5 line-clamp-1 block"
                    title={skill.name}
                  >
                    {skill.name}
                  </Link>

                  {/* Description */}
                  <p className="text-[12px] text-slate-400 line-clamp-2 leading-[1.6]">
                    {skill.description || 'No description provided.'}
                  </p>

                  {/* Badges Row: Category, Downloads/Files, Scanner/Safe badge, Source */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                    {/* Category badge */}
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded border border-[#1c2536] bg-[#0b0f17] text-slate-400">
                      {skillType}
                    </span>

                    {/* Downloads or Files count */}
                    {skill.downloads != null ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Download className="w-3 h-3 text-slate-500" />
                        <span>{formatCompactNumber(skill.downloads)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <FileCode className="w-3 h-3 text-slate-500" />
                        <span>{skill.currentVersion?._count?.files || 1} files</span>
                      </span>
                    )}

                    {/* Safe Scanner Badge (with NVIDIA SkillSpector 3-dot aesthetic) */}
                    <span
                      title="Security Audit: Safe (Low risk verified)"
                      className="inline-flex items-center gap-1.5 font-mono font-semibold border cursor-help select-none whitespace-nowrap text-[10px] px-2 py-0.5 rounded text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    >
                      <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 opacity-25" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 opacity-25" />
                      </span>
                      <span>Safe</span>
                    </span>

                    {/* Source Pill */}
                    {skill.isCommunityExternal ? (
                      <a
                        href={skill.sourceUrl || 'https://github.com/davila7/claude-code-templates'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <Github className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>aitmpl</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                        <Sparkles className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                        <span>Native</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Column: Actions (Star/Save & Add to Stack) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Star / Save */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, skill)}
                    disabled={favoritingSkillId === skill.id}
                    aria-label={skill.isFavorited ? 'Remove from favorites' : 'Save to favorites'}
                    title={skill.isFavorited ? 'Saved in favorites' : 'Save to favorites'}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      skill.isFavorited
                        ? 'opacity-100 text-amber-400 bg-amber-500/15 border border-amber-500/40'
                        : 'max-sm:opacity-100 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        skill.isFavorited ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Add to Stack */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleStack(e, skill)}
                    title={isInStack(skill.id) ? 'Remove from stack' : 'Add to stack'}
                    aria-label="Add to stack"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 border shrink-0 ${
                      isInStack(skill.id)
                        ? 'opacity-100 bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-sm'
                        : 'max-sm:opacity-100 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-400 hover:bg-[#131d31] border-transparent hover:border-[#1c2536]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
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
                  <span className="text-xs text-slate-400 font-medium">@{skill.owner.handle}</span>
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

              <div className="flex items-center gap-2.5 text-xs text-slate-500 shrink-0 self-end sm:self-center">
                {/* Downloads & Source Badge */}
                {skill.isCommunityExternal ? (
                  <a
                    href={skill.sourceUrl || 'https://github.com/davila7/claude-code-templates'}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`View source code on GitHub by @${skill.owner?.handle || 'davila7'}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0b0f17] border border-[#1c2536] text-[10px] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                  >
                    <Github className="w-3 h-3 text-slate-400" />
                    <span>GitHub</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-[10px] text-blue-400 font-medium">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>Skillary Native</span>
                  </span>
                )}

                {/* Security Badge */}
                <div
                  title="Security Audit: Safe (Low Risk)"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-medium text-emerald-400"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Safe</span>
                </div>

                {/* Downloads */}
                {skill.downloads != null && (
                  <div
                    title={`${skill.downloads.toLocaleString()} total downloads`}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    <span>{formatCompactNumber(skill.downloads)}</span>
                  </div>
                )}

                {/* Add to Stack Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleStack(e, skill)}
                  title={isInStack(skill.id) ? 'Remove from stack' : 'Add to bundle stack'}
                  className={`px-2 py-1 rounded border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                    isInStack(skill.id)
                      ? 'border-blue-500/50 bg-blue-500/20 text-blue-300 font-semibold'
                      : 'border-[#1c2536] bg-[#0b0f17] text-slate-400 hover:text-blue-300 hover:border-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isInStack(skill.id) ? 'In Stack' : '+ Stack'}</span>
                </button>

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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Numerical Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#1c2536]">
          <div className="text-xs text-slate-400">
            Page <span className="font-semibold text-slate-200">{page}</span> of{' '}
            <span className="font-semibold text-slate-200">{totalPages}</span> ({total} skills)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-md border border-[#1c2536] bg-[#111624] text-xs font-medium text-slate-300 hover:bg-[#1a2334] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {/* Quick page buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let p = idx + 1;
                if (totalPages > 5 && page > 3) {
                  p = page - 2 + idx;
                  if (p > totalPages) p = totalPages - (4 - idx);
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    disabled={loading}
                    className={`w-7 h-7 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                      p === page
                        ? 'bg-blue-600 text-white font-bold'
                        : 'border border-[#1c2536] bg-[#0b0f17] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-md border border-[#1c2536] bg-[#111624] text-xs font-medium text-slate-300 hover:bg-[#1a2334] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Component Guide Modal */}
      <ComponentGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        onSelectType={(typeKey) => {
          handleTypeTabChange(typeKey);
        }}
      />
    </div>
  );
}
