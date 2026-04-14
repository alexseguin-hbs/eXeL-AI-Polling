"""Universal SDK Core — The Governance Engine Interface Layer.

                     ╔═══════════════════════════════════╗
                     ║    eXeL AI Polling — SDK Core      ║
                     ║  "Where Shared Intention moves     ║
                     ║   at the Speed of Thought"         ║
                     ╚═══════════════════════════════════╝

    Every cube, every endpoint, every event flows through this layer.
    SDK consumers (iframe, API, npm package, PyPI) get a uniform,
    beautiful, predictable interface regardless of which cube serves it.

Architecture:
    ┌─────────────────────────────────────────────────────────┐
    │                    SDK CORE LAYER                        │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
    │  │ Envelope  │  │  Events  │  │  Scoping │  │ API Key ││
    │  │ Response  │  │  System  │  │  Context │  │  Auth   ││
    │  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
    │  │ Embed    │  │  Error   │  │  Webhook │  │ Metering││
    │  │ Context  │  │  Codes   │  │  Dispatch│  │ & Usage ││
    │  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
    └─────────────────────────────────────────────────────────┘
              │                │                │
    ┌─────────┴───┐  ┌────────┴───┐  ┌────────┴──────┐
    │  Cube 1-9   │  │  Frontend  │  │  External SDK │
    │  Services   │  │  React UI  │  │  Consumers    │
    └─────────────┘  └────────────┘  └───────────────┘

This module is imported by ALL cubes. It provides:

1. **Envelope** — Uniform JSON response wrapper for every endpoint
2. **Events** — Typed event system (summary_ready, themes_ready, ranking_complete, etc.)
3. **Scoping** — Project → Differentiator → Specification hierarchy
4. **Error Codes** — Machine-readable error codes for SDK consumers
5. **Embed Context** — iframe/Web Component metadata injection
6. **Webhook Dispatch** — Async event callbacks to external systems
7. **API Key Auth** — Per-organization key validation (alongside Auth0 JWT)
8. **Usage Metering** — Track API calls per org/project for billing
"""

from __future__ import annotations

import hashlib
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any

logger = logging.getLogger("sdk")


# ═══════════════════════════════════════════════════════════════════════════
# 1. RESPONSE ENVELOPE — Every API response wears this uniform
# ═══════════════════════════════════════════════════════════════════════════


@dataclass
class Envelope:
    """Standardized API response wrapper.

    SDK consumers can rely on this shape for every endpoint:
    {
        "ok": true,
        "data": { ... },
        "meta": { "cube": "cube7", "request_id": "...", "ts": "...", "duration_ms": 12 },
        "errors": []
    }
    """

    ok: bool
    data: Any
    meta: dict = field(default_factory=dict)
    errors: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "ok": self.ok,
            "data": self.data,
            "meta": self.meta,
            "errors": self.errors,
        }


