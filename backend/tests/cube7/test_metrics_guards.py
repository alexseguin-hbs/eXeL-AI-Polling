"""Cube 7 metrics never 500 on a DB error — safe defaults + real shape (mock DB)."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube7_ranking import metrics


class _BoomDB:
    async def execute(self, *_a, **_k):
        raise RuntimeError("db unavailable")


def _run(coro):
    return asyncio.run(coro)


def test_system_db_error_default():
    r = _run(metrics.get_system_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["ranking_submissions"] == 0


def test_user_db_error_default():
    r = _run(metrics.get_user_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["unique_rankers"] == 0


def test_outcome_db_error_default():
    r = _run(metrics.get_outcome_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["winner_determined"] is False


def test_all_metrics_shape():
    r = _run(metrics.get_all_metrics(_BoomDB(), uuid.uuid4()))
    assert r["cube"] == "cube7_ranking"
    assert set(r.keys()) == {"cube", "system", "user", "outcome"}


def test_user_metrics_computes_ballot_completeness():
    r1 = MagicMock(participant_id=uuid.uuid4(), ranked_theme_ids=["a", "b", "c"])
    r2 = MagicMock(participant_id=uuid.uuid4(), ranked_theme_ids=["a", "b", "c", "d", "e"])
    db = AsyncMock()
    result = MagicMock()
    result.scalars.return_value = MagicMock(all=MagicMock(return_value=[r1, r2]))
    db.execute = AsyncMock(return_value=result)

    m = _run(metrics.get_user_metrics(db, uuid.uuid4()))
    assert m["metrics_unavailable"] is False
    assert m["unique_rankers"] == 2
    assert m["avg_ballot_completeness"] == 4.0  # (3 + 5) / 2
