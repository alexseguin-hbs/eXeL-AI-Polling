"""OpenAI provider implementation for embeddings and summarization.

Pinned models for deterministic reproducibility:
- Embedding: text-embedding-3-small
- Summarization: gpt-4o-mini (temperature=0.0)
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

_EMBEDDING_MODEL = "text-embedding-3-small"
_SUMMARIZATION_MODEL = "gpt-4o-mini"


class OpenAIEmbedding(EmbeddingProvider):
    """OpenAI embedding provider using text-embedding-3-small."""

    provider_name = AIProviderName.OPENAI

    def __init__(self) -> None:
        self._client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    def model_id(self) -> str:
        return _EMBEDDING_MODEL

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings in batches of up to 2048 texts."""
        all_embeddings: list[list[float]] = []
        batch_size = settings.batch_size

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = await self._client.embeddings.create(
                model=_EMBEDDING_MODEL,
                input=batch,
            )
            all_embeddings.extend([item.embedding for item in response.data])

        return all_embeddings


class OpenAISummarization(SummarizationProvider):
    """OpenAI summarization/classification provider using gpt-4o-mini."""

    provider_name = AIProviderName.OPENAI

    def __init__(self) -> None:
        self._client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        """Single summarization/classification call."""
        combined = "\n\n".join(texts)
        messages: list[dict[str, Any]] = []
        if instruction:
            messages.append({"role": "system", "content": instruction})
        messages.append({"role": "user", "content": combined[:8000]})

        response = await self._client.chat.completions.create(
            model=_SUMMARIZATION_MODEL,
            messages=messages,
            temperature=0.0,
        )
        return response.choices[0].message.content or ""

    async def batch_summarize(self, items: list[dict[str, str]]) -> list[str]:
        """Batch summarization using concurrent async calls."""
        semaphore = asyncio.Semaphore(settings.max_sampling_workers)

        async def _single(item: dict[str, str]) -> str:
            async with semaphore:
                return await self.summarize(
                    [item["text"]], instruction=item.get("instruction", "")
                )

        return await asyncio.gather(*[_single(item) for item in items])
