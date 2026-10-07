"""HP-07 / Thor round 1 item 5 — a participant's text, voice and ballot carry proof of identity.

INVARIANT: a write made in a participant's name carries either that participant's join-issued
token or the authenticated identity that owns the participant row. A participant UUID alone
(public in the participants list and the Supabase rows) proves nothing.
"""

import io
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.participant_token import (
    HEADER,
    issue_participant_token,
    verify_participant_token,
)

SID = uuid.uuid4()
PID = uuid.uuid4()
OTHER_PID = uuid.uuid4()
OTHER_SID = uuid.uuid4()


def _hdr(token):
    return {HEADER: token} if token is not None else {}


# ── the helper ──────────────────────────────────────────────────────────────────────────


def test_token_round_trip_and_binding():
    tok = issue_participant_token(SID, PID)
    assert tok.startswith(f"{PID}.")
    assert verify_participant_token(SID, tok) == PID
    assert verify_participant_token(OTHER_SID, tok) is None, "bound to one session"
    forged = f"{OTHER_PID}.{tok.split('.', 1)[1]}"
    assert verify_participant_token(SID, forged) is None, "the MAC covers the participant id"
    for bad in (None, "", "nodot", "not-a-uuid.abc", f"{PID}.", f"{PID}.deadbeef"):
        assert verify_participant_token(SID, bad) is None


def test_verify_is_constant_time():
    import inspect

    from app.core import participant_token as pt

    assert "hmac.compare_digest(" in inspect.getsource(pt.verify_participant_token)


def test_secret_is_required_outside_dev_test():
    from app.core import participant_token as pt

    with patch.object(pt.settings, "session_secret", ""), patch.object(pt.settings, "environment", "staging"):
        with pytest.raises(RuntimeError):
            issue_participant_token(SID, PID)


# ── join issues the token ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_join_returns_a_participant_token(client):
    session = SimpleNamespace(
        id=SID, short_code="ABC123", title="t", status="polling", theme_id="exel-cyan",
        custom_accent_color=None, polling_mode_type="live_interactive", ends_at=None,
        timer_display_mode="flex",
    )
    participant = SimpleNamespace(id=PID, display_name="P-1")
    with patch("app.cubes.cube1_session.service.join_session", new=AsyncMock(return_value=(session, participant))):
        r = await client.post("/api/v1/sessions/join/ABC123", json={"language_code": "en"})
    assert r.status_code == 201, r.text
    assert verify_participant_token(SID, r.json()["participant_token"]) == PID


# ── Cube 2 text ─────────────────────────────────────────────────────────────────────────

_TEXT_RESULT = {
    "id": str(uuid.uuid4()), "session_id": str(SID), "question_id": str(uuid.uuid4()),
    "participant_id": str(PID), "source": "text", "char_count": 5, "language_code": "en",
    "submitted_at": datetime.now(timezone.utc).isoformat(), "is_flagged": False,
    "pii_detected": False, "profanity_detected": False, "clean_text": "hello",
    "summary_33": None, "response_hash": None, "heart_tokens_earned": 1.0, "unity_tokens_earned": 5.0,
}


async def _post_text(client, token):
    with patch("app.cubes.cube2_text.service.submit_text_response", new=AsyncMock(return_value=_TEXT_RESULT)) as svc:
        r = await client.post(
            f"/api/v1/sessions/{SID}/responses",
            headers=_hdr(token),
            json={"question_id": str(uuid.uuid4()), "participant_id": str(PID), "raw_text": "hello"},
        )
    return r, svc


@pytest.mark.asyncio
@pytest.mark.parametrize("token", [
    None,                                                   # missing
    "garbage",                                              # malformed
    f"{PID}." + "0" * 64,                                   # forged MAC
    "__other_participant__",                                # another participant's token
    "__other_session__",                                    # this participant, another session
])
async def test_text_submit_refuses_without_this_participants_token(client, token):
    token = {
        "__other_participant__": issue_participant_token(SID, OTHER_PID),
        "__other_session__": issue_participant_token(OTHER_SID, PID),
    }.get(token, token)
    r, svc = await _post_text(client, token)
    assert r.status_code == 403
    svc.assert_not_awaited()


@pytest.mark.asyncio
async def test_text_submit_accepts_a_valid_token(client):
    r, svc = await _post_text(client, issue_participant_token(SID, PID))
    assert r.status_code == 201, r.text
    assert svc.await_args.kwargs["participant_id"] == PID


@pytest.mark.asyncio
async def test_text_submit_accepts_the_authenticated_owner_of_the_row(client, mock_db, regular_user):
    from app.core.auth import get_optional_current_user
    from app.main import app

    mock_db.execute.return_value.scalar_one_or_none.return_value = PID  # the row is theirs
    app.dependency_overrides[get_optional_current_user] = lambda: regular_user
    try:
        r, _ = await _post_text(client, None)
    finally:
        app.dependency_overrides.pop(get_optional_current_user, None)
    assert r.status_code == 201, r.text


