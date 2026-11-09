"""Cube 8 — priced poll options (what a creator pays when creating a Moderator Paid / Cost Split poll).

PRICE = TRACKED COST × MARGIN MULTIPLIER, then Stripe's card fee is passed through, then the $11.11 floor.

  • Tracked cost comes from the same bundled provider catalog the cost ledger uses (cost_ledger.py:
    THEME_RATES_USD_PER_1K + STT_RATES_USD_PER_MIN, catalog RATE_CATALOG_VERSION). No new rates are invented.
  • MARGIN — ONE config value: settings.pricing_margin_multiplier (env PRICING_MARGIN_MULTIPLIER), default "1.5".
        1.5 → "cost + 50% markup"          (price = cost × 1.5;  gross margin 33.3%)
        2.0 → "50% gross margin"           (price = cost / 0.5;  markup 100%)
    The owner has NOT yet said which "50% margin" means; 1.5 is the conservative default. Every quote and every
    Checkout carries the multiplier in its metadata so the choice is auditable.
  • Stripe fee (US card, standard public rate 2.9% + $0.30) is grossed up so the platform nets cost × margin.
    Negotiated Stripe fees are never assumed.
  • Floor: $11.11 for Moderator Paid (existing product rule); Cost Split = 50% creator (Checkout at creation),
    50% / N per participant (Stripe minimum $0.50 each).

Option keys (all priced from the catalog):
    summaries_333 / summaries_111 / summaries_33  — per-response AI reductions (always on in the pipeline)
    theme01 / theme02                              — automatic Theme01 classification + Theme02 clustering/labels
    voice_stt                                      — speech-to-text for the voice share of participants
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from decimal import ROUND_CEILING, Decimal
from typing import Any

from app.config import settings
from app.cubes.cube8_tokens.cost_ledger import (
    RATE_CATALOG_VERSION,
    STT_RATES_USD_PER_MIN,
    THEME_RATES_USD_PER_1K,
    D,
)

MODERATOR_MIN_FEE_CENTS = 1111
STRIPE_MIN_CHARGE_CENTS = 50
STRIPE_PCT = D("0.029")
STRIPE_FIXED_USD = D("0.30")
TOKENS_PER_WORD = D("1.33")
WORDS_PER_CHAR = D("0.18")            # ≈ 5.5 chars per English word incl. space
DEFAULT_WORDS_PER_RESPONSE = 111      # Cost Estimate panel assumption (fee_catalog.UI_ASSUMPTIONS)
VOICE_MINUTES_PER_VOICE_USER = D("0.74")
PROMPT_OVERHEAD_TOKENS = 60
THEME02_LABEL_OUTPUT_TOKENS = (3 + 6 + 9) * 24   # Theme2_3 / 2_6 / 2_9 labels + summaries
THEME02_LABEL_SAMPLE_RESPONSES = 100
MAX_PARTICIPANTS_QUOTE = 1_000_000

ALL_OPTIONS = ("summaries_333", "summaries_111", "summaries_33", "theme01", "theme02", "voice_stt")
DEFAULT_OPTIONS = ("summaries_333", "summaries_111", "summaries_33", "theme01", "theme02")
VALID_TIERS = ("moderator_paid", "cost_split")


def margin_multiplier() -> Decimal:
    """The single margin knob. Invalid / < 1 values fall back to 1.5 (never price below cost)."""
    raw = str(getattr(settings, "pricing_margin_multiplier", "") or "1.5").strip()
    try:
        m = D(raw)
    except Exception:  # noqa: BLE001
        return D("1.5")
    return m if m >= 1 else D("1.5")


def margin_label(m: Decimal) -> str:
    if m == D("1.5"):
        return "cost + 50% markup (×1.5)"
    if m == D("2"):
        return "50% gross margin (×2.0)"
    return f"cost × {m}"


def _theme_rate(provider: str, key: str) -> Decimal:
    table = THEME_RATES_USD_PER_1K.get((provider or "").lower()) or THEME_RATES_USD_PER_1K["openai"]
    return D(table.get(key, 0))


def _cents_ceil(usd: Decimal) -> int:
    return int((usd * 100).quantize(D("1"), rounding=ROUND_CEILING))


@dataclass
class PollQuoteInput:
    pricing_tier: str = "moderator_paid"
    participants: int = 100
    responses_per_participant: int = 1
    max_response_length: int = 3333
    ai_provider: str = "openai"
    stt_provider: str = "whisper"
    voice_share: float = 0.0
    options: tuple[str, ...] = field(default_factory=lambda: DEFAULT_OPTIONS)


def quote_poll(q: PollQuoteInput) -> dict[str, Any]:
    tier = q.pricing_tier if q.pricing_tier in VALID_TIERS else "moderator_paid"
    n = max(1, min(int(q.participants or 1), MAX_PARTICIPANTS_QUOTE))
    rpp = max(1, min(int(q.responses_per_participant or 1), 9))
    responses = n * rpp
    opts = tuple(o for o in ALL_OPTIONS if o in set(q.options or ()))
    words = min(DEFAULT_WORDS_PER_RESPONSE, max(1, int(D(q.max_response_length or 3333) * WORDS_PER_CHAR)))
    in_tok = D(words) * TOKENS_PER_WORD + PROMPT_OVERHEAD_TOKENS
    prov = (q.ai_provider or "openai").lower()
    r_in, r_out, r_emb = (_theme_rate(prov, "summary_per_1k_input"), _theme_rate(prov, "summary_per_1k_output"),
                          _theme_rate(prov, "embed_per_1k"))

    lines: list[dict[str, Any]] = []

    def add(key: str, label: str, usd: Decimal, basis: str) -> None:
        lines.append({"option": key, "label": label, "cost_usd": str(usd.quantize(D("0.000001"))), "basis": basis})

    for tier_words, key in ((333, "summaries_333"), (111, "summaries_111"), (33, "summaries_33")):
        if key in opts:
            out_tok = D(min(tier_words, words)) * TOKENS_PER_WORD
            usd = D(responses) * (in_tok * r_in + out_tok * r_out) / 1000
            add(key, f"{tier_words}-word AI summary", usd, f"{responses} responses × ({in_tok:.0f} in + {out_tok:.0f} out tok) @ {prov}")
    if "theme01" in opts:
        usd = D(responses) * (in_tok * r_in + 10 * r_out) / 1000
        add("theme01", "Theme01 auto-classification", usd, f"{responses} responses × {in_tok:.0f} in tok @ {prov}")
    if "theme02" in opts:
        sample = min(responses, THEME02_LABEL_SAMPLE_RESPONSES)
        usd = (D(responses) * in_tok * r_emb + D(sample) * in_tok * r_in + D(THEME02_LABEL_OUTPUT_TOKENS) * r_out) / 1000
        add("theme02", "Theme02 clustering + labels (3/6/9)", usd, f"embed {responses} + label sample {sample} @ {prov}")
    if "voice_stt" in opts:
        share = D(str(max(0.0, min(float(q.voice_share or 0.0), 1.0)))) or D("0.5")
        stt = (q.stt_provider or "whisper").lower()
        rate = STT_RATES_USD_PER_MIN.get(stt, STT_RATES_USD_PER_MIN["whisper"])
        minutes = D(n) * share * VOICE_MINUTES_PER_VOICE_USER * rpp
        add("voice_stt", "Voice speech-to-text", minutes * rate, f"{minutes:.2f} audio min @ {stt} ${rate}/min")

    cost = sum((D(l["cost_usd"]) for l in lines), D("0"))
    m = margin_multiplier()
    priced = cost * m
    grossed = (priced + STRIPE_FIXED_USD) / (1 - STRIPE_PCT)   # pass Stripe's card fee through
    computed_cents = _cents_ceil(grossed)
    total_cents = max(MODERATOR_MIN_FEE_CENTS, computed_cents)

    out: dict[str, Any] = {
        "pricing_tier": tier,
        "participants": n,
        "responses_per_participant": rpp,
        "options": list(opts),
        "lines": lines,
        "tracked_cost_usd": str(cost.quantize(D("0.000001"))),
        "margin_multiplier": str(m),
        "margin_label": margin_label(m),
        "margin_decision_pending": True,   # owner has not chosen 1.5× vs 2×; flip when decided
        "stripe_fee_passthrough": "2.9% + $0.30 (US card, public rate)",
        "computed_price_cents": computed_cents,
        "floor_cents": MODERATOR_MIN_FEE_CENTS,
        "total_cents": total_cents,
        "currency": "usd",
        "catalog_version": RATE_CATALOG_VERSION,
    }
    if tier == "cost_split":
        mod = int(math.ceil(total_cents / 2))
        per = max(STRIPE_MIN_CHARGE_CENTS, int(math.ceil((total_cents - mod) / n)))
        out.update({"creator_due_cents": mod, "participant_share_cents": per})
    else:
        out.update({"creator_due_cents": total_cents, "participant_share_cents": 0})
    return out


def _attr_int(obj, name: str, default: int) -> int:
    v = getattr(obj, name, None)
    return v if isinstance(v, int) and not isinstance(v, bool) and v > 0 else default


def _attr_str(obj, name: str, default: str) -> str:
    v = getattr(obj, name, None)
    return v if isinstance(v, str) and v else default


def quote_for_session(session, *, participants: int | None = None, options: list[str] | None = None,
                      voice_share: float | None = None) -> dict[str, Any]:
    """Authoritative server-side quote from the stored session settings (never trusts a client price)."""
    voice = float(voice_share) if voice_share is not None else (0.5 if getattr(session, "realtime_stt_enabled", False) is True else 0.0)
    opts = tuple(options) if options else (DEFAULT_OPTIONS + (("voice_stt",) if voice > 0 else ()))
    return quote_poll(PollQuoteInput(
        pricing_tier=_attr_str(session, "pricing_tier", "moderator_paid"),
        participants=participants or _attr_int(session, "max_participants", 100),
        responses_per_participant=_attr_int(session, "max_cycles", 1),
        max_response_length=_attr_int(session, "max_response_length", 3333),
        ai_provider=_attr_str(session, "ai_provider", "openai"),
        stt_provider=_attr_str(session, "stt_provider", "whisper"),
        voice_share=voice,
        options=opts,
    ))
