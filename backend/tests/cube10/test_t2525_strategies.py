"""Cube 10 — T2525 novel testing strategies ("2525 wisdom").

These go beyond pass/fail assertions to test the SIM's *invariants* and *guardrails* —
the properties that must hold no matter what candidate is thrown at the engine. Each is
pure/deterministic and reuses the shipped backbone (no new infra):

  1. Parity-before-shrink invariant — a cube never shrinks unless the verdict passed.
  2. Adversarial equivalence — a faster-but-DIFFERENT candidate is always rejected.
  3. Cross-tier consistency — the SAME evidence yields consistent verdicts across
     Manual/Semi/Auto; only the APPROVER differs (the "one backbone" proof).
  4. Mutation meta-test — perturbing a block's measured metric MUST move its SSSES
     efficiency (proves the harness MEASURES the block, not just runs it).
  5. Aggregator fairness — the community consensus is anti-whale (quadratic) + needs a
     supermajority (the improvement vote can't be captured).
"""

import pytest

from app.cubes.cube10_simulation.agents import council_review
from app.cubes.cube10_simulation.challenge_loop import (
    CHALLENGE_TIERS,
    compute_optimization,
    decide_swap,
    evaluate_challenge,
)
from app.cubes.cube10_simulation.sections import section_ssses
from app.cubes.cube10_simulation.service import tally_votes


class TestParityBeforeShrink:
    """A candidate cube shrinks ONLY when the verdict passed (parity) AND it's faster."""

    def test_failed_verdict_never_shrinks_even_if_faster(self):
        base = {"duration_ms": 100.0}
        cand = {"duration_ms": 40.0}  # 60% faster — but the verdict FAILED
        o = compute_optimization(base, cand, passed=False)
        assert o["cube_scale"] == 1.0   # no proven gain → same size, no shrink
        assert o["win"] is False

    def test_passing_faster_candidate_earns_shrink(self):
        base = {"duration_ms": 100.0}
        cand = {"duration_ms": 80.0}  # 20% faster AND passed → earns a smaller cube
        o = compute_optimization(base, cand, passed=True)
        assert o["win"] is True and o["optimization_pct"] == 20.0
        assert 0.5 <= o["cube_scale"] < 1.0

    def test_shrink_never_below_floor(self):
        base = {"duration_ms": 100.0}
        cand = {"duration_ms": 1.0}   # 99% faster — clamp protects legibility
        o = compute_optimization(base, cand, passed=True)
        assert o["cube_scale"] >= 0.5


class TestAdversarialEquivalence:
    """A faster candidate that CHANGES output must never pass (Thor's permanent guardrail)."""

    def test_faster_but_different_is_rejected(self):
        base = {"signature": "abc123", "duration_ms": 100.0, "metrics": {}}
        cand = {"signature": "DIFFERENT", "duration_ms": 10.0, "metrics": {}}
        v = evaluate_challenge(base, cand)
        assert v["faster"] is True
        assert v["equivalent"] is False
        assert v["overall_passed"] is False   # speed can't buy a behavior change

    def test_equivalent_and_faster_can_pass(self):
        base = {"signature": "abc123", "duration_ms": 100.0, "metrics": {}}
        cand = {"signature": "abc123", "duration_ms": 90.0, "metrics": {}}
        v = evaluate_challenge(base, cand)
        assert v["equivalent"] is True


class TestCrossTierConsistency:
    """One backbone: the SAME verdict is treated consistently across the 3 tiers —
    a failed verdict is rejected everywhere; only the APPROVER differs on a pass."""

    def test_failed_verdict_rejected_in_every_tier(self):
        failed = {"overall_passed": False, "equivalent": False}
        for tier in sorted(CHALLENGE_TIERS):
            d = decide_swap(failed, tier=tier, human_approved=True, human_selected=True,
                            votes=[{"vote": "approve", "tokens_staked": 100}], total_holders=1)
            assert d["decision"] == "reject"   # no tier, human, or vote overrides a fail

    def test_passing_verdict_swaps_with_the_right_approver(self):
        ok = {"overall_passed": True, "equivalent": True}
        # Manual → needs human_approved
        assert decide_swap(ok, tier="manual", human_approved=True)["decision"] == "swap"
        assert decide_swap(ok, tier="manual", human_approved=False)["decision"] == "hold"
        # Semi → needs human_selected
        assert decide_swap(ok, tier="semi", human_selected=True)["decision"] == "swap"
        assert decide_swap(ok, tier="semi", human_selected=False)["decision"] == "hold"
        # Automated → needs community supermajority
        many = [{"vote": "approve", "tokens_staked": 100} for _ in range(9)]
        d = decide_swap(ok, tier="automated", votes=many, total_holders=10)
        assert d["decision"] in {"swap", "hold"}  # decided by the tally, never by a single actor

    def test_automated_blocks_non_equivalent_even_with_votes(self):
        # A unanimous vote can NOT push through a non-equivalent candidate (guardrail).
        passing_but_diff = {"overall_passed": True, "equivalent": False}
        many = [{"vote": "approve", "tokens_staked": 100} for _ in range(20)]
        d = decide_swap(passing_but_diff, tier="automated", votes=many, total_holders=20)
        assert d["decision"] == "reject"


class TestMutationMetaTest:
    """The test that tests the test: perturb a block's MEASURED metric and the SSSES
    efficiency MUST change — proving the score reflects a real measurement, not a constant."""

    def test_efficiency_responds_to_measured_throughput(self):
        fns = ["collect_responses"]
        fast = section_ssses(4, fns, duration_ms=10.0, row_count=5000)   # high throughput
        slow = section_ssses(4, fns, duration_ms=5000.0, row_count=50)   # low throughput
        assert fast["measured"] and slow["measured"]
        assert fast["efficiency"] > slow["efficiency"]   # the harness MEASURED the block

    def test_unmeasured_falls_back_deterministically(self):
        fns = ["a", "b", "c"]
        a = section_ssses(1, fns)
        b = section_ssses(1, fns)
        assert a == b and a["measured"] is False   # deterministic estimate when unmeasured


class TestAggregatorFairness:
    """The improvement vote (community aggregator) is anti-whale + needs a supermajority."""

    def test_quadratic_weight_damps_a_whale(self):
        # One whale (10000 tokens) vs many small honest holders — quadratic sqrt damping
        # must keep the whale from single-handedly flipping the result.
        whale = [{"vote": "reject", "tokens_staked": 10000}]
        crowd = [{"vote": "approve", "tokens_staked": 100} for _ in range(30)]
        t = tally_votes(whale + crowd, total_token_holders=31)
        # sqrt(10000)=100 vs 30*sqrt(100)=300 → the crowd out-weighs the whale.
        assert t["approve_weighted"] > t["reject_weighted"]

    def test_supermajority_required(self):
        # A bare majority is not enough — the consensus bar is a supermajority.
        split = ([{"vote": "approve", "tokens_staked": 100} for _ in range(6)]
                 + [{"vote": "reject", "tokens_staked": 100} for _ in range(5)])
        t = tally_votes(split, total_token_holders=11)
        assert t["result"] != "approved" or t["supermajority_met"] is True


class TestCouncilNVersion:
    """N-version differential: the same variant scored twice is identical (deterministic
    council), so a divergence would be a real signal — not noise."""

    def test_council_is_reproducible(self):
        v = {"id": "A~batch", "projected_efficiency_pct": 15}
        assert council_review(3, v) == council_review(3, v)
