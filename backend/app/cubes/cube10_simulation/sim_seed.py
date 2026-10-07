"""Cube 10 — seed a SIMULATION session's responses and ballots through the real services (HP-21, 2026-10-07).

The Admin Simulation Console (frontend/lib/sim-console-driver.ts) runs the real pipeline against the backend:
create → question → open → poll → responses → theme → rank → ballots → aggregate. Two of those steps cannot go
through the public endpoints without defeating their own protections:
  * a response must come from a joined participant, and join + submit are limited to 100/min per address
    (a 5,000-response run would take an hour);
  * a ballot is bound to the logged-in person (one person, one vote), so fifty simulated voters from one admin
    collapse into one ballot.

So this router seeds them server-side, and ONLY for sessions created as session_type == "simulation", by the
session's owner. Every response still goes through cube2 `submit_text_response` (validation, PII, Phase A
summaries) and every ballot through cube7 `submit_user_ranking` (theme validation, living re-vote, progress
broadcast) — the same code a real participant reaches. A real session refuses both endpoints, so its anti-sybil
guarantee is unchanged.
"""
from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.dependencies import get_db
from app.core.rate_limit import limiter
from app.core.session_access import require_session_owner
from app.models.session import Session

router = APIRouter(prefix="/sessions/{session_id}/sim", tags=["Cube 10 — Simulation"])

MAX_ITEMS = 5000  # the console's largest preset (the 5,000-response past poll)
# Krishna (AsM round 1): theming reads the Phase A summaries, so the seed waits for the ones it triggered before it
# answers — bounded, so a slow provider can never hang the request. What is not done by then is reported, not hidden.
PHASE_A_WAIT_S = 120.0
_PHASE_A_TASK = "run_phase_a_with_retry"  # the coroutine cube2 submit_text_response schedules per response
_UNAVAILABLE = "[Summary unavailable]"    # phase_a_retry's marker when every retry failed


class SimResponse(BaseModel):
    text: str = Field(..., min_length=1, max_length=3333)
    language_code: str = Field("en", pattern=r"^[a-zA-Z]{2,3}$")


class SimResponsesIn(BaseModel):
    question_id: uuid.UUID
    responses: list[SimResponse] = Field(..., min_length=1, max_length=MAX_ITEMS)


class SimBallotsIn(BaseModel):
    ballots: list[list[uuid.UUID]] = Field(..., min_length=1, max_length=MAX_ITEMS)


async def _simulation_session(db: AsyncSession, session_id: uuid.UUID) -> Session:
    session = (await db.execute(select(Session).where(Session.id == session_id))).scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.session_type != "simulation":
        raise HTTPException(
            status_code=403,
            detail="Only a simulation session can be seeded; a real session takes responses and ballots from its participants.",
        )
    return session


async def _sim_participant(db: AsyncSession, session: Session, label: str):
    """A simulated participant row, marked as such (device_type "simulation", user_id "sim:<uuid>").

    Created directly rather than through join: join is limited to 100/min per address and admits people only
    while a session is open or polling, and simulated voters are added during ranking.
    """
    from datetime import datetime, timezone

    from app.models.participant import Participant

    participant = Participant(
        session_id=session.id, user_id=f"sim:{uuid.uuid4()}", display_name=label, device_type="simulation",
        joined_at=datetime.now(timezone.utc), is_active=True, language_code="en",
    )
    db.add(participant)
    await db.flush()
    return participant


def _phase_a_tasks(before: set[asyncio.Task], session_id: uuid.UUID) -> list[asyncio.Task]:
    """The Phase A tasks scheduled since `before` for this session.

    cube2 `submit_text_response` schedules Phase A fire-and-forget and keeps no handle; the seed finds the tasks it
    caused by coroutine name and the session_id argument, so the cube2 path a real participant reaches is unchanged.
    """
    found = []
    for task in asyncio.all_tasks() - before:
        coro = task.get_coro()
        if getattr(coro, "__name__", "") != _PHASE_A_TASK:
            continue
        frame = getattr(coro, "cr_frame", None)
        sid = frame.f_locals.get("session_id") if frame is not None else None
        if sid is None or sid == session_id:
            found.append(task)
    return found


