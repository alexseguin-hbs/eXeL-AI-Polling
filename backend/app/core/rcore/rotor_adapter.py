"""HWR adapter — the cube-facing seam between application writes and the 6-face ring.

Cubes call `stamp_face(record, key=…, seq=…)` before a write instead of writing raw.
When `settings.hwr_enabled` is TRUE (the 6-partition ring is provisioned in Supabase),
the record is stamped with its seeded `hwr_face` (0..5) and Postgres hash-partition
routing lands it on that face; reads go through the parent table (transparent) or the
hub view. When `hwr_enabled` is FALSE (the default), `stamp_face` is a NO-OP and the
record flows down the cube's existing single-table path — so wiring the adapter into
Cube 1-8 NEVER changes today's behavior until the ring is turned on.

Pure routing/policy layer (no DB): the actual partition routing is Postgres's job
(migration 026); this decides the face value + the read target, offline-testable.
"""

from __future__ import annotations

from app.config import settings
from app.core.rcore.write_rotor import FACES, rotor_face


def hwr_enabled() -> bool:
    """True when the 6-face ring is active (else writes use the legacy single-table path)."""
    return bool(getattr(settings, "hwr_enabled", False))


def assign_face(key: str, seq: int, seed: str | None = None) -> int:
    """The face (0..5) a record routes to — seeded so replay reproduces it exactly."""
    return rotor_face(key, seq, seed or getattr(settings, "hwr_seed", "hwr"))


def stamp_face(record: dict, *, key: str, seq: int) -> dict:
    """Return the record ready for the ring: adds `hwr_face` when enabled, else unchanged.

    Non-breaking by construction — when HWR is off this returns the SAME record object,
    so a cube can adopt the seam with zero behavior change until the ring is provisioned.
    """
    if not hwr_enabled():
        return record
    return {**record, "hwr_face": assign_face(key, seq)}


def stamp_orm(record, *, key: str, seq: int) -> int | None:
    """Stamp an ORM object with its seeded HWR face when the ring is enabled.

    Non-breaking by construction: returns None and touches NOTHING when HWR is off, so
    a cube can adopt this seam at its write site with zero behavior change. When the ring
    is on it computes the deterministic face (0..5) and, if the model carries the
    `hwr_face` column (migration 026 applied), sets it so the row routes to that partition.
    Returns the computed face either way (for logging/audit), or None when disabled.

    Complements `stamp_face` (dict path) — this is the ORM path Cubes 1-8 write through.
    """
    if not hwr_enabled():
        return None
    face = assign_face(key, seq)
    if hasattr(record, "hwr_face"):
        record.hwr_face = face
    return face


def read_target(base_table: str) -> str:
    """The table to SELECT from: the partitioned parent (transparent) when enabled, or
    the hub materialized view for coalesced reads; the base table when disabled.

    With Postgres declarative HASH partitioning the parent is read transparently, so the
    default read target stays `base_table` either way; a caller wanting the pre-coalesced
    hub can pass through `f"{base_table}_hub"` when the ring is on.
    """
    return base_table


def faces() -> int:
    """Number of ring faces (6 = a cube's faces / hex / drone-swarm modular units)."""
    return FACES
