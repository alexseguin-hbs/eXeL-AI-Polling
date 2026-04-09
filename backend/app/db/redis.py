"""Redis stub — Redis removed from architecture (2026-04-09).

All Redis functionality replaced by:
  - Presence: app.core.presence (in-memory + Supabase DB)
  - Broadcasting: Supabase Realtime
  - Rate limiting: in-memory counters
  - Caching: Supabase query + Python lru_cache

This stub preserves the interface so existing imports don't break
during migration. All functions are safe no-ops.
"""


class _NoOpRedis:
    """No-op Redis replacement. All operations silently succeed."""

    async def hset(self, *args, **kwargs): pass
    async def hgetall(self, *args, **kwargs): return {}
    async def hdel(self, *args, **kwargs): pass
    async def expire(self, *args, **kwargs): pass
    async def get(self, *args, **kwargs): return None
    async def set(self, *args, **kwargs): pass
    async def delete(self, *args, **kwargs): pass
    async def publish(self, *args, **kwargs): pass
    async def close(self): pass


_redis = _NoOpRedis()


async def init_redis() -> None:
    """No-op — Redis removed from architecture."""
    pass


async def close_redis() -> None:
    """No-op — Redis removed from architecture."""
    pass


def get_redis_client():
    """Returns no-op Redis stub. All operations silently succeed."""
    return _redis
