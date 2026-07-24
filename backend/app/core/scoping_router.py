"""Scoping REST API — Project → Differentiator → Specification.

The API-first platform's scope hierarchy. Every embedding consumer creates a Project,
adds Differentiators (dimensions/hypotheses), and pins Specifications (parameters) to
simulate within. Sessions + downstream data inherit scope from these ids.

Org isolation (v1): the scope tree is owned by the authenticated principal
(`user_id` as `org_id`) until a first-class org claim lands — swappable in one place.
Writes require an elevated role; reads require auth.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user, get_current_principal
from app.core import scoping_service as svc
from app.core.dependencies import get_db
from app.core.permissions import require_role

router = APIRouter(tags=["Scoping — Project/Differentiator/Specification"])

_WRITE_ROLES = ("moderator", "admin", "lead_developer")


def _org(user: CurrentUser) -> str:
    """Derive the org scope from the principal (v1: per-user isolation)."""
    return user.user_id or "anonymous"


def _clean(v: str, field: str, maxlen: int = 255) -> str:
    s = (v or "").strip()
    if not s:
        raise HTTPException(status_code=400, detail=f"{field} must be non-empty")
    if len(s) > maxlen:
        raise HTTPException(status_code=400, detail=f"{field} too long (max {maxlen})")
    return s


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    config: dict | None = None

    @field_validator("config")
    @classmethod
    def _cfg_is_object(cls, v):
        if v is not None and not isinstance(v, dict):
            raise ValueError("config must be an object")
        return v


class DifferentiatorCreate(BaseModel):
    name: str
    description: str | None = None
    hypothesis: str | None = None
    config: dict | None = None


class SpecificationCreate(BaseModel):
    name: str
    description: str | None = None
    parameters: dict | None = None


def _project_out(p) -> dict:
    return {"id": str(p.id), "org_id": p.org_id, "name": p.name,
            "description": p.description, "status": p.status, "config": p.config}


@router.post("/scoping/projects", status_code=201)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role(*_WRITE_ROLES)),
):
    p = await svc.create_project(
        db, org_id=_org(user), name=_clean(payload.name, "name"),
        created_by=user.user_id, description=payload.description, config=payload.config,
    )
    return _project_out(p)


@router.get("/scoping/projects")
async def list_projects(
    status: str = "active",
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_principal),
):
    if status not in ("active", "archived"):
        raise HTTPException(status_code=400, detail="status must be 'active' or 'archived'")
    projects = await svc.list_projects(db, org_id=_org(user), status=status)
    return {"projects": [_project_out(p) for p in projects]}


@router.post("/scoping/projects/{project_id}/differentiators", status_code=201)
async def create_differentiator(
    project_id: uuid.UUID,
    payload: DifferentiatorCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role(*_WRITE_ROLES)),
):
    try:
        d = await svc.create_differentiator(
            db, project_id=project_id, org_id=_org(user), name=_clean(payload.name, "name"),
            description=payload.description, hypothesis=payload.hypothesis, config=payload.config,
        )
    except svc.ScopeNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": str(d.id), "project_id": str(d.project_id), "name": d.name, "status": d.status}


@router.post("/scoping/differentiators/{differentiator_id}/specifications", status_code=201)
async def create_specification(
    differentiator_id: uuid.UUID,
    payload: SpecificationCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role(*_WRITE_ROLES)),
):
    try:
        s = await svc.create_specification(
            db, differentiator_id=differentiator_id, org_id=_org(user),
            name=_clean(payload.name, "name"), description=payload.description,
            parameters=payload.parameters,
        )
    except svc.ScopeNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": str(s.id), "differentiator_id": str(s.differentiator_id),
            "name": s.name, "status": s.status}


@router.get("/scoping/projects/{project_id}/tree")
async def scope_tree(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_principal),
):
    try:
        return await svc.get_scope_tree(db, project_id=project_id, org_id=_org(user))
    except svc.ScopeNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
