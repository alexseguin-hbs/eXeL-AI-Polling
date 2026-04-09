"""Universal Function Registry — Internal ≡ External API Contract.

    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║  "Every internal function is an API endpoint waiting to happen."  ║
    ║                                                                   ║
    ║  The Marble Method, applied to our own codebase:                 ║
    ║  1. Identify universal patterns across 9 cubes                   ║
    ║  2. Consolidate to canonical I/O contracts                       ║
    ║  3. Internal functions use SAME signature as external SDK        ║
    ║  4. External SDK wraps these — zero translation layer needed     ║
    ║                                                                   ║
    ║  Result: Internal service call = External API call = SDK call    ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝

Architecture:

    ┌─────────────────────────────────────────────────────────────┐
    │                UNIVERSAL FUNCTION REGISTRY                   │
    │                                                              │
    │  Internal:   service.create_session(params) → SessionResult │
    │  REST API:   POST /sessions {params} → {ok, data, meta}    │
    │  SDK (JS):   sdk.sessions.create(params) → SessionResult   │
    │  SDK (Py):   sdk.sessions.create(params) → SessionResult   │
    │  iframe:     postMessage({action: "create_session", params})│
    │                                                              │
    │  ALL FIVE PATHS CALL THE SAME FUNCTION WITH SAME I/O.      │
    └─────────────────────────────────────────────────────────────┘

Universal patterns identified across all 9 cubes:

  1. CRUD (Create/Read/Update/Delete) — session, participant, response, theme
  2. COMPUTE — token calculation, Borda scoring, CQS scoring
  3. VALIDATE — input validation, PII detection, anomaly detection
  4. BROADCAST — real-time event push (summary_ready, themes_ready, etc.)
  5. EXPORT — CSV, PDF, analytics JSON
  6. LIFECYCLE — state transitions (session, tokens, pipeline)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable

logger = logging.getLogger("universal")


# ═══════════════════════════════════════════════════════════════════
# FUNCTION CATEGORIES — The 6 Universal Patterns
# ═══════════════════════════════════════════════════════════════════


class FunctionCategory(str, Enum):
    """Every function in the system belongs to one of these 6 categories."""

    CRUD = "crud"           # Create/Read/Update/Delete operations
    COMPUTE = "compute"     # Algorithms: scoring, aggregation, calculation
    VALIDATE = "validate"   # Input validation, PII, anomaly detection
    BROADCAST = "broadcast" # Real-time event push
    EXPORT = "export"       # Data export: CSV, PDF, analytics
    LIFECYCLE = "lifecycle" # State transitions


# ═══════════════════════════════════════════════════════════════════
# FUNCTION DESCRIPTOR — Self-describing function metadata
# ═══════════════════════════════════════════════════════════════════


@dataclass
class UniversalFunction:
    """Describes one function available internally AND externally.

    The same descriptor drives:
      - Internal service dispatch
      - REST API endpoint registration
      - SDK method generation
      - OpenAPI documentation
      - iframe postMessage handler
    """

    name: str                           # e.g., "create_session"
    cube: int                           # 1-9
    category: FunctionCategory
    description: str
    endpoint: str                       # REST path: "/sessions"
    method: str                         # HTTP method: "POST"
    auth_required: bool = True
    roles: list[str] = field(default_factory=list)  # ["moderator", "admin"]
    input_schema: str = ""              # Pydantic model name
    output_schema: str = ""             # Pydantic model name
    is_async: bool = True
    is_idempotent: bool = False         # Safe to retry?
    broadcasts_event: str | None = None # Event type emitted

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "cube": self.cube,
            "category": self.category.value,
            "description": self.description,
            "endpoint": self.endpoint,
            "method": self.method,
            "auth_required": self.auth_required,
            "roles": self.roles,
            "input_schema": self.input_schema,
            "output_schema": self.output_schema,
            "is_idempotent": self.is_idempotent,
            "broadcasts_event": self.broadcasts_event,
        }


# ═══════════════════════════════════════════════════════════════════
# REGISTRY — All universal functions across all 9 cubes
# ═══════════════════════════════════════════════════════════════════


UNIVERSAL_FUNCTIONS: list[UniversalFunction] = [
    # ── Cube 1: Session ──
    UniversalFunction("create_session", 1, FunctionCategory.CRUD,
        "Create a new polling session", "/sessions", "POST",
        roles=["moderator", "admin"], input_schema="SessionCreate",
        output_schema="SessionRead", broadcasts_event="session.created"),
    UniversalFunction("join_session", 1, FunctionCategory.CRUD,
        "Join an existing session by code", "/sessions/{id}/join", "POST",
        auth_required=False, input_schema="JoinRequest",
        output_schema="ParticipantRead", broadcasts_event="session.participant_joined"),
    UniversalFunction("get_session", 1, FunctionCategory.CRUD,
        "Get session details", "/sessions/{id}", "GET",
        auth_required=False, output_schema="SessionRead", is_idempotent=True),
    UniversalFunction("transition_session", 1, FunctionCategory.LIFECYCLE,
        "Transition session status", "/sessions/{id}/status", "PATCH",
        roles=["moderator", "admin"], broadcasts_event="session.status_changed"),

    # ── Cube 2: Text Input ──
    UniversalFunction("submit_text", 2, FunctionCategory.CRUD,
        "Submit text response", "/sessions/{id}/responses", "POST",
        input_schema="ResponseCreate", output_schema="ResponseRead",
        broadcasts_event="input.response_submitted"),
    UniversalFunction("validate_text", 2, FunctionCategory.VALIDATE,
        "Validate + PII-check text input", "/sessions/{id}/responses/validate", "POST",
        input_schema="TextValidateRequest"),

    # ── Cube 3: Voice ──
    UniversalFunction("submit_voice", 3, FunctionCategory.CRUD,
        "Submit voice response (audio → transcript → text)", "/sessions/{id}/voice", "POST",
        input_schema="VoiceSubmitRequest", output_schema="ResponseRead",
        broadcasts_event="input.response_submitted"),

    # ── Cube 4: Collector ──
    UniversalFunction("get_responses", 4, FunctionCategory.CRUD,
        "Get collected responses for session", "/sessions/{id}/collected", "GET",
        output_schema="CollectedResponseList", is_idempotent=True),
    UniversalFunction("get_presence", 4, FunctionCategory.CRUD,
        "Get active participant count", "/sessions/{id}/presence", "GET",
        auth_required=False, is_idempotent=True),

    # ── Cube 5: Gateway ──
    UniversalFunction("trigger_pipeline", 5, FunctionCategory.LIFECYCLE,
        "Trigger AI theming pipeline", "/sessions/{id}/pipeline/trigger", "POST",
        roles=["moderator", "admin"],
        broadcasts_event="pipeline.started"),
    UniversalFunction("get_pipeline_status", 5, FunctionCategory.CRUD,
        "Get pipeline status", "/sessions/{id}/pipeline/status", "GET",
        roles=["moderator", "admin"], is_idempotent=True),

    # ── Cube 6: AI Theming ──
    UniversalFunction("run_theming", 6, FunctionCategory.COMPUTE,
        "Run Marble Method theme pipeline", "/sessions/{id}/ai/run", "POST",
        roles=["moderator", "admin"],
        broadcasts_event="ai.themes_ready"),
    UniversalFunction("get_themes", 6, FunctionCategory.CRUD,
        "Get generated themes", "/sessions/{id}/themes", "GET",
        output_schema="ThemeList", is_idempotent=True),

    # ── Cube 7: Ranking ──
    UniversalFunction("submit_ranking", 7, FunctionCategory.CRUD,
        "Submit participant ranking", "/sessions/{id}/rankings", "POST",
        input_schema="RankingSubmit", output_schema="RankingRead",
        broadcasts_event="ranking.submitted"),
    UniversalFunction("aggregate_rankings", 7, FunctionCategory.COMPUTE,
        "Trigger Borda aggregation", "/sessions/{id}/rankings/aggregate", "POST",
        roles=["moderator", "admin"],
        broadcasts_event="ranking.complete"),
    UniversalFunction("get_rankings", 7, FunctionCategory.CRUD,
        "Get aggregated rankings", "/sessions/{id}/rankings", "GET",
        output_schema="AggregatedRankingList", is_idempotent=True),
    UniversalFunction("override_ranking", 7, FunctionCategory.LIFECYCLE,
        "Apply governance override", "/sessions/{id}/override", "POST",
        roles=["lead", "admin"], input_schema="GovernanceOverrideSubmit",
        broadcasts_event="ranking.override_applied"),

    # ── Cube 8: Tokens ──
    UniversalFunction("get_balance", 8, FunctionCategory.CRUD,
        "Get user token balance", "/sessions/{id}/tokens/balance", "GET",
        output_schema="TokenBalance", is_idempotent=True),
    UniversalFunction("get_rates", 8, FunctionCategory.CRUD,
        "Get jurisdiction rate table", "/tokens/rates", "GET",
        auth_required=False, is_idempotent=True),
    UniversalFunction("file_dispute", 8, FunctionCategory.CRUD,
        "File token dispute", "/tokens/dispute", "POST",
        input_schema="TokenDisputeCreate"),

    # ── Cube 9: Reports ──
    UniversalFunction("export_csv", 9, FunctionCategory.EXPORT,
        "Export session results as CSV", "/sessions/{id}/export/csv", "GET",
        is_idempotent=True),
    UniversalFunction("get_analytics", 9, FunctionCategory.EXPORT,
        "Get session analytics dashboard", "/sessions/{id}/analytics", "GET",
        roles=["moderator", "admin"], is_idempotent=True),
    UniversalFunction("get_cqs_dashboard", 9, FunctionCategory.EXPORT,
        "Get CQS scoring dashboard", "/sessions/{id}/cqs-dashboard", "GET",
        roles=["moderator", "admin"], is_idempotent=True),
]


def get_registry() -> list[dict]:
    """Return all universal functions for SDK codegen."""
    return [f.to_dict() for f in UNIVERSAL_FUNCTIONS]


def get_by_cube(cube_id: int) -> list[dict]:
    """Get all functions for a specific cube."""
    return [f.to_dict() for f in UNIVERSAL_FUNCTIONS if f.cube == cube_id]


def get_by_category(category: FunctionCategory) -> list[dict]:
    """Get all functions of a category across all cubes."""
    return [f.to_dict() for f in UNIVERSAL_FUNCTIONS if f.category == category]


def get_idempotent() -> list[dict]:
    """Get all idempotent functions (safe to cache/retry)."""
    return [f.to_dict() for f in UNIVERSAL_FUNCTIONS if f.is_idempotent]


def get_public() -> list[dict]:
    """Get all functions that don't require auth (public API)."""
    return [f.to_dict() for f in UNIVERSAL_FUNCTIONS if not f.auth_required]


def get_broadcasting() -> list[dict]:
    """Get all functions that emit real-time events."""
    return [f.to_dict() for f in UNIVERSAL_FUNCTIONS if f.broadcasts_event]
