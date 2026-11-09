"""Official provider fee source adapters — bounded real fetch+parse where trustworthy.

Supported automatic parsers (STT only, explicit model/unit):
  - openai/whisper → whisper-1 @ usd_per_billable_audio_minute from developers.openai.com MD
  - aws/transcribe-batch → US East (N. Virginia) batch example @ usd_per_billable_audio_minute
  - xai/stt-rest → grok-voice-transcribe-2.0 REST $/hr converted to per-minute

NOT automatic (ambiguous / free-tier / negotiated / Theme02 token tables):
  - gemini STT (catalog pin gemini-flash-audio has no clear official row)
  - Theme02 token rates (model version drift; use manual approved import)
  - AWS free-tier minutes, negotiated Stripe fees, blended estimates

Weekly HTTP lookup cron remains NOT activated until host/config. This module
provides readiness mapping + parsers + optional public GET. Rejects ambiguous
data as rate_status=unknown and preserves prior known rates on merge.
"""

from __future__ import annotations

import re
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Callable

USER_AGENT = "eXeL-AI-Polling-fee-adapter/1.0 (+research; no billing credentials)"


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


@dataclass(frozen=True)
class OfficialRateQuote:
    provider: str
    model: str
    unit: str
    currency: str
    rate: Decimal | None
    rate_status: str  # known | unknown
    source_url: str
    checked_at: str
    effective_at: str | None
    evidence: str
    catalog_key: str  # maps to cost_ledger STT/THEME key when applicable

    def to_dict(self) -> dict:
        d = asdict(self)
        d["rate"] = str(self.rate) if self.rate is not None else None
        return d


FetchFn = Callable[[str], str]


def default_fetch(url: str, *, timeout: float = 20.0) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,text/markdown,*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read(800_000).decode("utf-8", "ignore")


def _unknown(
    *,
    provider: str,
    model: str,
    unit: str,
    source_url: str,
    evidence: str,
    catalog_key: str,
    checked_at: str | None = None,
) -> OfficialRateQuote:
    return OfficialRateQuote(
        provider=provider,
        model=model,
        unit=unit,
        currency="USD",
        rate=None,
        rate_status="unknown",
        source_url=source_url,
        checked_at=checked_at or _now_iso(),
        effective_at=None,
        evidence=evidence,
        catalog_key=catalog_key,
    )


# ── OpenAI Whisper (whisper-1) ──────────────────────────────────────────────

OPENAI_WHISPER_URL = "https://developers.openai.com/api/docs/models/whisper-1.md"


def parse_openai_whisper_markdown(text: str, *, source_url: str = OPENAI_WHISPER_URL) -> OfficialRateQuote:
    """Parse official whisper-1 MD pricing table: Cost | $0.006 | minute."""
    checked = _now_iso()
    if "whisper-1" not in text and "Whisper" not in text:
        return _unknown(
            provider="openai",
            model="whisper-1",
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence="document does not mention whisper-1/Whisper",
            catalog_key="whisper",
            checked_at=checked,
        )
    # Prefer table row: | Cost | $0.006 | minute |
    m = re.search(
        r"\|\s*Cost\s*\|\s*\$?\s*([0-9]*\.?[0-9]+)\s*\|\s*minute\s*\|",
        text,
        re.I,
    )
    if not m:
        m = re.search(r"\$\s*([0-9]*\.?[0-9]+)\s*/?\s*minute", text, re.I)
    if not m:
        return _unknown(
            provider="openai",
            model="whisper-1",
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence="no Cost$/minute cell found",
            catalog_key="whisper",
            checked_at=checked,
        )
    try:
        rate = Decimal(m.group(1))
    except InvalidOperation:
        return _unknown(
            provider="openai",
            model="whisper-1",
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence=f"unparseable rate token {m.group(1)!r}",
            catalog_key="whisper",
            checked_at=checked,
        )
    if rate <= 0:
        return _unknown(
            provider="openai",
            model="whisper-1",
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence="refusing non-positive rate (no free-credit assumption)",
            catalog_key="whisper",
            checked_at=checked,
        )
    return OfficialRateQuote(
        provider="openai",
        model="whisper-1",
        unit="usd_per_billable_audio_minute",
        currency="USD",
        rate=rate,
        rate_status="known",
        source_url=source_url,
        checked_at=checked,
        effective_at=None,
        evidence=f"parsed Cost ${rate} per minute from whisper-1 pricing table",
        catalog_key="whisper",
    )


