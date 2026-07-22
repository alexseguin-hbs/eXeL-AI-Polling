"""Cube 8 metrics (System/User/Outcome) — R-Core parity. Never 500s on DB error;
correct shape/quality from mocked TokenLedger/TokenDispute rows."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube8_tokens import metrics


class _BoomDB:
    async def execute(self, *_a, **_k):
        raise RuntimeError("db unavailable")


def _run(coro):
    return asyncio.run(coro)


def _scalars(rows):
    r = MagicMock()
    r.scalars.return_value.all.return_value = rows
    return r


def test_system_db_error_default():
    r = _run(metrics.get_system_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["ledger_entries"] == 0


def test_user_db_error_default():
    r = _run(metrics.get_user_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["unique_earners"] == 0


def test_outcome_db_error_default():
    r = _run(metrics.get_outcome_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["finalized_rate"] == 0.0


def test_all_metrics_shape():
    r = _run(metrics.get_all_metrics(_BoomDB(), uuid.uuid4()))
    assert r["cube"] == "cube8_tokens"
    assert set(r.keys()) == {"cube", "system", "user", "outcome"}


def test_system_lifecycle_distribution():
    rows = [
        MagicMock(lifecycle_state="finalized", action_type="polling"),
        MagicMock(lifecycle_state="finalized", action_type="polling"),
        MagicMock(lifecycle_state="pending", action_type="peer_volunteer"),
    ]
    db = AsyncMock()
    db.execute = AsyncMock(return_value=_scalars(rows))
    m = _run(metrics.get_system_metrics(db, uuid.uuid4()))
    assert m["ledger_entries"] == 3
    assert m["finalized_entries"] == 2
    assert m["action_types"] == 2
    assert m["by_lifecycle"] == {"finalized": 2, "pending": 1}


def test_user_totals_and_avg():
    db = AsyncMock()
    agg = MagicMock(heart=10.0, human=0.0, unity=50.0, earners=2)
    result = MagicMock()
    result.one.return_value = agg
    db.execute = AsyncMock(return_value=result)
    m = _run(metrics.get_user_metrics(db, uuid.uuid4()))
    assert m["unique_earners"] == 2
    assert m["total_unity"] == 50.0
    assert m["avg_unity_per_user"] == 25.0


def test_metrics_endpoint_registered():
    # R-Core parity: get_all_metrics is surfaced on the router (like cube7).
    from app.cubes.cube8_tokens.router import router
    paths = {r.path for r in router.routes if hasattr(r, "path")}
    assert "/sessions/{session_id}/tokens/metrics" in paths


def test_outcome_status_and_disputes():
    rows = [
        MagicMock(outcome_status="achieved", lifecycle_state="finalized"),
        MagicMock(outcome_status="not_achieved", lifecycle_state="pending"),
    ]
    disputes_result = MagicMock()
    disputes_result.scalar.return_value = 1
    db = AsyncMock()
    db.execute = AsyncMock(side_effect=[_scalars(rows), disputes_result])
    m = _run(metrics.get_outcome_metrics(db, uuid.uuid4()))
    assert m["by_outcome_status"] == {"achieved": 1, "not_achieved": 1}
    assert m["finalized_rate"] == 50.0
    assert m["open_disputes"] == 1
