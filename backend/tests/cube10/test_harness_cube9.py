"""Lock harness_cube9 — the real Cube 9 export governance-hash, offline + deterministic."""

from app.cubes.cube10_simulation.harness_cube9 import run_harness_cube9


def test_produces_export_hash_with_signature():
    r = run_harness_cube9()
    assert r["cube"] == "cube9_reports"
    assert r["columns"] == 20  # 20-col CSV schema
    assert r["rows"] == 3
    assert len(r["export_hash"]) == 64  # real SHA-256 governance hash
    assert len(r["determinism_signature"]) == 64


def test_deterministic():
    assert run_harness_cube9()["determinism_signature"] == \
        run_harness_cube9()["determinism_signature"]
    assert run_harness_cube9()["export_hash"] == run_harness_cube9()["export_hash"]
