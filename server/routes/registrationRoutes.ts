import { Router } from 'express';
import { appendAuditLog, loadDb, persistDb } from '../data/database';
import { createRateLimiter, validateUiReferenceUpload } from '../security/crypto';
import { notifyOnRegistrationSubmitted } from '../services/notificationService';
import type { CustomerRegistration } from '../../src/types/registration';

export const registrationRouter = Router();

const regRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  keyPrefix: 'reg',
});

registrationRouter.post('/', regRateLimiter, async (req, res) => {
  const body = req.body || {};

  const requiredStrings = [
    ['fullName', 'Full Name'],
    ['email', 'Email Address'],
    ['phone', 'Phone Number'],
    ['country', 'Country'],
    ['companyName', 'Company Name'],
    ['jobTitle', 'Job Title'],
    ['projectName', 'Project Name'],
    ['projectDescription', 'Project Description'],
  ];

  for (const [key, label] of requiredStrings) {
    if (!body[key] || typeof body[key] !== 'string' || !body[key].trim()) {
      return res.status(400).json({ error: `${label} is required.` });
    }
  }

  if (!Array.isArray(body.applicationTypes) || body.applicationTypes.length === 0) {
    return res.status(400).json({ error: 'Select at least one target application type.' });
  }

  if (!body.acceptedTerms || !body.acceptedPrivacy || !body.consentRegistrationNotifications) {
    return res.status(400).json({
      error: 'Acceptance of Terms of Service, Privacy Policy, and Registration Notifications consent is required.',
    });
  }

  const fileCheck = validateUiReferenceUpload(
    body.uiReferenceFileName,
    body.uiReferenceMimeType,
    body.uiReferenceBase64
  );
  if (!fileCheck.valid) {
    return res.status(400).json({ error: fileCheck.reason });
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const db = await loadDb();

  const existingActive = db.registrations.find(
    (r) => r.email.toLowerCase() === normalizedEmail && r.status !== 'Rejected'
  );
  if (existingActive) {
    return res.status(409).json({
      error: `A registration (${existingActive.id}) already exists for this email with status "${existingActive.status}".`,
      registrationId: existingActive.id,
      status: existingActive.status,
    });
  }

  const now = new Date().toISOString();
  const regId = `REG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`;

  const registration: CustomerRegistration = {
    id: regId,
    submissionDate: now,
    authProvider: body.authProvider === 'google' ? 'google' : 'email',
    fullName: body.fullName.trim(),
    email: normalizedEmail,
    phone: body.phone.trim(),
    country: body.country.trim(),
    companyName: body.companyName.trim(),
    companyWebsite: (body.companyWebsite || '').trim(),
    jobTitle: body.jobTitle.trim(),
    applicationTypes: body.applicationTypes,
    projectName: body.projectName.trim(),
    projectDescription: body.projectDescription.trim(),
    businessIndustry: (body.businessIndustry || 'Enterprise Software').trim(),
    expectedUsers: (body.expectedUsers || '100 - 500').trim(),
    requiredModules: Array.isArray(body.requiredModules) ? body.requiredModules : [],
    preferredBackendLanguage: body.preferredBackendLanguage || 'Python',
    preferredFrontendFramework: body.preferredFrontendFramework || 'React + TypeScript',
    preferredDatabase: body.preferredDatabase || 'PostgreSQL',
    expectedComplexity: body.expectedComplexity || 'Moderate',
    preferredDeployment: body.preferredDeployment || 'Docker / Cloud Run',
    themeOption: body.themeOption || 'Yes, use Aegion Glassmorphism themes',
    themeModePreference: body.themeModePreference || 'dark',
    selectedThemeId: body.selectedThemeId || 'hrms-aurora-hr',
    customAccentColor: body.customAccentColor || '#7C3AED',
    typographyPreference: body.typographyPreference || 'Manrope + Plus Jakarta Sans',
    uiReferenceFileName: fileCheck.sanitizedName,
    projectDeadline: (body.projectDeadline || '').trim(),
    additionalFeatures: (body.additionalFeatures || '').trim(),
    integrationRequirements: (body.integrationRequirements || '').trim(),
    additionalComments: (body.additionalComments || '').trim(),
    acceptedTerms: true,
    acceptedPrivacy: true,
    consentRegistrationNotifications: true,
    consentMarketing: Boolean(body.consentMarketing),
    status: 'Pending Approval',
    sheetsSynced: false,
  };

  db.registrations.unshift(registration);
  db.approvalHistory.unshift({
    id: `APR-${Math.floor(1000 + Math.random() * 9000)}`,
    registrationId: regId,
    email: normalizedEmail,
    previousStatus: 'Submitted',
    newStatus: 'Pending Approval',
    action: 'SUBMIT',
    adminId: 'system',
    timestamp: now,
    comments: 'Customer registration submitted and queued for Super Admin review.',
  });

  appendAuditLog(db, normalizedEmail, 'guest', 'SUBMIT_REGISTRATION', `${regId} (${registration.projectName})`, 'Allowed');
  await persistDb(db);

  // Fire Email + WhatsApp notifications in background-safe manner
  await notifyOnRegistrationSubmitted(registration);

  return res.status(201).json({
    registrationId: registration.id,
    status: registration.status,
    submissionDate: registration.submissionDate,
    projectName: registration.projectName,
    email: registration.email,
  });
});

registrationRouter.get('/status', async (req, res) => {
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  const id = typeof req.query.id === 'string' ? req.query.id.trim().toUpperCase() : '';

  if (!email && !id) {
    return res.status(400).json({ error: 'Provide an email address or registration ID.' });
  }

  const db = await loadDb();
  const reg = db.registrations.find(
    (r) => (email && r.email.toLowerCase() === email) || (id && r.id.toUpperCase() === id)
  );

  if (!reg) {
    return res.status(404).json({ error: 'No matching registration request found.' });
  }

  return res.json({
    registrationId: reg.id,
    projectName: reg.projectName,
    fullName: reg.fullName,
    status: reg.status,
    submissionDate: reg.submissionDate,
    approvalDate: reg.approvalDate,
    adminComments: reg.adminComments,
  });
});
