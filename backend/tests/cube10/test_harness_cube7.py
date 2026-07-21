"""Lock harness_cube7 — the real Cube 7 ranking math, offline + deterministic."""

from app.cubes.cube10_simulation.harness_cube7 import _THEMES, run_harness_cube7


def test_produces_full_order_and_winner():
    r = run_harness_cube7()
    assert r["cube"] == "cube7_ranking"
    for algo in ("unweighted", "quadratic"):
        assert set(r[algo]["order"]) == set(_THEMES)      # every theme ranked
        assert r[algo]["winner"] == r[algo]["order"][0]
        assert len(r[algo]["replay_hash"]) == 64


def test_replay_hash_depends_on_algorithm():
    # The C7-1 crux: identical ballots hash differently per algorithm.
    r = run_harness_cube7()
    assert r["hashes_differ"] is True
    assert r["unweighted"]["replay_hash"] != r["quadratic"]["replay_hash"]


def test_quadratic_weights_sum_to_one_and_capped():
    r = run_harness_cube7()
    w = r["quadratic"]["weights"]
    assert abs(sum(w.values()) - 1.0) < 1e-6      # normalized
    assert all(v <= 0.15 + 1e-6 or len(w) <= 6 for v in w.values())  # influence cap (anti-whale)


def test_deterministic():
    a = run_harness_cube7(seed="lock")
    b = run_harness_cube7(seed="lock")
    assert a == b
