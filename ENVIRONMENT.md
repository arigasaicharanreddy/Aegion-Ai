# Aegion AI — Environment Configuration & Free Development Mode Guide

Aegion AI is configured to run immediately in **Free Development Mode** with **zero paid APIs, zero Google Cloud billing requirements, and zero hardcoded credentials**.

When external services (Python FastAPI, SMTP/Resend/SendGrid, WhatsApp Cloud API, or Super Admin bootstrap secrets) are omitted in development, the frontend preview and Express gateway never block:
- **Mock API Fallback (`src/config/mockDevApi.ts`)**: Handles registrations, approval decisions, 9 Admin Dashboard KPIs, runtime health, and SSE code generation automatically when a standalone Python FastAPI service or backend gateway is unavailable.
- **Server-Side Gemini AI (`GEMINI_API_KEY`)**: When injected by Google AI Studio or `.env`, `/api/v1/chat/stream` executes `gemini-4-hydrogen` securely on the server side (`server/routes/agentRoutes.ts`). When absent in development mode, the server returns deterministic mock agentic SSE output.
- **Optional Email Notifications (`server/services/notificationService.ts`)**: Missing SMTP, Resend, SendGrid, or Gmail OAuth credentials are logged cleanly as `Skipped (Unconfigured)` without blocking registration, approval, or activation.
- **Non-Blocking Free Dev Preview (`POST /api/v1/auth/dev-preview-session`)**: Available strictly when `NODE_ENV !== "production"` and `AEGION_FREE_DEV_MODE !== "false"`. Disabled with HTTP `403` in production builds.

---

## Complete Environment Variable Audit

### 1. Required (Production vs. Development)
| Variable | Dev Status | Production Status | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Optional (`development`) | **Required** (`production`) | Disables dev preview shortcuts and enables production cookie security (`Secure`). |
| `APP_URL` | Optional (`http://localhost:3000`) | **Required** | Origin URL used to build single-use 24h account activation and password reset links. |
| `AEGION_SESSION_SECRET` | Optional (ephemeral secret generated) | **Required** | Cryptographic HMAC secret for session integrity in production. |
| `AEGION_SUPER_ADMIN_INITIAL_PASSWORD` | Optional (one-time random passphrase generated & logged on startup) | **Required** (or one-time CLI/startup provisioning) | Initial bootstrap password for `arigasaicharan@gmail.com`. Forced rotation is required on first password login. |

### 2. Optional (Server-Side AI & Runtime Routing)
| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-side only | Automatically injected in Google AI Studio. Enables live `gemini-4-hydrogen` multi-language generation via `/api/v1/chat/stream`. Never exposed to client JS. |
| `AEGION_FREE_DEV_MODE` | Server-side (`"true"` default in dev) | Set to `"false"` to test strict production login gating locally. |
| `AEGION_PYTHON_API_URL` | Server-side only | URL of separately deployed `aegion-backend/` Python FastAPI + LangGraph service. Omit to use Express gateway / mock fallback. |
| `VITE_AEGION_API_URL` | Frontend (Vite) | Optional API base URL override if frontend is hosted separately from the Express gateway. |
| `AEGION_SHEETS_SPREADSHEET_ID` | Server-side only | Optional pre-existing Google Sheet ID for `AEGION_AI_CUSTOMER_REGISTRATIONS`. |

### 3. Production-Only (External Email, WhatsApp & Python Infrastructure)
| Variable | Service | Purpose |
| :--- | :--- | :--- |
| `AEGION_SENDER_EMAIL` | Email Automation | Verified sender address (`Gmail API`, `SMTP`, `Resend`, `SendGrid`, `Amazon SES`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP Relay | Optional SMTP credentials. Skipped cleanly in free development mode. |
| `RESEND_API_KEY` / `SENDGRID_API_KEY` | Transactional Email | Optional provider API keys stored server-side only. |
| `WHATSAPP_WABA_ID`, `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Cloud API | Meta WhatsApp Business Account & Phone Number identifiers. |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | WhatsApp Cloud API | Server-only bearer token, webhook challenge verify token, and HMAC-SHA256 webhook signature secret. |
| `AEGION_ADMIN_WHATSAPP_NUMBER` | WhatsApp Cloud API | Optional Super Admin WhatsApp alert recipient for new registrations. |
| `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` | `aegion-backend/` only | Required only when running the standalone Python FastAPI + PostgreSQL + pgvector container. |

---

## Running Locally in Free Development Mode

```bash
npm install
npm run dev
```

Open `http://localhost:3000`:
- Use **Open Free Dev Workspace** on the landing page (or **Continue in Free Dev Mode** on Sign In / **Enter Free Dev Admin Preview** on the Super Admin portal) to explore the full Builder Studio, 50 Glass Themes, Prompt Registry, 6-step Registration, and redesigned Super Admin Dashboard with zero external credentials.
- To test live Gemini generation, set `GEMINI_API_KEY` in AI Studio Secrets or your local `.env` file.
