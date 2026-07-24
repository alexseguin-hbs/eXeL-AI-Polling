"""API-first scoping hierarchy — Project → Differentiator → Specification.

CLAUDE.md scoping hierarchy (the backbone of the embeddable platform):
  * Project        — top-level container (a company's product/initiative); isolated
                     config, sessions, tokens, and data.
  * Differentiator — distinct dimensions/features/hypotheses within a Project
                     (e.g. "UX Approach A vs B").
  * Specification  — concrete parameters/constraints to fine-tune + simulate within
                     a Differentiator.

Sessions (and all downstream data) inherit scope via these ids. Each level is
org-scoped (`org_id`) for multi-tenant isolation. Deleting a parent cascades to its
children so a Project teardown removes its whole subtree.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    pass

# Lifecycle states shared across all three scope levels.
SCOPE_STATES = ("active", "archived")


class Project(Base):
    """Top-level scope container — one per company product/initiative, org-isolated."""

    __tablename__ = "projects"

    org_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="active")
    config: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)

    differentiators: Mapped[list["Differentiator"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_projects_org_status", "org_id", "status"),
    )


class Differentiator(Base):
    """A distinct dimension/hypothesis within a Project (e.g. "UX Approach A vs B")."""

    __tablename__ = "differentiators"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    hypothesis: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="active")
    config: Mapped[dict] = mapped_column(JSONB, default=dict)

    project: Mapped["Project"] = relationship(back_populates="differentiators")
    specifications: Mapped[list["Specification"]] = relationship(
        back_populates="differentiator", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_differentiators_project", "project_id", "status"),
    )


class Specification(Base):
    """Concrete parameters/constraints to fine-tune + simulate within a Differentiator."""

    __tablename__ = "specifications"

    differentiator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("differentiators.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="active")
    parameters: Mapped[dict] = mapped_column(JSONB, default=dict)

    differentiator: Mapped["Differentiator"] = relationship(back_populates="specifications")

    __table_args__ = (
        Index("ix_specifications_differentiator", "differentiator_id", "status"),
    )
