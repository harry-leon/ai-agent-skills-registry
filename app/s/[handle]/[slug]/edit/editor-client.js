'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { FileTree } from '@/components/file-tree.js';
import { CodeMirrorEditor } from '@/components/code-mirror-editor.js';
import { toast } from 'sonner';

export function SkillEditorClient({ skill, initialFiles = [], initialContents = {} }) {
  const router = useRouter();
  const [files, setFiles] = useState(initialFiles);
  const [fileContents, setFileContents] = useState(initialContents);
  const [selectedPath, setSelectedPath] = useState('SKILL.md');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Modal states for File Operations
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [targetRenamePath, setTargetRenamePath] = useState('');
  const [renamedPath, setRenamedPath] = useState('');

  const activeFile = files.find((f) => f.path === selectedPath) || files[0] || null;

  const handleSelectFile = async (path, file) => {
    setSelectedPath(path);

    // If file content not yet loaded and it's an existing file from server
    if (fileContents[path] === undefined && file?.id && file?.isText) {
      try {
        const res = await fetch(`/api/skills/${skill.id}/files/${file.id}`);
        const json = await res.json();
        if (res.ok && json.data?.content !== undefined) {
          setFileContents((prev) => ({
            ...prev,
            [path]: json.data.content,
          }));
        }
      } catch {
        toast.error('Không thể tải nội dung tệp.');
      }
    }
  };

  const handleEditorChange = (newVal) => {
    if (!activeFile) return;
    setFileContents((prev) => ({
      ...prev,
      [activeFile.path]: newVal,
    }));
  };

  // Add new file
  const handleAddFileSubmit = (e) => {
    e.preventDefault();
    const cleanPath = newFilePath.trim().replace(/^\/+/, '');

    if (!cleanPath) {
      toast.error('Vui lòng nhập đường dẫn tệp.');
      return;
    }

    if (cleanPath.includes('..') || cleanPath.includes('\\')) {
      toast.error('Đường dẫn tệp không được chứa ký tự .. hoặc dấu gạch chéo ngược.');
      return;
    }

    if (files.some((f) => f.path.toLowerCase() === cleanPath.toLowerCase())) {
      toast.error('Đã tồn tại tệp có đường dẫn này.');
      return;
    }

    const newFile = {
      path: cleanPath,
      isText: true,
      size: 0,
      mimeType: 'text/plain',
    };

    setFiles((prev) => [...prev, newFile]);
    setFileContents((prev) => ({
      ...prev,
      [cleanPath]: '',
    }));
    setSelectedPath(cleanPath);
    setNewFilePath('');
    setShowAddModal(false);
    toast.success(`Đã thêm tệp ${cleanPath}`);
  };

  // Rename file
  const handleRenameSubmit = (e) => {
    e.preventDefault();
    const cleanNewPath = renamedPath.trim().replace(/^\/+/, '');

    if (!cleanNewPath) {
      toast.error('Vui lòng nhập tên tệp mới.');
      return;
    }

    if (cleanNewPath === targetRenamePath) {
      setShowRenameModal(false);
      return;
    }

    if (cleanNewPath.includes('..') || cleanNewPath.includes('\\')) {
      toast.error('Đường dẫn không hợp lệ.');
      return;
    }

    if (files.some((f) => f.path.toLowerCase() === cleanNewPath.toLowerCase())) {
      toast.error('Tên tệp đã tồn tại trong kỹ năng.');
      return;
    }

    setFiles((prev) =>
      prev.map((f) => (f.path === targetRenamePath ? { ...f, path: cleanNewPath } : f)),
    );

    setFileContents((prev) => {
      const copy = { ...prev };
      copy[cleanNewPath] = copy[targetRenamePath] ?? '';
      delete copy[targetRenamePath];
      return copy;
    });

    if (selectedPath === targetRenamePath) {
      setSelectedPath(cleanNewPath);
    }

    setShowRenameModal(false);
    toast.success('Đã đổi tên tệp thành công.');
  };

  // Delete file
  const handleDeleteFile = (pathToDelete) => {
    if (pathToDelete === 'SKILL.md') {
      toast.error('Không thể xoá tệp SKILL.md bắt buộc!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xoá tệp "${pathToDelete}" khỏi kỹ năng?`)) {
      return;
    }

    setFiles((prev) => prev.filter((f) => f.path !== pathToDelete));
    setFileContents((prev) => {
      const copy = { ...prev };
      delete copy[pathToDelete];
      return copy;
    });

    if (selectedPath === pathToDelete) {
      setSelectedPath('SKILL.md');
    }

    toast.success(`Đã xoá tệp ${pathToDelete}`);
  };

  // Save new version
  const handleSaveVersion = async () => {
    // 1. Validate SKILL.md exists
    if (!files.some((f) => f.path === 'SKILL.md')) {
      toast.error('Kỹ năng bắt buộc phải chứa tệp SKILL.md');
      return;
    }

    setSaving(true);
    setValidationErrors([]);

    try {
      const payloadFiles = files.map((f) => ({
        path: f.path,
        content: fileContents[f.path] !== undefined ? fileContents[f.path] : '',
      }));

      const res = await fetch(`/api/skills/${skill.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim() || 'Cập nhật phiên bản mới',
          files: payloadFiles,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error?.details && Array.isArray(json.error.details)) {
          setValidationErrors(json.error.details);
        }
        toast.error(json.error?.message || 'Không thể lưu phiên bản mới.');
        setSaving(false);
        return;
      }

      toast.success(`Đã tạo thành công phiên bản v${json.data.number}!`);
      router.push(`/s/${skill.owner.handle}/${skill.slug}`);
      router.refresh();
    } catch {
      toast.error('Đã xảy ra lỗi kết nối khi lưu phiên bản.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editor Header */}
      <div className="bg-card border rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link
                href={`/s/${skill.owner.handle}/${skill.slug}`}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại xem</span>
              </Link>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center space-x-2">
              <span>Chỉnh sửa kỹ năng: {skill.name}</span>
              <span className="text-xs bg-muted text-muted-foreground font-mono px-2 py-0.5 rounded-full border">
                v{(skill.currentVersion?.number || 1) + 1} (dự kiến)
              </span>
            </h1>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ghi chú phiên bản (ví dụ: Sửa hướng dẫn...)"
              className="px-3 py-1.5 text-xs bg-background border rounded-md w-64 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveVersion}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Đang lưu...' : 'Lưu phiên bản'}</span>
            </button>
          </div>
        </div>

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3.5 rounded-md text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Phát hiện lỗi định dạng khi kiểm tra tệp:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-2 opacity-90">
              {validationErrors.map((err, idx) => (
                <li key={idx}>
                  {err.path ? `[${err.path}] ` : ''}
                  {err.message || String(err)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Two-Column Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Column: Editable File Tree */}
        <div className="lg:col-span-4 h-full">
          <FileTree
            files={files}
            selectedPath={selectedPath}
            onSelect={handleSelectFile}
            isEditable={true}
            onAddFile={() => setShowAddModal(true)}
            onRenameFile={(path) => {
              if (path === 'SKILL.md') {
                toast.error('Không thể đổi tên tệp SKILL.md');
                return;
              }
              setTargetRenamePath(path);
              setRenamedPath(path);
              setShowRenameModal(true);
            }}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        {/* Right Column: CodeMirror Editor */}
        <div className="lg:col-span-8 flex flex-col border rounded-md bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-mono text-xs font-semibold text-foreground truncate">
                {activeFile?.path || 'SKILL.md'}
              </span>
              {activeFile?.path === 'SKILL.md' && (
                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Bắt buộc frontmatter name & description
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {activeFile ? `${(fileContents[activeFile.path] || '').length} ký tự` : ''}
            </span>
          </div>

          <div className="flex-1">
            {activeFile?.isText ? (
              <CodeMirrorEditor
                value={fileContents[activeFile.path] ?? ''}
                onChange={handleEditorChange}
                readOnly={false}
                isMarkdown={activeFile.path.endsWith('.md')}
                className="h-full min-h-[500px] border-0 rounded-none"
              />
            ) : (
              <div className="p-12 text-center text-xs text-muted-foreground">
                Tệp nhị phân không thể chỉnh sửa trực tiếp dưới dạng văn bản.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add File Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddFileSubmit}
            className="bg-card border rounded-lg max-w-sm w-full p-5 space-y-4 shadow-lg"
          >
            <h3 className="text-sm font-semibold">Thêm tệp mới vào kỹ năng</h3>
            <p className="text-xs text-muted-foreground">
              Nhập đường dẫn tương đối (ví dụ:{' '}
              <code className="bg-muted px-1 rounded">scripts/run.py</code> hoặc{' '}
              <code className="bg-muted px-1 rounded">docs/api.md</code>):
            </p>
            <input
              type="text"
              autoFocus
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="scripts/main.py"
              className="w-full text-xs font-mono bg-background border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 border rounded text-xs hover:bg-muted"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90"
              >
                Tạo tệp
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename File Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleRenameSubmit}
            className="bg-card border rounded-lg max-w-sm w-full p-5 space-y-4 shadow-lg"
          >
            <h3 className="text-sm font-semibold">Đổi tên tệp</h3>
            <p className="text-xs text-muted-foreground">
              Đổi tên cho tệp{' '}
              <strong className="font-mono text-foreground">{targetRenamePath}</strong>:
            </p>
            <input
              type="text"
              autoFocus
              value={renamedPath}
              onChange={(e) => setRenamedPath(e.target.value)}
              className="w-full text-xs font-mono bg-background border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="px-3 py-1.5 border rounded text-xs hover:bg-muted"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90"
              >
                Đổi tên
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
