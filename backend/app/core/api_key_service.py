"""API key CRUD + verification service.

Keys are generated as `exel_<43-char url-safe secret>`; only a SHA-256 hash and a short
display prefix are stored. `generate_api_key` returns the full key ONCE (the caller must
surface it to the user immediately). `authenticate_api_key` resolves a presented key to
its active, non-expired record and stamps `last_used_at`.
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import API_KEY_PREFIX, ApiKey

_SECRET_BYTES = 32  # → 43 url-safe chars


def _hash_key(full_key: str) -> str:
    return hashlib.sha256(full_key.encode()).hexdigest()


def _new_key() -> tuple[str, str]:
    """Return (full_key, display_prefix). Full key is shown once; prefix is safe to store."""
    secret = secrets.token_urlsafe(_SECRET_BYTES)
    full_key = f"{API_KEY_PREFIX}{secret}"
    return full_key, full_key[: len(API_KEY_PREFIX) + 6]


async def create_api_key(
    db: AsyncSession, *, org_id: str, name: str, created_by: str,
    scopes: str = "*", expires_at: datetime | None = None,
) -> tuple[ApiKey, str]:
    """Create a key. Returns (record, full_key). The full key is NOT recoverable later."""
    full_key, prefix = _new_key()
    rec = ApiKey(
        org_id=org_id, name=name, key_prefix=prefix, key_hash=_hash_key(full_key),
        scopes=scopes or "*", created_by=created_by, expires_at=expires_at,
    )
    db.add(rec)
    await db.flush()
    return rec, full_key


async def list_api_keys(db: AsyncSession, *, org_id: str, include_revoked: bool = False) -> list[ApiKey]:
    stmt = select(ApiKey).where(ApiKey.org_id == org_id)
    if not include_revoked:
        stmt = stmt.where(ApiKey.is_active.is_(True))
    stmt = stmt.order_by(ApiKey.created_at.desc())
    return list((await db.execute(stmt)).scalars().all())


async def revoke_api_key(db: AsyncSession, *, key_id: uuid.UUID, org_id: str) -> bool:
    """Revoke a key (org-scoped). Returns False if not found / already revoked."""
    res = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.org_id == org_id)
    )
    rec = res.scalar_one_or_none()
    if rec is None or not rec.is_active:
        return False
    rec.is_active = False
    rec.revoked_at = datetime.now(timezone.utc)
    await db.flush()
    return True


async def authenticate_api_key(db: AsyncSession, presented_key: str) -> ApiKey | None:
    """Resolve a presented key to its ACTIVE, non-expired record, or None. Stamps last_used_at.

    Constant work regardless of validity beyond the indexed hash lookup — no key material
    is compared in Python, only the hash, so timing does not leak which prefix matched."""
    if not presented_key or not presented_key.startswith(API_KEY_PREFIX):
        return None
    res = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == _hash_key(presented_key))
    )
    rec = res.scalar_one_or_none()
    if rec is None or not rec.is_active:
        return None
    if rec.expires_at is not None and datetime.now(timezone.utc) >= _aware(rec.expires_at):
        return None
    rec.last_used_at = datetime.now(timezone.utc)
    await db.flush()
    return rec


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
