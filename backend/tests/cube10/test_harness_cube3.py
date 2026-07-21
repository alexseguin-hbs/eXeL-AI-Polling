"""Lock harness_cube3 — the real Cube 3 transcript-validation + downstream path, offline."""

import asyncio

from app.cubes.cube10_simulation.harness_cube3 import run_harness_cube3


def _run(coro):
    return asyncio.run(coro)


def test_included_and_rejected_counts():
    r = _run(run_harness_cube3())
    assert r["cube"] == "cube3_voice"
    # 4 samples: 1 below the 0.3 confidence threshold is rejected; 3 included.
    assert r["included"] == 3
    assert r["rejected_low_confidence"] == 1
    assert r["truncated_overlength"] == 1  # the over-length transcript is truncated + included
    assert r["unique_hashes"] == r["included"]
    assert len(r["determinism_signature"]) == 64


def test_pii_scrubbed_on_voice_path():
    r = _run(run_harness_cube3())
    assert r["pii_responses"] >= 1 and r["scrubbed"] >= 1


def test_deterministic():
    assert _run(run_harness_cube3())["determinism_signature"] == \
        _run(run_harness_cube3())["determinism_signature"]
