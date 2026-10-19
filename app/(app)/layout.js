import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session.js';
import { AppShell } from '@/components/app-shell.js';

export default async function AppLayout({ children }) {
  const user = await getServerSession();

  if (!user) {
    redirect('/login');
  }

  return <AppShell user={user}>{children}</AppShell>;
}
