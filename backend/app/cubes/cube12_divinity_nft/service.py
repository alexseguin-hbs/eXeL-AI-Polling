"""Cube 12 — Divinity Guide & NFT ARX: Service layer.

Functions:
  - mint_arx_item: Create new NFT for a physical item (book, art, collectible)
  - verify_arx_chip: Verify ARX NFC chip against on-chain record
  - transfer_arx_item: Transfer ownership (sale or gift)
  - get_arx_item: Fetch item details + transaction history
  - list_marketplace: List items available for sale

CRS: CRS-NEW-12.01 through 12.05
I/O: db (AsyncSession) + params → dict (item data)
"""

import hashlib
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cubes.cube12_divinity_nft.models import ArxItem, ArxTransaction

logger = logging.getLogger("cube12")

# Transaction ID counter (in production, use DB sequence)
_TX_COUNTER = 0


def _next_tx_id() -> str:
    """Generate sequential transaction ID: ARX-YYYY-NNNNNN."""
    global _TX_COUNTER
    _TX_COUNTER += 1
    year = datetime.now(timezone.utc).year
    return f"ARX-{year}-{_TX_COUNTER:06d}"


def _generate_qr_url(token_id: int, verification_hash: str) -> str:
    """Generate QR code URL for item verification."""
    base = "https://exel-ai-polling.explore-096.workers.dev"
    return f"{base}/divinity-guide/arx?token={token_id}&verify={verification_hash[:16]}"


