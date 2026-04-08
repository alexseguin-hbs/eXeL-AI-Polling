"""SDK Core — Universal layer tests.

Verifies envelope, events, scoping, error codes, API key generation,
cube registry, embed config, and usage metering.
"""

import time
import uuid

import pytest

from app.core.sdk import (
    CUBE_REGISTRY,
    APIKeyContext,
    CubeDescriptor,
    EmbedConfig,
    Envelope,
    ErrorCode,
    Event,
    EventType,
    ScopingContext,
    UsageMeter,
    error,
    generate_api_key,
    get_cube_registry,
    success,
    validate_api_key_format,
)


# ---------------------------------------------------------------------------
# 1. Response Envelope
# ---------------------------------------------------------------------------


class TestEnvelope:
    """Standard response wrapper."""

    def test_success_envelope(self):
        result = success({"themes": 3}, cube="cube7")
        assert result["ok"] is True
        assert result["data"]["themes"] == 3
        assert result["meta"]["cube"] == "cube7"
        assert "request_id" in result["meta"]
        assert "ts" in result["meta"]

    def test_success_with_duration(self):
        start = time.monotonic()
        result = success({"count": 1}, start_time=start)
        assert "duration_ms" in result["meta"]
        assert result["meta"]["duration_ms"] >= 0

    def test_error_envelope(self):
        result = error("SESSION_NOT_FOUND", "Session does not exist", cube="cube1")
        assert result["ok"] is False
        assert result["data"] is None
        assert len(result["errors"]) == 1
        assert result["errors"][0]["code"] == "SESSION_NOT_FOUND"

    def test_error_with_details(self):
        result = error(
            "INPUT_VALIDATION_FAILED", "Too long",
            details={"max": 3333, "actual": 5000},
        )
        assert result["errors"][0]["details"]["max"] == 3333

    def test_envelope_to_dict(self):
        env = Envelope(ok=True, data={"x": 1})
        d = env.to_dict()
        assert d["ok"] is True
        assert d["data"]["x"] == 1
        assert d["errors"] == []


# ---------------------------------------------------------------------------
# 2. Event System
# ---------------------------------------------------------------------------


class TestEventSystem:
    """Typed events for broadcast + webhook + SDK."""

    def test_event_creation(self):
        evt = Event(
            type=EventType.THEMES_READY,
            session_id="abc-123",
            payload={"theme_count": 3},
        )
        assert evt.type == EventType.THEMES_READY
        assert evt.session_id == "abc-123"

    def test_event_to_dict(self):
        evt = Event(
            type=EventType.RANKING_COMPLETE,
            session_id="sess-1",
            payload={"top_theme2_id": "theme-xyz"},
        )
        d = evt.to_dict()
        assert d["type"] == "ranking.complete"
        assert "event_id" in d
        assert "timestamp" in d

    def test_event_to_postmessage(self):
        evt = Event(
            type=EventType.SESSION_CREATED,
            session_id="s1",
            payload={},
        )
        pm = evt.to_postmessage()
        assert pm["source"] == "exel-ai-polling"
        assert pm["version"] == "1"
        assert pm["type"] == "session.created"

    def test_all_event_types_are_strings(self):
        for et in EventType:
            assert isinstance(et.value, str)
            assert "." in et.value

    def test_event_types_cover_all_cubes(self):
        values = [et.value for et in EventType]
        assert any("session." in v for v in values)  # Cube 1
        assert any("input." in v for v in values)     # Cube 2/3
        assert any("collection." in v for v in values) # Cube 4
        assert any("pipeline." in v for v in values)  # Cube 5
        assert any("ai." in v for v in values)        # Cube 6
        assert any("ranking." in v for v in values)   # Cube 7
        assert any("tokens." in v for v in values)    # Cube 8
        assert any("report." in v for v in values)    # Cube 9


# ---------------------------------------------------------------------------
# 3. Scoping Context
# ---------------------------------------------------------------------------


class TestScopingContext:
    """Project → Differentiator → Specification hierarchy."""

    def test_scope_key(self):
        ctx = ScopingContext(
            organization_id="org-1",
            project_id="proj-1",
            differentiator_id="diff-1",
            specification_id="spec-1",
        )
        assert ctx.scope_key == "org-1:proj-1:diff-1:spec-1"

    def test_scope_key_missing_fields(self):
        ctx = ScopingContext(project_id="proj-1")
        assert ctx.scope_key == "_:proj-1:_:_"

    def test_scope_to_dict(self):
        ctx = ScopingContext(organization_id="org-1")
        d = ctx.to_dict()
        assert d["organization_id"] == "org-1"
        assert d["project_id"] is None

    def test_empty_scope(self):
        ctx = ScopingContext()
        assert ctx.scope_key == "_:_:_:_"


