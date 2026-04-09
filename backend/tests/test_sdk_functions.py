"""SDK Functions Registry — 9 Paid + 3 Internal Tests."""

import pytest

from app.core.sdk_functions import (
    ALL_SDK_FUNCTIONS,
    INTERNAL_APIS,
    SDK_FUNCTIONS,
    estimate_session_api_cost,
    get_sdk_registry,
)


class TestRegistry:
    def test_9_paid_functions(self):
        assert len(SDK_FUNCTIONS) == 9

    def test_3_internal_apis(self):
        assert len(INTERNAL_APIS) == 3

    def test_12_total(self):
        assert len(ALL_SDK_FUNCTIONS) == 12

    def test_paid_numbered_1_to_9(self):
        numbers = [f.number for f in SDK_FUNCTIONS]
        assert numbers == list(range(1, 10))

    def test_internal_numbered_10_to_12(self):
        numbers = [f.number for f in INTERNAL_APIS]
        assert numbers == [10, 11, 12]

    def test_registry_dict(self):
        d = get_sdk_registry()
        assert d["total_paid"] == 9
        assert d["total_internal"] == 3
        assert d["total"] == 12
        assert d["pricing_unit"] == "◬ (AI tokens)"


class TestPricing:
    def test_zero_cost_functions(self):
        """Only verify + convert are zero cost (trust + payments)."""
        free = [f for f in ALL_SDK_FUNCTIONS if f.cost_per_unit_ai_tokens == 0]
        assert len(free) == 2  # convert, verify

    def test_compress_costs_5_per_1k(self):
        compress = next(f for f in SDK_FUNCTIONS if f.method_name == "compress")
        assert compress.cost_per_unit_ai_tokens == 5.0

    def test_vote_is_cheap(self):
        vote = next(f for f in SDK_FUNCTIONS if f.method_name == "vote")
        assert vote.cost_per_unit_ai_tokens == 0.01

    def test_challenge_costs_10(self):
        challenge = next(f for f in SDK_FUNCTIONS if f.method_name == "challenge")
        assert challenge.cost_per_unit_ai_tokens == 10.0

    def test_verify_is_free(self):
        verify = next(f for f in SDK_FUNCTIONS if f.method_name == "verify")
        assert verify.cost_per_unit_ai_tokens == 0.0

    def test_convert_is_free(self):
        convert = next(f for f in SDK_FUNCTIONS if f.method_name == "convert")
        assert convert.cost_per_unit_ai_tokens == 0.0


class TestCostEstimate:
    def test_small_session(self):
        est = estimate_session_api_cost(100, 50)
        assert est["total_ai_tokens"] > 0
        assert est["total_ai_tokens"] < 50  # Small session, reasonable cost

    def test_large_session(self):
        est = estimate_session_api_cost(100_000, 50_000, broadcast_recipients=1_000_000)
        assert est["total_ai_tokens"] > 100

    def test_zero_cost_noted(self):
        est = estimate_session_api_cost(100, 10)
        assert "verify" in str(est["zero_cost_functions"])
        assert "convert" in str(est["zero_cost_functions"])

    def test_1m_session_cost(self):
        """1M responses, 500K voters, 1M broadcast → estimate."""
        est = estimate_session_api_cost(1_000_000, 500_000, 1_000_000)
        print(f"\n  1M session: {est['total_ai_tokens']:.0f} ◬ tokens")
        print(f"  Breakdown: {est['cost_breakdown_ai_tokens']}")


class TestSDKMethodNames:
    def test_all_have_method_names(self):
        for f in ALL_SDK_FUNCTIONS:
            assert f.method_name, f"Function {f.name} has no method_name"

    def test_no_duplicate_methods(self):
        names = [f.method_name for f in ALL_SDK_FUNCTIONS]
        assert len(names) == len(set(names))

    def test_no_duplicate_endpoints(self):
        endpoints = [f.endpoint for f in ALL_SDK_FUNCTIONS]
        assert len(endpoints) == len(set(endpoints))
