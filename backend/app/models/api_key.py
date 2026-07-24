"""Per-organization API keys — the API-first platform's non-interactive auth.

A consumer (company embedding the engine) creates an API key scoped to their org, then
calls the REST API with `Authorization: Bearer exel_<...>` instead of an Auth0 JWT. The
full key is shown ONCE at creation; only a SHA-256 hash + a short display prefix are
stored, so a leaked database never reveals a usable key.

Org isolation is v1 per-user (`org_id` = creating principal's `user_id`), matching the
scoping hierarchy, until a first-class org claim lands.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

# Human-visible prefix so keys are identifiable in logs/UIs without exposing the secret.
API_KEY_PREFIX = "exel_"


class ApiKey(Base):
    __tablename__ = "api_keys"

    org_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Short, non-secret display prefix (e.g. "exel_a1b2c3") — safe to show in listings.
    key_prefix: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    # SHA-256 hex of the full key. The full key is NEVER stored.
    key_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    # Comma-separated scope grants (e.g. "sessions:write,rankings:read"); "*" = all.
    scopes: Mapped[str] = mapped_column(Text, default="*")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index("ix_api_keys_org_active", "org_id", "is_active"),
    )