def success(
    data: Any,
    *,
    cube: str = "",
    request_id: str | None = None,
    start_time: float | None = None,
) -> dict:
    """Wrap successful response in standard envelope."""
    meta = {
        "cube": cube,
        "request_id": request_id or str(uuid.uuid4()),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    if start_time is not None:
        meta["duration_ms"] = round((time.monotonic() - start_time) * 1000, 2)
    return Envelope(ok=True, data=data, meta=meta).to_dict()


def error(
    code: str,
    message: str,
    *,
    cube: str = "",
    status: int = 400,
    details: dict | None = None,
) -> dict:
    """Wrap error response in standard envelope."""
    return Envelope(
        ok=False,
        data=None,
        meta={"cube": cube, "ts": datetime.now(timezone.utc).isoformat()},
        errors=[{
            "code": code,
            "message": message,
            "status": status,
            **({"details": details} if details else {}),
        }],
    ).to_dict()


# ═══════════════════════════════════════════════════════════════════════════
# 2. EVENT SYSTEM — Typed events for real-time + webhooks + SDK callbacks
# ═══════════════════════════════════════════════════════════════════════════


class EventType(str, Enum):
    """All events in the eXeL governance engine.

    Naming: {cube}.{noun}_{verb} — past tense for completed events.
    SDK consumers subscribe by event type. iframe postMessage uses these.
    """

    # Cube 1 — Session
    SESSION_CREATED = "session.created"
    SESSION_OPENED = "session.opened"
    SESSION_CLOSED = "session.closed"
    SESSION_STATUS_CHANGED = "session.status_changed"
    PARTICIPANT_JOINED = "session.participant_joined"
    PARTICIPANT_LEFT = "session.participant_left"

    # Cube 2/3 — Input
    RESPONSE_SUBMITTED = "input.response_submitted"
    RESPONSE_VALIDATED = "input.response_validated"
    PII_DETECTED = "input.pii_detected"

    # Cube 4 — Collection
    RESPONSE_STORED = "collection.response_stored"
    BATCH_COLLECTED = "collection.batch_collected"

    # Cube 5 — Gateway / Orchestrator
    PIPELINE_STARTED = "pipeline.started"
    PIPELINE_COMPLETED = "pipeline.completed"
    PIPELINE_FAILED = "pipeline.failed"

    # Cube 6 — AI Theming
    SUMMARY_READY = "ai.summary_ready"
    THEMES_READY = "ai.themes_ready"
    CQS_SCORED = "ai.cqs_scored"

    # Cube 7 — Ranking
    RANKING_SUBMITTED = "ranking.submitted"
    RANKING_PROGRESS = "ranking.progress"
    RANKING_COMPLETE = "ranking.complete"
    RANKING_OVERRIDE = "ranking.override_applied"

    # Cube 8 — Tokens
    TOKENS_AWARDED = "tokens.awarded"
    TOKENS_FINALIZED = "tokens.finalized"
    PAYMENT_COMPLETED = "payment.completed"

    # Cube 9 — Reports
    EXPORT_READY = "report.export_ready"
    DASHBOARD_UPDATED = "report.dashboard_updated"


@dataclass
class Event:
    """Typed event for broadcast, webhook, and SDK callback dispatch."""

    type: EventType
    session_id: str
    payload: dict
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "type": self.type.value,
            "session_id": self.session_id,
            "payload": self.payload,
            "timestamp": self.timestamp,
        }

    def to_postmessage(self) -> dict:
        """Format for iframe postMessage API."""
        return {
            "source": "exel-ai-polling",
            "version": "1",
            **self.to_dict(),
        }


async def emit(event: Event, short_code: str | None = None) -> None:
    """Emit event to all channels: Supabase broadcast + webhook queue.

    This is the single point of event emission for the entire system.
    All cubes call sdk.emit() instead of raw broadcast_event().
    """
    # 1. Supabase Realtime broadcast
    if short_code:
        try:
            from app.core.supabase_broadcast import broadcast_event

            await broadcast_event(
                channel=f"session:{short_code}",
                event=event.type.value,
                payload=event.to_dict(),
            )
        except Exception as exc:
            logger.debug("sdk.emit.broadcast_failed", extra={"error": str(exc)})

    # 2. Webhook dispatch (async, non-blocking)
    # TODO: Implement webhook queue (Cube 10 / SDK phase)
    logger.info(
        "sdk.event.emitted",
        extra={
            "event_type": event.type.value,
            "session_id": event.session_id,
            "event_id": event.event_id,
        },
    )


# ═══════════════════════════════════════════════════════════════════════════
# 3. SCOPING — Project → Differentiator → Specification hierarchy
# ═══════════════════════════════════════════════════════════════════════════


@dataclass
class ScopingContext:
    """Hierarchical scoping for SDK/API consumers.

    Every API call inherits scoping from the session:
      Project (top-level container)
        └─ Differentiator (dimension/feature/hypothesis)
             └─ Specification (parameter/constraint)

    SDK consumers set this at initialization. All data is isolated per scope.
    """

    project_id: str | None = None
    differentiator_id: str | None = None
    specification_id: str | None = None
    organization_id: str | None = None

    @property
    def scope_key(self) -> str:
        """Unique scope identifier for data isolation."""
        parts = [
            self.organization_id or "_",
            self.project_id or "_",
            self.differentiator_id or "_",
            self.specification_id or "_",
        ]
        return ":".join(parts)

    def to_dict(self) -> dict:
        return {
            "organization_id": self.organization_id,
            "project_id": self.project_id,
            "differentiator_id": self.differentiator_id,
            "specification_id": self.specification_id,
        }


