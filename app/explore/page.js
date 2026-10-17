import Navbar from '@/components/navbar.js';
import { getServerSession } from '@/lib/auth/session.js';
import { searchPublicSkills } from '@/lib/dal/search.js';
import { ExploreClient } from './explore-client.js';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const session = await getServerSession();
  const actor = session?.id ? session : session?.user || null;

  const { skills, total, nextCursor } = await searchPublicSkills({ limit: 20 });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar user={actor} />
      <main className="flex-1 px-4 sm:px-8 py-8 max-w-7xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Khám phá Agent Skills
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thư viện kỹ năng AI công khai từ cộng đồng. Tìm kiếm, tham khảo, tải về hoặc sao chép
            vào thư viện cá nhân.
          </p>
        </div>

        <ExploreClient initialSkills={skills} initialTotal={total} initialCursor={nextCursor} />
      </main>
    </div>
  );
}
