"""Provider factory — resolves AI provider by name with circuit breaker failover.

Failover chain: requested provider -> next available -> next available.
If all fail, raises ValueError.
"""

import logging

import structlog

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
from app.core.exceptions import AIProviderUnavailableError

logger = structlog.get_logger(__name__)  # keyword fields need structlog; stdlib raised TypeError

# Failover order (CRS-09.08.06, 2026-11-09): xAI/Grok is the primary funded vendor (owner t159u-t160u), then OpenAI,
# then Gemini (credits may be low — its circuit opens after a credit/auth error), then Claude. The requested provider
# always goes first; this order fills in the rest of the chain.
_FAILOVER_ORDER = [
    AIProviderName.GROK, AIProviderName.OPENAI,
    AIProviderName.GEMINI, AIProviderName.CLAUDE,
]


def _num(value, default):
    """A settings number, tolerating test doubles (MagicMock) and blanks."""
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) else default

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
        primary = _FAILOVER_ORDER[0]

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

    raise AIProviderUnavailableError(
        f"No embedding provider available. Requested: '{name}', "
        f"checked: {[p.value for p in chain]}. Configure at least one API key."
    )


def get_summarization_provider(name: str) -> SummarizationProvider:
    """Resolve a SummarizationProvider by name with failover.

    Key-level failover picks the first keyed vendor in the chain (unchanged). Since CRS-09.08.01 the result is a
    MultiVendorSummarizer over EVERY keyed vendor in chain order, so a runtime error, timeout or exhausted credit on
    the primary moves the call to the next vendor instead of failing it. OFFLINE is never wrapped or mixed in.
    """
    from app.cubes.cube6_ai.providers.multi_vendor import MultiVendorSummarizer

    chain = _get_failover_chain(name)
    vendors: list[SummarizationProvider] = []
    for provider in chain:
        if not _has_api_key(provider):
            continue
        cls = _SUMMARIZATION_PROVIDERS.get(provider)
        if not cls:
            continue
        if provider == AIProviderName.OFFLINE:
            return cls()
        try:
            vendors.append(cls())
        except Exception as e:  # a vendor SDK that cannot even construct is skipped, never fatal
            logger.warning("cube6.provider.init_failed", provider=provider.value, error=type(e).__name__)
            continue
    if vendors:
        if vendors[0].provider_name.value != name:
            logger.info(
                "cube6.provider.failover",
                requested=name,
                resolved=vendors[0].provider_name.value,
                type="summarization",
            )
        return MultiVendorSummarizer(
            vendors,
            timeout_s=_num(getattr(settings, "ai_call_timeout_s", None), 20.0),
            hedge_after_s=_num(getattr(settings, "ai_hedge_after_s", None), 2.5),
            max_inflight=_num(getattr(settings, "ai_vendor_max_inflight", None), 48),
            mode=v if isinstance(v := getattr(settings, "ai_vendor_mode", None), str) else "speed_rr",
            race_when_idle=r if isinstance(r := getattr(settings, "ai_race_when_idle", None), bool) else True,
        )

    raise AIProviderUnavailableError(
        f"No summarization provider available. Requested: '{name}', "
        f"checked: {[p.value for p in chain]}. Configure at least one API key."
    )


def get_summarization_provider_or_offline(name: str) -> SummarizationProvider:
    """C6-2: resolve a provider, degrading to the deterministic OFFLINE provider
    instead of crashing when no API key is configured.

    Guardrail (Odin): OFFLINE is a graceful degradation for dev/test/CI — NOT a
    silent production default. Outside an explicit development/test environment a
    missing key STILL raises, so the system never ships stub themes to real users
    without an explicit choice. Dev/test falls back to OFFLINE so the pipeline runs
    end-to-end with no key (CI + local dev), emitting deterministic themes.
    """
    try:
        return get_summarization_provider(name)
    except AIProviderUnavailableError:
        from app.config import settings

        if not settings.is_dev_or_test:
            raise
        logger.warning(
            "cube6.provider.offline_fallback requested=%s reason=no_api_key environment=%s",
            name,
            settings.environment,
        )
        return _SUMMARIZATION_PROVIDERS[AIProviderName.OFFLINE]()


# ---------------------------------------------------------------------------
# Addendum 4 (AsM round 1, Krishna + Aset, 2026-10-07): a SIMULATION never silently spends money.
# ---------------------------------------------------------------------------
# A simulation session (session_type == "simulation", the Admin Simulation Console) generates its own responses
# and voters; summarizing or theming them through a paid provider is a cost nobody approved. So Phase A and
# /ai/run resolve the provider through `provider_for_session`: a simulation runs on the deterministic OFFLINE
# provider unless an HI-approved cost estimate is recorded for it. Real sessions are unchanged.
#
# HOOK for the later AI-call method selector (Offline / Batch API / Realtime, each with a cost estimate and HI
# approval before any provider call): that selector records its approval on the session as `ai_cost_approval`
# ({"method": ..., "estimate_usd": ..., "approved_by": ...}) and `simulation_cost_approved` starts returning True.
# Until that field exists, no simulation can reach a paid provider.

SIMULATION_SESSION_TYPE = "simulation"


def simulation_cost_approved(session) -> bool:
    """True only when an HI-approved cost estimate is recorded for this session (the selector's hook)."""
    approval = getattr(session, "ai_cost_approval", None)
    if not isinstance(approval, dict):
        return False
    return bool(approval.get("approved_by")) and approval.get("estimate_usd") is not None


def provider_for_session(session, requested: str | None = None) -> str:
    """The provider name a session may use. A simulation without an approved estimate → "offline"."""
    name = requested or getattr(session, "ai_provider", None) or settings.default_ai_provider or AIProviderName.OPENAI.value
    if getattr(session, "session_type", None) == SIMULATION_SESSION_TYPE and not simulation_cost_approved(session):
        if name != AIProviderName.OFFLINE.value:
            logger.info(
                "cube6.provider.simulation_offline",
                session_id=str(getattr(session, "id", "")),
                requested=name,
                reason="simulation_without_hi_approved_cost_estimate",
            )
        return AIProviderName.OFFLINE.value
    return name


def get_session_summarization_provider(session, requested: str | None = None) -> SummarizationProvider:
    """`get_summarization_provider_or_offline` behind the simulation cost guard."""
    return get_summarization_provider_or_offline(provider_for_session(session, requested))
