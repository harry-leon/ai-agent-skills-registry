import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session.js';
import Navbar from '@/components/navbar.js';

export default async function AppLayout({ children }) {
  const user = await getServerSession();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar user={user} />
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
