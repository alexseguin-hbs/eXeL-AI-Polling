"""Official provider fee source adapters — INTERFACE ONLY (not activated).

Weekly HTTP lookup is an explicit deployment blocker until each adapter:
- documents its official source URL
- validates parsed rate/unit/currency/model
- returns RateStatus.UNKNOWN (not 0) on parse failure
- never overwrites negotiated Stripe fees

Do not call these from production paths until adapters are implemented and reviewed.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol


@dataclass(frozen=True)
class OfficialRateQuote:
    provider: str
    model: str
    unit: str  # e.g. usd_per_billable_audio_minute | usd_per_1k_tokens
    currency: str
    rate: Decimal | None
    rate_status: str  # known | unknown
    source_url: str
    checked_at: str
    evidence: str


class FeeSourceAdapter(Protocol):
    provider: str
    official_source_url: str

    async def fetch_quote(self) -> OfficialRateQuote:  # pragma: no cover - interface
        ...


ADAPTERS_IMPLEMENTED: list[str] = []  # empty until real adapters land


def weekly_http_lookup_ready() -> bool:
    """False until official adapters exist — prevents fake completion claims."""
    return len(ADAPTERS_IMPLEMENTED) > 0
