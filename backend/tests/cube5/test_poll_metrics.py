"""Phase A2 — SoI System-of-Innovation $/min per-poll metrics (CRS-19).

Locks:
  - minutes_to_dollars: min-wage valuation, independent of human_enabled, format #.####.
  - dollars_per_min: total $ / wall-clock minutes; 0 on no elapsed time.
  - get_session_poll_metrics: user active-min + count, moderator wall-clock minutes
    (opened_at→closed_at), first-class dollars_per_min, ♡웃◬ totals.

Run: cd backend && python -m pytest tests/cube5/test_poll_metrics.py -v --tb=short
"""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


# ── Pure math ────────────────────────────────────────────────────────────────
class TestPureMath:
    def test_minutes_to_dollars_min_wage(self):
        from app.cubes.cube5_gateway.service import minutes_to_dollars

        assert minutes_to_dollars(60, 7.25) == 7.25          # 60 min @ $7.25/hr = $7.25
        assert minutes_to_dollars(30, 7.25) == 3.625
        assert minutes_to_dollars(10, 15.0) == 2.5

    def test_minutes_to_dollars_zero_guards(self):
        from app.cubes.cube5_gateway.service import minutes_to_dollars

        assert minutes_to_dollars(0, 7.25) == 0.0
        assert minutes_to_dollars(-5, 7.25) == 0.0
        assert minutes_to_dollars(10, 0) == 0.0

    def test_dollars_per_min(self):
        from app.cubes.cube5_gateway.service import dollars_per_min

        assert dollars_per_min(14.5, 10) == 1.45
        assert dollars_per_min(7.25, 0) == 0.0
        assert dollars_per_min(0, 10) == 0.0


# ── Aggregation ──────────────────────────────────────────────────────────────
def _metrics_mocks(session, *, total_seconds, user_count):
    mock_db = AsyncMock()
    r_session = MagicMock(); r_session.scalar_one_or_none.return_value = session
    r_agg = MagicMock()
    r_agg.one.return_value = MagicMock(total_seconds=total_seconds, user_count=user_count)
    mock_db.execute = AsyncMock(side_effect=[r_session, r_agg])
    return mock_db


class TestPollMetrics:
    @pytest.mark.asyncio
    async def test_user_and_moderator_split_and_dpm(self):
        from app.cubes.cube5_gateway import service

        t0 = datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc)
        session = MagicMock()
        session.id = uuid.uuid4()
        session.opened_at = t0
        session.closed_at = t0 + timedelta(minutes=10)  # 10-min poll wall-clock

        mock_db = _metrics_mocks(session, total_seconds=600.0, user_count=5)  # 10 user-min, 5 users
        token_summary = {"total_heart": 3.0, "total_human": 0.0, "total_unity": 15.0}
        with patch("app.cubes.cube8_tokens.service.get_session_token_summary",
                   new=AsyncMock(return_value=token_summary)):
            m = await service.get_session_poll_metrics(mock_db, session_id=session.id)

        assert m["hourly_rate"] == 7.25
        assert m["users"]["count"] == 5
        assert m["users"]["active_min"] == 10.0
        assert m["users"]["value_usd"] == 1.2083          # 10 min @ 7.25/hr
        assert m["moderator"]["active_min"] == 10.0        # opened→closed = 10 min
        assert m["moderator"]["value_usd"] == 1.2083
        assert m["total_value_usd"] == 2.4166
        assert m["dollars_per_min"] == pytest.approx(0.2417, abs=0.001)  # 2.4166 / 10
        assert m["totals"] == {"heart": 3.0, "human": 0.0, "unity": 15.0}

    @pytest.mark.asyncio
    async def test_never_opened_falls_back_to_user_minutes(self):
        from app.cubes.cube5_gateway import service

        session = MagicMock(); session.id = uuid.uuid4()
        session.opened_at = None; session.closed_at = None
        mock_db = _metrics_mocks(session, total_seconds=120.0, user_count=2)  # 2 user-min
        with patch("app.cubes.cube8_tokens.service.get_session_token_summary",
                   new=AsyncMock(return_value={"total_heart": 0.0, "total_human": 0.0, "total_unity": 0.0})):
            m = await service.get_session_poll_metrics(mock_db, session_id=session.id)

        assert m["moderator"]["active_min"] == 0.0
        assert m["users"]["active_min"] == 2.0
        # dpm computed against user minutes when never opened → > 0
        assert m["dollars_per_min"] > 0.0

    @pytest.mark.asyncio
    async def test_missing_session_404(self):
        from fastapi import HTTPException
        from app.cubes.cube5_gateway import service

        mock_db = AsyncMock()
        r_none = MagicMock(); r_none.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(side_effect=[r_none])
        with pytest.raises(HTTPException) as exc:
            await service.get_session_poll_metrics(mock_db, session_id=uuid.uuid4())
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_open_session_uses_now_for_moderator_window(self):
        from app.cubes.cube5_gateway import service

        now = datetime(2026, 3, 31, 12, 5, tzinfo=timezone.utc)
        session = MagicMock(); session.id = uuid.uuid4()
        session.opened_at = now - timedelta(minutes=5)  # still open (no closed_at)
        session.closed_at = None
        mock_db = _metrics_mocks(session, total_seconds=0.0, user_count=0)
        with patch("app.cubes.cube8_tokens.service.get_session_token_summary",
                   new=AsyncMock(return_value={"total_heart": 0.0, "total_human": 0.0, "total_unity": 0.0})):
            m = await service.get_session_poll_metrics(mock_db, session_id=session.id, now=now)
        assert m["moderator"]["active_min"] == 5.0
