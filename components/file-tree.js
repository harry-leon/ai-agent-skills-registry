'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  Image as ImageIcon,
  File,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

/**
 * Builds nested hierarchy from flat list of files.
 * @param {Array<Object>} files
 * @returns {Array<Object>}
 */
function buildTree(files) {
  const root = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      let existing = currentLevel.find((item) => item.name === part);

      if (!existing) {
        if (isFile) {
          existing = {
            type: 'file',
            name: part,
            path: file.path,
            file,
          };
          currentLevel.push(existing);
        } else {
          existing = {
            type: 'folder',
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            children: [],
          };
          currentLevel.push(existing);
        }
      }

      if (!isFile) {
        currentLevel = existing.children;
      }
    }
  }

  // Sort: folders first, then files alphabetically
  function sortNodes(nodes) {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const node of nodes) {
      if (node.children) {
        sortNodes(node.children);
      }
    }
  }

  sortNodes(root);
  return root;
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (filename === 'SKILL.md') {
    return <FileText className="w-4 h-4 text-primary shrink-0" />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />;
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'sh', 'json', 'yaml', 'yml'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-amber-500 shrink-0" />;
  }
  return <File className="w-4 h-4 text-muted-foreground shrink-0" />;
}

/**
 * Accessible File Tree component with keyboard navigation.
 *
 * @param {Object} props
 * @param {Array<Object>} props.files - Array of files with `path` and metadata
 * @param {string} props.selectedPath - Currently active file path
 * @param {Function} props.onSelect - Callback when file is clicked or chosen
 * @param {boolean} [props.isEditable] - Enables edit controls (add/rename/delete)
 * @param {Function} [props.onAddFile]
 * @param {Function} [props.onRenameFile]
 * @param {Function} [props.onDeleteFile]
 */
export function FileTree({
  files = [],
  selectedPath,
  onSelect,
  isEditable = false,
  onAddFile,
  onRenameFile,
  onDeleteFile,
}) {
  const [expandedFolders, setExpandedFolders] = useState(() => {
    // Expand all top-level folders by default
    const set = new Set();
    files.forEach((f) => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        set.add(parts[0]);
      }
    });
    return set;
  });

  const tree = useMemo(() => buildTree(files), [files]);

  useEffect(() => {
    if (selectedPath) {
      const parts = selectedPath.split('/');
      if (parts.length > 1) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          for (let i = 1; i < parts.length; i++) {
            next.add(parts.slice(0, i).join('/'));
          }
          return next;
        });
      }
    }
  }, [selectedPath]);

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const renderNode = (node, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = isFolder && expandedFolders.has(node.path);
    const isSelected = !isFolder && node.path === selectedPath;
    const isSkillMd = node.path === 'SKILL.md';

    return (
      <div key={node.path} className="select-none text-xs">
        <div
          role={isFolder ? 'button' : 'treeitem'}
          aria-expanded={isFolder ? isExpanded : undefined}
          aria-selected={isSelected}
          tabIndex={0}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.path);
            } else {
              onSelect(node.path, node.file);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (isFolder) toggleFolder(node.path);
              else onSelect(node.path, node.file);
            } else if (e.key === 'ArrowRight' && isFolder && !isExpanded) {
              e.preventDefault();
              toggleFolder(node.path);
            } else if (e.key === 'ArrowLeft' && isFolder && isExpanded) {
              e.preventDefault();
              toggleFolder(node.path);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
            isSelected
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted/60 text-foreground/80 hover:text-foreground'
          }`}
        >
          <div className="flex items-center space-x-2 truncate">
            {isFolder ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </>
            ) : (
              getFileIcon(node.name)
            )}
            <span className="truncate">{node.name}</span>
            {isSkillMd && (
              <span className="bg-primary/20 text-primary text-[10px] px-1 rounded font-semibold uppercase">
                core
              </span>
            )}
          </div>

          {/* Edit Actions in Edit Mode */}
          {isEditable && !isFolder && (
            <div className="flex items-center space-x-1 opacity-60 hover:opacity-100">
              {onRenameFile && (
                <button
                  type="button"
                  title="Đổi tên tệp"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameFile(node.path);
                  }}
                  className="p-1 hover:text-primary rounded"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              {onDeleteFile && !isSkillMd && (
                <button
                  type="button"
                  title="Xoá tệp"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(node.path);
                  }}
                  className="p-1 hover:text-destructive rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {isFolder && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-md bg-card p-2 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 border-b mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cây thư mục ({files.length} tệp)
        </span>
        {isEditable && onAddFile && (
          <button
            type="button"
            onClick={onAddFile}
            className="flex items-center space-x-1 text-xs text-primary hover:underline font-medium"
            title="Thêm tệp mới"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm tệp</span>
          </button>
        )}
      </div>

      <div
        role="tree"
        aria-label="Cây thư mục kỹ năng"
        className="overflow-y-auto space-y-0.5 flex-1 pr-1"
      >
        {tree.length === 0 ? (
          <div className="text-xs text-muted-foreground p-3 text-center">Không có tệp nào.</div>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
}
