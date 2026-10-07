"""HP-21 gates: the simulation seeding endpoints keep a real session's protections and report every refusal.

The full LIVE sequence (create → question → open → poll → seed responses → theme → rank → seed ballots →
aggregate) is proven against a running backend by scripts/sim_console_live_check.py; these are the invariants
that must hold without one.
"""
from __future__ import annotations

import inspect
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.cubes.cube10_simulation import sim_seed


def _db_returning(session):
    db = MagicMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = session
    db.execute = AsyncMock(return_value=result)
    return db


@pytest.mark.asyncio
async def test_real_session_is_refused():
    """A polling session (any type but simulation) can never be seeded: one person, one vote stays true."""
    for kind in ("polling", "peer_volunteer", "team_collaboration"):
        db = _db_returning(SimpleNamespace(id=uuid.uuid4(), session_type=kind))
        with pytest.raises(HTTPException) as e:
            await sim_seed._simulation_session(db, uuid.uuid4())
        assert e.value.status_code == 403


@pytest.mark.asyncio
async def test_missing_session_is_404_and_simulation_passes():
    with pytest.raises(HTTPException) as e:
        await sim_seed._simulation_session(_db_returning(None), uuid.uuid4())
    assert e.value.status_code == 404
    s = SimpleNamespace(id=uuid.uuid4(), session_type="simulation")
    assert await sim_seed._simulation_session(_db_returning(s), uuid.uuid4()) is s


def test_both_routes_require_the_session_owner():
    """Only the session's owner (moderator/admin) may seed — never any signed-in user."""
    for fn in (sim_seed.seed_responses, sim_seed.seed_ballots):
        dep = inspect.signature(fn).parameters["user"].default
        assert "require_session_owner" in repr(dep.dependency.__qualname__) or "_check" in dep.dependency.__qualname__


def test_bounded_inputs():
    """At most 5,000 items per call (the console's largest preset); each text within the response limit."""
    assert sim_seed.MAX_ITEMS == 5000
    with pytest.raises(Exception):
        sim_seed.SimBallotsIn(ballots=[[uuid.uuid4()]] * 5001)
    with pytest.raises(Exception):
        sim_seed.SimResponse(text="x" * 3334)


def test_refusals_are_reported_not_dropped():
    """Every refused item is counted and named (the console never claims more than the backend accepted)."""
    src = inspect.getsource(sim_seed)
    assert src.count('refused.append({"index": i') == 2
    assert src.count('"refused_count": len(refused)') == 2
    assert "await db.rollback()" in src  # a refusal never poisons the next item's transaction


def test_simulated_participants_are_marked():
    src = inspect.getsource(sim_seed._sim_participant)
    assert 'device_type="simulation"' in src and 'user_id=f"sim:' in src