# ---------------------------------------------------------------------------
# 4. Error Codes
# ---------------------------------------------------------------------------


class TestErrorCodes:
    """Machine-readable error codes."""

    def test_all_codes_are_strings(self):
        for code in ErrorCode:
            assert isinstance(code.value, str)
            assert "_" in code.value

    def test_auth_codes_exist(self):
        assert ErrorCode.UNAUTHORIZED.value == "AUTH_UNAUTHORIZED"
        assert ErrorCode.RATE_LIMITED.value == "AUTH_RATE_LIMITED"

    def test_ranking_codes_exist(self):
        assert ErrorCode.RANKING_NOT_OPEN.value == "RANKING_NOT_OPEN"
        assert ErrorCode.ALREADY_SUBMITTED.value == "RANKING_ALREADY_SUBMITTED"

    def test_no_duplicate_values(self):
        values = [c.value for c in ErrorCode]
        assert len(values) == len(set(values))


# ---------------------------------------------------------------------------
# 5. Embed Config
# ---------------------------------------------------------------------------


class TestEmbedConfig:
    """iframe / Web Component configuration."""

    def test_default_standalone(self):
        cfg = EmbedConfig()
        assert cfg.mode == "standalone"
        assert cfg.theme_id == "exel-cyan"
        assert cfg.locale == "en"

    def test_iframe_mode(self):
        cfg = EmbedConfig(mode="iframe", session_code="DEMO2026", locale="fr")
        d = cfg.to_dict()
        assert d["mode"] == "iframe"
        assert d["session_code"] == "DEMO2026"
        assert d["locale"] == "fr"


# ---------------------------------------------------------------------------
# 6. API Key Auth
# ---------------------------------------------------------------------------


class TestAPIKeyAuth:
    """Per-organization API key validation."""

    def test_generate_api_key(self):
        pub, secret_hash = generate_api_key("org-12345678-abc")
        assert pub.startswith("exel_pk_")
        assert len(pub) >= 32
        assert len(secret_hash) == 64  # SHA-256

    def test_validate_format(self):
        assert validate_api_key_format("exel_pk_org12345_abc123def456ghi789jkl012")
        assert not validate_api_key_format("sk_test_1234")
        assert not validate_api_key_format("short")

    def test_api_key_context(self):
        ctx = APIKeyContext(
            key_id="key-1",
            organization_id="org-1",
            project_ids=["proj-1", "proj-2"],
        )
        assert ctx.has_project_access("proj-1")
        assert not ctx.has_project_access("proj-999")

    def test_empty_project_ids_grants_all(self):
        ctx = APIKeyContext(
            key_id="key-1",
            organization_id="org-1",
            project_ids=[],
        )
        assert ctx.has_project_access("any-project")


# ---------------------------------------------------------------------------
# 7. Usage Metering
# ---------------------------------------------------------------------------


class TestUsageMetering:
    """API call tracking per org."""

    def test_record_and_total(self):
        meter = UsageMeter(organization_id="org-1")
        meter.record("/sessions")
        meter.record("/sessions")
        meter.record("/rankings")
        assert meter.total == 3
        assert meter.counts["/sessions"] == 2

    def test_to_dict(self):
        meter = UsageMeter(organization_id="org-1")
        meter.record("/themes")
        d = meter.to_dict()
        assert d["organization_id"] == "org-1"
        assert d["total_calls"] == 1


# ---------------------------------------------------------------------------
# 8. Cube Registry
# ---------------------------------------------------------------------------


class TestCubeRegistry:
    """Self-describing cubes for SDK discovery."""

    def test_nine_cubes_registered(self):
        assert len(CUBE_REGISTRY) == 9

    def test_all_cubes_have_ids_1_to_9(self):
        ids = [c.id for c in CUBE_REGISTRY]
        assert ids == list(range(1, 10))

    def test_registry_dict_format(self):
        registry = get_cube_registry()
        assert len(registry) == 9
        for cube in registry:
            assert "id" in cube
            assert "name" in cube
            assert "endpoints" in cube
            assert "events" in cube
            assert "mvp" in cube

    def test_all_cubes_have_events(self):
        for cube in CUBE_REGISTRY:
            assert len(cube.events) > 0, f"Cube {cube.id} has no events"

    def test_cube_7_is_active(self):
        c7 = next(c for c in CUBE_REGISTRY if c.id == 7)
        assert c7.status == "active"
        assert "ranking" in c7.endpoints[0]
