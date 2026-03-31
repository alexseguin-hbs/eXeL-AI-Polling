"""Product Feedback API — collect feedback at every stage of use.

Endpoints:
  POST /feedback          — Submit feedback (any user, any screen)
  GET  /feedback          — List feedback (admin/lead only)
  GET  /feedback/stats    — Aggregated stats (admin/lead only)
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_optional_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.core.rate_limit import limiter
from app.models.product_feedback import ProductFeedback
from app.schemas.feedback import FeedbackCreate, FeedbackRead, FeedbackStats

# Auto-map screen context to Cube + CRS for triage
SCREEN_CRS_MAP: dict[str, dict] = {
    "landing":   {"cube_id": 1,  "crs_id": "CRS-01"},
    "join":      {"cube_id": 1,  "crs_id": "CRS-02"},
    "polling":   {"cube_id": 2,  "crs_id": "CRS-07"},
    "dashboard": {"cube_id": 1,  "crs_id": "CRS-06"},
    "results":   {"cube_id": 9,  "crs_id": "CRS-14"},
    "ranking":   {"cube_id": 7,  "crs_id": "CRS-11"},
    "settings":  {"cube_id": 1,  "crs_id": "CRS-01"},
    "sim":       {"cube_id": 10, "crs_id": "CRS-25"},
}

router = APIRouter(prefix="/feedback", tags=["Product Feedback"])


@router.post("", response_model=FeedbackRead, status_code=201)
@limiter.limit("10/minute")
async def submit_feedback(
    request,  # needed for rate limiter
    payload: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Submit product feedback from any screen. Auth optional."""
    # Auto-tag Cube + CRS based on screen context
    crs_info = SCREEN_CRS_MAP.get(payload.screen, {})

    feedback = ProductFeedback(
        session_id=payload.session_id,
        user_id=user.user_id if user else None,
        role=user.role if user else "anonymous",
        screen=payload.screen,
        cube_id=crs_info.get("cube_id"),
        crs_id=crs_info.get("crs_id"),
        feedback_text=payload.feedback_text,
        category=payload.category,
        device_type=payload.device_type,
        language_code=payload.language_code,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


@router.get("", response_model=list[FeedbackRead])
async def list_feedback(
    screen: str | None = Query(default=None),
    category: str | None = Query(default=None),
    resolved: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """List product feedback (admin/lead only). Filterable by screen, category, resolved."""
    query = select(ProductFeedback).order_by(ProductFeedback.created_at.desc())

    if screen:
        query = query.where(ProductFeedback.screen == screen)
    if category:
        query = query.where(ProductFeedback.category == category)
    if resolved is not None:
        query = query.where(ProductFeedback.is_resolved == resolved)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/stats", response_model=FeedbackStats)
async def get_feedback_stats(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Aggregated feedback stats for dashboard."""
    # Total
    total_result = await db.execute(select(func.count(ProductFeedback.id)))
    total = total_result.scalar() or 0

    # By screen
    screen_result = await db.execute(
        select(ProductFeedback.screen, func.count(ProductFeedback.id))
        .group_by(ProductFeedback.screen)
    )
    by_screen = {row[0]: row[1] for row in screen_result.all()}

    # By category
    cat_result = await db.execute(
        select(ProductFeedback.category, func.count(ProductFeedback.id))
        .group_by(ProductFeedback.category)
    )
    by_category = {row[0]: row[1] for row in cat_result.all()}

    # Unresolved
    unresolved_result = await db.execute(
        select(func.count(ProductFeedback.id)).where(
            ProductFeedback.is_resolved.is_(False)
        )
    )
    unresolved = unresolved_result.scalar() or 0

    return FeedbackStats(
        total=total,
        by_screen=by_screen,
        by_category=by_category,
        unresolved=unresolved,
    )
