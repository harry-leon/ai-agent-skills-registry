import { getServerSession } from '@/lib/auth/session.js';
import { searchOwnerSkills } from '@/lib/dal/search.js';
import { DashboardClient } from './dashboard-client.js';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Skills - SkillVault',
  description: 'Manage, edit, and organize your personal AI agent skills.',
};

export default async function DashboardPage() {
  const user = await getServerSession();
  const { skills, total, nextCursor } = user
    ? await searchOwnerSkills(user, { limit: 20 })
    : { skills: [], total: 0, nextCursor: null };

  return (
    <div className="space-y-6">
      <DashboardClient initialSkills={skills} initialTotal={total} initialCursor={nextCursor} />
    </div>
  );
}
