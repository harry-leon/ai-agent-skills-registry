'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';
import { validateHandle } from '@/lib/auth/handle.js';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Handle format validation
    const handleCheck = validateHandle(handle);
    if (!handleCheck.valid) {
      setError(handleCheck.error);
      return;
    }

    // Password length validation (Rule S1: min 10, max 128)
    if (password.length < 10 || password.length > 128) {
      setError('Password must be between 10 and 128 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
        handle: handle.trim().toLowerCase(),
      });

      if (res?.error) {
        setError(res.error.message || 'Registration failed. Please review your information.');
        setLoading(false);
        return;
      }

      setRegistered(true);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err?.message || 'An error occurred during registration.');
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-100">Account Created Successfully!</h2>
        <p className="text-sm text-slate-400">Redirecting to your skill library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Create Account</h1>
        <p className="text-sm text-slate-400">
          Register to build, publish, and manage your AI agent skills
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
          <label htmlFor="name" className="sr-only">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            aria-label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="flex min-h-[50px] w-full rounded-2xl border border-slate-700/60 bg-[#0b0f17] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="handle" className="sr-only">
            Handle
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 text-sm font-medium">
              @
            </span>
            <input
              id="handle"
              name="handle"
              type="text"
              required
              aria-label="Handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder="Handle (e.g. alex-dev)"
              className="flex min-h-[50px] w-full rounded-2xl border border-slate-700/60 bg-[#0b0f17] pl-9 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors"
            />
          </div>
          <p className="text-xs text-slate-400 px-1">
            3-30 lowercase letters, numbers, and hyphens (e.g. alex-dev)
          </p>
        </div>

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

        <div>
          <label htmlFor="password" className="sr-only">
            Password (min 10 characters)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={128}
            aria-label="Password (min 10 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 10 characters)"
            className="flex min-h-[50px] w-full rounded-2xl border border-slate-700/60 bg-[#0b0f17] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="sr-only">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={128}
            aria-label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="flex min-h-[50px] w-full rounded-2xl border border-slate-700/60 bg-[#0b0f17] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-500 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-blue-400 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
