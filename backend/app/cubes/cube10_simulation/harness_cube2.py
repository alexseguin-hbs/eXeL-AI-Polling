"""Cube 2 (Text Submission) stand-alone harness (Dev-Sim reference).

Runs the REAL Cube 2 submission functions on sample texts — validate (34-lang) →
PII detect (regex path) → PII scrub → profanity check → SHA-256 response hash —
deterministically and OFFLINE (no live DB; profanity uses an empty-filter stub).
Captures inputs → outputs → determinism signature so a Dev Lead can play-test
Cube 2 and challenge a candidate against LIVE CUBE metrics (mirrors harness_cube1
/ harness_cube6). No network, no external model required (NER falls back to regex).

Run: `cd backend && .venv/bin/python -m app.cubes.cube10_simulation.harness_cube2`
"""

import asyncio
import csv
import hashlib
import json
import os
import time

from app.core.crypto_utils import compute_response_hash
from app.core.exceptions import ResponseValidationError
from app.core.submission_validators import validate_text_input
from app.cubes.cube2_text.service import detect_pii, detect_profanity, scrub_pii

_MAX_LENGTH = 3333

# The 5,000-row simulation dataset (repo root). `Detailed_Results` = the raw
# response text Cube 2 ingests; `Response_Language` its language.
# __file__ = <repo>/backend/app/cubes/cube10_simulation/harness_cube2.py → 5 up = <repo>
_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
_DATASET_CSV = os.path.join(
    _REPO_ROOT, "Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv",
)

# Sample submissions — one carries PII (email + phone) to exercise scrubbing.
_SAMPLES: list[str] = [
    "The mobile experience is frustrating and drag-drop barely works. Reach me at jane.doe@example.com or 555-123-4567 to follow up.",
    "I really appreciate the AI clustering — it surfaces the top misconceptions in seconds and saves hours of manual reading.",
    "Reporting is basic; I cannot easily create a one-page PDF summary to send to clients, and mobile ranking is clunky.",
    "The anonymity controls and the System of Innovation framing make participation feel valuable rather than just another survey.",
]


class _NoFilterDB:
    """Async DB stub returning zero profanity filters — keeps the harness offline."""

    class _Result:
        def scalars(self):
            return self

        def all(self):
            return []

    async def execute(self, *_a, **_k):
        return self._Result()


async def _ner_disabled() -> object:
    """Force detect_pii onto its regex path (its try/except catches this)."""
    raise RuntimeError("offline harness: NER disabled — using regex PII path")


async def run_harness_cube2(texts: list[str], max_length: int = _MAX_LENGTH, use_ner: bool = False) -> dict:
    """Run the real Cube 2 submission pipeline (pure/offline steps) on `texts`.

    use_ner=False (default) forces the regex PII path so the harness stays fast,
    offline and deterministic (the transformer NER model load is skipped).
    """
    import app.cubes.cube2_text.service as svc
    _orig_ner = svc._get_ner_pipeline
    if not use_ner:
        svc._get_ner_pipeline = _ner_disabled  # type: ignore[assignment]
    db = _NoFilterDB()
    rows: list[dict] = []
    try:
        for i, raw in enumerate(texts):
            validated = validate_text_input(raw, max_length)          # CRS-07 validation
            detections = await detect_pii(validated)                  # CRS-08.02 PII detect (regex path)
            clean = scrub_pii(validated, detections)                  # CRS-08.02 PII scrub
            profanity = await detect_profanity(db, clean, "en")       # CRS-07.01 profanity (offline)
            response_hash = compute_response_hash(clean)              # CRS-08.01 SHA-256
            rows.append({
                "index": i,
                "raw_chars": len(raw),
                "pii_detected": len(detections),
                "pii_scrubbed": clean != validated,
                "profanity_detected": len(profanity),
                "clean_text": clean,
                "response_hash": response_hash,
            })
    finally:
        svc._get_ner_pipeline = _orig_ner  # restore original NER loader

    signature = hashlib.sha256(
        json.dumps([(r["index"], r["response_hash"]) for r in rows], sort_keys=True).encode()
    ).hexdigest()
    return {
        "cube": "cube2_text",
        "total": len(rows),
        "pii_responses": sum(1 for r in rows if r["pii_detected"]),
        "rows": rows,
        "determinism_signature": signature,
    }


def _load_dataset_texts(limit: int = 0) -> list[str]:
    """Load the `Detailed_Results` column from the 5,000-row dataset (bounded by `limit`)."""
    texts: list[str] = []
    with open(_DATASET_CSV, encoding="utf-8-sig") as f:
        for i, row in enumerate(csv.DictReader(f)):
            if limit and i >= limit:
                break
            t = (row.get("Detailed_Results") or "").strip()
            if t:
                texts.append(t)
    return texts


