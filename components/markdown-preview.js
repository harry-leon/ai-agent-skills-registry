'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

/**
 * Renders Markdown securely using GitHub Flavored Markdown and strict HTML sanitization.
 * Rule R8: NEVER uses dangerouslySetInnerHTML or rehype-raw.
 *
 * @param {Object} props
 * @param {string} props.content - Markdown source string
 * @param {string} [props.className] - Additional CSS class names
 */
export function MarkdownPreview({ content, className = '' }) {
  if (!content) {
    return (
      <div className="text-muted-foreground italic text-sm py-4">
        No content to display.
      </div>
    );
  }

  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none text-foreground break-words overflow-x-auto text-sm leading-relaxed ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ node, ...props }) => {
            const text = String(props.children || '');
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
            return <h1 id={id} {...props} className="scroll-mt-20 text-2xl font-bold tracking-tight text-foreground mt-8 mb-4 border-b border-border/40 pb-2" />;
          },
          h2: ({ node, ...props }) => {
            const text = String(props.children || '');
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
            return <h2 id={id} {...props} className="scroll-mt-20 text-xl font-semibold tracking-tight text-foreground mt-6 mb-3" />;
          },
          h3: ({ node, ...props }) => {
            const text = String(props.children || '');
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
            return <h3 id={id} {...props} className="scroll-mt-20 text-lg font-medium text-foreground mt-5 mb-2" />;
          },
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 border rounded-md">
              <table {...props} className="w-full text-left border-collapse text-xs" />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              {...props}
              className="border-b bg-muted/50 px-3 py-2 font-semibold text-foreground"
            />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="border-b px-3 py-2 text-foreground/90" />
          ),
          pre: ({ node, ...props }) => (
            <pre
              {...props}
              className="bg-muted text-foreground p-3 rounded-lg overflow-x-auto font-mono text-xs my-3 border"
            />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code
                {...props}
                className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-foreground font-semibold"
              />
            ) : (
              <code {...props} className="font-mono text-xs" />
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
