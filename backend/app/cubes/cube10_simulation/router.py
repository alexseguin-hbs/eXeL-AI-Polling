"""Cube 10 — Simulation Engine Router.

Endpoints:
  POST /feedback               — Submit feedback from any screen
  GET  /feedback                — List feedback (admin)
  GET  /feedback/stats          — Aggregate stats (admin)
  POST /submissions             — Submit code improvement
  GET  /submissions/{id}/test   — Run sandbox tests
  GET  /submissions/{id}/metrics — Compare metrics vs baseline
  POST /submissions/{id}/vote   — Cast vote on submission
  GET  /submissions/{id}/tally  — Get vote tally
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube10_simulation import service

router = APIRouter(tags=["Cube 10 — Simulation"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class FeedbackSubmit(BaseModel):
    cube_id: int
    text: str
    crs_id: str | None = None
    sub_crs_id: str | None = None
    feedback_type: str = "CRS"


class SubmissionCreate(BaseModel):
    cube_id: int
    function_name: str
    submitter_type: str = "human"
    code_diff: str


# ---------------------------------------------------------------------------
# Feedback Endpoints
# ---------------------------------------------------------------------------


@router.post("/feedback", status_code=201)
async def submit_feedback(
    payload: FeedbackSubmit,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Submit feedback from any screen. Auto-categorized by cube + CRS."""
    return await service.submit_feedback(
        db,
        cube_id=payload.cube_id,
        text=payload.text,
        submitted_by=user.user_id,
        crs_id=payload.crs_id,
        sub_crs_id=payload.sub_crs_id,
        feedback_type=payload.feedback_type,
    )


@router.get("/feedback/stats")
async def get_feedback_stats(
    cube_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin")),
):
    """Aggregate feedback statistics for admin triage."""
    return await service.get_feedback_stats(db, cube_id)


# ---------------------------------------------------------------------------
# Submission Endpoints
# ---------------------------------------------------------------------------


@router.post("/submissions", status_code=201)
async def create_submission(
    payload: SubmissionCreate,
    user: CurrentUser = Depends(get_current_user),
):
    """Submit code improvement for a cube function."""
    try:
        return await service.create_submission(
            cube_id=payload.cube_id,
            function_name=payload.function_name,
            submitter_id=user.user_id,
            submitter_type=payload.submitter_type,
            code_diff=payload.code_diff,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/submissions/{submission_id}/test")
async def run_tests(
    submission_id: str,
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Run sandbox tests against a submission."""
    return await service.run_sandbox_tests(submission_id, cube_id=0)


@router.get("/submissions/{submission_id}/tally")
async def get_tally(
    submission_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Get current vote tally for a submission."""
    # Stub — will query submission_votes table
    return service.tally_votes([], total_token_holders=0)


# ---------------------------------------------------------------------------
# Saved Use Cases (Top 3 + DEMO)
# ---------------------------------------------------------------------------


@router.get("/saved-cases")
async def list_saved_cases(
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """List all saved use cases (top 3 largest + DEMO)."""
    from app.cubes.cube10_simulation.saved_use_cases import SavedUseCaseManager
    mgr = SavedUseCaseManager()
    return mgr.to_dict()


@router.get("/saved-cases/{case_id}/replay")
async def replay_case(
    case_id: str,
    cube_id: int = 0,
    function_name: str = "",
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Run simulation replay against a saved dataset."""
    from app.cubes.cube10_simulation.saved_use_cases import (
        SavedUseCaseManager, replay_against_dataset,
    )
    mgr = SavedUseCaseManager()
    case = mgr.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Saved case not found")
    return await replay_against_dataset(case, cube_id, function_name)
