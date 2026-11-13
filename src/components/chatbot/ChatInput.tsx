import React, { useRef, useState } from 'react';
import { Send, Paperclip, Palette, X } from 'lucide-react';
import { AppCategory, ProgrammingLanguage } from '../../types/project';
import { ChatAttachment } from '../../types/chat';
import { APPLICATION_TEMPLATES, SUPPORTED_LANGUAGES } from '../../config/appConfig';
import { getThemeById } from '../../themes';

interface ChatInputProps {
  category: AppCategory;
  language: ProgrammingLanguage;
  themeId: string;
  isStreaming: boolean;
  onCategoryChange: (cat: AppCategory) => void;
  onLanguageChange: (lang: ProgrammingLanguage) => void;
  onOpenThemePicker: () => void;
  onSend: (text: string, attachments: ChatAttachment[]) => void;
}

const PROMPT_SUGGESTIONS = [
  'Build an HRMS application with employee management, attendance, payroll, and leave management. Use Java Spring Boot.',
  'Generate an E-Commerce storefront with inventory reservations and Stripe checkout in TypeScript NestJS.',
  'Create a Multi-Store POS sync service with regional pricing rules using Go Gin.',
  'Add RBAC audit logging and a PostgreSQL migration for role permissions.',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  category,
  language,
  themeId,
  isStreaming,
  onCategoryChange,
  onLanguageChange,
  onOpenThemePicker,
  onSend,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeTheme = getThemeById(themeId);

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const next: ChatAttachment[] = [];
    for (const f of files.slice(0, 3)) {
      const content = await f.text().catch(() => '');
      next.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: f.name,
        size: f.size,
        type: f.type || 'text/plain',
        excerpt: content.slice(0, 1200),
      });
    }
    setAttachments((prev) => [...prev, ...next]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isStreaming) return;
    onSend(text.trim(), attachments);
    setText('');
    setAttachments([]);
  };

  return (
    <div className="border-t border-white/10 bg-[#101116]/95 p-4 space-y-3">
      {/* Prompt suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PROMPT_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setText(s)}
            className="text-[11px] text-[#9CA3AF] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg px-2.5 py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            {s.length > 56 ? `${s.slice(0, 56)}…` : s}
          </button>
        ))}
      </div>

      {/* Config toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Application category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as AppCategory)}
          className="bg-[#181922] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#E5E7EB] focus:outline-none focus:border-[#8B5CF6]"
        >
          {APPLICATION_TEMPLATES.map((tpl) => (
            <option key={tpl.id} value={tpl.category}>
              {tpl.category}
            </option>
          ))}
        </select>

        <select
          aria-label="Backend programming language"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as ProgrammingLanguage)}
          className="bg-[#181922] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#E5E7EB] focus:outline-none focus:border-[#8B5CF6]"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.language} value={l.language}>
              {l.language} ({l.framework})
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onOpenThemePicker}
          className="inline-flex items-center gap-1.5 bg-[#181922] hover:bg-white/[0.08] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#E5E7EB] whitespace-nowrap cursor-pointer"
        >
          <Palette className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>{activeTheme.name}</span>
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <span
              key={att.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 text-xs text-[#E5E7EB]"
            >
              <Paperclip className="w-3 h-3 text-[#A78BFA]" />
              <span>{att.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                className="text-[#9CA3AF] hover:text-white cursor-pointer"
                aria-label="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".txt,.md,.json,.sql,.py,.java,.ts,.tsx,.go,.php,.cs,.rb,.yaml,.yml"
          onChange={handleFilePick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Attach specification, SQL schema, or reference file"
          className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#9CA3AF] hover:text-white cursor-pointer shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Describe your application, target language (e.g. Java Spring Boot, Python FastAPI, Go Gin), or UI change..."
          className="flex-1 resize-none bg-[#161720] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#8B5CF6]"
        />

        <button
          type="submit"
          disabled={!text.trim() || isStreaming}
          className="px-4 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-45 text-white text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>{isStreaming ? 'Generating' : 'Generate'}</span>
        </button>
      </form>
    </div>
  );
};
