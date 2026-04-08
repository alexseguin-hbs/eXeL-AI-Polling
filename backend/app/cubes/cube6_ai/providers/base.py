"""Abstract base classes for AI provider abstraction layer.

Launch providers: OpenAI, Grok (xAI), Gemini (Google)
Extensible: add more providers by implementing these interfaces.

Each provider must implement both embedding and summarization.
The system selects provider per session (configurable by Moderator).
Circuit breaker + failover to next available provider on outage.
"""

from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import structlog

logger = structlog.get_logger(__name__)


class AIProviderName(str, Enum):
    """Supported AI providers. Extensible — add new entries as providers are implemented."""

    OPENAI = "openai"
    GROK = "grok"  # xAI — uses OpenAI-compatible API
    GEMINI = "gemini"  # Google
    CLAUDE = "claude"  # Anthropic


class EmbeddingProvider(ABC):
    """Abstract interface for batch embedding generation.

    Implementations must support batched requests (no row-by-row calls).
    Must pin exact model version for deterministic reproducibility.
    """

    provider_name: AIProviderName

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts.

        Args:
            texts: List of input texts (batch size 100-2000 recommended).

        Returns:
            List of embedding vectors, one per input text.
        """
        ...

    @abstractmethod
    def model_id(self) -> str:
        """Return the pinned model identifier for reproducibility hashing."""
        ...


class SummarizationProvider(ABC):
    """Abstract interface for text summarization and theme labeling.

    Used for: 333→111→33 word summarization, Theme01 classification,
    Theme02 generation, and theme reduction (9→6→3).
    """

    provider_name: AIProviderName

    @abstractmethod
    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        """Summarize or classify text according to instruction.

        Args:
            texts: Input texts to process.
            instruction: System prompt describing the task.

        Returns:
            Generated summary or classification result.
        """
        ...

    async def batch_summarize(
        self, items: list[dict[str, str]], timeout: float = 120.0
    ) -> list[str]:
        """Batch summarize multiple items with concurrency cap and timeout.

        Default implementation shared across all providers. Override only
        if provider needs custom batching logic.

        Args:
            items: List of dicts with 'text' and 'instruction' keys.
            timeout: Per-item timeout in seconds.

        Returns:
            List of results, one per input item. Failed items return "".
        """
        from app.config import settings

        semaphore = asyncio.Semaphore(settings.max_sampling_workers)

        async def _single(item: dict[str, str]) -> str:
            async with semaphore:
                try:
                    return await asyncio.wait_for(
                        self.summarize(
                            [item["text"]], instruction=item.get("instruction", "")
                        ),
                        timeout=timeout,
                    )
                except asyncio.TimeoutError:
                    logger.warning("ai.batch_summarize.timeout", provider=self.provider_name.value)
                    return ""
                except Exception as e:
                    logger.warning("ai.batch_summarize.item_failed", error=str(e), provider=self.provider_name.value)
                    return ""

        return await asyncio.gather(*[_single(item) for item in items])
