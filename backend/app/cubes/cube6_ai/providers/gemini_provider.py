"""Google Gemini provider for embeddings and summarization.

Uses google-generativeai SDK for the Gemini API.
Pinned models for deterministic reproducibility:
- Embedding: text-embedding-004
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

_EMBEDDING_MODEL = "text-embedding-004"
_SUMMARIZATION_MODEL = "gemini-2.5-flash"


class GeminiEmbedding(EmbeddingProvider):
    """Google Gemini embedding provider using text-embedding-004."""

    provider_name = AIProviderName.GEMINI

    def __init__(self) -> None:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        self._genai = genai

    def model_id(self) -> str:
        return _EMBEDDING_MODEL

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings via Gemini API."""
        all_embeddings: list[list[float]] = []
        batch_size = min(settings.batch_size, 100)  # Gemini batch limit

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    self._genai.embed_content,
                    model=f"models/{_EMBEDDING_MODEL}",
                    content=batch,
                    task_type="SEMANTIC_SIMILARITY",
                ),
                timeout=120.0,
            )
            # result.embedding is a list of embeddings when given a list input
            if isinstance(result["embedding"][0], list):
                all_embeddings.extend(result["embedding"])
            else:
                all_embeddings.append(result["embedding"])

        return all_embeddings


class GeminiSummarization(SummarizationProvider):
    """Google Gemini summarization/classification using gemini-2.5-flash."""

    provider_name = AIProviderName.GEMINI

    def __init__(self) -> None:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel(
            _SUMMARIZATION_MODEL,
            generation_config=genai.types.GenerationConfig(
                temperature=0.0,
            ),
        )

    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        """Single summarization/classification call."""
        combined = "\n\n".join(texts)
        prompt = f"{instruction}\n\n{combined[:8000]}" if instruction else combined[:8000]

        response = await asyncio.wait_for(
            asyncio.to_thread(
                self._model.generate_content,
                prompt,
            ),
            timeout=120.0,
        )
        return response.text or ""

    async def batch_summarize(self, items: list[dict[str, str]]) -> list[str]:
        """Batch summarization using concurrent async calls."""
        semaphore = asyncio.Semaphore(settings.max_sampling_workers)

        async def _single(item: dict[str, str]) -> str:
            async with semaphore:
                return await self.summarize(
                    [item["text"]], instruction=item.get("instruction", "")
                )

        return await asyncio.gather(*[_single(item) for item in items])
