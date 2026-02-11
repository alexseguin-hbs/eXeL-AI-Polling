"""FastAPI dependency injection helpers."""

from collections.abc import AsyncGenerator

import redis.asyncio as aioredis
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory
from app.db.redis import get_redis_client


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


def get_redis() -> aioredis.Redis:
    return get_redis_client()


def get_mongo() -> AsyncIOMotorDatabase:
    return get_mongo_db()
