"""Cube 1 — stand-alone simulation harness (Simulation Tier ① MANUAL · CRS-26→31).

The operator's ask: "code Cube 1 stand-alone — all functions runnable with SIMULATED
inputs → ACTUAL outputs so someone can optimize Cube 1 (better metrics, less compute,
more elegant)." This is the runnable Cube-1 Checkout Contract (docs/CUBE_10.md) and the
Tier① reference for the Challenge System (docs/CUBE_10.md → Simulation Autonomy Maturity).

It drives the REAL Cube-1 service functions against a minimal in-memory DB — no Postgres,
no network, fully offline and DETERMINISTIC given a seed — and returns:
  • ACTUAL outputs   — deterministic UUID5 session id, short code, join URL, QR PNG bytes,
                       SHA-256 replay hash, the state-machine transition validity matrix.
  • a METRICS baseline — function calls, db reads, wall-time (perf only), QR byte size.
  • a DETERMINISM SIGNATURE — sha256 over the deterministic outputs ONLY (excludes the
                       random short code + wall-time). Same seed → identical signature.
                       This is the objective referee for "is an optimized Cube 1 truly
                       equivalent + faster" (an 8×8×8 replacing a 10×10×10).
  • an I/O CONTRACT map — inputs → functions → outputs — the runnable diagram.

Run stand-alone:  cd backend && python -m app.cubes.cube10_simulation.harness_cube1
Locked by:        tests/cube1/test_harness_cube1.py
"""
from __future__ import annotations

import hashlib
import json
import time
import uuid

from app.cubes.cube1_session import service as cube1
from app.models.session import SESSION_TRANSITIONS

# Fixed namespace so the QR-of-identity is deterministic per session id.
_QR_NS = "exel:cube1:qr"


class _EmptyResult:
    """Universal empty query result: no collisions, no existing rows, no responses."""

    def scalar_one_or_none(self):
        return None

    def scalar_one(self):
        return 0

    def scalars(self):
        return self

    def all(self):
        return []

    def one(self):
        class _Z:  # zeroed aggregate row
            total_seconds = 0.0
            total_heart = total_human = total_unity = 0.0

        return _Z()


class _HarnessDB:
    """Minimal in-memory async DB stand-in for offline Cube-1 simulation.

    Every read returns empty (unique code always available, no existing session, no
    responses); writes are recorded so the harness can inspect what the cube produced.
    Counts reads/writes for the metrics baseline.
    """

    def __init__(self) -> None:
        self.added: list = []
        self.commits = 0
        self.execute_calls = 0

    async def execute(self, *_a, **_k):
        self.execute_calls += 1
        return _EmptyResult()

    def add(self, obj) -> None:
        self.added.append(obj)

    async def commit(self) -> None:
        self.commits += 1

    async def flush(self) -> None:  # pragma: no cover - not exercised
        pass

    async def refresh(self, _obj) -> None:
        pass


def transition_matrix() -> dict[str, dict[str, bool]]:
    """The full state×state transition validity matrix from SESSION_TRANSITIONS (pure)."""
    states = list(SESSION_TRANSITIONS.keys())
    return {
        frm: {to: (to in SESSION_TRANSITIONS.get(frm, ())) for to in states}
        for frm in states
    }


async def simulate_cube1(
    *,
    seed: str = "cube1-sim-0001",
    title: str = "eXeL AI Polling — Strategy Alignment",
    created_by: str = "auth0|moderator-sim",
    ai_provider: str = "openai",
    anonymity_mode: str = "anonymous",
) -> dict:
    """Run the real Cube-1 service functions with simulated inputs → actual outputs.

    Deterministic given `seed` (a seed forces UUID5 identity). Offline (in-memory DB).
    """
    db = _HarnessDB()
    calls: list[str] = []
    t0 = time.perf_counter()

    # 1) create_session — REAL fn: deterministic UUID5 id + unique short code + join URL.
    calls.append("create_session")
    session = await cube1.create_session(
        db,
        title=title,
        created_by=created_by,
        anonymity_mode=anonymity_mode,
        ai_provider=ai_provider,
        seed=seed,
    )

    # 2) generate_qr_png — REAL fn. QR of the deterministic identity (stable per seed).
    calls.append("generate_qr_png")
    qr_identity = f"{_QR_NS}:{session.id}"
    qr_png = cube1.generate_qr_png(qr_identity)
    qr_png_ok = qr_png[:8] == b"\x89PNG\r\n\x1a\n"  # PNG magic
    qr_fixed_sha = hashlib.sha256(qr_png).hexdigest()

    # 3) _compute_replay_hash — REAL fn: sha256(seed | ai_provider | response_ids=[]).
    calls.append("_compute_replay_hash")
    replay_hash = await cube1._compute_replay_hash(db, session)

    # 4) transition validity matrix — the state machine (pure, deterministic).
    calls.append("transition_matrix")
    matrix = transition_matrix()

    # 5) validate_qr_accessible — REAL validator on the draft session (must not raise).
    calls.append("validate_qr_accessible")
    qr_accessible_ok = True
    try:
        cube1.validate_qr_accessible(session)
    except Exception:
        qr_accessible_ok = False

    wall_ms = round((time.perf_counter() - t0) * 1000, 3)

    # Deterministic signature — deterministic outputs ONLY (NOT short code / wall-time).
    signature_payload = "|".join([
        str(session.id),
        replay_hash,
        qr_fixed_sha,
        json.dumps(matrix, sort_keys=True),
    ])
    determinism_signature = hashlib.sha256(signature_payload.encode()).hexdigest()

    return {
        "inputs": {
            "seed": seed, "title": title, "created_by": created_by,
            "ai_provider": ai_provider, "anonymity_mode": anonymity_mode,
        },
        "outputs": {
            "session_id": str(session.id),
            "short_code": session.short_code,          # random (nanoid) — NOT in signature
            "join_url": session.join_url,
            "status": session.status,
            "replay_hash": replay_hash,
            "qr_png_bytes": len(qr_png),
            "qr_png_valid": qr_png_ok,
            "qr_identity_sha256": qr_fixed_sha,
            "transition_matrix": matrix,
            "qr_accessible": qr_accessible_ok,
        },
        "metrics": {
            "function_calls": len(calls),
            "db_execute_calls": db.execute_calls,
            "db_writes": len(db.added),
            "wall_time_ms": wall_ms,
        },
        "io_contract": {
            "inputs": ["seed", "title", "created_by", "ai_provider", "anonymity_mode"],
            "functions": calls,
            "outputs": [
                "session_id (UUID5, deterministic)", "short_code (8-char, random)",
                "join_url", "qr_png (PNG bytes)", "replay_hash (SHA-256)",
                "transition_matrix (6×6 state machine)",
            ],
        },
        "determinism_signature": determinism_signature,
    }


async def _main() -> None:  # pragma: no cover - manual runner
    import asyncio  # noqa: F401  (imported for symmetry; run() is below)

    result = await simulate_cube1()
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":  # pragma: no cover
    import asyncio

    asyncio.run(_main())
