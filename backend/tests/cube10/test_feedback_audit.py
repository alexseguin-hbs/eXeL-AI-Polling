"""R3.1 — Cube 10's one genuine R-Core gap: AuditLog on the feedback transition."""

import asyncio
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube10_simulation import service
from app.models.audit_log import AuditLog


def _run(coro):
    return asyncio.run(coro)


def test_submit_feedback_writes_audit_row():
    added = []
    db = AsyncMock()
    db.add = MagicMock(side_effect=lambda x: added.append(x))
    db.flush = AsyncMock()
    db.refresh = AsyncMock()

    _run(service.submit_feedback(
        db, cube_id=6, text="this is broken and crashes", submitted_by="user-7",
        crs_id="CRS-11", role="moderator", screen="dashboard",
    ))
    audit = [a for a in added if getattr(a, "action_type", None) == "sim.feedback_submitted"]
    assert len(audit) == 1
    a = audit[0]
    assert isinstance(a, AuditLog)
    assert a.actor_id == "user-7" and a.actor_role == "moderator"
    assert a.object_type == "product_feedback"
    assert a.after_state["cube_id"] == 6
    assert a.after_state["priority"] == 3  # "broken/crashes" → high priority (bug)


def test_feedback_db_failure_does_not_break_or_audit():
    # If the FB write fails, submit_feedback still returns (non-fatal) and no audit row.
    db = AsyncMock()
    db.add = MagicMock(side_effect=RuntimeError("no table"))
    out = _run(service.submit_feedback(db, cube_id=1, text="love it", submitted_by="u"))
    assert "feedback_id" in out  # still returns a dict
