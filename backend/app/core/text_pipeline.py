"""Shared PII + Profanity text pipeline — used by Cube 2 (text) and Cube 3 (voice).

Extracts the duplicated detect→scrub→clean pipeline into a single reusable function.
Both batch (service.py) and realtime (realtime.py) paths call this helper.

Returns a PipelineResult dataclass with all fields needed for storage and API responses.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.cubes.cube2_text.service import (
    detect_pii,
    detect_profanity,
    scrub_pii,
    scrub_profanity,
)


@dataclass
class PipelineResult:
    """Result of PII + profanity pipeline processing."""

    clean_text: str
    pii_detected: bool
    pii_types: list[dict] | None
    pii_scrubbed_text: str | None
    profanity_detected: bool
    profanity_words: list[dict] | None


async def run_text_pipeline(
    db: AsyncSession,
    text: str,
    language_code: str,
) -> PipelineResult:
    """Run PII detection + scrubbing, then profanity detection + scrubbing.

    Args:
        db: Database session (needed for profanity word lookup).
        text: Raw input text.
        language_code: ISO language code (defaults to "en" if None).
        text: Raw input text (transcript or typed response).
        language_code: ISO language code for profanity dictionary.

    Returns:
        PipelineResult with clean_text and detection metadata.
    """
    language_code = language_code or "en"

    # PII detection + scrubbing
    pii_detections = await detect_pii(text)
    pii_detected = len(pii_detections) > 0
    pii_scrubbed = scrub_pii(text, pii_detections) if pii_detected else text
    pii_types = [
        {"type": d["type"], "start": d["start"], "end": d["end"]}
        for d in pii_detections
    ] if pii_detected else None

    # Profanity detection + scrubbing
    profanity_matches = await detect_profanity(db, pii_scrubbed, language_code)
    profanity_detected = len(profanity_matches) > 0
    clean_text = scrub_profanity(pii_scrubbed, profanity_matches) if profanity_detected else pii_scrubbed
    profanity_words = [
        {"word": m["word"], "severity": m["severity"], "position": m["position"]}
        for m in profanity_matches
    ] if profanity_detected else None

    return PipelineResult(
        clean_text=clean_text,
        pii_detected=pii_detected,
        pii_types=pii_types,
        pii_scrubbed_text=pii_scrubbed if pii_detected else None,
        profanity_detected=profanity_detected,
        profanity_words=profanity_words,
    )
