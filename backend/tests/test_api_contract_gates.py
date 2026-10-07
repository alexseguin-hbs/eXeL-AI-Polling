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
  8. the Stripe webhook accepts an unsigned event outside dev/test, or 500s on bad JSON;
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
        s.is_dev_or_test = False
        r = await client.post("/api/v1/webhooks/stripe", content=b'{"type":"checkout.session.completed"}')
    assert r.status_code == 503


@pytest.mark.asyncio
async def test_stripe_webhook_bad_json_is_400(client):
    with patch("app.cubes.cube8_tokens.webhook.settings") as s:
        s.stripe_webhook_secret = ""
        s.environment = "development"
        s.is_dev_or_test = True
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


def _all_routes():
    """Every mounted route, flattened through included routers (FastAPI 0.14x nests them)."""
    from app.main import app

    def flat(routes):
        for r in routes:
            if hasattr(r, "original_router"):
                yield from flat(r.original_router.routes)
            else:
                yield r

    return list(flat(app.routes))


def _dependency_calls(dependant):
    for d in dependant.dependencies:
        yield d.call
        yield from _dependency_calls(d)


def _owner_checked(route) -> bool:
    return any(getattr(c, "__qualname__", "").startswith("require_session_owner")
               for c in _dependency_calls(route.dependant))


# Session-scoped routes that are DELIBERATELY open to participants (or the public), each with
# its reason. Everything else under /sessions/{session_id} must be owner-checked. Adding a
# route here is a reviewed decision, not a way to quiet the gate.
PARTICIPANT_SESSION_ROUTES = {
    "cube1_session.get_session": "a joined participant reads the session it is in",
    "cube1_session.list_questions": "participants read the questions they answer",
    "cube1_session.get_presence": "count only, never who (1M: count-only presence)",
    "cube1_session.get_qr_code": "the join QR is meant to be shared",
    "cube1_session.get_qr_json": "the join QR is meant to be shared",
    "cube1_session.verify_determinism": "public replay-hash proof (transparency)",
    "cube2_text.submit_response": "participant write; identity = X-Participant-Token or owning JWT (HP-07)",
    "cube3_voice.submit_voice": "participant write; identity = X-Participant-Token or owning JWT (HP-07)",
    "cube4_collector.response_count": "live counter on participant screens (counts only)",
    "cube4_collector.get_collector_presence": "count only",
    "cube4_collector.create_outcome": "participant proposes a desired outcome",
    "cube4_collector.confirm_outcome": "caller's own participant row only (resolve_participant_id)",
    "cube4_collector.check_confirmed": "boolean confirmation state",
    "cube5_gateway.start_time_tracking": "participant's own time entry",
    "cube5_gateway.stop_time_tracking": "participant's own time entry",
    "cube5_gateway.get_time_summary": "that participant only; X-Participant-Token or owning JWT (HP-07)",
    "cube5_gateway.get_poll_metrics": "public poll metrics (counts)",
    "cube5_gateway.get_pipeline_status": "participants wait on theming status",
    "cube6_ai.get_themes": "participants vote on the themes",
    "cube7_ranking.submit_ranking": "participant ballot; identity = X-Participant-Token or owning JWT (HP-07)",
    "cube7_ranking.get_rankings": "live results shown to participants",
    "cube7_ranking.get_personal_rank": "caller's own rank",
    "cube7_ranking.verify_ranking_replay": "public determinism proof (transparency)",
    "cube8_tokens.get_cost_estimate": "cost estimate anchors the donation ask for everyone",
    "cube8_tokens.get_user_balance": "caller's own balance",
    "cube8_tokens.check_velocity": "caller's own velocity",
    "cube8_tokens.get_token_config": "public token configuration",
    "cube9_reports.export_csv": "CRS-05 results gate: moderators checked inline (created_by), participants by their own join row",
    "cube9_reports.get_ranking_summary": "results shown to participants",
    "cube9_reports.get_content_tier": "caller's own donation tier",
    "cube9_reports.get_compression_ratio": "free public headline",
    "cube9_reports.get_replay_options": "public replay catalogue",
}

# Ownership enforced inside the handler (Cube 1 loads the session, then checks its creator).
_INNER_OWNER_CALLS = ("verify_session_owner(", "_transition_and_return(")


