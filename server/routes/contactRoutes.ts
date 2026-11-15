import { Router } from 'express';
import { appendAuditLog, getActiveSuperAdminEmail, loadDb, persistDb } from '../data/database';
import { createRateLimiter } from '../security/crypto';
import { dispatchEmailNotification } from '../services/notificationService';
import type { ContactCategory, ContactInquiry } from '../../src/types/registration';

export const contactRouter = Router();

const contactRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 8,
  keyPrefix: 'contact',
});

const ALLOWED_CATEGORIES = new Set<ContactCategory>([
  'General Inquiry',
  'Business Partnership',
  'Product Information',
  'Technical Support',
  'Workspace Access',
  'Other',
]);

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const CONTACT_CONFIRMATION_MESSAGE =
  'Thank you for contacting Aegion AI. Your inquiry has been received. Our team will review your message and respond if further information is required.';

contactRouter.post('/', contactRateLimiter, async (req, res) => {
  const body = req.body || {};

  // Spam protection: reject silent bot submissions filling hidden honeypot field
  if (typeof body.website_hp === 'string' && body.website_hp.trim().length > 0) {
    return res.status(400).json({ error: 'Invalid form submission detected.' });
  }

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const company = typeof body.company === 'string' ? body.company.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const rawCategory = typeof body.category === 'string' ? body.category.trim() : 'General Inquiry';
  const category: ContactCategory = ALLOWED_CATEGORIES.has(rawCategory as ContactCategory)
    ? (rawCategory as ContactCategory)
    : 'General Inquiry';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!fullName || fullName.length < 2) {
    return res.status(400).json({ error: 'Full Name is required.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid Business Email address is required.' });
  }
  if (!company) {
    return res.status(400).json({ error: 'Company Name is required.' });
  }
  if (!subject || subject.length < 3) {
    return res.status(400).json({ error: 'Subject is required.' });
  }
  if (!message || message.length < 10) {
    return res.status(400).json({ error: 'Please include a message (at least 10 characters).' });
  }

  const now = new Date().toISOString();
  const inquiryId = `INQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`;

  const inquiry: ContactInquiry = {
    id: inquiryId,
    submittedAt: now,
    fullName,
    email,
    company,
    phone: phone || undefined,
    subject,
    category,
    message,
    status: 'New',
    adminNotes: '',
    emailNotificationStatus: 'Skipped (Unconfigured)',
    sheetsSynced: false,
  };

  const db = await loadDb();
  const adminEmail = getActiveSuperAdminEmail(db);
  db.contactInquiries.unshift(inquiry);
  appendAuditLog(db, email, 'guest', 'SUBMIT_CONTACT_INQUIRY', `${inquiryId} (${category}: ${subject})`, 'Allowed');
  await persistDb(db);

  // Notify Super Admin
  const adminEmailStatus = await dispatchEmailNotification({
    registrationId: inquiryId,
    recipient: adminEmail,
    template: 'Contact Inquiry Received',
    subject: `[Aegion AI Contact] ${category}: ${subject} (${inquiryId})`,
    htmlBody: `
      <h3>New Contact Inquiry Received</h3>
      <p><strong>Inquiry ID:</strong> ${inquiryId}</p>
      <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
      <p><strong>Business Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(company)}</p>
      <p><strong>Category:</strong> ${escapeHtml(category)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message)}</p>
    `,
  });

  // Send acknowledgment email to submitter
  await dispatchEmailNotification({
    registrationId: inquiryId,
    recipient: email,
    template: 'Contact Inquiry Acknowledgment',
    subject: `Aegion AI — We Received Your Inquiry (${inquiryId})`,
    htmlBody: `
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>${CONTACT_CONFIRMATION_MESSAGE}</p>
      <p><strong>Reference ID:</strong> ${inquiryId}<br/><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    `,
  });

  const latestDb = await loadDb();
  const saved = latestDb.contactInquiries.find((c) => c.id === inquiryId);
  if (saved) {
    saved.emailNotificationStatus = adminEmailStatus;
    await persistDb(latestDb);
  }

  return res.status(201).json({
    ok: true,
    inquiryId,
    message: CONTACT_CONFIRMATION_MESSAGE,
    emailNotificationStatus: adminEmailStatus,
  });
});
