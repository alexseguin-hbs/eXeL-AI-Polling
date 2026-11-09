"""Google Gemini provider for embeddings and summarization.

Uses the google-genai SDK for the Gemini API.
Pinned models for deterministic reproducibility:
- Embedding: gemini-embedding-001 (768-dim)
- Summarization: gemini-2.5-flash (temperature=0.0)
"""

import asyncio
from typing import Any

from app.config import settings
from app.cubes.cube6_ai.providers.base import (
    AIProviderName,
    EmbeddingProvider,
    SummarizationProvider,
)

_EMBEDDING_MODEL = "gemini-embedding-001"   # text-embedding-004 was retired by Google (2026)
_EMBEDDING_DIM = 768                         # Matryoshka-truncated; keeps vectors the size text-embedding-004 produced
_SUMMARIZATION_MODEL = "gemini-2.5-flash"


def _client():
    """google-genai client (the supported SDK; google-generativeai is deprecated and not installed)."""
    from google import genai

    return genai.Client(api_key=settings.gemini_api_key)


class GeminiEmbedding(EmbeddingProvider):
    """Google Gemini embedding provider using gemini-embedding-001 (768-dim)."""

    provider_name = AIProviderName.GEMINI

    def __init__(self) -> None:
        self._client = _client()

    def model_id(self) -> str:
        return _EMBEDDING_MODEL

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings via the Gemini API, batched at the API's 100-item limit."""
        all_embeddings: list[list[float]] = []
        batch_size = min(settings.batch_size, 100)  # Gemini batch limit

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    self._client.models.embed_content,
                    model=_EMBEDDING_MODEL,
                    contents=batch,
                    config={"task_type": "SEMANTIC_SIMILARITY", "output_dimensionality": _EMBEDDING_DIM},
                ),
                timeout=120.0,
            )
            all_embeddings.extend(list(e.values) for e in result.embeddings)

        return all_embeddings


class GeminiSummarization(SummarizationProvider):
    """Google Gemini summarization/classification using gemini-2.5-flash (temperature 0)."""

    provider_name = AIProviderName.GEMINI

    def __init__(self) -> None:
        self._client = _client()

    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        """Single summarization/classification call."""
        combined = "\n\n".join(texts)
        prompt = f"{instruction}\n\n{combined[:8000]}" if instruction else combined[:8000]

        response = await asyncio.wait_for(
            asyncio.to_thread(
                self._client.models.generate_content,
                model=_SUMMARIZATION_MODEL,
                contents=prompt,
                config={"temperature": 0.0},
            ),
            timeout=120.0,
        )
        return response.text or ""

    # batch_summarize inherited from SummarizationProvider base class
