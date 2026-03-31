"""FastAPI dependency injection helpers.

Architecture: Supabase/PostgreSQL + Redis only (no MongoDB).
"""

from collections.abc import AsyncGenerator

import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import async_session_factory
from app.db.redis import get_redis_client


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


def get_redis() -> aioredis.Redis:
    return get_redis_client()
