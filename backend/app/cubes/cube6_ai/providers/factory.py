"""Provider factory — resolves AI provider by name."""

from app.cubes.cube6_ai.providers.base import (
    AIProviderName,
    EmbeddingProvider,
    SummarizationProvider,
)
from app.cubes.cube6_ai.providers.openai_provider import (
    OpenAIEmbedding,
    OpenAISummarization,
)


def get_embedding_provider(name: str) -> EmbeddingProvider:
    """Resolve an EmbeddingProvider by provider name string."""
    provider = AIProviderName(name)
    if provider == AIProviderName.OPENAI:
        return OpenAIEmbedding()
    # Grok uses OpenAI-compatible API — could be added here
    # Gemini would need a separate implementation
    raise ValueError(f"Embedding provider '{name}' not yet implemented")


def get_summarization_provider(name: str) -> SummarizationProvider:
    """Resolve a SummarizationProvider by provider name string."""
    provider = AIProviderName(name)
    if provider == AIProviderName.OPENAI:
        return OpenAISummarization()
    raise ValueError(f"Summarization provider '{name}' not yet implemented")