# ── AWS Transcribe batch (US East example) ──────────────────────────────────

AWS_TRANSCRIBE_URL = "https://aws.amazon.com/transcribe/pricing/"


def parse_aws_transcribe_batch_html(text: str, *, source_url: str = AWS_TRANSCRIBE_URL) -> OfficialRateQuote:
    """Parse US East (N. Virginia) batch example: priced at $0.006 per minute.

    Does NOT treat Free Tier minutes as the billable rate. Region-scoped.
    """
    checked = _now_iso()
    # Reject if only free-tier language without paid example
    m = re.search(
        r"Batch transcription is priced at\s*\$([0-9]*\.?[0-9]+)\s*per\s*minute",
        text,
        re.I,
    )
    if not m:
        return _unknown(
            provider="aws",
            model="aws-transcribe-batch",
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence="batch priced-at $/minute example not found (JS tables may be absent)",
            catalog_key="aws",
            checked_at=checked,
        )
    try:
        rate = Decimal(m.group(1))
    except InvalidOperation:
        return _unknown(
            provider="aws",
            model="aws-transcribe-batch",
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence=f"unparseable batch rate {m.group(1)!r}",
            catalog_key="aws",
            checked_at=checked,
        )
    if rate <= 0:
        return _unknown(
            provider="aws",
            model="aws-transcribe-batch",
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence="refusing non-positive rate",
            catalog_key="aws",
            checked_at=checked,
        )
    region = "US East (N. Virginia)" if "N. Virginia" in text or "US East" in text else "region_unspecified_in_excerpt"
    return OfficialRateQuote(
        provider="aws",
        model="aws-transcribe-batch",
        unit="usd_per_billable_audio_minute",
        currency="USD",
        rate=rate,
        rate_status="known",
        source_url=source_url,
        checked_at=checked,
        effective_at=None,
        evidence=f"parsed batch ${rate}/min from pricing example ({region}); free-tier ignored",
        catalog_key="aws",
    )


# ── xAI STT REST ────────────────────────────────────────────────────────────

XAI_STT_URL = "https://docs.x.ai/developers/models/speech-to-text"


def parse_xai_stt_rest_html(text: str, *, source_url: str = XAI_STT_URL) -> OfficialRateQuote:
    """Parse REST $/hr for grok-voice-transcribe-2.0 → usd_per_billable_audio_minute."""
    checked = _now_iso()
    model = "grok-voice-transcribe-2.0"
    if "grok-voice-transcribe" not in text and "Speech to Text" not in text and "REST" not in text:
        return _unknown(
            provider="xai",
            model=model,
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence="page does not look like xAI STT pricing",
            catalog_key="grok",
            checked_at=checked,
        )
    # Prefer "REST pricing ... $0.10 / hr" or "REST (per hour) ... $0.10"
    # Live docs insert HTML comments between amount and unit: $0.10<!-- --> / hr
    m = re.search(
        r"REST(?:\s+pricing|\s*\(per hour\))[^$]{0,120}\$\s*([0-9]*\.?[0-9]+)(?:<!--.*?-->)?\s*/\s*hr",
        text,
        re.I | re.S,
    )
    if not m:
        m = re.search(r"REST pricing</strong></td><td>\$([0-9]*\.?[0-9]+)", text, re.I)
    if not m:
        return _unknown(
            provider="xai",
            model=model,
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence="REST $/hr not found (renderer may strip currency)",
            catalog_key="grok",
            checked_at=checked,
        )
    try:
        per_hour = Decimal(m.group(1))
    except InvalidOperation:
        return _unknown(
            provider="xai",
            model=model,
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence=f"unparseable REST $/hr {m.group(1)!r}",
            catalog_key="grok",
            checked_at=checked,
        )
    if per_hour <= 0:
        return _unknown(
            provider="xai",
            model=model,
            unit="usd_per_billable_audio_minute",
            source_url=source_url,
            evidence="refusing non-positive $/hr",
            catalog_key="grok",
            checked_at=checked,
        )
    per_min = (per_hour / Decimal(60)).quantize(Decimal("0.0000001"))
    return OfficialRateQuote(
        provider="xai",
        model=model,
        unit="usd_per_billable_audio_minute",
        currency="USD",
        rate=per_min,
        rate_status="known",
        source_url=source_url,
        checked_at=checked,
        effective_at=None,
        evidence=f"REST ${per_hour}/hr → ${per_min}/min; catalog pin whisper-large-v3 is NOT this model",
        catalog_key="grok",
    )


