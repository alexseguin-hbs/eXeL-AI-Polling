"""A time entry never counts past one live window (Thor, round 11): an entry left open for 10 h earns 3 h."""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube5_gateway import service
from app.models.time_tracking import TimeEntry


def test_stop_caps_the_duration():
    entry = TimeEntry(id=uuid.uuid4(), session_id=uuid.uuid4(), participant_id=uuid.uuid4(),
                      action_type="responding", cube_id="cube5",
                      started_at=datetime.now(timezone.utc) - timedelta(hours=10))
    result = MagicMock()
    result.scalar_one_or_none.return_value = entry
    db = AsyncMock()
    db.execute = AsyncMock(return_value=result)
    db.add = MagicMock()
    out = asyncio.run(service.stop_time_tracking(db, time_entry_id=entry.id))
    assert out.duration_seconds == service.MAX_TIME_ENTRY_SECONDS == 3 * 3600
    assert out.heart_tokens_earned == 180  # ceil(180 minutes), never 600
