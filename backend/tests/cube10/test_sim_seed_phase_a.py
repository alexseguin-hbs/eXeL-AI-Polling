"""Krishna (AsM round 1, 2026-10-07): in LIVE, theming must not start before the Phase A summaries exist.

POST /sessions/{id}/sim/responses waits (bounded by asyncio.wait_for) for the Phase A summaries it triggered and
returns `summarized` alongside `accepted`; a timeout reports incomplete work and never cancels it.
"""
from __future__ import annotations

import asyncio
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube10_simulation import sim_seed


@pytest.mark.asyncio
async def test_seed_waits_for_the_phase_a_it_triggered_and_reports_summarized(monkeypatch):
    from app.cubes.cube2_text import service as text_service

    sid = uuid.uuid4()
    finished: list[uuid.UUID] = []

    async def run_phase_a_with_retry(*, session_id, response_id, **_):  # the name cube2 schedules
        await asyncio.sleep(0.05)
        finished.append(response_id)

    async def fake_submit(db, *, session_id, **_):
        rid = uuid.uuid4()
        asyncio.create_task(run_phase_a_with_retry(session_id=session_id, response_id=rid))
        return {"id": rid}

    async def fake_participant(db, session, label):
        return SimpleNamespace(id=uuid.uuid4())

    async def fake_count(db, ids):
        return len([i for i in ids if i in finished])  # what exists at the moment the seed counts

    monkeypatch.setattr(text_service, "submit_text_response", fake_submit)
    monkeypatch.setattr(sim_seed, "_sim_participant", fake_participant)
    monkeypatch.setattr(sim_seed, "count_summarized", fake_count)
    monkeypatch.setattr(
        sim_seed, "_simulation_session", AsyncMock(return_value=SimpleNamespace(id=sid, session_type="simulation")),
    )
    db = MagicMock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()
    payload = sim_seed.SimResponsesIn(
        question_id=uuid.uuid4(), responses=[sim_seed.SimResponse(text=f"r{i}") for i in range(3)],
    )

    seed = getattr(sim_seed.seed_responses, "__wrapped__", sim_seed.seed_responses)
    out = await seed(request=MagicMock(), session_id=sid, payload=payload, db=db, user=None)
    assert out["accepted"] == 3
    assert out["summarized"] == 3, "every summary existed before the seed answered"
    assert out["phase_a_complete"] is True
    db.commit.assert_awaited()  # responses committed before Phase A (its own connection) needs them


@pytest.mark.asyncio
async def test_phase_a_wait_is_bounded_and_never_cancels():
    async def run_phase_a_with_retry(**_):
        await asyncio.sleep(0.3)

    t = asyncio.create_task(run_phase_a_with_retry())
    assert await sim_seed.wait_for_phase_a([t], timeout=0.01) is False
    assert not t.cancelled()
    await t
    assert await sim_seed.wait_for_phase_a([], timeout=0.01) is True


@pytest.mark.asyncio
async def test_phase_a_tasks_are_scoped_to_the_session():
    """Only this session's Phase A tasks are waited on (another session's poll never delays a simulation)."""
    mine, other = uuid.uuid4(), uuid.uuid4()

    async def run_phase_a_with_retry(*, session_id, **_):
        await asyncio.sleep(0)

    async def unrelated():
        await asyncio.sleep(0)

    before = asyncio.all_tasks()
    a = asyncio.create_task(run_phase_a_with_retry(session_id=mine))
    b = asyncio.create_task(run_phase_a_with_retry(session_id=other))
    c = asyncio.create_task(unrelated())
    found = sim_seed._phase_a_tasks(before, mine)
    await asyncio.gather(a, b, c)
    assert found == [a]


def test_seed_bound_is_explicit():
    assert 0 < sim_seed.PHASE_A_WAIT_S <= 300
