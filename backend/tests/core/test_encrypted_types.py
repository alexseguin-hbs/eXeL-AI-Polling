"""C2-1 lock: EncryptedText transparently encrypts at rest, opt-in on ENCRYPTION_KEY."""

import pytest
from cryptography.fernet import Fernet

from app.core import security
from app.core.encrypted_types import _MARKER, EncryptedText


@pytest.fixture(autouse=True)
def _reset_fernet():
    security._fernet = None
    yield
    security._fernet = None


def _t():
    return EncryptedText()


def test_round_trip_with_key(monkeypatch):
    monkeypatch.setattr(security.settings, "encryption_key", Fernet.generate_key().decode(), raising=False)
    t = _t()
    stored = t.process_bind_param("secret raw text", None)
    assert stored != "secret raw text" and stored.startswith(_MARKER)  # encrypted at rest
    assert t.process_result_value(stored, None) == "secret raw text"    # transparent decrypt


def test_plaintext_passthrough_without_key(monkeypatch):
    monkeypatch.setattr(security.settings, "encryption_key", "", raising=False)
    t = _t()
    stored = t.process_bind_param("hello", None)
    assert stored == "hello"                       # no key → current behavior, never lose data
    assert t.process_result_value("hello", None) == "hello"


def test_legacy_plaintext_row_reads_unchanged(monkeypatch):
    # A row written before a key existed has no marker → returned as-is even with a key set.
    monkeypatch.setattr(security.settings, "encryption_key", Fernet.generate_key().decode(), raising=False)
    t = _t()
    assert t.process_result_value("legacy plaintext", None) == "legacy plaintext"


def test_none_is_preserved(monkeypatch):
    monkeypatch.setattr(security.settings, "encryption_key", Fernet.generate_key().decode(), raising=False)
    t = _t()
    assert t.process_bind_param(None, None) is None
    assert t.process_result_value(None, None) is None
