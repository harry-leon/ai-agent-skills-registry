import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-blue-600">Skill</span>Vault
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/explore"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Khám phá
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Bắt đầu miễn phí
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold mb-6 text-blue-600 border-blue-200">
          Quản lý Agent Skills an toàn & có phiên bản
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Một nơi lưu trữ tập trung cho toàn bộ <span className="text-blue-600">Agent Skills</span>{' '}
          của bạn
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Chấm dứt tình trạng kỹ năng AI phân tán rải rác trên nhiều máy, trùng lặp và không có
          phiên bản. SkillVault mang lại thư viện bảo mật mặc định, hỗ trợ tìm kiếm không dấu, kiểm
          tra tính toàn vẹn và nhập trực tiếp từ GitHub.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow hover:bg-blue-700 transition-colors"
          >
            Tạo thư viện của bạn
          </Link>
          <Link
            href="/explore"
            className="rounded-md border border-input bg-background px-6 py-3 text-base font-medium hover:bg-accent transition-colors"
          >
            Khám phá kỹ năng công khai
          </Link>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SkillVault. Nền tảng quản lý Agent Skills an toàn.
      </footer>
    </div>
  );
}
