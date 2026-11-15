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
    <div className="border-t border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] p-4 space-y-3">
      {/* Prompt suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PROMPT_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setText(s)}
            className="text-[11px] text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] bg-[var(--aegion-platform-surface-solid)] hover:bg-[var(--aegion-platform-cement)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-2.5 py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
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
          className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-2.5 py-1.5 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
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
          className="bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-2.5 py-1.5 text-xs text-[var(--aegion-platform-text)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
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
          className="inline-flex items-center gap-1.5 bg-[var(--aegion-platform-input-bg)] hover:bg-[var(--aegion-platform-cement)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-2.5 py-1.5 text-xs text-[var(--aegion-platform-text)] whitespace-nowrap cursor-pointer transition-colors"
        >
          <Palette className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
          <span>{activeTheme.name}</span>
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <span
              key={att.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--aegion-platform-cement)] border border-[var(--aegion-platform-border)] text-xs text-[var(--aegion-platform-text)]"
            >
              <Paperclip className="w-3 h-3 text-[var(--aegion-platform-accent)]" />
              <span>{att.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                className="text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer"
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
          className="p-2.5 aegion-btn-shape bg-[var(--aegion-platform-surface-solid)] hover:bg-[var(--aegion-platform-cement)] border border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] cursor-pointer shrink-0 transition-colors"
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
          className="flex-1 resize-none bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3.5 py-2.5 text-sm text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
        />

        <button
          type="submit"
          disabled={!text.trim() || isStreaming}
          className="px-4 py-2.5 aegion-btn-shape aegion-btn-glow bg-[var(--aegion-platform-accent)] hover:bg-[var(--aegion-platform-accent-hover)] disabled:opacity-45 text-[var(--aegion-platform-accent-fg)] text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>{isStreaming ? 'Generating' : 'Generate'}</span>
        </button>
      </form>
    </div>
  );
};
