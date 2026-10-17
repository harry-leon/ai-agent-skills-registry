'use client';

import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';

/**
 * Accessible CodeMirror 6 code editor component.
 *
 * @param {Object} props
 * @param {string} props.value - Editor content
 * @param {Function} [props.onChange] - Callback on content change
 * @param {boolean} [props.readOnly] - Whether editor is in read-only mode
 * @param {boolean} [props.isMarkdown] - Whether to activate markdown syntax
 * @param {boolean} [props.darkMode] - Whether to apply dark theme
 * @param {string} [props.className] - Container CSS class
 */
export function CodeMirrorEditor({
  value = '',
  onChange,
  readOnly = false,
  isMarkdown = true,
  darkMode = false,
  className = '',
}) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          const docString = update.state.doc.toString();
          onChangeRef.current(docString);
        }
      }),
    ];

    if (isMarkdown) {
      extensions.push(markdown());
    }

    if (darkMode) {
      extensions.push(oneDark);
    }

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
      extensions.push(EditorView.editable.of(false));
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [readOnly, isMarkdown, darkMode]);

  // Synchronize external value changes if not originated from internal edit
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`border rounded-md overflow-hidden text-sm font-mono focus-within:ring-2 focus-within:ring-primary/20 ${className}`}
      style={{ minHeight: '320px', height: '100%' }}
    />
  );
}
