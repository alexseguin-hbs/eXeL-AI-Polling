"""Cube 12 — Divinity Guide & NFT ARX: API Router.

5 endpoints for physically-backed NFT tokens:
  POST /arx/mint         — Mint new item (after Stripe payment)
  GET  /arx/verify/{id}  — Verify item (public, no auth)
  POST /arx/transfer     — Transfer ownership (sale or gift)
  GET  /arx/item/{id}    — Get item details + transaction history
  GET  /arx/marketplace  — List available items

CRS: CRS-NEW-12.01 through 12.05
"""

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user, get_optional_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube12_divinity_nft import service

router = APIRouter(prefix="/arx", tags=["Cube 12 — Divinity & NFT ARX"])

# WireGuard whitelists
VALID_LANGUAGES = ("en", "es", "zh", "uk", "ru", "fa", "he", "pt", "km", "ne")
VALID_TX_TYPES = ("mint", "transfer", "sale")


# ── Request Schemas ──────────────────────────────────────────────

class MintRequest(BaseModel):
    item_name: str
    purchase_price_usd: float
    serial_number: str | None = None
    edition: int = 0
    language: str = "en"
    chip_key_hash: str | None = None

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        # Accept any 2-3 char alpha ISO 639-1/639-2 code (34 languages in lexicon)
        import re
        if not re.match(r'^[a-z]{2,3}$', v):
            raise ValueError(f"language must be a 2-3 char lowercase code, got '{v}'")
        return v

    @field_validator("purchase_price_usd")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("purchase_price_usd must be non-negative")
        return v


class TransferRequest(BaseModel):
    token_id: int = Field(ge=1)
    to_address: str = Field(min_length=1, max_length=255)
    sale_price_usd: float | None = Field(default=None, ge=0)


# ── Endpoints ────────────────────────────────────────────────────

@router.post("/mint", status_code=201)
async def mint_item(
    payload: MintRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-NEW-12.01: Mint a new ARX NFT for a physical item.

    Called after Stripe payment succeeds. Requires authentication.
    Returns: token_id, QR code URL, transaction ID.
    """
    result = await service.mint_arx_item(
        db,
        item_name=payload.item_name,
        purchase_price_usd=payload.purchase_price_usd,
        buyer_address=user.user_id,
        serial_number=payload.serial_number,
        edition=payload.edition,
        language=payload.language,
        chip_key_hash=payload.chip_key_hash,
    )
    await db.commit()
    return result


@router.get("/verify/{token_id}")
async def verify_item(
    token_id: int,
    chip_uid: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """CRS-NEW-12.02: Verify ARX item authenticity. Public — no auth required.

    Anyone can scan QR or tap NFC chip to verify ownership.
    """
    return await service.verify_arx_chip(db, token_id=token_id, chip_uid=chip_uid)


@router.post("/transfer")
async def transfer_item(
    payload: TransferRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-NEW-12.03: Transfer ARX item ownership.

    QR codes sent to BOTH buyer AND seller (timestamped).
    Must be current owner to transfer.
    """
    try:
        result = await service.transfer_arx_item(
            db,
            token_id=payload.token_id,
            from_address=user.user_id,
            to_address=payload.to_address,
            sale_price_usd=payload.sale_price_usd,
        )
        await db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/item/{token_id}")
async def get_item(
    token_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-NEW-12.04: Get item details + full transaction history."""
    item = await service.get_arx_item(db, token_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"ARX item {token_id} not found")
    return item


@router.get("/marketplace")
async def marketplace(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """CRS-NEW-12.05: List available ARX items. Public — no auth."""
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be 1-100")
    return await service.list_marketplace(db, limit=limit)