async def run_harness_cube2_dataset(limit: int = 0, use_ner: bool = False) -> dict:
    """R1: run the REAL Cube 2 pipeline over the 5,000-row MOCK dataset, streaming.

    Feeds each `Detailed_Results` response through validate → PII detect (regex) →
    scrub → profanity → SHA-256 hash, aggregating metrics WITHOUT holding every row
    in memory (Cube-10 architectural rule: no disk-heavy intermediates). Emits a
    determinism signature + a metrics baseline the Dev-Sim + challenge loop consume.
    Offline + deterministic (regex PII path); no billed API needed to prove plumbing.
    """
    import app.cubes.cube2_text.service as svc
    _orig_ner = svc._get_ner_pipeline
    if not use_ner:
        svc._get_ner_pipeline = _ner_disabled  # type: ignore[assignment]
    db = _NoFilterDB()

    total = pii_responses = profanity_responses = scrubbed = rejected = 0
    total_chars = 0
    unique_hashes: set[str] = set()
    hasher = hashlib.sha256()  # rolling signature — bounded memory at any N
    sample: list[dict] = []
    t0 = time.perf_counter()
    try:
        for i, raw in enumerate(_load_dataset_texts(limit)):
            try:
                validated = validate_text_input(raw, _MAX_LENGTH)
            except ResponseValidationError:
                # Cube 2 rejects over-length / invalid submissions (422) — a real
                # pipeline outcome; tally it and fold the rejection into the signature.
                rejected += 1
                hasher.update(f"{i}:REJECTED".encode())
                continue
            detections = await detect_pii(validated)
            clean = scrub_pii(validated, detections)
            profanity = await detect_profanity(db, clean, "en")
            response_hash = compute_response_hash(clean)

            total += 1
            total_chars += len(raw)
            if detections:
                pii_responses += 1
            if clean != validated:
                scrubbed += 1
            if profanity:
                profanity_responses += 1
            unique_hashes.add(response_hash)
            hasher.update(f"{i}:{response_hash}".encode())
            if i < 5:  # keep a small visible sample, not all 5,000 rows
                sample.append({"index": i, "raw_chars": len(raw),
                               "pii_detected": len(detections), "hash": response_hash[:12]})
    finally:
        svc._get_ner_pipeline = _orig_ner
    wall_ms = round((time.perf_counter() - t0) * 1000.0, 2)

    return {
        "cube": "cube2_text",
        "dataset": os.path.basename(_DATASET_CSV),
        "total": total,
        "rejected": rejected,
        "pii_responses": pii_responses,
        "scrubbed": scrubbed,
        "profanity_responses": profanity_responses,
        "unique_hashes": len(unique_hashes),
        "avg_chars": round(total_chars / total, 1) if total else 0.0,
        "sample": sample,
        "metrics": {"wall_time_ms": wall_ms, "function_calls": total * 5, "db_execute_calls": total},
        "determinism_signature": hasher.hexdigest(),
    }


def render_dataset(r: dict) -> str:
    out = ["═" * 72, f"  CUBE 2 · 5000-MOCK DATASET SIM — {r['total']} responses · offline", "═" * 72]
    out.append(f"  dataset:            {r['dataset']}")
    out.append(f"  accepted:           {r['total']}   rejected (422): {r['rejected']}")
    out.append(f"  PII detected:       {r['pii_responses']}  (scrubbed: {r['scrubbed']})")
    out.append(f"  profanity flagged:  {r['profanity_responses']}")
    out.append(f"  unique hashes:      {r['unique_hashes']} / {r['total']}")
    out.append(f"  avg chars/response: {r['avg_chars']}")
    out.append(f"  wall time:          {r['metrics']['wall_time_ms']} ms")
    out.append("─" * 72)
    out.append(f"  Determinism signature: {r['determinism_signature']}")
    out.append("═" * 72)
    return "\n".join(out)


def render(result: dict) -> str:
    out = ["═" * 72, f"  CUBE 2 SUBMISSION HARNESS — {result['total']} texts · offline", "═" * 72]
    for r in result["rows"]:
        out.append(
            f"  #{r['index']}  chars={r['raw_chars']:>4}  PII={r['pii_detected']} "
            f"scrubbed={'Y' if r['pii_scrubbed'] else 'N'}  prof={r['profanity_detected']}  hash={r['response_hash'][:12]}…"
        )
        out.append(f"       → {r['clean_text'][:88]}")
    out.append("─" * 72)
    out.append(f"  PII-carrying responses scrubbed: {result['pii_responses']}/{result['total']}")
    out.append(f"  Determinism signature: {result['determinism_signature']}")
    out.append("═" * 72)
    return "\n".join(out)


async def _main() -> None:
    # Sample run (exercises PII scrubbing on a crafted email+phone).
    print(render(await run_harness_cube2(_SAMPLES)))
    # 5,000-row MOCK dataset run (the operator's "test Cube 2 with 5000 mock data").
    print()
    print(render_dataset(await run_harness_cube2_dataset()))


if __name__ == "__main__":
    asyncio.run(_main())