async def wait_for_phase_a(tasks: list[asyncio.Task], timeout: float = PHASE_A_WAIT_S) -> bool:
    """Wait (bounded) for the Phase A tasks. True when all finished in time. A timeout never cancels them."""
    if not tasks:
        return True
    try:
        await asyncio.wait_for(asyncio.shield(asyncio.gather(*tasks, return_exceptions=True)), timeout=timeout)
        return True
    except asyncio.TimeoutError:
        return False


async def count_summarized(db: AsyncSession, response_ids: list[uuid.UUID]) -> int:
    """How many of these responses have a real Phase A summary stored (the fallback marker does not count)."""
    if not response_ids:
        return 0
    from sqlalchemy import func

    from app.models.response_summary import ResponseSummary

    n = 0
    for i in range(0, len(response_ids), 1000):
        chunk = response_ids[i:i + 1000]
        n += (await db.execute(
            select(func.count()).select_from(ResponseSummary).where(
                ResponseSummary.response_meta_id.in_(chunk), ResponseSummary.summary_33 != _UNAVAILABLE,
            )
        )).scalar_one()
    return int(n)


@router.post("/responses", status_code=201)
@limiter.limit("20/minute")
async def seed_responses(
    request: Request,
    session_id: uuid.UUID,
    payload: SimResponsesIn,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin")),
):
    """Each response from its own simulated participant, through cube2 submit_text_response.

    Returns `summarized` alongside `accepted`: the seed waits (bounded by PHASE_A_WAIT_S) for the Phase A summaries
    it triggered, so the console never starts theming over responses that have no summary yet. Phase A for a
    simulation runs on the OFFLINE provider unless an HI-approved cost estimate is recorded (addendum 4,
    cube6 `provider_for_session`).
    """
    from app.cubes.cube2_text import service as text_service

    session = await _simulation_session(db, session_id)
    accepted, refused = 0, []
    response_ids: list[uuid.UUID] = []
    before = asyncio.all_tasks()
    for i, r in enumerate(payload.responses):
        try:
            participant = await _sim_participant(db, session, f"sim-{i + 1}")
            out = await text_service.submit_text_response(
                db, session_id=session_id, question_id=payload.question_id, participant_id=participant.id,
                raw_text=r.text, language_code=r.language_code,
            )
            rid = out.get("id") if isinstance(out, dict) else getattr(out, "id", None)
            if rid is not None:
                response_ids.append(rid if isinstance(rid, uuid.UUID) else uuid.UUID(str(rid)))
            accepted += 1
        except Exception as e:  # a refused item is reported with its reason, never dropped silently
            await db.rollback()
            refused.append({"index": i, "reason": str(getattr(e, "detail", e))[:200]})
    await db.commit()  # Phase A writes from its own connection; the responses must be visible to it
    phase_a_done = await wait_for_phase_a(_phase_a_tasks(before, session_id))
    summarized = await count_summarized(db, response_ids)
    return {
        "accepted": accepted, "summarized": summarized, "phase_a_complete": phase_a_done,
        "refused": refused[:50], "refused_count": len(refused),
    }


@router.post("/ballots", status_code=201)
@limiter.limit("20/minute")
async def seed_ballots(
    request: Request,
    session_id: uuid.UUID,
    payload: SimBallotsIn,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin")),
):
    """Each ballot from its own simulated voter, through cube7 submit_user_ranking (same rules as a real vote)."""
    from app.cubes.cube7_ranking import service as ranking_service

    session = await _simulation_session(db, session_id)
    if session.status not in ("ranking", "polling"):
        raise HTTPException(status_code=400, detail=f"Session is in '{session.status}' — ranking not open")
    accepted, refused = 0, []
    for i, ballot in enumerate(payload.ballots):
        try:
            voter = await _sim_participant(db, session, f"sim-voter-{i + 1}")
            await ranking_service.submit_user_ranking(
                db, session_id=session_id, participant_id=voter.id, ranked_theme_ids=ballot,
                cycle_id=getattr(session, "current_cycle", 1) or 1,
                theme2_voting_level=getattr(session, "theme2_voting_level", "theme2_3"),
                session_short_code=session.short_code,
                theme01_category=getattr(session, "theme01_category", None),
                allow_revote=True,
            )
            await db.commit()  # one ballot, one commit: a later refusal's rollback never takes earlier votes with it
            accepted += 1
        except Exception as e:  # same rule: every refusal is counted and named
            await db.rollback()
            refused.append({"index": i, "reason": str(getattr(e, "detail", e))[:200]})
    return {"accepted": accepted, "refused": refused[:50], "refused_count": len(refused)}
