'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';
import { ThemeToggle } from '@/components/theme-toggle.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.js';
import {
  User,
  KeyRound,
  Trash2,
  AlertTriangle,
  Laptop,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user;

  // Profile Edit / View state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Change Password Collapsible State (collapsed by default)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ type: '', text: '' });

  // Delete Account state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileHandle(user.handle || '');
    }
  }, [user]);

  function handleCancelEdit() {
    setIsEditingProfile(false);
    setProfileName(user?.name || '');
    setProfileHandle(user?.handle || '');
    setProfileMessage({ type: '', text: '' });
  }

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setProfileLoading(true);

    try {
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName.trim(),
          handle: profileHandle.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error?.message || 'Failed to update profile.';
        setProfileMessage({ type: 'error', text: errorMsg });
        toast.error(errorMsg);
        setProfileLoading(false);
        return;
      }

      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
      router.refresh();
    } catch {
      setProfileMessage({ type: 'error', text: 'An unexpected error occurred.' });
      toast.error('An unexpected error occurred.');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwMessage({ type: '', text: '' });

    if (newPassword.length < 10 || newPassword.length > 128) {
      setPwMessage({
        type: 'error',
        text: 'New password must be between 10 and 128 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Confirm password does not match.' });
      return;
    }

    setPwLoading(true);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res?.error) {
        setPwMessage({
          type: 'error',
          text:
            res.error.message || 'Failed to change password. Please check your current password.',
        });
        toast.error('Failed to change password.');
      } else {
        setPwMessage({
          type: 'success',
          text: 'Password updated successfully! All other sessions revoked.',
        });
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordOpen(false);
      }
    } catch {
      setPwMessage({ type: 'error', text: 'An error occurred while changing password.' });
      toast.error('An error occurred while changing password.');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError('');
    setDeleteLoading(true);

    try {
      const res = await fetch('/api/me/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error?.message || 'Failed to delete account.');
        setDeleteLoading(false);
        return;
      }

      toast.success('Your account has been permanently deleted.');
      await authClient.signOut();
      router.push('/public');
      router.refresh();
    } catch {
      setDeleteError('An error occurred while deleting your account.');
      setDeleteLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      {/* Page Header */}
      <div className="border-b border-[#1c2536] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <User className="h-6 w-6 text-blue-400" />
          <span>Account Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your developer profile, authentication credentials, and system preferences.
        </p>
      </div>

      {/* 1. Personal Profile Card */}
      <div className="rounded-xl border border-[#1c2536] bg-[#111624] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100">
                Personal Profile
              </h2>
              <p className="text-xs text-slate-400">
                Your public developer handle and display identity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingProfile ? (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="inline-flex min-h-[36px] items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#1c2536] bg-[#0b0f17] text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              >
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex min-h-[36px] items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#1c2536] bg-[#0b0f17] text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <span>Cancel</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPasswordOpen((prev) => !prev)}
              className="inline-flex min-h-[36px] items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>
        </div>

        {profileMessage.text && (
          <div
            role="alert"
            className={`rounded-lg p-3 text-xs font-semibold border ${
              profileMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {profileMessage.text}
          </div>
        )}

        {/* Profile Content: Read-only View or Editing Form */}
        {!isEditingProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="p-3.5 rounded-lg border border-[#1c2536] bg-[#0b0f17]">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                FULL NAME
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-1 truncate">
                {user?.name || 'Not provided'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-[#1c2536] bg-[#0b0f17]">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                HANDLE
              </div>
              <div className="text-sm font-mono font-semibold text-blue-400 mt-1 truncate">
                @{user?.handle || '---'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-[#1c2536] bg-[#0b0f17]">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                EMAIL ADDRESS
              </div>
              <div className="text-sm text-slate-300 mt-1 truncate">{user?.email || '---'}</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="profileName" className="text-xs font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  id="profileName"
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="flex min-h-[40px] w-full rounded-lg border border-[#1c2536] bg-[#0b0f17] px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profileHandle" className="text-xs font-medium text-slate-300">
                  Handle
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 text-xs font-medium">
                    @
                  </span>
                  <input
                    id="profileHandle"
                    type="text"
                    required
                    value={profileHandle}
                    onChange={(e) => setProfileHandle(e.target.value.toLowerCase())}
                    placeholder="alex-dev"
                    className="flex min-h-[40px] w-full rounded-lg border border-[#1c2536] bg-[#0b0f17] pl-8 pr-3.5 py-2 text-xs text-slate-100 font-mono placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profileEmail" className="text-xs font-medium text-slate-500">
                Email Address (read-only)
              </label>
              <input
                id="profileEmail"
                type="email"
                value={user?.email || ''}
                disabled
                className="flex min-h-[40px] w-full rounded-lg border border-[#1c2536] bg-[#0b0f17]/50 px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed opacity-80"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                id="saveProfileBtn"
                type="submit"
                disabled={profileLoading}
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#1c2536] bg-[#0b0f17] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Collapsible Change Password Card */}
      <div className="rounded-xl border border-[#1c2536] bg-[#111624] overflow-hidden shadow-xs transition-all">
        <button
          type="button"
          onClick={() => setIsPasswordOpen((prev) => !prev)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#141b2c] transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100">Change Password</h2>
              <p className="text-xs text-slate-400">
                Update your login password and terminate other active sessions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{isPasswordOpen ? 'Hide' : 'Expand'}</span>
            {isPasswordOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {isPasswordOpen && (
          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[#1c2536] space-y-4 bg-[#0d1320]/60">
            {pwMessage.text && (
              <div
                role="alert"
                className={`rounded-lg p-3 text-xs font-semibold border ${
                  pwMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {pwMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3.5 max-w-md">
              <div className="space-y-1">
                <label htmlFor="currentPassword" className="text-xs font-medium text-slate-300">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="flex min-h-[40px] w-full rounded-lg border border-[#1c2536] bg-[#0b0f17] px-3.5 py-2 text-xs text-slate-100 focus-visible:outline-none focus-visible:border-blue-500/80 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="newPassword" className="text-xs font-medium text-slate-300">
                  New Password (min 10 chars)
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={128}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex min-h-[40px] w-full rounded-lg border border-[#1c2536] bg-[#0b0f17] px-3.5 py-2 text-xs text-slate-100 focus-visible:outline-none focus-visible:border-blue-500/80 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmNewPassword" className="text-xs font-medium text-slate-300">
                  Confirm New Password
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex min-h-[40px] w-full rounded-lg border border-[#1c2536] bg-[#0b0f17] px-3.5 py-2 text-xs text-slate-100 focus-visible:outline-none focus-visible:border-blue-500/80 transition-colors"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {pwLoading ? 'Updating password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
