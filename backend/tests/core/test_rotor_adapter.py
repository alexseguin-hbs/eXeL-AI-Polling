"""HWR H3 — the cube-facing adapter: face routing + NON-BREAKING flag fallback."""

from unittest.mock import patch

from app.core.rcore import rotor_adapter as ra


def test_disabled_by_default_stamp_is_noop():
    # Default (hwr_enabled=False): stamp_face returns the SAME record, unchanged.
    rec = {"id": "r1", "text": "hi"}
    with patch.object(ra.settings, "hwr_enabled", False):
        out = ra.stamp_face(rec, key="sess", seq=0)
    assert out is rec  # identity — zero behavior change
    assert "hwr_face" not in out


def test_enabled_stamps_face():
    rec = {"id": "r1"}
    with patch.object(ra.settings, "hwr_enabled", True), \
         patch.object(ra.settings, "hwr_seed", "s"):
        out = ra.stamp_face(rec, key="sess", seq=3)
    assert out is not rec  # new dict, original untouched
    assert 0 <= out["hwr_face"] < 6
    assert "hwr_face" not in rec  # original not mutated


def test_assign_face_deterministic_and_in_range():
    for seq in range(30):
        f = ra.assign_face("k", seq, "seed")
        assert 0 <= f < 6
        assert f == ra.assign_face("k", seq, "seed")


def test_hwr_enabled_reads_settings():
    with patch.object(ra.settings, "hwr_enabled", True):
        assert ra.hwr_enabled() is True
    with patch.object(ra.settings, "hwr_enabled", False):
        assert ra.hwr_enabled() is False


def test_read_target_transparent():
    assert ra.read_target("responses") == "responses"


def test_faces_is_six():
    assert ra.faces() == 6
