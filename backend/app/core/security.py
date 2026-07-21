"""Encryption and hashing utilities.

Hardened (C2-1 / Phase G): a missing ENCRYPTION_KEY is a SILENT-DATA-LOSS risk
(the old code minted an ephemeral key, so anything encrypted was unrecoverable
after restart). Now: in production a missing/invalid key raises — fail loud, not
lose data; in dev/test the ephemeral key is still allowed (with a warning) so
local runs work. `encryption_configured()` lets callers (AES-at-rest, the BYOK
credential vault) gate on a real key before persisting ciphertext.
"""

import hashlib
import hmac

from cryptography.fernet import Fernet

from app.config import settings

_fernet: Fernet | None = None


def encryption_configured() -> bool:
    """True when a real ENCRYPTION_KEY is set (safe to persist ciphertext)."""
    return bool(settings.encryption_key)


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        if not settings.encryption_key:
            # Production MUST have a durable key — otherwise encrypted data is
            # lost on restart. Fail loud rather than silently corrupt data.
            if getattr(settings, "environment", "development") == "production":
                raise RuntimeError(
                    "ENCRYPTION_KEY is required in production — refusing to encrypt "
                    "with an ephemeral key (data would be unrecoverable on restart)."
                )
            import logging
            logging.getLogger(__name__).warning(
                "ENCRYPTION_KEY not set — using ephemeral key (dev/test only). "
                "Encrypted data will be lost on restart. Set ENCRYPTION_KEY for production."
            )
            _fernet = Fernet(Fernet.generate_key())
        else:
            # Invalid key format raises here — fail loud, not silently.
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
    ).hexdigest()
