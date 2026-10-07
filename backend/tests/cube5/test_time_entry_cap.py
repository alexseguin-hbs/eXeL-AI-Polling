"""Public time earns honestly (Thor, rounds 11-12): an entry left open for 10 h counts 3 h, and ♡ is the floor of the
participant's ACCUMULATED public minutes, so short start/stop loops never mint a token per entry."""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube5_gateway import service
from app.models.time_tracking import TimeEntry


def _stop(seconds_open: float, prior_seconds: float = 0.0, prior_heart: float = 0.0,
          action_type: str = "responding") -> TimeEntry:
    entry = TimeEntry(id=uuid.uuid4(), session_id=uuid.uuid4(), participant_id=uuid.uuid4(),
                      action_type=action_type, cube_id="cube5",
                      started_at=datetime.now(timezone.utc) - timedelta(seconds=seconds_open))
    found = MagicMock()
    found.scalar_one_or_none.return_value = entry
    prior = MagicMock()
    prior.one.return_value = (prior_seconds, prior_heart)
    db = AsyncMock()
    db.execute = AsyncMock(side_effect=[found, prior])
    db.add = MagicMock()
    return asyncio.run(service.stop_time_tracking(db, time_entry_id=entry.id))


def test_stop_caps_the_duration():
    out = _stop(10 * 3600)
    assert out.duration_seconds == service.MAX_TIME_ENTRY_SECONDS == 3 * 3600
    assert out.heart_tokens_earned == 180  # floor(180 accumulated minutes), never 600


def test_short_entries_accumulate_instead_of_rounding_up():
    # 30 one-second entries: each sees the earlier ones' seconds and ♡, and none crosses a whole minute.
    seconds, hearts = 0.0, 0.0
    for _ in range(30):
        out = _stop(1.0, seconds, hearts)
        seconds += out.duration_seconds
        hearts += out.heart_tokens_earned
    assert hearts == 0, f"30 one-second entries minted {hearts} ♡ (per-entry rounding up would mint 30)"
    # The entry that carries the total past a whole minute earns exactly that minute.
    assert _stop(31.0, 30.0, 0.0).heart_tokens_earned == 1


def test_every_cube5_entry_accumulates_even_login():
    # A cube5 'login' entry no longer mints per entry (Enki, Sofia; round 13): 30 one-second entries mint 0 ♡.
    seconds, hearts = 0.0, 0.0
    for _ in range(30):
        out = _stop(1.0, seconds, hearts, action_type="login")
        seconds += out.duration_seconds
        hearts += out.heart_tokens_earned
    assert hearts == 0, hearts
