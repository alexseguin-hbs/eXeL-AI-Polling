"""C2-1 / Phase G lock: encryption primitive hardening.

A missing ENCRYPTION_KEY must fail loud in production (no silent ephemeral key =
data loss), while dev/test still works. encrypt/decrypt round-trips with a key.
"""

import pytest
from cryptography.fernet import Fernet

from app.core import security


@pytest.fixture(autouse=True)
def _reset_fernet():
    security._fernet = None
    yield
    security._fernet = None


def test_round_trip_with_valid_key(monkeypatch):
    key = Fernet.generate_key().decode()
    monkeypatch.setattr(security.settings, "encryption_key", key, raising=False)
    ct = security.encrypt_payload("sensitive raw text")
    assert ct != "sensitive raw text"
    assert security.decrypt_payload(ct) == "sensitive raw text"
    assert security.encryption_configured() is True


def test_encryption_configured_false_without_key(monkeypatch):
    monkeypatch.setattr(security.settings, "encryption_key", "", raising=False)
    assert security.encryption_configured() is False


def test_production_without_key_raises(monkeypatch):
    monkeypatch.setattr(security.settings, "encryption_key", "", raising=False)
    monkeypatch.setattr(security.settings, "environment", "production", raising=False)
    with pytest.raises(RuntimeError, match="ENCRYPTION_KEY is required"):
        security.encrypt_payload("x")


def test_dev_without_key_uses_ephemeral(monkeypatch):
    monkeypatch.setattr(security.settings, "encryption_key", "", raising=False)
    monkeypatch.setattr(security.settings, "environment", "development", raising=False)
    ct = security.encrypt_payload("dev text")
    assert security.decrypt_payload(ct) == "dev text"
