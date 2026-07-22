"""Cube 6 (6.1): verify-replay anchor endpoint + shared execution-mode dispatch."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube6_ai import pipeline


def _run(coro):
    return asyncio.run(coro)


# --- exec-mode dispatch (delegates to shared core.rcore) ---

def test_dispatch_theming_mode_automated_guardrail():
    ok = pipeline.dispatch_theming_mode({"confidence": 0.8, "risk": 0.2}, mode="automated")
    assert ok["status"] == "accepted"
    held = pipeline.dispatch_theming_mode({"confidence": 0.9, "risk": 0.7}, mode="automated")
    assert held["status"] == "held"


def test_dispatch_theming_mode_live_requires_human():
    assert pipeline.dispatch_theming_mode({}, mode="live")["status"] == "pending"
    assert pipeline.dispatch_theming_mode({}, mode="live", human_approved=True)["status"] == "accepted"


# --- verify-replay anchor ---

def test_verify_replay_reports_stored_hash():
    session = MagicMock(replay_hash="a" * 64)
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = session
    db.execute = AsyncMock(return_value=result)

    out = _run(pipeline.verify_theming_replay(db, uuid.uuid4()))
    assert out["replay_hash"] == "a" * 64
    assert out["has_replay_hash"] is True and out["is_deterministic"] is True


def test_verify_replay_absent_hash():
    session = MagicMock(replay_hash=None)
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = session
    db.execute = AsyncMock(return_value=result)

    out = _run(pipeline.verify_theming_replay(db, uuid.uuid4()))
    assert out["has_replay_hash"] is False and out["is_deterministic"] is False


def test_verify_replay_endpoint_registered():
    from app.cubes.cube6_ai.router import router
    paths = {r.path for r in router.routes if hasattr(r, "path")}
    assert any(p.endswith("/ai/verify-replay") for p in paths)
