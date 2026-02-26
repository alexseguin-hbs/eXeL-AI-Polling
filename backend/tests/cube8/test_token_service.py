"""Cube 8 — Token Ledger Service Tests.

Tests:
  - Session token listing
  - User token balance aggregation
  - Token dispute creation
  - Dispute for non-existent ledger entry
  - 웃 rate table: resolve_human_rate, get_all_rates
  - Rate lookup for all jurisdictions
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.conftest import make_token_ledger


# ---------------------------------------------------------------------------
# Session Token Listing
# ---------------------------------------------------------------------------


class TestGetSessionTokens:
    @pytest.mark.asyncio
    async def test_returns_all_entries(self):
        """Should return all ledger entries for a session."""
        entries = [make_token_ledger(), make_token_ledger()]

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = entries
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube8_tokens.service import get_session_tokens
        result = await get_session_tokens(mock_db, uuid.uuid4())
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_empty_session(self):
        """Should return empty list for session with no tokens."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube8_tokens.service import get_session_tokens
        result = await get_session_tokens(mock_db, uuid.uuid4())
        assert result == []


# ---------------------------------------------------------------------------
# User Token Balance
# ---------------------------------------------------------------------------


class TestGetUserTokenBalance:
    @pytest.mark.asyncio
    async def test_aggregates_balance(self):
        """Should sum ♡/웃/◬ across all qualifying entries."""
        e1 = make_token_ledger(delta_heart=1.0, delta_human=0.0, delta_unity=5.0, lifecycle_state="pending")
        e2 = make_token_ledger(delta_heart=3.0, delta_human=0.5, delta_unity=15.0, lifecycle_state="approved")
        e3 = make_token_ledger(delta_heart=2.0, delta_human=0.0, delta_unity=10.0, lifecycle_state="finalized")

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [e1, e2, e3]
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube8_tokens.service import get_user_token_balance
        result = await get_user_token_balance(mock_db, uuid.uuid4(), "auth0|user_001")

        assert result["total_heart"] == 6.0
        assert result["total_human"] == 0.5
        assert result["total_unity"] == 30.0
        assert result["entry_count"] == 3

    @pytest.mark.asyncio
    async def test_zero_balance(self):
        """User with no entries should have zero balance."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube8_tokens.service import get_user_token_balance
        result = await get_user_token_balance(mock_db, uuid.uuid4(), "auth0|user_001")

        assert result["total_heart"] == 0
        assert result["total_human"] == 0
        assert result["total_unity"] == 0
        assert result["entry_count"] == 0


# ---------------------------------------------------------------------------
# Token Disputes
# ---------------------------------------------------------------------------


class TestCreateDispute:
    @pytest.mark.asyncio
    async def test_create_dispute_success(self):
        """Should create a dispute for an existing ledger entry."""
        ledger_entry = make_token_ledger()

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = ledger_entry
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube8_tokens.service import create_dispute
        dispute = await create_dispute(
            mock_db,
            ledger_entry_id=ledger_entry.id,
            flagged_by="auth0|user_001",
            reason="Tokens not awarded correctly",
        )

        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_dispute_ledger_not_found(self):
        """Should raise 404 when ledger entry doesn't exist."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from fastapi import HTTPException
        from app.cubes.cube8_tokens.service import create_dispute
        with pytest.raises(HTTPException) as exc_info:
            await create_dispute(
                mock_db,
                ledger_entry_id=uuid.uuid4(),
                flagged_by="auth0|user_001",
                reason="Invalid",
            )
        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# 웃 Rate Table
# ---------------------------------------------------------------------------


class TestResolveHumanRate:
    def test_us_texas_default(self):
        """Texas should return 7.25/hr."""
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate("US", "Texas")
        assert rate == 7.25

    def test_us_california(self):
        """California should return 16.00/hr."""
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate("United States", "California")
        assert rate == 16.00

    def test_us_washington(self):
        """Washington should return 16.28/hr (highest US state)."""
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate("USA", "Washington")
        assert rate == 16.28

    def test_nigeria(self):
        """Nigeria should return 0.34/hr."""
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate("Nigeria")
        assert rate == 0.34

    def test_brazil(self):
        """Brazil should return 1.58/hr."""
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate("Brazil")
        assert rate == 1.58

    def test_unknown_country_default(self):
        """Unknown country should return default 7.25/hr."""
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate("Atlantis")
        assert rate == 7.25

    def test_none_jurisdiction_default(self):
        """No jurisdiction should return default 7.25/hr."""
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate(None, None)
        assert rate == 7.25

    def test_us_unknown_state_returns_federal(self):
        """Unknown US state should return federal rate."""
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate("US", "NonExistentState")
        assert rate == 7.25

    def test_case_insensitive_country(self):
        """Country lookup should be case-insensitive."""
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate("nigeria")
        assert rate == 0.34


class TestGetAllRates:
    def test_returns_all_jurisdictions(self):
        """Should return 59 jurisdictions (9 international + 50 US states)."""
        from app.core.hi_rates import get_all_rates
        rates = get_all_rates()
        assert len(rates) == 59

    def test_rate_structure(self):
        """Each rate entry should have country, state, human_rate, currency."""
        from app.core.hi_rates import get_all_rates
        rates = get_all_rates()
        for rate in rates:
            assert "country" in rate
            assert "human_rate" in rate
            assert "currency" in rate
            assert rate["currency"] == "USD"
            assert rate["human_rate"] > 0

    def test_international_have_no_state(self):
        """International entries should have state=None."""
        from app.core.hi_rates import get_all_rates
        rates = get_all_rates()
        international = [r for r in rates if r["country"] != "United States"]
        for r in international:
            assert r["state"] is None

    def test_us_entries_have_state(self):
        """US entries should have a state value."""
        from app.core.hi_rates import get_all_rates
        rates = get_all_rates()
        us_rates = [r for r in rates if r["country"] == "United States"]
        assert len(us_rates) == 50
        for r in us_rates:
            assert r["state"] is not None
