"""Shared R-Core audit helper (build-once / consume-many).

Transition-level Human-Authority attribution: writes ONE append-only AuditLog row
per KEY transition (not per-row — scale-safe, matching Cube 1's per-transition
pattern). Extracted from cube1_session/service.py `_log_audit` and generalized with
`object_type`/`object_id` so any cube (2/3/4/5/6/8) can attribute its transitions:
who acted, under what authority, before → after.

The write is `db.add(entry)` only — the caller owns the commit (so the audit row is
part of the same transaction as the action it records). Never raises on a bad actor
value; callers wrap in their own try/except when the action must not fail on audit.
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


def log_audit(
    db: AsyncSession,
    *,
    session_id: uuid.UUID | None,
    actor_id: str,
    actor_role: str,
    action_type: str,
    object_type: str,
    object_id: str | None = None,
    before: dict | None = None,
    after: dict | None = None,
) -> AuditLog:
    """Add one AuditLog row for a key transition (caller commits). Returns the entry.

    actor_role derives from the actor (system vs moderator vs participant) — pass it
    truthfully so the trail is not falsely attributed (cf. Cube 1 CC-3). object_type
    names the thing acted on ("session"/"response"/"token_ledger"/"pipeline"/…).
    """
    entry = AuditLog(
        session_id=session_id,
        actor_id=actor_id,
        actor_role=actor_role,
        action_type=action_type,
        object_type=object_type,
        object_id=object_id,
        before_state=before,
        after_state=after,
    )
    db.add(entry)
    return entry
