"""Cube 10 — T2525 chaos / adversarial-input resilience.

Feed the SIM engine degraded + hostile inputs and assert it degrades gracefully (no crash)
and stays SAFE (no false approval, no false shrink). Reuses the shipped backbone; offline.
Includes the regression for the empty-electorate quorum hole fixed alongside these tests.
"""

import pytest

from app.cubes.cube10_simulation.challenge_loop import (
    compute_optimization,
    decide_swap,
    evaluate_challenge,
    normalize_candidate,
)
from app.cubes.cube10_simulation.service import tally_votes


class TestEmptyElectorateQuorum:
    """Anti-sybil regression: a vote can't pass quorum with no legitimate token holders."""

    def test_zero_holders_never_meets_quorum(self):
        t = tally_votes([{"vote": "approve", "tokens_staked": 100}], total_token_holders=0)
        assert t["quorum_met"] is False
        assert t["result"] == "quorum_not_met"      # was falsely "approved" before the fix

    def test_negative_holders_never_meets_quorum(self):
        t = tally_votes([{"vote": "approve", "tokens_staked": 100}], total_token_holders=-5)
        assert t["quorum_met"] is False

    def test_automated_swap_blocked_with_empty_electorate(self):
        ok = {"overall_passed": True, "equivalent": True}
        d = decide_swap(ok, tier="automated",
                        votes=[{"vote": "approve", "tokens_staked": 100}], total_holders=0)
        assert d["decision"] == "hold"              # consensus not reached → no swap


class TestDegradedMetrics:
    """Pathological metric values must never crash or manufacture a bogus win."""

    def test_empty_baseline_fails_safe(self):
        v = evaluate_challenge({}, {"signature": "x" * 64, "duration_ms": 1.0})
        assert v["overall_passed"] is False         # no baseline signature → not equivalent

    def test_negative_durations_no_shrink(self):
        o = compute_optimization({"duration_ms": -5.0}, {"duration_ms": -9.0}, passed=True)
        assert o["cube_scale"] == 1.0 and o["win"] is False

    def test_absurd_speedup_clamped(self):
        o = compute_optimization({"duration_ms": 1e12}, {"duration_ms": 1.0}, passed=True)
        assert o["cube_scale"] >= 0.5               # clamp floor holds

    def test_zero_baseline_duration_no_divide_error(self):
        o = compute_optimization({"duration_ms": 0.0}, {"duration_ms": 0.0}, passed=True)
        assert o["optimization_pct"] == 0.0 and o["cube_scale"] == 1.0


class TestMalformedCandidate:
    """WireGuard normalize must coerce/strip garbage without raising."""

    def test_non_numeric_duration_coerced(self):
        c = normalize_candidate({"duration_ms": "not_a_number", "evil": "x"})
        assert c["duration_ms"] == 0.0 and "evil" not in c

    def test_non_dict_candidate_safe(self):
        c = normalize_candidate(["garbage"])
        assert c["signature"] == "" and c["duration_ms"] == 0.0

    def test_malformed_candidate_through_evaluate(self):
        base = {"signature": "s" * 64, "duration_ms": 10.0}
        v = evaluate_challenge(base, normalize_candidate("junk"))
        assert v["overall_passed"] is False         # garbage candidate can't win
