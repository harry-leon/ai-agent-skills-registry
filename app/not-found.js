import Link from 'next/link';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#0b0f17] text-slate-100">
      <div className="w-16 h-16 bg-[#111624] border border-[#1c2536] rounded-full flex items-center justify-center mb-4 text-slate-400">
        <Search className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2 text-slate-100">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The resource you are looking for does not exist, has been removed, or is not publicly accessible.
      </p>
      <div className="flex items-center space-x-3">
        <Link
          href="/public"
          className="px-4 py-2 border border-[#1c2536] rounded-md text-sm font-semibold text-slate-300 hover:bg-[#1c2536] transition-colors"
        >
          Community Skills
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
        >
          My Skills
        </Link>
      </div>
    </div>
  );
}
