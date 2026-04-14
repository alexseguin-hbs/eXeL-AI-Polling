"""Cube 11 — Blockchain (Quai/QI): API Router.

4 endpoints for on-chain governance proofs:
  POST /chain/record-survey    — Record survey proof (admin, auto after ranking)
  GET  /chain/verify/{hash}    — Verify survey proof (public, no auth)
  GET  /chain/pending          — List pending chain submissions (admin)
  POST /chain/retry-pending    — Retry failed submissions (admin)

CRS: CRS-23 (Audit trail)
Data flow: Cube 9 → Cube 10 → Cube 11
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube11_blockchain import service

router = APIRouter(prefix="/chain", tags=["Cube 11 — Blockchain (Quai/QI)"])


class RecordSurveyRequest(BaseModel):
    session_hash: str
    cube6_theme_hash: str
    cube7_ranking_hash: str
    cube9_export_hash: str
    cube1_session_hash: str
    winning_theme: str
    voter_count: int
    response_count: int


@router.post("/record-survey", status_code=201)
async def record_survey(
    payload: RecordSurveyRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-23: Record survey governance proof for on-chain submission.

    Called automatically after Cube 7 ranking completes, or manually by admin.
    Computes 4-hash governance proof and stores for Quai chain submission.
    """
    result = await service.record_survey_on_chain(
        db,
        session_hash=payload.session_hash,
        cube6_theme_hash=payload.cube6_theme_hash,
        cube7_ranking_hash=payload.cube7_ranking_hash,
        cube9_export_hash=payload.cube9_export_hash,
        cube1_session_hash=payload.cube1_session_hash,
        winning_theme=payload.winning_theme,
        voter_count=payload.voter_count,
        response_count=payload.response_count,
    )
    await db.commit()
    return result


@router.get("/verify/{session_hash}")
async def verify_survey(
    session_hash: str,
    db: AsyncSession = Depends(get_db),
):
    """CRS-23: Verify survey governance proof. Public — no auth required.

    Anyone can check if a survey was recorded with a valid governance proof.
    """
    return await service.verify_survey(db, session_hash)


@router.get("/pending")
async def list_pending(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin")),
):
    """List surveys pending Quai chain submission. Admin only."""
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=400, detail="limit must be 1-200")
    return await service.get_pending_records(db, limit=limit)


@router.post("/retry-pending")
async def retry_pending(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin")),
):
    """Retry all pending/failed Quai chain submissions. Admin only."""
    return await service.retry_pending(db)
