// lib/dal/community-skills.js

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cacheStore = {};

const COMPONENT_TYPES = ['skills', 'agents', 'commands', 'settings', 'hooks', 'mcps', 'mods'];

/**
 * Fetch and cache components of a specific type from aitmpl.com
 */
async function fetchTypeComponents(type) {
  const cached = cacheStore[type];
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(`https://aitmpl.com/components/${type}.json`, {
      headers: {
        'User-Agent': 'SkillVault-Registry/1.0',
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return cached?.data || [];
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      cacheStore[type] = {
        data,
        fetchedAt: now,
      };
      return data;
    }
  } catch (err) {
    console.warn(`[Community] Failed to fetch components for ${type}:`, err?.message);
  }

  return cached?.data || [];
}

/**
 * Find and load a community skill/component by slug across all categories
 */
export async function getCommunitySkillBySlug(slug) {
  if (!slug) return null;

  // Search through all component types
  for (const type of COMPONENT_TYPES) {
    const items = await fetchTypeComponents(type);
    const item = items.find((x) => {
      const itemSlug = x.path
        ? x.path
            .split('/')
            .pop()
            .replace(/\.(md|json|ts)$/, '')
        : x.name;
      return (
        itemSlug.toLowerCase() === slug.toLowerCase() ||
        x.name?.toLowerCase() === slug.toLowerCase() ||
        x.path?.toLowerCase().endsWith(`/${slug.toLowerCase()}`)
      );
    });

    if (item) {
      const category = item.category || 'general';
      const rawSlug = item.path
        ? item.path
            .split('/')
            .pop()
            .replace(/\.(md|json|ts)$/, '')
        : item.name;

      // Determine raw GitHub content URL
      let rawUrl = '';
      let filePath = 'SKILL.md';

      if (type === 'skills') {
        rawUrl = `https://raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components/skills/${item.path}/SKILL.md`;
        filePath = 'SKILL.md';
      } else {
        rawUrl = `https://raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components/${type}/${item.path}`;
        filePath = item.path.split('/').pop() || `${rawSlug}.md`;
      }

      let rawContent = '';
      try {
        const rawRes = await fetch(rawUrl, {
          headers: { 'User-Agent': 'SkillVault-Registry/1.0' },
          next: { revalidate: 3600 },
        });
        if (rawRes.ok) {
          rawContent = await rawRes.text();
        }
      } catch (e) {
        console.warn(`[Community] Could not fetch raw content for ${item.path}:`, e?.message);
      }

      // Fallback markdown if raw content could not be fetched
      if (!rawContent) {
        rawContent = `# ${item.name
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(
            ' ',
          )}\n\n> Category: \`${category}\` | Type: \`${type}\`\n\n${item.description || 'Open source community template for Claude Code and AI agents.'}\n\n## Quick Install\n\`\`\`bash\nnpx claude-code-templates@latest --skill ${item.path || rawSlug}\n\`\`\`\n\nView full source on [GitHub](${item.repo || `https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/${type}/${item.path}`}).`;
      }

      const formattedName = item.name
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const repoUrl =
        item.repo ||
        `https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/${type}/${item.path}`;

      const skill = {
        id: `ext-${type}-${category}-${rawSlug}`,
        name: formattedName,
        slug: rawSlug,
        description:
          item.description ||
          `Guidance and tooling for distinctive execution with Claude Code and AI agents.`,
        visibility: 'PUBLIC',
        componentType: type,
        category: category,
        tags: [type, category, ...(item.keywords || [])].filter(Boolean),
        downloads: item.downloads || 0,
        isExternal: true,
        isCommunityExternal: true,
        source: 'aitmpl',
        sourceName: 'davila7 / claude-code-templates',
        sourceUrl: repoUrl,
        installPath: item.path || `${category}/${rawSlug}`,
        authorHandle: 'community',
        authorName: item.author || 'Open Source Community',
        skillspector: item.skillspector || {
          score: 0,
          severity: 'LOW',
          recommendation: 'SAFE',
        },
        currentVersionId: `ver-ext-${rawSlug}`,
        currentVersion: {
          number: item.version ? parseInt(item.version, 10) || 1 : 1,
          _count: { files: 1 },
        },
        owner: {
          id: 'community-system-user',
          handle: 'community',
          name: item.author || 'Open Source Community',
        },
        updatedAt: item.skillspector?.scannedAt || new Date().toISOString(),
      };

      const files = [
        {
          id: `f-${rawSlug}-main`,
          path: filePath,
          isText: true,
          size: rawContent.length,
        },
      ];

      return {
        skill,
        files,
        initialContent: rawContent,
      };
    }
  }

  return null;
}
