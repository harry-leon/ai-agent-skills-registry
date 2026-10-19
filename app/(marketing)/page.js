import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session.js';

export const dynamic = 'force-dynamic';

export default function RootPage() {
  redirect('/public');
}
