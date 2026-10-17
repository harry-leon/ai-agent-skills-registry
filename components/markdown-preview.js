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
        Không có nội dung để hiển thị.
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
