"""Cube 7 — Prioritization & Voting: Ranking UI backend, aggregation.

Endpoints:
  POST /rankings          — Submit participant ranking (CRS-11)
  GET  /rankings          — Get live aggregated rankings (CRS-16/17)
  POST /rankings/aggregate — Trigger aggregation pipeline (CRS-12, moderator)
  GET  /rankings/anomalies — Check voting anomalies (CRS-12.04, moderator)
  POST /override          — Governance override (CRS-22, MVP3)
"""

import uuid

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query, Request, status

from app.core.rate_limit import limiter
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# WireGuard-style whitelist constants — reject anything not in the set
# ---------------------------------------------------------------------------
VALID_THEME_LEVELS = {"3", "6", "9"}
VALID_SORT_ORDERS = {"asc", "desc"}
VALID_RANKING_METHODS = {"borda_count", "quadratic_borda", "top3_points"}

# SIM (Cube 10 checkout) — split-screen + playback whitelists.
# SIM is easter-egg-gated on the frontend (Cyan→Sunset→Violet + password);
# these whitelists are the backend truth for any SIM-scoped mutation.
VALID_SIM_MODES = {"playback", "live", "dual_view"}
VALID_SIM_ROLES = {"moderator", "user1", "user2"}


async def _resolve_cycle(db: AsyncSession, session_id: uuid.UUID, cycle_id: int | None) -> int:
    """Default a cycle read to the session's current_cycle (living vote); explicit wins."""
    if cycle_id is not None:
        return cycle_id
    from app.models.session import Session
    from sqlalchemy import select
    row = await db.execute(select(Session.current_cycle).where(Session.id == session_id))
    cur = row.scalar_one_or_none()
    return int(cur or 1)


from app.core.auth import CurrentUser, get_current_user, get_optional_current_user
from app.core.session_access import require_session_owner
from app.core.dependencies import get_db
from app.core.participant_token import HEADER as PARTICIPANT_TOKEN_HEADER
from app.core.participant_token import verify_participant_token
from app.core.permissions import require_role
from app.cubes.cube7_ranking import service
from app.schemas.ranking import (
    AggregatedRankingRead,
    GovernanceOverrideRead,
    GovernanceOverrideSubmit,
    RankingRead,
    AggregateRequest,
    FinalDecisionSubmit,
    RankingSubmit,
)

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 7 — Ranking"])


# ---------------------------------------------------------------------------
# CRS-11: Submit Ranking
# ---------------------------------------------------------------------------


