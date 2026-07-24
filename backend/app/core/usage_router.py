"""Usage metering REST API — an org reads its own metered consumption for billing/analytics."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import usage_service as svc
from app.core.auth import CurrentUser
from app.core.dependencies import get_db
from app.core.permissions import require_role

router = APIRouter(tags=["Usage Metering"])

_READ_ROLES = ("moderator", "admin", "lead_developer")


def _org(user: CurrentUser) -> str:
    return user.user_id or "anonymous"


def _parse(ts: str | None, label: str) -> datetime | None:
    if ts is None:
        return None
    try:
        return datetime.fromisoformat(ts)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{label} must be ISO-8601")


@router.get("/usage")
async def get_usage(
    start: str | None = None,
    end: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role(*_READ_ROLES)),
):
    """Per-metric usage totals for the caller's org over an optional [start, end) window."""
    s, e = _parse(start, "start"), _parse(end, "end")
    if s is not None and e is not None and e <= s:
        raise HTTPException(status_code=400, detail="end must be after start")
    return await svc.summarize_usage(db, org_id=_org(user), start=s, end=e)
