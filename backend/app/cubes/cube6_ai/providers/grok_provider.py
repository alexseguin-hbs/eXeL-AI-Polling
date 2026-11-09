"""Grok (xAI) provider for embeddings and summarization.

Grok uses an OpenAI-compatible API endpoint at api.x.ai.
Pinned models for deterministic reproducibility:
- Embedding: xAI exposes no embedding models (GET /v1/embedding-models -> []), so embeddings delegate to the next
  keyed embedding vendor (OpenAI text-embedding-3-small, then Gemini) — the same pattern as ClaudeEmbedding.
- Summarization: grok-4.20-0309-non-reasoning (temperature=0.0). CRS-09.08 / CRS-15 (2026-11-09): chosen because it is
  the account's non-reasoning model — measured ~0.4 s per Theme01 classify call with 0 reasoning tokens, versus
  2.6-5 s for grok-4.3 / grok-build-0.1, which spend 340-440 reasoning tokens per call — at the same $1.25/$2.50 per
  1M token price (https://docs.x.ai/docs/pricing, updated 2026-10-10). grok-3-mini (the previous pin) is no longer
  served to this account. Override with XAI_SUMMARIZATION_MODEL.
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
_SUMMARIZATION_MODEL = "grok-4.20-0309-non-reasoning"


def summarization_model() -> str:
    return (getattr(settings, "xai_summarization_model", "") or _SUMMARIZATION_MODEL).strip()


class GrokEmbedding(EmbeddingProvider):
    """xAI has no embedding API: delegate to the next keyed embedding vendor (OpenAI, then Gemini)."""

    provider_name = AIProviderName.GROK

    def __init__(self) -> None:
        if settings.openai_api_key:
            from app.cubes.cube6_ai.providers.openai_provider import OpenAIEmbedding

            self._delegate: EmbeddingProvider = OpenAIEmbedding()
        elif settings.gemini_api_key:
            from app.cubes.cube6_ai.providers.gemini_provider import GeminiEmbedding

            self._delegate = GeminiEmbedding()
        else:
            raise ValueError("xAI has no embedding API and no OpenAI/Gemini key is configured for delegation")

    def model_id(self) -> str:
        return self._delegate.model_id()

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return await self._delegate.embed(texts)


class GrokSummarization(SummarizationProvider):
    """Grok summarization/classification provider (non-reasoning Grok, see module docstring)."""

    provider_name = AIProviderName.GROK

    def __init__(self) -> None:
        self._client = openai.AsyncOpenAI(
            api_key=settings.xai_api_key,
            base_url=_GROK_BASE_URL,
            timeout=120.0,
            max_retries=0,  # the multi-vendor layer owns retries/failover (a 402 credit stop must fail fast)
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
                model=summarization_model(),
                messages=messages,
                temperature=0.0,
            ),
            timeout=120.0,
        )
        return response.choices[0].message.content or ""

    # batch_summarize inherited from SummarizationProvider base class
