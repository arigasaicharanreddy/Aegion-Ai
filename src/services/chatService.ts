import { AgentExecutionStep, ChangeProposal, ChatAttachment } from '../types/chat';
import { ProjectMemory } from '../types/project';
import { apiClient } from './apiClient';

export interface StreamChatParams {
  message: string;
  category: string;
  language: string;
  framework: string;
  themeId: string;
  themeName: string;
  projectMemory: ProjectMemory;
  attachments?: ChatAttachment[];
  onAgentStep: (step: AgentExecutionStep) => void;
  onToken: (text: string) => void;
  onProposal: (proposal: ChangeProposal) => void;
  onDone: (meta: { model?: string }) => void;
  onError: (message: string) => void;
}

export async function streamAgentChat(params: StreamChatParams): Promise<void> {
  let response: Response;
  try {
    response = await fetch(apiClient.getEndpoint('/api/v1/chat/stream'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...apiClient.getAuthHeaders(),
      },
      body: JSON.stringify({
        message: params.message,
        category: params.category,
        language: params.language,
        framework: params.framework,
        themeId: params.themeId,
        themeName: params.themeName,
        projectMemory: params.projectMemory,
        attachments: params.attachments || [],
      }),
    });
  } catch (err) {
    params.onError(err instanceof Error ? err.message : 'Unable to reach chat gateway.');
    return;
  }

  if (!response.ok || !response.body) {
    params.onError(`Chat gateway error (${response.status})`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const rawEvent of events) {
      const lines = rawEvent.split('\n');
      let eventType = 'message';
      let dataStr = '';
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataStr += line.slice(5).trim();
        }
      }
      if (!dataStr) continue;
      try {
        const payload = JSON.parse(dataStr);
        if (eventType === 'agent_step') {
          params.onAgentStep(payload);
        } else if (eventType === 'token') {
          params.onToken(payload.text || '');
        } else if (eventType === 'proposal') {
          params.onProposal(payload);
        } else if (eventType === 'done') {
          params.onDone(payload);
        } else if (eventType === 'error') {
          params.onError(payload.message || 'Unknown error');
        }
      } catch {
        // Ignore malformed SSE chunk
      }
    }
  }
}
