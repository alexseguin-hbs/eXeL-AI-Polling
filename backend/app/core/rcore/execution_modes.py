"""Shared R-CORE execution-mode dispatch (the "A3" gate, generalized).

The SAME operation runs in every mode — only the APPROVER / automation changes,
never the underlying logic (mirrors challenge_loop.decide_swap tiers). This is the
build-once source consumed by cubes 4/5/6/7/8; each cube passes a result dict
carrying `confidence` (0-1) and `risk` (0-1) plus the human-approval flags.

Automated acceptance guardrails (Thor): never auto-accept a high-risk / low-
confidence result — automated accepts ONLY inside the guardrail, else HOLDS.
`live` always requires human authority (a permanent gate). Pure + deterministic.
"""

from __future__ import annotations

# The 7 execution modes (memo). Manual→Semi→Automated ladder + replay/sandbox/live.
EXECUTION_MODES: tuple[str, ...] = (
    "manual", "assisted", "semi_automated", "automated", "replay", "sandbox", "live",
)

# Default automated-acceptance guardrails (Thor). Overridable per call.
DEFAULT_MAX_RISK = 0.30
DEFAULT_MIN_CONFIDENCE = 0.70


def dispatch_execution_mode(
    result: dict,
    *,
    mode: str,
    human_approved: bool = False,
    human_selected: bool = False,
    replay_match: bool | None = None,
    max_risk: float = DEFAULT_MAX_RISK,
    min_confidence: float = DEFAULT_MIN_CONFIDENCE,
) -> dict:
    """Route a result through an execution mode → {mode, status, reason}.

    manual/assisted → human must approve. semi_automated → human selects among variants.
    automated → auto-accepted ONLY if risk ≤ max_risk and confidence ≥ min_confidence
    (else held — a guardrail, never blind). replay → reproducibility check (replay_match).
    sandbox → isolated, never promoted to live. live → production apply, requires
    human_approved (Human Authority is a permanent gate). Pure + deterministic.
    """
    if mode not in EXECUTION_MODES:
        raise ValueError(f"mode must be one of {list(EXECUTION_MODES)}, got {mode!r}")

    conf = float(result.get("confidence", 0.0) or 0.0)
    risk = float(result.get("risk", 1.0) or 0.0)

    if mode == "sandbox":
        return {"mode": mode, "status": "sandboxed",
                "reason": "isolated run — not applied to live"}
    if mode == "replay":
        status = "verified" if replay_match else ("mismatch" if replay_match is False else "pending")
        return {"mode": mode, "status": status,
                "reason": "replay reproducibility check"}
    if mode in ("manual", "assisted"):
        return {"mode": mode, "status": "accepted" if human_approved else "pending",
                "reason": "human approved" if human_approved else "awaiting human review"}
    if mode == "semi_automated":
        return {"mode": mode, "status": "accepted" if human_selected else "pending",
                "reason": "human selected" if human_selected else "awaiting human selection"}
    if mode == "automated":
        ok = risk <= max_risk and conf >= min_confidence
        return {"mode": mode, "status": "accepted" if ok else "held",
                "reason": (f"auto-accepted (risk {risk} ≤ {max_risk}, "
                           f"confidence {conf} ≥ {min_confidence})") if ok else
                          "held — risk/confidence outside the automated guardrail"}
    # live
    return {"mode": mode, "status": "accepted" if human_approved else "pending",
            "reason": "human authority approved for production" if human_approved
                      else "awaiting human authority (permanent gate)"}
