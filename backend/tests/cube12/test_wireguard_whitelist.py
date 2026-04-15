"""WireGuard whitelist tests for Cube 12 — ARX Physically Backed Tokens.

Validates strict input whitelists on all Cube 12 Pydantic schemas:
- MintRequest: item_name max 500, serial max 255, identifiers max 2000, language 2-3 alpha, price ≥ 0
- TransferRequest: to_address required, token_id required
- PairChipRequest: chip_address 42-char 0x format

Each test runs N=9 deterministic iterations.
"""

import pytest
from pydantic import ValidationError

from app.cubes.cube12_divinity_nft.router import (
    MintRequest,
    TransferRequest,
    PairChipRequest,
    VALID_LANGUAGES,
)


# ---------------------------------------------------------------------------
# Cube 12 WireGuard — MintRequest Validation
# ---------------------------------------------------------------------------

class TestWireGuardMintLanguage:
    """language must be 2-3 lowercase alpha."""

    def test_valid_languages_n9(self):
        for _ in range(9):
            for lang in VALID_LANGUAGES:
                obj = MintRequest(item_name="Test", purchase_price_usd=10.0, language=lang)
                assert obj.language == lang

    def test_invalid_language_rejected_n9(self):
        invalid = ["X", "x1", "ENGLISH", "en-US", "1a", "", "abcd", "EN", "  en"]
        for _ in range(9):
            for lang in invalid:
                with pytest.raises(ValidationError):
                    MintRequest(item_name="Test", purchase_price_usd=10.0, language=lang)


class TestWireGuardMintPrice:
    """purchase_price_usd must be ≥ 0."""

    def test_valid_prices_n9(self):
        for _ in range(9):
            for price in (0, 0.01, 1.11, 33.33, 9999.99):
                obj = MintRequest(item_name="Test", purchase_price_usd=price)
                assert obj.purchase_price_usd == price

    def test_negative_price_rejected_n9(self):
        for _ in range(9):
            for price in (-0.01, -1, -100):
                with pytest.raises(ValidationError):
                    MintRequest(item_name="Test", purchase_price_usd=price)


class TestWireGuardMintItemName:
    """item_name required, max 500 chars."""

    def test_valid_names_n9(self):
        for _ in range(9):
            obj = MintRequest(item_name="A" * 500, purchase_price_usd=10.0)
            assert len(obj.item_name) == 500

    def test_too_long_rejected_n9(self):
        for _ in range(9):
            with pytest.raises(ValidationError):
                MintRequest(item_name="A" * 501, purchase_price_usd=10.0)

    def test_empty_name_rejected(self):
        with pytest.raises(ValidationError):
            MintRequest(item_name="", purchase_price_usd=10.0)


class TestWireGuardMintSerialNumber:
    """serial_number optional, max 255 chars."""

    def test_valid_serial_n9(self):
        for _ in range(9):
            obj = MintRequest(item_name="Test", purchase_price_usd=10.0, serial_number="DG-001")
            assert obj.serial_number == "DG-001"

    def test_too_long_serial_rejected_n9(self):
        for _ in range(9):
            with pytest.raises(ValidationError):
                MintRequest(item_name="Test", purchase_price_usd=10.0, serial_number="S" * 256)

    def test_null_serial_allowed(self):
        obj = MintRequest(item_name="Test", purchase_price_usd=10.0)
        assert obj.serial_number is None


class TestWireGuardMintIdentifiers:
    """identifiers optional, max 2000 chars."""

    def test_valid_identifiers_n9(self):
        for _ in range(9):
            obj = MintRequest(item_name="Test", purchase_price_usd=10.0, identifiers="signed, 1/1")
            assert obj.identifiers == "signed, 1/1"

    def test_too_long_identifiers_rejected_n9(self):
        for _ in range(9):
            with pytest.raises(ValidationError):
                MintRequest(item_name="Test", purchase_price_usd=10.0, identifiers="I" * 2001)


class TestWireGuardMintPurchaseDate:
    """purchase_date optional string (YYYY-MM-DD)."""

    def test_valid_dates_n9(self):
        for _ in range(9):
            obj = MintRequest(item_name="Test", purchase_price_usd=10.0, purchase_date="2025-07-25")
            assert obj.purchase_date == "2025-07-25"

    def test_null_date_allowed(self):
        obj = MintRequest(item_name="Test", purchase_price_usd=10.0)
        assert obj.purchase_date is None


# ---------------------------------------------------------------------------
# Cube 12 WireGuard — PairChipRequest Validation
# ---------------------------------------------------------------------------

class TestWireGuardPairChipAddress:
    """chip_address must be 42-char 0x hex address."""

    def test_valid_address_n9(self):
        for _ in range(9):
            addr = "0x" + "a" * 40
            obj = PairChipRequest(token_id=1, chip_address=addr)
            assert obj.chip_address == addr

    def test_invalid_addresses_rejected_n9(self):
        invalid = [
            "0x",           # too short
            "0x" + "g" * 40,  # non-hex
            "0x" + "a" * 39,  # 41 chars
            "0x" + "a" * 41,  # 43 chars
            "abc123",        # no 0x prefix
            "",              # empty
        ]
        for _ in range(9):
            for addr in invalid:
                with pytest.raises(ValidationError):
                    PairChipRequest(token_id=1, chip_address=addr)


# ---------------------------------------------------------------------------
# Cube 12 WireGuard — TransferRequest Validation
# ---------------------------------------------------------------------------

class TestWireGuardTransferRequired:
    """token_id and to_address are required."""

    def test_valid_transfer_n9(self):
        for _ in range(9):
            obj = TransferRequest(token_id=214274013, to_address="buyer@test.com")
            assert obj.token_id == 214274013

    def test_missing_to_address_rejected(self):
        with pytest.raises(ValidationError):
            TransferRequest(token_id=1, to_address="")
