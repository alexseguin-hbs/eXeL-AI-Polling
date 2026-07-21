"""Cube 10 — Challenge Loop (Semi/Automated unplug-replug engine, CRS-26→31).

Locks the loop: baseline ↔ candidate → evaluate (compare_metrics + determinism-equivalence)
→ 3-tier swap decision (manual/semi/automated). A faster-but-different candidate NEVER passes;
autonomous swap requires supermajority AND output-equivalence (permanent guardrail).

Run: cd backend && python -m pytest tests/cube10/test_challenge_loop.py -v --tb=short
"""
import pytest

from app.cubes.cube10_simulation.challenge_loop import (
    CHALLENGE_TIERS,
    HARNESS_CUBES,
    decide_swap,
    evaluate_challenge,
    normalize_candidate,
    run_cube_baseline,
    run_challenge,
)

SIG_A = "a" * 64
SIG_B = "b" * 64


def _baseline(sig=SIG_A, dur=100.0):
    return {"cube_id": 1, "role": "baseline", "signature": sig, "duration_ms": dur}


def _candidate(sig=SIG_A, dur=80.0, **extra):
    return {"cube_id": 1, "role": "candidate", "signature": sig, "duration_ms": dur, **extra}


# ── evaluate_challenge ────────────────────────────────────────────────────────
class TestEvaluate:
    def test_equivalent_and_faster_passes(self):
        v = evaluate_challenge(_baseline(dur=100), _candidate(sig=SIG_A, dur=60))
        assert v["equivalent"] and v["faster"] and v["overall_passed"]

    def test_different_signature_rejected_even_if_faster(self):
        """The guardrail: a faster cube that changes outputs is NOT a valid replacement."""
        v = evaluate_challenge(_baseline(dur=100), _candidate(sig=SIG_B, dur=10))
        assert v["equivalent"] is False
        assert v["faster"] is True
        assert v["overall_passed"] is False

    def test_too_slow_fails_compare(self):
        v = evaluate_challenge(_baseline(dur=100), _candidate(sig=SIG_A, dur=200))  # >120%
        assert v["compare_passed"] is False and v["overall_passed"] is False

    def test_equal_duration_passes(self):
        v = evaluate_challenge(_baseline(dur=100), _candidate(sig=SIG_A, dur=100))
        assert v["overall_passed"] is True and v["faster"] is False

    def test_empty_baseline_signature_never_equivalent(self):
        v = evaluate_challenge(_baseline(sig="", dur=100), _candidate(sig="", dur=50))
        assert v["equivalent"] is False and v["overall_passed"] is False


# ── decide_swap — the 3 autonomy tiers ────────────────────────────────────────
PASS = {"overall_passed": True, "equivalent": True}
FAIL = {"overall_passed": False, "equivalent": False}
SUPER = [{"vote": "approve", "tokens_staked": 100.0} for _ in range(9)] + [{"vote": "reject", "tokens_staked": 1.0}]


class TestDecideSwap:
    def test_failed_verdict_always_rejected(self):
        for tier in ("manual", "semi", "automated"):
            d = decide_swap(FAIL, tier=tier, human_approved=True, human_selected=True,
                            votes=SUPER, total_holders=10)
            assert d["decision"] == "reject"

    def test_manual_needs_human(self):
        assert decide_swap(PASS, tier="manual", human_approved=True)["decision"] == "swap"
        assert decide_swap(PASS, tier="manual", human_approved=False)["decision"] == "hold"

    def test_semi_needs_selection(self):
        assert decide_swap(PASS, tier="semi", human_selected=True)["decision"] == "swap"
        assert decide_swap(PASS, tier="semi", human_selected=False)["decision"] == "hold"

    def test_automated_supermajority_swaps(self):
        d = decide_swap(PASS, tier="automated", votes=SUPER, total_holders=10)
        assert d["decision"] == "swap" and d["tally"]["result"] == "approved"

    def test_automated_blocks_non_equivalent_despite_votes(self):
        """Guardrail: even a passing-metrics + full-vote candidate can't auto-swap if not equivalent."""
        v = {"overall_passed": True, "equivalent": False}
        d = decide_swap(v, tier="automated", votes=SUPER, total_holders=10)
        # overall_passed True but equivalent False → this verdict shape can't arise from
        # evaluate_challenge, but decide_swap still refuses the autonomous swap.
        assert d["decision"] == "reject" and "guardrail" in d["reason"]

    def test_automated_holds_without_quorum(self):
        d = decide_swap(PASS, tier="automated", votes=[{"vote": "approve", "tokens_staked": 1.0}], total_holders=1000)
        assert d["decision"] == "hold"

    def test_invalid_tier_raises(self):
        with pytest.raises(ValueError):
            decide_swap(PASS, tier="skynet")


