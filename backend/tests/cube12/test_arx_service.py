"""Cube 12 — NFT ARX Service Tests.

Tests mint, verify, transfer, get, and marketplace functions.
All mocked — no real Supabase or Quai calls.

CRS: CRS-NEW-12.01 through 12.05
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube12_divinity_nft.service import (
    mint_arx_item,
    verify_arx_chip,
    transfer_arx_item,
    get_arx_item,
    list_marketplace,
    _generate_qr_url,
    _next_tx_id,
)


class TestMintArxItem:
    """CRS-NEW-12.01: Mint new NFT for physical item."""

    @pytest.mark.asyncio
    async def test_mint_returns_token_id(self):
        db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 0
        db.execute = AsyncMock(return_value=count_result)

        async def mock_refresh(obj):
            obj.id = uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)
        db.refresh = AsyncMock(side_effect=mock_refresh)

        result = await mint_arx_item(
            db,
            item_name="The Divinity Guide — First Edition",
            purchase_price_usd=33.33,
            buyer_address="user-001",
            serial_number="DG-2026-001",
            identifiers="limited, proof",
            language="en",
        )

        assert result["status"] == "minted"
        assert result["token_id"] > 0  # Timestamp-based, always positive
        assert result["item_name"] == "The Divinity Guide — First Edition"
        assert result["purchase_price_usd"] == 33.33
        assert result["identifiers"] == "limited, proof"
        assert "qr_code_url" in result
        assert "arx_tx_id" in result
        assert result["arx_tx_id"].startswith("ARX-")

    @pytest.mark.asyncio
    async def test_mint_generates_qr(self):
        db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 5
        db.execute = AsyncMock(return_value=count_result)
        async def mock_refresh(obj):
            obj.id = uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)
        db.refresh = AsyncMock(side_effect=mock_refresh)

        result = await mint_arx_item(
            db, item_name="Art Print", purchase_price_usd=99.99,
            buyer_address="buyer-002",
        )

        assert "divinity-guide/arx" in result["qr_code_url"]
        assert result["verification_hash"] is not None


class TestVerifyArxChip:
    """CRS-NEW-12.02: Verify item authenticity."""

    @pytest.mark.asyncio
    async def test_verified_item(self):
        db = AsyncMock()
        item = MagicMock()
        item.token_id = 1
        item.item_name = "Test Book"
        item.serial_number = "SN-001"
        item.identifiers = "original, signed"
        item.language = "en"
        item.current_owner = "owner-001"
        item.purchase_price_usd = 33.33
        item.chip_key_hash = None
        item.created_at = datetime.now(timezone.utc)
        item.last_transfer_at = None
        item.qr_code_url = "https://example.com/arx?token=1"

        item_result = MagicMock()
        item_result.scalar_one_or_none.return_value = item
        tx_result = MagicMock()
        tx_result.scalar.return_value = 2

        db.execute = AsyncMock(side_effect=[item_result, tx_result])

        result = await verify_arx_chip(db, token_id=1)
        assert result["verified"] is True
        assert result["item_name"] == "Test Book"
        assert result["transaction_count"] == 2

    @pytest.mark.asyncio
    async def test_not_found(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute = AsyncMock(return_value=mock_result)

        result = await verify_arx_chip(db, token_id=999)
        assert result["verified"] is False


class TestTransferArxItem:
    """CRS-NEW-12.03: Transfer ownership."""

    @pytest.mark.asyncio
    async def test_successful_sale(self):
        db = AsyncMock()
        item = MagicMock()
        item.token_id = 1
        item.current_owner = "seller-001"
        item.qr_code_url = ""

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = item
        db.execute = AsyncMock(return_value=mock_result)

        result = await transfer_arx_item(
            db, token_id=1,
            from_address="seller-001", to_address="buyer-002",
            sale_price_usd=44.44,
        )

        assert result["status"] == "transferred"
        assert result["transaction_type"] == "sale"
        assert result["sale_price_usd"] == 44.44
        assert "buyer_qr_url" in result
        assert "seller_qr_url" in result

    @pytest.mark.asyncio
    async def test_gift_transfer(self):
        db = AsyncMock()
        item = MagicMock()
        item.token_id = 1
        item.current_owner = "giver-001"
        item.qr_code_url = ""

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = item
        db.execute = AsyncMock(return_value=mock_result)

        result = await transfer_arx_item(
            db, token_id=1,
            from_address="giver-001", to_address="receiver-002",
        )

        assert result["transaction_type"] == "transfer"
        assert result["sale_price_usd"] is None

    @pytest.mark.asyncio
    async def test_not_owner_rejected(self):
        db = AsyncMock()
        item = MagicMock()
        item.token_id = 1
        item.current_owner = "real-owner"

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = item
        db.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(ValueError, match="Not the current owner"):
            await transfer_arx_item(
                db, token_id=1,
                from_address="imposter", to_address="buyer",
            )

    @pytest.mark.asyncio
    async def test_item_not_found(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(ValueError, match="not found"):
            await transfer_arx_item(
                db, token_id=999,
                from_address="a", to_address="b",
            )


class TestHelpers:
    """Helper function tests."""

    def test_qr_url_format(self):
        url = _generate_qr_url(42, "abc123def456")
        assert "token=42" in url
        assert "verify=abc123def456" in url
        assert "divinity-guide/arx" in url

    def test_tx_id_format(self):
        tx_id = _next_tx_id()
        assert tx_id.startswith("ARX-")
        assert len(tx_id) == 17  # ARX-YYYY-XXXXXXXX (UUID hex, 8 chars)

    def test_tx_ids_are_unique(self):
        """UUID-based TX IDs are unique (no global counter race condition)."""
        ids = {_next_tx_id() for _ in range(100)}
        assert len(ids) == 100  # All unique


class TestGetArxItem:
    """CRS-NEW-12.04: Get item details."""

    @pytest.mark.asyncio
    async def test_returns_none_for_missing(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute = AsyncMock(return_value=mock_result)

        result = await get_arx_item(db, token_id=999)
        assert result is None

    @pytest.mark.asyncio
    async def test_self_transfer_rejected(self):
        db = AsyncMock()
        item = MagicMock()
        item.token_id = 1
        item.current_owner = "same-user"
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = item
        db.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(ValueError, match="Cannot transfer to yourself"):
            await transfer_arx_item(
                db, token_id=1,
                from_address="same-user", to_address="same-user",
            )


class TestListMarketplace:
    """CRS-NEW-12.05: List marketplace."""

    @pytest.mark.asyncio
    async def test_returns_list(self):
        db = AsyncMock()
        item = MagicMock()
        item.token_id = 1
        item.item_name = "Book"
        item.identifiers = "limited, proof"
        item.current_owner = "owner"
        item.purchase_price_usd = 33.33
        item.qr_code_url = "https://example.com"
        mock_result = MagicMock()
        mock_result.scalars.return_value = MagicMock(all=MagicMock(return_value=[item]))
        db.execute = AsyncMock(return_value=mock_result)

        result = await list_marketplace(db, limit=10)
        assert len(result) == 1
        assert result[0]["item_name"] == "Book"
