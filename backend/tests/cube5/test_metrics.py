"""Cube 5 metrics (System/User/Outcome) — R-Core parity surface. Never 500s on a DB
error (safe defaults) + correct shape from mocked rows."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube5_gateway import metrics


class _BoomDB:
    async def execute(self, *_a, **_k):
        raise RuntimeError("db unavailable")


def _run(coro):
    return asyncio.run(coro)


def test_system_db_error_default():
    r = _run(metrics.get_system_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["pipeline_triggers"] == 0


def test_user_db_error_default():
    r = _run(metrics.get_user_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["unique_participants"] == 0


def test_outcome_db_error_default():
    r = _run(metrics.get_outcome_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["pipeline_completion_rate"] == 0.0


def test_all_metrics_shape():
    r = _run(metrics.get_all_metrics(_BoomDB(), uuid.uuid4()))
    assert r["cube"] == "cube5_gateway"
    assert set(r.keys()) == {"cube", "system", "user", "outcome"}


def test_system_metrics_trigger_counts():
    rows = [
        MagicMock(status="completed", trigger_type="ai_theming"),
        MagicMock(status="failed", trigger_type="ai_theming"),
        MagicMock(status="completed", trigger_type="ranking_aggregation"),
    ]
    db = AsyncMock()
    result = MagicMock()
    result.scalars.return_value.all.return_value = rows
    db.execute = AsyncMock(return_value=result)

    m = _run(metrics.get_system_metrics(db, uuid.uuid4()))
    assert m["metrics_unavailable"] is False
    assert m["pipeline_triggers"] == 3
    assert m["completed_triggers"] == 2
    assert m["failed_triggers"] == 1
    assert m["pipeline_types"] == 2


def test_user_metrics_active_minutes():
    db = AsyncMock()
    agg = MagicMock(total_seconds=120.0, user_count=2)
    result = MagicMock()
    result.one.return_value = agg
    db.execute = AsyncMock(return_value=result)

    m = _run(metrics.get_user_metrics(db, uuid.uuid4()))
    assert m["metrics_unavailable"] is False
    assert m["unique_participants"] == 2
    assert m["total_active_min"] == 2.0


def test_outcome_metrics_tokens_and_completion():
    db = AsyncMock()
    token_agg = MagicMock(heart=10.0, human=0.0, unity=50.0)
    triggers = MagicMock()
    triggers.scalars.return_value.all.return_value = [
        MagicMock(status="completed"), MagicMock(status="failed"),
    ]
    token_result = MagicMock()
    token_result.one.return_value = token_agg
    # First execute → token aggregate; second → triggers list.
    db.execute = AsyncMock(side_effect=[token_result, triggers])

    m = _run(metrics.get_outcome_metrics(db, uuid.uuid4()))
    assert m["metrics_unavailable"] is False
    assert m["heart_tokens"] == 10.0 and m["unity_tokens"] == 50.0
    assert m["pipeline_completion_rate"] == 50.0
