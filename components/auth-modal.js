'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';
import { validateHandle } from '@/lib/auth/handle.js';
import { X, ChevronRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { SocialAuthButtons } from '@/components/social-auth-buttons.js';

export function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  if (!isOpen || !mounted) return null;

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

    if (regPassword.length < 10 || regPassword.length > 128) {
      setError('Password must be between 10 and 128 characters.');
      return;
    }

    // Auto generate handle from name or email prefix
    const fullName =
      `${regFirstName.trim()} ${regLastName.trim()}`.trim() || regEmail.split('@')[0];
    const candidateHandle =
      (regFirstName || regEmail.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20) || 'user';

    const safeHandle =
      candidateHandle.length >= 3
        ? candidateHandle
        : `${candidateHandle}-${Math.floor(100 + Math.random() * 900)}`;

    const handleCheck = validateHandle(safeHandle);
    const finalHandle = handleCheck.valid ? safeHandle : `user-${Date.now().toString().slice(-6)}`;

    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        email: regEmail.trim(),
        password: regPassword,
        name: fullName,
        handle: finalHandle,
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-[#0e1422] border border-[#1c2536] p-5 sm:p-7 shadow-2xl z-10 animate-in zoom-in-95 duration-200 overscroll-contain">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 rounded-lg p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-500/10 p-3 text-xs text-red-400 font-medium border border-red-500/20"
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
          <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-200">Password</label>
                <Link
                  href="/forgot-password"
                  onClick={handleClose}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] pl-3.5 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#282f3e] hover:bg-[#343e52] text-slate-100 px-4 py-2.5 text-xs font-semibold border border-slate-700/50 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            >
              <span>{loading ? 'Continuing...' : 'Continue'}</span>
              <ChevronRight className="w-3.5 h-3.5 fill-current" />
            </button>

            <SocialAuthButtons callbackUrl="/dashboard" onError={setError} />

            <div className="pt-3 border-t border-[#1c2536] text-center text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="font-semibold text-blue-400 hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-200">First name</label>
                  <span className="text-[11px] text-slate-500">Optional</span>
                </div>
                <input
                  type="text"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-200">Last name</label>
                  <span className="text-[11px] text-slate-500">Optional</span>
                </div>
                <input
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-700/60 bg-[#0b0f17] pl-3.5 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#282f3e] hover:bg-[#343e52] text-slate-100 px-4 py-2.5 text-xs font-semibold border border-slate-700/50 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            >
              <span>{loading ? 'Continuing...' : 'Continue'}</span>
              <ChevronRight className="w-3.5 h-3.5 fill-current" />
            </button>

            <SocialAuthButtons callbackUrl="/dashboard" onError={setError} />

            <div className="pt-3 border-t border-[#1c2536] text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="font-semibold text-blue-400 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
