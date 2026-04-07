"""STT provider factory — resolves provider by name with circuit breaker.

Mirrors Cube 6's factory pattern. Selects best available STT provider
for the given language, respecting priority and active status from
the stt_providers table.

Launch providers: OpenAI Whisper, Grok (xAI), Gemini (Google)
User selects STT provider at session creation (ai_provider field on Session).
"""

import asyncio

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cubes.cube3_voice.providers.base import (
    STTProviderName,
    STTProvider,
)
from app.cubes.cube3_voice.providers.aws_provider import AWSTranscribeSTT
from app.cubes.cube3_voice.providers.gemini_provider import GeminiSTT
from app.cubes.cube3_voice.providers.grok_provider import GrokSTT
from app.cubes.cube3_voice.providers.whisper_provider import WhisperSTT
from app.models.stt_provider import STTProviderConfig

logger = structlog.get_logger(__name__)

# In-memory provider instances (singletons) — protected by lock for thread safety
_providers: dict[str, STTProvider] = {}
_provider_lock = asyncio.Lock()

# Map AI provider names (from session.ai_provider) to STT provider names
_AI_TO_STT_MAP = {
    "openai": "whisper",
    "grok": "grok",
    "gemini": "gemini",
    "aws": "aws",
}


def _get_provider_instance_sync(name: str) -> STTProvider:
    """Get or create a provider instance by name (non-locked, internal use)."""
    if name not in _providers:
        provider_name = STTProviderName(name)
        if provider_name == STTProviderName.WHISPER:
            _providers[name] = WhisperSTT()
        elif provider_name == STTProviderName.GROK:
            _providers[name] = GrokSTT()
        elif provider_name == STTProviderName.GEMINI:
            _providers[name] = GeminiSTT()
        elif provider_name == STTProviderName.AWS:
            _providers[name] = AWSTranscribeSTT()
        else:
            raise ValueError(f"STT provider '{name}' not yet implemented")
    return _providers[name]


def get_stt_provider(name: str) -> STTProvider:
    """Resolve an STTProvider by provider name string (sync, for non-async callers).

    Accepts both STT names (whisper, grok, gemini) and AI provider
    names (openai, grok, gemini) for convenience.
    """
    stt_name = _AI_TO_STT_MAP.get(name, name)
    return _get_provider_instance_sync(stt_name)


async def get_stt_provider_safe(name: str) -> STTProvider:
    """Thread-safe async provider resolution — uses lock to prevent race on init."""
    stt_name = _AI_TO_STT_MAP.get(name, name)
    if stt_name in _providers:
        return _providers[stt_name]  # Fast path: already initialized
    async with _provider_lock:
        return _get_provider_instance_sync(stt_name)


async def select_stt_provider(
    db: AsyncSession,
    language_code: str,
    preferred_provider: str | None = None,
) -> STTProvider:
    """Select best STT provider for a language.

    Priority:
      1. If preferred_provider specified (from session.ai_provider), use it
      2. Query active providers from DB ordered by priority
      3. Check language support for each candidate
      4. Fallback to Whisper if no match

    Args:
        db: Database session
        language_code: ISO language code (e.g., "en", "es", "ja")
        preferred_provider: Provider name from session config (ai_provider field)

    Returns:
        STTProvider instance ready for transcription
    """
    lang = language_code.lower().split("-")[0]

    # If preferred provider specified, try it first
    if preferred_provider:
        try:
            provider = get_stt_provider(preferred_provider)
            if provider.supports_language(lang):
                logger.debug(
                    "cube3.stt.preferred_provider_selected",
                    provider=preferred_provider,
                    language=lang,
                )
                return provider
        except ValueError:
            logger.warning(
                "cube3.stt.preferred_provider_unavailable",
                provider=preferred_provider,
            )

    # Query active providers from DB ordered by priority
    result = await db.execute(
        select(STTProviderConfig)
        .where(STTProviderConfig.is_active.is_(True))
        .order_by(STTProviderConfig.priority)
    )
    configs = list(result.scalars().all())

    for config in configs:
        supported = config.supported_languages or []
        if lang in supported or not supported:
            try:
                provider = _get_provider_instance_sync(config.name)
                if provider.supports_language(lang):
                    logger.debug(
                        "cube3.stt.provider_selected",
                        provider=config.name,
                        language=lang,
                        priority=config.priority,
                    )
                    return provider
            except ValueError:
                logger.warning(
                    "cube3.stt.provider_not_implemented",
                    provider=config.name,
                )
                continue

    # Fallback: Whisper (OpenAI) as universal default
    logger.info("cube3.stt.fallback_to_whisper", language=lang)
    return _get_provider_instance_sync("whisper")
