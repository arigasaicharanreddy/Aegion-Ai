import { Router } from 'express';
import { loadDb, persistDb } from '../data/database';
import { verifyHmacSha256Signature } from '../security/crypto';

export const webhookRouter = Router();

webhookRouter.get('/whatsapp', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const db = await loadDb();
  const verifyToken = db.whatsappSecrets.webhookVerifyToken || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';

  if (mode === 'subscribe' && verifyToken && token === verifyToken) {
    return res.status(200).send(String(challenge || ''));
  }
  return res.status(403).json({ error: 'Webhook verification failed.' });
});

webhookRouter.post('/whatsapp', async (req, res) => {
  const db = await loadDb();
  const appSecret = db.whatsappSecrets.appSecret || process.env.WHATSAPP_APP_SECRET || '';
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const rawBody = (req as { rawBody?: Buffer }).rawBody || JSON.stringify(req.body || {});

  if (appSecret && !verifyHmacSha256Signature(rawBody, signature, appSecret)) {
    return res.status(403).json({ error: 'Invalid webhook HMAC signature.' });
  }

  const statuses = req.body?.entry?.[0]?.changes?.[0]?.value?.statuses;
  if (Array.isArray(statuses)) {
    for (const s of statuses) {
      if (s.status === 'failed' || s.status === 'delivered') {
        db.notificationLogs.unshift({
          id: `NTF-WH-${Math.floor(1000 + Math.random() * 9000)}`,
          registrationId: 'WEBHOOK',
          channel: 'WhatsApp',
          recipient: String(s.recipient_id || 'unknown'),
          template: 'Webhook Status Update',
          status: s.status === 'failed' ? 'Failed' : 'Sent',
          sentTimestamp: new Date().toISOString(),
          failureReason: s.errors?.[0]?.title,
        });
      }
    }
    await persistDb(db);
  }

  return res.json({ received: true });
});