# ═══════════════════════════════════════════════════════════════════════════
# 4. ERROR CODES — Machine-readable, SDK-friendly
# ═══════════════════════════════════════════════════════════════════════════


class ErrorCode(str, Enum):
    """Stable error codes for SDK consumers. Never rename these."""

    # Auth
    UNAUTHORIZED = "AUTH_UNAUTHORIZED"
    FORBIDDEN = "AUTH_FORBIDDEN"
    INVALID_API_KEY = "AUTH_INVALID_API_KEY"
    RATE_LIMITED = "AUTH_RATE_LIMITED"

    # Session
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND"
    SESSION_EXPIRED = "SESSION_EXPIRED"
    SESSION_FULL = "SESSION_FULL"
    INVALID_STATUS_TRANSITION = "SESSION_INVALID_TRANSITION"

    # Input
    VALIDATION_FAILED = "INPUT_VALIDATION_FAILED"
    PII_REJECTED = "INPUT_PII_REJECTED"
    DUPLICATE_SUBMISSION = "INPUT_DUPLICATE"
    CONTENT_TOO_LONG = "INPUT_TOO_LONG"

    # Ranking
    RANKING_NOT_OPEN = "RANKING_NOT_OPEN"
    THEME_MISMATCH = "RANKING_THEME_MISMATCH"
    ALREADY_SUBMITTED = "RANKING_ALREADY_SUBMITTED"
    INVALID_OVERRIDE = "RANKING_INVALID_OVERRIDE"

    # Pipeline
    PIPELINE_IN_PROGRESS = "PIPELINE_IN_PROGRESS"
    PIPELINE_FAILED = "PIPELINE_FAILED"
    PROVIDER_UNAVAILABLE = "AI_PROVIDER_UNAVAILABLE"

    # Payment
    PAYMENT_REQUIRED = "PAYMENT_REQUIRED"
    TIER_LIMIT_EXCEEDED = "TIER_LIMIT_EXCEEDED"

    # Generic
    NOT_FOUND = "NOT_FOUND"
    INTERNAL_ERROR = "INTERNAL_ERROR"


# ═══════════════════════════════════════════════════════════════════════════
# 5. EMBED CONTEXT — iframe / Web Component metadata
# ═══════════════════════════════════════════════════════════════════════════


@dataclass
class EmbedConfig:
    """Configuration for embedded mode (iframe / Web Component).

    SDK consumers pass this at initialization:
      const poll = new ExelPolling({
        mode: 'iframe',
        container: '#poll-container',
        sessionCode: 'DEMO2026',
        theme: 'ai-cyan',
        locale: 'en',
        onEvent: (event) => console.log(event),
      });
    """

    mode: str = "standalone"  # standalone | iframe | headless | hybrid
    session_code: str | None = None
    theme_id: str = "exel-cyan"
    locale: str = "en"
    show_branding: bool = True
    allow_theme_change: bool = False
    parent_origin: str | None = None  # For postMessage security

    def to_dict(self) -> dict:
        return {
            "mode": self.mode,
            "session_code": self.session_code,
            "theme_id": self.theme_id,
            "locale": self.locale,
            "show_branding": self.show_branding,
            "allow_theme_change": self.allow_theme_change,
        }


# ═══════════════════════════════════════════════════════════════════════════
# 6. API KEY AUTH — Per-organization key validation
# ═══════════════════════════════════════════════════════════════════════════


@dataclass
class APIKeyContext:
    """Validated API key context. Attached to requests via middleware."""

    key_id: str
    organization_id: str
    project_ids: list[str]  # Scoped access
    rate_limit: int = 1000  # Requests per minute
    tier: str = "standard"  # free | standard | enterprise
    is_active: bool = True

    def has_project_access(self, project_id: str) -> bool:
        """Check if this key can access the given project."""
        return not self.project_ids or project_id in self.project_ids


def generate_api_key(organization_id: str) -> tuple[str, str]:
    """Generate an API key pair: (public_key, secret_hash).

    Public key format: exel_pk_{org_prefix}_{random}
    Secret is hashed for storage — never stored raw.
    """
    prefix = organization_id[:8].lower().replace("-", "")
    random_part = uuid.uuid4().hex[:24]
    public_key = f"exel_pk_{prefix}_{random_part}"
    secret_hash = hashlib.sha256(public_key.encode()).hexdigest()
    return public_key, secret_hash


