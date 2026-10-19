'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Github } from '@/components/icons/github.js';
import { VisibilitySelector } from '@/components/visibility-selector.js';
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
        setErrorMessage(json.error?.message || 'Failed to import skill from GitHub.');
        setErrorDetails(json.error?.details || []);
        toast.error(json.error?.message || 'GitHub import failed.');
        return;
      }

      if (json.data?.validation?.warnings?.length > 0) {
        setWarnings(json.data.validation.warnings);
      }

      toast.success('Successfully imported skill from GitHub!');

      const createdSkill = json.data.skill;
      if (createdSkill && createdSkill.owner && createdSkill.slug) {
        router.push(`/s/${createdSkill.owner.handle}/${createdSkill.slug}`);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setErrorMessage('Connection error occurred while importing skill.');
      toast.error('Server connection error.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1c2536] bg-[#111624] text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors"
          title="Back to library"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-2">
            <Github className="h-6 w-6 text-slate-200" />
            <span>Import Skill from GitHub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Import an AI agent skill directory directly from any public GitHub repository into your
            library.
          </p>
        </div>
      </div>

      {/* Info Callout */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-300 space-y-1.5">
        <div className="font-semibold flex items-center space-x-1.5 text-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          <span>Repository requirements:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-xs text-blue-300 ml-1">
          <li>Only public GitHub repositories are supported.</li>
          <li>
            The root directory or specified subpath must contain a valid <code>SKILL.md</code> file.
          </li>
          <li>
            Branch names containing slashes (<code>/</code>) are not supported (please use Commit
            SHA or Tag).
          </li>
        </ul>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <div className="flex items-center space-x-2 font-medium text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {errorDetails.length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-red-400/90">
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
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-400">
          <div className="flex items-center space-x-2 font-medium text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Skill validation warnings:</span>
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
        <div className="space-y-4 rounded-xl border border-[#1c2536] bg-[#111624] p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-100">GitHub Repository Source</h2>

          <div className="space-y-2">
            <label htmlFor="githubUrl" className="text-sm font-medium text-slate-200">
              GitHub URL <span className="text-red-400">*</span>
            </label>
            <input
              id="githubUrl"
              type="url"
              required
              placeholder="https://github.com/owner/repo or https://github.com/owner/repo/tree/main/skills/agent"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex min-h-[40px] w-full rounded-md border border-[#1c2536] bg-[#0b0f17] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60"
            />
            <p className="text-xs text-slate-400">
              Repository root URLs or deep subpath URLs (e.g. <code>/tree/ref/subpath</code>) are
              supported.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="ref" className="text-sm font-medium text-slate-200">
                Branch / Tag / Commit SHA (Optional)
              </label>
              <input
                id="ref"
                type="text"
                placeholder="main, v1.0.0, or 7fd1a60"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="flex min-h-[40px] w-full rounded-md border border-[#1c2536] bg-[#0b0f17] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60"
              />
              <p className="text-xs text-slate-400">Defaults to the default repository branch.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="subpath" className="text-sm font-medium text-slate-200">
                Subpath (Optional)
              </label>
              <input
                id="subpath"
                type="text"
                placeholder="skills/my-agent-skill"
                value={subpath}
                onChange={(e) => setSubpath(e.target.value)}
                className="flex min-h-[40px] w-full rounded-md border border-[#1c2536] bg-[#0b0f17] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60"
              />
              <p className="text-xs text-slate-400">Used if SKILL.md is inside a subfolder.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-[#1c2536] bg-[#111624] p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-100">Library Settings</h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="visibility" className="text-sm font-medium text-slate-200">
                Visibility
              </label>
              <span className="text-xs text-slate-400">
                Hover (i) icon for permissions breakdown
              </span>
            </div>
            <VisibilitySelector id="visibility" value={visibility} onChange={setVisibility} />
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium text-slate-200">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              placeholder="agent, github, coding"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="flex min-h-[40px] w-full rounded-md border border-[#1c2536] bg-[#0b0f17] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/60"
            />
            <p className="text-xs text-slate-400">
              Comma-separated tags (lowercase letters, numbers, hyphens).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={importing || !url.trim()}
            className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Downloading and parsing from GitHub...</span>
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                <span>Import Skill</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={importing}
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
