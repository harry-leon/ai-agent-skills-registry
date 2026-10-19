'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Lock, Link2, Globe, ChevronDown, Check, Info } from 'lucide-react';

export const VISIBILITY_OPTIONS = [
  {
    value: 'PRIVATE',
    label: 'Private',
    subtitle: 'Only you can access',
    description:
      'Only you can view, download, or edit this skill. It will never appear in community search or public directory listings.',
    icon: Lock,
  },
  {
    value: 'UNLISTED',
    label: 'Unlisted',
    subtitle: 'Accessible via secret link',
    description:
      'Anyone with your secret share token link can view and download this skill, but it remains hidden from public search directories.',
    icon: Link2,
  },
  {
    value: 'PUBLIC',
    label: 'Public',
    subtitle: 'Visible in Community Skills directory',
    description:
      'Visible to everyone in the Community Skills directory. Anyone can search, view, download, or fork this skill into their library.',
    icon: Globe,
  },
];

export function VisibilitySelector({ value = 'PRIVATE', onChange, id = 'visibility' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption =
    VISIBILITY_OPTIONS.find((opt) => opt.value === value) || VISIBILITY_OPTIONS[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open]);

  const handleSelect = (val) => {
    if (onChange) {
      onChange(val);
    }
    setOpen(false);
  };

  const SelectedIcon = selectedOption.icon;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden native select for test selector compatibility (page.selectOption('#visibility', ...)) */}
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {VISIBILITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} ({opt.subtitle})
          </option>
        ))}
      </select>

      {/* Custom Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-[#1c2536] bg-[#0b0f17] px-3.5 py-2 text-sm text-slate-100 hover:border-slate-700 focus-visible:outline-none focus-visible:border-blue-500/80 focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <SelectedIcon className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="font-medium text-slate-100">{selectedOption.label}</span>
          <span className="text-xs text-slate-400 truncate">({selectedOption.subtitle})</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              open ? 'rotate-180 text-blue-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          role="listbox"
          aria-label="Visibility options"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-[#1c2536] bg-[#111624] p-1.5 shadow-2xl space-y-1 animate-in fade-in-50 duration-150"
        >
          {VISIBILITY_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            const Icon = opt.icon;

            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors group ${
                  isSelected
                    ? 'bg-blue-500/10 text-slate-100 font-medium border border-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {/* Option label & subtitle */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isSelected ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-100">{opt.label}</span>
                    <span className="text-slate-400 ml-1.5 font-normal">({opt.subtitle})</span>
                  </div>
                </div>

                {/* Right side: Selected Checkmark & Info Icon with Hover Tooltip */}
                <div className="flex items-center gap-2 shrink-0">
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-400" />}

                  {/* Info Icon with hoverable explanation tooltip at end of line */}
                  <div
                    className="relative flex items-center group/tooltip"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      aria-label={`About ${opt.label} visibility`}
                      title={`About ${opt.label} visibility`}
                      className="p-1 rounded-md text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-help"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>

                    {/* Tooltip Content */}
                    <div className="pointer-events-none absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block group-focus-within/tooltip:block w-72 rounded-xl border border-[#26334a] bg-[#0b0f17] p-3 text-xs text-slate-200 shadow-2xl z-50">
                      <div className="font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{opt.label} Visibility</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                        {opt.description}
                      </p>
                      {/* Tooltip arrow */}
                      <div className="absolute right-2.5 -bottom-1 h-2 w-2 rotate-45 border-b border-r border-[#26334a] bg-[#0b0f17]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