@router.post("/rankings", response_model=RankingRead, status_code=201)
@limiter.limit("60/minute")  # a re-vote replaces the ballot, but every call still validates and writes (Thor, r11)
async def submit_ranking(
    request: Request,
    session_id: uuid.UUID,
    payload: RankingSubmit,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
    participant_token: str | None = Header(default=None, alias=PARTICIPANT_TOKEN_HEADER),
):
    """CRS-11: Participant submits ranked theme order after poll closes.

    Who votes (HP-07): the join-issued X-Participant-Token names the participant, so an
    anonymous joiner can vote with no Auth0 login; otherwise an Auth0 JWT whose user owns a
    participant row in this session. A token that does not verify is refused (403) — it never
    falls back to another identity. One ballot per participant: a re-vote in the open cycle
    replaces that participant's ballot (allow_revote), it never adds a second one.

    Validates theme IDs against session's theme2_voting_level.
    """
    from app.models.participant import Participant
    from app.models.session import Session
    from sqlalchemy import select, and_

    # Fetch session for voting level
    sess_result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status not in ("ranking", "polling"):
        raise HTTPException(
            status_code=400,
            detail=f"Session is in '{session.status}' — ranking not open",
        )

    # Resolve the voter: the participant token first, else the authenticated user's row.
    if participant_token:
        token_pid = verify_participant_token(session_id, participant_token)
        if token_pid is None:
            raise HTTPException(status_code=403, detail="Invalid participant token")
        voter = Participant.id == token_pid
    elif user is not None:
        voter = Participant.user_id == user.user_id
    else:
        raise HTTPException(status_code=401, detail="Join the session (participant token) or log in to vote")
    part_result = await db.execute(
        select(Participant).where(and_(Participant.session_id == session_id, voter))
    )
    participant = part_result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant in this session")

    method = getattr(session, "ranking_method", None)
    method = method if isinstance(method, str) else None
    if method == "top3_points" or payload.category_ballots:
        # P1: original-design Round 2 ballot — top 1–3 per category, 3/2/1 points.
        if method != "top3_points":
            raise HTTPException(status_code=400, detail="This session ranks the full theme list; send ranked_theme_ids")
        if not payload.category_ballots:
            raise HTTPException(status_code=400, detail="This session uses top-3 per category; send category_ballots")
        from app.cubes.cube7_ranking.ranking_submission import submit_top3_ballot

        try:
            ranking = await submit_top3_ballot(
                db,
                session_id=session_id,
                participant_id=participant.id,
                category_ballots={k: list(v) for k, v in payload.category_ballots.items()},
                cycle_id=getattr(session, "current_cycle", 1) or 1,
                theme2_voting_level=getattr(session, "theme2_voting_level", "theme2_9") or "theme2_9",
                session_short_code=session.short_code,
                theme01_category=getattr(session, "theme01_category", None),
                allow_revote=True,
                session=session,
            )
            await db.commit()
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        if session.status == "ranking":
            from app.cubes.cube7_ranking.ranking_submission import schedule_live_aggregation

            schedule_live_aggregation(session_id, session.short_code, getattr(session, "current_cycle", 1) or 1)
        stored = ranking.ranked_theme_ids if isinstance(ranking.ranked_theme_ids, dict) else {}
        return RankingRead(
            id=ranking.id, session_id=ranking.session_id, cycle_id=ranking.cycle_id,
            participant_id=ranking.participant_id, ranked_theme_ids=list(stored.get("ranked_theme_ids") or []),
            category_ballots=stored.get("category_ballots"), submitted_at=ranking.submitted_at,
        )

    try:
        ranking = await service.submit_user_ranking(
            db,
            session_id=session_id,
            participant_id=participant.id,
            ranked_theme_ids=payload.ranked_theme_ids,
            # LIVING VOTE: bind to the session's current cycle (not a hardcoded 1) and allow a
            # participant to adjust their ballot while the cycle is open (status gate above).
            cycle_id=getattr(session, "current_cycle", 1) or 1,
            theme2_voting_level=getattr(session, "theme2_voting_level", "theme2_3"),
            session_short_code=session.short_code,
            theme01_category=getattr(session, "theme01_category", None),
            allow_revote=True,
        )
        await db.commit()
        # G3: live prioritization — while the ranking round is open, every ballot schedules a debounced live tally
        # (one per 2 s window per session+cycle) so the group ranking updates as votes arrive.
        if session.status == "ranking":
            from app.cubes.cube7_ranking.ranking_submission import schedule_live_aggregation

            schedule_live_aggregation(session_id, session.short_code, getattr(session, "current_cycle", 1) or 1)
        return ranking
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# CRS-16/17: Get Live Rankings
# ---------------------------------------------------------------------------


