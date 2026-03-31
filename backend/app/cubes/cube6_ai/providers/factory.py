"""Provider factory — resolves AI provider by name with circuit breaker failover.

Failover chain: requested provider -> next available -> next available.
If all fail, raises ValueError.
"""

import logging

from app.cubes.cube6_ai.providers.base import (
    AIProviderName,
    EmbeddingProvider,
    SummarizationProvider,
)
from app.cubes.cube6_ai.providers.openai_provider import (
    OpenAIEmbedding,
    OpenAISummarization,
)
from app.cubes.cube6_ai.providers.grok_provider import (
    GrokEmbedding,
    GrokSummarization,
)
from app.cubes.cube6_ai.providers.gemini_provider import (
    GeminiEmbedding,
    GeminiSummarization,
)
from app.cubes.cube6_ai.providers.claude_provider import (
    ClaudeEmbedding,
    ClaudeSummarization,
)
from app.config import settings

logger = logging.getLogger(__name__)

# Failover order: primary -> secondary -> tertiary -> quaternary
_FAILOVER_ORDER = [
    AIProviderName.OPENAI, AIProviderName.GROK,
    AIProviderName.GEMINI, AIProviderName.CLAUDE,
]

_EMBEDDING_PROVIDERS: dict[AIProviderName, type[EmbeddingProvider]] = {
    AIProviderName.OPENAI: OpenAIEmbedding,
    AIProviderName.GROK: GrokEmbedding,
    AIProviderName.GEMINI: GeminiEmbedding,
    AIProviderName.CLAUDE: ClaudeEmbedding,
}

_SUMMARIZATION_PROVIDERS: dict[AIProviderName, type[SummarizationProvider]] = {
    AIProviderName.OPENAI: OpenAISummarization,
    AIProviderName.GROK: GrokSummarization,
    AIProviderName.GEMINI: GeminiSummarization,
    AIProviderName.CLAUDE: ClaudeSummarization,
}


def _has_api_key(provider: AIProviderName) -> bool:
    """Check if the API key for a provider is configured."""
    keys = {
        AIProviderName.OPENAI: settings.openai_api_key,
        AIProviderName.GROK: settings.xai_api_key,
        AIProviderName.GEMINI: settings.gemini_api_key,
        AIProviderName.CLAUDE: settings.anthropic_api_key,
    }
    return bool(keys.get(provider, ""))


def _get_failover_chain(requested: str) -> list[AIProviderName]:
    """Build failover chain starting with requested provider."""
    try:
        primary = AIProviderName(requested)
    except ValueError:
        primary = AIProviderName.OPENAI

    chain = [primary]
    for p in _FAILOVER_ORDER:
        if p not in chain:
            chain.append(p)
    return chain


def get_embedding_provider(name: str) -> EmbeddingProvider:
    """Resolve an EmbeddingProvider by name with circuit breaker failover."""
    chain = _get_failover_chain(name)

    for provider in chain:
        if not _has_api_key(provider):
            continue
        cls = _EMBEDDING_PROVIDERS.get(provider)
        if cls:
            if provider.value != name:
                logger.info(
                    "cube6.provider.failover",
                    requested=name,
                    resolved=provider.value,
                    type="embedding",
                )
            return cls()

    raise ValueError(
        f"No embedding provider available. Requested: '{name}', "
        f"checked: {[p.value for p in chain]}. Configure at least one API key."
    )


def get_summarization_provider(name: str) -> SummarizationProvider:
    """Resolve a SummarizationProvider by name with circuit breaker failover."""
    chain = _get_failover_chain(name)

    for provider in chain:
        if not _has_api_key(provider):
            continue
        cls = _SUMMARIZATION_PROVIDERS.get(provider)
        if cls:
            if provider.value != name:
                logger.info(
                    "cube6.provider.failover",
                    requested=name,
                    resolved=provider.value,
                    type="summarization",
                )
            return cls()

    raise ValueError(
        f"No summarization provider available. Requested: '{name}', "
        f"checked: {[p.value for p in chain]}. Configure at least one API key."
    )
