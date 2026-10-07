"""API contract gates — each one guards a class of defect a live sweep found (2026-10-07).

Every endpoint was called against a real Postgres. 14 returned 500, while the mocked unit
tests stayed green. These gates fail if any of those classes comes back:

  1. a router calls a service with the wrong arguments (missing db / swapped positionals);
  2. a stdlib logger is given structlog-style keyword fields (TypeError on the happy path);
  3. a name is used that the module never imports (NameError at run time);
  4. a model writes timezone-aware datetimes into a naive TIMESTAMP column;
  5. two operations share one OpenAPI operationId (SDK codegen collides);
  6. an Auth0 user_id is parsed as a UUID;
  7. data destruction names a column the model does not have;
  8. the Stripe webhook accepts an unsigned event in production, or 500s on bad JSON;
  9. a background task reuses the request's DB session;
 10. an AI theming re-run appends a second set of themes instead of replacing them.
"""

import ast
import importlib
import inspect
import pathlib
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

APP = pathlib.Path(__file__).resolve().parents[1] / "app"


def _modules():
    for p in sorted(APP.rglob("*.py")):
        yield p, ast.parse(p.read_text())


# 1 ─────────────────────────────────────────────────────────────────────────────
def test_router_calls_bind_to_service_signatures():
    bad = []
    for rp in sorted(APP.rglob("router.py")):
        mod_name = ".".join(rp.relative_to(APP.parent).with_suffix("").parts)
        mod = importlib.import_module(mod_name)
        for node in ast.walk(ast.parse(rp.read_text())):
            if not isinstance(node, ast.Call):
                continue
            f = node.func
            if isinstance(f, ast.Attribute) and isinstance(f.value, ast.Name):
                target = getattr(getattr(mod, f.value.id, None), f.attr, None)
                label = f"{f.value.id}.{f.attr}"
            elif isinstance(f, ast.Name):
                target, label = getattr(mod, f.id, None), f.id
            else:
                continue
            if target is None or not inspect.iscoroutinefunction(target):
                continue
            if getattr(target, "__module__", "") == mod_name:
                continue  # the router's own endpoint functions
            if any(isinstance(a, ast.Starred) for a in node.args) or any(k.arg is None for k in node.keywords):
                continue
            try:
                inspect.signature(target).bind(*node.args, **{k.arg: None for k in node.keywords})
            except TypeError as e:
                bad.append(f"{rp.relative_to(APP.parent)}:{node.lineno} {label}: {e}")
    assert not bad, "router→service calls that cannot bind:\n" + "\n".join(bad)


# 2 ─────────────────────────────────────────────────────────────────────────────
def test_no_structlog_kwargs_on_stdlib_loggers():
    allowed = {"exc_info", "stack_info", "stacklevel", "extra"}
    levels = {"debug", "info", "warning", "warn", "error", "exception", "critical", "log"}
    bad = []
    for p, tree in _modules():
        stdlib = set()
        for n in ast.walk(tree):
            if isinstance(n, ast.Assign) and isinstance(n.value, ast.Call):
                fn = n.value.func
                if (isinstance(fn, ast.Attribute) and fn.attr == "getLogger"
                        and isinstance(fn.value, ast.Name) and fn.value.id == "logging"):
                    stdlib |= {t.id for t in n.targets if isinstance(t, ast.Name)}
        for n in ast.walk(tree):
            if (isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
                    and isinstance(n.func.value, ast.Name) and n.func.value.id in stdlib
                    and n.func.attr in levels):
                kws = [k.arg for k in n.keywords if k.arg and k.arg not in allowed]
                if kws:
                    bad.append(f"{p.relative_to(APP.parent)}:{n.lineno} {kws}")
    assert not bad, "stdlib logger given keyword fields (TypeError at run time):\n" + "\n".join(bad)


# 3 ─────────────────────────────────────────────────────────────────────────────
def test_previously_unimported_names_resolve():
    gov = importlib.import_module("app.cubes.cube7_ranking.ranking_governance")
    assert callable(gov.aggregate_rankings) and callable(gov.identify_top_theme2)
    gw = importlib.import_module("app.cubes.cube5_gateway.service")
    assert gw.Session.__tablename__ == "sessions"


# 4 ─────────────────────────────────────────────────────────────────────────────
def test_every_datetime_column_is_timezone_aware():
    import app.models  # noqa: F401 — registers every table
    from sqlalchemy import DateTime

    from app.db.base import Base

    naive = [
        f"{t.name}.{c.name}"
        for t in Base.metadata.sorted_tables
        for c in t.columns
        if isinstance(c.type, DateTime) and not c.type.timezone
    ]
    assert not naive, f"naive TIMESTAMP columns (writes use aware datetimes): {naive}"


