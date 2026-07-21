"""R1: lock the Cube 2 5,000-row MOCK dataset simulation.

Runs the REAL Cube 2 pipeline (validate → PII → scrub → profanity → hash) over the
v04.1_5000 dataset, streaming + offline + deterministic. Bounded to a subset here
for CI speed; the full 5,000-row run is exercised via the harness __main__ / Dev-Sim.
"""

import asyncio

from app.cubes.cube10_simulation.harness_cube2 import run_harness_cube2_dataset


def _run(coro):
    return asyncio.run(coro)


def test_dataset_sim_produces_real_metrics():
    r = _run(run_harness_cube2_dataset(limit=300))
    assert r["cube"] == "cube2_text"
    assert r["total"] > 0
    # Every included response yields a hash; the mock data has no exact dupes.
    assert r["unique_hashes"] == r["total"]
    assert r["reprocessed"] >= 0
    assert r["avg_chars"] > 0
    assert len(r["determinism_signature"]) == 64
    assert r["metrics"]["function_calls"] == r["total"] * 5


def test_dataset_sim_is_deterministic():
    a = _run(run_harness_cube2_dataset(limit=300))
    b = _run(run_harness_cube2_dataset(limit=300))
    assert a["determinism_signature"] == b["determinism_signature"]
    assert a["total"] == b["total"] and a["reprocessed"] == b["reprocessed"]


def test_dataset_sim_reprocesses_overlength_and_includes_all():
    # The dataset has responses beyond the 3,333-char cap. Second-pass reprocessing
    # fits + INCLUDES them (never dropped): every ~5,000 row is counted in total.
    r = _run(run_harness_cube2_dataset(limit=0))
    assert r["total"] > 4990  # all rows included (no rejections)
    assert r["reprocessed"] > 0  # some were over-length and got the second pass
    assert r["unique_hashes"] == r["total"]
