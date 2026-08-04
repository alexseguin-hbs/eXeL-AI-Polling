"""Cube 10 — Challenge Loop: the Semi/Automated unplug-replug engine (CRS-26 → CRS-31).

Ties the three real pieces into ONE loop so a Development Lead can prove an optimized cube
truly wins (an 8×8×8 replacing a 10×10×10):

    baseline (LIVE cube, via its stand-alone harness = the sandbox oracle)
      ↕
    candidate (the Lead's submitted metrics + determinism signature)
      → evaluate_challenge  = compare_metrics (tests ≥100% · duration ≤120% · no SSSES regression)
                              AND determinism-equivalence (signatures match ⇒ SAME functionality)
      → decide_swap         = the 3 autonomy tiers:
            manual     → overall_passed AND a human approves
            semi       → overall_passed AND a human selects it among machine-proposed variants
            automated  → overall_passed AND a quadratic supermajority approves — with
                         output-equivalence a PERMANENT guardrail (never an autonomous swap
                         that changes behavior), and human override always available (CRS-30.03).

Reuses `compare_metrics` + `tally_votes` (already real) + `harness_cube1.simulate_cube1`.
Pure + deterministic (the async parts only run the offline harness); no arbitrary code
execution — a candidate is a submitted metrics+signature payload (its sandbox run happens via
`run_sandbox_tests` or on the Lead's side). Cube 1 is the reference cube.
"""
from __future__ import annotations

from app.cubes.cube10_simulation.service import compare_metrics, tally_votes

CHALLENGE_TIERS = {"manual", "semi", "automated"}
_PILLARS = ("security", "stability", "scalability", "efficiency", "succinctness")


# ── Baseline (LIVE cube) via its stand-alone harness = the sandbox oracle ─────────────────────
async def _run_harness(cube_id: int) -> dict:
    """Run a cube's stand-alone harness with its default inputs (the sandbox oracle).

    Cubes 1, 2, 6, 7 have runnable harnesses (all real cube functions, offline,
    deterministic, each emitting a `determinism_signature`). Others pending.
    """
    if cube_id == 1:
        from app.cubes.cube10_simulation.harness_cube1 import simulate_cube1

        return await simulate_cube1()
    if cube_id == 2:
        from app.cubes.cube10_simulation.harness_cube2 import _SAMPLES, run_harness_cube2

        return await run_harness_cube2(_SAMPLES)
    if cube_id == 3:
        from app.cubes.cube10_simulation.harness_cube3 import run_harness_cube3

        return await run_harness_cube3()
    if cube_id == 4:
        from app.cubes.cube10_simulation.harness_cube4 import run_harness_cube4

        return run_harness_cube4()
    if cube_id == 5:
        from app.cubes.cube10_simulation.harness_cube5 import run_harness_cube5

        return run_harness_cube5()
    if cube_id == 6:
        from app.cubes.cube10_simulation.harness_cube6 import run_harness_cube6

        return await run_harness_cube6()
    if cube_id == 7:
        from app.cubes.cube10_simulation.harness_cube7 import run_harness_cube7

        return run_harness_cube7()
    if cube_id == 8:
        from app.cubes.cube10_simulation.harness_cube8 import run_harness_cube8

        return run_harness_cube8()
    if cube_id == 9:
        from app.cubes.cube10_simulation.harness_cube9 import run_harness_cube9

        return run_harness_cube9()
    raise NotImplementedError(
        f"No stand-alone harness for cube {cube_id} yet — Cubes 1, 2, 3, 4, 5, 6, 7, 8, 9 are runnable."
    )


# Cubes with a registered, runnable stand-alone harness (single source of truth).
# Cube 10 is the harness HOST (it runs these), not a harness target — so the ring stops at 9.
HARNESS_CUBES: frozenset[int] = frozenset({1, 2, 3, 4, 5, 6, 7, 8, 9})


def _harness_to_metrics(result: dict, cube_id: int, role: str) -> dict:
    """Adapt a harness result into the metrics shape compare_metrics + evaluate_challenge use."""
    m = result.get("metrics", {})
    return {
        "cube_id": cube_id,
        "role": role,
        "signature": result.get("determinism_signature", ""),
        "duration_ms": float(m.get("wall_time_ms", 0.0)),
        "function_calls": int(m.get("function_calls", 0)),
        "db_reads": int(m.get("db_execute_calls", 0)),
    }


