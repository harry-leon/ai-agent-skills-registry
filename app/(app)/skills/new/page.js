'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { VisibilitySelector } from '@/components/visibility-selector.js';

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
  const [templateBody, setTemplateBody] = useState('# Skill Instructions\n\nProvide agent workflows, system prompts, or tool instructions here...');

  // Metadata
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [versionMessage, setVersionMessage] = useState('Initial skill commit');

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
          setErrorMessage('Please fill in both Skill Name and Description.');
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
            setErrorMessage('Please select a ZIP or .skill archive to upload.');
            setUploading(false);
            return;
          }
          formData.append('file', selectedFile);
        } else if (mode === 'folder') {
          if (selectedFolderFiles.length === 0) {
            setErrorMessage('Please select a folder containing skill files.');
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
        setErrorMessage(data.error?.message || 'Skill creation failed.');
        setErrorDetails(data.error?.details || []);
        setUploading(false);
        setProgress(0);
        return;
      }

      setProgress(100);
      if (data.data?.warnings && data.data.warnings.length > 0) {
        setWarnings(data.data.warnings);
      }

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setErrorMessage(`Connection error occurred: ${err.message}`);
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">Create New Agent Skill</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload a ZIP archive, select a local skill directory, or create from a blank template.
        </p>
      </div>

      {/* Mode selection tabs */}
      <div className="flex border-b border-[#1c2536]">
        <button
          type="button"
          onClick={() => setMode('zip')}
          className={`flex min-h-[44px] items-center px-4 font-medium text-sm transition-colors border-b-2 -mb-px cursor-pointer ${
            mode === 'zip'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ZIP Archive / Text (.md, .txt)
        </button>
        <button
          type="button"
          onClick={() => setMode('folder')}
          className={`flex min-h-[44px] items-center px-4 font-medium text-sm transition-colors border-b-2 -mb-px cursor-pointer ${
            mode === 'folder'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Folder Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('template')}
          className={`flex min-h-[44px] items-center px-4 font-medium text-sm transition-colors border-b-2 -mb-px cursor-pointer ${
            mode === 'template'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Blank Template
        </button>
      </div>

      {/* Error & Warnings Banners */}
      {errorMessage && (
        <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-400">{errorMessage}</p>
          {errorDetails.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-red-400 space-y-1">
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
          className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-400"
        >
          <p className="text-sm font-semibold">Validation warnings:</p>
          <ul className="mt-2 list-inside list-disc text-xs space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode: ZIP or Single File */}
        {mode === 'zip' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Package Archive or Markdown File (.zip, .skill, .md, .txt)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1c2536] bg-[#111624] p-6 text-center hover:bg-[#131b2c] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.skill,.md,.txt,.markdown"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="font-medium text-sm text-slate-200">
                {selectedFile ? selectedFile.name : 'Click or drop a ZIP archive or SKILL.md file here'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tối đa 200 KB mỗi tệp, tổng dung lượng lưu trữ 10 MB/tài khoản. Chỉ chấp nhận tệp nén (.zip, .skill) hoặc văn bản (.md, .txt).
              </p>
            </div>
          </div>
        )}

        {/* Mode: Folder */}
        {mode === 'folder' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Select Skill Directory</label>
            <div
              onClick={() => dirInputRef.current?.click()}
              className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1c2536] bg-[#111624] p-6 text-center hover:bg-[#131b2c] transition-colors"
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
              <p className="font-medium text-sm text-slate-200">
                {selectedFolderFiles.length > 0
                  ? `Selected ${selectedFolderFiles.length} files in folder`
                  : 'Click to select an entire skill folder'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                The browser will upload all files while preserving relative paths.
              </p>
            </div>
          </div>
        )}

        {/* Mode: Template */}
        {mode === 'template' && (
          <div className="space-y-4 rounded-xl border border-[#1c2536] bg-[#111624] p-4 sm:p-6 shadow-xs">
            <div className="space-y-2">
              <label htmlFor="templateName" className="text-sm font-medium text-slate-200">
                Skill Name (name) <span className="text-red-400">*</span>
              </label>
              <input
                id="templateName"
                type="text"
                required
                placeholder="code-reviewer"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex min-h-[40px] w-full rounded-md border border-[#1c2536] bg-[#0b0f17] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60"
              />
              <p className="text-xs text-slate-400">
                Lowercase letters, numbers, and hyphens only (e.g., code-reviewer).
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="templateDescription" className="text-sm font-medium text-slate-200">
                Description (description) <span className="text-red-400">*</span>
              </label>
              <textarea
                id="templateDescription"
                required
                rows={2}
                placeholder="Describe what this AI agent skill does and when to invoke it..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="flex w-full rounded-md border border-[#1c2536] bg-[#0b0f17] p-3 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="templateBody" className="text-sm font-medium text-slate-200">
                Skill Instructions (SKILL.md Markdown Body)
              </label>
              <textarea
                id="templateBody"
                rows={6}
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                className="flex w-full font-mono rounded-md border border-[#1c2536] bg-[#0b0f17] p-3 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60"
              />
            </div>
          </div>
        )}

        {/* Common Metadata */}
        <div className="space-y-4 rounded-xl border border-[#1c2536] bg-[#111624] p-4 sm:p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-slate-100">Skill Settings</h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="visibility" className="text-sm font-medium text-slate-200">
                Visibility
              </label>
              <span className="text-xs text-slate-400">Hover (i) icon for permissions breakdown</span>
            </div>
            <VisibilitySelector
              id="visibility"
              value={visibility}
              onChange={setVisibility}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium text-slate-200">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              placeholder="agent, coding, review, python"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="flex min-h-[40px] w-full rounded-md border border-[#1c2536] bg-[#0b0f17] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60"
            />
            <p className="text-xs text-slate-400">Separate multiple tags with commas.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-slate-200">
              Version Message
            </label>
            <input
              id="message"
              type="text"
              value={versionMessage}
              onChange={(e) => setVersionMessage(e.target.value)}
              className="flex min-h-[40px] w-full rounded-md border border-[#1c2536] bg-[#0b0f17] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60"
            />
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Validating and uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#1c2536] overflow-hidden">
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
            className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            {uploading ? 'Processing...' : 'Create Skill'}
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => router.back()}
            className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-[#1c2536] bg-[#111624] px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
