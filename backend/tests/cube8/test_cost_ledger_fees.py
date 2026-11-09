"""FIXTURE-LABELED unit tests for cost ledger + fee catalog + margin gate.

These tests use synthetic fixtures only — they do NOT claim invoice accuracy
or live Supabase/Stripe persistence.
"""

from __future__ import annotations

import sys
import unittest
from decimal import Decimal
from pathlib import Path

# Allow `python3 -m unittest` without package install
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from app.cubes.cube8_tokens.cost_ledger import (  # noqa: E402
    RateStatus,
    ReconcileStatus,
    compare_estimate_to_charge,
    estimate_stt_line,
    estimate_theme02_line,
    lookup_stt_rate,
    rollup_session_costs,
)
from app.cubes.cube8_tokens.fee_catalog import (  # noqa: E402
    estimate_combo_costs,
    free_tier_note,
    mark_weekly_check,
    public_fee_payload,
    validate_entry,
)
from app.cubes.cube8_tokens.margin_policy import (  # noqa: E402
    PRICING_ACTIVATION_ENABLED,
    apply_margin,
    preview_margin_both,
)
from app.cubes.cube8_tokens.payment_idempotency import (  # noqa: E402
    WebhookEventDedupe,
    stripe_idempotency_key,
)
from app.cubes.cube8_tokens.payment_product import (  # noqa: E402
    is_donation,
    product_line_for,
    stripe_metadata,
)
class CostLedgerFixtureTests(unittest.TestCase):
    """source=fixture — synthetic only."""

    def test_unknown_stt_rate_not_zero(self):
        lu = lookup_stt_rate("not-a-real-provider")
        self.assertEqual(lu.status, RateStatus.UNKNOWN)
        self.assertIsNone(lu.rate)
        line = estimate_stt_line(
            session_id="s1",
            provider="not-a-real-provider",
            duration_sec=60,
            source="fixture",
        )
        self.assertIsNone(line.amount_usd)
        self.assertEqual(line.reconcile_status, ReconcileStatus.UNKNOWN_RATE)

    def test_missing_duration_unknown_usage_not_zero(self):
        line = estimate_stt_line(
            session_id="s1", provider="whisper", duration_sec=None, source="fixture"
        )
        self.assertEqual(line.reconcile_status, ReconcileStatus.UNKNOWN_USAGE)
        self.assertIsNone(line.amount_usd)

    def test_whisper_one_minute_decimal(self):
        line = estimate_stt_line(
            session_id="s1", provider="whisper", duration_sec=60, source="fixture"
        )
        self.assertEqual(line.amount_usd, Decimal("0.006000"))
        self.assertEqual(line.quantity_unit, "minutes")
        self.assertFalse(line.reconcile_status == ReconcileStatus.RECONCILED)

    def test_session_isolation_drops_cross_session(self):
        a = estimate_stt_line(session_id="A", provider="whisper", duration_sec=60, source="fixture")
        b = estimate_stt_line(session_id="B", provider="whisper", duration_sec=60, source="fixture")
        roll = rollup_session_costs([a, b], session_id="A")
        self.assertEqual(len(roll.lines), 1)
        self.assertTrue(any("cross-session" in w for w in roll.warnings))
        self.assertFalse(roll.invoice_accurate)

    def test_project_isolation_scope_ref(self):
        a = estimate_stt_line(
            session_id="s1", provider="whisper", duration_sec=60, scope_ref="drone", source="fixture"
        )
        b = estimate_stt_line(
            session_id="s1", provider="whisper", duration_sec=60, scope_ref="security", source="fixture"
        )
        roll = rollup_session_costs([a, b], session_id="s1", scope_ref="drone")
        self.assertEqual(len(roll.lines), 1)

    def test_billed_retry_and_failure_flags(self):
        ok = estimate_stt_line(
            session_id="s1", provider="whisper", duration_sec=60, attempt=1, source="fixture"
        )
        retry = estimate_stt_line(
            session_id="s1",
            provider="whisper",
            duration_sec=60,
            attempt=2,
            billed_retry=True,
            source="fixture",
        )
        fail = estimate_stt_line(
            session_id="s1", provider="whisper", duration_sec=60, failure=True, source="fixture"
        )
        roll = rollup_session_costs([ok, retry, fail], session_id="s1")
        self.assertEqual(roll.billed_retry_count, 1)
        self.assertEqual(roll.failure_count, 1)

    def test_theme02_unknown_provider(self):
        line = estimate_theme02_line(
            session_id="s1",
            provider="mystery-llm",
            input_chars=400,
            output_chars=100,
            source="fixture",
        )
        self.assertEqual(line.reconcile_status, ReconcileStatus.UNKNOWN_RATE)
        self.assertIsNone(line.amount_usd)

    def test_compare_estimate_unreconciled_without_charge(self):
        r = compare_estimate_to_charge(estimated_usd=Decimal("1.00"), charged_usd=None)
        self.assertEqual(r["status"], "unreconciled")
        self.assertFalse(r["invoice_accurate"])

    def test_compare_estimate_within_tolerance(self):
        r = compare_estimate_to_charge(
            estimated_usd=Decimal("1.00"), charged_usd=Decimal("1.005")
        )
        self.assertTrue(r["within_tolerance"])


