'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';
import { KeyRound, Eye, EyeOff, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 10 || newPassword.length > 128) {
      setError('New password must be between 10 and 128 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Confirmation password does not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res?.error) {
        setError(
          res.error.message || 'Failed to change password. Please verify your current password.',
        );
        toast.error('Failed to change password.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('Password changed successfully! Other sessions have been revoked.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('An unexpected error occurred while changing your password.');
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c2536] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <KeyRound className="h-6 w-6 text-amber-400" />
            <span>Change Password</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Update your account password and revoke other active sessions.
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#1c2536] bg-[#111624] text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Settings</span>
        </Link>
      </div>

      {/* Success banner */}
      {success && (
        <div
          role="status"
          className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4 flex items-start gap-3 text-emerald-300 animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-semibold text-emerald-200">Password Updated Successfully</p>
            <p className="text-emerald-300/90 leading-relaxed">
              Your password has been changed and all other active sessions have been safely revoked.
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs sm:text-sm text-red-400 font-medium animate-in fade-in"
        >
          {error}
        </div>
      )}

      {/* Password Change Card */}
      <div className="rounded-2xl border border-[#1c2536] bg-[#111624] p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-100">
              Security Credentials
            </h2>
            <p className="text-xs text-slate-400">
              Account:{' '}
              <span className="font-mono text-slate-300">{user?.email || 'Loading...'}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="text-xs font-medium text-slate-300">
              Current Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="flex min-h-[44px] w-full rounded-xl border border-[#1c2536] bg-[#0b0f17] pl-3.5 pr-10 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-xs font-medium text-slate-300">
              New Password{' '}
              <span className="text-slate-500 font-normal">(minimum 10 characters)</span>
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="flex min-h-[44px] w-full rounded-xl border border-[#1c2536] bg-[#0b0f17] pl-3.5 pr-10 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-slate-300">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="flex min-h-[44px] w-full rounded-xl border border-[#1c2536] bg-[#0b0f17] pl-3.5 pr-10 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
            <Link
              href="/settings"
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-[#1c2536] bg-[#0b0f17] px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
