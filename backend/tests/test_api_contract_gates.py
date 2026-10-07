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


# ═══ Round 1 of the reviewer loop (2026-10-07): authorization classes ═══════════════════

# 11 · one session-ownership rule
@pytest.mark.real_ownership
@pytest.mark.asyncio
async def test_session_owner_dependency_refuses_other_tenants():
    from fastapi import HTTPException

    from app.core import session_access as sa

    sid, me, other = uuid.uuid4(), "auth0|me", "auth0|other"
    dep = sa.require_session_owner("moderator", "admin", leads_read=False)

    async def owned_by(who):
        async def _f(db, s):
            return who
        return _f

    def user(uid, role):
        return CurrentUser(user_id=uid, email=None, role=role, permissions=[])

    from app.core.auth import CurrentUser  # noqa: F811
    with patch.object(sa, "session_owner_of", await owned_by(me)):
        assert (await dep(session_id=sid, user=user(me, "moderator"), db=None)).user_id == me
        with pytest.raises(HTTPException) as e:
            await dep(session_id=sid, user=user(other, "moderator"), db=None)
        assert e.value.status_code == 403
        assert (await dep(session_id=sid, user=user(other, "admin"), db=None)).user_id == other
        with pytest.raises(HTTPException):
            await dep(session_id=sid, user=user(other, "lead_developer"), db=None)  # writes: no lead bypass
        reads = sa.require_session_owner("moderator", "lead_developer", "admin", leads_read=True)
        assert (await reads(session_id=sid, user=user(other, "lead_developer"), db=None)).user_id == other
    with patch.object(sa, "session_owner_of", await owned_by(None)):
        with pytest.raises(HTTPException) as e:
            await dep(session_id=sid, user=user(me, "moderator"), db=None)
        assert e.value.status_code == 404


def test_role_gated_session_routes_check_ownership():
    """Every role-gated route under a session (cubes 2-9) goes through require_session_owner."""
    bad = []
    for p in sorted((APP / "cubes").glob("cube[2-9]_*/router.py")):
        src = p.read_text()
        tree = ast.parse(src)
        prefixed = 'prefix="/sessions/{session_id}' in src
        for f in tree.body:
            if not isinstance(f, ast.AsyncFunctionDef):
                continue
            deco = " ".join(ast.get_source_segment(src, d) or "" for d in f.decorator_list)
            if "router." not in deco:
                continue
            under_session = prefixed or "{session_id}" in deco
            sig = ast.get_source_segment(src, f).split('"""')[0]
            if under_session and "require_role(" in sig:
                bad.append(f"{p.parent.name}.{f.name}")
    assert not bad, "role-only (no ownership) session routes: " + ", ".join(bad)


# 12 · auth fails closed in production
@pytest.mark.asyncio
async def test_unconfigured_auth_is_refused_in_production():
    from fastapi import HTTPException

    from app.core import auth

    with patch.object(auth.settings, "environment", "production"):
        with pytest.raises(HTTPException) as e:
            auth._dev_user_or_refuse()
        assert e.value.status_code == 503
    with patch.object(auth.settings, "environment", "development"):
        assert auth._dev_user_or_refuse().role == "moderator"


# 13 · roles: exact match, "lead" is "lead_developer"
@pytest.mark.asyncio
async def test_require_role_is_exact_and_knows_lead():
    from fastapi import HTTPException

    from app.core.auth import CurrentUser
    from app.core.permissions import require_role

    chk = require_role("moderator", "lead")
    u = lambda r: CurrentUser(user_id="x", email=None, role=r, permissions=[])  # noqa: E731
    assert (await chk(current_user=u("lead_developer"))).role == "lead_developer"
    assert (await chk(current_user=u("admin"))).role == "admin"
    for r in ("sysadmin_readonly", "nonadmin", "user"):
        with pytest.raises(HTTPException):
            await chk(current_user=u(r))


# 14 · the rate-limit key cannot be chosen by the client
def test_rate_limit_key_ignores_x_forwarded_for():
    from types import SimpleNamespace

    from app.core import rate_limit

    req = SimpleNamespace(headers={"X-Forwarded-For": "1.2.3.4"}, client=SimpleNamespace(host="9.9.9.9"))
    with patch.object(rate_limit.settings, "behind_cloudflare", False):
        assert rate_limit.get_real_client_ip(req) == "9.9.9.9"
    req2 = SimpleNamespace(headers={"CF-Connecting-IP": "5.6.7.8", "X-Forwarded-For": "1.2.3.4"},
                           client=SimpleNamespace(host="9.9.9.9"))
    with patch.object(rate_limit.settings, "behind_cloudflare", True):
        assert rate_limit.get_real_client_ip(req2) == "5.6.7.8"