def validate_api_key_format(key: str) -> bool:
    """Check if a string looks like a valid eXeL API key."""
    return key.startswith("exel_pk_") and len(key) >= 32


# ═══════════════════════════════════════════════════════════════════════════
# 7. USAGE METERING — Track API calls per org for billing
# ═══════════════════════════════════════════════════════════════════════════


@dataclass
class UsageMeter:
    """Lightweight in-memory usage counter. Flushed to DB periodically."""

    organization_id: str
    counts: dict[str, int] = field(default_factory=dict)

    def record(self, endpoint: str) -> None:
        """Record one API call to an endpoint."""
        self.counts[endpoint] = self.counts.get(endpoint, 0) + 1

    @property
    def total(self) -> int:
        return sum(self.counts.values())

    def to_dict(self) -> dict:
        return {
            "organization_id": self.organization_id,
            "total_calls": self.total,
            "by_endpoint": self.counts,
        }


# ═══════════════════════════════════════════════════════════════════════════
# 8. CUBE REGISTRY — Self-describing cubes for SDK discovery
# ═══════════════════════════════════════════════════════════════════════════


@dataclass
class CubeDescriptor:
    """Self-describing cube metadata for SDK auto-discovery.

    The /api/v1/cubes endpoint returns all registered cubes so SDK
    consumers can dynamically discover available functionality.
    """

    id: int
    name: str
    description: str
    endpoints: list[str]
    events: list[str]
    mvp: int
    status: str  # "active" | "stub" | "beta"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "endpoints": self.endpoints,
            "events": self.events,
            "mvp": self.mvp,
            "status": self.status,
        }


# Cube registry — populated at import time
CUBE_REGISTRY: list[CubeDescriptor] = [
    CubeDescriptor(
        id=1, name="Session", description="Session lifecycle, QR codes, join flow",
        endpoints=["/sessions", "/sessions/{id}", "/sessions/{id}/join"],
        events=["session.created", "session.opened", "session.closed",
                "session.participant_joined"],
        mvp=1, status="active",
    ),
    CubeDescriptor(
        id=2, name="Text Input", description="Text submission, validation, PII detection",
        endpoints=["/sessions/{id}/responses"],
        events=["input.response_submitted", "input.pii_detected"],
        mvp=1, status="active",
    ),
    CubeDescriptor(
        id=3, name="Voice Input", description="Voice-to-text, multi-provider STT",
        endpoints=["/sessions/{id}/voice"],
        events=["input.response_submitted"],
        mvp=2, status="active",
    ),
    CubeDescriptor(
        id=4, name="Collector", description="Response aggregation, presence tracking",
        endpoints=["/sessions/{id}/responses", "/sessions/{id}/presence"],
        events=["collection.response_stored"],
        mvp=1, status="active",
    ),
    CubeDescriptor(
        id=5, name="Gateway", description="Pipeline orchestration, time tracking",
        endpoints=["/sessions/{id}/pipeline", "/sessions/{id}/time"],
        events=["pipeline.started", "pipeline.completed", "pipeline.failed"],
        mvp=1, status="active",
    ),
    CubeDescriptor(
        id=6, name="AI Theming", description="Embeddings, clustering, theme generation",
        endpoints=["/sessions/{id}/ai/run", "/sessions/{id}/themes"],
        events=["ai.summary_ready", "ai.themes_ready", "ai.cqs_scored"],
        mvp=1, status="active",
    ),
    CubeDescriptor(
        id=7, name="Ranking", description="Voting, Borda aggregation, governance",
        endpoints=["/sessions/{id}/rankings", "/sessions/{id}/rankings/aggregate",
                   "/sessions/{id}/override"],
        events=["ranking.submitted", "ranking.progress", "ranking.complete",
                "ranking.override_applied"],
        mvp=1, status="active",
    ),
    CubeDescriptor(
        id=8, name="Tokens", description="SoI Trinity tokens, ledger, payments",
        endpoints=["/sessions/{id}/tokens", "/rates"],
        events=["tokens.awarded", "tokens.finalized", "payment.completed"],
        mvp=3, status="beta",
    ),
    CubeDescriptor(
        id=9, name="Reports", description="CSV/PDF export, analytics, CQS dashboard",
        endpoints=["/sessions/{id}/export", "/sessions/{id}/dashboard"],
        events=["report.export_ready", "report.dashboard_updated"],
        mvp=1, status="beta",
    ),
    CubeDescriptor(
        id=10, name="Simulation", description="Self-evolving platform: feedback, code submissions, voting, deployment",
        endpoints=["/feedback", "/submissions", "/submissions/{id}/test", "/submissions/{id}/tally"],
        events=["simulation.submission_created", "simulation.vote_cast", "simulation.deployed", "simulation.reverted"],
        mvp=3, status="beta",
    ),
    CubeDescriptor(
        id=11, name="Blockchain", description="Quai/QI on-chain governance: survey proofs, AI/SI/HI token conversion, chain recording",
        endpoints=["/chain/record-survey", "/chain/verify/{session_hash}", "/chain/convert-tokens"],
        events=["chain.survey_recorded", "chain.tokens_converted", "chain.verification_requested"],
        mvp=3, status="planned",
    ),
    CubeDescriptor(
        id=12, name="Divinity & NFT", description="Divinity Guide reader + NFT ARX physically-backed tokens: mint, verify, transfer, marketplace",
        endpoints=["/divinity-guide", "/arx/mint", "/arx/verify/{token_id}", "/arx/transfer", "/arx/marketplace"],
        events=["arx.minted", "arx.transferred", "arx.verified", "divinity.chapter_read", "divinity.donation_received"],
        mvp=3, status="planned",
    ),
]


