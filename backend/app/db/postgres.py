from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    pool_size=20,            # Pre-warmed connections ready for queries
    max_overflow=30,         # Burst capacity (50 total max)
    pool_recycle=1800,       # Recycle every 30min (Supabase pgbouncer compat)
    pool_pre_ping=True,      # Validate connection before use (no stale conns)
    pool_timeout=10,         # Wait max 10s for a connection from pool
    pool_reset_on_return="rollback",  # Clean state on connection return
)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


async def init_postgres() -> None:
    """Test the database connection on startup."""
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))


async def close_postgres() -> None:
    await engine.dispose()