@router.get("/rankings", response_model=list[AggregatedRankingRead])
async def get_rankings(
    session_id: uuid.UUID,
    cycle_id: int | None = None,
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-16: Get current aggregated rankings for live display."""
    # WireGuard: whitelist sort_order
    if sort_order not in VALID_SORT_ORDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort_order '{sort_order}'. Must be one of: {sorted(VALID_SORT_ORDERS)}",
        )
    cycle_id = await _resolve_cycle(db, session_id, cycle_id)
    rankings = await service.get_live_rankings(db, session_id, cycle_id)
    validated = [AggregatedRankingRead.model_validate(r) for r in rankings]
    if sort_order == "asc":
        validated.reverse()
    return validated


# ---------------------------------------------------------------------------
# CRS-12: Trigger Aggregation (Moderator)
# ---------------------------------------------------------------------------


@router.post("/rankings/aggregate", status_code=200)
@limiter.limit("10/minute")  # each aggregate starts a CQS run; repeated taps coalesce, but stay bounded (Thor, r15)
async def trigger_aggregation(
    request: Request,
    session_id: uuid.UUID,
    seed: str | None = None,
    ranking_method: str | None = Query(
        None,
        description="Ranking algorithm: 'borda_count', 'quadratic_borda' or 'top3_points'. Omitted = the session's "
        "ranking_method (NULL = borda_count, the previous default).",
    ),
    body: AggregateRequest | None = Body(None),
    live: bool = Query(False, description="True = in-round live tally (is_final=false; no webhook/CQS). Default final."),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin")),
):
    """CRS-12: Moderator triggers deterministic ranking aggregation.

    Computes Borda count, identifies top theme, detects anomalies,
    broadcasts ranking_complete, and triggers CQS scoring pipeline.
    `ranking_method=quadratic_borda` weights each ballot by sqrt(stake) (CRS-12.02) and needs
    `participant_stakes` in the body; without stakes it is refused, never silently run as borda_count.
    """
    # WireGuard: whitelist ranking_method
    if ranking_method is not None and ranking_method not in VALID_RANKING_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ranking_method '{ranking_method}'. Must be one of: {sorted(VALID_RANKING_METHODS)}",
        )
    stakes = {str(k): v for k, v in (body.participant_stakes or {}).items()} if body else {}
    if ranking_method == "quadratic_borda" and not stakes:
        raise HTTPException(
            status_code=400,
            detail="quadratic_borda needs participant_stakes (weight = sqrt(stake)); none were supplied.",
        )
    from app.models.session import Session
    from sqlalchemy import select

    sess_result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    # P1: the ballots' shape follows the session's method, so the tally must too.
    session_method = getattr(session, "ranking_method", None)
    session_method = session_method if isinstance(session_method, str) else "borda_count"
    if (ranking_method == "top3_points") != (session_method == "top3_points") and ranking_method is not None:
        raise HTTPException(
            status_code=400,
            detail=f"Session ranking_method is '{session_method}'; its ballots cannot be tallied as '{ranking_method}'.",
        )
    if ranking_method is None:
        ranking_method = session_method

    try:
        result = await service.run_ranking_pipeline(
            db,
            session_id=session_id,
            session_short_code=session.short_code,
            seed=seed or session.seed,
            cycle_id=int(getattr(session, "current_cycle", 1) or 1),
            participant_stakes=stakes if ranking_method == "quadratic_borda" else None,
            live=live,
            ranking_method="top3_points" if ranking_method == "top3_points" else None,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# CRS-12.04: Anomaly Detection
# ---------------------------------------------------------------------------


@router.get("/rankings/anomalies")
async def get_anomalies(
    session_id: uuid.UUID,
    cycle_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", "lead", leads_read=True)),
):
    """CRS-12.04: Check for voting anomalies (moderator/lead only)."""
    cycle_id = await _resolve_cycle(db, session_id, cycle_id)  # default = the current cycle (Thoth, round 6)
    anomalies = await service.detect_voting_anomalies(db, session_id, cycle_id)
    return {"session_id": str(session_id), "anomalies": anomalies}


@router.get("/rankings/metrics")
async def get_ranking_metrics(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", "lead", leads_read=True)),
):
    """Q4: Cube 7 SSSES metrics (System/User/Outcome) — R-Core parity with cubes 1/2/3.

    The metrics engine (cube7_ranking.metrics) existed but was library-only; this
    exposes it so the Dev-Sim / qualification gateway can read Cube 7's live baseline.
    Privileged-role only (aggregate session data). DB-error-guarded downstream.
    """
    from app.cubes.cube7_ranking import metrics as ranking_metrics

    # One cycle — the current one (Thoth, round 7).
    return await ranking_metrics.get_all_metrics(db, session_id, await _resolve_cycle(db, session_id, None))


@router.get("/rankings/readiness")
async def get_ranking_readiness(
    session_id: uuid.UUID,
    cycle_id: int | None = None,
    simulation_passed: bool = False,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", "lead", leads_read=True)),
):
    """Q3: Cube 7 R-Core readiness profile — the qualification gateway's answer object.

    Gathers the REAL session signals (SSSES metrics triad, confidence, consensus,
    replay-verified, human-authority, simulation, risk) and folds them into the pure
    `compute_readiness`, answering why-scored / evidence / risks / weak-pillars /
    highest-impact-next-move / ready-to-advance. Privileged-role only. Each gather is
    guarded so a missing source degrades the profile rather than 500-ing.
    """
    cycle_id = await _resolve_cycle(db, session_id, cycle_id)  # default = the current cycle (Thoth, round 6)
    from app.cubes.cube7_ranking.readiness import readiness_profile

    return await readiness_profile(
        db, session_id, cycle_id=cycle_id, simulation_passed=simulation_passed,
    )


# ---------------------------------------------------------------------------
# CRS-22: Governance Override (MVP3 — stub)
# ---------------------------------------------------------------------------


@router.get("/rankings/scale-info")
async def get_scale_info(
    session_id: uuid.UUID,
    cycle_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", leads_read=True)),
):
    """Scale engine info: voter count, recommended path, shard count."""
    cycle_id = await _resolve_cycle(db, session_id, cycle_id)  # default = the current cycle (Thoth, round 6)
    from app.cubes.cube7_ranking.scale_engine import AutoThemingBudget
    from app.models.ranking import Ranking
    from sqlalchemy import func, select as sa_select

    count_result = await db.execute(
        sa_select(func.count()).select_from(Ranking).where(
            Ranking.session_id == session_id, Ranking.cycle_id == cycle_id
        )
    )
    voter_count = count_result.scalar() or 0

    budget = AutoThemingBudget()
    return {
        "session_id": str(session_id),
        "voter_count": voter_count,
        "recommended_path": "scale" if voter_count > 1000 else "standard",
        "scale_threshold": 1000,
        "budget": budget.to_dict(),
        "shard_count": 100 if voter_count > 1000 else 1,
    }


@router.get("/rankings/emerging")
async def get_emerging(
    session_id: uuid.UUID,
    cycle_id: int | None = None,
    theme_level: str = Query("3", description="Theme level: '3', '6', or '9'"),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", leads_read=True)),
):
    """CRS-16.01: Emerging ranking patterns (moderator live view)."""
    cycle_id = await _resolve_cycle(db, session_id, cycle_id)  # default = the current cycle (Thoth, round 6)
    # WireGuard: whitelist theme_level
    if theme_level not in VALID_THEME_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid theme_level '{theme_level}'. Must be one of: {sorted(VALID_THEME_LEVELS)}",
        )
    return await service.get_emerging_patterns(db, session_id, cycle_id)


@router.get("/rankings/personal")
async def get_personal_rank(
    session_id: uuid.UUID,
    cycle_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-17.01: Compare your ranking with group consensus."""
    cycle_id = await _resolve_cycle(db, session_id, cycle_id)  # default = the current cycle (Thoth, round 6)
    from app.models.participant import Participant
    from sqlalchemy import select as sa_select, and_ as sa_and

    part_result = await db.execute(
        sa_select(Participant).where(
            sa_and(
                Participant.session_id == session_id,
                Participant.user_id == user.user_id,
            )
        )
    )
    participant = part_result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")

    return await service.get_personal_vs_group_rank(
        db, session_id, participant.id, cycle_id
    )


@router.get("/rankings/verify")
async def verify_ranking_replay(
    session_id: uuid.UUID,
    cycle_id: int | None = None,
    seed: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-13.03: Re-run aggregation and verify replay hash match."""
    cycle_id = await _resolve_cycle(db, session_id, cycle_id)  # default = the current cycle (Thoth, round 6)
    return await service.verify_replay(db, session_id, cycle_id, seed)


@router.get("/rankings/progress")
async def get_progress(
    session_id: uuid.UUID,
    cycle_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", leads_read=True)),
):
    """CRS-16: Get ranking submission progress (moderator only). Defaults to the open cycle."""
    cycle_id = await _resolve_cycle(db, session_id, cycle_id)
    return await service.get_ranking_progress(db, session_id, cycle_id)


# ---------------------------------------------------------------------------
# CRS-22: Governance Override
# ---------------------------------------------------------------------------


@router.post("/override", response_model=GovernanceOverrideRead, status_code=201)
async def override_ranking(
    session_id: uuid.UUID,
    payload: GovernanceOverrideSubmit,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("lead", "admin")),
):
    """CRS-22: Lead/Developer overrides rankings with justification.

    Requires mandatory justification (min 10 chars). Creates immutable audit entry.
    Shifts other themes' rank_positions to accommodate the override.
    """
    from app.models.session import Session
    from sqlalchemy import select

    sess_result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        override = await service.apply_governance_override(
            db,
            session_id=session_id,
            theme_id=payload.theme_id,
            new_rank=payload.new_rank,
            overridden_by=user.user_id,
            justification=payload.justification,
            cycle_id=int(getattr(session, "current_cycle", 1) or 1),  # the open cycle, as /rankings/aggregate (round 7)
            session_short_code=session.short_code,
        )
        await db.commit()
        return override
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/overrides", response_model=list[GovernanceOverrideRead])
async def get_overrides(
    session_id: uuid.UUID,
    cycle_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", "lead", leads_read=True)),
):
    """CRS-22: Get governance override audit trail."""
    cycle_id = await _resolve_cycle(db, session_id, cycle_id)  # default = the current cycle (Thoth, round 6)
    overrides = await service.get_governance_overrides(db, session_id, cycle_id)
    return [GovernanceOverrideRead.model_validate(o) for o in overrides]


# ---------------------------------------------------------------------------
# S4 / CRS-22.04: participant-readable live snapshot + moderator final decision (transparency)
# ---------------------------------------------------------------------------


async def _session_or_404(db: AsyncSession, session_id: uuid.UUID):
    from app.models.session import Session
    from sqlalchemy import select

    session = (await db.execute(select(Session).where(Session.id == session_id))).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/rankings/live")
@limiter.limit("120/minute")
async def get_live_ranking_snapshot(
    request: Request,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
    participant_token: str | None = Header(default=None, alias=PARTICIPANT_TOKEN_HEADER),
):
    """The group's current ranking (per category), the overall #1, counts and the moderator's decision.

    Readable by a participant of THIS session (X-Participant-Token from join — no login) or a signed-in user, the
    same audience as GET /rankings. Carries theme labels, scores and counts only — never ballots or participant ids.
    """
    if participant_token:
        if verify_participant_token(session_id, participant_token) is None:
            raise HTTPException(status_code=403, detail="Invalid participant token")
    elif user is None:
        raise HTTPException(status_code=401, detail="Join the session (participant token) or log in")
    from app.cubes.cube7_ranking.live_ranking import live_snapshot

    return await live_snapshot(db, await _session_or_404(db, session_id))


@router.post("/rankings/decision")
@limiter.limit("20/minute")
async def post_final_decision(
    request: Request,
    session_id: uuid.UUID,
    payload: FinalDecisionSubmit,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin")),
):
    """CRS-22.04: the moderator's final decision. A pick other than the group's #1 needs a reason (≥10 chars); the
    group's #1 and the reason are stored and broadcast as `final_decision` so every participant sees both."""
    from app.core.supabase_broadcast import broadcast_event
    from app.cubes.cube7_ranking.live_ranking import record_final_decision

    session = await _session_or_404(db, session_id)
    try:
        snap = await record_final_decision(db, session, payload.theme_id, payload.reason)
        await db.commit()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    await broadcast_event(channel=f"session:{session.short_code}", event="final_decision", payload=snap)
    return snap


# ---------------------------------------------------------------------------
# CRS-36 Round 1 — variable auto-select (top Theme02 slice → Round 2 ballot)
# ---------------------------------------------------------------------------


@router.get("/rankings/auto-select")
@limiter.limit("60/minute")
async def get_auto_select(
    request: Request,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
    participant_token: str | None = Header(default=None, alias=PARTICIPANT_TOKEN_HEADER),
):
    """CRS-36: the Round 1 shortlist (config + selected theme ids per Theme01 category).

    Readable by a participant of THIS session or a signed-in user — same audience as live ranking.
    """
    if participant_token:
        if verify_participant_token(session_id, participant_token) is None:
            raise HTTPException(status_code=403, detail="Invalid participant token")
    elif user is None:
        raise HTTPException(status_code=401, detail="Join the session (participant token) or log in")
    session = await _session_or_404(db, session_id)
    selected = getattr(session, "auto_select_theme_ids", None) or {}
    return {
        "percent": getattr(session, "auto_select_percent", None),
        "n": getattr(session, "auto_select_n", None),
        "selected": selected,
        "theme_level": (getattr(session, "theme2_voting_level", None) or "theme2_9").replace("theme2_", ""),
        "cycle_id": getattr(session, "current_cycle", 1) or 1,
        "active": bool(selected) or (
            getattr(session, "auto_select_percent", None) is not None
            or getattr(session, "auto_select_n", None) is not None
        ),
    }


@router.post("/rankings/auto-select")
@limiter.limit("20/minute")
async def post_auto_select(
    request: Request,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin")),
    percent: float | None = None,
    n: int | None = None,
):
    """CRS-36: moderator sets percent and/or N, then computes the shortlist from the live ranking.

    Query/body-less: optional `percent` and `n` query params update the session config first.
    When both are omitted, the existing session config is used. Returns the computed set.
    """
    from app.core.supabase_broadcast import broadcast_event
    from app.cubes.cube7_ranking.auto_select import compute_auto_select_set, validate_auto_select_config

    session = await _session_or_404(db, session_id)
    try:
        if percent is not None or n is not None:
            validate_auto_select_config(percent, n)
            if percent is not None:
                session.auto_select_percent = percent
            if n is not None:
                session.auto_select_n = n
        elif getattr(session, "auto_select_percent", None) is None and getattr(session, "auto_select_n", None) is None:
            raise ValueError("Set auto_select_percent and/or auto_select_n before computing Round 1")
        payload = await compute_auto_select_set(db, session, persist=True)
        await db.commit()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    await broadcast_event(channel=f"session:{session.short_code}", event="auto_select", payload=payload)
    return payload


# ---------------------------------------------------------------------------
# CRS-38 Round 3 — Expert Opinion (moderator invites; experts submit; participants read)
# ---------------------------------------------------------------------------


@router.post("/experts")
@limiter.limit("30/minute")
async def post_invite_expert(
    request: Request,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin")),
    display_name: str = "",
    expert_user_id: str | None = None,
    expert_participant_id: uuid.UUID | None = None,
    theme_id: uuid.UUID | None = None,
):
    """CRS-38.03: moderator designates an expert for this poll (and optionally a theme)."""
    from app.cubes.cube7_ranking.expert_opinion import invite_expert

    body = {}
    try:
        body = await request.json()
    except Exception:
        body = {}
    display_name = (body.get("display_name") or display_name or "").strip()
    expert_user_id = body.get("expert_user_id", expert_user_id)
    raw_pid = body.get("expert_participant_id", expert_participant_id)
    expert_participant_id = uuid.UUID(str(raw_pid)) if raw_pid else None
    raw_tid = body.get("theme_id", theme_id)
    theme_id = uuid.UUID(str(raw_tid)) if raw_tid else None
    try:
        row = await invite_expert(
            db, session_id,
            invited_by=user.user_id,
            display_name=display_name,
            expert_user_id=expert_user_id,
            expert_participant_id=expert_participant_id,
            theme_id=theme_id,
        )
        await db.commit()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "id": str(row.id), "session_id": str(row.session_id), "display_name": row.display_name,
        "status": row.status, "theme_id": str(row.theme_id) if row.theme_id else None,
    }


@router.get("/experts")
@limiter.limit("60/minute")
async def get_experts(
    request: Request,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
    participant_token: str | None = Header(default=None, alias=PARTICIPANT_TOKEN_HEADER),
):
    """List expert assignments for the session (participants + signed-in)."""
    if participant_token:
        if verify_participant_token(session_id, participant_token) is None:
            raise HTTPException(status_code=403, detail="Invalid participant token")
    elif user is None:
        raise HTTPException(status_code=401, detail="Join the session (participant token) or log in")
    from app.cubes.cube7_ranking.expert_opinion import list_assignments

    rows = await list_assignments(db, session_id)
    return [
        {
            "id": str(a.id), "display_name": a.display_name, "status": a.status,
            "theme_id": str(a.theme_id) if a.theme_id else None,
            "invited_at": a.invited_at.isoformat() if a.invited_at else None,
        }
        for a in rows
    ]


@router.post("/experts/{assignment_id}/opinions")
@limiter.limit("30/minute")
async def post_expert_opinion(
    request: Request,
    session_id: uuid.UUID,
    assignment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """CRS-38.01: expert submits Supporting / Risk & Concerns / Neutral summaries for a theme."""
    from app.cubes.cube7_ranking.expert_opinion import build_pager_if_ready, submit_expert_opinion

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="JSON body required")
    theme_id = body.get("theme_id")
    if not theme_id:
        raise HTTPException(status_code=400, detail="theme_id is required")
    submitted_by = (user.user_id if user else None) or body.get("submitted_by") or "expert"
    try:
        opinion = await submit_expert_opinion(
            db,
            session_id=session_id,
            theme_id=uuid.UUID(str(theme_id)),
            assignment_id=assignment_id,
            submitted_by=str(submitted_by),
            support_summary=str(body.get("support_summary") or ""),
            risk_summary=str(body.get("risk_summary") or ""),
            neutral_summary=str(body.get("neutral_summary") or ""),
        )
        pager = await build_pager_if_ready(db, session_id, uuid.UUID(str(theme_id)), use_simulated=True)
        await db.commit()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "opinion_id": str(opinion.id),
        "pager_ready": bool(pager.ready) if pager else False,
    }


