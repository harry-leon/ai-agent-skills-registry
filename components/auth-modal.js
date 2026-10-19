'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';
import { validateHandle } from '@/lib/auth/handle.js';
import { X, LogIn, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setError('');
    onClose?.();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res?.error) {
        setError('Invalid email or password.');
        setLoading(false);
        return;
      }

      toast.success('Signed in successfully!');
      handleClose();
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const handleCheck = validateHandle(regHandle);
    if (!handleCheck.valid) {
      setError(handleCheck.error);
      return;
    }

    if (regPassword.length < 10 || regPassword.length > 128) {
      setError('Password must be between 10 and 128 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        email: regEmail.trim(),
        password: regPassword,
        name: regName.trim(),
        handle: regHandle.trim().toLowerCase(),
      });

      if (res?.error) {
        setError(res.error.message || 'Registration failed. Please review your information.');
        setLoading(false);
        return;
      }

      setRegisteredSuccess(true);
      toast.success('Account created successfully!');
      setTimeout(() => {
        handleClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      }, 1000);
    } catch (err) {
      setError(err?.message || 'An error occurred during registration.');
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-2xl bg-[#0e1422] border border-[#1c2536] p-6 sm:p-7 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header Tabs */}
        <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl bg-[#0b0f17] border border-[#1c2536] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-400 font-medium border border-red-500/20"
          >
            {error}
          </div>
        )}

        {registeredSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-100">Welcome to Skillary!</h3>
            <p className="text-xs text-slate-400">Your account has been created. Redirecting...</p>
          </div>
        ) : mode === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <Link
                  href="/forgot-password"
                  onClick={handleClose}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-900/30 transition-all hover:bg-blue-500 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form
            onSubmit={handleRegisterSubmit}
            className="space-y-3 max-h-[65vh] overflow-y-auto pr-1"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Alex Developer"
                className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Handle</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={regHandle}
                  onChange={(e) => setRegHandle(e.target.value.toLowerCase())}
                  placeholder="alex-dev"
                  className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] pl-7 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Min 10 characters"
                className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-900/30 transition-all hover:bg-blue-500 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
