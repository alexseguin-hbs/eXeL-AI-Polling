"""Cube 10 — Simulation Engine Router.

Endpoints:
  POST /feedback               — Submit feedback from any screen
  GET  /feedback/stats          — Aggregate stats (admin)
  POST /submissions             — Submit code improvement
  GET  /submissions/{id}/test   — Run sandbox tests
  GET  /submissions/{id}/tally  — Get vote tally
  POST /verify-access           — Cube 10 access code verification
  POST /challenges              — Create challenge (admin)
  POST /challenges/{id}/claim   — Claim challenge
  POST /challenges/{id}/submit  — Submit challenge code
  GET  /saved-cases             — List saved use cases
  GET  /saved-cases/{id}/replay — Replay against dataset
"""

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube10_simulation import service

router = APIRouter(tags=["Cube 10 — Simulation"])

# ---------------------------------------------------------------------------
# WireGuard-style whitelists — reject everything not explicitly allowed
# ---------------------------------------------------------------------------

ALLOWED_FEEDBACK_TYPES = {"CRS", "DI"}
ALLOWED_CUBE_IDS = set(range(1, 13))  # 1-12 (includes Cube 11 Blockchain + Cube 12 Divinity/NFT)
ALLOWED_SUBMITTER_TYPES = {"human", "ai"}
ALLOWED_ACCESS_TYPES = {"admin", "challenger"}
ALLOWED_CHALLENGE_STATUSES = {"open", "claimed", "submitted", "completed", "closed"}
ALLOWED_SENTIMENTS = {"positive", "neutral", "negative"}
CRS_ID_PATTERN = re.compile(r"^CRS-\d{2}$")
SUB_CRS_ID_PATTERN = re.compile(r"^CRS-\d{2}\.\d{2}$")


# ---------------------------------------------------------------------------
# Schemas (with WireGuard whitelist validation)
# ---------------------------------------------------------------------------


class FeedbackSubmit(BaseModel):
    cube_id: int
    text: str
    crs_id: str | None = None
    sub_crs_id: str | None = None
    feedback_type: str = "CRS"

    @field_validator("feedback_type")
    @classmethod
    def validate_feedback_type(cls, v: str) -> str:
        if v not in ALLOWED_FEEDBACK_TYPES:
            raise ValueError(
                f"feedback_type must be one of {sorted(ALLOWED_FEEDBACK_TYPES)}, got '{v}'"
            )
        return v

    @field_validator("cube_id")
    @classmethod
    def validate_cube_id(cls, v: int) -> int:
        if v not in ALLOWED_CUBE_IDS:
            raise ValueError(
                f"cube_id must be 1-12, got {v}"
            )
        return v

    @field_validator("crs_id")
    @classmethod
    def validate_crs_id(cls, v: str | None) -> str | None:
        if v is not None and not CRS_ID_PATTERN.match(v):
            raise ValueError(
                f"crs_id must match pattern CRS-## (e.g. CRS-01), got '{v}'"
            )
        return v

    @field_validator("sub_crs_id")
    @classmethod
    def validate_sub_crs_id(cls, v: str | None) -> str | None:
        if v is not None and not SUB_CRS_ID_PATTERN.match(v):
            raise ValueError(
                f"sub_crs_id must match pattern CRS-##.## (e.g. CRS-01.02), got '{v}'"
            )
        return v


