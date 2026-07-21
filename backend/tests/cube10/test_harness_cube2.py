"""Lock harness_cube2 — the real Cube 2 submission pipeline, offline + deterministic."""

import asyncio

from app.cubes.cube10_simulation.harness_cube2 import _SAMPLES, run_harness_cube2


def _run(coro):
    return asyncio.run(coro)


def test_runs_all_samples_offline():
    r = _run(run_harness_cube2(_SAMPLES))
    assert r["cube"] == "cube2_text"
    assert r["total"] == len(_SAMPLES)
    assert all(len(row["response_hash"]) == 64 for row in r["rows"])


def test_pii_detected_and_scrubbed():
    # Sample 0 carries an email + phone → detected and scrubbed via the regex path.
    r = _run(run_harness_cube2(_SAMPLES))
    row0 = r["rows"][0]
    assert row0["pii_detected"] >= 1
    assert row0["pii_scrubbed"] is True
    assert "@example.com" not in row0["clean_text"]
    assert r["pii_responses"] >= 1


def test_deterministic_signature_64hex():
    a = _run(run_harness_cube2(_SAMPLES))
    b = _run(run_harness_cube2(_SAMPLES))
    assert a["determinism_signature"] == b["determinism_signature"]
    assert len(a["determinism_signature"]) == 64
    int(a["determinism_signature"], 16)


def test_ner_loader_restored_after_run():
    import app.cubes.cube2_text.service as svc
    before = svc._get_ner_pipeline
    _run(run_harness_cube2(_SAMPLES))
    assert svc._get_ner_pipeline is before  # harness restores the original loader