def test_every_session_route_checks_ownership_or_is_a_listed_participant_route():
    """Every mounted router module (Cube 1, Cube 10 router + sim_seed, pod_router, every cube) is
    in scope: a /sessions/{session_id} route is owner-checked, or it is listed above."""
    from fastapi.routing import APIRoute

    bad, seen_modules, listed_seen = [], set(), set()
    for r in _all_routes():
        if not isinstance(r, APIRoute):
            continue
        seen_modules.add(r.endpoint.__module__)
        if "{session_id}" not in r.path:
            continue
        key = f"{r.endpoint.__module__.split('.')[-2]}.{r.endpoint.__name__}"
        if key in PARTICIPANT_SESSION_ROUTES:
            listed_seen.add(key)
            continue
        inner = any(m in inspect.getsource(r.endpoint) for m in _INNER_OWNER_CALLS)
        if not (_owner_checked(r) or inner):
            bad.append(f"{sorted(r.methods)} {r.path} ({key})")
    for must in ("app.cubes.cube1_session.router", "app.cubes.cube10_simulation.sim_seed",
                 "app.cubes.cube10_simulation.router", "app.cubes.cube6_ai.pod_router"):
        assert must in seen_modules, f"{must} is not scanned"
    assert not bad, "session routes with no ownership check (and not listed as participant routes):\n" + "\n".join(bad)
    stale = set(PARTICIPANT_SESSION_ROUTES) - listed_seen
    assert not stale, f"listed participant routes that no longer exist: {sorted(stale)}"


def test_named_ownership_gaps_are_closed():
    """Round 1 (Thor, Krishna): these four accepted any moderator / any logged-in user."""
    from fastapi.routing import APIRoute

    want = {"list_participants", "get_session_ssses_metrics", "response_languages", "summary_status"}
    found = set()
    for r in _all_routes():
        if isinstance(r, APIRoute) and r.endpoint.__name__ in want:
            assert _owner_checked(r), r.endpoint.__name__
            found.add(r.endpoint.__name__)
    assert found == want


# HP-20 · no websocket is mounted without authentication
_WS_AUTH_MARKERS = ("verify_participant_token(", "get_current_user", "require_session_owner")


def test_no_websocket_route_without_auth():
    from fastapi.routing import APIWebSocketRoute

    ws = [r for r in _all_routes() if isinstance(r, APIWebSocketRoute)]
    assert all("/ws/session/" not in r.path for r in ws), "HP-20 relay is unmounted"
    bad = []
    for r in ws:
        src = inspect.getsource(r.endpoint)
        deps = " ".join(getattr(c, "__qualname__", "") for c in _dependency_calls(r.dependant))
        if not any(m in src or m.rstrip("(") in deps for m in _WS_AUTH_MARKERS):
            bad.append(r.path)
    assert not bad, f"websocket routes with no authentication: {bad}"
    assert not (APP / "core/realtime_ws.py").exists(), "the unauthenticated relay module is deleted"


# 12 · auth fails closed outside an explicit dev/test environment
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


# ═══ Round 1 (Thor item 1): fail closed unless explicitly development or test ═══════════
_NOT_DEV = ["production", "staging", "prod", "Production ", "developement", "testing", "", "qa"]


@pytest.mark.parametrize("env", _NOT_DEV)
def test_only_explicit_dev_or_test_counts(env):
    from app.config import Settings

    assert Settings(environment=env, _env_file=None).is_dev_or_test is False
    for ok in ("development", "test", " Test "):
        assert Settings(environment=ok, _env_file=None).is_dev_or_test is True


def test_unset_environment_is_production(monkeypatch):
    from app.config import Settings

    monkeypatch.delenv("ENVIRONMENT", raising=False)
    assert Settings(_env_file=None).is_dev_or_test is False


@pytest.mark.asyncio
@pytest.mark.parametrize("env", ["staging", "prod", "developement", "qa", ""])
async def test_unknown_environment_refuses_dev_auth_unsigned_stripe_and_demo_codes(client, env):
    from fastapi import HTTPException

    from app.config import settings
    from app.core import auth
    from app.main import app

    with patch.object(settings, "environment", env), patch.object(settings, "stripe_webhook_secret", ""):
        # 1. the dev auth user
        with pytest.raises(HTTPException) as e:
            auth._dev_user_or_refuse()
        assert e.value.status_code == 503
        # 2. an unsigned Stripe event
        r = await client.post("/api/v1/webhooks/stripe", content=b'{"type":"checkout.session.completed"}')
        assert r.status_code == 503
        # 3. the source-shipped Cube 10 demo codes
        app.dependency_overrides[auth.get_current_user] = lambda: auth.CurrentUser(
            user_id="u", email=None, role="moderator", permissions=[])
        try:
            r = await client.post("/api/v1/verify-access",
                                  json={"access_type": "admin", "code": settings.cube10_admin_code})
        finally:
            app.dependency_overrides.pop(auth.get_current_user, None)
        assert r.status_code == 503, r.text


