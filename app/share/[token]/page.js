import { notFound } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session.js';
import { getSkillByShareToken } from '@/lib/dal/skills.js';
import { getVersionFiles } from '@/lib/dal/files.js';
import { can, ACTIONS } from '@/lib/auth/policy.js';
import { storage } from '@/lib/storage/index.js';
import { SkillViewerClient } from '@/app/s/[handle]/[slug]/viewer-client.js';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shared Skill - SkillVault',
  description: 'View an unlisted skill via secret share link.',
};

export default async function ShareViewerPage({ params }) {
  const { token } = await params;
  const session = await getServerSession();
  const actor = session?.id ? session : session?.user || null;

  // 1. Fetch unlisted skill strictly by active shareToken
  const skill = await getSkillByShareToken(token);

  if (!skill || !can(null, ACTIONS.SKILL_READ, skill)) {
    notFound();
  }

  // 2. Fetch current version files
  const files = skill.currentVersionId ? await getVersionFiles(skill.currentVersionId) : [];

  // 3. Preload SKILL.md
  let initialContent = '';
  const skillMdFile = files.find((f) => f.path === 'SKILL.md');
  if (skillMdFile) {
    const buffer = await storage.getBlobBuffer(skillMdFile.blobSha256);
    if (buffer) {
      initialContent = buffer.toString('utf-8');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2.5 rounded-md text-xs flex items-center justify-between">
        <span>
          You are viewing an unlisted skill via a <strong>secret share link</strong>.
        </span>
      </div>

      <SkillViewerClient
        skill={skill}
        files={files}
        initialContent={initialContent}
        canWrite={false}
        canFork={Boolean(actor && can(actor, ACTIONS.SKILL_FORK, skill))}
        user={actor}
        shareToken={token}
      />
    </div>
  );
}
