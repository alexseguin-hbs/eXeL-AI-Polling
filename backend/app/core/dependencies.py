"""FastAPI dependency injection helpers.

Architecture: Supabase/PostgreSQL only.
Presence tracking: in-memory + Supabase DB (app.core.presence).
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