def get_cube_registry() -> list[dict]:
    """Return all cubes for SDK auto-discovery."""
    return [c.to_dict() for c in CUBE_REGISTRY]


# ═══════════════════════════════════════════════════════════════════════════
# CROSS-CUBE UNIVERSAL FUNCTIONS — Used by ALL cubes
# ═══════════════════════════════════════════════════════════════════════════
#
# These are the shared functions identified across Cubes 1-9:
#
# ┌──────────────────────────┬───────────────────────────────────────────┐
# │ Module                   │ Used By                                   │
# ├──────────────────────────┼───────────────────────────────────────────┤
# │ auth.py (135 lines)      │ ALL cubes — JWT + dev-mode auth           │
# │ dependencies.py (16)     │ ALL cubes — get_db                        │
# │ permissions.py (23)      │ C1,C2,C5,C6,C7,C8,C9 — RBAC require_role│
# │ exceptions.py (85)       │ C1,C2,C3,C4 — typed error hierarchy      │
# │ supabase_broadcast.py(107)│ C5,C6,C7 — real-time event push         │
# │ rate_limit.py (24)       │ C1,C2,C3 — request throttling            │
# │ circuit_breaker.py (85)  │ C3,C6 — AI provider failover             │
# │ concurrency.py (53)      │ C2,C3,C5 — session semaphore pool        │
# │ text_pipeline.py (77)    │ C2,C3 — text validation + PII pipeline   │
# │ crypto_utils.py (77)     │ C2,C3,C4 — anonymization hashing         │
# │ phase_a_retry.py (191)   │ C2,C3 — AI summarization with retry      │
# │ submission_validators(107)│ C2,C3,C4 — input validation              │
# │ presence.py (69)         │ C1,C4 — in-memory presence tracking       │
# │ hi_rates.py (135)        │ C5,C8 — jurisdiction wage rates           │
# │ security.py (35)         │ C1 — anonymize_user_id                    │
# │ middleware.py (109)       │ ALL — CORS, security headers             │
# │ determinism.py (47)      │ C6 — replay hash verification            │
# │ logging.py (49)          │ ALL — structured JSON logging             │
# │ sdk.py (THIS FILE)       │ ALL — envelope, events, scoping, embed    │
# └──────────────────────────┴───────────────────────────────────────────┘
#
# SDK consumers inherit all of this automatically. The npm/PyPI SDK wraps
# these into typed client methods:
#
#   const sdk = new ExelPolling({ apiKey: 'exel_pk_...' });
#   const session = await sdk.sessions.create({ title: '...' });
#   sdk.on('ranking.complete', (event) => { ... });
#   const themes = await sdk.themes.list(session.id);
#   const csv = await sdk.reports.export(session.id, 'csv');
#
