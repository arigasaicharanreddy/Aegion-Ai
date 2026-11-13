import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { GoogleGenAI, Type } from '@google/genai';
import { loadDb, persistDb } from '../data/database';
import {
  requireApprovedBuilder,
  resolveSessionUser,
  type AuthenticatedRequest,
} from '../middleware/auth';

export const agentRouter = Router();

const PYTHON_API_URL = process.env.AEGION_PYTHON_API_URL?.trim() || '';

function createAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

async function collectBackendScaffold(dir: string, baseDir: string): Promise<{ path: string; content: string }[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: { path: string; content: string }[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectBackendScaffold(fullPath, baseDir)));
    } else {
      const content = await fs.readFile(fullPath, 'utf-8');
      results.push({
        path: path.relative(baseDir, fullPath).replace(/\\/g, '/'),
        content,
      });
    }
  }
  return results;
}

function isFreeDevMode(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.AEGION_FREE_DEV_MODE !== 'false';
}

agentRouter.get('/health', async (_req, res) => {
  res.json({
    status: 'ok',
    frontendRuntime: 'react-vite',
    gatewayRuntime: 'node-express',
    freeDevMode: isFreeDevMode(),
    pythonBackendConfigured: Boolean(PYTHON_API_URL),
    pythonBackendUrl: PYTHON_API_URL || null,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    aiModel: process.env.GEMINI_API_KEY?.trim() ? 'gemini-4-hydrogen' : 'free-dev-mock-orchestrator',
    timestamp: new Date().toISOString(),
  });
});

agentRouter.get('/runtime/mode', async (_req, res) => {
  const db = await loadDb();
  const emailConfigured = Boolean(
    db.emailSecrets.smtpHost ||
      db.emailSecrets.resendApiKey ||
      db.emailSecrets.sendgridApiKey ||
      process.env.SMTP_HOST ||
      process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY
  );
  const whatsappConfigured = Boolean(
    (db.whatsappSecrets.accessToken || process.env.WHATSAPP_ACCESS_TOKEN) &&
      (db.notificationConfig.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID)
  );
  res.json({
    freeDevMode: isFreeDevMode(),
    nodeEnv: process.env.NODE_ENV || 'development',
    pythonBackendConfigured: Boolean(PYTHON_API_URL),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    emailConfigured,
    whatsappConfigured,
    superAdminSecretProvided: Boolean(process.env.AEGION_SUPER_ADMIN_INITIAL_PASSWORD?.trim()),
  });
});

agentRouter.get('/python-scaffold', requireApprovedBuilder, async (_req, res) => {
  try {
    const scaffoldDir = path.resolve(process.cwd(), 'aegion-backend');
    const files = await collectBackendScaffold(scaffoldDir, process.cwd());
    res.json({ files });
  } catch {
    res.status(500).json({ error: 'Unable to read aegion-backend scaffold directory' });
  }
});

agentRouter.post('/prompts/authorize', async (req, res) => {
  const { user } = await resolveSessionUser(req);
  const role = user?.role || 'guest';
  const { action, layer, isProtected } = req.body || {};

  if (!user || user.status !== 'active') {
    return res.status(401).json({
      allowed: false,
      reason: 'Authenticated and approved account required.',
    });
  }

  const protectedLayer =
    isProtected === true ||
    layer === 'Platform Core Prompts' ||
    layer === 'Security Prompts';

  if (protectedLayer && role !== 'super_admin') {
    return res.status(403).json({
      allowed: false,
      reason: 'Protected Platform Core and Security prompts require super_admin privileges.',
    });
  }

  if ((action === 'approve' || action === 'delete') && role !== 'super_admin') {
    return res.status(403).json({
      allowed: false,
      reason: 'Only super_admin can approve or archive prompt registry versions.',
    });
  }

  return res.json({ allowed: true, role });
});

