"""CRS-15.09 — POST /sessions/{sid}/voice/transcribe (dictate, no response create)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest

from app.core.participant_token import issue_participant_token
from app.cubes.cube3_voice.providers.base import TranscriptionResult

SID = uuid.uuid4()
PID = uuid.uuid4()
PREFIX = f"/api/v1/sessions/{SID}/voice"
TOKEN_HEADERS = {"X-Participant-Token": issue_participant_token(SID, PID)}


@pytest.mark.asyncio
async def test_transcribe_returns_transcript_without_submit(client):
    mock = {
        "transcript_text": "Hello from dictate path.",
        "transcript_confidence": 0.93,
        "language_detected": "en",
        "stt_provider": "whisper",
        "audio_duration_sec": 1.5,
        "cost_usd": 0.00015,
        "rate_usd_per_min": 0.006,
        "rate_source": "https://developers.openai.com/api/docs/pricing#transcription",
        "cost_logged": True,
    }
    with patch(
        "app.cubes.cube3_voice.service.transcribe_only",
        new_callable=AsyncMock,
        return_value=mock,
    ):
        resp = await client.post(
            f"{PREFIX}/transcribe",
            data={
                "language_code": "en",
                "audio_format": "webm",
                "participant_id": str(PID),
                "role": "participant",
            },
            files={"audio": ("rec.webm", b"\x00" * 512, "audio/webm")},
            headers=TOKEN_HEADERS,
        )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["transcript_text"] == "Hello from dictate path."
    assert body["stt_provider"] == "whisper"
    assert body["cost_usd"] == 0.00015
    assert body["rate_usd_per_min"] == 0.006
    assert "voice_responses" not in body  # no response id


@pytest.mark.asyncio
async def test_transcribe_rejects_empty_audio(client):
    resp = await client.post(
        f"{PREFIX}/transcribe",
        data={
            "language_code": "en",
            "audio_format": "webm",
            "participant_id": str(PID),
            "role": "participant",
        },
        files={"audio": ("rec.webm", b"", "audio/webm")},
        headers=TOKEN_HEADERS,
    )
    assert resp.status_code in (400, 422)


@pytest.mark.asyncio
async def test_transcribe_requires_identity(client):
    resp = await client.post(
        f"{PREFIX}/transcribe",
        data={"language_code": "en", "audio_format": "webm", "role": "participant"},
        files={"audio": ("rec.webm", b"\x00" * 64, "audio/webm")},
    )
    assert resp.status_code in (401, 403)


def test_whisper_rate_matches_published_source():
    from app.cubes.cube3_voice.providers.base import STT_COST_RATES, compute_stt_cost
    assert STT_COST_RATES["whisper"] == 0.006
    # 60 seconds → $0.006
    assert compute_stt_cost("whisper", 60.0) == 0.006
    # 30 seconds → $0.003
    assert compute_stt_cost("whisper", 30.0) == 0.003


def test_cost_ledger_whisper_rate():
    from decimal import Decimal
    from app.cubes.cube8_tokens.cost_ledger import STT_RATES_USD_PER_MIN, lookup_stt_rate
    assert STT_RATES_USD_PER_MIN["whisper"] == Decimal("0.006")
    hit = lookup_stt_rate("whisper")
    assert hit.rate == Decimal("0.006")
    assert hit.unit == "usd_per_min"