def parse_gemini_stt_reject_ambiguous(text: str, *, source_url: str = "https://ai.google.dev/gemini-api/docs/pricing") -> OfficialRateQuote:
    """Gemini catalog pin gemini-flash-audio has no trustworthy 1:1 official row → unknown."""
    return _unknown(
        provider="gemini",
        model="gemini-flash-audio",
        unit="usd_per_billable_audio_minute",
        source_url=source_url,
        evidence="no machine-readable rate for catalog pin gemini-flash-audio; refuse blended/free-tier guesses",
        catalog_key="gemini",
    )


# ── Manual approved import (not weekly auto) ────────────────────────────────

def manual_approved_rate_import(
    *,
    provider: str,
    model: str,
    unit: str,
    rate: Decimal,
    catalog_key: str,
    source_url: str,
    approver: str,
    evidence: str,
    currency: str = "USD",
    effective_at: str | None = None,
) -> OfficialRateQuote:
    """Human-approved rate record. Not used by weekly auto path."""
    if rate < 0:
        raise ValueError("rate must be >= 0; use explicit_zero path separately")
    if not approver.strip():
        raise ValueError("approver required for manual import")
    return OfficialRateQuote(
        provider=provider,
        model=model,
        unit=unit,
        currency=currency,
        rate=rate,
        rate_status="known" if rate > 0 or unit.endswith("_explicit_zero") else "known",
        source_url=source_url,
        checked_at=_now_iso(),
        effective_at=effective_at,
        evidence=f"MANUAL_APPROVED by {approver}: {evidence}",
        catalog_key=catalog_key,
    )


def merge_preserving_prior(
    prior: OfficialRateQuote | None,
    new: OfficialRateQuote,
) -> OfficialRateQuote:
    """If new is unknown/missing, keep prior known rate explicitly."""
    if new.rate_status == "known" and new.rate is not None:
        return new
    if prior is not None and prior.rate_status == "known" and prior.rate is not None:
        return OfficialRateQuote(
            provider=prior.provider,
            model=prior.model,
            unit=prior.unit,
            currency=prior.currency,
            rate=prior.rate,
            rate_status="known",
            source_url=prior.source_url,
            checked_at=new.checked_at,
            effective_at=prior.effective_at,
            evidence=(
                f"PRESERVED_PRIOR_KNOWN rate={prior.rate} from {prior.source_url}; "
                f"new lookup unknown: {new.evidence}"
            ),
            catalog_key=prior.catalog_key,
        )
    return new


# ── Fetch runners ───────────────────────────────────────────────────────────

def lookup_openai_whisper(*, fetch: FetchFn = default_fetch) -> OfficialRateQuote:
    try:
        body = fetch(OPENAI_WHISPER_URL)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return _unknown(
            provider="openai",
            model="whisper-1",
            unit="usd_per_billable_audio_minute",
            source_url=OPENAI_WHISPER_URL,
            evidence=f"transport error: {e}",
            catalog_key="whisper",
        )
    return parse_openai_whisper_markdown(body)


def lookup_aws_transcribe_batch(*, fetch: FetchFn = default_fetch) -> OfficialRateQuote:
    try:
        body = fetch(AWS_TRANSCRIBE_URL)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return _unknown(
            provider="aws",
            model="aws-transcribe-batch",
            unit="usd_per_billable_audio_minute",
            source_url=AWS_TRANSCRIBE_URL,
            evidence=f"transport error: {e}",
            catalog_key="aws",
        )
    return parse_aws_transcribe_batch_html(body)


