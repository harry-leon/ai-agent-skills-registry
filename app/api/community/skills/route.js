import { NextResponse } from 'next/server';
import { searchPublicSkills } from '@/lib/dal/search.js';
import { getServerSession } from '@/lib/auth/session.js';

// Cache memory trong 10 phút để giảm tải mạng và tăng tốc phản hồi
const cacheStore = {
  skills: { data: null, fetchedAt: 0 },
  agents: { data: null, fetchedAt: 0 },
  commands: { data: null, fetchedAt: 0 },
  settings: { data: null, fetchedAt: 0 },
  hooks: { data: null, fetchedAt: 0 },
  mcps: { data: null, fetchedAt: 0 },
  mods: { data: null, fetchedAt: 0 },
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const COMPONENT_TYPES = [
  { key: 'skills', label: 'Skills', defaultCount: 891 },
  { key: 'agents', label: 'Agents', defaultCount: 422 },
  { key: 'commands', label: 'Commands', defaultCount: 288 },
  { key: 'settings', label: 'Settings', defaultCount: 76 },
  { key: 'hooks', label: 'Hooks', defaultCount: 63 },
  { key: 'mcps', label: 'MCPs', defaultCount: 107 },
  { key: 'mods', label: 'Mods', defaultCount: 44 },
];

async function getExternalComponents(componentType = 'skills') {
  const validKey = COMPONENT_TYPES.some((c) => c.key === componentType) ? componentType : 'skills';

  const entry = cacheStore[validKey] || { data: null, fetchedAt: 0 };
  const now = Date.now();
  if (entry.data && now - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.data;
  }

  try {
    const res = await fetch(`https://aitmpl.com/components/${validKey}.json`, {
      headers: {
        'User-Agent': 'SkillVault-Registry/1.0',
      },
      next: { revalidate: 600 }, // Next.js ISR cache 10 mins
    });

    if (!res.ok) {
      console.warn(`[API] aitmpl.com returned status ${res.status} for ${validKey}`);
      return entry.data || [];
    }

    const rawData = await res.json();
    if (!Array.isArray(rawData)) return [];

    // Transform sang định dạng chuẩn của Skillary
    const transformed = rawData.map((item) => {
      const slug = item.path
        ? item.path
            .split('/')
            .pop()
            .replace(/\.(md|json|ts)$/, '')
        : item.name;
      const category = item.category || 'general';
      const author = item.author || 'claude-code-templates';
      const repoUrl =
        item.repo ||
        `https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/${validKey}/${item.path}`;

      return {
        id: `ext-${validKey}-${category}-${slug}`,
        name: item.name
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        slug: slug,
        description: item.description || `Community open-source ${validKey.slice(0, -1)}.`,
        visibility: 'PUBLIC',
        componentType: validKey,
        tags: [validKey, category, ...(item.keywords || [])].filter(Boolean),
        downloads: item.downloads || 0,
        isExternal: true,
        isCommunityExternal: true,
        source: 'aitmpl',
        sourceName: 'davila7 / claude-code-templates',
        sourceUrl: repoUrl,
        authorHandle: 'community',
        authorName: author,
        skillspector: item.skillspector || {
          score: 0,
          severity: 'LOW',
          recommendation: 'SAFE',
        },
        currentVersion: {
          number: item.version ? parseInt(item.version, 10) || 1 : 1,
          _count: { files: 1 },
        },
        owner: {
          handle: 'community',
          name: 'Open Source Community',
        },
        updatedAt: item.skillspector?.scannedAt || new Date().toISOString(),
      };
    });

    cacheStore[validKey] = { data: transformed, fetchedAt: now };
    return transformed;
  } catch (error) {
    console.error(`[API] Failed to fetch external ${validKey}:`, error.message);
    return entry.data || [];
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    const actor = session?.id ? session : session?.user || null;

    const { searchParams } = new URL(request.url);
    const componentType = (searchParams.get('type') || 'skills').toLowerCase();
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const tag = (searchParams.get('tag') || '').toLowerCase().trim();
    const sourceFilter = searchParams.get('source') || 'all'; // 'all' | 'skillary' | 'external'
    const sort = searchParams.get('sort') || 'popular'; // 'popular' | 'updated' | 'name'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '21', 10)));

    // 1. Lấy Native Skills từ Database Neon (chỉ khi duyệt loại 'skills' hoặc người dùng lọc riêng native)
    let nativeSkills = [];
    if (componentType === 'skills' && (sourceFilter === 'all' || sourceFilter === 'skillary')) {
      try {
        const dbResult = await searchPublicSkills({
          q,
          tag,
          sort: sort === 'popular' ? 'updated' : sort,
          limit: 100,
          userId: actor?.id || null,
        });

        nativeSkills = (dbResult.skills || []).map((s) => ({
          ...s,
          isExternal: false,
          isCommunityExternal: false,
          componentType:
            s.tags?.find((t) => COMPONENT_TYPES.some((c) => c.key === t.toLowerCase())) || 'skills',
          source: 'skillary',
          sourceName: 'Skillary Registry Native',
          downloads: s.downloadCount || 0,
          skillspector: {
            score: 0,
            severity: 'LOW',
            recommendation: 'SAFE',
          },
        }));
      } catch (e) {
        console.error('[API] Error loading native skills:', e.message);
      }
    }

    // 2. Lấy External Items từ aitmpl / GitHub API theo componentType
    let externalItems = [];
    if (sourceFilter === 'all' || sourceFilter === 'external') {
      const allExt = await getExternalComponents(componentType);
      externalItems = allExt.filter((s) => {
        const matchQ =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q);

        const matchTag = !tag || s.tags.some((t) => t.toLowerCase() === tag);

        return matchQ && matchTag;
      });
    }

    // 3. Kết hợp kết quả
    let combined = [...nativeSkills, ...externalItems];

    // 4. Sắp xếp (Sort)
    if (sort === 'popular') {
      combined.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sort === 'name') {
      combined.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // updated
      combined.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    const total = combined.length;
    const startIndex = (page - 1) * limit;
    const pagedSkills = combined.slice(startIndex, startIndex + limit);

    // Tính toán danh sách category tags phổ biến cho loại này
    const availableCategories = Array.from(new Set(combined.flatMap((s) => s.tags || [])))
      .filter((t) => t.toLowerCase() !== componentType)
      .slice(0, 20);

    // Thu thập tổng số lượng của từng loại
    const typeCounts = {
      skills:
        (cacheStore.skills.data?.length || 891) +
        (componentType === 'skills' ? nativeSkills.length : 0),
      agents: cacheStore.agents.data?.length || 422,
      commands: cacheStore.commands.data?.length || 288,
      settings: cacheStore.settings.data?.length || 76,
      hooks: cacheStore.hooks.data?.length || 63,
      mcps: cacheStore.mcps.data?.length || 107,
      mods: cacheStore.mods.data?.length || 44,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          skills: pagedSkills,
          total,
          page,
          totalPages: Math.ceil(total / limit),
          categories: availableCategories,
          componentType,
          typeCounts,
          counts: {
            all: total,
            native: nativeSkills.length,
            external: externalItems.length,
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        },
      },
    );
  } catch (err) {
    console.error('[API /api/community/skills] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve community components' },
      { status: 500 },
    );
  }
}
