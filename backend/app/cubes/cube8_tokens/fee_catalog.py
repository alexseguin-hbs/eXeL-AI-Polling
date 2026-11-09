"""Provider fee catalog for Moderator Settings Cost Estimate + ledger rates.

UI estimates are labeled UI_ESTIMATE — not verified provider invoices.
Weekly server-side lookup refreshes ``checked_at`` / stale flags; does NOT overwrite
negotiated Stripe fees or activate new session prices.

Denominator for STT $/min: **billable audio minutes** (not session wall-clock).
Theme02 costs use **estimated tokens** (chars/4) × per-1K rates — not $/min.
Financial-2525 $/min (FD-76/77 MoT chart) is a separate product convention — cited, not equated.
"""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

from app.cubes.cube8_tokens.cost_ledger import (
    RATE_CATALOG_VERSION,
    STT_MODEL_PINS,
    STT_RATES_USD_PER_MIN,
    THEME_RATES_USD_PER_1K,
    D,
    money,
)

CURRENCY = "USD"
# Explicit Cost Estimate panel assumptions (screenshot UI — configurable, not inventing new prices)
UI_ASSUMPTIONS = {
    "users": 1000,
    "responses_per_user": 1,
    "words_per_response": 111,
    "type_users": 500,
    "voice_users": 500,
    "voice_minutes_per_user": D("0.74"),  # billable audio minutes per voice user
    "phase_b_overhead_pct": D("0.30"),
    "label": "UI_ESTIMATE_1000_users",
    "stt_denominator": "billable_audio_minutes",
    "theme_unit": "estimated_tokens_chars_div_4",
    "financial_2525_note": (
        "Financial-2525 $/min (FD-76/77) spreads ledger amounts over MoT chart window; "
        "polling STT $/min is provider audio minutes — do not conflate."
    ),
}

# Combo table matching existing Moderator Settings panel (screenshot totals).
# These are UI display estimates derived from bundled rates × assumptions — NOT invoice-verified.
UI_COMBOS = [
    {"summary": "openai", "v2t": "whisper", "summary_label": "OpenAI", "v2t_label": "Whisper", "is_default": True},
    {"summary": "gemini", "v2t": "gemini", "summary_label": "Gemini", "v2t_label": "Gemini", "is_default": False},
    {"summary": "gemini", "v2t": "whisper", "summary_label": "Gemini", "v2t_label": "Whisper", "is_default": False},
    {"summary": "grok", "v2t": "whisper", "summary_label": "Grok", "v2t_label": "Whisper", "is_default": False},
    {"summary": "claude", "v2t": "whisper", "summary_label": "Claude", "v2t_label": "Whisper", "is_default": False},
    {"summary": "claude", "v2t": "azure", "summary_label": "Claude", "v2t_label": "Azure", "is_default": False},
    {"summary": "claude", "v2t": "aws", "summary_label": "Claude", "v2t_label": "AWS", "is_default": False},
]

# Azure STT not in STT_RATES — keep explicit unknown rather than inventing; panel historically showed ~$5.92
# We mark azure rate unknown unless an override file supplies it.
AZURE_UI_LEGACY_NOTE = "Azure V2T was shown in UI as ~$5.92/1k; no catalog rate — flagged unknown unless override"

WEEKLY_REFRESH_DAYS = 7
CATALOG_STORE_PATH = Path(__file__).resolve().parents[3] / "data" / "provider_fee_catalog.json"

# Seed effective date for bundled catalog (matches in-repo 2026-04 pricing notes)
BUNDLED_EFFECTIVE_AT = "2026-04-01T00:00:00+00:00"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def bundled_entries() -> list[dict[str, Any]]:
    """Build versioned fee entries from cost_ledger catalogs."""
    entries: list[dict[str, Any]] = []
    checked = BUNDLED_EFFECTIVE_AT
    for provider, rate in STT_RATES_USD_PER_MIN.items():
        entries.append({
            "kind": "stt",
            "provider": provider,
            "model": STT_MODEL_PINS.get(provider),
            "unit": "usd_per_billable_audio_minute",
            "currency": CURRENCY,
            "rate": str(rate),
            "rate_status": "known" if rate > 0 else "explicit_zero",
            "source": "bundled_catalog",
            "source_ref": "cube3_voice.providers.base.STT_COST_RATES",
            "catalog_version": RATE_CATALOG_VERSION,
            "effective_at": BUNDLED_EFFECTIVE_AT,
            "checked_at": checked,
            "verification": "UI_ESTIMATE",  # not provider invoice
            "manual_override": False,
        })
    # Azure: unknown (do not silent-zero)
    entries.append({
        "kind": "stt",
        "provider": "azure",
        "model": None,
        "unit": "usd_per_billable_audio_minute",
        "currency": CURRENCY,
        "rate": None,
        "rate_status": "unknown",
        "source": "bundled_catalog",
        "source_ref": None,
        "catalog_version": RATE_CATALOG_VERSION,
        "effective_at": BUNDLED_EFFECTIVE_AT,
        "checked_at": checked,
        "verification": "UI_ESTIMATE",
        "manual_override": False,
        "notes": AZURE_UI_LEGACY_NOTE,
    })
    for provider, table in THEME_RATES_USD_PER_1K.items():
        for key, rate in table.items():
            if key == "model":
                continue
            entries.append({
                "kind": "theme02",
                "provider": provider,
                "model": None,
                "unit": f"usd_per_1k_tokens:{key}",
                "currency": CURRENCY,
                "rate": str(rate),
                "rate_status": "explicit_zero" if provider == "offline" else "known",
                "source": "bundled_catalog",
                "source_ref": "cube6_ai.providers.base.AI_COST_RATES",
                "catalog_version": RATE_CATALOG_VERSION,
                "effective_at": BUNDLED_EFFECTIVE_AT,
                "checked_at": checked,
                "verification": "UI_ESTIMATE",
                "manual_override": False,
            })
    return entries


