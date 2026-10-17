import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session.js';
import { searchOwnerSkills } from '@/lib/dal/search.js';
import { DashboardClient } from './dashboard-client.js';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getServerSession();
  const { skills, total, nextCursor } = user
    ? await searchOwnerSkills(user, { limit: 20 })
    : { skills: [], total: 0, nextCursor: null };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thư viện của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý và tổ chức {total} Agent Skill{total !== 1 ? 's' : ''} thuộc tài khoản @
            {user?.handle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/skills/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
          >
            + Thêm kỹ năng
          </Link>
          <Link
            href="/import"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            Nhập từ GitHub
          </Link>
        </div>
      </div>

      <DashboardClient
        initialSkills={skills}
        initialTotal={total}
        initialCursor={nextCursor}
      />
    </div>
  );
}
