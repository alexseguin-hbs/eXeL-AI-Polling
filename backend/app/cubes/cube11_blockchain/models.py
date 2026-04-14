"""Cube 11 — Blockchain (Quai/QI): ORM Models.

Supabase table: blockchain_records
CRS: CRS-23 (Audit trail — on-chain governance proof)
"""

from sqlalchemy import Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BlockchainRecord(Base):
    """A survey governance proof recorded on Quai blockchain."""

    __tablename__ = "blockchain_records"

    session_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    governance_proof: Mapped[str] = mapped_column(String(255), nullable=False)
    winning_theme: Mapped[str] = mapped_column(String(500), nullable=False)
    voter_count: Mapped[int] = mapped_column(Integer, default=0)
    response_count: Mapped[int] = mapped_column(Integer, default=0)
    quai_tx_hash: Mapped[str | None] = mapped_column(String(255))
    chain_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, recorded, failed

    __table_args__ = (
        Index("ix_blockchain_records_status", "chain_status"),
        Index("ix_blockchain_records_session", "session_hash"),
    )
