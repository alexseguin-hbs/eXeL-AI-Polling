"""Phase A3 — Cube 1 stand-alone simulation harness lock (Simulation Tier ① · CRS-26→31).

The determinism ORACLE for the Challenge System: same seed → identical outputs +
determinism signature; different seed → different identity. Proves Cube 1 is a runnable,
offline, deterministic, optimizable unit (simulated inputs → actual outputs + metrics).

Run: cd backend && python -m pytest tests/cube1/test_harness_cube1.py -v --tb=short
"""
import pytest

from app.cubes.cube10_simulation.harness_cube1 import simulate_cube1, transition_matrix


class TestHarnessDeterminism:
    @pytest.mark.asyncio
    async def test_same_seed_same_signature(self):
        a = await simulate_cube1(seed="opt-oracle-1")
        b = await simulate_cube1(seed="opt-oracle-1")
        assert a["determinism_signature"] == b["determinism_signature"]
        # Deterministic identity + replay hash reproduce exactly.
        assert a["outputs"]["session_id"] == b["outputs"]["session_id"]
        assert a["outputs"]["replay_hash"] == b["outputs"]["replay_hash"]
        assert a["outputs"]["qr_identity_sha256"] == b["outputs"]["qr_identity_sha256"]

    @pytest.mark.asyncio
    async def test_different_seed_different_identity(self):
        a = await simulate_cube1(seed="seed-A")
        b = await simulate_cube1(seed="seed-B")
        assert a["outputs"]["session_id"] != b["outputs"]["session_id"]
        assert a["determinism_signature"] != b["determinism_signature"]

    @pytest.mark.asyncio
    async def test_actual_outputs_shapes(self):
        r = await simulate_cube1(seed="shape-check")
        out = r["outputs"]
        # UUID5 id, 64-hex replay hash, valid PNG, draft status.
        assert len(out["session_id"]) == 36
        assert len(out["replay_hash"]) == 64
        assert out["qr_png_valid"] is True and out["qr_png_bytes"] > 0
        assert out["status"] == "draft"
        assert out["qr_accessible"] is True
        # Short code: 8 chars from the safe alphabet (no 0/O/1/l/I).
        assert len(out["short_code"]) == 8
        assert not (set(out["short_code"]) & set("0O1lI"))

    @pytest.mark.asyncio
    async def test_metrics_baseline_present(self):
        r = await simulate_cube1(seed="metrics")
        m = r["metrics"]
        assert m["function_calls"] == 5
        assert m["db_execute_calls"] >= 2       # uuid5 existence + short-code uniqueness
        assert m["db_writes"] >= 1              # the session row
        assert isinstance(m["wall_time_ms"], float) and m["wall_time_ms"] >= 0

    @pytest.mark.asyncio
    async def test_io_contract_emitted(self):
        r = await simulate_cube1(seed="contract")
        c = r["io_contract"]
        assert "create_session" in c["functions"]
        assert "generate_qr_png" in c["functions"]
        assert "_compute_replay_hash" in c["functions"]
        assert "seed" in c["inputs"]
        assert any("session_id" in o for o in c["outputs"])


class TestTransitionMatrix:
    def test_matrix_matches_state_machine(self):
        m = transition_matrix()
        # Valid forward transitions.
        assert m["draft"]["open"] is True
        assert m["open"]["polling"] is True
        assert m["polling"]["ranking"] is True
        assert m["ranking"]["polling"] is True      # cycle back
        assert m["closed"]["archived"] is True
        # Invalid transitions.
        assert m["draft"]["polling"] is False
        assert m["archived"]["open"] is False
        assert m["open"]["archived"] is False