class FeeCatalogFixtureTests(unittest.TestCase):
    def test_public_payload_not_invoice_accurate(self):
        p = public_fee_payload()
        self.assertFalse(p["invoice_accurate"])
        self.assertFalse(p["pricing_activation_enabled"])
        self.assertIn("billable_audio", str(p["assumptions"]))

    def test_combo_azure_unknown_not_zero(self):
        rows = estimate_combo_costs()
        azure = next(r for r in rows if r["v2t_provider"] == "azure")
        self.assertIsNone(azure["v2t_usd"])
        self.assertEqual(azure["v2t_verification"], "unknown_rate")

    def test_openai_whisper_total_matches_panel_heritage(self):
        rows = estimate_combo_costs()
        row = next(r for r in rows if r["label"] == "OpenAI + Whisper")
        # 0.33 + 0.006*370 = 0.33 + 2.22 = 2.55
        self.assertEqual(row["total_usd"], "2.55")

    def test_free_tier_audit(self):
        note = free_tier_note()
        self.assertFalse(note["user_not_charged_means_provider_cost_zero"])

    def test_validate_rejects_unknown_as_zero(self):
        errs = validate_entry({
            "kind": "stt",
            "provider": "x",
            "unit": "usd_per_billable_audio_minute",
            "currency": "USD",
            "rate_status": "unknown",
            "rate": "0",
            "catalog_version": "x",
            "effective_at": "2026-04-01T00:00:00+00:00",
            "checked_at": "2026-04-01T00:00:00+00:00",
        })
        self.assertTrue(any("zero" in e for e in errs))

    def test_weekly_check_retains_prior_versions(self):
        cat = mark_weekly_check(persist=False, change_evidence="fixture-reaffirm")
        self.assertGreaterEqual(len(cat["prior_versions"]), 1)
        self.assertEqual(cat["last_refresh_status"], "ok_bundled_reaffirm")


class MarginAndProductTests(unittest.TestCase):
    def test_pricing_activation_off(self):
        self.assertFalse(PRICING_ACTIVATION_ENABLED)
        with self.assertRaises(RuntimeError):
            apply_margin(Decimal("1.00"), "markup_1_5")
        prev = preview_margin_both(Decimal("2.00"))
        self.assertEqual(prev["markup_1_5_price_usd"], "3.00")
        self.assertEqual(prev["gross_margin_50_price_usd"], "4.00")

    def test_product_lines(self):
        self.assertEqual(product_line_for("moderator_fee"), "exel_session_charge")
        self.assertTrue(is_donation("divinity_guide_donation"))
        self.assertTrue(is_donation("derisking_strategies_donation"))
        md = stripe_metadata(transaction_type="donation", session_id="s1")
        self.assertEqual(md["purpose"], "donation")
        self.assertEqual(md["product_line"], "exel_session_donation")

    def test_idempotency_and_dedupe(self):
        k1 = stripe_idempotency_key(action="donate", session_id="s1", amount_cents=100, attempt=1)
        k2 = stripe_idempotency_key(action="donate", session_id="s1", amount_cents=100, attempt=1)
        self.assertEqual(k1, k2)
        d = WebhookEventDedupe()
        self.assertTrue(d.mark_processed("evt_1"))
        self.assertFalse(d.mark_processed("evt_1"))



