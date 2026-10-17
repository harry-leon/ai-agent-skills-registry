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
      await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      });
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
        <h1 className="text-2xl font-bold tracking-tight">Khôi phục mật khẩu</h1>
        <p className="text-sm text-muted-foreground">
          Nhập địa chỉ email tài khoản của bạn để nhận liên kết đặt lại mật khẩu
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4 text-center">
          <div
            role="status"
            className="rounded-lg bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400 font-medium border border-green-500/20"
          >
            Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của
            bạn. Vui lòng kiểm tra email (kể cả thư rác/spam).
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center text-sm font-semibold text-blue-600 hover:underline"
          >
            Quay lại trang Đăng nhập
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email tài khoản
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@example.com"
              className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
          </button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