@pytest.mark.asyncio
async def test_text_submit_refuses_an_authenticated_stranger(client, mock_db, regular_user):
    from app.core.auth import get_optional_current_user
    from app.main import app

    mock_db.execute.return_value.scalar_one_or_none.return_value = None  # not their row
    app.dependency_overrides[get_optional_current_user] = lambda: regular_user
    try:
        r, _ = await _post_text(client, None)
    finally:
        app.dependency_overrides.pop(get_optional_current_user, None)
    assert r.status_code == 403


# ── Cube 3 voice ────────────────────────────────────────────────────────────────────────


async def _post_voice(client, token):
    result = dict(_TEXT_RESULT, source="voice", audio_duration_sec=1.0, stt_provider="whisper",
                  transcript_text="hello", transcript_confidence=0.9, cost_usd=0.0)
    with patch("app.cubes.cube3_voice.service.submit_voice_response", new=AsyncMock(return_value=result)) as svc:
        r = await client.post(
            f"/api/v1/sessions/{SID}/voice",
            headers=_hdr(token),
            data={"question_id": str(uuid.uuid4()), "participant_id": str(PID)},
            files={"audio": ("a.webm", io.BytesIO(b"\x00" * 64), "audio/webm")},
        )
    return r, svc


@pytest.mark.asyncio
async def test_voice_submit_identity(client):
    for bad in (None, f"{PID}." + "0" * 64, issue_participant_token(SID, OTHER_PID)):
        r, svc = await _post_voice(client, bad)
        assert r.status_code == 403, bad
        svc.assert_not_awaited()
    r, _ = await _post_voice(client, issue_participant_token(SID, PID))
    assert r.status_code == 201, r.text


# ── Cube 7 ballot ───────────────────────────────────────────────────────────────────────


def _ballot_db(mock_db, participant):
    session = SimpleNamespace(id=SID, status="ranking", current_cycle=1, theme2_voting_level="theme2_3",
                              short_code="ABC123", theme01_category=None)
    results = []
    for value in (session, participant):
        res = MagicMock()
        res.scalar_one_or_none.return_value = value
        results.append(res)
    mock_db.execute = AsyncMock(side_effect=results)


async def _post_ballot(client, token):
    ranking = {"id": str(uuid.uuid4()), "session_id": str(SID), "cycle_id": 1, "participant_id": str(PID),
               "ranked_theme_ids": [], "submitted_at": datetime.now(timezone.utc).isoformat()}
    with patch("app.cubes.cube7_ranking.service.submit_user_ranking", new=AsyncMock(return_value=ranking)) as svc:
        r = await client.post(f"/api/v1/sessions/{SID}/rankings", headers=_hdr(token),
                              json={"ranked_theme_ids": [str(uuid.uuid4())]})
    return r, svc


@pytest.mark.asyncio
async def test_anonymous_participant_votes_with_the_token(client, mock_db):
    _ballot_db(mock_db, SimpleNamespace(id=PID))
    r, svc = await _post_ballot(client, issue_participant_token(SID, PID))
    assert r.status_code == 201, r.text
    assert svc.await_args.kwargs["participant_id"] == PID
    assert svc.await_args.kwargs["allow_revote"] is True, "one ballot each: a re-vote replaces it"


@pytest.mark.asyncio
@pytest.mark.parametrize("token", ["garbage", f"{PID}." + "0" * 64, "__other_session__"])
async def test_ballot_refuses_a_bad_token(client, mock_db, token):
    token = issue_participant_token(OTHER_SID, PID) if token == "__other_session__" else token
    _ballot_db(mock_db, SimpleNamespace(id=PID))
    r, svc = await _post_ballot(client, token)
    assert r.status_code == 403
    svc.assert_not_awaited()


@pytest.mark.asyncio
async def test_ballot_without_token_or_login_is_refused(client, mock_db):
    _ballot_db(mock_db, SimpleNamespace(id=PID))
    r, svc = await _post_ballot(client, None)
    assert r.status_code in (401, 403)
    svc.assert_not_awaited()


@pytest.mark.asyncio
async def test_ballot_token_for_a_participant_not_in_the_session(client, mock_db):
    _ballot_db(mock_db, None)  # valid MAC, but no such participant row in this session
    r, svc = await _post_ballot(client, issue_participant_token(SID, OTHER_PID))
    assert r.status_code == 403
    svc.assert_not_awaited()


# ── realtime voice socket ───────────────────────────────────────────────────────────────


def test_realtime_voice_socket_refuses_without_token():
    from fastapi.testclient import TestClient
    from starlette.websockets import WebSocketDisconnect

    from app.main import app

    url = (f"/api/v1/sessions/{SID}/voice/realtime?question_id={uuid.uuid4()}"
           f"&participant_id={PID}&participant_token=forged")
    with patch("app.cubes.cube3_voice.realtime.handle_realtime_transcription", new=AsyncMock()) as handler:
        tc = TestClient(app)  # no context manager: the lifespan (DB create_all) is not needed
        with pytest.raises(WebSocketDisconnect) as e:
            with tc.websocket_connect(url) as ws:
                ws.receive_text()
    assert e.value.code == 4403
    handler.assert_not_awaited()
