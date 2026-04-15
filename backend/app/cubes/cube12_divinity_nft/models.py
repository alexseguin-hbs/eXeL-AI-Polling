"""Cube 12 — Divinity Guide & NFT ARX: ORM Models.

Supabase tables: arx_items, arx_transactions
CRS: CRS-NEW-12.01 through 12.05
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ArxItem(Base):
    """A physically-backed NFT item with ARX NFC chip."""

    __tablename__ = "arx_items"

    token_id: Mapped[int | None] = mapped_column(Integer)
    chip_key_hash: Mapped[str | None] = mapped_column(String(255))
    item_name: Mapped[str] = mapped_column(String(500), nullable=False)
    serial_number: Mapped[str | None] = mapped_column(String(255))
    identifiers: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(10), default="en")
    current_owner: Mapped[str | None] = mapped_column(String(255))
    purchase_price_usd: Mapped[float | None] = mapped_column(Numeric(10, 2))
    quai_tx_hash: Mapped[str | None] = mapped_column(String(255))
    qr_code_url: Mapped[str | None] = mapped_column(Text)
    last_transfer_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index("ix_arx_items_owner", "current_owner"),
        Index("ix_arx_items_token", "token_id"),
    )


class ArxTransaction(Base):
    """A buy/sell/transfer record for an ARX item."""

    __tablename__ = "arx_transactions"

    arx_tx_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    token_id: Mapped[int] = mapped_column(Integer, nullable=False)
    from_address: Mapped[str | None] = mapped_column(String(255))
    to_address: Mapped[str] = mapped_column(String(255), nullable=False)
    price_usd: Mapped[float | None] = mapped_column(Numeric(10, 2))
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)  # mint, transfer, sale
    quai_tx_hash: Mapped[str | None] = mapped_column(String(255))

    __table_args__ = (
        Index("ix_arx_tx_token", "token_id"),
        Index("ix_arx_tx_type", "transaction_type"),
    )
