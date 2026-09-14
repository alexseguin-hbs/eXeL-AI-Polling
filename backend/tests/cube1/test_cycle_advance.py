"""Cube 1 — LIVING VOTE: re-opening a ranking round advances the cycle.

Operator 2026-09-14 ("live priorities selected by users"). transition_session on the
existing ranking→polling back-edge must start a NEW cycle (bounded by max_cycles) so the
round's ballots are isolated (unique session+cycle+participant) — never re-used, never
double-counted. Other transitions must leave current_cycle untouched.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import SessionStateError
from app.cubes.cube1_session.service import transition_session
from tests.conftest import make_session


def _db():
    db = AsyncMock(); db.commit = AsyncMock(); db.refresh = AsyncMock(); db.add = MagicMock()
    return db


@pytest.mark.asyncio
async def test_reopen_ranking_to_polling_advances_cycle():
    s = make_session(status="ranking", current_cycle=1, max_cycles=3)
    s.can_transition_to = MagicMock(return_value=True)
    await transition_session(_db(), s, "polling")
    assert s.status == "polling"
    assert s.current_cycle == 2


@pytest.mark.asyncio
async def test_reopen_refused_beyond_max_cycles():
    s = make_session(status="ranking", current_cycle=1, max_cycles=1)
    s.can_transition_to = MagicMock(return_value=True)
    with pytest.raises(SessionStateError):
        await transition_session(_db(), s, "polling")
    assert s.status == "ranking" and s.current_cycle == 1  # nothing moved


@pytest.mark.asyncio
async def test_polling_to_ranking_keeps_cycle():
    s = make_session(status="polling", current_cycle=2, max_cycles=3)
    s.can_transition_to = MagicMock(return_value=True)
    await transition_session(_db(), s, "ranking")
    assert s.status == "ranking" and s.current_cycle == 2


@pytest.mark.asyncio
async def test_first_open_to_polling_keeps_cycle():
    s = make_session(status="open", current_cycle=1, max_cycles=3)
    s.can_transition_to = MagicMock(return_value=True)
    await transition_session(_db(), s, "polling")
    assert s.current_cycle == 1


@pytest.mark.asyncio
async def test_reopen_endpoint_routes_to_polling():
    """POST /{id}/reopen → _transition_and_return(..., "polling", ...)."""
    import uuid
    from app.cubes.cube1_session import router as r
    sid = uuid.uuid4()
    fake = MagicMock()
    with patch.object(r, "_transition_and_return", new=AsyncMock(return_value=fake)) as t:
        out = await r.reopen_polling(session_id=sid, db=_db(), user=MagicMock())
    assert out is fake
    assert t.await_args.args[2] == "polling"
