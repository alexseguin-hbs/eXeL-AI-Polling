"""Cube 8 — MVP2+ Feature Tests.

Tests:
  - CRS-24.03: Velocity caps + anomaly detection
  - CRS-35.01: Session token config
  - CRS-25.06: Talent profile
  - Router: new endpoints exist
"""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube8_tokens.service import (
    _VELOCITY_CAP_PER_HOUR,
    _VELOCITY_ANOMALY_MULTIPLIER,
    check_velocity_cap,
    get_talent_profile,
)

SESSION_ID = uuid.uuid4()
USER_ID = "auth0|user_001"


# ---------------------------------------------------------------------------
# CRS-24.03: Velocity Caps
# ---------------------------------------------------------------------------


class TestVelocityCaps:
    """Token earning rate anomaly detection."""

    def test_velocity_cap_constant(self):
        assert _VELOCITY_CAP_PER_HOUR == 60.0

    def test_anomaly_multiplier_constant(self):
        assert _VELOCITY_ANOMALY_MULTIPLIER == 3.0

    @pytest.mark.asyncio
    async def test_zero_tokens_no_anomaly(self):
        mock_db = AsyncMock()
        user_result = MagicMock()
        user_result.scalar.return_value = 0.0
        avg_result = MagicMock()
        avg_result.one.return_value = (0.0, 1)
        mock_db.execute = AsyncMock(side_effect=[user_result, avg_result])

        result = await check_velocity_cap(mock_db, SESSION_ID, USER_ID)
        assert result["cap_exceeded"] is False
        assert result["anomaly_flagged"] is False

    @pytest.mark.asyncio
    async def test_cap_exceeded_flags(self):
        mock_db = AsyncMock()
        user_result = MagicMock()
        user_result.scalar.return_value = 100.0  # Over 60/hr cap
        avg_result = MagicMock()
        avg_result.one.return_value = (200.0, 5)  # avg = 40
        mock_db.execute = AsyncMock(side_effect=[user_result, avg_result])

        result = await check_velocity_cap(mock_db, SESSION_ID, USER_ID)
        assert result["cap_exceeded"] is True

    @pytest.mark.asyncio
    async def test_anomaly_3x_average_flags(self):
        mock_db = AsyncMock()
        user_result = MagicMock()
        user_result.scalar.return_value = 40.0  # Under cap but 4x average
        avg_result = MagicMock()
        avg_result.one.return_value = (50.0, 5)  # avg = 10
        mock_db.execute = AsyncMock(side_effect=[user_result, avg_result])

        result = await check_velocity_cap(mock_db, SESSION_ID, USER_ID)
        assert result["anomaly_flagged"] is True


# ---------------------------------------------------------------------------
# CRS-35.01: Token Config
# ---------------------------------------------------------------------------


class TestTokenConfig:
    """Session-level token configuration."""

    def test_config_function_exists(self):
        import asyncio
        from app.cubes.cube8_tokens.service import get_session_token_config
        assert asyncio.iscoroutinefunction(get_session_token_config)


# ---------------------------------------------------------------------------
# CRS-25.06: Talent Profile
# ---------------------------------------------------------------------------


class TestTalentProfile:
    """Talent profile computation from ledger data."""

    @pytest.mark.asyncio
    async def test_empty_profile(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.one.return_value = (None, None, None, 0)
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_talent_profile(mock_db, USER_ID)
        assert result["user_id"] == USER_ID
        assert result["total_heart"] == 0
        assert result["session_count"] == 0
        assert result["is_available"] is False

    @pytest.mark.asyncio
    async def test_populated_profile(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.one.return_value = (15.0, 1.815, 75.0, 3)
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_talent_profile(mock_db, USER_ID)
        assert result["total_heart"] == 15.0
        assert result["total_unity"] == 75.0
        assert result["session_count"] == 3


# ---------------------------------------------------------------------------
# Router Structure
# ---------------------------------------------------------------------------


class TestCube8RouterMVP2:
    """Verify new MVP2 endpoints."""

    def test_velocity_endpoint(self):
        from app.cubes.cube8_tokens.router import router
        found = any(
            "velocity" in r.path
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_config_endpoint(self):
        from app.cubes.cube8_tokens.router import router
        found = any(
            "config" in r.path
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_talent_endpoint(self):
        from app.cubes.cube8_tokens.router import router
        found = any(
            "talent" in r.path
            for r in router.routes if hasattr(r, "methods")
        )
        assert found
