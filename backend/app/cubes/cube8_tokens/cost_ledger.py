"""Session/project cost ledger — Theme02 (Cube6) + STT (Cube3) attribution.

Correctness rules (t57u / t61u):
  * Decimal amounts + explicit currency (default USD).
  * Versioned rate catalog; unknown provider/model rates are flagged ``unknown``, never coerced to $0.
  * Distinguish estimate vs reconciled (provider invoice / Stripe charge). Never claim invoice-accurate
    unless ``reconcile_status == \"reconciled\"`` against genuine charges.
  * Session + optional scope_ref (project) isolation; no cross-session mixing.
  * Does not fabricate usage — callers pass recorded VoiceResponse / AICostLog rows or usage events.

Pricing activation (cost+50% vs 50% gross margin) stays OFF — see margin_policy.py.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Any, Iterable, Mapping

# ---------------------------------------------------------------------------
# Money
# ---------------------------------------------------------------------------

TWOPLACE = Decimal("0.01")
SIXPLACE = Decimal("0.000001")


def D(value: Any) -> Decimal:
    """Coerce to Decimal without float binary noise when given str/int/Decimal."""
    if isinstance(value, Decimal):
        return value
    if value is None:
        raise ValueError("cannot coerce None to Decimal")
    if isinstance(value, float):
        # Round-trip via str to avoid binary float artifacts in tests/fixtures.
        return Decimal(str(value))
    return Decimal(value)


def money(value: Any, places: Decimal = TWOPLACE) -> Decimal:
    return D(value).quantize(places, rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Rate catalog (versioned). Unknown keys → RateLookup.unknown, never 0.
# ---------------------------------------------------------------------------

RATE_CATALOG_VERSION = "2026-04.v1"  # mirrors provider pricing notes already in-repo
CURRENCY_USD = "USD"


# STT: USD per minute of audio (from cube3 providers/base.py STT_COST_RATES)
STT_RATES_USD_PER_MIN: dict[str, Decimal] = {
    "whisper": D("0.006"),
    "grok": D("0.006"),
    "gemini": D("0.00016"),
    "aws": D("0.024"),
}

# Theme02 / Cube6 AI: USD per 1K tokens (from cube6 providers/base.py AI_COST_RATES)
THEME_RATES_USD_PER_1K: dict[str, dict[str, Decimal]] = {
    "openai": {
        "embed_per_1k": D("0.00002"),
        "summary_per_1k_input": D("0.00015"),
        "summary_per_1k_output": D("0.0006"),
        "model": D("0"),  # model id is metadata, not a rate
    },
    "gemini": {
        "embed_per_1k": D("0.000004"),
        "summary_per_1k_input": D("0.000075"),
        "summary_per_1k_output": D("0.0003"),
    },
    "grok": {
        "embed_per_1k": D("0.00002"),
        "summary_per_1k_input": D("0.0005"),
        "summary_per_1k_output": D("0.002"),
    },
    "claude": {
        "embed_per_1k": D("0.00002"),
        "summary_per_1k_input": D("0.003"),
        "summary_per_1k_output": D("0.015"),
    },
    # offline is free — explicit zero rate, not "unknown"
    "offline": {
        "embed_per_1k": D("0"),
        "summary_per_1k_input": D("0"),
        "summary_per_1k_output": D("0"),
    },
}

# Model pins used for attribution labels (not inventing provider usage)
STT_MODEL_PINS: dict[str, str] = {
    "whisper": "whisper-1",
    "grok": "whisper-large-v3",
    "gemini": "gemini-flash-audio",
    "aws": "aws-transcribe-batch",
}


class RateStatus(str, Enum):
    KNOWN = "known"
    UNKNOWN = "unknown"
    EXPLICIT_ZERO = "explicit_zero"  # offline / free — zero is intentional


@dataclass(frozen=True)
class RateLookup:
    status: RateStatus
    rate: Decimal | None
    unit: str
    catalog_version: str = RATE_CATALOG_VERSION
    provider: str = ""
    model: str | None = None
    detail: str = ""


def lookup_stt_rate(provider: str) -> RateLookup:
    key = (provider or "").strip().lower()
    model = STT_MODEL_PINS.get(key)
    if key in STT_RATES_USD_PER_MIN:
        rate = STT_RATES_USD_PER_MIN[key]
        status = RateStatus.EXPLICIT_ZERO if rate == 0 else RateStatus.KNOWN
        return RateLookup(status=status, rate=rate, unit="usd_per_min", provider=key, model=model)
    return RateLookup(
        status=RateStatus.UNKNOWN,
        rate=None,
        unit="usd_per_min",
        provider=key or "?",
        model=None,
        detail=f"No STT rate for provider={provider!r} in catalog {RATE_CATALOG_VERSION}",
    )


def lookup_theme_rates(provider: str) -> RateLookup:
    """Return known/unknown for Theme02 provider; rate payload in detail via theme_rate_table."""
    key = (provider or "").strip().lower()
    if key in THEME_RATES_USD_PER_1K:
        # Use summary input as the representative scalar for RateLookup.rate
        table = THEME_RATES_USD_PER_1K[key]
        rep = table.get("summary_per_1k_input", D("0"))
        status = RateStatus.EXPLICIT_ZERO if key == "offline" else RateStatus.KNOWN
        return RateLookup(status=status, rate=rep, unit="usd_per_1k_tokens", provider=key)
    return RateLookup(
        status=RateStatus.UNKNOWN,
        rate=None,
        unit="usd_per_1k_tokens",
        provider=key or "?",
        detail=f"No Theme02 AI rate for provider={provider!r} in catalog {RATE_CATALOG_VERSION}",
    )


def theme_rate_table(provider: str) -> dict[str, Decimal] | None:
    key = (provider or "").strip().lower()
    return THEME_RATES_USD_PER_1K.get(key)


# ---------------------------------------------------------------------------
# Line items + session rollup
# ---------------------------------------------------------------------------


class CostKind(str, Enum):
    STT = "stt"
    THEME02 = "theme02"
    OTHER = "other"


class ReconcileStatus(str, Enum):
    ESTIMATED = "estimated"  # from usage × catalog rates or stored estimates
    RECORDED_ESTIMATE = "recorded_estimate"  # from AICostLog / VoiceResponse.cost_usd (still estimate)
    RECONCILED = "reconciled"  # matched to genuine provider/Stripe charge
    UNRECONCILED = "unreconciled"  # has estimate, no matching charge yet
    UNKNOWN_USAGE = "unknown_usage"  # missing duration/tokens
    UNKNOWN_RATE = "unknown_rate"


@dataclass
class CostLine:
    kind: CostKind
    provider: str
    model: str | None
    quantity: Decimal | None  # minutes or tokens as appropriate
    quantity_unit: str
    amount_usd: Decimal | None  # None when unknown rate/usage
    currency: str
    rate_status: RateStatus
    reconcile_status: ReconcileStatus
    catalog_version: str
    session_id: str
    scope_ref: str | None = None
    attempt: int = 1
    billed_retry: bool = False
    failure: bool = False
    source: str = ""  # e.g. voice_responses / ai_cost_logs / fixture
    notes: str = ""
    meta: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind.value,
            "provider": self.provider,
            "model": self.model,
            "quantity": str(self.quantity) if self.quantity is not None else None,
            "quantity_unit": self.quantity_unit,
            "amount_usd": str(self.amount_usd) if self.amount_usd is not None else None,
            "currency": self.currency,
            "rate_status": self.rate_status.value,
            "reconcile_status": self.reconcile_status.value,
            "catalog_version": self.catalog_version,
            "session_id": self.session_id,
            "scope_ref": self.scope_ref,
            "attempt": self.attempt,
            "billed_retry": self.billed_retry,
            "failure": self.failure,
            "source": self.source,
            "notes": self.notes,
            "meta": self.meta,
        }


@dataclass
class SessionCostRollup:
    session_id: str
    scope_ref: str | None
    currency: str
    lines: list[CostLine]
    estimated_total_usd: Decimal | None
    reconciled_total_usd: Decimal | None
    unknown_rate_count: int
    unknown_usage_count: int
    failure_count: int
    billed_retry_count: int
    catalog_version: str
    invoice_accurate: bool  # True only when all billable lines are reconciled
    warnings: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "session_id": self.session_id,
            "scope_ref": self.scope_ref,
            "currency": self.currency,
            "estimated_total_usd": str(self.estimated_total_usd) if self.estimated_total_usd is not None else None,
            "reconciled_total_usd": str(self.reconciled_total_usd) if self.reconciled_total_usd is not None else None,
            "unknown_rate_count": self.unknown_rate_count,
            "unknown_usage_count": self.unknown_usage_count,
            "failure_count": self.failure_count,
            "billed_retry_count": self.billed_retry_count,
            "catalog_version": self.catalog_version,
            "invoice_accurate": self.invoice_accurate,
            "warnings": self.warnings,
            "lines": [ln.as_dict() for ln in self.lines],
        }


def estimate_stt_line(
    *,
    session_id: str,
    provider: str,
    duration_sec: float | Decimal | None,
    scope_ref: str | None = None,
    recorded_cost_usd: float | Decimal | None = None,
    attempt: int = 1,
    billed_retry: bool = False,
    failure: bool = False,
    source: str = "voice_responses",
) -> CostLine:
    rate = lookup_stt_rate(provider)
    qty: Decimal | None = None
    amount: Decimal | None = None
    reconcile = ReconcileStatus.ESTIMATED
    notes = ""

    if failure:
        return CostLine(
            kind=CostKind.STT,
            provider=rate.provider,
            model=rate.model,
            quantity=None,
            quantity_unit="minutes",
            amount_usd=None if rate.status == RateStatus.UNKNOWN else money(0, SIXPLACE),
            currency=CURRENCY_USD,
            rate_status=rate.status,
            reconcile_status=ReconcileStatus.UNRECONCILED,
            catalog_version=RATE_CATALOG_VERSION,
            session_id=session_id,
            scope_ref=scope_ref,
            attempt=attempt,
            billed_retry=billed_retry,
            failure=True,
            source=source,
            notes="STT attempt failed — not billed as success",
        )

    if duration_sec is None:
        return CostLine(
            kind=CostKind.STT,
            provider=rate.provider,
            model=rate.model,
            quantity=None,
            quantity_unit="minutes",
            amount_usd=None,
            currency=CURRENCY_USD,
            rate_status=rate.status,
            reconcile_status=ReconcileStatus.UNKNOWN_USAGE,
            catalog_version=RATE_CATALOG_VERSION,
            session_id=session_id,
            scope_ref=scope_ref,
            attempt=attempt,
            billed_retry=billed_retry,
            failure=False,
            source=source,
            notes="Missing audio duration — usage unknown (not zero)",
        )

    qty = money(D(duration_sec) / Decimal(60), SIXPLACE)
    if rate.status == RateStatus.UNKNOWN:
        return CostLine(
            kind=CostKind.STT,
            provider=rate.provider,
            model=rate.model,
            quantity=qty,
            quantity_unit="minutes",
            amount_usd=None,
            currency=CURRENCY_USD,
            rate_status=RateStatus.UNKNOWN,
            reconcile_status=ReconcileStatus.UNKNOWN_RATE,
            catalog_version=RATE_CATALOG_VERSION,
            session_id=session_id,
            scope_ref=scope_ref,
            attempt=attempt,
            billed_retry=billed_retry,
            source=source,
            notes=rate.detail,
        )

    assert rate.rate is not None
    amount = money(qty * rate.rate, SIXPLACE)
    if recorded_cost_usd is not None:
        # Prefer recorded provider estimate when present; still not invoice-accurate.
        amount = money(recorded_cost_usd, SIXPLACE)
        reconcile = ReconcileStatus.RECORDED_ESTIMATE
        notes = "Using VoiceResponse.cost_usd recorded estimate (not provider invoice)"
    return CostLine(
        kind=CostKind.STT,
        provider=rate.provider,
        model=rate.model,
        quantity=qty,
        quantity_unit="minutes",
        amount_usd=amount,
        currency=CURRENCY_USD,
        rate_status=rate.status,
        reconcile_status=reconcile,
        catalog_version=RATE_CATALOG_VERSION,
        session_id=session_id,
        scope_ref=scope_ref,
        attempt=attempt,
        billed_retry=billed_retry,
        source=source,
        notes=notes,
    )


def estimate_theme02_line(
    *,
    session_id: str,
    provider: str,
    input_chars: int | None = None,
    output_chars: int | None = None,
    input_tokens: Decimal | None = None,
    output_tokens: Decimal | None = None,
    cache_tokens: Decimal | None = None,
    recorded_cost_usd: float | Decimal | None = None,
    model: str | None = None,
    scope_ref: str | None = None,
    phase: str = "phase_b",
    attempt: int = 1,
    billed_retry: bool = False,
    failure: bool = False,
    source: str = "ai_cost_logs",
) -> CostLine:
    rate = lookup_theme_rates(provider)
    table = theme_rate_table(provider)

    if failure:
        return CostLine(
            kind=CostKind.THEME02,
            provider=rate.provider,
            model=model,
            quantity=None,
            quantity_unit="tokens",
            amount_usd=None if rate.status == RateStatus.UNKNOWN else money(0, SIXPLACE),
            currency=CURRENCY_USD,
            rate_status=rate.status,
            reconcile_status=ReconcileStatus.UNRECONCILED,
            catalog_version=RATE_CATALOG_VERSION,
            session_id=session_id,
            scope_ref=scope_ref,
            attempt=attempt,
            billed_retry=billed_retry,
            failure=True,
            source=source,
            notes=f"Theme02 {phase} attempt failed",
            meta={"phase": phase},
        )

    # Derive tokens from chars when tokens not provided (~4 chars/token — labeled estimate)
    in_tok = input_tokens
    out_tok = output_tokens
    token_source = "provided_tokens"
    if in_tok is None and input_chars is not None:
        in_tok = D(input_chars) / Decimal(4)
        token_source = "chars_div_4_estimate"
    if out_tok is None and output_chars is not None:
        out_tok = D(output_chars) / Decimal(4)
        if token_source == "provided_tokens":
            token_source = "chars_div_4_estimate"

    if in_tok is None and out_tok is None and recorded_cost_usd is None:
        return CostLine(
            kind=CostKind.THEME02,
            provider=rate.provider,
            model=model,
            quantity=None,
            quantity_unit="tokens",
            amount_usd=None,
            currency=CURRENCY_USD,
            rate_status=rate.status,
            reconcile_status=ReconcileStatus.UNKNOWN_USAGE,
            catalog_version=RATE_CATALOG_VERSION,
            session_id=session_id,
            scope_ref=scope_ref,
            attempt=attempt,
            billed_retry=billed_retry,
            source=source,
            notes="Missing token/char usage for Theme02 — not zero",
            meta={"phase": phase},
        )

    if rate.status == RateStatus.UNKNOWN and recorded_cost_usd is None:
        qty = None
        if in_tok is not None or out_tok is not None:
            qty = money((in_tok or D(0)) + (out_tok or D(0)), SIXPLACE)
        return CostLine(
            kind=CostKind.THEME02,
            provider=rate.provider,
            model=model,
            quantity=qty,
            quantity_unit="tokens",
            amount_usd=None,
            currency=CURRENCY_USD,
            rate_status=RateStatus.UNKNOWN,
            reconcile_status=ReconcileStatus.UNKNOWN_RATE,
            catalog_version=RATE_CATALOG_VERSION,
            session_id=session_id,
            scope_ref=scope_ref,
            attempt=attempt,
            billed_retry=billed_retry,
            source=source,
            notes=rate.detail,
            meta={"phase": phase, "cache_tokens": str(cache_tokens) if cache_tokens is not None else None},
        )

    amount: Decimal | None = None
    reconcile = ReconcileStatus.ESTIMATED
    notes = ""
    if recorded_cost_usd is not None:
        amount = money(recorded_cost_usd, SIXPLACE)
        reconcile = ReconcileStatus.RECORDED_ESTIMATE
        notes = "Using AICostLog.estimated_cost_usd (char-based estimate; not provider invoice)"
    elif table is not None:
        assert in_tok is not None or out_tok is not None
        in_cost = ((in_tok or D(0)) / Decimal(1000)) * table["summary_per_1k_input"]
        out_cost = ((out_tok or D(0)) / Decimal(1000)) * table["summary_per_1k_output"]
        # cache tokens: if rate unknown for cache, do not invent — flag in meta only
        cache_note = ""
        if cache_tokens is not None and cache_tokens > 0:
            cache_note = "; cache_tokens present but cache rate not in catalog (excluded, not zeroed as free)"
        amount = money(in_cost + out_cost, SIXPLACE)
        notes = f"Catalog estimate from {token_source}{cache_note}"

    qty = money((in_tok or D(0)) + (out_tok or D(0)), SIXPLACE) if (in_tok is not None or out_tok is not None) else None
    return CostLine(
        kind=CostKind.THEME02,
        provider=rate.provider,
        model=model,
        quantity=qty,
        quantity_unit="tokens",
        amount_usd=amount,
        currency=CURRENCY_USD,
        rate_status=rate.status if rate.status != RateStatus.UNKNOWN else RateStatus.KNOWN,
        reconcile_status=reconcile,
        catalog_version=RATE_CATALOG_VERSION,
        session_id=session_id,
        scope_ref=scope_ref,
        attempt=attempt,
        billed_retry=billed_retry,
        source=source,
        notes=notes,
        meta={
            "phase": phase,
            "input_tokens": str(in_tok) if in_tok is not None else None,
            "output_tokens": str(out_tok) if out_tok is not None else None,
            "cache_tokens": str(cache_tokens) if cache_tokens is not None else None,
            "token_source": token_source,
        },
    )


def rollup_session_costs(
    lines: Iterable[CostLine],
    *,
    session_id: str,
    scope_ref: str | None = None,
    currency: str = CURRENCY_USD,
) -> SessionCostRollup:
    """Aggregate lines for one session. Rejects cross-session lines."""
    kept: list[CostLine] = []
    warnings: list[str] = []
    for ln in lines:
        if ln.session_id != session_id:
            warnings.append(f"dropped cross-session line session_id={ln.session_id}")
            continue
        if scope_ref is not None and ln.scope_ref and ln.scope_ref != scope_ref:
            warnings.append(f"dropped cross-project line scope_ref={ln.scope_ref}")
            continue
        kept.append(ln)

    est_sum = Decimal(0)
    est_any = False
    rec_sum = Decimal(0)
    rec_any = False
    unk_rate = unk_usage = fails = retries = 0
    for ln in kept:
        if ln.rate_status == RateStatus.UNKNOWN or ln.reconcile_status == ReconcileStatus.UNKNOWN_RATE:
            unk_rate += 1
        if ln.reconcile_status == ReconcileStatus.UNKNOWN_USAGE:
            unk_usage += 1
        if ln.failure:
            fails += 1
        if ln.billed_retry:
            retries += 1
        if ln.amount_usd is not None and not ln.failure:
            est_sum += ln.amount_usd
            est_any = True
            if ln.reconcile_status == ReconcileStatus.RECONCILED:
                rec_sum += ln.amount_usd
                rec_any = True

    billable = [ln for ln in kept if not ln.failure and ln.amount_usd is not None]
    invoice_accurate = bool(billable) and all(ln.reconcile_status == ReconcileStatus.RECONCILED for ln in billable)
    if unk_rate or unk_usage:
        invoice_accurate = False
        warnings.append("unknown rate/usage present — totals incomplete, not invoice-accurate")

    return SessionCostRollup(
        session_id=session_id,
        scope_ref=scope_ref,
        currency=currency,
        lines=kept,
        estimated_total_usd=money(est_sum, SIXPLACE) if est_any else None,
        reconciled_total_usd=money(rec_sum, SIXPLACE) if rec_any else None,
        unknown_rate_count=unk_rate,
        unknown_usage_count=unk_usage,
        failure_count=fails,
        billed_retry_count=retries,
        catalog_version=RATE_CATALOG_VERSION,
        invoice_accurate=invoice_accurate,
        warnings=warnings,
    )


def compare_estimate_to_charge(
    *,
    estimated_usd: Decimal | None,
    charged_usd: Decimal | None,
    tolerance_usd: Decimal = D("0.01"),
) -> dict[str, Any]:
    """Delayed reconciliation helper. Does not invent charges."""
    if estimated_usd is None:
        return {
            "status": "unknown_estimate",
            "delta_usd": None,
            "within_tolerance": False,
            "invoice_accurate": False,
        }
    if charged_usd is None:
        return {
            "status": "unreconciled",
            "estimated_usd": str(money(estimated_usd, SIXPLACE)),
            "charged_usd": None,
            "delta_usd": None,
            "within_tolerance": False,
            "invoice_accurate": False,
        }
    delta = money(charged_usd - estimated_usd, SIXPLACE)
    within = abs(delta) <= tolerance_usd
    return {
        "status": "reconciled" if within else "variance",
        "estimated_usd": str(money(estimated_usd, SIXPLACE)),
        "charged_usd": str(money(charged_usd, SIXPLACE)),
        "delta_usd": str(delta),
        "tolerance_usd": str(tolerance_usd),
        "within_tolerance": within,
        "invoice_accurate": within,
    }


def lines_from_voice_row(row: Mapping[str, Any], *, session_id: str, scope_ref: str | None = None) -> CostLine:
    """Map a VoiceResponse-like mapping to a CostLine. Fixture/source must be labeled by caller via source."""
    return estimate_stt_line(
        session_id=session_id,
        provider=str(row.get("stt_provider") or row.get("provider") or ""),
        duration_sec=row.get("audio_duration_sec"),
        scope_ref=scope_ref,
        recorded_cost_usd=row.get("cost_usd"),
        attempt=int(row.get("attempt") or 1),
        billed_retry=bool(row.get("billed_retry") or False),
        failure=bool(row.get("failure") or False),
        source=str(row.get("source") or "voice_responses"),
    )


def lines_from_ai_cost_row(row: Mapping[str, Any], *, session_id: str, scope_ref: str | None = None) -> CostLine:
    return estimate_theme02_line(
        session_id=session_id,
        provider=str(row.get("provider") or ""),
        input_chars=row.get("total_input_chars"),
        output_chars=row.get("total_output_chars"),
        recorded_cost_usd=row.get("estimated_cost_usd"),
        model=row.get("model"),
        scope_ref=scope_ref,
        phase=str(row.get("phase") or "phase_b"),
        attempt=int(row.get("attempt") or 1),
        billed_retry=bool(row.get("billed_retry") or False),
        failure=bool(row.get("failure") or False),
        source=str(row.get("source") or "ai_cost_logs"),
    )
