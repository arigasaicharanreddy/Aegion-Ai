import http from 'node:http';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { bootstrapSuperAdmin } from './server/security/bootstrap';
import { authRouter } from './server/routes/authRoutes';
import { registrationRouter } from './server/routes/registrationRoutes';
import { contactRouter } from './server/routes/contactRoutes';
import { adminRouter } from './server/routes/adminRoutes';
import { agentRouter } from './server/routes/agentRoutes';
import { webhookRouter } from './server/routes/webhookRoutes';

const envResult = dotenv.config();
if (envResult.parsed) {
  for (const [key, value] of Object.entries(envResult.parsed)) {
    if (value && value.trim()) {
      process.env[key] = value;
    }
  }
}

const PORT = Number(process.env.DEFAULT_APP_PORT || 3000);

async function startServer() {
  await bootstrapSuperAdmin();

  const app = express();
  const httpServer = http.createServer(app);
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
  app.use('/api/v1/contacts', contactRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/webhooks', webhookRouter);
  app.use('/api/v1', agentRouter);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Aegion AI frontend & modular API gateway listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Aegion AI server:', err);
  process.exit(1);
});
