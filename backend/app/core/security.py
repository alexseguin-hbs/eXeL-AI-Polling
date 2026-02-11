"""Encryption and hashing utilities."""

import hashlib
import hmac

from cryptography.fernet import Fernet

from app.config import settings

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        if not settings.encryption_key:
            _fernet = Fernet(Fernet.generate_key())
        else:
            _fernet = Fernet(settings.encryption_key.encode())
    return _fernet


def encrypt_payload(plaintext: str) -> str:
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt_payload(ciphertext: str) -> str:
    return _get_fernet().decrypt(ciphertext.encode()).decode()


def anonymize_user_id(user_id: str, session_salt: str) -> str:
    """Create a session-scoped anonymous hash for a user."""
    return hmac.new(
        session_salt.encode(), user_id.encode(), hashlib.sha256
    ).hexdigest()[:16]