def lookup_xai_stt_rest(*, fetch: FetchFn = default_fetch) -> OfficialRateQuote:
    try:
        body = fetch(XAI_STT_URL)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return _unknown(
            provider="xai",
            model="grok-voice-transcribe-2.0",
            unit="usd_per_billable_audio_minute",
            source_url=XAI_STT_URL,
            evidence=f"transport error: {e}",
            catalog_key="grok",
        )
    return parse_xai_stt_rest_html(body)


# Readiness: per provider/capability — not a single False placeholder
ADAPTER_READINESS: dict[str, dict[str, str]] = {
    "whisper": {
        "kind": "stt",
        "status": "auto_parser_ready",
        "source_url": OPENAI_WHISPER_URL,
        "model": "whisper-1",
        "unit": "usd_per_billable_audio_minute",
        "notes": "MD table Cost$/minute machine-readable",
    },
    "aws": {
        "kind": "stt",
        "status": "auto_parser_ready",
        "source_url": AWS_TRANSCRIBE_URL,
        "model": "aws-transcribe-batch",
        "unit": "usd_per_billable_audio_minute",
        "notes": "US-East batch example text; tier JS tables not required for T1 example",
    },
    "grok": {
        "kind": "stt",
        "status": "auto_parser_ready",
        "source_url": XAI_STT_URL,
        "model": "grok-voice-transcribe-2.0",
        "unit": "usd_per_billable_audio_minute",
        "notes": "REST $/hr→/min; catalog still pins whisper-large-v3 — do not silent overwrite",
    },
    "gemini": {
        "kind": "stt",
        "status": "manual_only",
        "source_url": "https://ai.google.dev/gemini-api/docs/pricing",
        "model": "gemini-flash-audio",
        "unit": "usd_per_billable_audio_minute",
        "notes": "no trustworthy 1:1 official row for catalog pin",
    },
    "theme02_openai": {
        "kind": "theme02",
        "status": "manual_only",
        "source_url": "https://developers.openai.com/api/docs/pricing",
        "model": "varies",
        "unit": "usd_per_1k_tokens",
        "notes": "token tables change by model; require manual approved import",
    },
    "theme02_gemini": {
        "kind": "theme02",
        "status": "manual_only",
        "source_url": "https://ai.google.dev/gemini-api/docs/pricing",
        "model": "varies",
        "unit": "usd_per_1k_tokens",
        "notes": "manual approved import only",
    },
    "theme02_grok": {
        "kind": "theme02",
        "status": "manual_only",
        "source_url": "https://docs.x.ai/developers/pricing",
        "model": "varies",
        "unit": "usd_per_1k_tokens",
        "notes": "manual approved import only",
    },
    "theme02_claude": {
        "kind": "theme02",
        "status": "manual_only",
        "source_url": "https://www.anthropic.com/pricing",
        "model": "varies",
        "unit": "usd_per_1k_tokens",
        "notes": "manual approved import only",
    },
}

ADAPTERS_IMPLEMENTED: list[str] = [
    k for k, v in ADAPTER_READINESS.items() if v["status"] == "auto_parser_ready"
]


def weekly_http_lookup_ready() -> bool:
    """True when at least one auto parser exists — cron still not activated."""
    return len(ADAPTERS_IMPLEMENTED) > 0


def readiness_report() -> dict:
    return {
        "weekly_cron_activated": False,
        "auto_parsers": list(ADAPTERS_IMPLEMENTED),
        "weekly_http_lookup_ready": weekly_http_lookup_ready(),
        "per_provider": dict(ADAPTER_READINESS),
        "denominator_stt": "usd_per_billable_audio_minute",
        "never_assume": ["free_tier_credits", "negotiated_stripe_fees", "blended_estimates_as_invoice"],
    }


def run_stt_lookups(*, fetch: FetchFn = default_fetch) -> dict[str, OfficialRateQuote]:
    """Run auto STT lookups. Does not mutate catalog or activate cron."""
    return {
        "whisper": lookup_openai_whisper(fetch=fetch),
        "aws": lookup_aws_transcribe_batch(fetch=fetch),
        "grok": lookup_xai_stt_rest(fetch=fetch),
        "gemini": parse_gemini_stt_reject_ambiguous(""),
    }