# 15 · webhook targets: public HTTPS only, by address
@pytest.mark.asyncio
async def test_webhook_ssrf_guard_checks_addresses():
    from app.cubes.cube5_gateway.webhook_service import WebhookTargetError, validate_webhook_url

    for url in ["http://93.184.216.34/x", "https://127.0.0.1/x", "https://172.16.0.5/x", "https://100.64.0.1/x",
                "https://[fd00::1]/x", "https://[fe80::1]/x", "https://[::ffff:10.0.0.1]/x", "https://169.254.169.254/x",
                "https://0.0.0.0/x", "https://2130706433/x"]:
        with pytest.raises(WebhookTargetError):
            await validate_webhook_url(url)
    await validate_webhook_url("https://93.184.216.34/hook")  # a public literal passes
    src = (APP / "cubes/cube5_gateway/webhook_service.py").read_text()
    assert "await validate_webhook_url(sub.url)" in src, "re-checked at every delivery"


# 16 · money-spending anonymous routes are bounded
def test_anonymous_spend_routes_are_bounded():
    from app.cubes.cube8_tokens import router as r8

    with patch.object(r8.settings, "frontend_url", "https://site.example"):
        assert r8._own_site("https://site.example/thanks") and r8._own_site("")
        assert not r8._own_site("https://evil.example/phish")
    for path, marker in [("cubes/cube8_tokens/router.py", '@limiter.limit("10/minute")'),
                         ("cubes/cube6_ai/pod_router.py", '@limiter.limit("6/minute")'),
                         ("cubes/cube10_simulation/router.py", '@limiter.limit("5/minute")')]:
        assert marker in (APP / path).read_text(), path


# 17 · 1M readiness: the anti-sybil burst rule
@pytest.mark.asyncio
async def test_burst_rule_spares_honest_traffic_and_catches_a_swarm():
    import itertools
    import random
    from datetime import datetime, timedelta, timezone
    from types import SimpleNamespace

    from app.cubes.cube7_ranking.ranking_governance import detect_voting_anomalies

    rng = random.Random(2525)
    t0 = datetime(2026, 10, 7, tzinfo=timezone.utc)
    themes = [str(uuid.UUID(int=i)) for i in range(9)]
    popular = [list(p) for p in itertools.islice(itertools.permutations(themes), 20)]  # people agree a lot
    honest = [SimpleNamespace(participant_id=uuid.uuid4(), ranked_theme_ids=rng.choice(popular),
                              submitted_at=t0 + timedelta(seconds=i / 3000)) for i in range(6000)]
    swarm_order = list(reversed(themes))
    swarm = [SimpleNamespace(participant_id=uuid.uuid4(), ranked_theme_ids=swarm_order,
                             submitted_at=t0 + timedelta(seconds=10 + i / 5000)) for i in range(5000)]

    def db_with(rows):
        res = MagicMock()
        res.scalars.return_value.all.return_value = sorted(rows, key=lambda r: r.submitted_at)
        db = AsyncMock()
        db.execute.return_value = res
        return db

    flagged = await detect_voting_anomalies(db_with(honest), uuid.uuid4())
    assert [a for a in flagged if a["type"] == "identical_ranking_burst"] == [], "honest 3,000 votes/s are not a burst"
    flagged = await detect_voting_anomalies(db_with(honest + swarm), uuid.uuid4())
    bursts = [a for a in flagged if a["type"] == "identical_ranking_burst"]
    caught = sum(len(a["participant_ids"]) for a in bursts)
    assert caught == 5000, f"the whole swarm is flagged, not its first three (caught {caught})"


# 18 · 1M readiness: hot-path costs
def test_vote_path_does_not_count_or_broadcast_per_ballot():
    src = (APP / "cubes/cube7_ranking/ranking_submission.py").read_text()
    body = src[src.index("async def submit_user_ranking"):src.index("PROGRESS_INTERVAL_S")]
    assert "_schedule_progress(" in body and "await _broadcast_ranking_progress(" not in body
    gov = (APP / "cubes/cube7_ranking/ranking_governance.py").read_text()
    assert "broadcast_to_all_shards" not in gov, "ranking_complete goes on the topic clients join"
    pres = (APP / "cubes/cube1_session/router.py").read_text()
    assert "participants=[]" in pres and "get_active_count" in pres, "presence is count-only"
