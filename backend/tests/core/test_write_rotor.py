"""HWR — Hexagonal Write Rotor: 6-face seeded rotor + coalesce (pure, deterministic).

The write-layer analogue of Trinity Redundancy: 6 faces absorb, 1 hub coalesces, any
subset succeeding still yields ONE canonical record, and the whole path is replayable.
"""

from app.core.rcore.write_rotor import (
    FACES,
    RotorRing,
    coalesce,
    rotor_face,
)


def test_six_faces():
    assert FACES == 6


def test_rotor_face_in_range_and_deterministic():
    for seq in range(50):
        f = rotor_face("session-1", seq, "seed42")
        assert 0 <= f < 6
        assert f == rotor_face("session-1", seq, "seed42")  # deterministic


def test_rotor_face_seed_changes_assignment():
    # A different seed generally reshuffles the face for at least some seqs.
    a = [rotor_face("k", s, "seedA") for s in range(30)]
    b = [rotor_face("k", s, "seedB") for s in range(30)]
    assert a != b


def test_distribution_uses_all_faces():
    ring = RotorRing(seed="s")
    for i in range(600):
        ring.write({"i": i}, key="sess")
    counts = ring.face_counts()
    assert sum(counts) == 600
    assert all(c > 0 for c in counts)  # every face used
    # Reasonably balanced (no face starves or hogs): within 3x of the mean.
    mean = 100
    assert all(mean / 3 <= c <= mean * 3 for c in counts)


def test_coalesce_dedups_by_content():
    # Same record arriving on 3 different faces coalesces to ONE (Trinity at write layer).
    rec = {"id": "r1", "text": "hello"}
    result = coalesce([[rec], [dict(rec)], [dict(rec)], [], [], []])
    assert result["count"] == 1
    assert result["dedup_removed"] == 2
    assert result["faces"] == 6


def test_coalesce_deterministic_replay_hash_regardless_of_order():
    recs = [{"id": f"r{i}"} for i in range(10)]
    # Two different face-distributions of the SAME set → identical canonical + hash.
    a = coalesce([recs[0:3], recs[3:6], recs[6:10], [], [], []])
    b = coalesce([recs[6:10], [], recs[0:3], recs[3:6], [], []])
    assert a["rows"] == b["rows"]
    assert a["replay_hash"] == b["replay_hash"]
    assert len(a["replay_hash"]) == 64


def test_subset_survival_any_faces_coalesce():
    # Even if only 2 of 6 faces have data (others timed out), the writes survive.
    recs = [{"id": f"r{i}"} for i in range(5)]
    full = coalesce([recs[:2], recs[2:], [], [], [], []])
    partial = coalesce([[], recs[2:], recs[:2], [], [], []])
    assert full["count"] == 5 and partial["count"] == 5
    assert full["replay_hash"] == partial["replay_hash"]


def test_ring_read_all_reproducible():
    def build():
        ring = RotorRing(seed="fixed")
        for i in range(100):
            ring.write({"id": f"r{i}", "v": i}, key="sess-x")
        return ring.read_all()

    a, b = build(), build()
    assert a["count"] == 100
    assert a["replay_hash"] == b["replay_hash"]  # bit-reproducible end to end


def test_backward_attribution_matches_forward():
    # Backward: given (key, seq) the same seeded selector re-derives the face a write
    # landed on (forward=write→coalesce, backward=coalesce→per-face attribution).
    ring = RotorRing(seed="fixed")
    faces_written = [ring.write({"i": i}, key="sess-x") for i in range(20)]
    faces_attributed = [ring.attribute("sess-x", seq) for seq in range(20)]
    assert faces_written == faces_attributed
