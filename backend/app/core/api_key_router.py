"""API key management REST API — create / list / revoke per-org keys.

Managed with the interactive Auth0 JWT (a human provisions keys for their org). The full
key is returned ONCE on create and never again. Reads/revokes are org-scoped.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import api_key_service as svc
from app.core.auth import CurrentUser
from app.core.dependencies import get_db
from app.core.permissions import require_role

router = APIRouter(tags=["API Keys"])

_MANAGE_ROLES = ("moderator", "admin", "lead_developer")


def _org(user: CurrentUser) -> str:
    return user.user_id or "anonymous"


class ApiKeyCreate(BaseModel):
    name: str
    scopes: str = "*"


def _key_out(rec) -> dict:
    """Redacted view — never includes the secret, only the safe display prefix."""
    return {
        "id": str(rec.id), "org_id": rec.org_id, "name": rec.name,
        "key_prefix": rec.key_prefix, "scopes": rec.scopes, "is_active": rec.is_active,
        "created_at": rec.created_at.isoformat() if rec.created_at else None,
        "last_used_at": rec.last_used_at.isoformat() if rec.last_used_at else None,
    }


@router.post("/api-keys", status_code=201)
async def create_key(
    payload: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role(*_MANAGE_ROLES)),
):
    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name must be non-empty")
    if len(name) > 255:
        raise HTTPException(status_code=400, detail="name too long (max 255)")
    rec, full_key = await svc.create_api_key(
        db, org_id=_org(user), name=name, created_by=user.user_id, scopes=payload.scopes or "*",
    )
    # The ONLY time the full key is returned — surface it to the user now.
    return {**_key_out(rec), "api_key": full_key,
            "warning": "Store this key now — it will not be shown again."}


@router.get("/api-keys")
async def list_keys(
    include_revoked: bool = False,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role(*_MANAGE_ROLES)),
):
    keys = await svc.list_api_keys(db, org_id=_org(user), include_revoked=include_revoked)
    return {"api_keys": [_key_out(k) for k in keys]}


@router.delete("/api-keys/{key_id}")
async def revoke_key(
    key_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role(*_MANAGE_ROLES)),
):
    ok = await svc.revoke_api_key(db, key_id=key_id, org_id=_org(user))
    if not ok:
        raise HTTPException(status_code=404, detail="API key not found or already revoked")
    return {"id": str(key_id), "revoked": True}
