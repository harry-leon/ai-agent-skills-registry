'use client';

import React, { useState } from 'react';
import {
  Layers,
  Bot,
  ChevronRight,
  SlidersHorizontal,
  Link2,
  CloudDownload,
  Code2,
  Package,
  X,
  Sparkles,
  CheckCircle2,
  Languages,
} from 'lucide-react';

export const COMPONENT_GUIDE = [
  {
    key: 'skills',
    label: 'Skills',
    icon: Layers,
    count: '891',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    tagline: {
      en: 'AI Knowledge & Guidelines',
      vi: 'Kiến thức & kinh nghiệm của AI',
    },
    whatIs: {
      en: 'Standard guidelines (SKILL.md). AI auto-reads when relevant task occurs.',
      vi: 'Cẩm nang hướng dẫn chuẩn (SKILL.md). AI tự động đọc khi gặp tác vụ tương ứng.',
    },
    example: {
      en: 'Memory leak diagnosis, 3NF schema design, README/LICENSE generation.',
      vi: 'Chẩn đoán memory leak, thiết kế chuẩn DB 3NF, sinh file README/LICENSE.',
    },
    bestFor: {
      en: 'Teaching AI your specific engineering guidelines & workflows.',
      vi: 'Dạy AI làm việc theo tiêu chuẩn & kinh nghiệm riêng của bạn.',
    },
  },
  {
    key: 'agents',
    label: 'Agents',
    icon: Bot,
    count: '422',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
    tagline: {
      en: 'Specialized Subagents & Personas',
      vi: 'Nhân sự & vai diễn AI độc lập',
    },
    whatIs: {
      en: 'Autonomous personas called into isolated context for specific jobs.',
      vi: 'Các nhân sự chuyên biệt hoạt động độc lập trong ngữ cảnh riêng.',
    },
    example: {
      en: 'Security Auditor (finds CVEs/SQLi), Code Reviewer, Researcher.',
      vi: 'Security Auditor (soi lỗi bảo mật), Code Reviewer, Researcher tra cứu.',
    },
    bestFor: {
      en: 'Deep specialized tasks without cluttering your main chat context.',
      vi: 'Thực hiện tác vụ chuyên sâu mà không làm loãng luồng chat chính.',
    },
  },
  {
    key: 'commands',
    label: 'Commands',
    icon: ChevronRight,
    count: '288',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    tagline: {
      en: 'Fast Slash Shortcuts (/cmd)',
      vi: 'Phím tắt thao tác nhanh (/command)',
    },
    whatIs: {
      en: 'Slash commands typed by human in terminal/chat to trigger workflows.',
      vi: 'Lệnh gõ nhanh bắt đầu bằng dấu gạch chéo để kích hoạt quy trình.',
    },
    example: {
      en: '/test (runs & fixes tests), /plan (drafts steps), /commit (auto commit).',
      vi: '/test (tự chạy và fix test), /plan (lập kế hoạch), /commit (gom diff commit).',
    },
    bestFor: {
      en: 'Instant one-word command triggers for routine multi-step actions.',
      vi: 'Kích hoạt ngay các quy trình quen thuộc chỉ bằng một từ khóa.',
    },
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: SlidersHorizontal,
    count: '76',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    tagline: {
      en: 'Config, Models & System Rules',
      vi: 'Cấu hình, model & luật hệ thống',
    },
    whatIs: {
      en: 'Config files & rules loaded at startup (.cursorrules, JSON, YAML).',
      vi: 'File cấu hình nạp lúc khởi động (.cursorrules, JSON, YAML).',
    },
    example: {
      en: 'Default model choice (Claude 3.5/Gemini 2.5), token limits, protected files.',
      vi: 'Chọn model mặc định, giới hạn token, bảo vệ cấm sửa file .env.',
    },
    bestFor: {
      en: 'Setting boundaries, picking models, and project-wide conventions.',
      vi: 'Đặt ranh giới an toàn, chọn model và luật chơi cho toàn dự án.',
    },
  },
  {
    key: 'hooks',
    label: 'Hooks',
    icon: Link2,
    count: '63',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    tagline: {
      en: 'Automated Lifecycle Triggers',
      vi: 'Bẫy sự kiện tự động (Pre/Post)',
    },
    whatIs: {
      en: 'Scripts executed automatically before or after an AI action.',
      vi: 'Kịch bản tự động kích hoạt trước hoặc sau khi AI thực hiện hành động.',
    },
    example: {
      en: 'Pre-tool: Block dangerous commands (rm -rf). Post-write: Auto-run prettier.',
      vi: 'Pre-tool: Chặn lệnh nguy hiểm (rm -rf). Post-write: Tự format prettier sau khi sửa.',
    },
    bestFor: {
      en: 'Safety guardrails and background code auto-formatting.',
      vi: 'Tự động kiểm soát an toàn và làm đẹp code ngầm.',
    },
  },
  {
    key: 'mcps',
    label: 'MCPs',
    icon: CloudDownload,
    count: '107',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    tagline: {
      en: 'External Server Connectors',
      vi: 'Cáp nối máy chủ ra bên ngoài',
    },
    whatIs: {
      en: 'Backend servers exposing technical tools via Model Context Protocol.',
      vi: 'Máy chủ cung cấp công cụ kỹ thuật qua giao thức Model Context Protocol.',
    },
    example: {
      en: 'PostgreSQL DB query runner, Chrome Puppeteer browser automation, Slack.',
      vi: 'Kết nối Postgres chạy SELECT, Puppeteer mở Chrome test web, Slack/Discord.',
    },
    bestFor: {
      en: 'Letting AI query databases, control browsers, or call third-party APIs.',
      vi: 'Cho phép AI truy vấn database, điều khiển trình duyệt hoặc gọi API ngoài.',
    },
  },
  {
    key: 'mods',
    label: 'Mods',
    icon: Code2,
    count: '44',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
    tagline: {
      en: 'UI Tweaks & CLI Enhancements',
      vi: 'Độ giao diện & tính năng công cụ',
    },
    whatIs: {
      en: 'Modifications directly altering developer tool UI/UX and audio feedback.',
      vi: 'Bản chỉnh sửa giao diện, hiệu ứng âm thanh và trải nghiệm của terminal/IDE.',
    },
    example: {
      en: 'Sound chimes on task complete, sleek progress bars, custom terminal themes.',
      vi: 'Âm thanh thông báo khi xong việc, thanh loading hiệu ứng, theme giao diện.',
    },
    bestFor: {
      en: 'Customizing workflow aesthetics and pleasant sensory feedback.',
      vi: 'Tùy biến phong cách làm việc và trải nghiệm cá nhân.',
    },
  },
  {
    key: 'plugins',
    label: 'Plugins',
    icon: Package,
    count: 'Bundle',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
    tagline: {
      en: 'All-in-One Curated Bundles',
      vi: 'Gói trọn gói All-in-One',
    },
    whatIs: {
      en: 'Pre-packaged combos installing Skills + MCPs + Commands in 1 click.',
      vi: 'Gói cài đặt 1 chạm kết hợp sẵn Skills + MCPs + Commands + Hooks.',
    },
    example: {
      en: '"Docker Pro": includes Docker MCP + Dockerfile skill + /docker-build command.',
      vi: 'Plugin "Docker Pro": gồm MCP Docker daemon + Skill Dockerfile + Command /docker-build.',
    },
    bestFor: {
      en: 'One-click full setup for an entire tech stack or workflow.',
      vi: 'Cài trọn vẹn giải pháp cho 1 công nghệ mà không cần cấu hình lắt nhắt.',
    },
  },
];

