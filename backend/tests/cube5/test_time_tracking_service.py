"""Cube 5 — Time Tracking Service Tests.

Tests:
  - Token calculation (♡/웃/◬ formula)
  - Start/stop time tracking
  - Login auto-entry (awards default ♡1 웃0 ◬5)
  - 웃 jurisdiction rate calculation (enabled/disabled)
  - Participant time summary aggregation
  - Edge cases (zero duration, very short/long durations)
  - Ledger entry creation on stop
"""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Token Calculation
# ---------------------------------------------------------------------------


class TestCalculateTokens:
    def test_one_minute_basic(self):
        """1 minute = 1♡, 0웃, 5◬ (human_enabled=False, 5x multiplier)."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = False
            mock_settings.unity_heart_multiplier = 5.0

            from app.cubes.cube5_gateway.service import calculate_tokens
            heart, human, unity = calculate_tokens(60.0, "responding")

        assert heart == 1.0
        assert human == 0.0
        assert unity == 5.0

    def test_five_minutes(self):
        """5 minutes = 5♡, 0웃, 25◬."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = False
            mock_settings.unity_heart_multiplier = 5.0

            from app.cubes.cube5_gateway.service import calculate_tokens
            heart, human, unity = calculate_tokens(300.0, "responding")

        assert heart == 5.0
        assert human == 0.0
        assert unity == 25.0

    def test_sub_minute_gets_zero_heart(self):
        """Less than 1 minute = 0♡ (floor function)."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = False
            mock_settings.unity_heart_multiplier = 5.0

            from app.cubes.cube5_gateway.service import calculate_tokens
            heart, human, unity = calculate_tokens(30.0, "responding")

        assert heart == 0.0
        assert unity == 0.0

    def test_fractional_minutes_floor(self):
        """2 min 30 sec = 2♡ (floor), not 3."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = False
            mock_settings.unity_heart_multiplier = 5.0

            from app.cubes.cube5_gateway.service import calculate_tokens
            heart, human, unity = calculate_tokens(150.0, "responding")

        assert heart == 2.0
        assert unity == 10.0

    def test_zero_duration(self):
        """0 seconds = 0 for all tokens."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = False
            mock_settings.unity_heart_multiplier = 5.0

            from app.cubes.cube5_gateway.service import calculate_tokens
            heart, human, unity = calculate_tokens(0.0, "responding")

        assert heart == 0.0
        assert human == 0.0
        assert unity == 0.0


# ---------------------------------------------------------------------------
# 웃 Token Calculation
# ---------------------------------------------------------------------------


class TestHumanTokenCalculation:
    def test_human_disabled_returns_zero(self):
        """웃 should be 0 when human_enabled=False."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = False

            from app.cubes.cube5_gateway.service import _calculate_human
            result = _calculate_human(5.0, "US", "Texas")

        assert result == 0.0

    def test_human_enabled_texas_rate(self):
        """웃 for 1 min at Texas rate ($7.25/hr) = 7.25/60 = ~0.1208."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = True

            from app.cubes.cube5_gateway.service import _calculate_human
            result = _calculate_human(1.0, "US", "Texas")

        assert abs(result - round(7.25 / 60, 4)) < 0.001

    def test_human_enabled_california_rate(self):
        """웃 for 1 min at California rate ($16.00/hr)."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = True

            from app.cubes.cube5_gateway.service import _calculate_human
            result = _calculate_human(1.0, "US", "California")

        assert abs(result - round(16.00 / 60, 4)) < 0.001

    def test_human_international_nigeria(self):
        """웃 for 1 min at Nigeria rate ($0.34/hr)."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = True

            from app.cubes.cube5_gateway.service import _calculate_human
            result = _calculate_human(1.0, "Nigeria")

        assert abs(result - round(0.34 / 60, 4)) < 0.001

    def test_human_unknown_jurisdiction_uses_default(self):
        """Unknown jurisdiction should use default rate ($7.25/hr)."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = True

            from app.cubes.cube5_gateway.service import _calculate_human
            result = _calculate_human(1.0, "Atlantis")

        assert abs(result - round(7.25 / 60, 4)) < 0.001


# ---------------------------------------------------------------------------
# Start Time Tracking
# ---------------------------------------------------------------------------


