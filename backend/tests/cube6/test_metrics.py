"""Cube 6 metrics (System/User/Outcome) — R-Core parity surface. Never 500s on a DB
error (safe defaults) + correct shape/quality from mocked Theme/ResponseSummary rows."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock

from app.cubes.cube6_ai import metrics


class _BoomDB:
    async def execute(self, *_a, **_k):
        raise RuntimeError("db unavailable")


def _run(coro):
    return asyncio.run(coro)


def _scalars(rows):
    result = MagicMock()
    result.scalars.return_value.all.return_value = rows
    return result


def test_system_db_error_default():
    r = _run(metrics.get_system_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["themes_generated"] == 0


def test_user_db_error_default():
    r = _run(metrics.get_user_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["responses_summarized"] == 0


def test_outcome_db_error_default():
    r = _run(metrics.get_outcome_metrics(_BoomDB(), uuid.uuid4()))
    assert r["metrics_unavailable"] is True and r["theme01_buckets"] == 0


def test_all_metrics_shape():
    r = _run(metrics.get_all_metrics(_BoomDB(), uuid.uuid4()))
    assert r["cube"] == "cube6_ai"
    assert set(r.keys()) == {"cube", "system", "user", "outcome"}


def test_system_counts_themes_summaries_providers():
    themes = [MagicMock(ai_provider="openai", cycle_id=1),
              MagicMock(ai_provider="openai", cycle_id=2)]
    summaries = [MagicMock(provider="openai"), MagicMock(provider="gemini")]
    db = AsyncMock()
    db.execute = AsyncMock(side_effect=[_scalars(themes), _scalars(summaries)])

    m = _run(metrics.get_system_metrics(db, uuid.uuid4()))
    assert m["metrics_unavailable"] is False
    assert m["themes_generated"] == 2
    assert m["summaries_generated"] == 2
    assert m["ai_providers"] == 2  # openai + gemini
    assert m["cycles"] == 2


def test_user_coverage_pct():
    rows = [
        MagicMock(summary_33="s", theme01="Risk & Concerns"),
        MagicMock(summary_33="s", theme01=None),
        MagicMock(summary_33=None, theme01=None),
        MagicMock(summary_33="s", theme01="Supporting Comments"),
    ]
    db = AsyncMock()
    db.execute = AsyncMock(return_value=_scalars(rows))

    m = _run(metrics.get_user_metrics(db, uuid.uuid4()))
    assert m["responses_summarized"] == 4
    assert m["summary_coverage_pct"] == 75.0   # 3/4
    assert m["theme_assigned_pct"] == 50.0     # 2/4


def test_outcome_quality():
    themes = [MagicMock(confidence=0.8), MagicMock(confidence=0.6)]
    summaries = [
        MagicMock(theme01="Risk & Concerns", theme2_3="T1"),
        MagicMock(theme01="Supporting Comments", theme2_3=None),
    ]
    db = AsyncMock()
    db.execute = AsyncMock(side_effect=[_scalars(themes), _scalars(summaries)])

    m = _run(metrics.get_outcome_metrics(db, uuid.uuid4()))
    assert m["theme01_buckets"] == 2
    assert m["avg_theme_confidence"] == 0.7
    assert m["theme2_completeness_pct"] == 50.0  # 1/2
