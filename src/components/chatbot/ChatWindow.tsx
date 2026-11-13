import React, { useEffect, useRef, useState } from 'react';
import { useAegion } from '../../context/AegionContext';
import { streamAgentChat } from '../../services/chatService';
import { getThemeById } from '../../themes';
import { AgentExecutionStep, ChatAttachment, ChatMessage } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  onOpenThemePicker: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onOpenThemePicker }) => {
  const {
    activeProject,
    chatHistory,
    setProjectMessages,
    updateProjectCategory,
    updateProjectLanguage,
    applyProposalToProject,
    rejectProposal,
    notify,
  } = useAegion();

  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = chatHistory[activeProject.id] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming]);

  const handleSend = async (text: string, attachments: ChatAttachment[]) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      attachments,
    };

    const assistantId = `msg-${Date.now() + 1}`;
    const initialSteps: AgentExecutionStep[] = [
      { id: 'intent', label: 'Intent Agent', status: 'pending' },
      { id: 'requirement', label: 'Requirement Analysis Agent', status: 'pending' },
      { id: 'architect', label: 'Architect Agent', status: 'pending' },
      { id: 'uiux', label: 'UI/UX Agent', status: 'pending' },
      { id: 'database', label: 'Database Agent', status: 'pending' },
      { id: 'backend', label: 'Backend Agent', status: 'pending' },
      { id: 'frontend', label: 'Frontend Agent', status: 'pending' },
      { id: 'security', label: 'Security Agent', status: 'pending' },
      { id: 'testing', label: 'Testing Agent', status: 'pending' },
    ];

    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      agentSteps: initialSteps,
      isStreaming: true,
    };

    setProjectMessages(activeProject.id, (prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const theme = getThemeById(activeProject.themeId);

    try {
      await streamAgentChat({
        message: text,
        category: activeProject.category,
        language: activeProject.language,
        framework: activeProject.framework,
        themeId: theme.id,
        themeName: theme.name,
        projectMemory: activeProject.memory,
        attachments,
        onAgentStep: (stepUpdate) => {
          setProjectMessages(activeProject.id, (prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    agentSteps: (m.agentSteps || []).map((s) =>
                      s.id === stepUpdate.id ? { ...s, ...stepUpdate } : s
                    ),
                  }
                : m
            )
          );
        },
        onToken: (chunk) => {
          setProjectMessages(activeProject.id, (prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
        onProposal: (proposal) => {
          setProjectMessages(activeProject.id, (prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, proposal } : m))
          );
        },
        onDone: (meta) => {
          setProjectMessages(activeProject.id, (prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, isStreaming: false, modelUsed: meta.model || 'gemini-4-hydrogen' }
                : m
            )
          );
        },
        onError: (errorMessage) => {
          setProjectMessages(activeProject.id, (prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    isStreaming: false,
                    content:
                      m.content ||
                      `Unable to complete generation: ${errorMessage}`,
                  }
                : m
            )
          );
          notify(errorMessage, 'error');
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Streaming connection failed';
      notify(msg, 'error');
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
            <h3 className="text-lg font-semibold text-white font-display">
              {activeProject.name}
            </h3>
            <p className="text-sm text-[#9CA3AF] mt-2 leading-relaxed">
              Describe the modules, user roles, business rules, or target programming language.
              Aegion orchestrates architecture, database schemas, and tokenized Glass UI views.
            </p>
            <div className="mt-4 text-xs text-[#9CA3AF]">
              Active Stack: {activeProject.language} ({activeProject.framework}) · {activeProject.category}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onApproveProposal={(msgId, proposal) =>
                applyProposalToProject(activeProject.id, msgId, proposal)
              }
              onRejectProposal={(msgId) => rejectProposal(activeProject.id, msgId)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        category={activeProject.category}
        language={activeProject.language}
        themeId={activeProject.themeId}
        isStreaming={isStreaming}
        onCategoryChange={(cat) => updateProjectCategory(activeProject.id, cat)}
        onLanguageChange={(lang) => updateProjectLanguage(activeProject.id, lang)}
        onOpenThemePicker={onOpenThemePicker}
        onSend={handleSend}
      />
    </div>
  );
};
