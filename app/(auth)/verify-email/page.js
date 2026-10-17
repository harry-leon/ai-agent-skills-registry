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
      setErrorMessage('Không tìm thấy mã xác thực hợp lệ.');
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
          setErrorMessage(res.error.message || 'Mã xác thực không đúng hoặc đã hết hạn.');
        } else {
          setStatus('success');
        }
      } catch {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage('Đã xảy ra lỗi trong quá trình xác thực email.');
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <h1 className="text-xl font-bold">Đang xác thực email...</h1>
          <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            ✓
          </div>
          <h1 className="text-xl font-bold text-green-700 dark:text-green-400">
            Email đã được xác thực thành công!
          </h1>
          <p className="text-sm text-muted-foreground">
            Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập và sử dụng toàn bộ tính năng.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
            >
              Truy cập Thư viện kỹ năng
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive text-xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-destructive">Xác thực thất bại</h1>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Đang tải...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
