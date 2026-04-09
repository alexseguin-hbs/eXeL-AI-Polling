"""The 9 SDK Functions + 3 Internal API Calls.

    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║   9 SDK FUNCTIONS (External — ◬ tokens per call)                 ║
    ║   3 INTERNAL APIs (Free — core platform workflow)                ║
    ║                                                                   ║
    ║   Together: a complete governance engine for any platform.        ║
    ║                                                                   ║
    ║   const sdk = new ExelPolling({ apiKey: 'exel_pk_...' });        ║
    ║   const themes = await sdk.compress(texts);                      ║
    ║   const result = await sdk.vote(session, rankings);              ║
    ║   const proof  = await sdk.verify(session);                      ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class CostBasis(str, Enum):
    """How the SDK function is priced."""
    PER_1K_TEXTS = "per_1k_texts"      # Theme compression
    PER_VOTE = "per_vote"               # Quadratic voting
    PER_SCAN = "per_scan"               # Anomaly detection
    PER_POLL = "per_poll"               # Consensus detection
    PER_SUBMISSION = "per_submission"    # Challenge system
    PER_OVERRIDE = "per_override"       # Transparent override
    PER_10K_RECIPIENTS = "per_10k_recipients"  # Broadcast
    FREE = "free"                       # Verification + conversion + internal


@dataclass
class SDKFunction:
    """One of the 9 paid SDK functions or 3 free internal calls."""

    number: int
    name: str
    method_name: str          # sdk.compress(), sdk.vote(), etc.
    endpoint: str             # REST path
    http_method: str          # POST or GET
    cost_basis: CostBasis
    cost_per_unit_ai_tokens: float  # ◬ tokens consumed per unit
    description: str
    cube_source: str          # Which cube(s) power this
    is_internal: bool = False  # True for the 3 free internal calls

    def to_dict(self) -> dict:
        return {
            "number": self.number,
            "name": self.name,
            "sdk_method": f"sdk.{self.method_name}()",
            "endpoint": self.endpoint,
            "http_method": self.http_method,
            "cost_basis": self.cost_basis.value,
            "cost_per_unit_ai_tokens": self.cost_per_unit_ai_tokens,
            "description": self.description,
            "cube_source": self.cube_source,
            "is_internal": self.is_internal,
        }


# ═══════════════════════════════════════════════════════════════════
# THE 9 SDK FUNCTIONS (Paid with ◬ tokens)
# ═══════════════════════════════════════════════════════════════════

SDK_FUNCTIONS: list[SDKFunction] = [
    SDKFunction(
        number=1,
        name="Theme Compression",
        method_name="compress",
        endpoint="/api/v1/compress",
        http_method="POST",
        cost_basis=CostBasis.PER_1K_TEXTS,
        cost_per_unit_ai_tokens=5.0,  # 5 ◬ per 1K texts compressed
        description="Any text corpus → 9→6→3 hierarchical themes. The Reader for Humanity.",
        cube_source="C6 AI Pipeline",
    ),
    SDKFunction(
        number=2,
        name="Quadratic Governance Vote",
        method_name="vote",
        endpoint="/api/v1/vote",
        http_method="POST",
        cost_basis=CostBasis.PER_VOTE,
        cost_per_unit_ai_tokens=0.01,  # 0.01 ◬ per vote (cheap — encourage participation)
        description="Token-weighted voting with sqrt(stake) + anti-sybil + 66.6% supermajority.",
        cube_source="C7 Ranking",
    ),
    SDKFunction(
        number=3,
        name="HI Token Conversion",
        method_name="convert",
        endpoint="/api/v1/convert",
        http_method="POST",
        cost_basis=CostBasis.FREE,
        cost_per_unit_ai_tokens=0.0,  # Free — the payment IS the product
        description="$ ÷ 7.25 = 웃 tokens. Payments/donations earn HI tokens at minimum wage.",
        cube_source="C8 Tokens",
    ),
    SDKFunction(
        number=4,
        name="Anomaly Exclusion Pipeline",
        method_name="detect",
        endpoint="/api/v1/detect",
        http_method="GET",
        cost_basis=CostBasis.PER_SCAN,
        cost_per_unit_ai_tokens=1.0,  # 1 ◬ per anomaly scan
        description="Detect coordinated voting patterns → exclude bad actors → re-aggregate clean results.",
        cube_source="C7 Ranking",
    ),
    SDKFunction(
        number=5,
        name="Live Consensus Detection",
        method_name="consensus",
        endpoint="/api/v1/consensus",
        http_method="GET",
        cost_basis=CostBasis.PER_POLL,
        cost_per_unit_ai_tokens=0.5,  # 0.5 ◬ per consensus check
        description="Real-time convergence score + emerging leader + partial scores during live voting.",
        cube_source="C7 Ranking",
    ),
    SDKFunction(
        number=6,
        name="Determinism Proof",
        method_name="verify",
        endpoint="/api/v1/verify",
        http_method="GET",
        cost_basis=CostBasis.FREE,
        cost_per_unit_ai_tokens=0.0,  # Free — trust should never have a price
        description="Re-run aggregation → SHA-256 hash match. Cryptographic proof of identical results.",
        cube_source="C7 Ranking",
    ),
    SDKFunction(
        number=7,
        name="Challenge System",
        method_name="challenge",
        endpoint="/api/v1/challenge",
        http_method="POST",
        cost_basis=CostBasis.PER_SUBMISSION,
        cost_per_unit_ai_tokens=10.0,  # 10 ◬ per code submission (covers test compute)
        description="Unplug a cube → submit replacement code → test → community vote → deploy.",
        cube_source="C10 Simulation",
    ),
    SDKFunction(
        number=8,
        name="Transparent Override",
        method_name="override",
        endpoint="/api/v1/override",
        http_method="POST",
        cost_basis=CostBasis.PER_OVERRIDE,
        cost_per_unit_ai_tokens=2.0,  # 2 ◬ per override (discourage frivolous overrides)
        description="Auditable authority: override rank with mandatory justification + immutable audit trail.",
        cube_source="C7 Ranking",
    ),
    SDKFunction(
        number=9,
        name="Sharded Broadcast",
        method_name="broadcast",
        endpoint="/api/v1/broadcast",
        http_method="POST",
        cost_basis=CostBasis.PER_10K_RECIPIENTS,
        cost_per_unit_ai_tokens=1.0,  # 1 ◬ per 10K recipients
        description="Push results to 1M+ connected clients via 100-shard fan-out.",
        cube_source="C7 Scale Engine",
    ),
]


# ═══════════════════════════════════════════════════════════════════
# THE 3 INTERNAL API CALLS (Free — core platform)
# ═══════════════════════════════════════════════════════════════════

INTERNAL_APIS: list[SDKFunction] = [
    SDKFunction(
        number=10,
        name="Create Session",
        method_name="createSession",
        endpoint="/api/v1/sessions",
        http_method="POST",
        cost_basis=CostBasis.FREE,
        cost_per_unit_ai_tokens=0.0,
        description="Create a polling session. Core platform — attracts users.",
        cube_source="C1 Session",
        is_internal=True,
    ),
    SDKFunction(
        number=11,
        name="Submit Response",
        method_name="submitResponse",
        endpoint="/api/v1/sessions/{id}/responses",
        http_method="POST",
        cost_basis=CostBasis.FREE,
        cost_per_unit_ai_tokens=0.0,
        description="Submit text/voice response to a session. Core platform — user input.",
        cube_source="C2 Text / C3 Voice",
        is_internal=True,
    ),
    SDKFunction(
        number=12,
        name="Export Results",
        method_name="exportCSV",
        endpoint="/api/v1/sessions/{id}/export/csv",
        http_method="GET",
        cost_basis=CostBasis.FREE,
        cost_per_unit_ai_tokens=0.0,
        description="Download 16-column CSV results. Core platform — delivers value.",
        cube_source="C9 Reports",
        is_internal=True,
    ),
]


# ═══════════════════════════════════════════════════════════════════
# REGISTRY
# ═══════════════════════════════════════════════════════════════════

ALL_SDK_FUNCTIONS = SDK_FUNCTIONS + INTERNAL_APIS


def get_sdk_registry() -> dict:
    """Return the complete 9+3 SDK function registry."""
    return {
        "paid_functions": [f.to_dict() for f in SDK_FUNCTIONS],
        "internal_apis": [f.to_dict() for f in INTERNAL_APIS],
        "total_paid": len(SDK_FUNCTIONS),
        "total_internal": len(INTERNAL_APIS),
        "total": len(ALL_SDK_FUNCTIONS),
        "pricing_unit": "◬ (AI tokens)",
        "free_functions": [f.name for f in ALL_SDK_FUNCTIONS if f.cost_per_unit_ai_tokens == 0],
    }


def estimate_session_api_cost(
    response_count: int,
    voter_count: int,
    broadcast_recipients: int = 0,
) -> dict:
    """Estimate total ◬ cost for a complete governance session via SDK."""
    costs = {
        "compress": (response_count / 1000) * 5.0,
        "votes": voter_count * 0.01,
        "anomaly_scan": 1.0,
        "consensus_checks": 5 * 0.5,  # ~5 checks during voting
        "broadcast": (broadcast_recipients / 10000) * 1.0 if broadcast_recipients > 0 else 0,
    }
    total = sum(costs.values())
    return {
        "response_count": response_count,
        "voter_count": voter_count,
        "cost_breakdown_ai_tokens": costs,
        "total_ai_tokens": round(total, 2),
        "free_included": ["create_session", "submit_response", "export_csv", "verify", "convert"],
    }
