"""Every backend path the frontend calls exists (Krishna, AsM round 10).

The time-tracking client methods pointed at /time/start and /time/{id}/stop for rounds — paths the backend
never served — and no test noticed, because the client and the router are checked separately. This gate reads
every `api.get|post|put|patch|delete(\\`/…\\`)` call and every `request("METHOD", \\`/…\\`)` call in the
frontend (lib, components, app), turns `${…}` into a path parameter, and requires the backend's OpenAPI to
serve that method on that path under /api/v1. A dynamic transition (`/sessions/${id}/${action}`) is expanded
to every action the dashboard sends. A known gap is allowed only with its backlog id, never silently.
"""
from __future__ import annotations

import re
from pathlib import Path

from app.main import PREFIX, app

FRONTEND = Path(__file__).resolve().parents[3] / "frontend"
CALL = re.compile(
    r'\bapi\.(get|post|put|patch|delete)(?:<[^>()]*(?:<[^>]*>)?[^>()]*>)?\(\s*[`"]([^`"]+)[`"]'
    r'|\brequest(?:<[^>()]*(?:<[^>]*>)?[^>()]*>)?\(\s*"(GET|POST|PUT|PATCH|DELETE)",\s*[`"]([^`"]+)[`"]'
)
ACTION = re.compile(r'handleTransition\("([a-z]+)"\)')
# Known gaps, each with the backlog row that owns it.
KNOWN = {("DELETE", "/sessions/{}"): "HP-35"}


def _served() -> set[tuple[str, str]]:
    return {(m.upper(), re.sub(r"\{[^}]+\}", "{}", p)) for p, ops in app.openapi()["paths"].items() for m in ops}


def _calls():
    files = [f for d in ("lib", "components", "app") for f in (FRONTEND / d).rglob("*.ts*") if "node_modules" not in f.parts]
    actions = sorted({a for f in files for a in ACTION.findall(f.read_text(encoding="utf-8"))})
    for f in files:
        for m1, p1, m2, p2 in CALL.findall(f.read_text(encoding="utf-8")):
            method, path = (m1 or m2).upper(), (p1 or p2).split("?")[0]
            if not path.startswith("/") or path.startswith("/api/"):
                continue  # Worker routes (/api/...) are not the backend's
            if path.endswith("/${action}"):
                for a in actions:
                    yield f, method, path[: -len("${action}")] + a
            else:
                yield f, method, path


def test_frontend_calls_paths_the_backend_serves():
    served = _served()
    seen, missing = 0, []
    for f, method, path in _calls():
        seen += 1
        norm = re.sub(r"\$\{[^}]+\}", "{}", path)
        if (method, PREFIX + norm) not in served and (method, norm) not in KNOWN:
            missing.append(f"{method} {path}  ({f.relative_to(FRONTEND)})")
    assert seen >= 40, f"the scan found only {seen} calls — the pattern no longer matches the client"
    assert not missing, "frontend calls a backend path that does not exist:\n" + "\n".join(missing)


def test_known_gaps_are_still_gaps():
    """A known gap that the backend now serves must leave the allow-list (no stale excuses)."""
    served = _served()
    stale = [k for k in KNOWN if (k[0], PREFIX + k[1]) in served]
    assert not stale, f"remove from KNOWN, now served: {stale}"
