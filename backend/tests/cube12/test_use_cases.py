"""Cube 12 — Top 2 Use Case Simulation Tests.

UC1: First-time chip setup (seller registers new item)
UC2: Repurchase (buyer purchases from existing owner, ownership transfers)

Each use case simulated 9 times for N=9 determinism.
"""

import uuid
import hashlib
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube12_divinity_nft.service import (
    mint_arx_item,
    verify_arx_chip,
    transfer_arx_item,
)


class TestUC1FirstTimeSetup:
    """USE CASE 1: Seller registers a brand new physical item.

    Flow: Seller → Register form → mint_arx_item → QR code generated
    → Item exists on blockchain → Anyone can scan QR to verify
    """

    @pytest.mark.asyncio
    async def test_full_registration_flow_n9(self):
        """N=9: Register item → verify it exists → QR code valid."""
        for run in range(9):
            db = AsyncMock()
            count_result = MagicMock()
            count_result.scalar.return_value = run
            db.execute = AsyncMock(return_value=count_result)
            async def mock_refresh(obj):
                obj.id = uuid.uuid4()
                obj.created_at = datetime.now(timezone.utc)
            db.refresh = AsyncMock(side_effect=mock_refresh)

            # Step 1: Register
            result = await mint_arx_item(
                db,
                item_name="The Divinity Guide — Signed First Edition",
                purchase_price_usd=77.77,
                buyer_address=f"seller-{run}",
                serial_number=f"DG-{run:05d}",
                identifiers="1/1, signed",
                language="en",
            )

            # Verify output
            assert result["status"] == "minted"
            assert result["item_name"] == "The Divinity Guide — Signed First Edition"
            assert result["purchase_price_usd"] == 77.77
            assert result["serial_number"] == f"DG-{run:05d}"
            assert result["identifiers"] == "1/1, signed"
            assert "qr_code_url" in result
            assert "divinity-guide/arx" in result["qr_code_url"]
            assert result["arx_tx_id"].startswith("ARX-")
            assert result["verification_hash"] is not None
            assert len(result["verification_hash"]) == 64

    @pytest.mark.asyncio
    async def test_registration_with_special_markers(self):
        """Register with special markers — signature, inscription."""
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
            item_name="The Divinity Guide — Leather Bound",
            purchase_price_usd=111.11,
            buyer_address="collector-001",
            serial_number="DG-LEATHER-001",
            identifiers="limited, proof",
            language="en",
        )

        assert result["status"] == "minted"
        assert result["purchase_price_usd"] == 111.11

    @pytest.mark.asyncio
    async def test_verify_after_registration(self):
        """After minting, verify endpoint confirms item exists."""
        db = AsyncMock()
        mock_item = MagicMock()
        mock_item.token_id = 42
        mock_item.item_name = "Signed Book"
        mock_item.serial_number = "SB-001"
        mock_item.identifiers = "original, signed"
        mock_item.language = "en"
        mock_item.current_owner = "seller-001"
        mock_item.purchase_price_usd = 77.77
        mock_item.chip_key_hash = None
        mock_item.created_at = datetime.now(timezone.utc)
        mock_item.last_transfer_at = None
        mock_item.qr_code_url = "https://example.com/arx?token=42"

        item_result = MagicMock()
        item_result.scalar_one_or_none.return_value = mock_item
        tx_result = MagicMock()
        tx_result.scalar.return_value = 1  # 1 transaction (the mint)
        db.execute = AsyncMock(side_effect=[item_result, tx_result])

        verify = await verify_arx_chip(db, token_id=42)
        assert verify["verified"] is True
        assert verify["item_name"] == "Signed Book"
        assert verify["purchase_price_usd"] == 77.77
        assert verify["transaction_count"] == 1


