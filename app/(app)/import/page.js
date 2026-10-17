'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Github } from '@/components/icons/github.js';
import { toast } from 'sonner';

export default function ImportGithubPage() {
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [ref, setRef] = useState('');
  const [subpath, setSubpath] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');

  const [importing, setImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
  const [warnings, setWarnings] = useState([]);

  async function handleImport(e) {
    e.preventDefault();
    setErrorMessage('');
    setErrorDetails([]);
    setWarnings([]);
    setImporting(true);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        url: url.trim(),
        tags: parsedTags,
        visibility,
      };

      if (ref.trim()) {
        payload.ref = ref.trim();
      }

      if (subpath.trim()) {
        payload.subpath = subpath.trim();
      }

      const res = await fetch('/api/imports/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error?.message || 'Không thể nhập kỹ năng từ GitHub.');
        setErrorDetails(json.error?.details || []);
        toast.error(json.error?.message || 'Nhập từ GitHub thất bại.');
        return;
      }

      if (json.data?.validation?.warnings?.length > 0) {
        setWarnings(json.data.validation.warnings);
      }

      toast.success('Nhập kỹ năng từ GitHub thành công!');

      const createdSkill = json.data.skill;
      if (createdSkill && createdSkill.owner && createdSkill.slug) {
        router.push(`/s/${createdSkill.owner.handle}/${createdSkill.slug}`);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setErrorMessage('Đã xảy ra lỗi kết nối khi nhập kỹ năng.');
      toast.error('Lỗi kết nối máy chủ.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Quay lại Thư viện"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <Github className="h-6 w-6 text-foreground" />
            <span>Nhập kỹ năng từ GitHub</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Sao chép mã nguồn Agent Skill trực tiếp từ kho lưu trữ GitHub công khai vào thư viện cá
            nhân.
          </p>
        </div>
      </div>

      {/* Info Callout */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-sm text-blue-900 dark:text-blue-200 space-y-1.5">
        <div className="font-semibold flex items-center space-x-1.5">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Yêu cầu kho lưu trữ:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-300 ml-1">
          <li>Chỉ hỗ trợ kho lưu trữ công khai (Public Repository).</li>
          <li>
            Thư mục gốc hoặc thư mục con chỉ định bắt buộc phải có tệp <code>SKILL.md</code>.
          </li>
          <li>
            Tên nhánh chứa dấu <code>/</code> chưa được hỗ trợ trong phiên bản này (vui lòng sử dụng
            Commit SHA hoặc Git Tag).
          </li>
        </ul>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center space-x-2 font-medium text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {errorDetails.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-destructive/90">
              {errorDetails.map((detail, idx) => (
                <li key={idx}>
                  {detail.field ? <span className="font-mono">{detail.field}: </span> : null}
                  {detail.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Warnings List */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300">
          <div className="flex items-center space-x-2 font-medium text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Cảnh báo định dạng kỹ năng:</span>
          </div>
          <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
            {warnings.map((w, idx) => (
              <li key={idx}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Import Form */}
      <form onSubmit={handleImport} className="space-y-6">
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-xs">
          <h2 className="text-base font-semibold text-foreground">Thông tin kho lưu trữ GitHub</h2>

          <div className="space-y-2">
            <label htmlFor="githubUrl" className="text-sm font-medium text-foreground">
              Địa chỉ GitHub URL <span className="text-destructive">*</span>
            </label>
            <input
              id="githubUrl"
              type="url"
              required
              placeholder="https://github.com/owner/repo hoặc https://github.com/owner/repo/tree/main/skills/agent"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Hỗ trợ đường dẫn dạng repository hoặc trực tiếp đến thư mục con{' '}
              <code>/tree/ref/subpath</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="ref" className="text-sm font-medium text-foreground">
                Nhánh / Tag / Commit SHA (Tùy chọn)
              </label>
              <input
                id="ref"
                type="text"
                placeholder="main, v1.0.0, hoặc 7fd1a60"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Mặc định sử dụng nhánh mặc định của repo.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="subpath" className="text-sm font-medium text-foreground">
                Thư mục con (Subpath, Tùy chọn)
              </label>
              <input
                id="subpath"
                type="text"
                placeholder="skills/my-agent-skill"
                value={subpath}
                onChange={(e) => setSubpath(e.target.value)}
                className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Áp dụng nếu SKILL.md nằm trong thư mục con.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-xs">
          <h2 className="text-base font-semibold text-foreground">
            Cài đặt kỹ năng trong thư viện
          </h2>

          <div className="space-y-2">
            <label htmlFor="visibility" className="text-sm font-medium text-foreground">
              Chế độ hiển thị
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="PRIVATE">Riêng tư (Chỉ mình bạn truy cập)</option>
              <option value="UNLISTED">Không công khai (Truy cập qua liên kết bí mật)</option>
              <option value="PUBLIC">Công khai (Mọi người có thể tìm kiếm và xem)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium text-foreground">
              Thẻ phân loại (Tags)
            </label>
            <input
              id="tags"
              type="text"
              placeholder="agent, github, coding"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Phân tách các thẻ bằng dấu phẩy (chữ thường, số, gạch ngang).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={importing || !url.trim()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Đang tải và xử lý từ GitHub...</span>
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                <span>Bắt đầu nhập kỹ năng</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={importing}
            onClick={() => router.back()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors cursor-pointer"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
