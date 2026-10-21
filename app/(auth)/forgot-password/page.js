'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (typeof authClient.forgetPassword === 'function') {
        await authClient.forgetPassword({
          email: email.trim(),
          redirectTo: `${window.location.origin}/reset-password`,
        });
      } else if (typeof authClient.requestPasswordReset === 'function') {
        await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: `${window.location.origin}/reset-password`,
        });
      }
    } catch {
      // Intentionally swallowed per Rule S1 (prevent account enumeration)
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Reset Password</h1>
        <p className="text-sm text-slate-400">
          Enter your account email to receive a password reset link
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4 text-center">
          <div
            role="status"
            className="rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400 font-medium border border-emerald-500/20"
          >
            If that email exists in our system, password reset instructions have been sent to your
            inbox. Please check your email (including spam/junk folder).
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-[40px] items-center justify-center text-sm font-semibold text-blue-400 hover:underline"
          >
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email or mobile number
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-label="Email or mobile number"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or mobile number"
              className="flex min-h-[50px] w-full rounded-2xl border border-slate-700/60 bg-[#0b0f17] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-500 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>

          <div className="text-center text-sm text-slate-400 pt-2">
            <Link href="/login" className="font-semibold text-blue-400 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
