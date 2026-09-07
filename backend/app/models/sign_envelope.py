"""Sign Doc — e-signature envelopes (mirrors supabase/migrations/036_sign_envelopes.sql).

One envelope = 1–5 PDFs + an ordered list of signers; exactly one may act at a time, keyed by a
per-signer secret whose sha256 is the only thing stored. `sign_events` is the append-only evidence
row per view / signature / refusal / revocation. The client talks to the SECURITY DEFINER RPCs
only; these models exist so the migration parity gate and any backend reporting share one shape.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

SIGN_STATUSES = ("awaiting", "complete", "revoked", "expired", "locked")
SIGN_EVENT_KINDS = ("created", "viewed", "signed", "refused", "revoked", "locked")


class SignEnvelope(Base):
    __tablename__ = "sign_envelopes"

    token: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    created_by: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="awaiting")
    current_signer_idx: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    signers: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    chain: Mapped[str] = mapped_column(Text, nullable=False, default="")
    failed_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (Index("sign_envelopes_status_idx", "status", "expires_at"),)


class SignFile(Base):
    __tablename__ = "sign_files"

    envelope_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sign_envelopes.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pdf_base64: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    storage_url: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (Index("sign_files_envelope_version_idx", "envelope_id", "version"),)


class SignEvent(Base):
    __tablename__ = "sign_events"

    envelope_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sign_envelopes.id", ondelete="CASCADE"), nullable=False)
    signer_idx: Mapped[int | None] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    file_shas: Mapped[list | None] = mapped_column(ARRAY(String(64)))
    version: Mapped[int | None] = mapped_column(Integer)
    contact_hash: Mapped[str | None] = mapped_column(String(64))
    ip_hash: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(300))
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (Index("sign_events_envelope_idx", "envelope_id", "at"),)
