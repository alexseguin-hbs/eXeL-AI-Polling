"""C2-5 lock: the profanity query cache is a true LRU — O(1) eviction, MRU on hit."""

import asyncio

from app.cubes.cube2_text import service


class _EmptyResult:
    def scalars(self):
        return self

    def all(self):
        return []


class _MockDB:
    async def execute(self, *_a, **_k):
        return _EmptyResult()


def _run(coro):
    return asyncio.run(coro)


def test_query_cache_lru_bounded_and_mru_on_hit(monkeypatch):
    monkeypatch.setattr(service, "_PROFANITY_QUERY_CACHE_MAX", 3, raising=False)
    service._profanity_query_cache.clear()
    db = _MockDB()

    for lang in ("en", "es", "fr"):
        _run(service.detect_profanity(db, "text", lang))
    assert list(service._profanity_query_cache.keys()) == ["en", "es", "fr"]

    # Cache hit on 'en' promotes it to most-recently-used.
    _run(service.detect_profanity(db, "text", "en"))
    assert list(service._profanity_query_cache.keys()) == ["es", "fr", "en"]

    # New lang at capacity evicts the LRU ('es'), never the just-used 'en'.
    _run(service.detect_profanity(db, "text", "de"))
    assert "es" not in service._profanity_query_cache
    assert set(service._profanity_query_cache.keys()) == {"fr", "en", "de"}
    assert len(service._profanity_query_cache) == 3