async def run_cube_baseline(cube_id: int = 1) -> dict:
    """Produce the LIVE cube's baseline (metrics + determinism signature) via its harness."""
    return _harness_to_metrics(await _run_harness(cube_id), cube_id, "baseline")


def normalize_candidate(submitted: dict, cube_id: int = 1) -> dict:
    """WireGuard-whitelist a Dev Lead's submitted candidate metrics (never trust raw input)."""
    s = submitted if isinstance(submitted, dict) else {}

    def _num(v, d=0.0):
        try:
            return float(v)
        except (TypeError, ValueError):
            return d

    ssses_raw = s.get("ssses") if isinstance(s.get("ssses"), dict) else {}
    ssses = {p: int(_num(ssses_raw.get(p, 0))) for p in _PILLARS} if ssses_raw else {}
    return {
        "cube_id": cube_id,
        "role": "candidate",
        "signature": str(s.get("signature", "")),
        "duration_ms": _num(s.get("duration_ms", 0.0)),
        "tests_total": int(_num(s.get("tests_total", 0))),
        "tests_passed": int(_num(s.get("tests_passed", 0))),
        **({"ssses": ssses} if ssses else {}),
    }


# ── Evaluate: compare_metrics + the determinism-equivalence guardrail ─────────────────────────
def evaluate_challenge(baseline: dict, candidate: dict) -> dict:
    """Verdict: does the candidate win WITHOUT changing behavior?

    equivalent      — candidate's determinism signature == baseline's (SAME functionality).
    compare_passed  — compare_metrics: tests ≥100% · duration ≤120% · no SSSES pillar regression.
    faster          — candidate wall-time strictly below baseline.
    overall_passed  — compare_passed AND equivalent (a faster-but-different cube never passes).
    """
    cmp = compare_metrics(baseline, candidate)
    base_sig = baseline.get("signature") or ""
    equivalent = bool(base_sig) and candidate.get("signature", "") == base_sig
    faster = candidate.get("duration_ms", float("inf")) < baseline.get("duration_ms", 0.0)
    return {
        "equivalent": equivalent,
        "compare_passed": cmp["overall_passed"],
        "faster": faster,
        "overall_passed": bool(cmp["overall_passed"] and equivalent),
        "compare": cmp,
    }


# ── Optimization → physical-cube shrink (the parity+efficiency proof) ──────────────────────────
# Operator's north star: when a candidate BEATS the LIVE cube by ≥11.1% (same-or-better
# output, less work), the candidate cube renders that much SMALLER than Live — an 8×8×8
# that replaces 10×10×10: same result, less compute. The shrink is EARNED, never toggled,
# and only when the verdict holds (parity first, then efficiency).
#
# WHY 11.1 AND NOT 10 (r54, operator directive). 11.1% is 1/9 — one ninth of a nine-cube
# layer. A replacement that gives back a whole cube's worth of capacity across the layer is
# the SMALLEST gain that can actually buy an adjacent cube; below one ninth the grid does
# not change shape and the win, while real, is structurally inert. The threshold is the
# point at which innovation starts compounding sideways instead of merely accumulating.
# Published as 11.1%, so the bar IS 0.111 — not 1/9 = 0.11111…, which would reject a
# candidate that exactly met the number we published. Nobody loses on a rounding artefact
# in their own favour; if we print 11.1, then 11.1 wins.
WIN_THRESHOLD = 0.111         # ≥11.1% improvement = a "win" (one ninth, at published precision)
MIN_CUBE_SCALE = 0.5          # never shrink below half (stays legible next to Live)


def compute_optimization(baseline: dict, candidate: dict, *, passed: bool) -> dict:
    """Efficiency delta of candidate vs LIVE (basis = duration_ms — work per run) →
    optimization_pct, win (≥10% AND the verdict passed), and cube_scale (candidate size
    relative to Live). A candidate only shrinks the cube when it PASSES (parity) AND is
    faster (efficiency); otherwise scale stays 1.0 (same size = no proven gain).

    Pure + deterministic: same metrics in → same numbers out.
    """
    b = float(baseline.get("duration_ms", 0.0) or 0.0)
    c = float(candidate.get("duration_ms", 0.0) or 0.0)
    improvement = (b - c) / b if b > 0 else 0.0            # >0 = candidate did less work
    pct = round(improvement * 100.0, 1)
    win = bool(passed and improvement >= WIN_THRESHOLD)
    # Shrink the candidate cube proportional to the proven efficiency gain; only when the
    # verdict passed (parity) AND there is a real gain. Clamp so it never collapses.
    if passed and improvement > 0:
        scale = max(MIN_CUBE_SCALE, min(1.0, 1.0 - improvement))
    else:
        scale = 1.0
    return {
        "optimization_pct": pct,
        "win": win,
        "cube_scale": round(scale, 3),
        "live_scale": 1.0,
        "basis": "duration_ms",
        "threshold_pct": round(WIN_THRESHOLD * 100.0, 1),
    }


