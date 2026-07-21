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


# ── MoT cost control chart (operator: 91.25-day default window) ──────────────
class TestMotCostControlChart:
    def test_default_window_is_a_quarter(self):
        from app.cubes.cube5_gateway.service import MOT_DEFAULT_WINDOW_DAYS

        assert MOT_DEFAULT_WINDOW_DAYS == 91.25          # 365.25 / 4

    def test_window_minutes_and_baseline(self):
        from app.cubes.cube5_gateway.service import mot_cost_control_chart

        c = mot_cost_control_chart(total_value_usd=131.4, active_minutes=60)
        assert c["window_days"] == 91.25
        assert c["window_minutes"] == 131400.0          # 91.25 × 1440
        # $131.40 allocated over 131400 min → $0.001/min centerline.
        assert c["baseline_per_min"] == 0.001
        assert c["actual_per_min"] == 2.19              # 131.4 / 60
        assert c["variance_pct"] > 0                     # burn ≫ allocation
        assert c["upper_control_limit"] is None          # needs historical series

    def test_zero_guards(self):
        from app.cubes.cube5_gateway.service import mot_cost_control_chart

        c = mot_cost_control_chart(0.0, 0.0)
        assert c["baseline_per_min"] == 0.0 and c["actual_per_min"] == 0.0
        assert c["variance_pct"] == 0.0

    def test_custom_window(self):
        from app.cubes.cube5_gateway.service import mot_cost_control_chart

        c = mot_cost_control_chart(1440.0, 60, window_days=1)
        assert c["window_minutes"] == 1440.0
        assert c["baseline_per_min"] == 1.0              # $1440 over 1 day = $1/min

    def test_series_control_limits_over_many_polls(self):
        """Project/business: N poll burn-rates → SPC chart with real 3σ control limits."""
        from app.cubes.cube5_gateway.service import mot_cost_series

        c = mot_cost_series([1.0, 1.0, 1.0, 1.0, 1.0])   # zero variance
        assert c["n"] == 5 and c["centerline"] == 1.0 and c["stdev"] == 0.0
        assert c["upper_control_limit"] == 1.0 and c["lower_control_limit"] == 1.0
        assert c["out_of_control_count"] == 0

    def test_series_flags_out_of_control_point(self):
        from app.cubes.cube5_gateway.service import mot_cost_series

        # 20 stable polls + one cost spike → the spike sits beyond mean + 3σ.
        c = mot_cost_series([1.0] * 20 + [5.0])
        assert c["upper_control_limit"] > c["centerline"] > c["lower_control_limit"]
        assert c["out_of_control_count"] == 1
        assert c["lower_control_limit"] == 0.0            # floored at 0

    def test_series_empty(self):
        from app.cubes.cube5_gateway.service import mot_cost_series

        c = mot_cost_series([])
        assert c["n"] == 0 and c["centerline"] == 0.0 and c["upper_control_limit"] == 0.0

    def test_series_window_carried(self):
        from app.cubes.cube5_gateway.service import mot_cost_series

        assert mot_cost_series([2.0, 4.0], window_days=30)["window_days"] == 30
        assert mot_cost_series([2.0, 4.0])["window_days"] == 91.25

    @pytest.mark.asyncio
    async def test_metrics_endpoint_includes_mot_block(self):
        import uuid
        from datetime import datetime, timedelta, timezone
        from app.cubes.cube5_gateway import service

        t0 = datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc)
        session = MagicMock(); session.id = uuid.uuid4()
        session.opened_at = t0; session.closed_at = t0 + timedelta(minutes=10)
        mock_db = _metrics_mocks(session, total_seconds=600.0, user_count=5)
        with patch("app.cubes.cube8_tokens.service.get_session_token_summary",
                   new=AsyncMock(return_value={"total_heart": 0.0, "total_human": 0.0, "total_unity": 0.0})):
            m = await service.get_session_poll_metrics(mock_db, session_id=session.id)
        assert "mot" in m
        assert m["mot"]["window_days"] == 91.25
        # actual_per_min on the MoT chart mirrors the poll's $/min burn rate.
        assert m["mot"]["actual_per_min"] == pytest.approx(m["dollars_per_min"], abs=0.01)


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


# ── R4: MoT window presets + session profit ──────────────────────────────────
class TestMotWindowsAndProfit:
    def test_window_presets(self):
        from app.cubes.cube5_gateway.service import MOT_WINDOWS, resolve_mot_window
        assert MOT_WINDOWS["quarter"] == 91.25          # DEFAULT
        assert abs(MOT_WINDOWS["month"] - 30.4166666666667) < 1e-9  # 1/12 year
        assert resolve_mot_window("year") == 365.0
        assert resolve_mot_window("year", is_leap=True) == 366.0
        assert resolve_mot_window("month") == MOT_WINDOWS["month"]
        assert resolve_mot_window("bogus") == 91.25     # unknown → default

    def test_session_profit_math(self):
        from app.cubes.cube5_gateway.service import session_profit
        p = session_profit(100.0, 30.0)
        assert p == {"revenue_usd": 100.0, "cost_usd": 30.0, "profit_usd": 70.0, "margin_pct": 70.0}

    def test_session_profit_zero_revenue_no_div0(self):
        from app.cubes.cube5_gateway.service import session_profit
        p = session_profit(0.0, 30.0)
        assert p["profit_usd"] == -30.0 and p["margin_pct"] == 0.0

    @pytest.mark.asyncio
    async def test_metrics_include_profit_and_windows(self):
        from app.cubes.cube5_gateway import service

        now = datetime(2026, 3, 31, 12, 5, tzinfo=timezone.utc)
        session = MagicMock(); session.id = uuid.uuid4()
        session.opened_at = now - timedelta(minutes=10)
        session.closed_at = None
        session.fee_amount_cents = 1111  # $11.11 moderator-paid tier
        mock_db = _metrics_mocks(session, total_seconds=0.0, user_count=0)
        with patch("app.cubes.cube8_tokens.service.get_session_token_summary",
                   new=AsyncMock(return_value={"total_heart": 0.0, "total_human": 0.0, "total_unity": 0.0})):
            m = await service.get_session_poll_metrics(mock_db, session_id=session.id, now=now)
        assert m["profit"]["revenue_usd"] == 11.11
        assert "cost_usd" in m["profit"] and "margin_pct" in m["profit"]
        assert m["profit"]["time_capital_min"] == 10.0
        assert m["mot_windows"]["quarter"] == 91.25
