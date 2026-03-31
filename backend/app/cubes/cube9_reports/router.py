"""Cube 9 — Reports, Export & Dashboards."""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.cubes.cube9_reports import service

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 9 — Reports"])


@router.get("/export/csv")
async def export_csv(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """CRS-14: Export session results to 15-column CSV download."""
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
async def get_analytics(session_id: str):
    """CRS-19: Get engagement metrics and analytics."""
    raise NotImplementedError("Cube 9: get_analytics — not yet implemented")
