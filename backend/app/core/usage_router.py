"""Usage metering REST API — an org reads its own metered consumption for billing/analytics."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import usage_service as svc
from app.core.auth import CurrentUser, get_current_principal
from app.core.dependencies import get_db

router = APIRouter(tags=["Usage Metering"])

# Billing/usage is an elevated concern — a plain participant may not read it. An org's own
# API key (role "api_key") may (Headless-API mode); a JWT needs an elevated role.
_READ_ROLES = ("moderator", "admin", "lead_developer", "api_key")


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
    user: CurrentUser = Depends(get_current_principal),
):
    """Per-metric usage totals for the caller's org over an optional [start, end) window.

    Accepts EITHER an Auth0 JWT OR a per-org API key (`Bearer exel_…`) — an org reads its
    OWN metered usage (Headless-API mode). Always org-scoped, so a caller only ever sees
    their own consumption. Billing is elevated: a plain participant is denied."""
    if user.role not in _READ_ROLES and "admin" not in user.role:
        raise HTTPException(status_code=403, detail="usage requires an elevated role or an API key")
    s, e = _parse(start, "start"), _parse(end, "end")
    if s is not None and e is not None and e <= s:
        raise HTTPException(status_code=400, detail="end must be after start")
    return await svc.summarize_usage(db, org_id=_org(user), start=s, end=e)
