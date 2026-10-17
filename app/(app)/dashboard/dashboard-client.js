'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Grid,
  List,
  Plus,
  GitFork,
  FileCode,
  Clock,
  Tag,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import { Github } from '@/components/icons/github.js';

export function DashboardClient({ initialSkills = [], initialTotal = 0, initialCursor = null }) {
  const [skills, setSkills] = useState(initialSkills);
  const [total, setTotal] = useState(initialTotal);
  const [cursor, setCursor] = useState(initialCursor);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Available tags in caller's library
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
    visibility = selectedVisibility,
    sort = sortBy,
    nextCursor = null,
  } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    if (visibility) params.set('visibility', visibility);
    if (sort) params.set('sort', sort);
    if (nextCursor) params.set('cursor', nextCursor);
    params.set('limit', '20');

    const res = await fetch(`/api/me/skills?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
    return null;
  };

  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    const data = await fetchSkills({
      q: searchQuery,
      tag: selectedTag,
      visibility: selectedVisibility,
      sort: sortBy,
    });
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
    const data = await fetchSkills({
      q: searchQuery,
      tag: newTag,
      visibility: selectedVisibility,
      sort: sortBy,
    });
    if (data) {
      setSkills(data.skills);
      setTotal(data.total);
      setCursor(data.nextCursor);
    }
    setLoading(false);
  };

  const handleVisibilityChange = async (newVis) => {
    setSelectedVisibility(newVis);
    setLoading(true);
    const data = await fetchSkills({
      q: searchQuery,
      tag: selectedTag,
      visibility: newVis,
      sort: sortBy,
    });
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
    const data = await fetchSkills({
      q: searchQuery,
      tag: selectedTag,
      visibility: selectedVisibility,
      sort: newSort,
    });
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
      visibility: selectedVisibility,
      sort: sortBy,
      nextCursor: cursor,
    });
    if (data) {
      setSkills((prev) => [...prev, ...data.skills]);
      setCursor(data.nextCursor);
    }
    setLoadingMore(false);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 bg-card border rounded-xl p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm kỹ năng trong thư viện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchSkills({
                    q: '',
                    tag: selectedTag,
                    visibility: selectedVisibility,
                    sort: sortBy,
                  }).then((d) => {
                    if (d) {
                      setSkills(d.skills);
                      setTotal(d.total);
                      setCursor(d.nextCursor);
                    }
                  });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Visibility selector */}
            <select
              value={selectedVisibility}
              onChange={(e) => handleVisibilityChange(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Tất cả phạm vi</option>
              <option value="PRIVATE">Riêng tư</option>
              <option value="UNLISTED">Không công khai</option>
              <option value="PUBLIC">Công khai</option>
            </select>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="updated">Mới cập nhật</option>
              <option value="name">Tên (A-Z)</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              <span>Tìm</span>
            </button>

            {/* View mode toggle */}
            <div className="hidden sm:flex border rounded-md overflow-hidden bg-background">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dạng lưới"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Tag Filter Pills */}
        {availableTags.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground mr-1 flex items-center">
              <Tag className="w-3 h-3 mr-1" /> Thẻ:
            </span>
            {availableTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Tổng số <strong>{total}</strong> kỹ năng
          {selectedVisibility ? ` [${selectedVisibility}]` : ''}
          {selectedTag ? ` có thẻ #${selectedTag}` : ''}
          {searchQuery ? ` phù hợp với "${searchQuery}"` : ''}
        </span>
      </div>

      {/* Skills Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-xl border bg-card/60 p-5 animate-pulse space-y-3">
              <div className="h-5 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted/60 rounded w-full" />
              <div className="h-4 bg-muted/60 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-xl space-y-3">
          <p className="text-muted-foreground font-medium text-sm">
            {searchQuery || selectedTag || selectedVisibility
              ? 'Không tìm thấy kỹ năng nào phù hợp với bộ lọc.'
              : 'Thư viện chưa có kỹ năng nào.'}
          </p>
          {searchQuery || selectedTag || selectedVisibility ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('');
                setSelectedVisibility('');
                fetchSkills({ q: '', tag: '', visibility: '', sort: sortBy }).then((d) => {
                  if (d) {
                    setSkills(d.skills);
                    setTotal(d.total);
                    setCursor(d.nextCursor);
                  }
                });
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Xóa bộ lọc
            </button>
          ) : (
            <div className="pt-2">
              <Link
                href="/skills/new"
                className="inline-flex items-center space-x-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm kỹ năng đầu tiên</span>
              </Link>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/s/${skill.owner.handle}/${skill.slug}`}
              className="group flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:border-foreground/30 hover:shadow-sm transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {skill.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0 ${
                      skill.visibility === 'PUBLIC'
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                        : skill.visibility === 'UNLISTED'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-secondary text-secondary-foreground border border-border'
                    }`}
                  >
                    {skill.visibility === 'PUBLIC'
                      ? 'Công khai'
                      : skill.visibility === 'UNLISTED'
                        ? 'Liên kết'
                        : 'Riêng tư'}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {skill.description || 'Không có mô tả chi tiết.'}
                </p>

                {/* Tags */}
                {skill.tags && skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {skill.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="bg-muted px-2 py-0.5 rounded text-[11px] text-muted-foreground font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                    {skill.tags.length > 3 && (
                      <span className="text-[11px] text-muted-foreground self-center">
                        +{skill.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Attribution Badges */}
                {(skill.forkedFromSnapshot || skill.sourceUrl) && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {skill.forkedFromSnapshot && (
                      <span className="inline-flex items-center space-x-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border">
                        <GitFork className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          Từ @{skill.forkedFromSnapshot.ownerHandle}/{skill.forkedFromSnapshot.slug}
                        </span>
                      </span>
                    )}
                    {skill.sourceUrl && (
                      <span className="inline-flex items-center space-x-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border">
                        <Github className="w-3 h-3 shrink-0" />
                        <span>GitHub</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <FileCode className="w-3 h-3" />
                  <span>
                    v{skill.currentVersion?.number || 1} · {skill.currentVersion?._count?.files || 0} tệp
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(skill.updatedAt).toLocaleDateString('vi-VN')}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/s/${skill.owner.handle}/${skill.slug}`}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-xs hover:border-foreground/30 hover:shadow-sm transition-all"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                    {skill.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      skill.visibility === 'PUBLIC'
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                        : skill.visibility === 'UNLISTED'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {skill.visibility === 'PUBLIC'
                      ? 'Công khai'
                      : skill.visibility === 'UNLISTED'
                        ? 'Liên kết'
                        : 'Riêng tư'}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    v{skill.currentVersion?.number || 1}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {skill.description || 'Không có mô tả chi tiết.'}
                </p>
                {skill.tags && skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {skill.tags.map((t) => (
                      <span
                        key={t}
                        className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 self-end sm:self-center">
                <span>{skill.currentVersion?._count?.files || 0} tệp</span>
                <span>{new Date(skill.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination - Load More */}
      {cursor && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-input bg-card px-6 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Đang tải thêm...</span>
              </>
            ) : (
              <span>Xem thêm kỹ năng</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
