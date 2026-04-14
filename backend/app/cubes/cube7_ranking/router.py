"""Cube 7 — Prioritization & Voting: Ranking UI backend, aggregation.

Endpoints:
  POST /rankings          — Submit participant ranking (CRS-11)
  GET  /rankings          — Get live aggregated rankings (CRS-16/17)
  POST /rankings/aggregate — Trigger aggregation pipeline (CRS-12, moderator)
  GET  /rankings/anomalies — Check voting anomalies (CRS-12.04, moderator)
  POST /override          — Governance override (CRS-22, MVP3)
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# WireGuard-style whitelist constants — reject anything not in the set
# ---------------------------------------------------------------------------
VALID_THEME_LEVELS = {"3", "6", "9"}
VALID_SORT_ORDERS = {"asc", "desc"}
VALID_RANKING_METHODS = {"borda_count", "quadratic_borda"}

from app.core.auth import CurrentUser, get_current_user, get_optional_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube7_ranking import service
from app.schemas.ranking import (
    AggregatedRankingRead,
    GovernanceOverrideRead,
    GovernanceOverrideSubmit,
    RankingRead,
    RankingSubmit,
)

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 7 — Ranking"])


# ---------------------------------------------------------------------------
# CRS-11: Submit Ranking
# ---------------------------------------------------------------------------


@router.post("/rankings", response_model=RankingRead, status_code=201)
async def submit_ranking(
    session_id: uuid.UUID,
    payload: RankingSubmit,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-11: Participant submits ranked theme order after poll closes.

    Validates theme IDs against session's theme2_voting_level.
    Rejects duplicate submissions for same (session, cycle, participant).
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

    # Resolve participant_id from user
    part_result = await db.execute(
        select(Participant).where(
            and_(
                Participant.session_id == session_id,
                Participant.user_id == user.user_id,
            )
        )
    )
    participant = part_result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant in this session")

    try:
        ranking = await service.submit_user_ranking(
            db,
            session_id=session_id,
            participant_id=participant.id,
            ranked_theme_ids=payload.ranked_theme_ids,
            theme2_voting_level=getattr(session, "theme2_voting_level", "theme2_3"),
            session_short_code=session.short_code,
        )
        await db.commit()
        return ranking
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# CRS-16/17: Get Live Rankings
# ---------------------------------------------------------------------------


@router.get("/rankings", response_model=list[AggregatedRankingRead])
async def get_rankings(
    session_id: uuid.UUID,
    cycle_id: int = 1,
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
    rankings = await service.get_live_rankings(db, session_id, cycle_id)
    validated = [AggregatedRankingRead.model_validate(r) for r in rankings]
    if sort_order == "asc":
        validated.reverse()
    return validated


# ---------------------------------------------------------------------------
# CRS-12: Trigger Aggregation (Moderator)
# ---------------------------------------------------------------------------


@router.post("/rankings/aggregate", status_code=200)
async def trigger_aggregation(
    session_id: uuid.UUID,
    seed: str | None = None,
    ranking_method: str = Query("borda_count", description="Ranking algorithm: 'borda_count' or 'quadratic_borda'"),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-12: Moderator triggers deterministic ranking aggregation.

    Computes Borda count, identifies top theme, detects anomalies,
    broadcasts ranking_complete, and triggers CQS scoring pipeline.
    """
    # WireGuard: whitelist ranking_method
    if ranking_method not in VALID_RANKING_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ranking_method '{ranking_method}'. Must be one of: {sorted(VALID_RANKING_METHODS)}",
        )
    from app.models.session import Session
    from sqlalchemy import select

    sess_result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        result = await service.run_ranking_pipeline(
            db,
            session_id=session_id,
            session_short_code=session.short_code,
            seed=seed or session.seed,
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
    cycle_id: int = 1,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin", "lead")),
):
    """CRS-12.04: Check for voting anomalies (moderator/lead only)."""
    anomalies = await service.detect_voting_anomalies(db, session_id, cycle_id)
    return {"session_id": str(session_id), "anomalies": anomalies}


# ---------------------------------------------------------------------------
# CRS-22: Governance Override (MVP3 — stub)
# ---------------------------------------------------------------------------


@router.get("/rankings/scale-info")
async def get_scale_info(
    session_id: uuid.UUID,
    cycle_id: int = 1,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Scale engine info: voter count, recommended path, shard count."""
    from app.cubes.cube7_ranking.scale_engine import AutoThemingBudget
    from app.models.ranking import Ranking
    from sqlalchemy import func, select as sa_select

    count_result = await db.execute(
        sa_select(func.count()).select_from(Ranking).where(
            Ranking.session_id == session_id
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
    cycle_id: int = 1,
    theme_level: str = Query("3", description="Theme level: '3', '6', or '9'"),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-16.01: Emerging ranking patterns (moderator live view)."""
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
    cycle_id: int = 1,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-17.01: Compare your ranking with group consensus."""
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
    cycle_id: int = 1,
    seed: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-13.03: Re-run aggregation and verify replay hash match."""
    return await service.verify_replay(db, session_id, cycle_id, seed)


@router.get("/rankings/progress")
async def get_progress(
    session_id: uuid.UUID,
    cycle_id: int = 1,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-16: Get ranking submission progress (moderator only)."""
    return await service.get_ranking_progress(db, session_id, cycle_id)


# ---------------------------------------------------------------------------
# CRS-22: Governance Override
# ---------------------------------------------------------------------------


@router.post("/override", response_model=GovernanceOverrideRead, status_code=201)
async def override_ranking(
    session_id: uuid.UUID,
    payload: GovernanceOverrideSubmit,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("lead", "admin")),
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
            session_short_code=session.short_code,
        )
        await db.commit()
        return override
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/overrides", response_model=list[GovernanceOverrideRead])
async def get_overrides(
    session_id: uuid.UUID,
    cycle_id: int = 1,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin", "lead")),
):
    """CRS-22: Get governance override audit trail."""
    overrides = await service.get_governance_overrides(db, session_id, cycle_id)
    return [GovernanceOverrideRead.model_validate(o) for o in overrides]
