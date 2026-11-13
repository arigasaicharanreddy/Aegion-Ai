import { AppCategory, ProgrammingLanguage } from './project';
import { ThemeMode } from './theme';

export type RegistrationStatus =
  | 'Pending Approval'
  | 'Info Requested'
  | 'Approved'
  | 'Rejected'
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
  authProvider: 'email' | 'google';

  // Step 1: Personal Info
  fullName: string;
  email: string;
  phone: string;
  country: string;
  companyName: string;
  companyWebsite: string;
  jobTitle: string;

  // Step 2: Project Requirements
  applicationTypes: AppCategory[];

  // Step 3: Business Requirements
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
  themeModePreference: ThemeMode;
  selectedThemeId: string;
  customAccentColor: string;
  typographyPreference: string;
  uiReferenceFileName?: string;

  // Step 5: Additional Information
  projectDeadline: string;
  additionalFeatures: string;
  integrationRequirements: string;
  additionalComments: string;

  // Step 6: Consent
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  consentRegistrationNotifications: boolean;
  consentMarketing: boolean;

  // Approval State
  status: RegistrationStatus;
  approvalDate?: string;
  approvedBy?: string;
  adminComments?: string;
  sheetsSynced?: boolean;
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
  status: 'Sent' | 'Queued' | 'Skipped (Unconfigured)' | 'Failed';
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
  lastSheetsSyncAt?: string;
}
