import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell.js';
import { getServerSession } from '@/lib/auth/session.js';
import { searchPublicSkills } from '@/lib/dal/search.js';
import { PublicClient } from './public-client.js';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Community - Skillary',
  description:
    'Explore, install, and share open-source AI agent skills, commands, agents, and templates.',
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
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        }
      >
        <PublicClient
          initialSkills={skills}
          initialTotal={total}
          initialCursor={nextCursor}
          user={actor}
        />
      </Suspense>
    </AppShell>
  );
}