# ── normalize_candidate — WireGuard whitelist ─────────────────────────────────
class TestNormalizeCandidate:
    def test_whitelists_and_coerces(self):
        c = normalize_candidate({"signature": 123, "duration_ms": "50", "tests_passed": "10",
                                 "evil": "x", "ssses": {"security": "90"}})
        assert c["signature"] == "123" and c["duration_ms"] == 50.0 and c["tests_passed"] == 10
        assert "evil" not in c and c["ssses"]["security"] == 90

    def test_non_dict_safe(self):
        c = normalize_candidate("garbage")
        assert c["signature"] == "" and c["duration_ms"] == 0.0


# ── Integration — real harness baseline + end-to-end run ──────────────────────
class TestIntegration:
    @pytest.mark.asyncio
    async def test_baseline_real_signature(self):
        b = await run_cube_baseline(1)
        assert len(b["signature"]) == 64 and b["duration_ms"] >= 0 and b["cube_id"] == 1

    @pytest.mark.asyncio
    async def test_run_challenge_equivalent_candidate_manual_swap(self):
        base = await run_cube_baseline(1)
        # A candidate matching the live signature + no slower → manual human-approved swap.
        out = await run_challenge(
            1, {"signature": base["signature"], "duration_ms": base["duration_ms"]},
            tier="manual", human_approved=True,
        )
        assert out["verdict"]["overall_passed"] is True
        assert out["decision"]["decision"] == "swap"

    @pytest.mark.asyncio
    async def test_run_challenge_different_candidate_rejected(self):
        out = await run_challenge(
            1, {"signature": SIG_B, "duration_ms": 0.001},
            tier="automated", votes=SUPER, total_holders=10,
        )
        assert out["verdict"]["overall_passed"] is False
        assert out["decision"]["decision"] == "reject"

    def test_tiers_constant(self):
        assert CHALLENGE_TIERS == {"manual", "semi", "automated"}


class TestHarnessRegistration:
    """R0.2: cubes 1, 2, 6, 7 have registered runnable harnesses (not Cube 1 only)."""

    def test_registry_contains_all_four(self):
        assert HARNESS_CUBES == frozenset({1, 2, 6, 7})

    @pytest.mark.asyncio
    @pytest.mark.parametrize("cube_id", [1, 2, 6, 7])
    async def test_baseline_runs_for_each_registered_cube(self, cube_id):
        base = await run_cube_baseline(cube_id)
        assert base["cube_id"] == cube_id
        assert len(base["signature"]) == 64  # every harness emits a determinism signature

    @pytest.mark.asyncio
    async def test_matching_candidate_swaps_for_cube7(self):
        # The whole loop now works for a non-Cube-1 reference (Cube 7).
        base = await run_cube_baseline(7)
        out = await run_challenge(
            7, {"signature": base["signature"], "duration_ms": base["duration_ms"]},
            tier="manual", human_approved=True,
        )
        assert out["verdict"]["overall_passed"] is True
        assert out["decision"]["decision"] == "swap"
