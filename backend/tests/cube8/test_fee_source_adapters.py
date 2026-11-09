"""Fee source adapters — fixture parsers + mocked transport; optional live GET.

Not invoice reconciliation. Unknown stays None. Prior known preserved.
"""
from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest

from app.cubes.cube8_tokens.fee_source_adapters import (
    ADAPTERS_IMPLEMENTED,
    OfficialRateQuote,
    merge_preserving_prior,
    parse_aws_transcribe_batch_html,
    parse_gemini_stt_reject_ambiguous,
    parse_openai_whisper_markdown,
    parse_xai_stt_rest_html,
    readiness_report,
    run_stt_lookups,
    weekly_http_lookup_ready,
)

FX = Path(__file__).resolve().parent / "fixtures" / "fee_sources"


def test_readiness_not_placeholder_false_only():
    r = readiness_report()
    assert r["weekly_cron_activated"] is False
    assert weekly_http_lookup_ready() is True
    assert "whisper" in ADAPTERS_IMPLEMENTED
    assert "aws" in ADAPTERS_IMPLEMENTED
    assert "grok" in ADAPTERS_IMPLEMENTED
    assert r["per_provider"]["gemini"]["status"] == "manual_only"
    assert r["per_provider"]["theme02_openai"]["status"] == "manual_only"


def test_parse_openai_whisper_fixture():
    text = (FX / "openai_whisper-1.md").read_text()
    q = parse_openai_whisper_markdown(text)
    assert q.rate_status == "known"
    assert q.rate == Decimal("0.006")
    assert q.unit == "usd_per_billable_audio_minute"
    assert q.model == "whisper-1"
    assert q.catalog_key == "whisper"


def test_parse_aws_batch_fixture():
    text = (FX / "aws_transcribe_pricing.excerpt.html").read_text()
    q = parse_aws_transcribe_batch_html(text)
    assert q.rate_status == "known"
    assert q.rate == Decimal("0.006")
    assert "free-tier ignored" in q.evidence.lower() or "free-tier" in q.evidence.lower()


def test_parse_xai_stt_stable_fixture():
    text = (FX / "xai_stt_pricing.stable.html").read_text()
    q = parse_xai_stt_rest_html(text)
    assert q.rate_status == "known"
    assert q.model == "grok-voice-transcribe-2.0"
    # $0.10/hr → per minute
    assert q.rate == (Decimal("0.10") / Decimal(60)).quantize(Decimal("0.0000001"))


def test_gemini_ambiguous_rejected():
    text = (FX / "gemini_pricing_ambiguous.html").read_text()
    q = parse_gemini_stt_reject_ambiguous(text)
    assert q.rate_status == "unknown"
    assert q.rate is None


def test_ambiguous_openai_missing_rate_unknown():
    q = parse_openai_whisper_markdown("# Whisper\nNo price here\n")
    assert q.rate_status == "unknown"
    assert q.rate is None


def test_merge_preserves_prior_known():
    prior = OfficialRateQuote(
        provider="openai",
        model="whisper-1",
        unit="usd_per_billable_audio_minute",
        currency="USD",
        rate=Decimal("0.006"),
        rate_status="known",
        source_url="prior",
        checked_at="2026-01-01T00:00:00Z",
        effective_at=None,
        evidence="prior",
        catalog_key="whisper",
    )
    new = parse_openai_whisper_markdown("not a pricing page")
    merged = merge_preserving_prior(prior, new)
    assert merged.rate == Decimal("0.006")
    assert "PRESERVED_PRIOR_KNOWN" in merged.evidence


def test_run_stt_lookups_mocked_transport():
    bodies = {
        "https://developers.openai.com/api/docs/models/whisper-1.md": (FX / "openai_whisper-1.md").read_text(),
        "https://aws.amazon.com/transcribe/pricing/": (FX / "aws_transcribe_pricing.excerpt.html").read_text(),
        "https://docs.x.ai/developers/models/speech-to-text": (FX / "xai_stt_pricing.stable.html").read_text(),
    }

    def fetch(url: str) -> str:
        return bodies[url]

    out = run_stt_lookups(fetch=fetch)
    assert out["whisper"].rate_status == "known"
    assert out["aws"].rate_status == "known"
    assert out["grok"].rate_status == "known"
    assert out["gemini"].rate_status == "unknown"


def test_transport_error_unknown_not_zero():
    def boom(url: str) -> str:
        raise TimeoutError("offline")

    from app.cubes.cube8_tokens.fee_source_adapters import lookup_openai_whisper

    q = lookup_openai_whisper(fetch=boom)
    assert q.rate is None
    assert q.rate_status == "unknown"


@pytest.mark.optional_live
def test_optional_live_openai_whisper_get():
    """Safe public GET — skip on network failure; never invent success."""
    from app.cubes.cube8_tokens.fee_source_adapters import lookup_openai_whisper

    try:
        q = lookup_openai_whisper()
    except Exception as e:  # pragma: no cover
        pytest.skip(f"live transport unavailable: {e}")
    # Accept known OR unknown (page shape change) — never fabricate
    assert q.rate_status in ("known", "unknown")
    if q.rate_status == "known":
        assert q.rate == Decimal("0.006")