def load_catalog() -> dict[str, Any]:
    """Load override store if present; else bundled. Retains prior_versions when refreshing."""
    if CATALOG_STORE_PATH.exists():
        try:
            data = json.loads(CATALOG_STORE_PATH.read_text())
            if isinstance(data, dict) and "entries" in data:
                return data
        except (OSError, json.JSONDecodeError):
            pass
    return {
        "catalog_version": RATE_CATALOG_VERSION,
        "currency": CURRENCY,
        "assumptions": {**UI_ASSUMPTIONS, "voice_minutes_per_user": str(UI_ASSUMPTIONS["voice_minutes_per_user"]),
                        "phase_b_overhead_pct": str(UI_ASSUMPTIONS["phase_b_overhead_pct"])},
        "entries": bundled_entries(),
        "prior_versions": [],
        "last_refresh_status": "bundled_seed",
        "last_refresh_at": None,
        "next_refresh_due_at": None,
        "pricing_activation_enabled": False,
        "stripe_negotiated_fees_note": "Never overwrite negotiated Stripe fees with public provider rates",
    }


def validate_entry(entry: dict[str, Any]) -> list[str]:
    """Safe source parsing — return list of validation errors (empty = ok)."""
    errs: list[str] = []
    for req in ("kind", "provider", "unit", "currency", "rate_status", "catalog_version", "effective_at", "checked_at"):
        if req not in entry:
            errs.append(f"missing {req}")
    if entry.get("rate_status") == "known" and entry.get("rate") is None:
        errs.append("known rate must have rate value")
    if entry.get("rate_status") == "unknown" and entry.get("rate") is not None:
        errs.append("unknown rate must not set numeric rate (use null)")
    if entry.get("currency") != CURRENCY:
        errs.append(f"currency must be {CURRENCY} for this catalog")
    # Reject silent zero for unknown
    if entry.get("rate_status") == "unknown" and entry.get("rate") in (0, "0", "0.0"):
        errs.append("unknown must not be stored as zero")
    return errs


def freshness(catalog: dict[str, Any], *, now: datetime | None = None) -> dict[str, Any]:
    now = now or _now()
    checked_times = []
    for e in catalog.get("entries") or []:
        try:
            checked_times.append(datetime.fromisoformat(str(e["checked_at"]).replace("Z", "+00:00")))
        except (KeyError, ValueError):
            continue
    last_success = max(checked_times) if checked_times else None
    next_due = (last_success + timedelta(days=WEEKLY_REFRESH_DAYS)) if last_success else now
    stale = last_success is None or (now - last_success) > timedelta(days=WEEKLY_REFRESH_DAYS)
    return {
        "last_success_at": _iso(last_success) if last_success else None,
        "next_due_at": _iso(next_due),
        "stale": stale,
        "weekly_refresh_days": WEEKLY_REFRESH_DAYS,
        "manual_override_present": any(e.get("manual_override") for e in (catalog.get("entries") or [])),
    }


def stt_rate(provider: str, catalog: dict[str, Any] | None = None) -> Decimal | None:
    cat = catalog or load_catalog()
    for e in cat["entries"]:
        if e.get("kind") == "stt" and e.get("provider") == provider:
            if e.get("rate_status") == "unknown" or e.get("rate") is None:
                return None
            return D(e["rate"])
    return None


