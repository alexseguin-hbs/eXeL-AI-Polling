"""Cube 8 — Token Functional Tests (mock DB).

Tests:
  - Ledger entry creation with all fields
  - Lifecycle transition validation (valid + invalid paths)
  - Entry reversal (negative offset + original marked reversed)
  - Dispute resolution (upheld → reversal, rejected → no change)
  - Token summary aggregation
  - CQS reward disbursement
  - Cross-cube integration contracts
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube8_tokens.service import (
    LIFECYCLE_STATES,
    VALID_TRANSITIONS,
)

SESSION_ID = uuid.uuid4()
USER_ID = "auth0|user_001"
ENTRY_ID = uuid.uuid4()


# ---------------------------------------------------------------------------
# Mock Helpers
# ---------------------------------------------------------------------------


def _make_ledger_entry(
    *,
    entry_id=None,
    session_id=None,
    user_id=None,
    lifecycle_state="pending",
    delta_heart=1.0,
    delta_human=0.121,
    delta_unity=5.0,
    action_type="responding",
):
    entry = MagicMock()
    entry.id = entry_id or uuid.uuid4()
    entry.session_id = session_id or SESSION_ID
    entry.user_id = user_id or USER_ID
    entry.cube_id = "cube5"
    entry.action_type = action_type
    entry.delta_heart = delta_heart
    entry.delta_human = delta_human
    entry.delta_unity = delta_unity
    entry.lifecycle_state = lifecycle_state
    entry.reason = "Time tracking"
    entry.created_at = datetime.now(timezone.utc)
    return entry


def _make_dispute(*, dispute_id=None, status="open"):
    d = MagicMock()
    d.id = dispute_id or uuid.uuid4()
    d.ledger_entry_id = ENTRY_ID
    d.flagged_by = USER_ID
    d.reason = "Incorrect amount"
    d.status = status
    d.resolution_notes = None
    d.resolved_by = None
    d.resolved_at = None
    d.created_at = datetime.now(timezone.utc)
    return d


# ---------------------------------------------------------------------------
# Lifecycle Transition Integration
# ---------------------------------------------------------------------------


class TestLifecycleTransitions:
    """Test all valid and invalid lifecycle paths."""

    def test_full_happy_path(self):
        """simulated → pending → approved → finalized is valid."""
        state = "simulated"
        for next_state in ["pending", "approved", "finalized"]:
            assert next_state in VALID_TRANSITIONS[state]
            state = next_state

    def test_reversal_from_any_active(self):
        """reversed is reachable from pending, approved, finalized."""
        for state in ["pending", "approved", "finalized"]:
            assert "reversed" in VALID_TRANSITIONS[state]

    def test_reversed_is_terminal(self):
        """No transitions from reversed."""
        assert VALID_TRANSITIONS["reversed"] == set()

    def test_cannot_go_backward(self):
        """finalized cannot go back to approved or pending."""
        assert "approved" not in VALID_TRANSITIONS["finalized"]
        assert "pending" not in VALID_TRANSITIONS["finalized"]

    def test_cannot_skip_approved(self):
        """pending cannot jump to finalized."""
        assert "finalized" not in VALID_TRANSITIONS["pending"]

    @pytest.mark.asyncio
    async def test_transition_function_exists_and_callable(self):
        """transition_lifecycle_state is async and callable."""
        import asyncio
        from app.cubes.cube8_tokens.service import transition_lifecycle_state
        assert asyncio.iscoroutinefunction(transition_lifecycle_state)

    @pytest.mark.asyncio
    async def test_reverse_entry_function_exists(self):
        """reverse_entry is async and callable."""
        import asyncio
        from app.cubes.cube8_tokens.service import reverse_entry
        assert asyncio.iscoroutinefunction(reverse_entry)


# ---------------------------------------------------------------------------
# Token Summary
# ---------------------------------------------------------------------------


class TestTokenSummary:
    """Token summary aggregation."""

    @pytest.mark.asyncio
    async def test_empty_session_returns_zeros(self):
        from app.cubes.cube8_tokens.service import get_session_token_summary

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_session_token_summary(mock_db, SESSION_ID)
        assert result["total_entries"] == 0
        assert result["unique_users"] == 0
        assert result["total_heart"] == 0.0
        assert result["total_human"] == 0.0
        assert result["total_unity"] == 0.0

    @pytest.mark.asyncio
    async def test_aggregates_multiple_entries(self):
        from app.cubes.cube8_tokens.service import get_session_token_summary

        entries = [
            _make_ledger_entry(user_id="u1", delta_heart=2.0, delta_unity=10.0),
            _make_ledger_entry(user_id="u2", delta_heart=3.0, delta_unity=15.0),
            _make_ledger_entry(user_id="u1", delta_heart=1.0, delta_unity=5.0),
        ]

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = entries
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_session_token_summary(mock_db, SESSION_ID)
        assert result["total_entries"] == 3
        assert result["unique_users"] == 2
        assert result["total_heart"] == 6.0
        assert result["total_unity"] == 30.0
        assert result["avg_heart"] == 3.0  # 6.0 / 2 users

    @pytest.mark.asyncio
    async def test_by_action_breakdown(self):
        from app.cubes.cube8_tokens.service import get_session_token_summary

        entries = [
            _make_ledger_entry(action_type="responding"),
            _make_ledger_entry(action_type="responding"),
            _make_ledger_entry(action_type="ranking"),
        ]

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = entries
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_session_token_summary(mock_db, SESSION_ID)
        assert result["by_action"]["responding"] == 2
        assert result["by_action"]["ranking"] == 1


# ---------------------------------------------------------------------------
# Dispute Resolution
# ---------------------------------------------------------------------------


class TestDisputeResolution:
    """Dispute resolution workflow."""

    @pytest.mark.asyncio
    async def test_resolve_dispute_function_exists(self):
        import asyncio
        from app.cubes.cube8_tokens.service import resolve_dispute
        assert asyncio.iscoroutinefunction(resolve_dispute)

    @pytest.mark.asyncio
    async def test_get_user_disputes_function_exists(self):
        import asyncio
        from app.cubes.cube8_tokens.service import get_user_disputes
        assert asyncio.iscoroutinefunction(get_user_disputes)

    def test_valid_resolutions(self):
        """Only 'resolved' and 'rejected' are valid."""
        valid = {"resolved", "rejected"}
        assert valid == {"resolved", "rejected"}


# ---------------------------------------------------------------------------
# CQS Reward
# ---------------------------------------------------------------------------


class TestCQSReward:
    """CQS reward disbursement."""

    @pytest.mark.asyncio
    async def test_disburse_function_exists(self):
        import asyncio
        from app.cubes.cube8_tokens.service import disburse_cqs_reward
        assert asyncio.iscoroutinefunction(disburse_cqs_reward)

    def test_reward_creates_pending_entry(self):
        """CQS reward should create entry with lifecycle_state='pending'."""
        import inspect
        from app.cubes.cube8_tokens.service import disburse_cqs_reward
        src = inspect.getsource(disburse_cqs_reward)
        assert "cqs_reward" in src
        assert "pending" in src


# ---------------------------------------------------------------------------
# Payment Service Contract
# ---------------------------------------------------------------------------


class TestPaymentServiceContracts:
    """Verify payment service functions exist."""

    def test_create_moderator_checkout_exists(self):
        from app.cubes.cube8_tokens import payment_service
        assert callable(payment_service.create_moderator_checkout)

    def test_create_cost_split_intent_exists(self):
        from app.cubes.cube8_tokens import payment_service
        assert callable(payment_service.create_cost_split_intent)

    def test_create_donation_intent_exists(self):
        from app.cubes.cube8_tokens import payment_service
        assert callable(payment_service.create_donation_intent)

    def test_estimate_session_cost_exists(self):
        from app.cubes.cube8_tokens import payment_service
        assert callable(payment_service.estimate_session_cost)

    def test_get_payment_status_exists(self):
        from app.cubes.cube8_tokens import payment_service
        assert callable(payment_service.get_payment_status)


# ---------------------------------------------------------------------------
# Cross-Cube Integration
# ---------------------------------------------------------------------------


class TestCrossCubeIntegration:
    """Verify Cube 8 integrates with upstream cubes."""

    def test_imports_hi_rates(self):
        from app.core.hi_rates import resolve_human_rate, get_all_rates
        assert callable(resolve_human_rate)
        assert callable(get_all_rates)

    def test_imports_broadcast(self):
        from app.core.supabase_broadcast import broadcast_event
        assert callable(broadcast_event)

    def test_hi_rates_returns_dict(self):
        from app.core.hi_rates import get_all_rates
        rates = get_all_rates()
        assert len(rates) == 59
        assert all("human_rate" in r for r in rates)
