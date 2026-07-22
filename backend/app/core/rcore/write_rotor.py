"""Hexagonal Write Rotor (HWR) — the shared write-absorption substrate.

A distributor-cap for writes: each record is rotated to one of SIX faces (the hex
ring = a cube's 6 faces), absorbed fast + contention-free, then coalesced at ONE hub
(6 faces + 1 hub = Seed of Life). This is the write-layer analogue of the read-layer
Trinity Redundancy: any subset of faces succeeding still coalesces to ONE canonical
record (dedup by content hash), so a slow/failed face never drops a write.

R-Core by construction:
  · DETERMINISTIC — face = seeded hash(key, seq, seed) mod 6, so replay reproduces the
    exact face assignment; the coalesced output carries a `replay_hash`.
  · REPRODUCIBLE both directions — forward (write→coalesce) and backward (coalesce→
    per-face attribution via the same seeded `rotor_face`).
  · The 6-fold modularity is the same primitive a drone swarm uses later (6 modular
    units + 1 coordinator).

This module is PURE + offline (in-memory shard buffers): no DB, no network. The
production 6-Postgres-hash-partition binding lives in the adapter + migration; this is
the algorithm + oracle.
"""

from __future__ import annotations

import hashlib
import json

FACES: int = 6  # a cube's 6 faces / hex ring / drone-swarm modular units


def rotor_face(key: str, seq: int, seed: str = "hwr") -> int:
    """Deterministic face selector: seeded hash(key, seq, seed) mod 6 → 0..5.

    Seeded so a replay with the same (key, seq, seed) always lands on the same face —
    the property that makes the whole absorb→coalesce path bit-reproducible.
    """
    h = hashlib.sha256(f"{seed}:{key}:{seq}".encode()).hexdigest()
    return int(h, 16) % FACES


def _content_hash(record: dict) -> str:
    """Stable content fingerprint for dedup on coalesce (order-independent keys)."""
    return hashlib.sha256(
        json.dumps(record, sort_keys=True, default=str).encode()
    ).hexdigest()


def coalesce(face_batches: list[list[dict]]) -> dict:
    """Pull the 6 faces together at the hub → ONE canonical, deduped, ordered result.

    Dedup by content hash (Trinity `seenIds` idea — the SAME record arriving on more
    than one face counts once). Deterministic ordering by content hash so the result +
    its `replay_hash` are reproducible regardless of face-arrival order. Returns
    {rows, count, dedup_removed, faces, replay_hash}.
    """
    seen: set[str] = set()
    canonical: list[tuple[str, dict]] = []
    total_in = 0
    for batch in face_batches:
        for record in batch:
            total_in += 1
            ch = _content_hash(record)
            if ch in seen:
                continue
            seen.add(ch)
            canonical.append((ch, record))

    canonical.sort(key=lambda t: t[0])  # deterministic order (by content hash)
    rows = [r for _ch, r in canonical]
    replay_hash = hashlib.sha256(
        ":".join(ch for ch, _r in canonical).encode()
    ).hexdigest()
    return {
        "rows": rows,
        "count": len(rows),
        "dedup_removed": total_in - len(rows),
        "faces": len(face_batches),
        "replay_hash": replay_hash,
    }


class RotorRing:
    """In-memory 6-face write ring (the offline oracle; prod = 6 Postgres partitions).

    `write` rotates a record to its seeded face; `read_all` gathers all faces and
    coalesces to the canonical hub result. Deterministic + reproducible.
    """

    def __init__(self, seed: str = "hwr") -> None:
        self.seed = seed
        self._faces: list[list[dict]] = [[] for _ in range(FACES)]
        self._seq = 0

    def write(self, record: dict, *, key: str) -> int:
        """Absorb one record onto its seeded face; returns the face index (0..5)."""
        face = rotor_face(key, self._seq, self.seed)
        self._faces[face].append(record)
        self._seq += 1
        return face

    def face_counts(self) -> list[int]:
        """Per-face absorbed-record counts (write-balance signal)."""
        return [len(f) for f in self._faces]

    def read_all(self) -> dict:
        """Gather all 6 faces → coalesce → canonical hub result (with replay_hash)."""
        return coalesce(self._faces)

    def attribute(self, key: str, seq: int) -> int:
        """Backward reproducibility: which face DID (key, seq) land on? (same seed)."""
        return rotor_face(key, seq, self.seed)


# ---------------------------------------------------------------------------
# H2 — R-Core surfaces for the rotor (metrics triad + audit on coalesce)
# ---------------------------------------------------------------------------


def rotor_metrics(ring: "RotorRing", coalesced: dict, *, distinct_writers: int = 0) -> dict:
    """SSSES System/User/Outcome triad for a write rotor (pure).

    System  — per-face absorbed counts + balance (max/min face load; 1.0 = perfectly even)
    User    — distinct writers who fed the ring
    Outcome — coalesced canonical count, dedup removed, replay_hash (reproducibility proof)
    """
    counts = ring.face_counts()
    total = sum(counts)
    hi, lo = (max(counts), min(counts)) if counts else (0, 0)
    balance = round(lo / hi, 4) if hi > 0 else 1.0  # 1.0 = perfectly even across faces
    return {
        "component": "hex_write_rotor",
        "system": {
            "faces": FACES,
            "writes_absorbed": total,
            "face_counts": counts,
            "balance": balance,
        },
        "user": {"distinct_writers": int(distinct_writers)},
        "outcome": {
            "coalesced_count": coalesced.get("count", 0),
            "dedup_removed": coalesced.get("dedup_removed", 0),
            "replay_hash": coalesced.get("replay_hash"),
        },
    }


def audit_coalesce(db, *, session_id, actor_id: str, coalesced: dict, actor_role: str = "system"):
    """Write one append-only AuditLog row per hub coalesce (R-Core Human-Authority trail).

    Records who/when coalesced how many faces into how many canonical rows + the
    replay_hash — the write-side analogue of the per-transition audit on cubes 1-9.
    Delegates to the shared core.audit.log_audit (caller owns the commit).
    """
    from app.core.audit import log_audit

    return log_audit(
        db,
        session_id=session_id,
        actor_id=actor_id,
        actor_role=actor_role,
        action_type="hwr.coalesce",
        object_type="hex_write_rotor",
        object_id=coalesced.get("replay_hash"),
        after={
            "faces": coalesced.get("faces"),
            "coalesced_count": coalesced.get("count"),
            "dedup_removed": coalesced.get("dedup_removed"),
            "replay_hash": coalesced.get("replay_hash"),
        },
    )
