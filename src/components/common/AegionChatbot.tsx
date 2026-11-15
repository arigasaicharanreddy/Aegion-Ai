import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { apiClient, type AssistantProjectContext } from '../../services/apiClient';
import { useAegion } from '../../context/AegionContext';

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

const STARTER_PROMPTS = [
  'What does Aegion AI do?',
  'How do new users get workspace access?',
  'Which business applications can I build?',
];

export const AegionChatbot: React.FC = () => {
  const { user, activeProject } = useAegion();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am the Aegion AI Assistant. Ask me about our platform capabilities, industry solutions, customizable themes, or how to request workspace access.',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  const buildProjectContext = (): AssistantProjectContext | undefined => {
    if (!user || user.status !== 'active' || !activeProject) return undefined;
    return {
      name: activeProject.name,
      category: activeProject.category,
      language: activeProject.language,
      framework: activeProject.framework,
      modules: activeProject.modules,
      specification: activeProject.memory?.specification,
    };
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    const streamBotId = `bot-${Date.now()}`;

    const historyBeforeStream = [...messages.filter((m) => !m.isError), userMsg];
    setMessages([
      ...historyBeforeStream,
      {
        id: streamBotId,
        role: 'assistant',
        content: '',
      },
    ]);
    setInput('');
    setLastFailedPrompt(null);
    setSending(true);

    const projectContext = buildProjectContext();
    let streamedContent = '';

    try {
      await apiClient.streamAssistantChat(
        historyBeforeStream.map((m) => ({ role: m.role, content: m.content })),
        trimmed,
        {
          projectContext,
          onToken: (chunk) => {
            streamedContent += chunk;
            setMessages((prev) =>
              prev.map((m) => (m.id === streamBotId ? { ...m, content: streamedContent } : m))
            );
          },
        }
      );

      if (!streamedContent.trim()) {
        const fallbackRes = await apiClient.assistantChat(
          historyBeforeStream.map((m) => ({ role: m.role, content: m.content })),
          trimmed,
          projectContext
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === streamBotId ? { ...m, content: fallbackRes.reply } : m))
        );
      }
    } catch (err) {
      const errorText =
        err instanceof Error
          ? err.message
          : 'I could not reach the Gemini assistant service right now. Please try again shortly.';
      setLastFailedPrompt(trimmed);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamBotId
            ? {
                ...m,
                content: errorText,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <div
          role="dialog"
          aria-label="Aegion AI Assistant"
          className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[380px] h-[500px] max-h-[75vh] aegion-glass shadow-2xl border-[var(--aegion-platform-border-strong)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border-strong)] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[var(--aegion-platform-accent)]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--aegion-platform-text)] font-display truncate">
                  Aegion AI Assistant
                </div>
                <div className="text-[11px] text-[var(--aegion-platform-text-muted)] truncate">
                  {user?.status === 'active' && activeProject
                    ? `Context: ${activeProject.name}`
                    : 'Product guide & onboarding help'}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
              className="p-1.5 aegion-btn-shape text-[var(--aegion-platform-text-muted)] hover:text-[var(--aegion-platform-text)] hover:bg-[var(--aegion-platform-cement)] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--aegion-platform-surface-solid)]">
            {messages.map((msg) => {
              const isStreamingPlaceholder = sending && msg.role === 'assistant' && !msg.content;
              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[var(--aegion-platform-accent)] text-[var(--aegion-platform-accent-fg)]'
                        : msg.isError
                        ? 'bg-red-500/12 border border-red-500/35 text-red-500'
                        : 'bg-[var(--aegion-platform-cement)] border border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text)]'
                    }`}
                  >
                    {isStreamingPlaceholder ? (
                      <span className="inline-flex items-center gap-2 text-[var(--aegion-platform-text-muted)]">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--aegion-platform-accent)]" />
                        <span>Thinking...</span>
                      </span>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              );
            })}

            {lastFailedPrompt && !sending && (
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => sendMessage(lastFailedPrompt)}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 aegion-btn-shape bg-[var(--aegion-platform-cement)] hover:bg-[var(--aegion-platform-accent-soft)] border border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-secondary)] cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry last question</span>
                </button>
              </div>
            )}

            {messages.length <= 1 && !sending && (
              <div className="pt-2 space-y-1.5">
                <div className="text-[11px] text-[var(--aegion-platform-text-muted)]">Quick questions:</div>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="text-left text-[11px] px-2.5 py-1.5 aegion-btn-shape bg-[var(--aegion-platform-bg-alt)] hover:bg-[var(--aegion-platform-cement)] border border-[var(--aegion-platform-border)] text-[var(--aegion-platform-text-secondary)] hover:text-[var(--aegion-platform-text)] transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--aegion-platform-border)] bg-[var(--aegion-platform-bg-alt)] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Aegion AI..."
              className="flex-1 bg-[var(--aegion-platform-input-bg)] border border-[var(--aegion-platform-border)] aegion-btn-shape px-3 py-2 text-xs text-[var(--aegion-platform-text)] placeholder:text-[var(--aegion-platform-text-muted)] focus:outline-none focus:border-[var(--aegion-platform-accent)]"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send message"
              className="p-2 aegion-btn-shape bg-[var(--aegion-platform-accent)] hover:bg-[var(--aegion-platform-accent-hover)] disabled:opacity-50 text-[var(--aegion-platform-accent-fg)] transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close Aegion AI Assistant' : 'Open Aegion AI Assistant'}
        className="h-12 px-4 aegion-btn-shape aegion-btn-glow bg-[var(--aegion-platform-accent)] hover:bg-[var(--aegion-platform-accent-hover)] text-[var(--aegion-platform-accent-fg)] shadow-xl border border-[var(--aegion-platform-border-strong)] flex items-center gap-2 text-xs font-semibold transition-transform hover:scale-[1.02] cursor-pointer"
      >
        {open ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        <span>{open ? 'Close Chat' : 'Aegion AI Chat'}</span>
      </button>
    </div>
  );
};
