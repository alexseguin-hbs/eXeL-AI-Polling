"""Cube 4 (Response Collector → Analytical Intelligence) harness (Dev-Sim reference).

Runs the REAL Cube 4 analytical synthesis (`synthesize_analysis`) on deterministic
sample descriptive-analytics inputs, OFFLINE — producing the R-CORE analytical-result
object + a determinism signature. The live `analyze_session` orchestrator gathers its
inputs from the Cube 9/6/7 engines (needs a DB); the harness feeds fixed inputs so the
synthesis is exercised deterministically without a database (mirrors harness_cube2/3).

Run: `cd backend && .venv/bin/python -m app.cubes.cube10_simulation.harness_cube4`
"""

import hashlib
import json

from app.cubes.cube4_collector.analysis import synthesize_analysis

# Deterministic descriptive-analytics inputs (as if Cube 9/6/7 produced them).
_ANALYTICS = {"total_responses": 220, "unique_participants": 140,
              "summary_coverage": 88, "top_theme": "mobile"}
_EMERGING = {"convergence_score": 0.72, "emerging_leader": "mobile"}
_CQS = [{"composite_cqs": 0.81}, {"composite_cqs": 0.77}, {"composite_cqs": 0.69}]
_COMPRESSION = {"overall_ratio": "73:1"}
_TRENDS = {"falling": ["branding"], "forecast": {"predicted_top_3": ["mobile", "api", "analytics"]}}


def run_harness_cube4() -> dict:
    """Run the real Cube 4 analytical synthesis on the sample inputs (offline)."""
    result = synthesize_analysis(
        analytics=_ANALYTICS, emerging=_EMERGING, cqs=_CQS,
        compression=_COMPRESSION, trends=_TRENDS, source_crs="CRS-09",
    )
    # Determinism signature over the stable analytical output (deterministic oracle).
    sig_payload = json.dumps(
        {k: result[k] for k in ("confidence", "evidence_quality", "risk",
                                 "recommended_actions", "alternative_scenarios")},
        sort_keys=True,
    )
    result["determinism_signature"] = hashlib.sha256(sig_payload.encode()).hexdigest()
    result["metrics"] = {"wall_time_ms": 0.0, "function_calls": 1, "db_execute_calls": 0}
    return result


def render(r: dict) -> str:
    out = ["═" * 72, "  CUBE 4 ANALYSIS HARNESS — R-CORE analytical result · offline", "═" * 72]
    out.append(f"  confidence:       {r['confidence']}")
    out.append(f"  evidence_quality: {r['evidence_quality']}")
    out.append(f"  risk:             {r['risk']}")
    out.append(f"  human_authority:  {r['human_authority_status']}")
    out.append("  recommended_actions:")
    for a in r["recommended_actions"]:
        out.append(f"    · {a}")
    out.append(f"  scenarios: {r['alternative_scenarios']}")
    out.append("─" * 72)
    out.append(f"  Determinism signature: {r['determinism_signature']}")
    out.append("═" * 72)
    return "\n".join(out)


if __name__ == "__main__":
    print(render(run_harness_cube4()))