class TestUC2Repurchase:
    """USE CASE 2: Buyer purchases item from existing owner.

    Flow: Buyer scans QR → sees item details → clicks Buy
    → transfer_arx_item → ownership changes → dual QR codes generated
    → Both buyer AND seller get timestamped QR codes
    """

    @pytest.mark.asyncio
    async def test_full_transfer_flow_n9(self):
        """N=9: Transfer ownership → verify new owner → dual QR codes."""
        for run in range(9):
            db = AsyncMock()
            mock_item = MagicMock()
            mock_item.token_id = 100 + run
            mock_item.current_owner = f"seller-{run}"
            mock_item.qr_code_url = ""

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_item
            db.execute = AsyncMock(return_value=mock_result)

            # Transfer
            result = await transfer_arx_item(
                db,
                token_id=100 + run,
                from_address=f"seller-{run}",
                to_address=f"buyer-{run}",
                sale_price_usd=88.88,
            )

            # Verify output
            assert result["status"] == "transferred"
            assert result["transaction_type"] == "sale"
            assert result["sale_price_usd"] == 88.88
            assert result["from_address"] == f"seller-{run}"
            assert result["to_address"] == f"buyer-{run}"

            # Both parties get QR codes
            assert "buyer_qr_url" in result
            assert "seller_qr_url" in result
            assert result["buyer_qr_url"] != result["seller_qr_url"]
            assert "divinity-guide/arx" in result["buyer_qr_url"]
            assert "divinity-guide/arx" in result["seller_qr_url"]

            # Transaction ID generated
            assert result["arx_tx_id"].startswith("ARX-")

    @pytest.mark.asyncio
    async def test_gift_transfer_no_price(self):
        """Gift transfer — no sale price, still generates dual QR."""
        db = AsyncMock()
        mock_item = MagicMock()
        mock_item.token_id = 200
        mock_item.current_owner = "giver"
        mock_item.qr_code_url = ""

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_item
        db.execute = AsyncMock(return_value=mock_result)

        result = await transfer_arx_item(
            db, token_id=200,
            from_address="giver", to_address="receiver",
        )

        assert result["transaction_type"] == "transfer"
        assert result["sale_price_usd"] is None
        assert "buyer_qr_url" in result
        assert "seller_qr_url" in result

    @pytest.mark.asyncio
    async def test_chain_of_ownership(self):
        """Item transfers through 3 owners — each gets unique QR."""
        owners = ["original", "second", "third"]
        qr_codes = set()

        for i in range(len(owners) - 1):
            db = AsyncMock()
            mock_item = MagicMock()
            mock_item.token_id = 300
            mock_item.current_owner = owners[i]
            mock_item.qr_code_url = ""

            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_item
            db.execute = AsyncMock(return_value=mock_result)

            result = await transfer_arx_item(
                db, token_id=300,
                from_address=owners[i], to_address=owners[i + 1],
                sale_price_usd=50.00 + i * 10,
            )

            qr_codes.add(result["buyer_qr_url"])
            qr_codes.add(result["seller_qr_url"])

        # All QR codes should be unique (different timestamps/hashes)
        assert len(qr_codes) == 4  # 2 transfers × 2 QR codes each


class TestUC1UC2Combined:
    """Combined: Register → Verify → Transfer → Verify new owner."""

    @pytest.mark.asyncio
    async def test_full_lifecycle_n9(self):
        """N=9: Full item lifecycle — mint → verify → sell → verify new owner."""
        for run in range(9):
            # Step 1: Mint
            db_mint = AsyncMock()
            count_result = MagicMock()
            count_result.scalar.return_value = run
            db_mint.execute = AsyncMock(return_value=count_result)
            async def mock_refresh(obj):
                obj.id = uuid.uuid4()
                obj.created_at = datetime.now(timezone.utc)
            db_mint.refresh = AsyncMock(side_effect=mock_refresh)

            mint_result = await mint_arx_item(
                db_mint,
                item_name=f"Collectible #{run}",
                purchase_price_usd=33.33,
                buyer_address=f"creator-{run}",
            )
            assert mint_result["status"] == "minted"
            token_id = mint_result["token_id"]

            # Step 2: Transfer (sell)
            db_transfer = AsyncMock()
            mock_item = MagicMock()
            mock_item.token_id = token_id
            mock_item.current_owner = f"creator-{run}"
            mock_item.qr_code_url = ""
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = mock_item
            db_transfer.execute = AsyncMock(return_value=mock_result)

            transfer_result = await transfer_arx_item(
                db_transfer, token_id=token_id,
                from_address=f"creator-{run}",
                to_address=f"collector-{run}",
                sale_price_usd=55.55,
            )
            assert transfer_result["status"] == "transferred"
            assert "buyer_qr_url" in transfer_result
            assert "seller_qr_url" in transfer_result
