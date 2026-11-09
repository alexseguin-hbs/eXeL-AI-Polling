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
    OFFLINE = "offline"  # Deterministic, no-key, no-network — CI + Dev-Sim + BYOK fallback (opt-in only)


# Cost per 1K tokens (input) by provider — used for cost logging
# Prices as of 2026-04: embedding + summarization models
AI_COST_RATES: dict[str, dict[str, float]] = {
    "openai": {"embed_per_1k": 0.00002, "summary_per_1k_input": 0.00015, "summary_per_1k_output": 0.0006},
    "gemini": {"embed_per_1k": 0.000004, "summary_per_1k_input": 0.000075, "summary_per_1k_output": 0.0003},
    # xAI grok-4.20-0309-non-reasoning, official $1.25 in / $2.50 out per 1M tokens (cached in $0.20/1M not modelled —
    # conservative): https://docs.x.ai/docs/pricing (updated 2026-10-10; read 2026-11-09, CRS-15.10). xAI has no
    # embedding API, so grok embeddings delegate to OpenAI text-embedding-3-small → OpenAI's embed rate.
    "grok": {"embed_per_1k": 0.00002, "summary_per_1k_input": 0.00125, "summary_per_1k_output": 0.0025},
    "claude": {"embed_per_1k": 0.00002, "summary_per_1k_input": 0.003, "summary_per_1k_output": 0.015},
}


class AICostTracker:
    """Tracks cumulative AI provider costs per pipeline run."""

    def __init__(self, provider: str):
        self.provider = provider
        self.total_calls = 0
        self.total_input_chars = 0
        self.total_output_chars = 0
        self.estimated_cost_usd = 0.0
        self.rate_unknown = provider not in AI_COST_RATES
        self.estimated_cost_usd_known = True  # flips False when any call lacks a rate

    def log_call(self, input_chars: int, output_chars: int) -> None:
        """Log a single AI call for cost tracking."""
        self.total_calls += 1
        self.total_input_chars += input_chars
        self.total_output_chars += output_chars

        rates = AI_COST_RATES.get(self.provider)
        if rates is None:
            # Unknown provider: do NOT fall back to openai pricing (would understate/misattribute).
            self.rate_unknown = True
            self.estimated_cost_usd_known = False
            return
        # Rough token estimate: ~4 chars per token (labeled estimate in cost_ledger)
        input_tokens = input_chars / 4
        output_tokens = output_chars / 4
        self.estimated_cost_usd += (
            (input_tokens / 1000) * rates["summary_per_1k_input"]
            + (output_tokens / 1000) * rates["summary_per_1k_output"]
        )

    def log_embed(self, input_chars: int) -> None:
        """Log an embedding call."""
        self.total_calls += 1
        self.total_input_chars += input_chars
        rates = AI_COST_RATES.get(self.provider)
        if rates is None:
            self.rate_unknown = True
            self.estimated_cost_usd_known = False
            return
        input_tokens = input_chars / 4
        self.estimated_cost_usd += (input_tokens / 1000) * rates["embed_per_1k"]

    def summary(self) -> dict:
        """Return cost summary for logging."""
        return {
            "provider": self.provider,
            "total_calls": self.total_calls,
            "total_input_chars": self.total_input_chars,
            "total_output_chars": self.total_output_chars,
            # None when rate unknown — callers must not treat missing rate as $0.
            "estimated_cost_usd": (
                None if not self.estimated_cost_usd_known else round(self.estimated_cost_usd, 6)
            ),
            "rate_unknown": self.rate_unknown,
            "rate_catalog_note": "AI_COST_RATES 2026-04; unknown provider not zero-filled",
        }


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