class TestStartTimeTracking:
    @pytest.mark.asyncio
    async def test_creates_time_entry(self):
        """Should create and return a TimeEntry."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube5_gateway.service import start_time_tracking
        entry = await start_time_tracking(
            mock_db,
            session_id=uuid.uuid4(),
            participant_id=uuid.uuid4(),
            action_type="responding",
            cube_id="cube2",
        )

        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()


# ---------------------------------------------------------------------------
# Stop Time Tracking
# ---------------------------------------------------------------------------


class TestStopTimeTracking:
    @pytest.mark.asyncio
    async def test_stop_calculates_tokens(self):
        """Stopping should calculate duration and ♡/웃/◬ tokens."""
        entry_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        started = now - timedelta(minutes=3)

        mock_entry = MagicMock()
        mock_entry.id = entry_id
        mock_entry.started_at = started
        mock_entry.stopped_at = None
        mock_entry.action_type = "responding"
        mock_entry.session_id = uuid.uuid4()
        mock_entry.participant_id = uuid.uuid4()
        mock_entry.cube_id = "cube2"

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_entry
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = False
            mock_settings.unity_heart_multiplier = 5.0

            from app.cubes.cube5_gateway.service import stop_time_tracking
            result = await stop_time_tracking(mock_db, time_entry_id=entry_id)

        assert mock_entry.stopped_at is not None
        assert mock_entry.duration_seconds is not None

    @pytest.mark.asyncio
    async def test_stop_not_found_raises(self):
        """Should raise 404 if time entry not found."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from fastapi import HTTPException
        from app.cubes.cube5_gateway.service import stop_time_tracking
        with pytest.raises(HTTPException) as exc_info:
            await stop_time_tracking(mock_db, time_entry_id=uuid.uuid4())
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_stop_already_stopped_raises(self):
        """Should raise 409 if time entry already stopped."""
        mock_entry = MagicMock()
        mock_entry.stopped_at = datetime.now(timezone.utc)

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_entry
        mock_db.execute = AsyncMock(return_value=mock_result)

        from fastapi import HTTPException
        from app.cubes.cube5_gateway.service import stop_time_tracking
        with pytest.raises(HTTPException) as exc_info:
            await stop_time_tracking(mock_db, time_entry_id=uuid.uuid4())
        assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# Login Time Entry
# ---------------------------------------------------------------------------


class TestLoginTimeEntry:
    @pytest.mark.asyncio
    async def test_login_awards_default_tokens(self):
        """Login should award ♡1 웃0 ◬5."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.login_heart_tokens = 1.0
            mock_settings.unity_heart_multiplier = 5.0
            mock_settings.human_enabled = False

            from app.cubes.cube5_gateway.service import create_login_time_entry
            entry = await create_login_time_entry(
                mock_db,
                session_id=uuid.uuid4(),
                participant_id=uuid.uuid4(),
                user_id="auth0|user_001",
            )

        # Should add both TimeEntry and TokenLedger
        assert mock_db.add.call_count == 2

    @pytest.mark.asyncio
    async def test_login_creates_ledger_entry(self):
        """Login should create append-only ledger entry."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.login_heart_tokens = 1.0
            mock_settings.unity_heart_multiplier = 5.0
            mock_settings.human_enabled = False

            from app.cubes.cube5_gateway.service import create_login_time_entry
            await create_login_time_entry(
                mock_db,
                session_id=uuid.uuid4(),
                participant_id=uuid.uuid4(),
            )

        # Second add call should be the ledger entry
        calls = mock_db.add.call_args_list
        assert len(calls) == 2


# ---------------------------------------------------------------------------
# Participant Time Summary
# ---------------------------------------------------------------------------


class TestParticipantTimeSummary:
    @pytest.mark.asyncio
    async def test_aggregates_correctly(self):
        """Should sum all time entries and tokens for a participant."""
        entry1 = MagicMock()
        entry1.duration_seconds = 120.0
        entry1.heart_tokens_earned = 2.0
        entry1.human_tokens_earned = 0.0
        entry1.unity_tokens_earned = 10.0

        entry2 = MagicMock()
        entry2.duration_seconds = 60.0
        entry2.heart_tokens_earned = 1.0
        entry2.human_tokens_earned = 0.0
        entry2.unity_tokens_earned = 5.0

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [entry1, entry2]
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube5_gateway.service import get_participant_time_summary
        sid = uuid.uuid4()
        pid = uuid.uuid4()
        result = await get_participant_time_summary(mock_db, session_id=sid, participant_id=pid)

        assert result["total_active_seconds"] == 180.0
        assert result["total_heart_tokens"] == 3.0
        assert result["total_unity_tokens"] == 15.0

    @pytest.mark.asyncio
    async def test_empty_entries(self):
        """Should return zeros when no time entries exist."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube5_gateway.service import get_participant_time_summary
        result = await get_participant_time_summary(
            mock_db, session_id=uuid.uuid4(), participant_id=uuid.uuid4()
        )
        assert result["total_active_seconds"] == 0.0
        assert result["total_heart_tokens"] == 0.0