export function ComponentGuideModal({ isOpen, onClose, onSelectType }) {
  const [lang, setLang] = useState('en'); // default 'en', togglable to 'vi'

  if (!isOpen) return null;

  const t = {
    title: lang === 'vi' ? 'Hướng Dẫn Thành Phần' : 'Components Guide',
    sub:
      lang === 'vi'
        ? 'Chọn đúng loại công cụ để tối ưu hiệu suất làm việc cùng AI Agent.'
        : 'Choose the right component to maximize your AI Agent workflow.',
    close: lang === 'vi' ? 'Đóng' : 'Close',
    viewCat: lang === 'vi' ? 'Xem mục' : 'Explore',
    what: lang === 'vi' ? 'Là gì' : 'What is it',
    example: lang === 'vi' ? 'Ví dụ' : 'Example',
    best: lang === 'vi' ? 'Phù hợp' : 'Best for',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl bg-[#0e1422] border border-[#1c2536] shadow-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#1c2536] flex items-center justify-between bg-[#0b0f17]/80">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{t.title}</span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">{t.sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lang switch */}
            <div className="flex items-center bg-[#111624] border border-[#1c2536] rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang('vi')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  lang === 'vi'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Compact Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMPONENT_GUIDE.map((comp) => {
              const Icon = comp.icon;
              return (
                <div
                  key={comp.key}
                  className="rounded-xl border border-[#1c2536] bg-[#111624] p-3.5 hover:border-slate-700 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    {/* Header item */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`p-1.5 rounded-lg border shrink-0 ${comp.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                            <span className="truncate">{comp.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400 border border-slate-800">
                              {comp.count}
                            </span>
                          </h3>
                          <div className="text-[11px] text-blue-400 font-medium truncate">
                            {comp.tagline[lang]}
                          </div>
                        </div>
                      </div>

                      {onSelectType && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectType(comp.key);
                            onClose();
                          }}
                          className="px-2 py-0.8 rounded-md bg-blue-600/10 hover:bg-blue-600 text-blue-300 hover:text-white text-[11px] font-medium border border-blue-500/20 transition-all cursor-pointer shrink-0"
                        >
                          {t.viewCat} &rarr;
                        </button>
                      )}
                    </div>

                    {/* Concise description */}
                    <p className="text-xs text-slate-300 leading-relaxed">{comp.whatIs[lang]}</p>

                    <div className="rounded-lg bg-[#0b0f17] px-2.5 py-1.5 border border-[#1c2536]/70 text-[11px] text-slate-400">
                      <span className="text-amber-400/90 font-medium">{t.example}: </span>
                      <span className="text-slate-300">{comp.example[lang]}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#1c2536]/80 flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{comp.bestFor[lang]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#1c2536] bg-[#0b0f17] flex items-center justify-between text-xs text-slate-400">
          <span>Skillary &bull; AI Agent Components Registry</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
