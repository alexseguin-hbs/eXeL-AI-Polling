"""Cube 10 — Semi/Full-Auto agent SCAFFOLD tests (SA).

The autonomy tiers are DESIGNED + DEMOED on the shared backbone but stay DISABLED
until the operator confirms Manual aligned. These tests lock the scaffold's shape,
determinism, and the permanent guardrails (Thor SAFE veto, ≥10% projected gain,
supermajority) so the demo surface can't silently start authorizing swaps.
"""

import pytest

from app.cubes.cube10_simulation.agents import (
    COUNCIL_LENSES,
    ai_council,
    council_review,
    propose_variants,
)
from app.cubes.cube10_simulation.sections import sections_for


class TestScaffoldShape:
    def test_council_has_twelve_lenses_incl_thor(self):
        assert len(COUNCIL_LENSES) == 12
        assert "Thor" in COUNCIL_LENSES  # the SAFE veto lens

    def test_ai_council_is_disabled_by_default(self):
        out = ai_council(1, "A", ["make_session"])
        assert out["enabled"] is False           # demo + scaffold only
        assert out["active_tier"] == "manual"
        assert out["tier_ladder"] == ["manual", "semi", "automated"]

    def test_variants_are_scaffold_not_live(self):
        vs = propose_variants(1, "A", ["make_session"], count=3)
        assert 1 <= len(vs) <= 3
        assert all(v["source"] == "scaffold" for v in vs)
        assert all("description" in v and v["strategy"] for v in vs)


class TestDeterminism:
    def test_ai_council_deterministic(self):
        a = ai_council(4, "B", ["collect", "aggregate"])
        b = ai_council(4, "B", ["collect", "aggregate"])
        assert a == b  # no randomness — replayable

    def test_variant_projection_stable(self):
        v1 = propose_variants(2, "C", ["validate_text"])[0]
        v2 = propose_variants(2, "C", ["validate_text"])[0]
        assert v1["projected_efficiency_pct"] == v2["projected_efficiency_pct"]


class TestGuardrails:
    def test_unsafe_variant_never_recommended(self):
        # Force an unsafe verdict: a low-gain variant with no Thor safety can't be recommended.
        low = {"id": "x~prune", "projected_efficiency_pct": 3}
        r = council_review(1, low)
        assert r["recommended"] is False  # <10% projected gain fails the win bar

    def test_recommended_requires_safe(self):
        for cube_id in range(1, 10):
            for v in propose_variants(cube_id, "A", ["fn"], count=5):
                r = council_review(cube_id, v)
                if r["recommended"]:
                    assert r["safe"] is True            # RECOMMENDED implies SAFE
                    assert r["approvals"] >= 8          # supermajority of 12 (⌈2/3⌉)
                    assert v["projected_efficiency_pct"] >= 10

    def test_pillars_bounded(self):
        r = council_review(3, {"id": "y~batch", "projected_efficiency_pct": 15})
        assert set(r["votes"]) == set(COUNCIL_LENSES)
        assert 0 <= r["approvals"] <= 12
        assert isinstance(r["safe"], bool) and isinstance(r["recommended"], bool)


class TestEveryCubeSection:
    def test_scaffold_resolves_for_every_cube_and_block(self):
        for cube_id in range(1, 10):
            for blk in sections_for(cube_id, 0 or _n(cube_id)):
                out = ai_council(cube_id, blk["key"], blk.get("functions", []))
                assert out["cube_id"] == cube_id
                assert out["enabled"] is False
                assert len(out["variants"]) >= 1
                assert all("council" in v for v in out["variants"])


def _n(cube_id: int) -> int:
    # mirror _default_sections real counts so every block resolves
    return {1: 6, 2: 8, 3: 7, 4: 8, 5: 7, 6: 7, 7: 8, 8: 7, 9: 8}.get(cube_id, 4)
