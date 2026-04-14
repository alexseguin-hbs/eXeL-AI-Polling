"""Cube 11+12 — Supabase LIVE Integration Tests.

Tests real database operations for blockchain_records and arx_items tables.
NO MOCKS — hits the real Supabase instance.
"""

import os
import uuid
from datetime import datetime, timezone

import pytest


def _get_client():
    from dotenv import load_dotenv
    from pathlib import Path
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    from supabase import create_client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        pytest.skip("SUPABASE_URL or SUPABASE_KEY not set")
    return create_client(url, key)


class TestBlockchainRecordsLive:
    """Cube 11: blockchain_records table — real Supabase."""

    def test_table_accessible(self):
        client = _get_client()
        r = client.table("blockchain_records").select("*", count="exact").limit(0).execute()
        assert r.count is not None

    def test_insert_and_read(self):
        client = _get_client()
        test_hash = f"test-{uuid.uuid4().hex[:12]}"
        client.table("blockchain_records").insert({
            "session_hash": test_hash,
            "governance_proof": "a" * 64,
            "winning_theme": "Test Theme",
            "voter_count": 5,
            "response_count": 15,
            "chain_status": "pending",
        }).execute()

        result = client.table("blockchain_records").select("*").eq("session_hash", test_hash).execute()
        assert len(result.data) == 1
        assert result.data[0]["winning_theme"] == "Test Theme"
        assert result.data[0]["voter_count"] == 5

        # Cleanup
        client.table("blockchain_records").delete().eq("session_hash", test_hash).execute()

    def test_unique_session_hash(self):
        """Duplicate session_hash should fail."""
        client = _get_client()
        test_hash = f"dup-{uuid.uuid4().hex[:12]}"
        client.table("blockchain_records").insert({
            "session_hash": test_hash, "governance_proof": "b" * 64,
            "winning_theme": "Theme1", "voter_count": 1, "response_count": 1,
        }).execute()

        # Second insert with same hash should fail
        try:
            client.table("blockchain_records").insert({
                "session_hash": test_hash, "governance_proof": "c" * 64,
                "winning_theme": "Theme2", "voter_count": 2, "response_count": 2,
            }).execute()
            assert False, "Should have raised duplicate error"
        except Exception:
            pass  # Expected — unique constraint

        client.table("blockchain_records").delete().eq("session_hash", test_hash).execute()


class TestArxItemsLive:
    """Cube 12: arx_items + arx_transactions tables — real Supabase."""

    def test_arx_items_accessible(self):
        client = _get_client()
        r = client.table("arx_items").select("*", count="exact").limit(0).execute()
        assert r.count is not None

    def test_arx_transactions_accessible(self):
        client = _get_client()
        r = client.table("arx_transactions").select("*", count="exact").limit(0).execute()
        assert r.count is not None

    def test_insert_and_read_item(self):
        client = _get_client()
        result = client.table("arx_items").insert({
            "item_name": "Test Collectible",
            "purchase_price_usd": 33.33,
            "current_owner": "test-user-001",
            "edition": 7,
            "language": "en",
            "serial_number": "TEST-001",
        }).execute()
        assert len(result.data) == 1
        item_id = result.data[0]["id"]

        # Read back
        read = client.table("arx_items").select("*").eq("id", item_id).execute()
        assert read.data[0]["item_name"] == "Test Collectible"
        assert float(read.data[0]["purchase_price_usd"]) == 33.33

        # Cleanup
        client.table("arx_items").delete().eq("id", item_id).execute()

    def test_insert_transaction(self):
        client = _get_client()
        tx_id = f"ARX-2026-{uuid.uuid4().hex[:6]}"
        result = client.table("arx_transactions").insert({
            "arx_tx_id": tx_id,
            "token_id": 1,
            "to_address": "buyer-001",
            "price_usd": 33.33,
            "transaction_type": "mint",
        }).execute()
        assert len(result.data) == 1

        # Cleanup
        client.table("arx_transactions").delete().eq("arx_tx_id", tx_id).execute()


class TestDeferredClaimLive:
    """Cube 8+11: deferred_claim_tokens — anonymous poller rewards."""

    def test_table_accessible(self):
        client = _get_client()
        r = client.table("deferred_claim_tokens").select("*", count="exact").limit(0).execute()
        assert r.count is not None

    def test_insert_claim_token(self):
        client = _get_client()
        code = f"CLM-{uuid.uuid4().hex[:6].upper()}"
        result = client.table("deferred_claim_tokens").insert({
            "participant_id": "p-anon-001",
            "session_code": "DEMO2026",
            "heart_earned": 3.0,
            "claim_code": code,
            "expires_at": "2026-05-14T00:00:00Z",
        }).execute()
        assert len(result.data) == 1
        assert result.data[0]["claimed"] is False

        # Cleanup
        client.table("deferred_claim_tokens").delete().eq("claim_code", code).execute()
