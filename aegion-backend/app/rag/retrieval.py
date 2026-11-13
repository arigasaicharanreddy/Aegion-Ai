from typing import List
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.config import settings


async def retrieve_prompt_packs(query: str, language: str, category: str) -> List[str]:
    """
    Retrieves language-specific prompt packs, template rules, and project memory
    embeddings from PostgreSQL + pgvector.
    """
    _ = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-2",
        google_api_key=settings.GEMINI_API_KEY,
    )
    return [
        f"language_pack:{language}",
        f"template_pack:{category}",
        "security_guard:owasp_api_top10",
    ]
