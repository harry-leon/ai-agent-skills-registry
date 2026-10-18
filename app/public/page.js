import { AppShell } from '@/components/app-shell.js';
import { getServerSession } from '@/lib/auth/session.js';
import { searchPublicSkills } from '@/lib/dal/search.js';
import { PublicClient } from './public-client.js';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Community Skills - SkillVault',
  description: 'Explore, install, and share open-source AI agent skills curated by the community.',
};

export default async function PublicPage() {
  const session = await getServerSession();
  const actor = session?.id ? session : session?.user || null;

  const { skills, total, nextCursor } = await searchPublicSkills({
    limit: 20,
    userId: actor?.id || null,
  });

  return (
    <AppShell user={actor}>
      <PublicClient
        initialSkills={skills}
        initialTotal={total}
        initialCursor={nextCursor}
        user={actor}
      />
    </AppShell>
  );
}
