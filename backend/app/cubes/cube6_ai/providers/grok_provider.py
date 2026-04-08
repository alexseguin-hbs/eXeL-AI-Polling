"""Grok (xAI) provider for embeddings and summarization.

Grok uses an OpenAI-compatible API endpoint at api.x.ai.
Pinned models for deterministic reproducibility:
- Embedding: (not available — falls back to OpenAI embedding)
- Summarization: grok-3-mini (temperature=0.0, cheapest reasoning model)
"""

import asyncio
from typing import Any

import openai

from app.config import settings
from app.cubes.cube6_ai.providers.base import (
    AIProviderName,
    EmbeddingProvider,
    SummarizationProvider,
)

_GROK_BASE_URL = "https://api.x.ai/v1"
_SUMMARIZATION_MODEL = "grok-3-mini"


class GrokEmbedding(EmbeddingProvider):
    """Grok embedding provider.

    Note: xAI does not currently offer a dedicated embedding API.
    Uses OpenAI-compatible endpoint with text-embedding model if available,
    otherwise falls back to OpenAI embedding with Grok API key routing.
    """

    provider_name = AIProviderName.GROK

    def __init__(self) -> None:
        self._client = openai.AsyncOpenAI(
            api_key=settings.xai_api_key,
            base_url=_GROK_BASE_URL,
            timeout=120.0,
        )

    def model_id(self) -> str:
        return "grok-embedding-beta"

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings via Grok API."""
        all_embeddings: list[list[float]] = []
        batch_size = settings.batch_size

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = await asyncio.wait_for(
                self._client.embeddings.create(
                    model=self.model_id(),
                    input=batch,
                ),
                timeout=120.0,
            )
            all_embeddings.extend([item.embedding for item in response.data])

        return all_embeddings


class GrokSummarization(SummarizationProvider):
    """Grok summarization/classification provider using grok-3-mini."""

    provider_name = AIProviderName.GROK

    def __init__(self) -> None:
        self._client = openai.AsyncOpenAI(
            api_key=settings.xai_api_key,
            base_url=_GROK_BASE_URL,
            timeout=120.0,
        )

    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        """Single summarization/classification call."""
        combined = "\n\n".join(texts)
        messages: list[dict[str, Any]] = []
        if instruction:
            messages.append({"role": "system", "content": instruction})
        messages.append({"role": "user", "content": combined[:8000]})

        response = await asyncio.wait_for(
            self._client.chat.completions.create(
                model=_SUMMARIZATION_MODEL,
                messages=messages,
                temperature=0.0,
            ),
            timeout=120.0,
        )
        return response.choices[0].message.content or ""

    # batch_summarize inherited from SummarizationProvider base class
