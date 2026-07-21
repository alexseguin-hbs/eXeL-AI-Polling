"""C2-3 lock: Cube 2 metrics never 500 on a DB error — they return safe defaults."""

import asyncio
import uuid

from app.cubes.cube2_text import metrics


class _BoomDB:
    """Async DB stub whose execute() always raises (simulates a DB blip)."""

    async def execute(self, *_a, **_k):
        raise RuntimeError("db unavailable")


def _run(coro):
    return asyncio.run(coro)


def test_system_metrics_db_error_returns_default():
    r = _run(metrics.get_system_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True
    assert r["total_responses"] == 0


def test_user_metrics_db_error_returns_default():
    r = _run(metrics.get_user_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True
    assert r["language_distribution"] == {}


def test_outcome_metrics_db_error_returns_default():
    r = _run(metrics.get_outcome_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True
    assert r["flagged_response_count"] == 0


def test_all_metrics_db_error_still_returns_shape():
    r = _run(metrics.get_all_metrics(_BoomDB(), uuid.uuid4()))
    assert r["cube"] == "cube2_text"
    assert r["system"]["metrics_unavailable"] is True
    assert r["user"]["metrics_unavailable"] is True
    assert r["outcome"]["metrics_unavailable"] is True
