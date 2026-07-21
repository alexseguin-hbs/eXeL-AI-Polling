"""CC-5 lock: Cube 1 metrics never 500 on a DB error — they return safe defaults,
and produce the System/User/Outcome shape from real session data (mock DB)."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube1_session import metrics


class _BoomDB:
    async def execute(self, *_a, **_k):
        raise RuntimeError("db unavailable")


def _run(coro):
    return asyncio.run(coro)


def test_system_metrics_db_error_returns_default():
    r = _run(metrics.get_system_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True
    assert r["total_participants"] == 0


def test_user_metrics_db_error_returns_default():
    r = _run(metrics.get_user_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True
    assert r["device_distribution"] == {}


def test_outcome_metrics_db_error_returns_default():
    r = _run(metrics.get_outcome_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True
    assert r["replay_determinism_ready"] is False


def test_all_metrics_shape():
    r = _run(metrics.get_all_metrics(_BoomDB(), uuid.uuid4()))
    assert r["cube"] == "cube1_session"
    assert set(r.keys()) == {"cube", "system", "user", "outcome"}


def test_user_metrics_computes_anonymity_mix():
    """User metrics derive anonymous-vs-identified + opt-in from Participant rows."""
    p_anon = MagicMock(user_id=None, results_opt_in=False, device_type="phone", language_code="en")
    p_id = MagicMock(user_id="auth0|x", results_opt_in=True, device_type="desktop", language_code="es")
    db = AsyncMock()
    result = MagicMock()
    result.scalars.return_value = MagicMock(all=MagicMock(return_value=[p_anon, p_id]))
    db.execute = AsyncMock(return_value=result)

    r = _run(metrics.get_user_metrics(db, uuid.uuid4()))
    assert r["metrics_unavailable"] is False
    assert r["anonymous_participants"] == 1 and r["identified_participants"] == 1
    assert r["anonymous_ratio_pct"] == 50.0
    assert r["results_opt_in_rate_pct"] == 50.0
    assert r["device_distribution"] == {"phone": 1, "desktop": 1}
