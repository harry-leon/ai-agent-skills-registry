'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import yaml from 'yaml';
import { Tag, ShieldCheck, Terminal, Info, Layers } from 'lucide-react';

/**
 * Renders Markdown securely using GitHub Flavored Markdown and strict HTML sanitization.
 * Rule R8: NEVER uses dangerouslySetInnerHTML or rehype-raw.
 * Automatically parses YAML frontmatter and presents it as a clean metadata header card.
 *
 * @param {Object} props
 * @param {string} props.content - Markdown source string
 * @param {string} [props.className] - Additional CSS class names
 */
export function MarkdownPreview({ content, className = '' }) {
  const { frontmatter, body } = useMemo(() => {
    if (!content) return { frontmatter: null, body: '' };

    // Match YAML frontmatter at start: --- ... ---
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (match) {
      try {
        const parsed = yaml.parse(match[1]);
        if (parsed && typeof parsed === 'object') {
          return { frontmatter: parsed, body: match[2].trim() };
        }
      } catch {
        // Fallback if parsing fails
      }
    }
    return { frontmatter: null, body: content };
  }, [content]);

  if (!content) {
    return <div className="text-slate-500 italic text-sm py-4">No content to display.</div>;
  }

  return (
    <div
      className={`prose prose-invert max-w-none text-slate-200 break-words overflow-x-auto text-sm leading-relaxed ${className}`}
    >
      {/* Frontmatter Metadata Header Card */}
      {frontmatter && (
        <div className="mb-6 rounded-xl border border-[#1e293b] bg-gradient-to-b from-[#101728] to-[#0c121e] p-4 sm:p-5 not-prose shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-[#1c2536] pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] shrink-0" />
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-100 truncate">
                {frontmatter.name || 'SKILL SPECIFICATION'}
              </span>
            </div>
            {frontmatter.license && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{frontmatter.license}</span>
              </span>
            )}
          </div>

          {frontmatter.description && (
            <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
              {frontmatter.description}
            </p>
          )}

          {/* Additional frontmatter tags / metadata */}
          {(frontmatter.tags || frontmatter.category || frontmatter.version) && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              {frontmatter.version && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0b0f17] text-slate-400 border border-[#1c2536]">
                  v{frontmatter.version}
                </span>
              )}
              {frontmatter.category && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0b0f17] text-slate-400 border border-[#1c2536]">
                  {frontmatter.category}
                </span>
              )}
              {Array.isArray(frontmatter.tags) &&
                frontmatter.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0b0f17] text-blue-400/90 border border-blue-500/20"
                  >
                    #{t}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Actual Markdown Body without raw YAML text */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ node, ...props }) => {
            const text = String(props.children || '');
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .trim()
              .replace(/\s+/g, '-');
            return (
              <h1
                id={id}
                {...props}
                className="scroll-mt-24 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 mt-6 mb-4 border-b border-[#1c2536] pb-3"
              />
            );
          },
          h2: ({ node, ...props }) => {
            const text = String(props.children || '');
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .trim()
              .replace(/\s+/g, '-');
            return (
              <h2
                id={id}
                {...props}
                className="scroll-mt-24 text-lg sm:text-xl font-bold tracking-tight text-slate-100 mt-8 mb-3 flex items-center gap-2"
              />
            );
          },
          h3: ({ node, ...props }) => {
            const text = String(props.children || '');
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .trim()
              .replace(/\s+/g, '-');
            return (
              <h3
                id={id}
                {...props}
                className="scroll-mt-24 text-base font-semibold text-slate-200 mt-6 mb-2"
              />
            );
          },
          p: ({ node, ...props }) => (
            <p {...props} className="text-slate-300 leading-relaxed text-sm my-3.5" />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc pl-5 space-y-1.5 my-3 text-slate-300 text-sm marker:text-blue-500" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal pl-5 space-y-1.5 my-3 text-slate-300 text-sm marker:text-blue-500" />
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="text-slate-300 leading-relaxed" />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className="border-l-2 border-blue-500/70 bg-blue-500/5 px-4 py-3 rounded-r-xl my-4 text-slate-300 text-sm italic"
            />
          ),
          hr: ({ node, ...props }) => (
            <hr {...props} className="border-[#1c2536] my-6" />
          ),
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium transition-colors"
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 border border-[#1c2536] rounded-xl bg-[#0b0f17]">
              <table {...props} className="w-full text-left border-collapse text-xs" />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              {...props}
              className="border-b border-[#1c2536] bg-[#111624] px-3.5 py-2.5 font-semibold text-slate-200"
            />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="border-b border-[#1c2536]/80 px-3.5 py-2.5 text-slate-300" />
          ),
          pre: ({ node, ...props }) => (
            <pre
              {...props}
              className="bg-[#0b0f17] border border-[#1e293b] text-slate-200 p-4 rounded-xl overflow-x-auto font-mono text-xs my-4 shadow-inner leading-relaxed"
            />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code
                {...props}
                className="bg-[#121927] border border-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[12px] font-medium"
              />
            ) : (
              <code {...props} className="font-mono text-xs text-slate-200" />
            ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
