"""Phase B2 — moderator-paid session cannot OPEN/POLL until paid (operator: payment
working before Cube 2). Free + cost_split tiers are never blocked at this gate.

Run: cd backend && python -m pytest tests/cube1/test_payment_open_gate.py -v --tb=short
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from tests.conftest import make_session


def _tx_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.execute = AsyncMock()
    return db


def _session(*, pricing_tier, is_paid, status="draft"):
    s = make_session(status=status)
    s.pricing_tier = pricing_tier
    s.is_paid = is_paid
    s.can_transition_to = MagicMock(return_value=True)
    s.opened_at = None
    return s


class TestPaymentOpenGate:
    @pytest.mark.asyncio
    async def test_moderator_paid_unpaid_open_blocked_402(self):
        from app.cubes.cube1_session.service import transition_session

        s = _session(pricing_tier="moderator_paid", is_paid=False, status="draft")
        with pytest.raises(HTTPException) as exc:
            await transition_session(_tx_db(), s, "open")
        assert exc.value.status_code == 402

    @pytest.mark.asyncio
    async def test_moderator_paid_unpaid_polling_blocked_402(self):
        from app.cubes.cube1_session.service import transition_session

        s = _session(pricing_tier="moderator_paid", is_paid=False, status="open")
        with pytest.raises(HTTPException) as exc:
            await transition_session(_tx_db(), s, "polling")
        assert exc.value.status_code == 402

    @pytest.mark.asyncio
    async def test_moderator_paid_paid_open_allowed(self):
        from app.cubes.cube1_session.service import transition_session

        s = _session(pricing_tier="moderator_paid", is_paid=True, status="draft")
        with patch("app.cubes.cube1_session.service._log_audit", new=AsyncMock()):
            result = await transition_session(_tx_db(), s, "open")
        assert result.status == "open"

    @pytest.mark.asyncio
    async def test_free_tier_open_not_blocked(self):
        from app.cubes.cube1_session.service import transition_session

        s = _session(pricing_tier="free", is_paid=False, status="draft")
        with patch("app.cubes.cube1_session.service._log_audit", new=AsyncMock()):
            result = await transition_session(_tx_db(), s, "open")
        assert result.status == "open"

    @pytest.mark.asyncio
    async def test_cost_split_open_not_blocked(self):
        """Cost-split collects per-participant at results time — not gated at open."""
        from app.cubes.cube1_session.service import transition_session

        s = _session(pricing_tier="cost_split", is_paid=False, status="draft")
        with patch("app.cubes.cube1_session.service._log_audit", new=AsyncMock()):
            result = await transition_session(_tx_db(), s, "open")
        assert result.status == "open"
