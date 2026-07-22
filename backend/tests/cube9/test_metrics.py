"""Cube 9 metrics (System/User/Outcome) — R-Core parity. Never 500s on DB error."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube9_reports import metrics


class _BoomDB:
    async def execute(self, *_a, **_k):
        raise RuntimeError("db unavailable")


def _run(coro):
    return asyncio.run(coro)


def _scalar(v):
    r = MagicMock()
    r.scalar.return_value = v
    return r


def test_system_db_error_default():
    r = _run(metrics.get_system_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["exportable_responses"] == 0


def test_user_db_error_default():
    r = _run(metrics.get_user_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["result_recipients"] == 0


def test_outcome_db_error_default():
    r = _run(metrics.get_outcome_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["export_hash_available"] is False


def test_all_metrics_shape():
    r = _run(metrics.get_all_metrics(_BoomDB(), uuid.uuid4()))
    assert r["cube"] == "cube9_reports"
    assert set(r.keys()) == {"cube", "system", "user", "outcome"}


def test_system_counts():
    db = AsyncMock()
    db.execute = AsyncMock(side_effect=[_scalar(120), _scalar(9), _scalar(1)])
    m = _run(metrics.get_system_metrics(db, uuid.uuid4()))
    assert m["exportable_responses"] == 120
    assert m["themes_available"] == 9
    assert m["has_final_ranking"] is True


def test_user_opt_in_rate():
    rows = [MagicMock(results_opt_in=True), MagicMock(results_opt_in=False),
            MagicMock(results_opt_in=True), MagicMock(results_opt_in=False)]
    result = MagicMock()
    result.scalars.return_value.all.return_value = rows
    db = AsyncMock()
    db.execute = AsyncMock(return_value=result)
    m = _run(metrics.get_user_metrics(db, uuid.uuid4()))
    assert m["participants"] == 4 and m["result_recipients"] == 2
    assert m["opt_in_rate"] == 50.0


def test_metrics_endpoint_registered():
    from app.cubes.cube9_reports.router import router
    paths = {r.path for r in router.routes if hasattr(r, "path")}
    assert any(p.endswith("/reports/metrics") for p in paths)
