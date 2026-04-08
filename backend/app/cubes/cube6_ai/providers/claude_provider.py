"""Claude (Anthropic) provider implementation for summarization.

Pinned models for deterministic reproducibility:
- Summarization: claude-sonnet-4-6 (temperature=0.0)
- Embedding: Not natively supported — uses OpenAI embedding as fallback.

Note: Anthropic does not offer a dedicated embedding API.
When Claude is selected as the AI provider, embedding operations
fall back to OpenAI's text-embedding-3-small for determinism.
"""

import asyncio
from typing import Any

import anthropic

from app.config import settings
from app.cubes.cube6_ai.providers.base import (
    AIProviderName,
    EmbeddingProvider,
    SummarizationProvider,
)

_SUMMARIZATION_MODEL = "claude-sonnet-4-20250514"


class ClaudeSummarization(SummarizationProvider):
    """Anthropic Claude summarization/classification provider."""

    provider_name = AIProviderName.CLAUDE

    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic(
            api_key=settings.anthropic_api_key,
            timeout=120.0,
        )

    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        """Single summarization/classification call."""
        combined = "\n\n".join(texts)
        messages: list[dict[str, Any]] = [
            {"role": "user", "content": combined[:8000]},
        ]

        response = await asyncio.wait_for(
            self._client.messages.create(
                model=_SUMMARIZATION_MODEL,
                max_tokens=1024,
                system=instruction if instruction else "You are a helpful assistant.",
                messages=messages,
                temperature=0.0,
            ),
            timeout=120.0,
        )
        return response.content[0].text if response.content else ""

    # batch_summarize inherited from SummarizationProvider base class


class ClaudeEmbedding(EmbeddingProvider):
    """Fallback embedding provider — delegates to OpenAI.

    Anthropic does not offer a dedicated embedding API.
    When Claude is the AI provider, embeddings use OpenAI as the embedding
    backend for deterministic reproducibility.
    """

    provider_name = AIProviderName.CLAUDE

    def __init__(self) -> None:
        from app.cubes.cube6_ai.providers.openai_provider import OpenAIEmbedding
        self._delegate = OpenAIEmbedding()

    def model_id(self) -> str:
        return self._delegate.model_id()

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return await self._delegate.embed(texts)
