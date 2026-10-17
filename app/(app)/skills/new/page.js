'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function NewSkillPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const dirInputRef = useRef(null);

  const [mode, setMode] = useState('zip'); // 'zip' | 'folder' | 'template'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolderFiles, setSelectedFolderFiles] = useState([]);

  // Template mode fields
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateBody, setTemplateBody] = useState('# Hướng dẫn sử dụng kỹ năng\n\n...');

  // Metadata
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [versionMessage, setVersionMessage] = useState('Khởi tạo kỹ năng');

  // UI state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
  const [warnings, setWarnings] = useState([]);

  function handleFileChange(e) {
    setErrorMessage('');
    setErrorDetails([]);
    setWarnings([]);
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  function handleFolderChange(e) {
    setErrorMessage('');
    setErrorDetails([]);
    setWarnings([]);
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFolderFiles(files);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setErrorDetails([]);
    setWarnings([]);
    setUploading(true);
    setProgress(15);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      let response;

      if (mode === 'template') {
        // Build SKILL.md content from template inputs
        if (!templateName || !templateDescription) {
          setErrorMessage('Vui lòng điền đầy đủ Tên và Mô tả kỹ năng.');
          setUploading(false);
          return;
        }

        const skillMdContent = `---
name: ${templateName.trim().toLowerCase()}
description: "${templateDescription.trim().replace(/"/g, '\\"')}"
---
${templateBody}
`;
        setProgress(40);

        response = await fetch('/api/skills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: [
              {
                path: 'SKILL.md',
                content: skillMdContent,
              },
            ],
            tags: parsedTags,
            visibility,
            message: versionMessage,
          }),
        });
      } else {
        // FormData mode (zip or folder files)
        const formData = new FormData();
        formData.append('visibility', visibility);
        formData.append('tags', JSON.stringify(parsedTags));
        formData.append('message', versionMessage);

        if (mode === 'zip') {
          if (!selectedFile) {
            setErrorMessage('Vui lòng chọn tệp ZIP hoặc .skill để tải lên.');
            setUploading(false);
            return;
          }
          formData.append('file', selectedFile);
        } else if (mode === 'folder') {
          if (selectedFolderFiles.length === 0) {
            setErrorMessage('Vui lòng chọn thư mục chứa tệp kỹ năng.');
            setUploading(false);
            return;
          }
          for (const f of selectedFolderFiles) {
            formData.append('files', f, f.webkitRelativePath || f.name);
          }
        }

        setProgress(50);
        response = await fetch('/api/skills', {
          method: 'POST',
          body: formData,
        });
      }

      setProgress(85);
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error?.message || 'Tải lên kỹ năng thất bại.');
        setErrorDetails(data.error?.details || []);
        setUploading(false);
        setProgress(0);
        return;
      }

      setProgress(100);
      if (data.data?.warnings && data.data.warnings.length > 0) {
        setWarnings(data.data.warnings);
      }

      // Redirect to dashboard after brief pause
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
    } catch (err) {
      setErrorMessage(`Đã xảy ra lỗi kết nối: ${err.message}`);
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thêm Agent Skill mới</h1>
        <p className="text-sm text-muted-foreground">
          Tải lên gói tệp nén ZIP, chọn toàn bộ thư mục hoặc khởi tạo kỹ năng từ mẫu trống.
        </p>
      </div>

      {/* Mode selection tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setMode('zip')}
          className={`flex min-h-[44px] items-center px-4 font-medium text-sm transition-colors border-b-2 -mb-px cursor-pointer ${
            mode === 'zip'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Gói ZIP / .skill
        </button>
        <button
          type="button"
          onClick={() => setMode('folder')}
          className={`flex min-h-[44px] items-center px-4 font-medium text-sm transition-colors border-b-2 -mb-px cursor-pointer ${
            mode === 'folder'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Chọn thư mục
        </button>
        <button
          type="button"
          onClick={() => setMode('template')}
          className={`flex min-h-[44px] items-center px-4 font-medium text-sm transition-colors border-b-2 -mb-px cursor-pointer ${
            mode === 'template'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Tạo từ mẫu trống
        </button>
      </div>

      {/* Error & Warnings Banners */}
      {errorMessage && (
        <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
          {errorDetails.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-destructive space-y-1">
              {errorDetails.map((d, i) => (
                <li key={i}>{d.message || JSON.stringify(d)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {warnings.length > 0 && (
        <div
          role="status"
          className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400"
        >
          <p className="text-sm font-semibold">Cảnh báo kiểm tra định dạng:</p>
          <ul className="mt-2 list-inside list-disc text-xs space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode: ZIP */}
        {mode === 'zip' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Tệp nén kỹ năng (.zip, .skill)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-card p-6 text-center hover:bg-accent/40 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.skill"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="font-medium text-sm">
                {selectedFile ? selectedFile.name : 'Nhấp hoặc kéo thả tệp ZIP vào đây'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tối đa 50 MB nén, bên trong phải chứa tệp SKILL.md tại thư mục gốc.
              </p>
            </div>
          </div>
        )}

        {/* Mode: Folder */}
        {mode === 'folder' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Chọn thư mục chứa Agent Skill</label>
            <div
              onClick={() => dirInputRef.current?.click()}
              className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-card p-6 text-center hover:bg-accent/40 transition-colors"
            >
              <input
                ref={dirInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is standard for folder picker
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderChange}
                className="hidden"
              />
              <p className="font-medium text-sm">
                {selectedFolderFiles.length > 0
                  ? `Đã chọn ${selectedFolderFiles.length} tệp trong thư mục`
                  : 'Nhấp để chọn toàn bộ thư mục kỹ năng'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Trình duyệt sẽ tải lên tất cả các tệp và giữ nguyên cấu trúc thư mục.
              </p>
            </div>
          </div>
        )}

        {/* Mode: Template */}
        {mode === 'template' && (
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <label htmlFor="templateName" className="text-sm font-medium">
                Tên kỹ năng (name) <span className="text-destructive">*</span>
              </label>
              <input
                id="templateName"
                type="text"
                required
                placeholder="my-assistant-skill"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Chỉ chứa chữ thường, số và dấu gạch ngang (ví dụ: code-reviewer).
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="templateDescription" className="text-sm font-medium">
                Mô tả kỹ năng (description) <span className="text-destructive">*</span>
              </label>
              <textarea
                id="templateDescription"
                required
                rows={2}
                placeholder="Mô tả mục đích và cách sử dụng kỹ năng cho AI agent..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="templateBody" className="text-sm font-medium">
                Nội dung hướng dẫn (SKILL.md Markdown Body)
              </label>
              <textarea
                id="templateBody"
                rows={6}
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                className="flex w-full font-mono rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Common Metadata */}
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Cài đặt kỹ năng</h2>

          <div className="space-y-2">
            <label htmlFor="visibility" className="text-sm font-medium">
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
            <label htmlFor="tags" className="text-sm font-medium">
              Thẻ phân loại (Tags)
            </label>
            <input
              id="tags"
              type="text"
              placeholder="agent, coding, review, python"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Phân tách các thẻ bằng dấu phẩy.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Ghi chú phiên bản (Version Message)
            </label>
            <input
              id="message"
              type="text"
              value={versionMessage}
              onChange={(e) => setVersionMessage(e.target.value)}
              className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Đang kiểm tra và tải lên...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {uploading ? 'Đang xử lý...' : 'Tạo kỹ năng'}
          </button>
          <button
            type="button"
            disabled={uploading}
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
