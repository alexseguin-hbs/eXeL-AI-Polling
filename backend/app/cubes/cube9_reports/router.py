"""Cube 9 — Reports, Export & Dashboards.

Endpoints:
  GET  /export/csv       — 16-column CSV download (CRS-14)
  GET  /analytics        — Participation + engagement metrics (CRS-19)
  GET  /cqs-dashboard    — CQS scoring breakdown (CRS-19.02)
  GET  /ranking-summary  — Aggregated ranking results (CRS-15)
  POST /destroy-data     — Irreversible data destruction (CRS-14.03)

Results access gating:
  Free: Moderator + Lead always; Users see results (donation prompt after)
  Moderator Paid: All participants (Moderator paid for everyone)
  Cost Split: Only participants with payment_status='paid' or 'lead_exempt'
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube9_reports import service
from app.models.participant import Participant
from app.models.session import Session

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 9 — Reports"])


# ---------------------------------------------------------------------------
# CRS-14: CSV Export
# ---------------------------------------------------------------------------


@router.get("/export/csv")
async def export_csv(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-14: Export session results to 16-column CSV download.

    Auth gating:
      Moderator/Admin/Lead: always allowed
      Participant: allowed if payment_status in ('paid', 'lead_exempt')
                   or session pricing_tier is 'free' or 'moderator_paid'
    """
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if user.role in ("moderator", "admin", "lead_developer"):
        if user.role == "moderator" and session.created_by != user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")
    else:
        if session.pricing_tier == "cost_split":
            p_result = await db.execute(
                select(Participant).where(
                    Participant.session_id == session_id,
                    Participant.user_id == user.user_id,
                )
            )
            participant = p_result.scalar_one_or_none()
            if not participant or participant.payment_status not in ("paid", "lead_exempt"):
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Payment required to access results",
                )

    # Auto-select: streaming for large sessions (>10K responses), pandas for small
    from sqlalchemy import func
    from app.models.response_meta import ResponseMeta as RM
    count_result = await db.execute(
        select(func.count()).select_from(RM).where(RM.session_id == session_id)
    )
    response_count = count_result.scalar() or 0

    filename = f"{session_id}_themes.csv"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-Download-Filename": filename,
    }

    if response_count > 10_000:
        # Scale mode: streaming CSV (no full-memory DataFrame)
        return StreamingResponse(
            service.export_session_csv_streaming(db, session_id),
            media_type="text/csv",
            headers=headers,
        )
    else:
        # Standard mode: pandas DataFrame (fast for small sessions)
        buf = await service.export_session_csv(db, session_id)
        return StreamingResponse(buf, media_type="text/csv", headers=headers)


# ---------------------------------------------------------------------------
# CRS-19: Analytics Dashboard
# ---------------------------------------------------------------------------


@router.get("/analytics")
async def get_analytics(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-19: Participation, timing, engagement, token, ranking metrics."""
    return await service.build_analytics_dashboard(db, session_id)


# ---------------------------------------------------------------------------
# CRS-19.02: CQS Dashboard
# ---------------------------------------------------------------------------


@router.get("/cqs-dashboard")
async def get_cqs_dashboard(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-19.02: CQS scoring breakdown — composite scores, winner, top 50."""
    return await service.build_cqs_dashboard(db, session_id)


# ---------------------------------------------------------------------------
# CRS-15: Ranking Summary
# ---------------------------------------------------------------------------


@router.get("/ranking-summary")
async def get_ranking_summary(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-15: Aggregated ranking results with theme labels."""
    return await service.build_ranking_summary(db, session_id)


# ---------------------------------------------------------------------------
# CRS-14.03: Data Destruction
# ---------------------------------------------------------------------------


@router.get("/export/pdf")
async def export_pdf(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-14.02: PDF export (MVP2 — stub)."""
    return await service.generate_pdf_stub(db, session_id)


@router.get("/results/distribution")
async def get_results_distribution(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-14.05: Check who is eligible to receive results."""
    return await service.distribute_results(db, session_id)


@router.get("/results/reward")
async def get_reward_announcement(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-14.01: Get CQS reward winner details (Moderator/Admin only)."""
    from app.models.session import Session as SessionModel

    sess_result = await db.execute(
        select(SessionModel).where(SessionModel.id == session_id)
    )
    session_obj = sess_result.scalar_one_or_none()
    short_code = session_obj.short_code if session_obj else None

    return await service.announce_reward_winner(db, session_id, short_code)


@router.post("/destroy-data", status_code=200)
async def destroy_data(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin")),
):
    """CRS-14.03: Irreversible data destruction after results delivery.

    Admin-only. Nullifies raw text and summaries. Preserves session
    metadata, themes, and rankings for audit trail.

    WARNING: This action is IRREVERSIBLE.
    """
    return await service.destroy_session_export_data(
        db, session_id, destroyed_by=user.user_id
    )
