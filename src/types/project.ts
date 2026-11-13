import { ThemeCategory, ThemeCustomization } from './theme';

export type AppCategory =
  | 'HRMS'
  | 'E-Commerce'
  | 'Multi-Store Management'
  | 'SaaS Applications'
  | 'Healthcare Store Management'
  | 'Custom Business Applications';

export type ProgrammingLanguage =
  | 'Python'
  | 'Java'
  | 'JavaScript'
  | 'TypeScript'
  | 'PHP'
  | 'Go'
  | 'C#'
  | 'Ruby'
  | 'Kotlin'
  | 'Swift'
  | 'Rust'
  | 'C++';

export interface GeneratedFile {
  path: string;
  language: string;
  content: string;
  summary: string;
}

export interface DatabaseTableSpec {
  name: string;
  columns: { name: string; type: string; constraints: string }[];
}

export interface ApiEndpointSpec {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  authRequired: boolean;
}

export interface ProjectVersion {
  id: string;
  version: string;
  createdAt: string;
  author: string;
  changeSummary: string;
  language: ProgrammingLanguage;
  framework: string;
  themeId: string;
  modules: string[];
  files: GeneratedFile[];
  status: 'approved' | 'rolled_back';
}

export interface ProjectMemory {
  specification: string;
  userRoles: string[];
  businessRules: string[];
  databaseSchema: DatabaseTableSpec[];
  apiDefinitions: ApiEndpointSpec[];
  acceptedChangeIds: string[];
  promptHistory: string[];
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  invitedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  themeCategory: ThemeCategory;
  language: ProgrammingLanguage;
  framework: string;
  frontendFramework: string;
  database: string;
  authMethod: string;
  version: string;
  status: 'Active' | 'Building' | 'Deployed' | 'Draft';
  themeId: string;
  themeCustomization?: ThemeCustomization;
  modules: string[];
  files: GeneratedFile[];
  memory: ProjectMemory;
  versions: ProjectVersion[];
  collaborators: Collaborator[];
  shareToken: string;
  shareEnabled: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: 'Architecture' | 'Code Generation' | 'Theme Engine' | 'Deployment' | 'Billing';
  priority: 'Standard' | 'High' | 'Urgent';
  status: 'Open' | 'In Review' | 'Resolved';
  message: string;
  userEmail: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  target: string;
  outcome: 'Allowed' | 'Denied';
}