def estimate_combo_costs(catalog: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Recompute UI combo table from catalog rates × explicit assumptions.

    Returns amount fields as strings; unknown V2T rates → amount null + flagged.
    Does not claim invoice accuracy.
    """
    cat = catalog or load_catalog()
    voice_users = int(UI_ASSUMPTIONS["voice_users"])
    mins_each = D(UI_ASSUMPTIONS["voice_minutes_per_user"])
    total_audio_min = mins_each * voice_users

    # Theme/summary UI costs: preserve historical panel display numbers as
    # ``ui_display_usd`` while recomputing V2T from catalog when known.
    # Summary side stays labeled UI_ESTIMATE_STATIC until Theme02 token metering
    # is wired into the panel (ledger path is authoritative for sessions).
    SUMMARY_UI_STATIC = {
        "openai": D("0.33"),
        "gemini": D("0.22"),
        "grok": D("5.25"),
        "claude": D("7.87"),
    }

    rows = []
    for combo in UI_COMBOS:
        sum_p = combo["summary"]
        v2t_p = combo["v2t"]
        sum_cost = SUMMARY_UI_STATIC.get(sum_p)
        v2t_rate = stt_rate(v2t_p, cat)
        if v2t_rate is None:
            v2t_cost = None
            v2t_status = "unknown_rate"
        else:
            v2t_cost = money(v2t_rate * total_audio_min)
            v2t_status = "estimated_from_catalog"
        total = None
        if sum_cost is not None and v2t_cost is not None:
            total = money(sum_cost + v2t_cost)
        rows.append({
            "summary_provider": sum_p,
            "v2t_provider": v2t_p,
            "label": f"{combo['summary_label']} + {combo['v2t_label']}",
            "is_default": combo["is_default"],
            "summary_usd": str(sum_cost) if sum_cost is not None else None,
            "summary_verification": "UI_ESTIMATE_STATIC",
            "v2t_usd": str(v2t_cost) if v2t_cost is not None else None,
            "v2t_verification": v2t_status,
            "v2t_unit": "usd_per_billable_audio_minute × voice_users × 0.74",
            "total_usd": str(total) if total is not None else None,
            "verification": "UI_ESTIMATE",
            "invoice_accurate": False,
        })
    return rows


def free_tier_note() -> dict[str, Any]:
    """Audit free-tier claim: user not charged ≠ provider cost is $0."""
    return {
        "panel_footer_legacy": "Free tier (≤19 users): effectively $0.00 on any provider.",
        "corrected": (
            "Free tier (≤19 users): participants are not charged a session fee; "
            "provider STT/Theme02 costs may still accrue and are tracked on the session ledger."
        ),
        "user_not_charged_means_provider_cost_zero": False,
    }


def mark_weekly_check(
    *,
    source: str = "weekly_lookup",
    change_evidence: str | None = None,
    persist: bool = False,
) -> dict[str, Any]:
    """Server-side weekly refresh: bump checked_at, retain prior snapshot.

    Does not fetch live provider pricing APIs in this PR (no external rate scrape /
    no Stripe fee overwrite). Marks a successful check of the bundled catalog and
    records change_evidence for audit. Deployment must schedule this via supported
    cron (see deploy/provider-fee-weekly-refresh.md) — not activated here.
    """
    cat = load_catalog()
    prior = {
        "catalog_version": cat.get("catalog_version"),
        "snapshotted_at": _iso(_now()),
        "entries": deepcopy(cat.get("entries") or []),
    }
    priors = list(cat.get("prior_versions") or [])
    priors.append(prior)
    # keep last 12 weekly snapshots
    priors = priors[-12:]
    now_iso = _iso(_now())
    for e in cat["entries"]:
        if e.get("manual_override"):
            continue  # never clobber manual overrides
        e["checked_at"] = now_iso
        e["last_check_source"] = source
    cat["prior_versions"] = priors
    cat["last_refresh_status"] = "ok_bundled_reaffirm"
    cat["last_refresh_at"] = now_iso
    cat["next_refresh_due_at"] = _iso(_now() + timedelta(days=WEEKLY_REFRESH_DAYS))
    cat["change_evidence"] = change_evidence or "reaffirmed bundled rates; no external scrape this run"
    if persist:
        CATALOG_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CATALOG_STORE_PATH.write_text(json.dumps(cat, indent=2, sort_keys=True))
    return cat


def public_fee_payload() -> dict[str, Any]:
    cat = load_catalog()
    return {
        "catalog_version": cat.get("catalog_version"),
        "currency": CURRENCY,
        "assumptions": cat.get("assumptions") or {
            **{k: (str(v) if isinstance(v, Decimal) else v) for k, v in UI_ASSUMPTIONS.items()}
        },
        "freshness": freshness(cat),
        "entries": cat.get("entries"),
        "combos": estimate_combo_costs(cat),
        "free_tier": free_tier_note(),
        "pricing_activation_enabled": False,
        "prior_versions_retained": len(cat.get("prior_versions") or []),
        "invoice_accurate": False,
        "financial_2525_note": UI_ASSUMPTIONS["financial_2525_note"],
    }