# 5 ─────────────────────────────────────────────────────────────────────────────
def test_operation_ids_are_unique():
    from app.main import app

    seen, dup = {}, []
    for path, ops in app.openapi()["paths"].items():
        for method, op in ops.items():
            oid = op.get("operationId")
            if oid in seen:
                dup.append(f"{oid}: {seen[oid]} and {method.upper()} {path}")
            seen[oid] = f"{method.upper()} {path}"
    assert not dup, "duplicate operationIds:\n" + "\n".join(dup)


# 6 ─────────────────────────────────────────────────────────────────────────────
def test_no_router_parses_user_id_as_uuid():
    bad = []
    for p, tree in _modules():
        for n in ast.walk(tree):
            if (isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == "UUID"
                    and n.args and isinstance(n.args[0], ast.Attribute) and n.args[0].attr == "user_id"):
                bad.append(f"{p.relative_to(APP.parent)}:{n.lineno}")
    assert not bad, "uuid.UUID(<user>.user_id) — an Auth0 id is never a UUID:\n" + "\n".join(bad)


@pytest.mark.asyncio
async def test_resolve_participant_id_accepts_auth0_ids():
    from app.core.submission_validators import resolve_participant_id

    pid = uuid.uuid4()
    db = AsyncMock()
    db.execute.return_value = MagicMock(scalar_one_or_none=MagicMock(return_value=pid))
    assert await resolve_participant_id(db, uuid.uuid4(), "auth0|65f0c0ffee") == pid
    assert await resolve_participant_id(db, uuid.uuid4(), None) is None


# 7 ─────────────────────────────────────────────────────────────────────────────
def test_destroy_names_only_real_columns():
    from app.models.response_meta import ResponseMeta
    from app.models.response_summary import ResponseSummary
    from app.models.text_response import TextResponse
    from app.models.voice_response import VoiceResponse

    models = {m.__name__: m for m in (ResponseMeta, ResponseSummary, TextResponse, VoiceResponse)}
    tree = ast.parse((APP / "cubes/cube9_reports/service.py").read_text())
    fn = next(n for n in ast.walk(tree)
              if isinstance(n, ast.AsyncFunctionDef) and n.name == "destroy_session_export_data")
    touched = set()
    for call in ast.walk(fn):
        if isinstance(call, ast.Call) and isinstance(call.func, ast.Attribute) and call.func.attr == "values":
            inner = call.func.value
            while isinstance(inner, ast.Call) and isinstance(inner.func, ast.Attribute):
                inner = inner.func.value
            if isinstance(inner, ast.Call) and isinstance(inner.func, ast.Name) and inner.func.id == "update":
                model = models[inner.args[0].id]
                touched.add(model.__name__)
                cols = set(model.__table__.columns.keys())
                for k in call.keywords:
                    assert k.arg in cols, f"{model.__name__} has no column {k.arg}"
    assert touched == set(models), f"every copy of the words is destroyed; touched {sorted(touched)}"


# 8 ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_stripe_webhook_refuses_unsigned_in_production(client):
    with patch("app.cubes.cube8_tokens.webhook.settings") as s:
        s.stripe_webhook_secret = ""
        s.environment = "production"
        r = await client.post("/api/v1/webhooks/stripe", content=b'{"type":"checkout.session.completed"}')
    assert r.status_code == 503


@pytest.mark.asyncio
async def test_stripe_webhook_bad_json_is_400(client):
    with patch("app.cubes.cube8_tokens.webhook.settings") as s:
        s.stripe_webhook_secret = ""
        s.environment = "development"
        r = await client.post("/api/v1/webhooks/stripe", content=b"")
    assert r.status_code == 400


# 9 ─────────────────────────────────────────────────────────────────────────────
def test_background_tasks_never_take_the_request_session():
    bad = []
    for p, tree in _modules():
        for n in ast.walk(tree):
            if (isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == "create_task"
                    and n.args and isinstance(n.args[0], ast.Call)):
                if any(isinstance(a, ast.Name) and a.id == "db" for a in n.args[0].args):
                    bad.append(f"{p.relative_to(APP.parent)}:{n.lineno}")
    assert not bad, "create_task(fn(db, …)) — the request session closes under the task:\n" + "\n".join(bad)


# 10 ────────────────────────────────────────────────────────────────────────────
def test_theme_storage_replaces_the_cycle():
    src = (APP / "cubes/cube6_ai/phase_b.py").read_text()
    store = src[src.index("async def _store_results("):]
    head = store[: store.index("for category, levels in reduced.items()")]
    assert "_replace_cycle_themes(" in head, "themes are replaced before the new set is written"
    from app.cubes.cube6_ai.phase_b import ThemesLockedError

    assert issubclass(ThemesLockedError, ValueError)