# ── Decide: the 3 autonomy tiers (manual → semi → automated) ──────────────────────────────────
def decide_swap(
    verdict: dict,
    *,
    tier: str,
    human_approved: bool = False,
    human_selected: bool = False,
    votes: list[dict] | None = None,
    total_holders: int = 0,
) -> dict:
    """Unplug-old / replug-new decision, gated by the requested autonomy tier.

    Returns {tier, decision: swap|hold|reject, reason, verdict, tally}. A failed verdict is
    always rejected — regardless of tier, human, or votes. Output-equivalence is a permanent
    guardrail on the automated tier; human override is always available (CRS-30.03).
    """
    if tier not in CHALLENGE_TIERS:
        raise ValueError(f"tier must be one of {sorted(CHALLENGE_TIERS)}, got {tier!r}")

    if not verdict.get("overall_passed"):
        return {
            "tier": tier, "decision": "reject", "tally": None, "verdict": verdict,
            "reason": "verdict failed — metrics regressed or output not equivalent",
        }

    if tier == "manual":
        swap = bool(human_approved)
        return {
            "tier": tier, "decision": "swap" if swap else "hold", "tally": None, "verdict": verdict,
            "reason": "human approved the swap" if swap else "awaiting human approval",
        }

    if tier == "semi":
        swap = bool(human_selected)
        return {
            "tier": tier, "decision": "swap" if swap else "hold", "tally": None, "verdict": verdict,
            "reason": "human selected this variant" if swap else "awaiting human selection",
        }

    # automated — supermajority consensus, with equivalence as a permanent guardrail
    tally = tally_votes(votes or [], total_holders)
    if not verdict.get("equivalent"):
        return {
            "tier": tier, "decision": "reject", "tally": tally, "verdict": verdict,
            "reason": "autonomous swap blocked — candidate is not output-equivalent (guardrail)",
        }
    approved = tally["result"] == "approved"
    return {
        "tier": tier, "decision": "swap" if approved else "hold", "tally": tally, "verdict": verdict,
        "reason": f"consensus {tally['result']} ({tally['approval_percent']}% ≥ {tally['threshold_percent']}%)"
        if approved else f"consensus not reached ({tally['result']})",
    }


async def run_challenge(
    cube_id: int,
    submitted_candidate: dict,
    *,
    tier: str = "manual",
    human_approved: bool = False,
    human_selected: bool = False,
    votes: list[dict] | None = None,
    total_holders: int = 0,
    crs_state: str | None = None,
    baseline: dict | None = None,
) -> dict:
    """End-to-end: baseline (harness) → normalize candidate → evaluate → 3-tier swap decision.

    Foundation-of-Truth gate (R5): if `crs_state` is provided, simulation is BLOCKED
    unless the governing CRS has reached Simulation-Ready ("simulation only after
    Cube 2 completion"). Omitting it keeps the pre-CRS-lifecycle behavior (no gate).

    SSSES Efficiency: a caller that already ran the baseline (e.g. /sim/.../submit)
    may pass it in to avoid a redundant harness execution; omitted → run it here.
    """
    if crs_state is not None:
        from app.core.crs_lifecycle import assert_simulation_allowed

        assert_simulation_allowed(crs_state)  # raises CRSLifecycleError if not ready
    if baseline is None:
        baseline = await run_cube_baseline(cube_id)
    candidate = normalize_candidate(submitted_candidate, cube_id)
    verdict = evaluate_challenge(baseline, candidate)
    decision = decide_swap(
        verdict, tier=tier, human_approved=human_approved,
        human_selected=human_selected, votes=votes, total_holders=total_holders,
    )
    return {"baseline": baseline, "candidate": candidate, "verdict": verdict, "decision": decision}
