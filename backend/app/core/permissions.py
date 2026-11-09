"""RBAC permission enforcement."""

from fastapi import Depends, HTTPException, status

from app.core.auth import CurrentUser, get_current_user

VALID_ROLES = {"moderator", "user", "lead_developer", "admin"}

# Older call sites and tokens say "lead"; the RBAC role is "lead_developer". One name, both spellings.
ROLE_ALIASES = {"lead": "lead_developer"}


def canonical_role(role: str | None) -> str:
    return ROLE_ALIASES.get(role or "", role or "")


def require_role(*roles: str, creator: bool = False):
    """Dependency factory that enforces role-based access (exact role match; admin passes).

    t190u "anyone can poll": every signed-in OAuth user is a creator. A route opts in with
    creator=True ONLY when it is owner-scoped (sessions.created_by == the caller's sub, checked
    by require_session_owner or verify_session_owner) or self-scoped (create / list my polls);
    then an authenticated "user" passes as well as "moderator". Every other route keeps its exact
    roles. Admin / lead_developer never widen; API keys ("api_key") never become creators.
    """
    allowed = {canonical_role(r) for r in roles}
    if creator and "moderator" in allowed:
        allowed.add("user")

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
