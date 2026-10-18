import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0f17] p-4 sm:p-8 text-slate-100">
      <div className="mb-6 flex items-center gap-2 font-bold text-2xl tracking-tight">
        <Link href="/public" className="hover:opacity-90 transition-opacity flex items-center gap-2">
          <span>Skill<span className="text-blue-400">Vault</span></span>
        </Link>
      </div>
      <div className="w-full max-w-md rounded-xl border border-[#1c2536] bg-[#111624] p-6 sm:p-8 shadow-xs">
        {children}
      </div>
      <footer className="mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} SkillVault. Open-source AI Agent Skill Registry.
      </footer>
    </div>
  );
}
