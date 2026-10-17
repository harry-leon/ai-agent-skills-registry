import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session.js';

export default async function DashboardPage() {
  const user = await getServerSession();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thư viện của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý và tổ chức các Agent Skills thuộc tài khoản @{user?.handle}
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

      <div className="rounded-xl border border-dashed p-12 text-center">
        <h3 className="text-lg font-semibold">Chưa có kỹ năng nào trong thư viện</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Bắt đầu bằng cách tải lên tệp nén ZIP, thư mục kỹ năng chứa SKILL.md, hoặc nhập trực tiếp
          từ một kho lưu trữ GitHub.
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
    </div>
  );
}
