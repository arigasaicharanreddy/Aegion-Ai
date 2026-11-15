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
import { createRateLimiter } from '../security/crypto';

export const agentRouter = Router();

const PYTHON_API_URL = process.env.AEGION_PYTHON_API_URL?.trim() || '';

const assistantRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 25,
  keyPrefix: 'assistant',
});

function createAiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function buildAssistantSystemInstruction(projectContext?: {
  name?: string;
  category?: string;
  language?: string;
  framework?: string;
  modules?: string[];
  specification?: string;
}) {
  const ctxBlock = projectContext?.name
    ? `\n\nActive User Workspace Project Context:
- Project Name: ${projectContext.name}
- Category: ${projectContext.category || 'General'}
- Target Stack: ${projectContext.language || 'Default'} (${projectContext.framework || 'Standard'})
- Active Modules: ${(projectContext.modules || []).join(', ') || 'None yet'}
- Specification Summary: ${(projectContext.specification || '').slice(0, 400)}`
    : '';

  return `You are the Aegion AI Assistant, a clear, practical product and application architecture advisor for Aegion AI.
Explain what Aegion AI does, how businesses transform requirements into intelligent scalable applications, its 6 industry solution categories (HRMS, E-Commerce, Multi-Store Management, SaaS Products, Healthcare & Pharmacy Store Systems, Custom Business Operations Software), its 50 light and dark customizable themes, and how onboarding works:
- New users complete the 6-step Request Workspace Access registration and await Super Admin approval.
- Approved users activate their account via a single-use link, then sign in with Google or Email and Password.
- Visitors can reach the team via the Contact Us inquiry form on the home page.
- Never reveal or mention server secrets, passwords, API keys, or internal environment configuration.${ctxBlock}
Keep responses helpful, accurate, and concise.`;
}

function buildAssistantContents(
  messages: Array<{ role?: string; content?: string }>,
  latestMessage: string
): string {
  const historyText = messages
    .slice(-10)
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${String(m.content || '').slice(0, 800)}`)
    .join('\n');

  return historyText
    ? `Conversation history:\n${historyText}\n\nLatest User Question:\n${latestMessage}`
    : latestMessage;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err || 'Unable to reach Gemini AI service.');
  if (raw.includes('429') || raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('rate limit')) {
    return { status: 429, message: 'AI assistant rate limit reached. Please wait a moment and try again.' };
  }
  if (raw.includes('401') || raw.includes('403') || raw.toLowerCase().includes('api key')) {
    return { status: 502, message: 'Server AI credentials could not be verified. Contact the workspace administrator.' };
  }
  return { status: 502, message: 'AI assistant service encountered an upstream error. Please try again shortly.' };
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

agentRouter.get('/health', async (_req, res) => {
  res.json({
    status: 'ok',
    frontendRuntime: 'react-vite',
    gatewayRuntime: 'node-express',
    pythonBackendConfigured: Boolean(PYTHON_API_URL),
    pythonBackendUrl: PYTHON_API_URL || null,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    aiModel: 'gemini-4-hydrogen',
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
    nodeEnv: process.env.NODE_ENV || 'development',
    pythonBackendConfigured: Boolean(PYTHON_API_URL),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    emailConfigured,
    whatsappConfigured,
    superAdminConfigured: db.users.some((u) => u.role === 'super_admin' && Boolean(u.passwordHash)),
  });
});

agentRouter.get('/platform-themes/config', async (_req, res) => {
  const db = await loadDb();
  res.json({
    config: db.platformThemeConfig,
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

agentRouter.post('/assistant/chat', assistantRateLimiter, async (req, res) => {
  try {
    const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const latestMessage =
      typeof req.body?.message === 'string'
        ? req.body.message.trim()
        : typeof rawMessages[rawMessages.length - 1]?.content === 'string'
        ? rawMessages[rawMessages.length - 1].content.trim()
        : '';

    if (!latestMessage) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const ai = createAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chatbot AI service is not configured on the server.',
      });
    }

    const { user } = await resolveSessionUser(req);
    const projectContext = user?.status === 'active' ? req.body?.projectContext : undefined;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: buildAssistantContents(rawMessages, latestMessage),
      config: {
        systemInstruction: buildAssistantSystemInstruction(projectContext),
      },
    });

    const reply = (response.text || '').trim() || 'How can I help you explore Aegion AI today?';
    return res.json({
      reply,
      model: 'gemini-4-hydrogen',
    });
  } catch (err) {
    const formatted = formatGeminiError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

agentRouter.post('/assistant/stream', assistantRateLimiter, async (req, res) => {
  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const latestMessage =
    typeof req.body?.message === 'string'
      ? req.body.message.trim()
      : typeof rawMessages[rawMessages.length - 1]?.content === 'string'
      ? rawMessages[rawMessages.length - 1].content.trim()
      : '';

  if (!latestMessage) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const ai = createAiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Chatbot AI service is not configured on the server.',
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { user } = await resolveSessionUser(req);
    const projectContext = user?.status === 'active' ? req.body?.projectContext : undefined;

    const stream = await ai.models.generateContentStream({
      model: 'gemini-4-hydrogen',
      contents: buildAssistantContents(rawMessages, latestMessage),
      config: {
        systemInstruction: buildAssistantSystemInstruction(projectContext),
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text || '';
      if (text) {
        sendEvent('token', { text });
      }
    }

    sendEvent('done', { model: 'gemini-4-hydrogen' });
    return res.end();
  } catch (err) {
    const formatted = formatGeminiError(err);
    sendEvent('error', { message: formatted.message, status: formatted.status });
    return res.end();
  }
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
      sendEvent('error', {
        message: 'GEMINI_API_KEY is not configured on the server.',
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
Generate clean layered code in ANY requested programming language (Python/FastAPI, Java/Spring Boot, JavaScript/Node.js, TypeScript/NestJS, PHP/Laravel, Go/Gin, C#/.NET, Ruby/Rails, Kotlin, Swift, Rust/Axum, C++).

CRITICAL RULES:
1. If the user's message explicitly specifies a backend programming language or framework, override defaults and generate code in that exact language and framework.
2. If no language is specified in the prompt, use ${language} / ${framework}.
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
    return res.end();
  } catch (err) {
    const db = await loadDb();
    db.aiStats.failedGenerations += 1;
    await persistDb(db);
    const formatted = formatGeminiError(err);
    sendEvent('error', { message: formatted.message });
    return res.end();
  }
});
