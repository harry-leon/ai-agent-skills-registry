'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No valid verification token found.');
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const res = await authClient.verifyEmail({
          query: { token },
        });

        if (!isMounted) return;

        if (res?.error) {
          setStatus('error');
          setErrorMessage(res.error.message || 'Invalid or expired verification token.');
        } else {
          setStatus('success');
        }
      } catch {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage('An error occurred during email verification.');
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="space-y-6 text-center">
      {status === 'verifying' && (
        <div className="space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" />
          <h1 className="text-xl font-bold text-slate-100">Verifying Email...</h1>
          <p className="text-sm text-slate-400">Please wait while we verify your address.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            ✓
          </div>
          <h1 className="text-xl font-bold text-emerald-400">
            Email Verified Successfully!
          </h1>
          <p className="text-sm text-slate-400">
            Your account is now fully verified. You can now access your skills library.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors"
            >
              Go to My Skills
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-red-400">Verification Failed</h1>
          <p className="text-sm text-slate-400">{errorMessage}</p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-[#1c2536] bg-[#0b0f17] px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-500">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
