"""Lock harness_cube8 — the real Cube 8 token economics + lifecycle walk, deterministic."""

from app.cubes.cube10_simulation.harness_cube8 import run_harness_cube8


def test_produces_token_result_with_signature():
    r = run_harness_cube8()
    assert r["cube"] == "cube8_tokens"
    assert len(r["determinism_signature"]) == 64
    for k in ("tokens", "fee_hi_tokens", "lifecycle_path", "lifecycle_terminal"):
        assert k in r
    # ◬ = ♡ × 5 (unity multiplier).
    assert r["tokens"]["unity"] == r["tokens"]["heart"] * 5
    # The append-only lifecycle walks to a terminal finalized state (never side-exits to reversed).
    assert r["lifecycle_path"] == ["simulated", "pending", "approved", "finalized"]
    assert r["lifecycle_terminal"] == "finalized"
    # $11.11 fee → 1.532 웃 (real dollars_to_hi_tokens: /7.25).
    assert r["fee_hi_tokens"] == 1.532


def test_deterministic():
    assert run_harness_cube8()["determinism_signature"] == \
        run_harness_cube8()["determinism_signature"]
