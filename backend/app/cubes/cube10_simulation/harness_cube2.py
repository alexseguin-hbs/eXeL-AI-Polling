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
import hashlib
import json

from app.core.crypto_utils import compute_response_hash
from app.core.submission_validators import validate_text_input
from app.cubes.cube2_text.service import detect_pii, detect_profanity, scrub_pii

_MAX_LENGTH = 3333

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
    result = await run_harness_cube2(_SAMPLES)
    print(render(result))


if __name__ == "__main__":
    asyncio.run(_main())
