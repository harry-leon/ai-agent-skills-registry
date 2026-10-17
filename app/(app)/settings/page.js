'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client.js';

export default function SettingsPage() {
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user;

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ type: '', text: '' });

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Delete Account state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function loadSessions() {
      setSessionsLoading(true);
      try {
        const res = await authClient.listSessions();
        if (res?.data) {
          setSessions(res.data);
        }
      } catch {
        // Ignored
      } finally {
        setSessionsLoading(false);
      }
    }

    loadSessions();
  }, []);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwMessage({ type: '', text: '' });

    if (newPassword.length < 10 || newPassword.length > 128) {
      setPwMessage({
        type: 'error',
        text: 'Mật khẩu mới phải có độ dài từ 10 đến 128 ký tự.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setPwLoading(true);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true, // Rule S1: Changing password revokes all other sessions
      });

      if (res?.error) {
        setPwMessage({
          type: 'error',
          text:
            res.error.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.',
        });
      } else {
        setPwMessage({
          type: 'success',
          text: 'Đổi mật khẩu thành công! Tất cả các phiên đăng nhập khác đã được thu hồi.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPwMessage({ type: 'error', text: 'Đã xảy ra lỗi khi đổi mật khẩu.' });
    } finally {
      setPwLoading(false);
    }
  }

  async function handleRevokeSession(sessionIdentifier) {
    try {
      await authClient.revokeSession({ token: sessionIdentifier });
      setSessions((prev) =>
        prev.filter((s) => s.id !== sessionIdentifier && s.token !== sessionIdentifier),
      );
    } catch {
      alert('Không thể thu hồi phiên đăng nhập.');
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
        setDeleteError(data.error?.message || 'Xóa tài khoản thất bại.');
        setDeleteLoading(false);
        return;
      }

      await authClient.signOut();
      router.push('/');
      router.refresh();
    } catch {
      setDeleteError('Đã xảy ra lỗi khi gửi yêu cầu xóa tài khoản.');
      setDeleteLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý bảo mật, phiên làm việc và tùy chọn tài khoản của bạn
        </p>
      </div>

      {/* Profile Info */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Thông tin cá nhân</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">Họ và tên</span>
            <span className="font-medium">{user?.name || '---'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Handle</span>
            <span className="font-medium text-blue-600">@{user?.handle || '---'}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground block text-xs">Email</span>
            <span className="font-medium">{user?.email || '---'}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
        <p className="text-xs text-muted-foreground">
          Mật khẩu tối thiểu 10 ký tự. Khi đổi mật khẩu thành công, tất cả các phiên đăng nhập khác
          sẽ bị thu hồi.
        </p>

        {pwMessage.text && (
          <div
            role="alert"
            className={`rounded-lg p-3 text-sm font-medium border ${
              pwMessage.type === 'success'
                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}
          >
            {pwMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-sm font-medium">
              Mật khẩu hiện tại
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">
              Mật khẩu mới
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
              className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmNewPassword" className="text-sm font-medium">
              Xác nhận mật khẩu mới
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
              className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Các phiên đăng nhập đang hoạt động</h2>
        <p className="text-xs text-muted-foreground">
          Danh sách thiết bị và trình duyệt đang duy trì phiên đăng nhập vào tài khoản của bạn.
        </p>

        {sessionsLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải danh sách phiên...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chỉ có phiên hiện tại đang mở.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium text-xs">
                    {s.userAgent || 'Trình duyệt không xác định'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IP: {s.ipAddress || '127.0.0.1'} · Hết hạn:{' '}
                    {new Date(s.expiresAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokeSession(s.token || s.id)}
                  className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  Thu hồi
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Khu vực nguy hiểm</h2>
        <p className="text-sm text-muted-foreground">
          Xóa vĩnh viễn tài khoản của bạn và toàn bộ các Agent Skills, các phiên bản liên quan. Thao
          tác này không thể hoàn tác.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90 transition-colors cursor-pointer"
        >
          Xóa tài khoản
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-destructive">Xác nhận xóa tài khoản</h3>
            <p className="text-sm text-muted-foreground">
              Toàn bộ kỹ năng, phiên bản và dữ liệu của bạn sẽ bị xóa hoàn toàn. Vui lòng nhập lại
              mật khẩu hiện tại để xác nhận.
            </p>

            {deleteError && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20"
              >
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="deletePasswordInput" className="text-sm font-medium">
                  Mật khẩu hiện tại
                </label>
                <input
                  id="deletePasswordInput"
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••••"
                  className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError('');
                    setDeletePassword('');
                  }}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {deleteLoading ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
