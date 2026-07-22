"""Shared R-Core audit helper — transition-level AuditLog attribution (mock DB)."""

import uuid
from unittest.mock import MagicMock

from app.core.audit import log_audit
from app.models.audit_log import AuditLog


def test_log_audit_adds_one_row_with_correct_fields():
    db = MagicMock()
    sid = uuid.uuid4()
    entry = log_audit(
        db, session_id=sid, actor_id="mod-1", actor_role="moderator",
        action_type="token.lifecycle_transition", object_type="token_ledger",
        object_id="entry-9", before={"lifecycle_state": "pending"},
        after={"lifecycle_state": "approved"},
    )
    db.add.assert_called_once()
    assert isinstance(entry, AuditLog)
    assert entry.session_id == sid
    assert entry.actor_id == "mod-1" and entry.actor_role == "moderator"
    assert entry.action_type == "token.lifecycle_transition"
    assert entry.object_type == "token_ledger" and entry.object_id == "entry-9"
    assert entry.before_state == {"lifecycle_state": "pending"}
    assert entry.after_state == {"lifecycle_state": "approved"}


def test_log_audit_caller_owns_commit():
    # Helper only adds; it must NOT commit (caller owns the transaction).
    db = MagicMock()
    log_audit(db, session_id=None, actor_id="system:auto", actor_role="system",
              action_type="pipeline.triggered", object_type="pipeline")
    db.add.assert_called_once()
    db.commit.assert_not_called()


def test_system_actor_role_preserved():
    db = MagicMock()
    entry = log_audit(db, session_id=uuid.uuid4(), actor_id="system:auto-timer",
                      actor_role="system", action_type="analysis.run",
                      object_type="analysis")
    assert entry.actor_role == "system"  # not falsely "moderator" (CC-3)
