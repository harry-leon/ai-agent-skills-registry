import { notFound } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session.js';
import { getSkillByHandleAndSlug } from '@/lib/dal/skills.js';
import { getVersionFiles } from '@/lib/dal/files.js';
import { can, ACTIONS } from '@/lib/auth/policy.js';
import { storage } from '@/lib/storage/index.js';
import { SkillViewerClient } from './viewer-client.js';

export const dynamic = 'force-dynamic';

export default async function SkillViewerPage({ params }) {
  const { handle, slug } = await params;
  const session = await getServerSession();
  const actor = session?.id ? session : session?.user || null;

  // 1. Fetch skill by owner handle and slug
  const skill = await getSkillByHandleAndSlug(actor, handle, slug);

  // 2. IDOR / Visibility Protection (Section S2, Rule R4)
  if (!skill || !can(actor, ACTIONS.SKILL_READ, skill)) {
    notFound();
  }

  // 3. Fetch current version files
  const files = skill.currentVersionId ? await getVersionFiles(skill.currentVersionId) : [];

  // 4. Preload SKILL.md content for immediate SSR render
  let initialContent = '';
  const skillMdFile = files.find((f) => f.path === 'SKILL.md');
  if (skillMdFile) {
    const buffer = await storage.getBlobBuffer(skillMdFile.blobSha256);
    if (buffer) {
      initialContent = buffer.toString('utf-8');
    }
  }

  const canWrite = can(actor, ACTIONS.SKILL_WRITE, skill);
  const canFork = Boolean(actor && can(actor, ACTIONS.SKILL_FORK, skill));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SkillViewerClient
        skill={skill}
        files={files}
        initialContent={initialContent}
        canWrite={canWrite}
        canFork={canFork}
        shareToken={skill.shareToken}
      />
    </div>
  );
}
