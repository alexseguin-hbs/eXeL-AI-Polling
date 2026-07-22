"""Cube 5 (Gateway / Orchestrator) harness (Dev-Sim reference).

Runs the REAL Cube 5 PURE economics offline on deterministic inputs — the MoT
System-of-Innovation chain a poll's cost/profit is built from: SoI Trinity token
calculation → session profit → MoT window resolution → cost control chart → the
project-level SPC series. No DB, no network — the pure math IS the orchestrator's
governance-value surface, so the harness is the deterministic oracle for it
(mirrors harness_cube4).

Run: `cd backend && .venv/bin/python -m app.cubes.cube10_simulation.harness_cube5`
"""

import hashlib
import json

from app.cubes.cube5_gateway.service import (
    calculate_tokens,
    mot_cost_control_chart,
    mot_cost_series,
    resolve_mot_window,
    session_profit,
)

# Deterministic sample: three participants' active durations (seconds) + a poll fee.
_DURATIONS_S = [630.0, 305.0, 1215.0]   # 10.5, ~5.1, 20.25 minutes
_REVENUE_USD = 11.11                    # moderator-paid tier minimum
_COUNTRY, _STATE = "US", None           # $7.25/hr federal default


def run_harness_cube5() -> dict:
    """Run the real Cube 5 pure economics chain on the sample inputs (offline)."""
    # 1. SoI Trinity tokens per participant → totals (real calculate_tokens).
    hearts, humans, unities = 0.0, 0.0, 0.0
    active_min = 0.0
    for secs in _DURATIONS_S:
        h, u, y = calculate_tokens(secs, "response", _COUNTRY, _STATE)
        hearts += h
        humans += u
        unities += y
        active_min += secs / 60.0
    active_min = round(active_min, 4)

    # 2. Operational value = min-wage-equivalent labor value of the active minutes.
    cost_usd = round(active_min * (7.25 / 60.0), 4)

    # 3. Session profit (real session_profit).
    profit = session_profit(_REVENUE_USD, cost_usd)

    # 4. MoT window + cost control chart (quarter default view, real fns).
    window_days = resolve_mot_window("quarter")
    chart = mot_cost_control_chart(_REVENUE_USD, active_min, window_days)

    # 5. Project-level SPC series over a run of poll burn-rates (real mot_cost_series).
    series = mot_cost_series([chart["actual_per_min"], chart["baseline_per_min"], chart["actual_per_min"]],
                             window_days)

    result = {
        "cube": "cube5_gateway",
        "tokens": {"heart": round(hearts, 4), "human": round(humans, 4), "unity": round(unities, 4)},
        "active_min": active_min,
        "cost_usd": cost_usd,
        "profit": profit,
        "mot_window_days": window_days,
        "chart": chart,
        "series": series,
    }
    # Determinism signature over the stable economic output (deterministic oracle).
    sig_payload = json.dumps(
        {k: result[k] for k in ("tokens", "active_min", "cost_usd", "profit", "chart")},
        sort_keys=True,
    )
    result["determinism_signature"] = hashlib.sha256(sig_payload.encode()).hexdigest()
    result["metrics"] = {"wall_time_ms": 0.0, "function_calls": 5, "db_execute_calls": 0}
    return result


def render(r: dict) -> str:
    out = ["═" * 72, "  CUBE 5 GATEWAY HARNESS — MoT economics chain · offline", "═" * 72]
    t = r["tokens"]
    out.append(f"  tokens:      ♡ {t['heart']}  웃 {t['human']}  ◬ {t['unity']}")
    out.append(f"  active_min:  {r['active_min']}")
    out.append(f"  cost_usd:    {r['cost_usd']}")
    p = r["profit"]
    out.append(f"  profit:      revenue {p['revenue_usd']}  cost {p['cost_usd']}  "
               f"profit {p['profit_usd']}  margin {p['margin_pct']}%")
    c = r["chart"]
    out.append(f"  MoT chart:   window {c['window_days']}d  baseline/min {c['baseline_per_min']}  "
               f"actual/min {c['actual_per_min']}  variance {c['variance_pct']}%")
    s = r["series"]
    out.append(f"  MoT series:  n={s['n']}  centerline {s['centerline']}  "
               f"UCL {s['upper_control_limit']}  ooc {s['out_of_control_count']}")
    out.append("─" * 72)
    out.append(f"  Determinism signature: {r['determinism_signature']}")
    out.append("═" * 72)
    return "\n".join(out)


if __name__ == "__main__":
    print(render(run_harness_cube5()))
