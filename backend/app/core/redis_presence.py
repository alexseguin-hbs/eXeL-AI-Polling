"""Shared Redis presence tracking — used by Cube 1 (Session) and Cube 4 (Collector).

Provides session-scoped participant presence via Redis HSET with TTL.
Single source of truth for online/active participant count.

Pattern: HSET session:{session_id}:presence {participant_id} {timestamp}
         EXPIRE session:{session_id}:presence 3600
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from redis.asyncio import Redis


async def set_presence(
    redis: Redis,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    ttl: int = 3600,
) -> None:
    """Record participant presence in Redis with TTL."""
    key = f"session:{session_id}:presence"
    await redis.hset(key, str(participant_id), datetime.now(timezone.utc).isoformat())
    await redis.expire(key, ttl)


async def clear_presence(
    redis: Redis,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
) -> None:
    """Remove a participant from presence tracking."""
    key = f"session:{session_id}:presence"
    await redis.hdel(key, str(participant_id))


async def get_presence(
    redis: Redis,
    session_id: uuid.UUID,
) -> dict:
    """Return live presence data for a session."""
    key = f"session:{session_id}:presence"
    data = await redis.hgetall(key)
    participants = [
        {"participant_id": pid, "joined_at": ts}
        for pid, ts in data.items()
    ]
    return {
        "session_id": str(session_id),
        "active_count": len(participants),
        "participants": participants,
    }
