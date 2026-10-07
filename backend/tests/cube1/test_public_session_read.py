"""Every read an anonymous participant makes is public (Odin round 7, Christo round 8).

Join is anonymous (HP-07 tokens exist for exactly that). The participant page reads its session, the questions it
answers, the live presence count and the ballot themes; with Auth0 configured, a login dependency on any of them
answers 401 — swallowed by the client — and dev/test mode hides it because every caller is a mock moderator. So
this gate inspects the routes themselves: each participant read may depend only on the database or the OPTIONAL
user, never on a required login. Writes (responses, ballots) authorise by the join-issued participant token.
"""
from __future__ import annotations

import inspect

from app.cubes.cube1_session.router import router as session_router
from app.cubes.cube6_ai.router import router as ai_router
from app.main import PREFIX, app

# Every GET the participant pages make (frontend: session-view, join-flow, lib/ballot-themes, lib/api). Paths are
# the routers' own (prefix included); the app mounts them under PREFIX, which the OpenAPI check below confirms.
PARTICIPANT_READS = [
    "/sessions/{session_id}",
    "/sessions/code/{short_code}",
    "/sessions/{session_id}/questions",
    "/sessions/{session_id}/presence",
    "/sessions/{session_id}/themes",
]
ALLOWED = {"get_db", "get_optional_current_user"}


def _route(path: str):
    # Read the routers directly: how an included router appears in app.routes differs across FastAPI versions.
    for r in (*session_router.routes, *ai_router.routes):
        if getattr(r, "path", None) == path and "GET" in (getattr(r, "methods", None) or ()):
            return r
    raise AssertionError(f"no GET route {path}")


def test_the_app_serves_every_participant_read():
    served = app.openapi()["paths"]
    missing = [p for p in PARTICIPANT_READS if "get" not in served.get(PREFIX + p, {})]
    assert not missing, f"participant reads not mounted under {PREFIX}: {missing}"


def _deps(route) -> set[str]:
    names = set()
    for p in inspect.signature(route.endpoint).parameters.values():
        dep = getattr(p.default, "dependency", None)
        if dep is not None:
            names.add(getattr(dep, "__name__", None) or getattr(dep, "__qualname__", repr(dep)))
    return names


def test_every_participant_read_needs_no_login():
    bad = {path: sorted(_deps(_route(path)) - ALLOWED) for path in PARTICIPANT_READS}
    bad = {p: d for p, d in bad.items() if d}
    assert not bad, f"participant reads with a non-public dependency (would 401 with Auth0): {bad}"


def test_session_read_by_id_matches_the_public_code_read():
    """Same response model as the already-public by-code read: nothing new is exposed."""
    assert _route(PARTICIPANT_READS[0]).response_model is _route(PARTICIPANT_READS[1]).response_model