@router.get("/themes/{theme_id}/expert-opinion")
@limiter.limit("60/minute")
async def get_theme_expert_opinion(
    request: Request,
    session_id: uuid.UUID,
    theme_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
    participant_token: str | None = Header(default=None, alias=PARTICIPANT_TOKEN_HEADER),
):
    """CRS-38: show expert packets + ready 1-pager to participants. Pager text is Pay-to-View Detail 3
    (CRS-39.01) — withheld unless view_entitlement.original (existing payment path)."""
    if participant_token:
        if verify_participant_token(session_id, participant_token) is None:
            raise HTTPException(status_code=403, detail="Invalid participant token")
    elif user is None:
        raise HTTPException(status_code=401, detail="Join the session (participant token) or log in")
    from app.cubes.cube7_ranking.expert_opinion import theme_expert_bundle
    from app.cubes.cube8_tokens.view_entitlement import resolve_view_entitlement

    session = await _session_or_404(db, session_id)
    bundle = await theme_expert_bundle(db, session_id, theme_id)
    entitlement = await resolve_view_entitlement(db, session, user)
    # CRS-39.01 Detail map via existing entitlement: Detail1=111(free), Detail2=333, Detail3=Original+expert pager
    detail_map = {
        "detail_1": True,  # 111-word depth — free in drawer
        "detail_2": bool(entitlement.get("summary_333")),
        "detail_3": bool(entitlement.get("original")),
        "map": {"detail_1": "summary_111", "detail_2": "summary_333", "detail_3": "original+expert_pager"},
    }
    if not detail_map["detail_3"] and bundle.get("pager"):
        bundle["pager"]["pager_text"] = None  # withhold until paid (existing entitlement path)
        bundle["pager"]["locked"] = True
    else:
        if bundle.get("pager"):
            bundle["pager"]["locked"] = False
    bundle["pay_to_view"] = detail_map
    bundle["view_entitlement"] = {
        "summary_333": entitlement.get("summary_333"),
        "original": entitlement.get("original"),
        "viewer": entitlement.get("viewer"),
        "basis": entitlement.get("basis"),
    }
    return bundle
