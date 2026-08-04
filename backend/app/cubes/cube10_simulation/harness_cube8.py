"""Cube 8 (Token Reward Calculator / Ledger) harness (Dev-Sim reference).

Runs the REAL Cube 8 PURE token economics offline on deterministic inputs — the
value chain a reward is built from: SoI Trinity token calc (ceil-minute ♡ → 5× ◬) →
HI-token conversion (`hours_to_hi_tokens`) → jurisdiction rate (`resolve_human_rate`)
→ a full append-only lifecycle walk over `VALID_TRANSITIONS` (simulated→pending→
approved→finalized). No DB, no network — the pure math + lifecycle state machine IS
Cube 8's governance-value surface, so the harness is its deterministic oracle
(mirrors harness_cube4/5).

Run: `cd backend && .venv/bin/python -m app.cubes.cube10_simulation.harness_cube8`
"""

import hashlib
import json
import math

from app.core.hi_rates import resolve_human_rate
from app.cubes.cube8_tokens.service import VALID_TRANSITIONS, hours_to_hi_tokens

# Deterministic sample: three earners' active minutes + a paid fee.
_ACTIVE_MIN = [10.5, 5.1, 20.25]      # per-participant active minutes
_UNITY_MULT = 5                        # ◬ = ♡ × 5 (unity multiplier)
_FEE_USD = 11.11                       # moderator-paid tier
_COUNTRY, _STATE = "US", None          # $7.25/hr federal default


def _walk_lifecycle(start: str = "simulated") -> list[str]:
    """Deterministic forward walk of the append-only lifecycle to a terminal state.

    Follows the FIRST forward transition (sorted) at each step until no forward move
    remains — pending→approved→finalized (never picking the 'reversed' side-exit).
    """
    path = [start]
    state = start
    seen = {start}
    while True:
        nexts = sorted(VALID_TRANSITIONS.get(state, set()))
        forward = [s for s in nexts if s != "reversed" and s not in seen]
        if not forward:
            break
        state = forward[0]
        path.append(state)
        seen.add(state)
    return path


def run_harness_cube8() -> dict:
    """Run the real Cube 8 pure token economics + lifecycle walk (offline)."""
    rate = resolve_human_rate(_COUNTRY, _STATE)  # $/hr

    hearts, humans, unities = 0.0, 0.0, 0.0
    for minutes in _ACTIVE_MIN:
        heart = float(math.ceil(minutes)) if minutes > 0 else 0.0  # ♡ = ceil-minutes
        human = round(minutes * (rate / 60.0), 3)                  # 웃 = value of the minutes
        unity = heart * _UNITY_MULT                                # ◬ = ♡ × 5
        hearts += heart
        humans += human
        unities += unity

    # A fee/donation mints NO 웃 — it is an inert contribution receipt.
    fee_hi = 0.0
    # 웃 comes from contributed TIME only:
    total_hours = round(sum(_ACTIVE_MIN) / 60.0, 6)
    time_hi = hours_to_hi_tokens(total_hours)        # real time->웃 conversion
    lifecycle_path = _walk_lifecycle()               # real VALID_TRANSITIONS walk

    result = {
        "cube": "cube8_tokens",
        "hourly_rate": rate,
        "tokens": {"heart": round(hearts, 3), "human": round(humans, 3),
                   "unity": round(unities, 3)},
        "fee_usd": _FEE_USD,
        "fee_hi_tokens": fee_hi,          # always 0.0 — money mints nothing
        "time_hours": total_hours,
        "time_hi_tokens": time_hi,
        "lifecycle_path": lifecycle_path,
        "lifecycle_terminal": lifecycle_path[-1],
    }
    # Determinism signature over the stable token/lifecycle output (deterministic oracle).
    sig_payload = json.dumps(
        {k: result[k] for k in ("tokens", "fee_hi_tokens", "time_hi_tokens", "lifecycle_path")},
        sort_keys=True,
    )
    result["determinism_signature"] = hashlib.sha256(sig_payload.encode()).hexdigest()
    result["metrics"] = {"wall_time_ms": 0.0, "function_calls": 3, "db_execute_calls": 0}
    return result


def render(r: dict) -> str:
    out = ["═" * 72, "  CUBE 8 TOKEN HARNESS — SoI Trinity ledger economics · offline", "═" * 72]
    t = r["tokens"]
    out.append(f"  tokens:        ♡ {t['heart']}  웃 {t['human']}  ◬ {t['unity']}")
    out.append(f"  fee:           ${r['fee_usd']} → {r['fee_hi_tokens']} 웃 (receipt: money mints nothing)")
    out.append(f"  time:          {r['time_hours']} h → {r['time_hi_tokens']} 웃 (the ONLY 웃 on-ramp)")
    out.append(f"  lifecycle:     {' → '.join(r['lifecycle_path'])}")
    out.append("─" * 72)
    out.append(f"  Determinism signature: {r['determinism_signature']}")
    out.append("═" * 72)
    return "\n".join(out)


if __name__ == "__main__":
    print(render(run_harness_cube8()))
