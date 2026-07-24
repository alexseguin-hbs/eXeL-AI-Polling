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


class _FilterResult:
    def __init__(self, rows):
        self._rows = rows

    def scalars(self):
        return self

    def all(self):
        return self._rows


class _Row:
    def __init__(self, pattern):
        self.id = pattern
        self.pattern = pattern
        self.severity = "high"
        self.replacement = "***"


class _OneShotDB:
    """Returns a filter set once, then raises on every later query (DB goes down)."""

    def __init__(self, rows):
        self._rows = rows
        self.calls = 0

    async def execute(self, *_a, **_k):
        self.calls += 1
        if self.calls == 1:
            return _FilterResult(self._rows)
        raise RuntimeError("db connection lost")


class _DownDB:
    async def execute(self, *_a, **_k):
        raise RuntimeError("db connection lost")


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


def test_db_error_with_no_cache_degrades_to_empty(monkeypatch):
    # DB down and nothing cached → filter nothing, submission is never blocked.
    service._profanity_query_cache.clear()
    monkeypatch.setattr(service, "_PROFANITY_CACHE_TTL", 60.0, raising=False)
    out = _run(service.detect_profanity(_DownDB(), "some profane text", "en"))
    assert out == []


def test_db_error_falls_back_to_stale_cache(monkeypatch):
    # Populate the cache once with a real filter, expire its TTL, then take the DB down.
    # The stale filter must still apply (stale filtering beats none).
    service._profanity_query_cache.clear()
    monkeypatch.setattr(service, "_PROFANITY_CACHE_TTL", 0.0, raising=False)  # every entry instantly stale
    db = _OneShotDB([_Row("badword")])
    _run(service.detect_profanity(db, "warmup badword", "en"))  # call 1: seeds cache
    assert "en" in service._profanity_query_cache

    out = _run(service.detect_profanity(db, "a badword here", "en"))  # call 2: DB raises → stale cache
    assert db.calls == 2  # it did attempt the DB again (TTL expired) and hit the error path
    assert any(m["word"] == "badword" for m in out)  # stale filter still matched