async def mint_arx_item(
    db: AsyncSession,
    *,
    item_name: str,
    purchase_price_usd: float,
    buyer_address: str,
    serial_number: str | None = None,
    edition: int = 0,
    language: str = "en",
    chip_key_hash: str | None = None,
) -> dict:
    """CRS-NEW-12.01: Mint a new ARX NFT for a physical item.

    I/O: item details → dict with token_id, qr_code_url, arx_tx_id
    Called after Stripe payment succeeds.
    """
    # Generate token ID (sequential)
    count_result = await db.execute(select(func.count(ArxItem.id)))
    token_id = (count_result.scalar() or 0) + 1

    # Generate verification hash
    verification_hash = hashlib.sha256(
        f"{token_id}:{item_name}:{buyer_address}:{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()

    qr_url = _generate_qr_url(token_id, verification_hash)

    # Create item record
    item = ArxItem(
        token_id=token_id,
        chip_key_hash=chip_key_hash,
        item_name=item_name,
        serial_number=serial_number,
        edition=edition,
        language=language,
        current_owner=buyer_address,
        purchase_price_usd=purchase_price_usd,
        qr_code_url=qr_url,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    # Log transaction
    tx_id = _next_tx_id()
    tx = ArxTransaction(
        arx_tx_id=tx_id,
        token_id=token_id,
        from_address=None,  # Mint — no sender
        to_address=buyer_address,
        price_usd=purchase_price_usd,
        transaction_type="mint",
    )
    db.add(tx)
    await db.flush()

    logger.info("cube12.arx.minted", extra={
        "token_id": token_id, "item_name": item_name,
        "buyer": buyer_address, "price_usd": purchase_price_usd,
    })

    return {
        "token_id": token_id,
        "item_id": str(item.id),
        "item_name": item_name,
        "serial_number": serial_number,
        "edition": edition,
        "owner": buyer_address,
        "purchase_price_usd": purchase_price_usd,
        "qr_code_url": qr_url,
        "arx_tx_id": tx_id,
        "verification_hash": verification_hash,
        "status": "minted",
    }


async def verify_arx_chip(
    db: AsyncSession,
    *,
    token_id: int,
    chip_uid: str | None = None,
) -> dict:
    """CRS-NEW-12.02: Verify an ARX item exists and return ownership proof.

    I/O: token_id + optional chip_uid → dict with verification status
    Public endpoint — no auth required (anyone can verify).
    """
    result = await db.execute(
        select(ArxItem).where(ArxItem.token_id == token_id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        return {"verified": False, "reason": "Item not found", "token_id": token_id}

    # If chip_uid provided, verify against stored hash
    chip_verified = True
    if chip_uid and item.chip_key_hash:
        chip_hash = hashlib.sha256(chip_uid.encode()).hexdigest()
        chip_verified = chip_hash == item.chip_key_hash

    # Get transaction count
    tx_result = await db.execute(
        select(func.count(ArxTransaction.id)).where(ArxTransaction.token_id == token_id)
    )
    tx_count = tx_result.scalar() or 0

    return {
        "verified": True,
        "chip_verified": chip_verified,
        "token_id": token_id,
        "item_name": item.item_name,
        "serial_number": item.serial_number,
        "edition": item.edition,
        "language": item.language,
        "current_owner": item.current_owner,
        "purchase_price_usd": float(item.purchase_price_usd) if item.purchase_price_usd else None,
        "minted_at": item.created_at.isoformat() if item.created_at else None,
        "last_transfer_at": item.last_transfer_at.isoformat() if item.last_transfer_at else None,
        "transaction_count": tx_count,
        "qr_code_url": item.qr_code_url,
    }


async def transfer_arx_item(
    db: AsyncSession,
    *,
    token_id: int,
    from_address: str,
    to_address: str,
    sale_price_usd: float | None = None,
) -> dict:
    """CRS-NEW-12.03: Transfer ARX item ownership (sale or gift).

    I/O: token_id + from/to addresses + optional price → dict with new ownership
    QR codes sent to BOTH buyer AND seller (timestamped).
    """
    result = await db.execute(
        select(ArxItem).where(ArxItem.token_id == token_id)
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise ValueError(f"ARX item {token_id} not found")
    if item.current_owner != from_address:
        raise ValueError(f"Not the current owner")

    # Update ownership
    now = datetime.now(timezone.utc)
    item.current_owner = to_address
    item.last_transfer_at = now
    if sale_price_usd is not None:
        item.purchase_price_usd = sale_price_usd

    # Generate new QR for new owner
    verification_hash = hashlib.sha256(
        f"{token_id}:{to_address}:{now.isoformat()}".encode()
    ).hexdigest()
    item.qr_code_url = _generate_qr_url(token_id, verification_hash)

    # Log transaction
    tx_type = "sale" if sale_price_usd else "transfer"
    tx_id = _next_tx_id()
    tx = ArxTransaction(
        arx_tx_id=tx_id,
        token_id=token_id,
        from_address=from_address,
        to_address=to_address,
        price_usd=sale_price_usd,
        transaction_type=tx_type,
    )
    db.add(tx)
    await db.flush()

    logger.info("cube12.arx.transferred", extra={
        "token_id": token_id, "from": from_address,
        "to": to_address, "type": tx_type,
    })

    return {
        "token_id": token_id,
        "arx_tx_id": tx_id,
        "from_address": from_address,
        "to_address": to_address,
        "sale_price_usd": sale_price_usd,
        "transaction_type": tx_type,
        "transferred_at": now.isoformat(),
        "buyer_qr_url": item.qr_code_url,
        "seller_qr_url": _generate_qr_url(token_id, hashlib.sha256(
            f"{token_id}:{from_address}:sold:{now.isoformat()}".encode()
        ).hexdigest()),
        "status": "transferred",
    }


async def get_arx_item(
    db: AsyncSession,
    token_id: int,
) -> dict | None:
    """CRS-NEW-12.04: Get full item details + transaction history."""
    result = await db.execute(
        select(ArxItem).where(ArxItem.token_id == token_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        return None

    # Get transaction history
    tx_result = await db.execute(
        select(ArxTransaction)
        .where(ArxTransaction.token_id == token_id)
        .order_by(ArxTransaction.created_at)
    )
    transactions = [
        {
            "arx_tx_id": tx.arx_tx_id,
            "from": tx.from_address,
            "to": tx.to_address,
            "price_usd": float(tx.price_usd) if tx.price_usd else None,
            "type": tx.transaction_type,
            "timestamp": tx.created_at.isoformat() if tx.created_at else None,
        }
        for tx in tx_result.scalars().all()
    ]

    return {
        "token_id": item.token_id,
        "item_name": item.item_name,
        "serial_number": item.serial_number,
        "edition": item.edition,
        "language": item.language,
        "current_owner": item.current_owner,
        "purchase_price_usd": float(item.purchase_price_usd) if item.purchase_price_usd else None,
        "qr_code_url": item.qr_code_url,
        "chip_key_hash": item.chip_key_hash,
        "minted_at": item.created_at.isoformat() if item.created_at else None,
        "last_transfer_at": item.last_transfer_at.isoformat() if item.last_transfer_at else None,
        "transactions": transactions,
        "transaction_count": len(transactions),
    }


async def list_marketplace(
    db: AsyncSession,
    limit: int = 20,
) -> list[dict]:
    """CRS-NEW-12.05: List all ARX items (future: filter by for_sale status)."""
    result = await db.execute(
        select(ArxItem).order_by(ArxItem.created_at.desc()).limit(limit)
    )
    items = result.scalars().all()
    return [
        {
            "token_id": item.token_id,
            "item_name": item.item_name,
            "edition": item.edition,
            "current_owner": item.current_owner,
            "purchase_price_usd": float(item.purchase_price_usd) if item.purchase_price_usd else None,
            "qr_code_url": item.qr_code_url,
        }
        for item in items
    ]
