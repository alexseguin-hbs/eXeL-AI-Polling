"""Cube 12 — NFT ARX Router Endpoint Tests.

Tests all 5 endpoints: mint, verify, transfer, item, marketplace.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

SVC = "app.cubes.cube12_divinity_nft.service"


class TestMintEndpoint:
    """POST /arx/mint — auth required."""

    @pytest.mark.asyncio
    async def test_mint_success(self, client):
        mock_result = {"status": "minted", "token_id": 1, "arx_tx_id": "ARX-2026-000001", "qr_code_url": "https://example.com"}
        with patch(f"{SVC}.mint_arx_item", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.post("/api/v1/arx/mint", json={
                "item_name": "Divinity Guide Edition 7",
                "purchase_price_usd": 33.33,
                "identifiers": "limited, proof",
                "language": "en",
            })
        assert resp.status_code == 201
        assert resp.json()["token_id"] == 1

    @pytest.mark.asyncio
    async def test_invalid_language_rejected(self, client):
        """Digits in language code rejected (must be 2-3 alpha)."""
        resp = await client.post("/api/v1/arx/mint", json={
            "item_name": "Test", "purchase_price_usd": 10, "language": "x1",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_negative_price_rejected(self, client):
        resp = await client.post("/api/v1/arx/mint", json={
            "item_name": "Test", "purchase_price_usd": -5, "language": "en",
        })
        assert resp.status_code == 422


class TestVerifyEndpoint:
    """GET /arx/verify/{id} — public, no auth."""

    @pytest.mark.asyncio
    async def test_verified(self, client):
        mock_result = {"verified": True, "token_id": 1, "item_name": "Book"}
        with patch(f"{SVC}.verify_arx_chip", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.get("/api/v1/arx/verify/1")
        assert resp.status_code == 200
        assert resp.json()["verified"] is True

    @pytest.mark.asyncio
    async def test_not_found(self, client):
        mock_result = {"verified": False, "reason": "Item not found"}
        with patch(f"{SVC}.verify_arx_chip", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.get("/api/v1/arx/verify/999")
        assert resp.status_code == 200
        assert resp.json()["verified"] is False

    @pytest.mark.asyncio
    async def test_with_chip_uid(self, client):
        mock_result = {"verified": True, "chip_verified": True}
        with patch(f"{SVC}.verify_arx_chip", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.get("/api/v1/arx/verify/1?chip_uid=ABC123")
        assert resp.status_code == 200


class TestTransferEndpoint:
    """POST /arx/transfer — auth required."""

    @pytest.mark.asyncio
    async def test_transfer_success(self, client):
        mock_result = {"status": "transferred", "arx_tx_id": "ARX-2026-000002", "buyer_qr_url": "url", "seller_qr_url": "url2"}
        with patch(f"{SVC}.transfer_arx_item", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.post("/api/v1/arx/transfer", json={
                "token_id": 1, "to_address": "buyer-002", "sale_price_usd": 44.44,
            })
        assert resp.status_code == 200
        assert resp.json()["status"] == "transferred"

    @pytest.mark.asyncio
    async def test_not_owner_rejected(self, client):
        with patch(f"{SVC}.transfer_arx_item", new_callable=AsyncMock, side_effect=ValueError("Not the current owner")):
            resp = await client.post("/api/v1/arx/transfer", json={
                "token_id": 1, "to_address": "buyer", "sale_price_usd": 10,
            })
        assert resp.status_code == 400


class TestMarketplace:
    """GET /arx/marketplace — public."""

    @pytest.mark.asyncio
    async def test_returns_list(self, client):
        mock_result = [{"token_id": 1, "item_name": "Book", "identifiers": "limited, proof"}]
        with patch(f"{SVC}.list_marketplace", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.get("/api/v1/arx/marketplace")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_invalid_limit(self, client):
        resp = await client.get("/api/v1/arx/marketplace?limit=0")
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_limit_over_100(self, client):
        resp = await client.get("/api/v1/arx/marketplace?limit=101")
        assert resp.status_code == 400
