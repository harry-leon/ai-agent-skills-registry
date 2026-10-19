'use client';

import React, { useState } from 'react';
import { useStack } from '@/components/stack-builder-context.js';
import {
  Layers,
  X,
  Trash2,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  ChevronRight,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

export function StackBuilderDrawer() {
  const { stack, isOpen, setIsOpen, removeFromStack, clearStack, generateCliCommand } = useStack();
  const [copied, setCopied] = useState(false);

  const handleCopyCommand = async () => {
    const cmd = generateCliCommand();
    if (!cmd) return;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      toast.success('Batch install command copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy command');
    }
  };

  const handleExportJson = () => {
    if (stack.length === 0) return;
    const manifest = {
      name: 'my-agent-stack',
      version: '1.0.0',
      skills: stack.map((s) => ({
        handle: s.handle,
        slug: s.slug,
        version: s.version,
        specifier: `@${s.handle}/${s.slug}`,
      })),
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skillvault-stack.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported skillvault-stack.json');
  };

  return (
    <>
      {/* Floating Toggle Button (Always visible when stack has items or when closed) */}
      {stack.length > 0 && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-xl shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 hover:scale-105 active:scale-95 transition-all duration-200 border border-blue-400/30 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
        >
          <Layers className="w-4 h-4" />
          <span>Stack Builder</span>
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20 text-white font-mono text-[11px] font-bold">
            {stack.length}
          </span>
        </button>
      )}

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-[#0e1422] border-l border-[#1c2536] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200 text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c2536] bg-[#111728]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>Stack Builder</span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400">
                      {stack.length} {stack.length === 1 ? 'skill' : 'skills'}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Assemble multi-skill agent bundles</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {stack.length > 0 && (
                  <button
                    type="button"
                    onClick={clearStack}
                    title="Clear all"
                    className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Skill Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {stack.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-800/40 border border-[#1c2536] flex items-center justify-center mx-auto text-slate-500">
                    <Layers className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Your stack is empty. Click <strong>&quot;+ Add to Stack&quot;</strong> on any skill card to bundle multiple skills together.
                  </p>
                </div>
              ) : (
                stack.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#131b2e] border border-[#1f2b42] hover:border-blue-500/30 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-100 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-[#0b0f17] px-1.5 py-0.2 rounded border border-[#1c2536]">
                          v{item.version}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-blue-400 truncate mt-0.5">
                        @{item.handle}/{item.slug}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromStack(item.id)}
                      title="Remove"
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer with One-Liner CLI & Export actions */}
            {stack.length > 0 && (
              <div className="p-4 border-t border-[#1c2536] bg-[#111728] space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      <span>One-liner CLI install command:</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {stack.length} packages
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-[#0a0e17] border border-[#1c2536] rounded-lg p-2.5">
                    <code className="text-xs font-mono text-amber-300 truncate flex-1 select-all">
                      {generateCliCommand()}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyCommand}
                      className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#162035] hover:bg-[#1c2842] border border-[#1f2d48] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.info(`Ready to install ${stack.length} skills into your agent project.`);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Inspect Spec</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
