"""Scoping CRUD service — Project → Differentiator → Specification.

Enforces the hierarchy: a Differentiator must reference an existing Project (same org);
a Specification must reference an existing Differentiator. Org isolation is enforced on
every read/write so one tenant can never see or mutate another's scope tree.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scoping import Differentiator, Project, Specification


class ScopeNotFound(Exception):
    """Raised when a parent scope does not exist (or belongs to another org)."""


async def create_project(
    db: AsyncSession, *, org_id: str, name: str, created_by: str,
    description: str | None = None, config: dict | None = None,
) -> Project:
    p = Project(org_id=org_id, name=name, created_by=created_by,
                description=description, config=config or {})
    db.add(p)
    await db.flush()
    return p


async def list_projects(db: AsyncSession, *, org_id: str, status: str = "active") -> list[Project]:
    res = await db.execute(
        select(Project).where(Project.org_id == org_id, Project.status == status)
        .order_by(Project.created_at.desc())
    )
    return list(res.scalars().all())


async def _get_project(db: AsyncSession, project_id: uuid.UUID, org_id: str) -> Project:
    res = await db.execute(
        select(Project).where(Project.id == project_id, Project.org_id == org_id)
    )
    p = res.scalar_one_or_none()
    if p is None:
        raise ScopeNotFound(f"project {project_id} not found for org {org_id}")
    return p


async def create_differentiator(
    db: AsyncSession, *, project_id: uuid.UUID, org_id: str, name: str,
    description: str | None = None, hypothesis: str | None = None, config: dict | None = None,
) -> Differentiator:
    await _get_project(db, project_id, org_id)  # org-scoped parent must exist
    d = Differentiator(project_id=project_id, name=name, description=description,
                       hypothesis=hypothesis, config=config or {})
    db.add(d)
    await db.flush()
    return d


async def create_specification(
    db: AsyncSession, *, differentiator_id: uuid.UUID, org_id: str, name: str,
    description: str | None = None, parameters: dict | None = None,
) -> Specification:
    # The differentiator must exist AND belong to a project in this org (join guards isolation).
    res = await db.execute(
        select(Differentiator).join(Project, Differentiator.project_id == Project.id)
        .where(Differentiator.id == differentiator_id, Project.org_id == org_id)
    )
    if res.scalar_one_or_none() is None:
        raise ScopeNotFound(f"differentiator {differentiator_id} not found for org {org_id}")
    s = Specification(differentiator_id=differentiator_id, name=name,
                      description=description, parameters=parameters or {})
    db.add(s)
    await db.flush()
    return s


async def get_scope_tree(db: AsyncSession, *, project_id: uuid.UUID, org_id: str) -> dict:
    """Full nested tree for a project (org-scoped) — the payload an embedding consumer
    uses to render / pick a scope."""
    p = await _get_project(db, project_id, org_id)
    d_res = await db.execute(
        select(Differentiator).where(Differentiator.project_id == p.id)
        .order_by(Differentiator.created_at)
    )
    diffs = list(d_res.scalars().all())
    tree_diffs = []
    for d in diffs:
        s_res = await db.execute(
            select(Specification).where(Specification.differentiator_id == d.id)
            .order_by(Specification.created_at)
        )
        specs = [{"id": str(s.id), "name": s.name, "status": s.status} for s in s_res.scalars().all()]
        tree_diffs.append({"id": str(d.id), "name": d.name, "status": d.status, "specifications": specs})
    return {"id": str(p.id), "name": p.name, "org_id": p.org_id, "status": p.status,
            "differentiators": tree_diffs}
