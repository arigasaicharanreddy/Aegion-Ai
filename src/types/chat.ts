import { ApiEndpointSpec, AppCategory, DatabaseTableSpec, GeneratedFile, ProgrammingLanguage } from './project';

export type AgentNodeId =
  | 'intent'
  | 'requirement'
  | 'architect'
  | 'uiux'
  | 'database'
  | 'backend'
  | 'frontend'
  | 'security'
  | 'testing'
  | 'update'
  | 'export';

export interface AgentExecutionStep {
  id: AgentNodeId;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  detail?: string;
}

export interface ChangeProposal {
  id: string;
  summary: string;
  detectedCategory: AppCategory;
  detectedLanguage: ProgrammingLanguage;
  detectedFramework: string;
  detectedFrontend: string;
  database: string;
  authMethod: string;
  recommendedThemeId: string;
  modules: string[];
  businessRules: string[];
  userRoles: string[];
  databaseSchema: DatabaseTableSpec[];
  apiDefinitions: ApiEndpointSpec[];
  files: GeneratedFile[];
  securityChecklist: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  agentSteps?: AgentExecutionStep[];
  proposal?: ChangeProposal;
  isStreaming?: boolean;
  modelUsed?: string;
}
