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
from app.cubes.cube6_ai.providers.offline_provider import (
    OfflineEmbedding,
    OfflineSummarization,
)
from app.config import settings

logger = logging.getLogger(__name__)

# Failover order: OpenAI (default) -> Gemini (cheapest) -> Grok -> Claude
_FAILOVER_ORDER = [
    AIProviderName.OPENAI, AIProviderName.GEMINI,
    AIProviderName.GROK, AIProviderName.CLAUDE,
]

_EMBEDDING_PROVIDERS: dict[AIProviderName, type[EmbeddingProvider]] = {
    AIProviderName.OPENAI: OpenAIEmbedding,
    AIProviderName.GROK: GrokEmbedding,
    AIProviderName.GEMINI: GeminiEmbedding,
    AIProviderName.CLAUDE: ClaudeEmbedding,
    AIProviderName.OFFLINE: OfflineEmbedding,
}

_SUMMARIZATION_PROVIDERS: dict[AIProviderName, type[SummarizationProvider]] = {
    AIProviderName.OPENAI: OpenAISummarization,
    AIProviderName.GROK: GrokSummarization,
    AIProviderName.GEMINI: GeminiSummarization,
    AIProviderName.CLAUDE: ClaudeSummarization,
    AIProviderName.OFFLINE: OfflineSummarization,
}


def _has_api_key(provider: AIProviderName) -> bool:
    """Check if the API key for a provider is configured.

    OFFLINE needs no key — it is deterministic/no-network. It is deliberately
    NOT in _FAILOVER_ORDER, so a real request with no keys still errors (Odin's
    guardrail: a missing prod key must never silently ship stub themes). Offline
    is reached ONLY by an explicit `provider="offline"` request.
    """
    if provider == AIProviderName.OFFLINE:
        return True
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


def get_summarization_provider_or_offline(name: str) -> SummarizationProvider:
    """C6-2: resolve a provider, degrading to the deterministic OFFLINE provider
    instead of crashing when no API key is configured.

    Guardrail (Odin): OFFLINE is a graceful degradation for dev/test/CI — NOT a
    silent production default. In production a missing key STILL raises, so the
    system never ships stub themes to real users without an explicit choice.
    Non-production falls back to OFFLINE so the pipeline runs end-to-end with no
    key (CI + local dev), emitting deterministic themes.
    """
    try:
        return get_summarization_provider(name)
    except ValueError:
        from app.config import settings

        if settings.environment == "production":
            raise
        logger.warning(
            "cube6.provider.offline_fallback requested=%s reason=no_api_key environment=%s",
            name,
            settings.environment,
        )
        return _SUMMARIZATION_PROVIDERS[AIProviderName.OFFLINE]()
