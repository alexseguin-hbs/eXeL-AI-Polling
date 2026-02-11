"""Abstract base classes for AI provider abstraction layer.

Launch providers: OpenAI, Grok (xAI), Gemini (Google)
Extensible: add more providers by implementing these interfaces.

Each provider must implement both embedding and summarization.
The system selects provider per session (configurable by Moderator).
Circuit breaker + failover to next available provider on outage.
"""

from abc import ABC, abstractmethod
from enum import Enum


class AIProviderName(str, Enum):
    """Supported AI providers. Extensible — add new entries as providers are implemented."""

    OPENAI = "openai"
    GROK = "grok"  # xAI — uses OpenAI-compatible API
    GEMINI = "gemini"  # Google


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

    @abstractmethod
    async def batch_summarize(
        self, items: list[dict[str, str]]
    ) -> list[str]:
        """Batch summarize multiple items.

        Args:
            items: List of dicts with 'text' and 'instruction' keys.

        Returns:
            List of results, one per input item.
        """
        ...
