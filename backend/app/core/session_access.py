"""One session-ownership rule for every session-scoped route.

Cube 1 checked `verify_session_owner`, the Cube 9 export checked `created_by` inline, and
Cubes 4-8 checked only the role — so any moderator could re-theme, aggregate, override,
subscribe to, read or destroy another moderator's session. `require_session_owner` is the
single dependency: role first, then the session's creator. Admin always passes; Lead/Developer
passes on reads (results transparency, CLAUDE.md monetization note) when `leads_read=True`.
"""

import uuid

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.dependencies import get_db
from app.core.permissions import canonical_role, require_role


async def session_owner_of(db: AsyncSession, session_id: uuid.UUID) -> str | None:
    """created_by of the session, or None when the session does not exist."""
    from app.models.session import Session

    row = await db.execute(select(Session.created_by).where(Session.id == session_id))
    return row.scalar_one_or_none()


def require_session_owner(*roles: str, leads_read: bool = False):
    """Role check + ownership of the `session_id` path parameter."""
    role_dep = require_role(*roles)

    async def _check(
        session_id: uuid.UUID,
        user: CurrentUser = Depends(role_dep),
        db: AsyncSession = Depends(get_db),
    ) -> CurrentUser:
        role = canonical_role(user.role)
        if role == "admin" or (leads_read and role == "lead_developer"):
            return user
        owner = await session_owner_of(db, session_id)
        if owner is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if owner != user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this session")
        return user

    return _check
