"""RBAC permission enforcement."""

from fastapi import Depends, HTTPException, status

from app.core.auth import CurrentUser, get_current_user

VALID_ROLES = {"moderator", "user", "lead_developer", "admin"}


def require_role(*roles: str):
    """Dependency factory that enforces role-based access."""

    async def _check_role(
        current_user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if current_user.role not in roles and "admin" not in current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' not authorized. Required: {roles}",
            )
        return current_user

    return _check_role
