import React from 'react';
import { Paperclip } from 'lucide-react';
import { ChangeProposal, ChatMessage } from '../../types/chat';
import { AgentProgress } from './AgentProgress';
import { ApprovalPanel } from './ApprovalPanel';

interface MessageBubbleProps {
  message: ChatMessage;
  onApproveProposal: (messageId: string, proposal: ChangeProposal) => void;
  onRejectProposal: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onApproveProposal,
  onRejectProposal,
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] mb-1.5">
        <span className="font-medium text-[#D1D5DB]">
          {isUser ? 'You' : 'Aegion Architect'}
        </span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {message.modelUsed && (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{message.modelUsed}</span>
          </>
        )}
      </div>

      <div
        className={`max-w-3xl w-full rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[#7C3AED]/18 border border-[#8B5CF6]/30 text-white'
            : 'bg-white/[0.04] border border-white/10 text-[#E5E7EB]'
        }`}
      >
        {message.agentSteps && message.agentSteps.length > 0 && (
          <div className="mb-3">
            <AgentProgress steps={message.agentSteps} />
          </div>
        )}

        <div className="whitespace-pre-wrap">{message.content}</div>

        {message.isStreaming && !message.content && (
          <span className="text-xs text-[#9CA3AF]">Orchestrating multi-agent code generation...</span>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-1.5 text-xs text-[#D1D5DB] bg-black/30 px-2.5 py-1 rounded-md border border-white/10"
              >
                <Paperclip className="w-3 h-3 text-[#A78BFA]" />
                <span>{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {message.proposal && (
          <ApprovalPanel
            proposal={message.proposal}
            onApprove={() => onApproveProposal(message.id, message.proposal!)}
            onReject={() => onRejectProposal(message.id)}
          />
        )}
      </div>
    </div>
  );
};
