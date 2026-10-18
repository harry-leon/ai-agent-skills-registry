import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session.js';
import { getUserFavoriteSkills } from '@/lib/dal/favorites.js';
import { FavoritesClient } from './favorites-client.js';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Favorite Skills - SkillVault',
  description: 'Your starred and bookmarked AI agent skills.',
};

export default async function FavoritesPage() {
  const session = await getServerSession();
  const actor = session?.id ? session : session?.user || null;

  if (!actor) {
    redirect('/login?from=/favorites');
  }

  const { skills, total, nextCursor } = await getUserFavoriteSkills(actor.id, {
    limit: 20,
  });

  return (
    <FavoritesClient
      initialSkills={skills}
      initialTotal={total}
      initialCursor={nextCursor}
      user={actor}
    />
  );
}
