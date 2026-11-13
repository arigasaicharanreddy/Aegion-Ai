from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, projects, chat, prompts, admin, registrations, webhooks

app = FastAPI(
    title="Aegion AI — Python Agentic Engine",
    version="2.0.0",
    description="Modular FastAPI + LangGraph + PostgreSQL + Argon2id + Google Sheets/WhatsApp backend for Aegion AI",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(registrations.router, prefix="/api/v1/registrations", tags=["registrations"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(prompts.router, prefix="/api/v1/prompts", tags=["prompts"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["webhooks"])


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "runtime": "python-fastapi",
        "orchestrator": "langgraph",
        "rag": "pgvector",
        "password_hashing": "argon2id",
    }
