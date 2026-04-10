"""Shared presence tracking — Supabase DB + Python in-memory.

Uses:
  - In-memory dict for fast reads (active participant count)
  - Supabase participants table for persistence (is_active flag)
  - Supabase Realtime for cross-instance sync (when scaled)

Pattern: In-memory dict[session_id] → set[participant_id]
         Supabase: participants.is_active = True WHERE session_id = X
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import datetime, timezone

# In-memory presence store — fast O(1) reads
# For multi-instance: sync via Supabase Realtime postgres_changes
_presence: dict[str, dict[str, str]] = defaultdict(dict)


async def set_presence(
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    **kwargs,
) -> None:
    """Record participant presence in memory."""
    key = str(session_id)
    _presence[key][str(participant_id)] = datetime.now(timezone.utc).isoformat()


async def clear_presence(
    session_id: uuid.UUID,
    participant_id: uuid.UUID | None = None,
    **kwargs,
) -> None:
    """Remove participant(s) from presence."""
    key = str(session_id)
    if participant_id is None:
        _presence.pop(key, None)  # Clear all for session
    else:
        _presence[key].pop(str(participant_id), None)


async def get_presence(
    session_id: uuid.UUID,
    **kwargs,
) -> dict:
    """Return live presence data for a session."""
    key = str(session_id)
    data = _presence.get(key, {})
    participants = [
        {"participant_id": pid, "joined_at": ts}
        for pid, ts in data.items()
    ]
    return {
        "session_id": str(session_id),
        "active_count": len(participants),
        "participants": participants,
    }


def get_active_count(session_id: uuid.UUID) -> int:
    """Fast O(1) active participant count."""
    return len(_presence.get(str(session_id), {}))
