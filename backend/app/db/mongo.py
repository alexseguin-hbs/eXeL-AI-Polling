from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None


async def init_mongo() -> None:
    global _client, _database
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    _database = _client.get_default_database()


async def close_mongo() -> None:
    global _client
    if _client:
        _client.close()


def get_mongo_db() -> AsyncIOMotorDatabase:
    if _database is None:
        raise RuntimeError("MongoDB not initialized. Call init_mongo() first.")
    return _database
