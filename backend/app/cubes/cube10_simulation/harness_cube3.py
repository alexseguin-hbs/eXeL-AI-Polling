"""Cube 3 (Voice-to-Text) stand-alone harness (Dev-Sim reference).

Runs the REAL Cube 3 post-transcription path — validate_transcript (confidence gate
+ over-length truncation) → PII detect (regex) → scrub → profanity → SHA-256 hash —
on simulated STT results, deterministically and OFFLINE. The STT provider call
itself (audio → text) needs a live provider + audio bytes, so it is STUBBED here:
each sample is a TranscriptionResult as if an STT provider already produced it. This
exercises everything Cube 3 owns AFTER transcription plus its confidence gate, which
is the deterministic, replayable part (mirrors harness_cube2).

Run: `cd backend && .venv/bin/python -m app.cubes.cube10_simulation.harness_cube3`
"""

import asyncio
import hashlib
import json

from app.core.crypto_utils import compute_response_hash
from app.core.exceptions import ResponseValidationError
from app.cubes.cube2_text.service import detect_pii, detect_profanity, scrub_pii
from app.cubes.cube3_voice.providers.base import TranscriptionResult
from app.cubes.cube3_voice.service import validate_transcript

_MAX_LENGTH = 3333

# Simulated STT output: (transcript, confidence). One carries PII; one is below the
# 0.3 confidence threshold (a real STT-quality rejection); one is over-length.
_SAMPLES: list[tuple[str, float]] = [
    ("The mobile experience is frustrating, reach me at jane.doe@example.com to follow up.", 0.94),
    ("I really appreciate the AI clustering, it saves hours of manual reading.", 0.88),
    ("umm... [inaudible] ... maybe", 0.12),  # below _MIN_CONFIDENCE → rejected
    ("word " * 1200, 0.77),                  # over-length → truncated (still included)
]

# Re-export from harness_cube2 to keep the offline profanity + NER stubs identical.
from app.cubes.cube10_simulation.harness_cube2 import _NoFilterDB, _ner_disabled


async def run_harness_cube3(
    samples: list[tuple[str, float]] = _SAMPLES, max_length: int = _MAX_LENGTH
) -> dict:
    """Run the real Cube 3 transcript-validation + downstream pipeline on `samples`."""
    import app.cubes.cube2_text.service as svc
    _orig_ner = svc._get_ner_pipeline
    svc._get_ner_pipeline = _ner_disabled  # type: ignore[assignment]
    db = _NoFilterDB()

    total = pii_responses = profanity_responses = scrubbed = rejected = truncated = 0
    unique_hashes: set[str] = set()
    hasher = hashlib.sha256()
    rows: list[dict] = []
    try:
        for i, (transcript, confidence) in enumerate(samples):
            result = TranscriptionResult(
                transcript=transcript, confidence=confidence,
                language_detected="en", provider="offline", audio_duration_sec=1.0,
            )
            try:
                validated = validate_transcript(result, max_length)  # confidence gate + truncate
            except ResponseValidationError:
                rejected += 1  # STT confidence too low — a real Cube 3 outcome
                hasher.update(f"{i}:REJECTED".encode())
                continue
            if len(transcript.strip()) > max_length:
                truncated += 1
            detections = await detect_pii(validated)
            clean = scrub_pii(validated, detections)
            profanity = await detect_profanity(db, clean, "en")
            response_hash = compute_response_hash(clean)

            total += 1
            if detections:
                pii_responses += 1
            if clean != validated:
                scrubbed += 1
            if profanity:
                profanity_responses += 1
            unique_hashes.add(response_hash)
            hasher.update(f"{i}:{response_hash}".encode())
            rows.append({"index": i, "confidence": confidence,
                         "chars": len(validated), "pii": len(detections),
                         "hash": response_hash[:12]})
    finally:
        svc._get_ner_pipeline = _orig_ner

    return {
        "cube": "cube3_voice",
        "included": total,
        "rejected_low_confidence": rejected,
        "truncated_overlength": truncated,
        "pii_responses": pii_responses,
        "scrubbed": scrubbed,
        "profanity_responses": profanity_responses,
        "unique_hashes": len(unique_hashes),
        "rows": rows,
        "metrics": {"wall_time_ms": 0.0, "function_calls": total * 4, "db_execute_calls": total},
        "determinism_signature": hasher.hexdigest(),
    }


def render(r: dict) -> str:
    out = ["═" * 72, f"  CUBE 3 VOICE HARNESS — {r['included']} transcripts included · offline", "═" * 72]
    for row in r["rows"]:
        out.append(f"  #{row['index']}  conf={row['confidence']:.0%}  chars={row['chars']:>4} "
                   f"PII={row['pii']}  hash={row['hash']}…")
    out.append("─" * 72)
    out.append(f"  included: {r['included']}  rejected(low-confidence): {r['rejected_low_confidence']}  "
               f"truncated(over-length): {r['truncated_overlength']}")
    out.append(f"  PII scrubbed: {r['scrubbed']}   unique hashes: {r['unique_hashes']}")
    out.append(f"  Determinism signature: {r['determinism_signature']}")
    out.append("═" * 72)
    return "\n".join(out)


if __name__ == "__main__":
    print(render(asyncio.run(run_harness_cube3())))
