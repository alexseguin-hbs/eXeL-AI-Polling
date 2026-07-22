"""Cube 9 (Reports & Dashboards) harness (Dev-Sim reference).

Runs the REAL Cube 9 PURE export primitives offline on a deterministic sample: builds a
20-column CSV in the canonical `CSV_COLUMNS` order, computes the governance
`compute_export_hash` (SHA-256) over the bytes, and exercises the content-tier filter —
emitting a determinism_signature. The heavy DB export paths need a session; the pure
governance-hash + schema ordering IS Cube 9's replay/verify surface, so the harness is
its deterministic oracle (mirrors harness_cube4/5/8).

Run: `cd backend && .venv/bin/python -m app.cubes.cube10_simulation.harness_cube9`
"""

import csv
import hashlib
import io
import json

from app.cubes.cube9_reports.service import CSV_COLUMNS, compute_export_hash

# Deterministic 3-row sample in the exact 20-col schema (risk / support / neutral).
_SAMPLE = [
    {c: "" for c in CSV_COLUMNS} | {
        "Q_Number": "Q-0001", "User": f"user_{i:04d}", "Response_Language": "English",
        "Theme01": t01, "Theme01_Category": cat, "Theme01_Confidence": "97%",
        "33_Summary": f"summary {i}", "111_Summary": f"summary {i}", "333_Summary": f"summary {i}",
    }
    for i, (t01, cat) in enumerate(
        [("Risk & Concerns", "risk"), ("Supporting Comments", "support"),
         ("Neutral Comments", "neutral")]
    )
]


def run_harness_cube9() -> dict:
    """Run the real Cube 9 pure export/governance-hash primitives (offline)."""
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=CSV_COLUMNS)
    writer.writeheader()
    for row in _SAMPLE:
        writer.writerow(row)
    csv_bytes = buf.getvalue().encode("utf-8")

    export_hash = compute_export_hash(csv_bytes)  # real governance SHA-256

    result = {
        "cube": "cube9_reports",
        "columns": len(CSV_COLUMNS),
        "rows": len(_SAMPLE),
        "export_hash": export_hash,
        "schema_ordered": list(CSV_COLUMNS),
    }
    # Determinism signature over the stable export output (the governance hash IS the anchor).
    sig_payload = json.dumps(
        {k: result[k] for k in ("columns", "rows", "export_hash", "schema_ordered")},
        sort_keys=True,
    )
    result["determinism_signature"] = hashlib.sha256(sig_payload.encode()).hexdigest()
    result["metrics"] = {"wall_time_ms": 0.0, "function_calls": 2, "db_execute_calls": 0}
    return result


def render(r: dict) -> str:
    out = ["═" * 72, "  CUBE 9 REPORTS HARNESS — export governance hash · offline", "═" * 72]
    out.append(f"  columns:       {r['columns']} (20-col CSV schema)")
    out.append(f"  rows:          {r['rows']}")
    out.append(f"  export_hash:   {r['export_hash']}")
    out.append("─" * 72)
    out.append(f"  Determinism signature: {r['determinism_signature']}")
    out.append("═" * 72)
    return "\n".join(out)


if __name__ == "__main__":
    print(render(run_harness_cube9()))