class SubmissionCreate(BaseModel):
    cube_id: int
    function_name: str
    submitter_type: str = "human"
    code_diff: str

    @field_validator("submitter_type")
    @classmethod
    def validate_submitter_type(cls, v: str) -> str:
        if v not in ALLOWED_SUBMITTER_TYPES:
            raise ValueError(
                f"submitter_type must be one of {sorted(ALLOWED_SUBMITTER_TYPES)}, got '{v}'"
            )
        return v

    @field_validator("cube_id")
    @classmethod
    def validate_cube_id(cls, v: int) -> int:
        if v not in ALLOWED_CUBE_IDS:
            raise ValueError(
                f"cube_id must be 1-12, got {v}"
            )
        return v


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
    if cube_id is not None and cube_id not in ALLOWED_CUBE_IDS:
        raise HTTPException(status_code=400, detail=f"cube_id must be 1-12, got {cube_id}")
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
    cube_id: int,
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Run sandbox tests against a submission (cube_id 1-9 targets that cube's suite)."""
    if cube_id not in ALLOWED_CUBE_IDS:
        raise HTTPException(status_code=400, detail=f"cube_id must be 1-9, got {cube_id}")
    return await service.run_sandbox_tests(submission_id, cube_id=cube_id)


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


class VerifyAccessRequest(BaseModel):
    code: str
    access_type: str  # "admin" or "challenger"

    @field_validator("access_type")
    @classmethod
    def validate_access_type(cls, v: str) -> str:
        if v not in ALLOWED_ACCESS_TYPES:
            raise ValueError(
                f"access_type must be one of {sorted(ALLOWED_ACCESS_TYPES)}, got '{v}'"
            )
        return v


@router.post("/verify-access")
async def verify_access(
    payload: VerifyAccessRequest,
    user: CurrentUser = Depends(get_current_user),
):
    """Verify Cube 10 access code — POST body (never in URL/logs)."""
    import hmac
    from app.config import settings

    if payload.access_type == "admin":
        expected = settings.cube10_admin_code
    elif payload.access_type == "challenger":
        expected = settings.cube10_challenger_code
    else:
        raise HTTPException(status_code=400, detail="access_type must be 'admin' or 'challenger'")

    # True constant-time comparison via hmac.compare_digest
    if hmac.compare_digest(payload.code.encode(), expected.encode()):
        return {"access": payload.access_type, "granted": True, "user_id": user.user_id}
    else:
        raise HTTPException(status_code=403, detail="Invalid access code")


# ---------------------------------------------------------------------------
# Challenge System (Grok Architecture)
# ---------------------------------------------------------------------------


class ChallengeCreate(BaseModel):
    cube_id: int
    title: str
    description: str
    acceptance_criteria: str
    function_name: str | None = None
    reward_heart: float = 10.0
    reward_unity: float = 50.0

    @field_validator("cube_id")
    @classmethod
    def validate_cube_id(cls, v: int) -> int:
        if v not in ALLOWED_CUBE_IDS:
            raise ValueError(
                f"cube_id must be 1-12, got {v}"
            )
        return v


@router.post("/challenges", status_code=201)
async def create_challenge(
    payload: ChallengeCreate,
    user: CurrentUser = Depends(require_role("admin")),
):
    """Create a new challenge for a specific Cube (Admin only)."""
    try:
        return await service.create_challenge(
            cube_id=payload.cube_id,
            title=payload.title,
            description=payload.description,
            acceptance_criteria=payload.acceptance_criteria,
            function_name=payload.function_name,
            reward_heart=payload.reward_heart,
            reward_unity=payload.reward_unity,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/challenges/{challenge_id}/claim")
async def claim_challenge(
    challenge_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Claim a challenge — creates isolated simulation portal."""
    return await service.claim_challenge(challenge_id, user.user_id)


@router.post("/challenges/{challenge_id}/submit")
async def submit_challenge_code(
    challenge_id: str,
    payload: SubmissionCreate,
    user: CurrentUser = Depends(get_current_user),
):
    """Submit enhanced code for community review."""
    try:
        return await service.submit_challenge(
            challenge_id, user.user_id, payload.code_diff,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Saved Use Cases
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
    # cube_id=0 means "all cubes"; 1-10 targets a specific cube
    if cube_id not in {0, *ALLOWED_CUBE_IDS}:
        raise HTTPException(status_code=400, detail=f"cube_id must be 0 (all) or 1-10, got {cube_id}")
    from app.cubes.cube10_simulation.saved_use_cases import (
        SavedUseCaseManager, replay_against_dataset,
    )
    mgr = SavedUseCaseManager()
    case = mgr.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Saved case not found")
    return await replay_against_dataset(case, cube_id, function_name)


# ---------------------------------------------------------------------------
# Dev-Sim — the Simulation option surface: see Cubes 1-9, inspect Cube 1's
# inputs → functions → outputs, PLAY-TEST the whole cube for metrics, and let a
# Master Developer check in candidate code for testing. Reuses the Cube-1 harness
# (sandbox oracle) + challenge_loop (baseline↔candidate→verdict→swap).
# ---------------------------------------------------------------------------

from app.cubes.cube10_simulation.challenge_loop import HARNESS_CUBES

_CUBE_NAMES = {
    1: "Session Join & QR", 2: "Text Submission", 3: "Voice-to-Text",
    4: "Response Collector", 5: "Gateway / Orchestrator", 6: "AI Theming Clusterer",
    7: "Prioritization & Ranking", 8: "Token Rewards", 9: "Reports & Dashboards",
}
# Single source of truth (challenge_loop.HARNESS_CUBES): cubes 1, 2, 6, 7 have
# runnable stand-alone harnesses; the rest are pending.
_HARNESS_CUBES = HARNESS_CUBES


@router.get("/sim/cubes")
async def sim_list_cubes():
    """List Cubes 1-9 for the Simulation option; flag which have a runnable harness."""
    return {"cubes": [
        {"cube_id": i, "name": _CUBE_NAMES[i], "harness_available": i in _HARNESS_CUBES}
        for i in range(1, 10)
    ]}


@router.get("/sim/cube/{cube_id}/contract")
async def sim_cube_contract(cube_id: int):
    """Cube I/O contract — inputs → functions → outputs (Cube 1 from the live harness)."""
    if cube_id < 1 or cube_id > 9:
        raise HTTPException(status_code=400, detail="cube_id must be 1-9")
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404,
            detail=f"Cube {cube_id} has no stand-alone harness yet.")
    from app.cubes.cube10_simulation.challenge_loop import _run_harness

    r = await _run_harness(cube_id)
    if "io_contract" in r:  # Cube 1 emits a rich inputs→functions→outputs contract
        return {
            "cube_id": cube_id, "name": _CUBE_NAMES[cube_id],
            "io_contract": r["io_contract"], "inputs": r["inputs"], "sample_outputs": r["outputs"],
        }
    # Cubes 2/6/7: minimal contract from the harness result (R2 enriches the block diagram).
    return {
        "cube_id": cube_id, "name": _CUBE_NAMES[cube_id],
        "io_contract": {"cube": r.get("cube", _CUBE_NAMES[cube_id])},
        "inputs": {}, "sample_outputs": r,
    }


@router.post("/sim/cube/{cube_id}/run")
async def sim_cube_run(
    cube_id: int,
    user: CurrentUser = Depends(get_current_user),
):
    """Play-test the whole cube → actual outputs + metrics baseline + determinism signature."""
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404,
            detail=f"Cube {cube_id} has no stand-alone harness yet.")
    from app.cubes.cube10_simulation.challenge_loop import _run_harness

    r = await _run_harness(cube_id)
    outputs = {k: v for k, v in r.items() if k != "metrics"}
    return {"cube_id": cube_id, "metrics": r.get("metrics", {}), "outputs": outputs,
            "determinism_signature": r.get("determinism_signature", "")}


class SimChallengeRequest(BaseModel):
    candidate: dict
    tier: str = "manual"
    human_approved: bool = False
    human_selected: bool = False


@router.post("/sim/cube/{cube_id}/challenge")
async def sim_cube_challenge(
    cube_id: int,
    payload: SimChallengeRequest,
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Master Developer checks in a candidate → baseline vs candidate → verdict + 3-tier swap."""
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404,
            detail=f"Cube {cube_id} challenge not available yet — Cube 1 is the reference.")
    from app.cubes.cube10_simulation.challenge_loop import run_challenge

    return await run_challenge(
        cube_id, payload.candidate, tier=payload.tier,
        human_approved=payload.human_approved, human_selected=payload.human_selected,
    )


@router.get("/sim/cube/{cube_id}/replay")
async def sim_cube_replay(
    cube_id: int,
    section: str | None = None,
    case_id: str = "demo",
    user: CurrentUser = Depends(get_current_user),
):
    """Replay a cube against a dataset — the WHOLE cube (section=None) OR one building
    block / level (section=A/B/C/D). Returns a reproducible replay_hash + scope so the
    Dev-Master can beat a block or the whole cube (Manual Vision • 2525)."""
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404,
            detail=f"Cube {cube_id} has no dataset-replay harness yet.")
    from app.cubes.cube10_simulation.saved_use_cases import (
        SavedUseCaseManager, replay_against_dataset,
    )
    mgr = SavedUseCaseManager()
    case = mgr.get_case(case_id) or mgr.demo
    if not case:
        raise HTTPException(status_code=404, detail="Dataset case not found")
    try:
        return await replay_against_dataset(case, cube_id, function_name="", section=section)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
