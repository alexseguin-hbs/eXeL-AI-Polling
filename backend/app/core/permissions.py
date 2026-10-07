"""RBAC permission enforcement."""

from fastapi import Depends, HTTPException, status

from app.core.auth import CurrentUser, get_current_user

VALID_ROLES = {"moderator", "user", "lead_developer", "admin"}

# Older call sites and tokens say "lead"; the RBAC role is "lead_developer". One name, both spellings.
ROLE_ALIASES = {"lead": "lead_developer"}


def canonical_role(role: str | None) -> str:
    return ROLE_ALIASES.get(role or "", role or "")


def require_role(*roles: str):
    """Dependency factory that enforces role-based access (exact role match; admin passes)."""
    allowed = {canonical_role(r) for r in roles}

    async def _check_role(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        role = canonical_role(current_user.role)
        # Exact match only: a substring test let any role containing "admin" through.
        if role not in allowed and role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' not authorized. Required: {roles}",
            )
        return current_user

    return _check_role
