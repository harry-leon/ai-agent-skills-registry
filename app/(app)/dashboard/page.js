import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session.js';
import { listOwnerSkills } from '@/lib/dal/skills.js';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getServerSession();
  const { skills, total } = user
    ? await listOwnerSkills(user.id, { limit: 50 })
    : { skills: [], total: 0 };

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

      {skills.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">Chưa có kỹ năng nào trong thư viện</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Bắt đầu bằng cách tải lên tệp nén ZIP, thư mục kỹ năng chứa SKILL.md, hoặc nhập trực
            tiếp từ một kho lưu trữ GitHub.
          </p>
          <div className="mt-6">
            <Link
              href="/skills/new"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
            >
              Thêm kỹ năng đầu tiên
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/s/${user.handle}/${skill.slug}`}
                    className="font-bold text-lg hover:text-blue-600 transition-colors line-clamp-1"
                  >
                    {skill.name}
                  </Link>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider shrink-0 ${
                      skill.visibility === 'PUBLIC'
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                        : skill.visibility === 'UNLISTED'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-secondary text-secondary-foreground border border-border'
                    }`}
                  >
                    {skill.visibility === 'PUBLIC'
                      ? 'Công khai'
                      : skill.visibility === 'UNLISTED'
                        ? 'Liên kết'
                        : 'Riêng tư'}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{skill.description}</p>

                {skill.tags && skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skill.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md bg-secondary/80 px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 border-t pt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  v{skill.currentVersion?.number || 1} · {skill.currentVersion?._count?.files || 0}{' '}
                  tệp
                </span>
                <span title={new Date(skill.updatedAt).toLocaleString('vi-VN')}>
                  {new Date(skill.updatedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
