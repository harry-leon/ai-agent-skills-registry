import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session.js';
import { getSkillByHandleAndSlug } from '@/lib/dal/skills.js';
import { getVersionFiles } from '@/lib/dal/files.js';
import { can, ACTIONS } from '@/lib/auth/policy.js';
import { storage } from '@/lib/storage/index.js';
import { SkillEditorClient } from './editor-client.js';

export const dynamic = 'force-dynamic';

export default async function SkillEditorPage({ params }) {
  const { handle, slug } = await params;
  const session = await getServerSession();
  const actor = session?.id ? session : session?.user || null;

  if (!actor) {
    redirect(`/login?callbackUrl=/s/${handle}/${slug}/edit`);
  }

  // 1. Fetch skill
  const skill = await getSkillByHandleAndSlug(actor, handle, slug);

  // 2. IDOR / Ownership Protection (Section S2, Rule R4)
  if (!skill || !can(actor, ACTIONS.SKILL_WRITE, skill)) {
    notFound();
  }

  // 3. Fetch version files
  const files = skill.currentVersionId ? await getVersionFiles(skill.currentVersionId) : [];

  // 4. Preload text file contents for snappy editing
  const initialContents = {};
  for (const file of files) {
    if (file.isText) {
      const buffer = await storage.getBlobBuffer(file.blobSha256);
      if (buffer) {
        initialContents[file.path] = buffer.toString('utf-8');
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SkillEditorClient skill={skill} initialFiles={files} initialContents={initialContents} />
    </div>
  );
}
