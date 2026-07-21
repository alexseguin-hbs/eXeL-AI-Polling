"""Transparent AES (Fernet) encryption-at-rest for SQLAlchemy text columns.

C2-1 / CRS-08.03: applying `EncryptedText` to a column encrypts on write and
decrypts on read at the ORM layer, so EVERY reader across the codebase (export,
theming, voice — the 11 sites that touch raw_text/clean_text) transparently sees
plaintext with no caller change. The DB column stays TEXT (impl = Text), so no
schema migration is required.

Safety / opt-in (Thor): encryption only happens when a real ENCRYPTION_KEY is
configured (`encryption_configured()`). Without a key the value is stored as
plaintext — identical to today's behavior — so nothing breaks in dev/test or a
deployment that hasn't provisioned a key yet. Legacy plaintext rows (written
before a key existed) are detected by the absence of the `enc:v1:` marker and
returned as-is, so enabling a key never orphans existing data.
"""

from cryptography.fernet import InvalidToken
from sqlalchemy.types import Text, TypeDecorator

from app.core.security import decrypt_payload, encrypt_payload, encryption_configured

_MARKER = "enc:v1:"  # distinguishes ciphertext from legacy/plaintext values


class EncryptedText(TypeDecorator):
    """TEXT column that is Fernet-encrypted at rest when ENCRYPTION_KEY is set."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):  # write
        if value is None:
            return None
        if not encryption_configured():
            return value  # no key → plaintext (current behavior; never lose data)
        return _MARKER + encrypt_payload(value)

    def process_result_value(self, value, dialect):  # read
        if value is None:
            return None
        if isinstance(value, str) and value.startswith(_MARKER):
            try:
                return decrypt_payload(value[len(_MARKER):])
            except InvalidToken:
                return value  # wrong/rotated key → return raw rather than crash the read
        return value  # legacy plaintext row (pre-encryption) — pass through unchanged
