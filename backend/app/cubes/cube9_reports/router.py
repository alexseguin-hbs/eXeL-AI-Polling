"""Cube 9 — Reports, Export & Dashboards."""

from fastapi import APIRouter

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 9 — Reports"])


@router.get("/export/csv")
async def export_csv(session_id: str):
    """CRS-14: Export session results to CSV."""
    raise NotImplementedError("Cube 9: export_csv — not yet implemented")


@router.get("/analytics")
async def get_analytics(session_id: str):
    """CRS-19: Get engagement metrics and analytics."""
    raise NotImplementedError("Cube 9: get_analytics — not yet implemented")