def test_no_production_equality_guard_remains():
    """A guard written as `environment == "production"` opens for every other value (unset,
    staging, a typo). Every guard asks settings.is_dev_or_test instead."""
    # live-vs-test Stripe KEY choice (not a guard): its safe default is the test keys.
    allowed = {("cubes/cube8_tokens/stripe_config.py", "_is_production")}
    bad = []
    for p, tree in _modules():
        rel = str(p.relative_to(APP))
        text = p.read_text()
        funcs = {}
        for fn in ast.walk(tree):
            if isinstance(fn, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for n in ast.walk(fn):
                    funcs.setdefault(id(n), fn.name)
        for n in ast.walk(tree):
            if not isinstance(n, ast.Compare):
                continue
            parts = []
            for c in [n.left, *n.comparators]:
                parts.extend(c.elts if isinstance(c, (ast.Tuple, ast.List, ast.Set)) else [c])
            hit = any(isinstance(c, ast.Constant) and isinstance(c.value, str)
                      and c.value.strip().lower() in ("production", "prod", "live") for c in parts)
            if hit and "environment" in (ast.get_source_segment(text, n) or ""):
                where = funcs.get(id(n), "<module>")
                if (rel, where) not in allowed:
                    bad.append(f"{rel}:{n.lineno} in {where}")
    assert not bad, "environment == 'production' style guards (they fail open): " + ", ".join(sorted(set(bad)))
    for path in ("core/auth.py", "cubes/cube8_tokens/webhook.py", "cubes/cube10_simulation/router.py",
                 "cubes/cube6_ai/providers/factory.py", "core/security.py", "core/participant_token.py"):
        assert "is_dev_or_test" in (APP / path).read_text(), path


def test_app_refuses_to_start_outside_dev_test_without_auth_or_secrets():
    from app.config import Settings, startup_config_errors

    assert startup_config_errors(Settings(environment="test", _env_file=None)) == []
    base = dict(_env_file=None, environment="staging", auth0_domain="x.auth0.com", session_secret="s")
    assert startup_config_errors(Settings(**base)) == []
    assert any("AUTH0_DOMAIN" in e for e in startup_config_errors(Settings(**{**base, "auth0_domain": ""})))
    assert any("SESSION_SECRET" in e for e in startup_config_errors(Settings(**{**base, "session_secret": ""})))
    errs = startup_config_errors(Settings(**base, stripe_secret_key="sk_test_x", stripe_webhook_secret=""))
    assert any("STRIPE_WEBHOOK_SECRET" in e for e in errs)
    src = (APP / "main.py").read_text()
    life = src[src.index("async def lifespan("):src.index("app = FastAPI(")]
    assert "startup_config_errors(settings)" in life and "raise RuntimeError" in life


# ═══ Round 1 (Thor item 6): a daily spend cap on the anonymous paid-AI route ═════════════
def test_daily_budget_counts_per_utc_day():
    from datetime import datetime, timedelta, timezone

    from app.core.spend_cap import DailyBudget

    now = [datetime(2026, 10, 7, 23, 59, tzinfo=timezone.utc)]
    b = DailyBudget("t", lambda: 2, clock=lambda: now[0])
    assert b.try_spend() and b.try_spend() and not b.try_spend()
    assert b.remaining() == 0 and 0 < b.seconds_until_reset() <= 60
    now[0] += timedelta(minutes=2)  # past UTC midnight
    assert b.try_spend(), "a new UTC day has a fresh budget"
    assert not DailyBudget("off", lambda: 0).try_spend(), "0 turns the paid path off"


@pytest.mark.asyncio
async def test_pod_synthesis_refuses_429_once_the_day_is_spent(client):
    from app.core.spend_cap import DailyBudget
    from app.cubes.cube6_ai import pod_router

    class _Paid:
        calls = 0

        async def summarize(self, texts, instruction):
            _Paid.calls += 1
            return "Results.\n\nChanged.\n\nNext."

    budget = DailyBudget("pod_synthesis", lambda: 2)
    with patch.object(pod_router, "POD_SYNTHESIS_BUDGET", budget), \
            patch.object(pod_router, "get_summarization_provider_or_offline", lambda name: _Paid()):
        codes = [(await client.post("/api/v1/pod/synthesis", json={"intent": "x"})).status_code for _ in range(3)]
    assert codes == [200, 200, 429]
    assert _Paid.calls == 2, "the refused call never reaches the paid provider"
    assert "POD_SYNTHESIS_BUDGET.try_spend()" in (APP / "cubes/cube6_ai/pod_router.py").read_text()
