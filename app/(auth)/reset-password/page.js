'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or expired reset token.');
      return;
    }

    if (password.length < 10 || password.length > 128) {
      setError('New password must be between 10 and 128 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (res?.error) {
        setError(res.error.message || 'Password reset failed. The token may have expired.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError('An error occurred while resetting your password.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-100">Password Reset Successfully!</h2>
        <p className="text-sm text-slate-400">
          Your password has been updated. Redirecting to sign in...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Set New Password</h1>
        <p className="text-sm text-slate-400">
          Enter a new password for your account (minimum 10 characters)
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 font-medium border border-red-500/20"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="sr-only">
            New password (min 10 characters)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={128}
            aria-label="New password (min 10 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 10 characters)"
            className="flex min-h-[50px] w-full rounded-2xl border border-slate-700/60 bg-[#0b0f17] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="sr-only">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={128}
            aria-label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="flex min-h-[50px] w-full rounded-2xl border border-slate-700/60 bg-[#0b0f17] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-500 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
        >
          {loading ? 'Updating password...' : 'Update Password'}
        </button>
      </form>

      <div className="text-center text-sm text-slate-400">
        <Link href="/login" className="font-semibold text-blue-400 hover:underline">
          Cancel and return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-500">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
