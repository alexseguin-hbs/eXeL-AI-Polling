"""Lock harness_cube5 — the real Cube 5 MoT economics chain, offline + deterministic."""

from app.cubes.cube10_simulation.harness_cube5 import run_harness_cube5


def test_produces_economics_result_with_signature():
    r = run_harness_cube5()
    assert r["cube"] == "cube5_gateway"
    assert len(r["determinism_signature"]) == 64
    for k in ("tokens", "active_min", "cost_usd", "profit", "chart", "series"):
        assert k in r
    # ♡ = ceil-minutes per participant summed; ◬ = ♡ × 5 (unity multiplier).
    assert r["tokens"]["unity"] == r["tokens"]["heart"] * 5
    # profit block is well-formed (revenue − cost).
    assert r["profit"]["profit_usd"] == round(
        r["profit"]["revenue_usd"] - r["profit"]["cost_usd"], 4
    )


def test_deterministic():
    assert run_harness_cube5()["determinism_signature"] == \
        run_harness_cube5()["determinism_signature"]
