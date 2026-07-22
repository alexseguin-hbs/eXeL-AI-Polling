"""Cube 8 (8.4+8.5): shared execution-mode dispatch + AuditLog on lifecycle transitions."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube8_tokens import service


def _run(coro):
    return asyncio.run(coro)


# --- 8.4 execution-mode dispatch (delegates to shared core.rcore) ---

def test_dispatch_token_award_automated_guardrail():
    ok = service.dispatch_token_award({"confidence": 0.8, "risk": 0.2}, mode="automated")
    assert ok["status"] == "accepted"
    held = service.dispatch_token_award({"confidence": 0.9, "risk": 0.6}, mode="automated")
    assert held["status"] == "held"


def test_dispatch_token_award_live_requires_human():
    assert service.dispatch_token_award({}, mode="live")["status"] == "pending"
    assert service.dispatch_token_award({}, mode="live", human_approved=True)["status"] == "accepted"


# --- 8.5 AuditLog on lifecycle transition ---

def test_lifecycle_transition_writes_audit():
    entry = MagicMock(id=uuid.uuid4(), session_id=uuid.uuid4(), lifecycle_state="pending")
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = entry
    db.execute = AsyncMock(return_value=result)
    added = []
    db.add = MagicMock(side_effect=lambda x: added.append(x))

    _run(service.transition_lifecycle_state(
        db, entry.id, "approved", transitioned_by="mod-7",
    ))
    # One AuditLog row added with before/after lifecycle_state + correct actor.
    audit = [a for a in added if getattr(a, "action_type", None) == "token.lifecycle_transition"]
    assert len(audit) == 1
    a = audit[0]
    assert a.actor_id == "mod-7" and a.actor_role == "admin"
    assert a.before_state == {"lifecycle_state": "pending"}
    assert a.after_state == {"lifecycle_state": "approved"}
    assert a.object_type == "token_ledger"


def test_lifecycle_transition_system_actor_role():
    entry = MagicMock(id=uuid.uuid4(), session_id=uuid.uuid4(), lifecycle_state="approved")
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = entry
    db.execute = AsyncMock(return_value=result)
    added = []
    db.add = MagicMock(side_effect=lambda x: added.append(x))

    _run(service.transition_lifecycle_state(db, entry.id, "finalized"))  # no transitioned_by
    a = next(x for x in added if getattr(x, "action_type", None) == "token.lifecycle_transition")
    assert a.actor_id == "system:auto" and a.actor_role == "system"
