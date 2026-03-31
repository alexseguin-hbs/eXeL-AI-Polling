"""Cube 9 — Reports, Export & Dashboards.

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
    # Fetch session
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Moderator/Admin/Lead: always allowed
    if user.role in ("moderator", "admin", "lead_developer"):
        if user.role == "moderator" and session.created_by != user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")
    else:
        # Participant: check payment gating for cost_split sessions
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

    buf = await service.export_session_csv(db, session_id)
    filename = f"{session_id}_themes.csv"
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Download-Filename": filename,
        },
    )


@router.get("/analytics")
async def get_analytics(
    session_id: str,
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-19: Get engagement metrics and analytics."""
    raise NotImplementedError("Cube 9: get_analytics — not yet implemented")
