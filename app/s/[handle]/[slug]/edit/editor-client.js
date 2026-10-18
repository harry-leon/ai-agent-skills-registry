'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { FileTree } from '@/components/file-tree.js';
import { CodeMirrorEditor } from '@/components/code-mirror-editor.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.js';
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
        toast.error('Failed to load file contents.');
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
      toast.error('Please enter a file path.');
      return;
    }

    if (cleanPath.includes('..') || cleanPath.includes('\\')) {
      toast.error('File path cannot contain .. or backslashes.');
      return;
    }

    if (files.some((f) => f.path.toLowerCase() === cleanPath.toLowerCase())) {
      toast.error('A file with this path already exists.');
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
    toast.success(`Added file ${cleanPath}`);
  };

  // Rename file
  const handleRenameSubmit = (e) => {
    e.preventDefault();
    const cleanNewPath = renamedPath.trim().replace(/^\/+/, '');

    if (!cleanNewPath) {
      toast.error('Please enter a new file name.');
      return;
    }

    if (cleanNewPath === targetRenamePath) {
      setShowRenameModal(false);
      return;
    }

    if (cleanNewPath.includes('..') || cleanNewPath.includes('\\')) {
      toast.error('Invalid file path.');
      return;
    }

    if (files.some((f) => f.path.toLowerCase() === cleanNewPath.toLowerCase())) {
      toast.error('File path already exists in this skill.');
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
    toast.success('File renamed successfully.');
  };

  // Delete file
  const handleDeleteFile = (pathToDelete) => {
    if (pathToDelete === 'SKILL.md') {
      toast.error('Cannot delete required SKILL.md file!');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${pathToDelete}" from this skill?`)) {
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

    toast.success(`Deleted file ${pathToDelete}`);
  };

  // Save new version
  const handleSaveVersion = async () => {
    // 1. Validate SKILL.md exists
    if (!files.some((f) => f.path === 'SKILL.md')) {
      toast.error('Skill must contain a SKILL.md file');
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
          message: message.trim() || 'New version update',
          files: payloadFiles,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error?.details && Array.isArray(json.error.details)) {
          setValidationErrors(json.error.details);
        }
        toast.error(json.error?.message || 'Failed to save new version.');
        setSaving(false);
        return;
      }

      toast.success(`Successfully published version v${json.data.number}!`);
      router.push(`/s/${skill.owner.handle}/${skill.slug}`);
      router.refresh();
    } catch {
      toast.error('Network error while saving version.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editor Header */}
      <div className="bg-[#111624] border border-[#1c2536] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Link
                href={`/s/${skill.owner.handle}/${skill.slug}`}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to viewer</span>
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center flex-wrap gap-2">
              <span>Edit Skill: {skill.name}</span>
              <span className="text-xs bg-[#0b0f17] text-slate-400 font-mono px-2.5 py-0.5 rounded-full border border-[#1c2536]">
                v{(skill.currentVersion?.number || 1) + 1} (upcoming)
              </span>
            </h1>
          </div>

          {/* Action Bar */}
          <div className="flex items-center flex-wrap gap-2.5">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Version change message (e.g., Update instructions...)"
              className="px-3.5 py-2 min-h-[40px] text-xs bg-[#0b0f17] border border-[#1c2536] rounded-lg w-full sm:w-80 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
            />

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveVersion}
              className="inline-flex min-h-[40px] items-center space-x-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Publishing...' : 'Publish Version'}</span>
            </button>
          </div>
        </div>

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Validation errors detected:</span>
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
                toast.error('Cannot rename SKILL.md file');
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
        <div className="lg:col-span-8 flex flex-col border border-[#1c2536] rounded-xl bg-[#111624] overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1c2536] bg-[#0b0f17]">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                {activeFile?.path || 'SKILL.md'}
              </span>
              {activeFile?.path === 'SKILL.md' && (
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Frontmatter name & description required
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {activeFile ? `${(fileContents[activeFile.path] || '').length} characters` : ''}
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
              <div className="p-12 text-center text-xs text-slate-500">
                Binary files cannot be edited directly in the code editor.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add File Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm bg-[#111624] border-[#1c2536] text-slate-200">
          <form onSubmit={handleAddFileSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Add New File</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter relative path (e.g.{' '}
                <code className="bg-[#0b0f17] text-slate-300 px-1 py-0.5 rounded font-mono">scripts/run.py</code> or{' '}
                <code className="bg-[#0b0f17] text-slate-300 px-1 py-0.5 rounded font-mono">docs/api.md</code>):
              </DialogDescription>
            </DialogHeader>

            <input
              type="text"
              autoFocus
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="scripts/main.py"
              className="w-full text-xs font-mono bg-[#0b0f17] border border-[#1c2536] px-3.5 py-2.5 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors"
            />

            <DialogFooter className="pt-2 border-t border-[#1c2536]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-[#1c2536] bg-[#0b0f17] rounded-lg text-xs font-semibold hover:bg-[#1c2536] cursor-pointer text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
              >
                Create File
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename File Modal */}
      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent className="max-w-sm bg-[#111624] border-[#1c2536] text-slate-200">
          <form onSubmit={handleRenameSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Rename File</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter new path for{' '}
                <strong className="font-mono text-slate-200">{targetRenamePath}</strong>:
              </DialogDescription>
            </DialogHeader>

            <input
              type="text"
              autoFocus
              value={renamedPath}
              onChange={(e) => setRenamedPath(e.target.value)}
              className="w-full text-xs font-mono bg-[#0b0f17] border border-[#1c2536] px-3.5 py-2.5 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors"
            />

            <DialogFooter className="pt-2 border-t border-[#1c2536]">
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 border border-[#1c2536] bg-[#0b0f17] rounded-lg text-xs font-semibold hover:bg-[#1c2536] cursor-pointer text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
              >
                Rename
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
