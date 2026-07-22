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


class _Row:
    """Stand-in for an ORM row that carries the migration-026 hwr_face column."""
    hwr_face = None


class _LegacyRow:
    """A row WITHOUT the hwr_face column (ring not migrated) — must not crash."""
    __slots__ = ("id",)

    def __init__(self):
        self.id = "x"


def test_stamp_orm_noop_when_disabled():
    row = _Row()
    with patch.object(ra.settings, "hwr_enabled", False):
        assert ra.stamp_orm(row, key="sess", seq=0) is None
    assert row.hwr_face is None  # untouched


def test_stamp_orm_sets_face_when_enabled():
    row = _Row()
    with patch.object(ra.settings, "hwr_enabled", True), \
         patch.object(ra.settings, "hwr_seed", "s"):
        face = ra.stamp_orm(row, key="sess", seq=7)
    assert 0 <= face < 6
    assert row.hwr_face == face  # deterministic face stamped onto the row


def test_stamp_orm_legacy_row_no_column_returns_face_no_crash():
    # Ring on but the model lacks the column (migration not applied) → returns the
    # computed face for logging, sets nothing, never raises.
    row = _LegacyRow()
    with patch.object(ra.settings, "hwr_enabled", True):
        face = ra.stamp_orm(row, key="sess", seq=1)
    assert 0 <= face < 6
    assert not hasattr(row, "hwr_face")


def test_read_target_transparent():
    assert ra.read_target("responses") == "responses"


def test_faces_is_six():
    assert ra.faces() == 6
