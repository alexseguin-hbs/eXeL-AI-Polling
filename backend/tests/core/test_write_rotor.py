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


# ── Supabase-faithful natural-key fast path (dedup by id, not content hash) ──

def test_coalesce_dedup_key_dedups_by_natural_key():
    # Same id on two faces → ONE row (mirrors a Postgres PRIMARY KEY / UNIQUE constraint).
    recs = [{"id": i, "v": i} for i in range(10)]
    out = coalesce([recs, recs[:3], [], [], [], []], dedup_key="id")
    assert out["count"] == 10
    assert out["dedup_removed"] == 3


def test_coalesce_dedup_key_deterministic_replay_hash():
    recs = [{"id": i, "v": i} for i in range(50)]

    def run():
        return coalesce([recs[:25], recs[25:], [], [], [], []], dedup_key="id")

    a, b = run(), run()
    assert a["replay_hash"] == b["replay_hash"]
    assert len(a["replay_hash"]) == 64


def test_coalesce_dedup_key_same_rowset_as_content_mode():
    # Both modes yield the SAME set of surviving rows (only ordering/replay_hash differ).
    recs = [{"id": i, "v": i} for i in range(30)]
    fast = coalesce([recs, recs, [], [], [], []], dedup_key="id")
    content = coalesce([recs, recs, [], [], [], []])
    assert fast["count"] == content["count"] == 30
    assert {r["id"] for r in fast["rows"]} == {r["id"] for r in content["rows"]}


def test_read_all_dedup_key_pass_through():
    ring = RotorRing(seed="fixed")
    for i in range(100):
        ring.write({"id": i, "v": i}, key="sess")
    out = ring.read_all(dedup_key="id")
    assert out["count"] == 100 and len(out["replay_hash"]) == 64


# ── H-B: streaming-Merkle replay hash (write-time amortized, O(FACES) finalize) ──

def test_merkle_replay_hash_deterministic():
    def build():
        ring = RotorRing(seed="fixed", track_merkle=True)
        for i in range(500):
            ring.write({"id": i, "v": i}, key="sess")
        return ring.merkle_replay_hash()

    a, b = build(), build()
    assert a == b and len(a) == 64  # same writes, same order → same Merkle root


def test_merkle_replay_hash_order_sensitive():
    # The stream proof is order-sensitive (unlike the dedup coalesce replay_hash).
    r1 = RotorRing(seed="fixed", track_merkle=True)
    for i in [1, 2, 3]:
        r1.write({"id": i}, key="k")
    r2 = RotorRing(seed="fixed", track_merkle=True)
    for i in [3, 2, 1]:
        r2.write({"id": i}, key="k")
    assert r1.merkle_replay_hash() != r2.merkle_replay_hash()


def test_merkle_finalize_does_not_rescan_rows():
    # O(FACES): merkle_replay_hash reads only the 6 rolling digests, not the row buffers.
    ring = RotorRing(seed="fixed", track_merkle=True)
    for i in range(50):
        ring.write({"id": i}, key="k")
    h = ring.merkle_replay_hash()
    # Mutating the stored row buffers must NOT change the already-folded digest root.
    ring._faces[0].append({"id": "tamper"})
    assert ring.merkle_replay_hash() == h


# ── H-C: absorb_bulk — one-call bulk absorb (Tier 2, 1M calls → few) ──

def test_absorb_bulk_all_unique_survive():
    from app.core.rcore.write_rotor import absorb_bulk
    recs = [{"id": i, "v": i} for i in range(1000)]
    out = absorb_bulk(recs, dedup_key="id")
    assert out["count"] == 1000 and out["dedup_removed"] == 0
    assert sum(out["face_counts"]) == 1000
    assert min(out["face_counts"]) / max(out["face_counts"]) >= 0.9  # even spread


def test_absorb_bulk_deterministic_and_dedups():
    from app.core.rcore.write_rotor import absorb_bulk
    recs = [{"id": i % 100, "v": i} for i in range(300)]  # 100 unique ids, 3× each
    a = absorb_bulk(recs, dedup_key="id")
    b = absorb_bulk(recs, dedup_key="id")
    assert a["count"] == 100 and a["dedup_removed"] == 200
    assert a["replay_hash"] == b["replay_hash"] and len(a["replay_hash"]) == 64


def test_absorb_bulk_matches_ring_write_rows():
    # absorb_bulk is the bulk analogue of write()+read_all — same surviving id set.
    from app.core.rcore.write_rotor import RotorRing, absorb_bulk
    recs = [{"id": i} for i in range(200)]
    ring = RotorRing(seed="hwr")
    for r in recs:
        ring.write(r, key=str(r["id"]))
    bulk = absorb_bulk(recs, dedup_key="id")
    assert {r["id"] for r in bulk["rows"]} == {r["id"] for r in ring.read_all(dedup_key="id")["rows"]}
