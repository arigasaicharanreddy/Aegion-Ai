import type { AppCategory, ProgrammingLanguage } from './project';

export type RegistrationStatus =
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Info Requested'
  | 'Suspended';

export type ThemePreferenceOption =
  | 'Yes, use Aegion Glassmorphism themes'
  | 'Yes, use another Aegion theme'
  | 'I want to customize my theme'
  | 'I want the AI to design a custom UI'
  | 'I have an existing UI reference';

export interface CustomerRegistration {
  id: string;
  submissionDate: string;
  authProvider: 'google' | 'email';

  // Step 1: Personal & Organization Info
  fullName: string;
  email: string;
  phone: string;
  country: string;
  companyName: string;
  companyWebsite: string;
  jobTitle: string;

  // Step 2: Application Types
  applicationTypes: AppCategory[];

  // Step 3: Business & Stack Requirements
  projectName: string;
  projectDescription: string;
  businessIndustry: string;
  expectedUsers: string;
  requiredModules: string[];
  preferredBackendLanguage: ProgrammingLanguage;
  preferredFrontendFramework: string;
  preferredDatabase: string;
  expectedComplexity: 'Standard' | 'Moderate' | 'Enterprise Multi-Tenant';
  preferredDeployment: string;

  // Step 4: UI/UX Preferences
  themeOption: ThemePreferenceOption;
  themeModePreference: 'light' | 'dark';
  selectedThemeId: string;
  customAccentColor: string;
  typographyPreference: string;
  uiReferenceFileName?: string;

  // Step 5: Additional Info
  projectDeadline: string;
  additionalFeatures: string;
  integrationRequirements: string;
  additionalComments: string;

  // Step 6: Legal & Consent
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  consentRegistrationNotifications: boolean;
  consentMarketing: boolean;

  // Admin & Sync Metadata
  status: RegistrationStatus;
  accountStatus?: string;
  approvalDate?: string;
  approvedBy?: string;
  adminComments?: string;
  sheetsSynced: boolean;
  sheetsSyncError?: string;
}

export interface ApprovalHistoryRecord {
  id: string;
  registrationId: string;
  email: string;
  previousStatus: RegistrationStatus | 'Submitted';
  newStatus: RegistrationStatus;
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND' | 'REACTIVATE' | 'ACTIVATE';
  adminId: string;
  timestamp: string;
  comments: string;
}

export interface NotificationLogRecord {
  id: string;
  registrationId: string;
  channel: 'Email' | 'WhatsApp' | 'System';
  recipient: string;
  template: string;
  status: 'Sent' | 'Queued' | 'Failed' | 'Skipped (Unconfigured)';
  sentTimestamp: string;
  failureReason?: string;
}

export interface NotificationChannelConfig {
  emailProvider: 'Gmail API' | 'SMTP' | 'Resend' | 'SendGrid' | 'Amazon SES';
  senderEmail: string;
  senderName: string;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappBusinessAccountId: string;
  whatsappPhoneNumberId: string;
  whatsappAccessTokenConfigured: boolean;
  whatsappWebhookVerifyTokenConfigured: boolean;
  notifyAdminOnNewRegistration: boolean;
  notifyUserOnReceived: boolean;
  notifyUserOnApproval: boolean;
  sheetsSpreadsheetId: string;
  sheetsSpreadsheetUrl: string;
  contactSpreadsheetId?: string;
  contactSpreadsheetUrl?: string;
  lastSheetsSyncAt?: string;
}

export type ContactCategory =
  | 'General Inquiry'
  | 'Business Partnership'
  | 'Product Information'
  | 'Technical Support'
  | 'Workspace Access'
  | 'Other';

export type ContactInquiryStatus = 'New' | 'In Review' | 'Resolved';

export interface ContactInquiry {
  id: string;
  submittedAt: string;
  fullName: string;
  email: string;
  company: string;
  phone?: string;
  subject: string;
  category: ContactCategory;
  message: string;
  status: ContactInquiryStatus;
  adminNotes: string;
  responseDate?: string;
  emailNotificationStatus: 'Sent' | 'Queued' | 'Failed' | 'Skipped (Unconfigured)';
  sheetsSynced: boolean;
}
