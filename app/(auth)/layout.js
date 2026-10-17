import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-2 font-bold text-2xl tracking-tight">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <span className="text-blue-600">Skill</span>Vault
        </Link>
      </div>
      <div className="w-full max-w-md rounded-xl border bg-card p-6 sm:p-8 shadow-sm">
        {children}
      </div>
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SkillVault. Quản lý kỹ năng an toàn & có phiên bản.
      </footer>
    </div>
  );
}