agentRouter.post('/chat/stream', requireApprovedBuilder, async (req: AuthenticatedRequest, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      message,
      category = 'HRMS',
      language = 'Python',
      framework = 'FastAPI',
      themeId = 'hrms-aurora-hr',
      themeName = 'Aurora HR',
      projectMemory = {},
      attachments = [],
    } = req.body || {};

    if (!message || typeof message !== 'string') {
      sendEvent('error', { message: 'Message prompt is required.' });
      return res.end();
    }

    if (PYTHON_API_URL) {
      try {
        const upstream = await fetch(`${PYTHON_API_URL.replace(/\/$/, '')}/api/v1/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        if (upstream.ok && upstream.body) {
          const reader = upstream.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(decoder.decode(value));
          }
          return res.end();
        }
      } catch {
        // Fall through to gateway AI SDK
      }
    }

    const ai = createAiClient();
    if (!ai) {
      if (isFreeDevMode()) {
        const mockSteps = [
          { id: 'intent', detail: `Resolving target language (${language}) & domain (${category})` },
          { id: 'requirement', detail: 'Extracting modules, roles, and business rules' },
          { id: 'architect', detail: 'Selecting layered prompt packs and Project Memory context' },
          { id: 'uiux', detail: `Binding decoupled Glass UI tokens (${themeName})` },
          { id: 'database', detail: 'Designing PostgreSQL normalized tables & constraints' },
          { id: 'backend', detail: `Synthesizing ${language} / ${framework} controllers & services` },
          { id: 'frontend', detail: 'Generating tokenized React + TypeScript views' },
          { id: 'security', detail: 'Validating JWT/RBAC, tenant isolation & input guards' },
          { id: 'testing', detail: 'Generating contract and RBAC integration tests' },
        ];
        for (const s of mockSteps) {
          sendEvent('agent_step', { id: s.id, status: 'running', detail: s.detail });
          sendEvent('agent_step', { id: s.id, status: 'completed', detail: s.detail });
        }

        const reply = `Synthesized ${category} application architecture in ${language} (${framework}) bound to decoupled Glass UI theme "${themeName}" (Free Dev Mode deterministic generator — add GEMINI_API_KEY on the server for live Gemini synthesis).`;
        for (const word of reply.split(/(\s+)/)) {
          sendEvent('token', { text: word });
        }

        sendEvent('proposal', {
          id: `prop-dev-${Date.now()}`,
          summary: `${category} architecture update (${language} / ${framework})`,
          detectedCategory: category,
          detectedLanguage: language,
          detectedFramework: framework,
          detectedFrontend: 'React + TypeScript',
          database: 'PostgreSQL',
          authMethod: 'JWT + RBAC',
          recommendedThemeId: themeId,
          modules: ['Auth & RBAC', 'Core Domain Service', 'Audit Ledger', 'Decoupled Glass UI'],
          userRoles: ['super_admin', 'workspace_admin', 'standard_user'],
          businessRules: [
            'Enforce tenant isolation and RBAC verification on every mutating endpoint.',
            'Keep UI appearance strictly bound to CSS custom properties independent of backend logic.',
          ],
          databaseSchema: [
            {
              name: 'workspace_records',
              columns: [
                { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY' },
                { name: 'tenant_id', type: 'UUID', constraints: 'NOT NULL, INDEX' },
                { name: 'title', type: 'VARCHAR(160)', constraints: 'NOT NULL' },
                { name: 'status', type: 'VARCHAR(32)', constraints: 'NOT NULL DEFAULT active' },
              ],
            },
          ],
          apiDefinitions: [
            { method: 'GET', path: '/api/v1/records', summary: 'List tenant-scoped records', authRequired: true },
            { method: 'POST', path: '/api/v1/records', summary: 'Create validated domain record', authRequired: true },
          ],
          files: [
            {
              path: `backend/main.${language === 'Python' ? 'py' : language === 'Go' ? 'go' : 'ts'}`,
              language,
              summary: `Entry router for ${category} (${framework})`,
              content: `// Generated in Free Dev Mode for ${category} (${language} / ${framework})\n// Request: ${message.slice(0, 140)}\nexport const serviceSpec = {\n  category: "${category}",\n  language: "${language}",\n  framework: "${framework}",\n  themeId: "${themeId}",\n};\n`,
            },
            {
              path: 'database/001_schema.sql',
              language: 'SQL',
              summary: 'Normalized PostgreSQL table migration',
              content:
                'CREATE TABLE IF NOT EXISTS workspace_records (\n  id UUID PRIMARY KEY,\n  tenant_id UUID NOT NULL,\n  title VARCHAR(160) NOT NULL,\n  status VARCHAR(32) NOT NULL DEFAULT \'active\',\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n',
            },
            {
              path: 'frontend/ThemeTokenSurface.tsx',
              language: 'TypeScript',
              summary: 'Decoupled CSS variable UI container',
              content:
                'export function ThemeTokenSurface({ title }: { title: string }) {\n  return (\n    <section style={{ background: "var(--app-surface)", borderColor: "var(--app-border)", color: "var(--app-text)" }}>\n      <h2>{title}</h2>\n    </section>\n  );\n}\n',
            },
          ],
          securityChecklist: [
            'Server-side RBAC enforcement on all admin and export endpoints',
            'Zero hardcoded credentials or theme hex tokens in domain services',
          ],
          status: 'pending',
        });

        sendEvent('done', { model: 'free-dev-mock-orchestrator' });
        return res.end();
      }

      sendEvent('error', {
        message:
          'GEMINI_API_KEY is not configured in environment secrets. Add it in Settings > Secrets to run live agentic generation.',
      });
      return res.end();
    }

    const agentPipeline = [
      { id: 'intent', label: 'Intent Agent', detail: `Resolving target language (${language}) & domain (${category})` },
      { id: 'requirement', label: 'Requirement Analysis Agent', detail: 'Extracting modules, roles, and business rules' },
      { id: 'architect', label: 'Architect Agent', detail: 'Selecting layered prompt packs and Project Memory context' },
      { id: 'uiux', label: 'UI/UX Agent', detail: `Binding decoupled Glass UI tokens (${themeName})` },
      { id: 'database', label: 'Database Agent', detail: 'Designing PostgreSQL normalized tables & constraints' },
      { id: 'backend', label: 'Backend Agent', detail: `Synthesizing ${language} / ${framework} controllers & services` },
      { id: 'frontend', label: 'Frontend Agent', detail: 'Generating tokenized React / Vue views' },
      { id: 'security', label: 'Security Agent', detail: 'Validating JWT/RBAC, tenant isolation & input guards' },
      { id: 'testing', label: 'Testing Agent', detail: 'Generating contract and RBAC integration tests' },
    ];

    sendEvent('agent_step', { id: 'intent', status: 'running', detail: agentPipeline[0].detail });
    sendEvent('agent_step', { id: 'intent', status: 'completed', detail: agentPipeline[0].detail });
    sendEvent('agent_step', { id: 'requirement', status: 'running', detail: agentPipeline[1].detail });
    sendEvent('agent_step', { id: 'requirement', status: 'completed', detail: agentPipeline[1].detail });
    sendEvent('agent_step', { id: 'architect', status: 'running', detail: agentPipeline[2].detail });

    const attachmentContext =
      Array.isArray(attachments) && attachments.length > 0
        ? `\nAttached context files:\n${attachments
            .map((a: { name: string; excerpt: string }) => `- ${a.name}: ${a.excerpt}`)
            .join('\n')}`
        : '';

    const systemInstruction = `You are Aegion AI's Agentic Full-Stack Application Architect & Multi-Language Code Generation Engine.
Aegion Platform itself runs on a Python FastAPI + LangGraph + RAG architecture, while the applications you generate can target ANY requested programming language (Python/FastAPI, Java/Spring Boot, JavaScript/Node.js, TypeScript/NestJS, PHP/Laravel, Go/Gin, C#/.NET, Ruby/Rails, Kotlin, Swift, Rust/Axum, C++).

CRITICAL RULES:
1. If the user's message explicitly specifies a backend programming language or framework, override the defaults and generate code in that exact language and framework.
2. If no language is specified in the prompt, use the workspace-selected language (${language} / ${framework}) or default to Python + FastAPI.
3. Keep the Glass UI theme decoupled as CSS design tokens (--app-bg, --app-surface, --app-accent). Never hardcode theme hex colors inside business logic or backend code.
4. Respect existing Project Memory when updating an application.
5. Produce concise, production-grade code files (3 to 5 realistic files covering backend controller/router, domain model/service, database SQL migration, and frontend tokenized component or test file).`;

    const userPrompt = `Current Workspace Context:
- Selected Category: ${category}
- Selected Language: ${language} (${framework})
- Selected Glass Theme: ${themeName} (${themeId})
- Existing Project Memory: ${JSON.stringify(projectMemory)}
${attachmentContext}

User Request:
${message}`;

    sendEvent('agent_step', { id: 'architect', status: 'completed', detail: agentPipeline[2].detail });
    sendEvent('agent_step', { id: 'uiux', status: 'running', detail: agentPipeline[3].detail });
    sendEvent('agent_step', { id: 'database', status: 'running', detail: agentPipeline[4].detail });
    sendEvent('agent_step', { id: 'backend', status: 'running', detail: agentPipeline[5].detail });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assistantReply: { type: Type.STRING },
            summary: { type: Type.STRING },
            detectedCategory: { type: Type.STRING },
            detectedLanguage: { type: Type.STRING },
            detectedFramework: { type: Type.STRING },
            detectedFrontend: { type: Type.STRING },
            database: { type: Type.STRING },
            authMethod: { type: Type.STRING },
            modules: { type: Type.ARRAY, items: { type: Type.STRING } },
            userRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            businessRules: { type: Type.ARRAY, items: { type: Type.STRING } },
            databaseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  columns: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        constraints: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
            },
            apiDefinitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  method: { type: Type.STRING },
                  path: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  authRequired: { type: Type.BOOLEAN },
                },
              },
            },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING },
                  language: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
              },
            },
            securityChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'assistantReply',
            'summary',
            'detectedCategory',
            'detectedLanguage',
            'detectedFramework',
            'detectedFrontend',
            'database',
            'authMethod',
            'modules',
            'userRoles',
            'businessRules',
            'databaseSchema',
            'apiDefinitions',
            'files',
            'securityChecklist',
          ],
        },
      },
    });

    for (const step of agentPipeline.slice(3)) {
      sendEvent('agent_step', { id: step.id, status: 'completed', detail: step.detail });
    }

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);

    const db = await loadDb();
    db.aiStats.applicationsGenerated += 1;
    db.aiStats.tokensConsumed += Math.max(1200, Math.round(rawText.length / 3));
    await persistDb(db);

    const replyText: string = parsed.assistantReply || 'Application architecture generated.';
    const words = replyText.split(/(\s+)/);
    for (let i = 0; i < words.length; i += 6) {
      const chunk = words.slice(i, i + 6).join('');
      sendEvent('token', { text: chunk });
    }

    sendEvent('proposal', {
      id: `prop-${Date.now()}`,
      summary: parsed.summary,
      detectedCategory: parsed.detectedCategory,
      detectedLanguage: parsed.detectedLanguage,
      detectedFramework: parsed.detectedFramework,
      detectedFrontend: parsed.detectedFrontend,
      database: parsed.database,
      authMethod: parsed.authMethod,
      recommendedThemeId: themeId,
      modules: parsed.modules || [],
      userRoles: parsed.userRoles || [],
      businessRules: parsed.businessRules || [],
      databaseSchema: parsed.databaseSchema || [],
      apiDefinitions: parsed.apiDefinitions || [],
      files: parsed.files || [],
      securityChecklist: parsed.securityChecklist || [],
      status: 'pending',
    });

    sendEvent('done', { model: 'gemini-4-hydrogen' });
    res.end();
  } catch (err) {
    const db = await loadDb();
    db.aiStats.failedGenerations += 1;
    await persistDb(db);
    const errorMessage = err instanceof Error ? err.message : 'Agent pipeline execution failed.';
    sendEvent('error', { message: errorMessage });
    res.end();
  }
});
