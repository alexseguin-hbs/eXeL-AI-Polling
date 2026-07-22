"""Cube 4 metrics never 500 on a DB error — safe defaults + real shape (mock DB)."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube4_collector import metrics


class _BoomDB:
    async def execute(self, *_a, **_k):
        raise RuntimeError("db unavailable")


def _run(coro):
    return asyncio.run(coro)


def test_system_db_error_default():
    r = _run(metrics.get_system_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["total_responses"] == 0


def test_user_db_error_default():
    r = _run(metrics.get_user_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["unique_contributors"] == 0


def test_outcome_db_error_default():
    r = _run(metrics.get_outcome_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["outcome_status_distribution"] == {}


def test_all_metrics_shape():
    r = _run(metrics.get_all_metrics(_BoomDB(), uuid.uuid4()))
    assert r["cube"] == "cube4_collector"
    assert set(r.keys()) == {"cube", "system", "user", "outcome"}


def test_system_metrics_text_voice_split():
    rows = [
        MagicMock(source="text", is_flagged=False),
        MagicMock(source="text", is_flagged=True),
        MagicMock(source="voice", is_flagged=False),
    ]
    db = AsyncMock()
    result = MagicMock()
    result.all.return_value = rows
    db.execute = AsyncMock(return_value=result)

    m = _run(metrics.get_system_metrics(db, uuid.uuid4()))
    assert m["metrics_unavailable"] is False
    assert m["total_responses"] == 3
    assert m["text_responses"] == 2 and m["voice_responses"] == 1
    assert m["flagged_responses"] == 1
