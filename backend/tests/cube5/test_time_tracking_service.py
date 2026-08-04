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

    def test_sub_minute_rounds_up(self):
        """Less than 1 minute rounds UP to 1♡ (ceil function)."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = False
            mock_settings.unity_heart_multiplier = 5.0

            from app.cubes.cube5_gateway.service import calculate_tokens
            heart, human, unity = calculate_tokens(30.0, "responding")

        assert heart == 1.0
        assert unity == 5.0

    def test_fractional_minutes_ceil(self):
        """2 min 30 sec = 3♡ (ceil), rounds UP."""
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = False
            mock_settings.unity_heart_multiplier = 5.0

            from app.cubes.cube5_gateway.service import calculate_tokens
            heart, human, unity = calculate_tokens(150.0, "responding")

        assert heart == 3.0
        assert unity == 15.0

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

    # ── The mint is currency-free from release 35 ───────────────────────────
    # These four tests used to assert 웃 = minutes × rate/60, which made the
    # 9,999 ceiling cost 29,409 hours in Nigeria and 614 in Washington State.
    # They now assert the opposite invariant: one minute mints one minute's 웃
    # everywhere, and the jurisdiction is carried as a settlement stamp instead.

    ONE_MINUTE_HI = round(1.0 / 60.0 * (9999.0 / 2080.0), 4)  # 0.0801

    def _mint_one_minute(self, country, state=None):
        with patch("app.cubes.cube5_gateway.service.settings") as mock_settings:
            mock_settings.human_enabled = True

            from app.cubes.cube5_gateway.service import _calculate_human
            return _calculate_human(1.0, country, state)

    def test_human_enabled_texas_rate(self):
        """웃 for 1 min in Texas — one minute of time, not 7.25/60 of a dollar."""
        assert self._mint_one_minute("US", "Texas") == self.ONE_MINUTE_HI

    def test_human_enabled_california_rate(self):
        """California pays 16.00/hr and still mints exactly the same 웃."""
        assert self._mint_one_minute("US", "California") == self.ONE_MINUTE_HI

    def test_human_international_nigeria(self):
        """Nigeria pays 0.34/hr and still mints exactly the same 웃.

        This is the whole point: the 47.9x wage spread must not become a
        47.9x difference in how long it takes to reach the ceiling.
        """
        assert self._mint_one_minute("Nigeria") == self.ONE_MINUTE_HI

    def test_human_unknown_jurisdiction_mints_the_same(self):
        """An unresolved jurisdiction cannot change the mint either."""
        assert self._mint_one_minute("Atlantis") == self.ONE_MINUTE_HI

    def test_jurisdiction_still_resolves_for_settlement(self):
        """The rate table is not gone — it moved to the settlement stamp."""
        from app.core.hi_rates import settlement_stamp

        assert settlement_stamp("US", "Texas") == ("United States/Texas", 7.25)
        assert settlement_stamp("US", "California") == ("United States/California", 16.00)
        assert settlement_stamp("Nigeria") == ("Nigeria", 0.34)
        assert settlement_stamp("Atlantis") == ("Atlantis", 7.25)  # default fallback


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
        """Should sum all time entries and tokens for a participant via SQL aggregate."""
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

        # First call: SQL aggregate row
        agg_row = MagicMock()
        agg_row.total_seconds = 180.0
        agg_row.total_heart = 3.0
        agg_row.total_human = 0.0
        agg_row.total_unity = 15.0
        agg_result = MagicMock()
        agg_result.one.return_value = agg_row

        # Second call: entries list
        entries_result = MagicMock()
        entries_result.scalars.return_value.all.return_value = [entry1, entry2]

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(side_effect=[agg_result, entries_result])

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
        # First call: SQL aggregate row with zeros
        agg_row = MagicMock()
        agg_row.total_seconds = 0.0
        agg_row.total_heart = 0.0
        agg_row.total_human = 0.0
        agg_row.total_unity = 0.0
        agg_result = MagicMock()
        agg_result.one.return_value = agg_row

        # Second call: empty entries list
        entries_result = MagicMock()
        entries_result.scalars.return_value.all.return_value = []

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(side_effect=[agg_result, entries_result])

        from app.cubes.cube5_gateway.service import get_participant_time_summary
        result = await get_participant_time_summary(
            mock_db, session_id=uuid.uuid4(), participant_id=uuid.uuid4()
        )
        assert result["total_active_seconds"] == 0.0
        assert result["total_heart_tokens"] == 0.0
