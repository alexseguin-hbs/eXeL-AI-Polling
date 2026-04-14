import time
from dataclasses import dataclass

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

_dev_mode = not settings.auth0_domain

# CRS-31: Admin panel — RBAC roles: moderator, user, lead_developer, admin
# In dev mode (no Auth0 configured), don't require Authorization header
security = HTTPBearer(auto_error=not _dev_mode)
optional_security = HTTPBearer(auto_error=False)

_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL: int = 3600  # Re-fetch JWKS every 1 hour


@dataclass
class CurrentUser:
    user_id: str
    email: str | None
    role: str
    permissions: list[str]


async def _get_jwks() -> dict:
    """Fetch and cache Auth0 JWKS with a 1-hour TTL."""
    global _jwks_cache, _jwks_fetched_at
    now = time.monotonic()
    if _jwks_cache is None or (now - _jwks_fetched_at) > _JWKS_TTL:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://{settings.auth0_domain}/.well-known/jwks.json"
            )
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_fetched_at = now
    return _jwks_cache


def _find_rsa_key(jwks: dict, unverified_header: dict) -> dict:
    """Find the matching RSA signing key from JWKS."""
    for key in jwks.get("keys", []):
        if key["kid"] == unverified_header.get("kid"):
            return {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
    return {}


async def _decode_token(token: str) -> CurrentUser:
    """Decode and validate an Auth0 JWT, returning the authenticated user.

    Raises HTTPException(401) if the token is invalid or the signing key
    cannot be found.
    """
    jwks = await _get_jwks()
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = _find_rsa_key(jwks, unverified_header)

    if not rsa_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find signing key",
        )

    payload = jwt.decode(
        token,
        rsa_key,
        algorithms=["RS256"],
        audience=settings.auth0_api_audience,
        issuer=f"https://{settings.auth0_domain}/",
    )

    namespace = "https://exel-polling.com"
    return CurrentUser(
        user_id=payload.get("sub", ""),
        email=payload.get(f"{namespace}/email"),
        role=payload.get(f"{namespace}/role", "user"),
        permissions=payload.get("permissions", []),
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser:
    """Validate Auth0 JWT and extract user info.

    In dev mode (AUTH0_DOMAIN empty), returns a mock moderator so that
    authenticated endpoints work without Auth0.
    """
    if _dev_mode:
        return CurrentUser(
            user_id="dev-moderator-001",
            email="dev@exel-ai.com",
            role="moderator",
            permissions=["create:sessions", "manage:sessions"],
        )
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
        )
    try:
        return await _decode_token(credentials.credentials)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
) -> CurrentUser | None:
    """Return authenticated user if Bearer token is present, else None.

    This allows endpoints to accept both authenticated and anonymous requests.
    Invalid or expired tokens are treated as anonymous (returns None).
    """
    if credentials is None:
        return None

    try:
        return await _decode_token(credentials.credentials)
    except (JWTError, Exception):
        return None
