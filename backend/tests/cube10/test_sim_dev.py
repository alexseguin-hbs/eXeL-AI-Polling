"""Cube 10 · Level-2 Simulation — Dev-Sim endpoints (see Cubes 1-9, Cube-1 I/O, run, check-in).

The Simulation option surface: list cubes, inspect Cube 1's inputs→functions→outputs, play-test
for metrics, and a Master Developer checks in a candidate → verdict + swap decision.

Run: cd backend && python -m pytest tests/cube10/test_sim_dev.py -v --tb=short
"""
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.cubes.cube10_simulation import router as r


def _admin():
    u = MagicMock(); u.role = "admin"; u.user_id = "auth0|dev"
    return u


class TestListCubes:
    @pytest.mark.asyncio
    async def test_lists_cubes_1_to_9(self):
        out = await r.sim_list_cubes()
        ids = [c["cube_id"] for c in out["cubes"]]
        assert ids == list(range(1, 10))
        c1 = next(c for c in out["cubes"] if c["cube_id"] == 1)
        c2 = next(c for c in out["cubes"] if c["cube_id"] == 2)
        c4 = next(c for c in out["cubes"] if c["cube_id"] == 4)
        c5 = next(c for c in out["cubes"] if c["cube_id"] == 5)
        c8 = next(c for c in out["cubes"] if c["cube_id"] == 8)
        c9 = next(c for c in out["cubes"] if c["cube_id"] == 9)
        assert c1["harness_available"] is True and c1["name"] == "Session Join & QR"
        # ALL of cubes 1-9 now have registered harnesses (Cube 10 is the host, not a target).
        assert c2["harness_available"] is True
        assert c4["harness_available"] is True
        assert c5["harness_available"] is True  # Cube 5 harness registered (G2)
        assert c8["harness_available"] is True  # Cube 8 harness registered (Phase 8)
        assert c9["harness_available"] is True  # Cube 9 harness registered (R2)


class TestContract:
    @pytest.mark.asyncio
    async def test_cube1_contract_has_io(self):
        out = await r.sim_cube_contract(1)
        assert out["cube_id"] == 1
        assert "create_session" in out["io_contract"]["functions"]
        assert "seed" in out["inputs"]
        assert len(out["sample_outputs"]["session_id"]) == 36

    @pytest.mark.asyncio
    async def test_cube2_contract_now_available(self):
        # R0.2: Cube 2 is registered → contract returns a minimal I/O contract (no 404).
        out = await r.sim_cube_contract(2)
        assert out["cube_id"] == 2
        assert out["name"] == "Text Submission"
        assert "sample_outputs" in out

    @pytest.mark.asyncio
    async def test_cube9_contract_now_available(self):
        # R2: Cube 9 is registered (all 1-9 now have harnesses) → contract, no 404.
        out = await r.sim_cube_contract(9)
        assert out["cube_id"] == 9
        assert "sample_outputs" in out

    @pytest.mark.asyncio
    async def test_out_of_range_400(self):
        with pytest.raises(HTTPException) as e:
            await r.sim_cube_contract(99)
        assert e.value.status_code == 400


class TestRun:
    @pytest.mark.asyncio
    async def test_cube1_run_metrics_and_signature(self):
        out = await r.sim_cube_run(1, user=_admin())
        assert out["cube_id"] == 1
        assert out["metrics"]["function_calls"] == 5
        assert len(out["determinism_signature"]) == 64


class TestChallenge:
    @pytest.mark.asyncio
    async def test_matching_candidate_manual_swap(self):
        # First learn the live signature, then check in an equivalent candidate.
        # The candidate carries the SAME determinism signature (proving equivalence) and a
        # trivially-fast duration. NOTE: the challenge measures its OWN fresh baseline wall
        # time, so we must NOT feed back the cold first-run wall_time_ms — that made the
        # ≤120% duration gate depend on run-to-run timing noise (cold vs warm) and flake.
        # An "at-least-as-fast equivalent candidate" (tiny absolute duration) is the honest,
        # deterministic representation — same convention as test_different_candidate_rejected.
        base = await r.sim_cube_run(1, user=_admin())
        payload = r.SimChallengeRequest(
            candidate={"signature": base["determinism_signature"],
                       "duration_ms": 0.001},
            tier="manual", human_approved=True,
        )
        out = await r.sim_cube_challenge(1, payload, user=_admin())
        assert out["verdict"]["overall_passed"] is True
        assert out["decision"]["decision"] == "swap"

    @pytest.mark.asyncio
    async def test_different_candidate_rejected(self):
        payload = r.SimChallengeRequest(
            candidate={"signature": "z" * 64, "duration_ms": 0.001},
            tier="automated",
        )
        out = await r.sim_cube_challenge(1, payload, user=_admin())
        assert out["verdict"]["overall_passed"] is False
        assert out["decision"]["decision"] == "reject"
