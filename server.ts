import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { bootstrapSuperAdmin } from './server/security/bootstrap';
import { authRouter } from './server/routes/authRoutes';
import { registrationRouter } from './server/routes/registrationRoutes';
import { adminRouter } from './server/routes/adminRoutes';
import { agentRouter } from './server/routes/agentRoutes';
import { webhookRouter } from './server/routes/webhookRoutes';

dotenv.config();

const PORT = 3000;

async function startServer() {
  await bootstrapSuperAdmin();

  const app = express();
  app.set('trust proxy', 1);

  app.use(
    express.json({
      limit: '8mb',
      verify: (req, _res, buf) => {
        (req as { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );

  // Modular API Routers
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/registrations', registrationRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/webhooks', webhookRouter);
  app.use('/api/v1', agentRouter);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aegion AI frontend & modular API gateway listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
