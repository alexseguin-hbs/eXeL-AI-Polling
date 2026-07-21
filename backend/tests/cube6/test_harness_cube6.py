"""Lock the Cube 6 theming harness (C6-3) — real phase_b engine on 25 responses.

Proves the operator's "load user results and perform theming" test: the REAL
classify → group → marble → generate → reduce → assign engine runs offline on
the 25-response fixture, produces the 3 Theme 01 buckets, assigns every response
a Theme 02, and is deterministic (identical signature across runs).
"""

import asyncio

from app.cubes.cube10_simulation.harness_cube6 import run_harness_cube6
from app.cubes.cube6_ai import phase_b as pb
from tests.fixtures.live_feedback_25 import LIVE_FEEDBACK_25


def _run(coro):
    return asyncio.run(coro)


def test_all_25_classified_into_three_buckets():
    r = _run(run_harness_cube6(LIVE_FEEDBACK_25))
    assert r["total_responses"] == 25
    assert set(r["theme01_counts"].keys()) == set(pb.THEME01_CATEGORIES)
    assert sum(r["theme01_counts"].values()) == 25


def test_every_response_assigned_a_theme02():
    r = _run(run_harness_cube6(LIVE_FEEDBACK_25))
    assert r["assigned"] == 25
    assert all(a["theme2_3"] for a in r["assignments"])


def test_theme02_generated_per_populated_bucket():
    r = _run(run_harness_cube6(LIVE_FEEDBACK_25))
    for cat, count in r["theme01_counts"].items():
        if count > 0:
            # A populated bucket must have at least one real Theme 02 at level 3.
            assert r["theme02"][cat]["3"], f"{cat} has responses but no Theme 02"


def test_determinism_signature_is_stable_64hex():
    a = _run(run_harness_cube6(LIVE_FEEDBACK_25, seed="lock"))
    b = _run(run_harness_cube6(LIVE_FEEDBACK_25, seed="lock"))
    assert a["determinism_signature"] == b["determinism_signature"]
    assert len(a["determinism_signature"]) == 64
    int(a["determinism_signature"], 16)  # valid hex


def test_different_seed_changes_sampling_but_all_still_assigned():
    a = _run(run_harness_cube6(LIVE_FEEDBACK_25, seed="lock"))
    b = _run(run_harness_cube6(LIVE_FEEDBACK_25, seed="other"))
    # Theme01 classification is seed-independent (deterministic per text).
    assert a["theme01_counts"] == b["theme01_counts"]
    assert b["assigned"] == 25
