"""Abstract base classes for AI provider abstraction layer."""

from abc import ABC, abstractmethod


class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        ...


class SummarizationProvider(ABC):
    @abstractmethod
    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        """Summarize a list of texts into a theme label and description."""
        ...
