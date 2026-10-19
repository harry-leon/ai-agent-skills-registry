import { notFound } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session.js';
import { getSkillByHandleAndSlug } from '@/lib/dal/skills.js';
import { getVersionFiles } from '@/lib/dal/files.js';
import { isSkillFavorited, getSkillFavoriteCount } from '@/lib/dal/favorites.js';
import { getCommunitySkillBySlug } from '@/lib/dal/community-skills.js';
import { can, ACTIONS } from '@/lib/auth/policy.js';
import { storage } from '@/lib/storage/index.js';
import { AppShell } from '@/components/app-shell.js';
import { SkillViewerClient } from './viewer-client.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { handle, slug } = await params;
  return {
    title: `${slug} - Skills for Claude Code | Skillary`,
    description: `Inspect, install, and download @${handle}/${slug} AI agent skill.`,
  };
}

export default async function SkillViewerPage({ params }) {
  const { handle, slug } = await params;
  const session = await getServerSession();
  const actor = session?.id ? session : session?.user || null;

  // 1. Fetch skill from database first
  let skill = await getSkillByHandleAndSlug(actor, handle, slug);
  let files = [];
  let initialContent = '';

  // 2. If not found in database and handle is community / templates / external or not in DB, lookup community skills
  if (!skill) {
    const communityData = await getCommunitySkillBySlug(slug);
    if (communityData) {
      skill = communityData.skill;
      files = communityData.files;
      initialContent = communityData.initialContent;
    }
  }

  // 3. IDOR / Visibility Protection (Section S2, Rule R4)
  if (!skill || !can(actor, ACTIONS.SKILL_READ, skill)) {
    notFound();
  }

  // 4. Fetch files and initialContent for database skills
  if (!skill.isCommunityExternal) {
    files = skill.currentVersionId ? await getVersionFiles(skill.currentVersionId) : [];
    const skillMdFile = files.find((f) => f.path === 'SKILL.md');
    if (skillMdFile) {
      const buffer = await storage.getBlobBuffer(skillMdFile.blobSha256);
      if (buffer) {
        initialContent = buffer.toString('utf-8');
      }
    }
  }

  const canWrite = can(actor, ACTIONS.SKILL_WRITE, skill);
  const canFork = Boolean(actor && can(actor, ACTIONS.SKILL_FORK, skill));
  const isFavorited =
    actor && !skill.isCommunityExternal ? await isSkillFavorited(actor.id, skill.id) : false;
  const favoritesCount = !skill.isCommunityExternal
    ? await getSkillFavoriteCount(skill.id)
    : skill.downloads || 0;

  return (
    <AppShell user={actor}>
      <SkillViewerClient
        skill={skill}
        files={files}
        initialContent={initialContent}
        canWrite={canWrite}
        canFork={canFork}
        user={actor}
        initialIsFavorited={isFavorited}
        initialFavoritesCount={favoritesCount}
        shareToken={skill.shareToken}
      />
    </AppShell>
  );
}
