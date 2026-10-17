'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  Copy,
  Check,
  Edit,
  Share2,
  Trash2,
  ExternalLink,
  Eye,
  Code,
  FileText,
  AlertCircle,
  Tag,
  Clock,
  GitFork,
} from 'lucide-react';
import { Github } from '@/components/icons/github.js';
import { FileTree } from '@/components/file-tree.js';
import { MarkdownPreview } from '@/components/markdown-preview.js';
import { CodeMirrorEditor } from '@/components/code-mirror-editor.js';
import { toast } from 'sonner';

export function SkillViewerClient({
  skill,
  files = [],
  initialContent = '',
  canWrite = false,
  canFork = false,
  shareToken = null,
}) {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState('SKILL.md');
  const [fileContents, setFileContents] = useState({ 'SKILL.md': initialContent });
  const [loadingFile, setLoadingFile] = useState(false);
  const [markdownViewMode, setMarkdownViewMode] = useState('preview'); // 'preview' | 'source'
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forking, setForking] = useState(false);
  const [rotatingToken, setRotatingToken] = useState(false);
  const [currentShareToken, setCurrentShareToken] = useState(skill.shareToken || shareToken);

  const activeFile = files.find((f) => f.path === selectedPath) || files[0] || null;

  const handleSelectFile = async (path, file) => {
    setSelectedPath(path);

    if (fileContents[path] !== undefined || !file?.isText) {
      return;
    }

    setLoadingFile(true);
    try {
      const tokenParam = currentShareToken ? `?token=${encodeURIComponent(currentShareToken)}` : '';
      const res = await fetch(`/api/skills/${skill.id}/files/${file.id}${tokenParam}`);
      const json = await res.json();
      if (res.ok && json.data?.content !== undefined) {
        setFileContents((prev) => ({
          ...prev,
          [path]: json.data.content,
        }));
      }
    } catch {
      toast.error('Không thể tải nội dung tệp.');
    } finally {
      setLoadingFile(false);
    }
  };

  const copyCloneCommand = () => {
    const cmd = `npx agy add @${skill.owner.handle}/${skill.slug}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    toast.success('Đã sao chép lệnh cài đặt vào clipboard!');
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const copyShareUrl = () => {
    if (!currentShareToken) return;
    const shareUrl = `${window.location.origin}/share/${currentShareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    toast.success('Đã sao chép liên kết chia sẻ!');
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const handleRotateShareToken = async () => {
    setRotatingToken(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/share-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate' }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentShareToken(data.data.shareToken);
        toast.success('Đã tạo liên kết chia sẻ mới! Liên kết cũ đã hết hiệu lực.');
      } else {
        toast.error(data.error?.message || 'Không thể tạo lại liên kết.');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo lại liên kết.');
    } finally {
      setRotatingToken(false);
    }
  };

  const handleDeleteSkill = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Kỹ năng đã được xoá thành công.');
        router.push('/dashboard');
      } else {
        const json = await res.json();
        toast.error(json.error?.message || 'Không thể xoá kỹ năng.');
        setDeleting(false);
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi xoá kỹ năng.');
      setDeleting(false);
    }
  };

  const handleForkSkill = async () => {
    setForking(true);
    try {
      const res = await fetch(`/api/skills/${skill.id}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentShareToken ? { shareToken: currentShareToken } : {}),
      });
      const json = await res.json();
      if (res.ok && json.data?.skill) {
        toast.success('Đã sao chép kỹ năng vào thư viện cá nhân!');
        const newSkill = json.data.skill;
        router.push(`/s/${newSkill.owner.handle}/${newSkill.slug}`);
      } else {
        toast.error(json.error?.message || 'Không thể sao chép kỹ năng.');
        setForking(false);
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi sao chép kỹ năng.');
      setForking(false);
    }
  };

  const downloadZipUrl = `/api/skills/${skill.id}/download${currentShareToken ? `?token=${encodeURIComponent(currentShareToken)}` : ''}`;

  const renderPreview = () => {
    if (!activeFile) {
      return (
        <div className="p-8 text-center text-muted-foreground text-sm">
          Chưa chọn tệp nào để xem.
        </div>
      );
    }

    if (loadingFile) {
      return (
        <div className="p-12 text-center text-muted-foreground text-sm animate-pulse">
          Đang tải nội dung tệp...
        </div>
      );
    }

    const isSkillMd = activeFile.path === 'SKILL.md';
    const isMarkdown = activeFile.path.endsWith('.md') || isSkillMd;
    const ext = activeFile.path.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);

    // Raster Image Preview
    if (isImage) {
      const imageUrl = `/api/skills/${skill.id}/files/${activeFile.id}?raw=true${currentShareToken ? `&token=${encodeURIComponent(currentShareToken)}` : ''}`;
      return (
        <div className="p-6 flex flex-col items-center justify-center space-y-4 bg-muted/20 min-h-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={activeFile.path}
            className="max-h-[500px] max-w-full rounded border shadow-sm object-contain"
          />
          <div className="text-xs text-muted-foreground">
            {activeFile.path} ({(activeFile.size / 1024).toFixed(1)} KB)
          </div>
        </div>
      );
    }

    // Binary file download-only
    if (!activeFile.isText) {
      const singleDownloadUrl = `/api/skills/${skill.id}/files/${activeFile.id}?download=true${currentShareToken ? `&token=${encodeURIComponent(currentShareToken)}` : ''}`;
      return (
        <div className="p-12 text-center space-y-4 bg-muted/10 rounded-md">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <h4 className="text-sm font-semibold">{activeFile.path}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Tệp nhị phân ({activeFile.mimeType || 'application/octet-stream'}) -{' '}
              {(activeFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <a
            href={singleDownloadUrl}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải tệp này</span>
          </a>
        </div>
      );
    }

    // Markdown File (Toggle between Preview and Raw CodeMirror)
    const content = fileContents[activeFile.path] || '';
    if (isMarkdown && markdownViewMode === 'preview') {
      return (
        <div className="p-6 bg-card min-h-[400px]">
          <MarkdownPreview content={content} />
        </div>
      );
    }

    // Text File CodeMirror Preview
    return (
      <div className="h-full min-h-[450px]">
        <CodeMirrorEditor
          value={content}
          readOnly={true}
          isMarkdown={isMarkdown}
          className="h-full border-0 rounded-none"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Skill Header */}
      <div className="bg-card border rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{skill.name}</h1>
              <span className="text-xs bg-muted text-muted-foreground font-mono px-2 py-0.5 rounded-full border">
                v{skill.currentVersion?.number || 1}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  skill.visibility === 'PUBLIC'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : skill.visibility === 'UNLISTED'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : 'bg-muted text-muted-foreground border'
                }`}
              >
                {skill.visibility === 'PUBLIC'
                  ? 'Công khai'
                  : skill.visibility === 'UNLISTED'
                    ? 'Không công khai'
                    : 'Riêng tư'}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              <span>
                Tác giả:{' '}
                <span className="font-semibold text-foreground">@{skill.owner.handle}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Cập nhật: {new Date(skill.updatedAt).toLocaleDateString('vi-VN')}</span>
              </span>
            </div>

            {/* Attribution Badges */}
            {(skill.forkedFromSnapshot || skill.sourceUrl) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {skill.forkedFromSnapshot && (
                  <div className="flex items-center space-x-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border">
                    <GitFork className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Nhân bản từ</span>
                    <Link
                      href={`/s/${skill.forkedFromSnapshot.ownerHandle}/${skill.forkedFromSnapshot.slug}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      @{skill.forkedFromSnapshot.ownerHandle}/{skill.forkedFromSnapshot.slug}
                    </Link>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      (v{skill.forkedFromSnapshot.versionNumber})
                    </span>
                  </div>
                )}

                {skill.sourceUrl && (
                  <div className="flex items-center space-x-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border">
                    <Github className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Nhập từ</span>
                    <a
                      href={skill.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="font-medium text-foreground hover:underline flex items-center space-x-1"
                    >
                      <span>GitHub</span>
                      {skill.sourceCommit && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          ({skill.sourceCommit.slice(0, 7)})
                        </span>
                      )}
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={copyCloneCommand}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted transition-colors"
            >
              {copiedCmd ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Lệnh cài đặt</span>
            </button>

            <a
              href={downloadZipUrl}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải ZIP</span>
            </a>

            {canFork && (
              <button
                type="button"
                onClick={handleForkSkill}
                disabled={forking}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border border-primary/30 text-primary hover:bg-primary/5 rounded-md transition-colors disabled:opacity-50"
                title="Nhân bản kỹ năng vào thư viện cá nhân"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>{forking ? 'Đang sao chép...' : 'Sao chép (Fork)'}</span>
              </button>
            )}

            {canWrite && (
              <>
                {skill.visibility === 'UNLISTED' && (
                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Chia sẻ</span>
                  </button>
                )}

                <Link
                  href={`/s/${skill.owner.handle}/${skill.slug}/edit`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border border-primary/30 text-primary hover:bg-primary/5 rounded-md transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Xoá kỹ năng"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description & Tags */}
        <p className="text-sm text-foreground/80 leading-relaxed max-w-4xl">
          {skill.description || 'Không có mô tả chi tiết.'}
        </p>

        {skill.tags && skill.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <Tag className="w-3 h-3 text-muted-foreground mr-1" />
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="bg-muted px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Two-Column File Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 h-full">
          <FileTree
            files={files}
            selectedPath={selectedPath}
            onSelect={handleSelectFile}
            isEditable={false}
          />
        </div>

        {/* Right Column: File Preview */}
        <div className="lg:col-span-8 flex flex-col border rounded-md bg-card overflow-hidden">
          {/* File Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-mono text-xs font-semibold text-foreground truncate">
                {activeFile?.path || 'SKILL.md'}
              </span>
              {activeFile && (
                <span className="text-[11px] text-muted-foreground">
                  ({(activeFile.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            {/* View Mode Toggle for Markdown */}
            <div className="flex items-center space-x-2">
              {activeFile?.isText && activeFile?.path.endsWith('.md') && (
                <div className="flex items-center border rounded-md p-0.5 bg-background text-xs">
                  <button
                    type="button"
                    onClick={() => setMarkdownViewMode('preview')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      markdownViewMode === 'preview'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Xem trước</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarkdownViewMode('source')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      markdownViewMode === 'source'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    <span>Mã nguồn</span>
                  </button>
                </div>
              )}

              {activeFile && (
                <a
                  href={`/api/skills/${skill.id}/files/${activeFile.id}?download=true${currentShareToken ? `&token=${encodeURIComponent(currentShareToken)}` : ''}`}
                  title="Tải tệp này về máy"
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded border hover:bg-muted"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Preview Body */}
          <div className="flex-1 overflow-auto">{renderPreview()}</div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card border rounded-lg max-w-md w-full p-5 space-y-4 shadow-lg">
            <h3 className="text-base font-semibold">Chia sẻ kỹ năng không công khai</h3>
            <p className="text-xs text-muted-foreground">
              Bất kỳ ai có liên kết bí mật này đều có thể xem và tải kỹ năng của bạn.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${currentShareToken}`}
                className="w-full text-xs font-mono bg-muted px-3 py-2 rounded border focus:outline-none"
              />
              <button
                type="button"
                onClick={copyShareUrl}
                className="px-3 py-2 bg-primary text-primary-foreground rounded text-xs font-medium shrink-0 hover:bg-primary/90"
              >
                {copiedShareLink ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <button
                type="button"
                disabled={rotatingToken}
                onClick={handleRotateShareToken}
                className="text-amber-600 hover:underline font-medium disabled:opacity-50"
              >
                {rotatingToken ? 'Đang tạo mới...' : 'Thu hồi & tạo liên kết mới'}
              </button>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-3 py-1.5 border rounded hover:bg-muted"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-destructive/30 rounded-lg max-w-sm w-full p-5 space-y-4 shadow-lg">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold">Xác nhận xoá kỹ năng</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xoá kỹ năng{' '}
              <strong className="text-foreground">{skill.name}</strong>? Kỹ năng sẽ bị ẩn và không
              thể truy cập lại.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 border rounded text-xs hover:bg-muted"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteSkill}
                className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded text-xs font-medium hover:bg-destructive/90"
              >
                {deleting ? 'Đang xoá...' : 'Xác nhận xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
