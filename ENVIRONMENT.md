# Aegion AI — Environment Configuration Guide

Aegion AI runs as a unified React + Vite frontend and Express API gateway (`server.ts`) on port `3000`, with no public free dev preview bypass and strict Super Admin approval-gated onboarding.

## Environment Variable Reference

### 1. Core Application & AI (Server-Side)
| Variable | Required? | Recommended Value | Purpose |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Required for AI** | Your Gemini API key | Powers `/api/v1/assistant/chat`, `/api/v1/assistant/stream`, and `/api/v1/chat/stream` (`gemini-4-hydrogen`) strictly on the server side. Never expose in client bundles or `VITE_*` vars. |
| `APP_URL` | Optional (auto-detected) | Hosted origin URL (or leave default/AI Studio injected value) | Used to generate single-use 24h activation, password reset, and email verification links. Falls back to incoming request origin if omitted. |
| `VITE_AEGION_API_URL` | Optional (**leave blank**) | `""` (empty) | Leave blank when frontend and Express backend run together on the same origin (`server.ts`). Only set if hosting the API gateway on a separate domain. |

### 2. Super Admin & Session Security (Server-Side Only)
| Variable | Required? | Recommended Value | Purpose |
| :--- | :--- | :--- | :--- |
| `AEGION_SUPER_ADMIN_EMAIL` | **Required** | `aegionlabs.in@gmail.com` | Sole authorized Super Admin email provisioned at startup when no custom admin email change has occurred. |
| `AEGION_SUPER_ADMIN_INITIAL_PASSWORD` | **Required initially** | Stored in `.env` / Secrets | Initial Super Admin passphrase used to provision login on first boot. Never commit or hardcode in source code. |
| `AEGION_SUPER_ADMIN_FORCE_RESET` | Optional | `"false"` | Set to `"true"` temporarily only if you need to reset the Super Admin password back to `AEGION_SUPER_ADMIN_INITIAL_PASSWORD` on restart. |
| `AEGION_SESSION_SECRET` | Optional (Recommended for prod) | Random 32+ char string | Secret used for production session hardening. |

### 3. Optional Standalone Python Backend
| Variable | Required? | Recommended Value | Purpose |
| :--- | :--- | :--- | :--- |
| `AEGION_PYTHON_API_URL` | Optional (**leave blank**) | `""` (empty) | URL of a separately deployed `aegion-backend/` FastAPI + LangGraph service. Leave blank to use the built-in Node/Express + Gemini gateway. |

### 4. Optional Email, WhatsApp & Google Sheets Integrations
Leave any unused provider blank. Registration, Super Admin approval, contact submissions, and XLSX/CSV downloads work cleanly without external mail/WhatsApp keys.

| Variable | Service | Purpose |
| :--- | :--- | :--- |
| `AEGION_SENDER_EMAIL` | Email | Verified sender address (defaults to Super Admin email if omitted). |
| `RESEND_API_KEY` | Resend | API key for transactional email delivery via Resend (optional). |
| `SENDGRID_API_KEY` | SendGrid | API key for transactional email delivery via SendGrid (optional). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP | Custom SMTP server credentials (optional). |
| `WHATSAPP_WABA_ID`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `AEGION_ADMIN_WHATSAPP_NUMBER` | Meta WhatsApp Cloud API | Optional WhatsApp notifications and webhook verification. |
| `AEGION_SHEETS_SPREADSHEET_ID`, `AEGION_CONTACT_SHEETS_SPREADSHEET_ID` | Google Sheets | Optional pre-created Google Spreadsheet IDs for registration and contact inquiry sync. |
