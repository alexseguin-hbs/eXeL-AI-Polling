"""GET /sessions/{id} is public, like GET /sessions/code/{short_code} (Odin, AsM round 7).

Anonymous participants (join is anonymous; HP-07 tokens exist for exactly that) read their session's status here
on page load, on the 1.5 s poll and on every pushed status hint. With Auth0 configured, a get_current_user
dependency made all three answer 401 — swallowed by the client — so no anonymous participant would ever see a
status change in production. Dev/test mode hid it (every caller is a mock moderator), so this gate inspects the
route itself rather than calling it in dev mode.
"""
from __future__ import annotations

import inspect

from app.cubes.cube1_session import router


def _dependencies(fn) -> list[str]:
    names = []
    for p in inspect.signature(fn).parameters.values():
        dep = getattr(p.default, "dependency", None)
        if dep is not None:
            names.append(getattr(dep, "__qualname__", repr(dep)))
    return names


def test_session_read_by_id_needs_no_login():
    deps = _dependencies(router.get_session)
    assert not any("current_user" in d or "require" in d or "_check" in d for d in deps), deps


def test_session_read_by_id_matches_the_public_code_read():
    """Same response model as the already-public by-code read: nothing new is exposed."""
    routes = {r.path: r for r in router.router.routes if getattr(r, "methods", None) and "GET" in r.methods}
    by_id = next(r for p, r in routes.items() if p.endswith("/{session_id}"))
    by_code = next(r for p, r in routes.items() if p.endswith("/code/{short_code}"))
    assert by_id.response_model is by_code.response_model
