import { AppCategory, ProgrammingLanguage } from './project';

export type PromptLayer =
  | 'Platform Core Prompts'
  | 'Security Prompts'
  | 'Application Template Prompts'
  | 'Module Prompts'
  | 'Language Prompts'
  | 'Project Prompts'
  | 'Change Prompts'
  | 'Testing Prompts'
  | 'Deployment Prompts';

export type PromptStatus = 'Approved' | 'Draft' | 'Pending Review' | 'Archived';

export interface PromptApprovalRecord {
  version: string;
  approvedBy: string;
  approvedAt: string;
  note: string;
}

export interface PromptEntry {
  id: string;
  name: string;
  layer: PromptLayer;
  language: ProgrammingLanguage | 'All';
  applicationType: AppCategory | 'All';
  module: string;
  version: string;
  previousVersion?: string;
  status: PromptStatus;
  protected: boolean;
  author: string;
  changeDescription: string;
  content: string;
  previousContent?: string;
  approvalHistory: PromptApprovalRecord[];
  updatedAt: string;
}
