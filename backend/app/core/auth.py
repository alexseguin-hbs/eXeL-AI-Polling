from dataclasses import dataclass

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

_jwks_cache: dict | None = None


@dataclass
class CurrentUser:
    user_id: str
    email: str | None
    role: str
    permissions: list[str]


async def _get_jwks() -> dict:
    """Fetch and cache Auth0 JWKS."""
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://{settings.auth0_domain}/.well-known/jwks.json"
            )
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    """Validate Auth0 JWT and extract user info."""
    token = credentials.credentials

    try:
        jwks = await _get_jwks()
        unverified_header = jwt.get_unverified_header(token)

        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header.get("kid"):
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
                break

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
        jwks = await _get_jwks()
        unverified_header = jwt.get_unverified_header(credentials.credentials)

        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header.get("kid"):
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
                break

        if not rsa_key:
            return None

        payload = jwt.decode(
            credentials.credentials,
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

    except (JWTError, Exception):
        return None
