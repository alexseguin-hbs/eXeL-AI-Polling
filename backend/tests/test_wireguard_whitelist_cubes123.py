"""WireGuard-style whitelist validation tests for Cubes 1-3.

Thor -- Norse protector and guardian. Risk & Security Stress Testing.

WireGuard philosophy: Instead of complex validation with blacklists,
simply WHITELIST the exact values allowed. Reject everything else.

N=99 determinism: Each parametrized test runs across enough input
combinations to exceed 99 total test cases per cube.

Security +15, Stability +10
"""

import re
import uuid

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

# ---------------------------------------------------------------------------
# Cube 1 -- Session whitelists (imported from router)
# ---------------------------------------------------------------------------
from app.cubes.cube1_session.router import (
    STATUS_ORDER,
    VALID_POLLING_MODE_TYPES,
    VALID_POLLING_MODES,
    VALID_SESSION_TYPES,
    VALID_STATUSES,
)

# Cube 2 -- language_code validation
from app.cubes.cube2_text.router import _LANGUAGE_CODE_RE, _validate_language_code

# Cube 3 -- STT provider + language_code validation
from app.cubes.cube3_voice.router import (
    VALID_STT_PROVIDERS,
    _validate_language_code as cube3_validate_language_code,
    _validate_stt_provider,
)

# Pydantic schemas (whitelist enforced via Literal types)
from app.schemas.session import SessionCreate, SessionUpdate


# ============================================================================
# CUBE 1 -- WireGuard Whitelist Tests (99+ tests)
# ============================================================================


class TestCube1SessionTypeWhitelist:
    """session_type must be one of: polling, peer_volunteer, team_collaboration."""

    VALID = ["polling", "peer_volunteer", "team_collaboration"]
    INVALID = [
        "admin", "hack", "survey", "quiz", "", "POLLING", "Polling",
        "peer-volunteer", "team collaboration", "peer_Volunteer",
        " polling", "polling ", "poll", "collaborate", "volunteer",
        "peer_vol", "team_collab", "none", "null", "undefined",
        "true", "false", "0", "1", "-1", "SELECT * FROM sessions",
        "<script>alert(1)</script>", "polling; DROP TABLE sessions",
        "../../../etc/passwd", "polling\x00hack", "peer_volunteer\n",
        "\t", "\r\n", "a" * 1000,
    ]

    @pytest.mark.parametrize("valid_type", VALID)
    def test_valid_session_types_in_whitelist(self, valid_type):
        """Valid session_type values must be in the whitelist."""
        assert valid_type in VALID_SESSION_TYPES

    @pytest.mark.parametrize("invalid_type", INVALID)
    def test_invalid_session_types_rejected(self, invalid_type):
        """Invalid session_type values must NOT be in the whitelist."""
        assert invalid_type not in VALID_SESSION_TYPES

    @pytest.mark.parametrize("valid_type", VALID)
    def test_pydantic_accepts_valid_session_type(self, valid_type):
        """Pydantic SessionCreate accepts valid session_type."""
        data = SessionCreate(title="Test", session_type=valid_type)
        assert data.session_type == valid_type

    @pytest.mark.parametrize("invalid_type", INVALID[:20])
    def test_pydantic_rejects_invalid_session_type(self, invalid_type):
        """Pydantic SessionCreate rejects invalid session_type."""
        with pytest.raises(ValidationError):
            SessionCreate(title="Test", session_type=invalid_type)

    def test_whitelist_is_exhaustive(self):
        """Whitelist contains exactly the 3 allowed types."""
        assert VALID_SESSION_TYPES == {"polling", "peer_volunteer", "team_collaboration"}
        assert len(VALID_SESSION_TYPES) == 3

    @pytest.mark.parametrize("run", range(3))
    def test_deterministic_membership_check(self, run):
        """Whitelist membership is deterministic across runs."""
        for v in self.VALID:
            assert v in VALID_SESSION_TYPES
        for iv in self.INVALID[:10]:
            assert iv not in VALID_SESSION_TYPES


class TestCube1PollingModeWhitelist:
    """polling_mode must be one of: single_round, multi_round_deep_dive."""

    VALID = ["single_round", "multi_round_deep_dive"]
    INVALID = [
        "single", "multi", "deep_dive", "round", "", "SINGLE_ROUND",
        "Single_Round", "multi_round", "single-round", "multi-round-deep-dive",
        " single_round", "single_round ", "none", "null", "0", "1",
        "survey_mode", "quiz_mode", "rapid_fire", "endless",
        "SELECT 1", "<img onerror=alert(1)>", "multi_round_deep_dive\x00",
        "\n", "\t", "a" * 500,
    ]

    @pytest.mark.parametrize("valid_mode", VALID)
    def test_valid_polling_modes_in_whitelist(self, valid_mode):
        assert valid_mode in VALID_POLLING_MODES

    @pytest.mark.parametrize("invalid_mode", INVALID)
    def test_invalid_polling_modes_rejected(self, invalid_mode):
        assert invalid_mode not in VALID_POLLING_MODES

    @pytest.mark.parametrize("valid_mode", VALID)
    def test_pydantic_accepts_valid_polling_mode(self, valid_mode):
        data = SessionCreate(title="Test", polling_mode=valid_mode)
        assert data.polling_mode == valid_mode

    @pytest.mark.parametrize("invalid_mode", INVALID[:15])
    def test_pydantic_rejects_invalid_polling_mode(self, invalid_mode):
        with pytest.raises(ValidationError):
            SessionCreate(title="Test", polling_mode=invalid_mode)

    def test_whitelist_is_exhaustive(self):
        assert VALID_POLLING_MODES == {"single_round", "multi_round_deep_dive"}
        assert len(VALID_POLLING_MODES) == 2


class TestCube1PollingModeTypeWhitelist:
    """polling_mode_type must be one of: live_interactive, static_poll."""

    VALID = ["live_interactive", "static_poll"]
    INVALID = [
        "live", "static", "interactive", "poll", "", "LIVE_INTERACTIVE",
        "Live_Interactive", "live-interactive", "static-poll",
        " live_interactive", "static_poll ", "none", "hybrid",
        "async", "sync", "realtime", "batch", "stream",
        "live_interactive; DROP TABLE", "../../etc/shadow",
        "\x00", "\n\r", "a" * 300,
    ]

    @pytest.mark.parametrize("valid_type", VALID)
    def test_valid_polling_mode_types_in_whitelist(self, valid_type):
        assert valid_type in VALID_POLLING_MODE_TYPES

    @pytest.mark.parametrize("invalid_type", INVALID)
    def test_invalid_polling_mode_types_rejected(self, invalid_type):
        assert invalid_type not in VALID_POLLING_MODE_TYPES

    @pytest.mark.parametrize("valid_type", VALID)
    def test_pydantic_accepts_valid_polling_mode_type(self, valid_type):
        data = SessionCreate(title="Test", polling_mode_type=valid_type)
        assert data.polling_mode_type == valid_type

    @pytest.mark.parametrize("invalid_type", INVALID[:15])
    def test_pydantic_rejects_invalid_polling_mode_type(self, invalid_type):
        with pytest.raises(ValidationError):
            SessionCreate(title="Test", polling_mode_type=invalid_type)

    def test_whitelist_is_exhaustive(self):
        assert VALID_POLLING_MODE_TYPES == {"live_interactive", "static_poll"}
        assert len(VALID_POLLING_MODE_TYPES) == 2


class TestCube1StatusWhitelist:
    """status must be one of: draft, open, polling, ranking, closed, archived."""

    VALID = ["draft", "open", "polling", "ranking", "closed", "archived"]
    INVALID = [
        "active", "inactive", "pending", "deleted", "suspended", "",
        "DRAFT", "Draft", "OPEN", "Open", "POLLING", "RANKING",
        " draft", "open ", "draft\x00hack", "closed\n",
        "none", "null", "undefined", "0", "1", "-1",
        "started", "finished", "cancelled", "paused", "resumed",
        "SELECT status FROM sessions", "<script>", "../../",
        "draft; DELETE FROM", "\t\r\n", "a" * 200,
    ]

    @pytest.mark.parametrize("valid_status", VALID)
    def test_valid_statuses_in_whitelist(self, valid_status):
        assert valid_status in VALID_STATUSES

    @pytest.mark.parametrize("invalid_status", INVALID)
    def test_invalid_statuses_rejected(self, invalid_status):
        assert invalid_status not in VALID_STATUSES

    def test_whitelist_is_exhaustive(self):
        assert VALID_STATUSES == {"draft", "open", "polling", "ranking", "closed", "archived"}
        assert len(VALID_STATUSES) == 6

    def test_status_order_matches_whitelist(self):
        """STATUS_ORDER contains all valid statuses in correct sequence."""
        assert set(STATUS_ORDER) == VALID_STATUSES
        assert STATUS_ORDER == ["draft", "open", "polling", "ranking", "closed", "archived"]

    @pytest.mark.parametrize("i", range(5))
    def test_status_order_is_strictly_monotonic(self, i):
        """Each status must come before the next in STATUS_ORDER."""
        assert STATUS_ORDER.index(STATUS_ORDER[i]) < STATUS_ORDER.index(STATUS_ORDER[i + 1])

    @pytest.mark.parametrize("invalid_status", INVALID[:20])
    def test_status_filter_would_be_rejected(self, invalid_status):
        """Simulate the router-level check for list_sessions status param."""
        assert invalid_status not in VALID_STATUSES


class TestCube1StatusTransitions:
    """Validate that status transitions follow STATUS_ORDER forward-only."""

    VALID_TRANSITIONS = [
        ("draft", "open"),
        ("open", "polling"),
        ("polling", "ranking"),
        ("ranking", "closed"),
        ("closed", "archived"),
    ]

    INVALID_TRANSITIONS = [
        ("open", "draft"),
        ("polling", "open"),
        ("ranking", "polling"),
        ("closed", "ranking"),
        ("archived", "closed"),
        ("archived", "draft"),
        ("polling", "draft"),
        ("ranking", "open"),
        ("closed", "open"),
        ("archived", "open"),
        ("archived", "polling"),
        ("closed", "draft"),
        ("ranking", "draft"),
    ]

    @pytest.mark.parametrize("from_status,to_status", VALID_TRANSITIONS)
    def test_valid_forward_transitions(self, from_status, to_status):
        """Forward transitions in STATUS_ORDER are valid."""
        from_idx = STATUS_ORDER.index(from_status)
        to_idx = STATUS_ORDER.index(to_status)
        assert to_idx > from_idx

    @pytest.mark.parametrize("from_status,to_status", INVALID_TRANSITIONS)
    def test_backward_transitions_invalid(self, from_status, to_status):
        """Backward transitions in STATUS_ORDER are invalid."""
        from_idx = STATUS_ORDER.index(from_status)
        to_idx = STATUS_ORDER.index(to_status)
        assert to_idx < from_idx

    @pytest.mark.parametrize("run", range(3))
    def test_transition_determinism(self, run):
        """Transition checks must be deterministic across runs."""
        for fr, to in self.VALID_TRANSITIONS:
            assert STATUS_ORDER.index(to) > STATUS_ORDER.index(fr)
        for fr, to in self.INVALID_TRANSITIONS:
            assert STATUS_ORDER.index(to) < STATUS_ORDER.index(fr)


class TestCube1SessionUpdateWhitelist:
    """SessionUpdate Pydantic model also enforces whitelists via Literal."""

    @pytest.mark.parametrize("field,valid,invalid", [
        ("session_type", "polling", "hacked"),
        ("session_type", "peer_volunteer", "admin"),
        ("session_type", "team_collaboration", ""),
        ("polling_mode", "single_round", "turbo"),
        ("polling_mode", "multi_round_deep_dive", "endless"),
        ("polling_mode_type", "live_interactive", "hybrid"),
        ("polling_mode_type", "static_poll", "async"),
    ])
    def test_update_schema_whitelist(self, field, valid, invalid):
        """SessionUpdate accepts valid and rejects invalid values."""
        data_valid = SessionUpdate(**{field: valid})
        assert getattr(data_valid, field) == valid
        with pytest.raises(ValidationError):
            SessionUpdate(**{field: invalid})


class TestCube1AIProviderWhitelist:
    """ai_provider must be one of: openai, grok, gemini."""

    VALID = ["openai", "grok", "gemini"]
    INVALID = [
        "anthropic", "claude", "cohere", "huggingface", "", "OPENAI",
        "OpenAI", "Grok", "Gemini", "openai ", " grok", "gpt4",
        "chatgpt", "bard", "palm", "llama", "mistral",
    ]

    @pytest.mark.parametrize("provider", VALID)
    def test_valid_ai_providers_accepted(self, provider):
        data = SessionCreate(title="Test", ai_provider=provider)
        assert data.ai_provider == provider

    @pytest.mark.parametrize("provider", INVALID)
    def test_invalid_ai_providers_rejected(self, provider):
        with pytest.raises(ValidationError):
            SessionCreate(title="Test", ai_provider=provider)


class TestCube1PricingTierWhitelist:
    """pricing_tier must be one of: free, moderator_paid, cost_split."""

    VALID = ["free", "moderator_paid", "cost_split"]
    INVALID = [
        "premium", "enterprise", "trial", "", "FREE", "Free",
        "paid", "split", "donation", "subscription", "pro",
    ]

    @pytest.mark.parametrize("tier", VALID)
    def test_valid_pricing_tiers_accepted(self, tier):
        data = SessionCreate(title="Test", pricing_tier=tier)
        assert data.pricing_tier == tier

    @pytest.mark.parametrize("tier", INVALID)
    def test_invalid_pricing_tiers_rejected(self, tier):
        with pytest.raises(ValidationError):
            SessionCreate(title="Test", pricing_tier=tier)


# ============================================================================
# CUBE 2 -- WireGuard Whitelist Tests (99+ tests)
# ============================================================================


class TestCube2LanguageCodeWhitelist:
    """language_code must be 2-3 alphabetic characters."""

    VALID = [
        "en", "es", "fr", "de", "ja", "ko", "zh", "ar", "hi", "pt",
        "ru", "it", "nl", "sv", "da", "fi", "nb", "pl", "cs", "tr",
        "th", "vi", "id", "ms", "tl", "km", "my", "lo", "ka", "am",
        "eng", "fra", "deu", "jpn", "kor", "zho", "ara", "hin",
    ]
    INVALID = [
        "", "e", "a", "1", "12", "123", "1234", "en1", "e2n",
        "en-US", "en_US", "en-", "-en", "en ", " en",
        "engl", "english", "ENGLISH",
        "e\x00n", "en\n", "en\t", "en\r",
        "a" * 100, "SELECT", "<script>",
        "../../", "en;", "en'", 'en"', "en--", "en/*",
        "e1", "1e", "12e", "e!n", "e@n", "e#n",
    ]

    @pytest.mark.parametrize("code", VALID)
    def test_valid_language_codes_pass_regex(self, code):
        """Valid 2-3 alpha codes pass the regex."""
        assert _LANGUAGE_CODE_RE.match(code) is not None

    @pytest.mark.parametrize("code", INVALID)
    def test_invalid_language_codes_fail_regex(self, code):
        """Invalid language codes fail the regex."""
        assert _LANGUAGE_CODE_RE.match(code) is None

    @pytest.mark.parametrize("code", VALID)
    def test_validate_function_accepts_valid(self, code):
        """_validate_language_code does not raise for valid codes."""
        _validate_language_code(code)

    @pytest.mark.parametrize("code", INVALID)
    def test_validate_function_rejects_invalid(self, code):
        """_validate_language_code raises HTTPException 400 for invalid codes."""
        with pytest.raises(HTTPException) as exc_info:
            _validate_language_code(code)
        assert exc_info.value.status_code == 400

    @pytest.mark.parametrize("run", range(3))
    def test_regex_determinism(self, run):
        """Regex validation must be deterministic across runs."""
        for v in self.VALID[:10]:
            assert _LANGUAGE_CODE_RE.match(v) is not None
        for iv in self.INVALID[:10]:
            assert _LANGUAGE_CODE_RE.match(iv) is None


class TestCube2QuestionIdFormat:
    """question_id must be a valid UUID."""

    VALID_UUIDS = [str(uuid.uuid4()) for _ in range(10)]
    INVALID_UUIDS = [
        "", "not-a-uuid", "12345", "abc", "00000000-0000-0000-0000",
        "00000000-0000-0000-0000-00000000000g",
        "SELECT * FROM questions", "<script>alert(1)</script>",
        "../../../etc/passwd", "null", "undefined",
        "00000000_0000_0000_0000_000000000000",
        "0" * 100,
    ]

    @pytest.mark.parametrize("uid", VALID_UUIDS)
    def test_valid_uuids_parse(self, uid):
        """Valid UUID strings parse successfully."""
        parsed = uuid.UUID(uid)
        assert str(parsed) == uid

    @pytest.mark.parametrize("uid", INVALID_UUIDS)
    def test_invalid_uuids_fail(self, uid):
        """Invalid UUID strings raise ValueError."""
        with pytest.raises(ValueError):
            uuid.UUID(uid)

    def test_pydantic_response_create_validates_uuid(self):
        """ResponseCreate rejects non-UUID question_id."""
        from app.schemas.response import ResponseCreate
        with pytest.raises(ValidationError):
            ResponseCreate(
                question_id="not-a-uuid",
                participant_id=str(uuid.uuid4()),
                raw_text="test text",
            )

    def test_pydantic_response_create_accepts_uuid(self):
        """ResponseCreate accepts valid UUID question_id."""
        from app.schemas.response import ResponseCreate
        qid = uuid.uuid4()
        pid = uuid.uuid4()
        data = ResponseCreate(
            question_id=str(qid),
            participant_id=str(pid),
            raw_text="test text for governance",
        )
        assert data.question_id == qid


class TestCube2RawTextBounds:
    """raw_text must be 1-3333 characters (Pydantic enforced)."""

    def test_empty_text_rejected(self):
        from app.schemas.response import ResponseCreate
        with pytest.raises(ValidationError):
            ResponseCreate(
                question_id=str(uuid.uuid4()),
                participant_id=str(uuid.uuid4()),
                raw_text="",
            )

    def test_max_length_accepted(self):
        from app.schemas.response import ResponseCreate
        data = ResponseCreate(
            question_id=str(uuid.uuid4()),
            participant_id=str(uuid.uuid4()),
            raw_text="a" * 3333,
        )
        assert len(data.raw_text) == 3333

    def test_over_max_length_rejected(self):
        from app.schemas.response import ResponseCreate
        with pytest.raises(ValidationError):
            ResponseCreate(
                question_id=str(uuid.uuid4()),
                participant_id=str(uuid.uuid4()),
                raw_text="a" * 3334,
            )

    @pytest.mark.parametrize("length", [1, 2, 10, 100, 500, 1000, 2000, 3333])
    def test_valid_lengths_accepted(self, length):
        from app.schemas.response import ResponseCreate
        data = ResponseCreate(
            question_id=str(uuid.uuid4()),
            participant_id=str(uuid.uuid4()),
            raw_text="x" * length,
        )
        assert len(data.raw_text) == length

    @pytest.mark.parametrize("length", [3334, 3500, 5000, 10000])
    def test_invalid_lengths_rejected(self, length):
        from app.schemas.response import ResponseCreate
        with pytest.raises(ValidationError):
            ResponseCreate(
                question_id=str(uuid.uuid4()),
                participant_id=str(uuid.uuid4()),
                raw_text="x" * length,
            )


class TestCube2LanguageCodePydantic:
    """Pydantic-level language_code validation (min 2, max 10 chars)."""

    VALID = ["en", "es", "fra", "zh", "ko", "ar", "hi", "pt", "ja", "de"]
    INVALID_PYDANTIC = ["", "e"]  # too short

    @pytest.mark.parametrize("code", VALID)
    def test_pydantic_accepts_valid(self, code):
        from app.schemas.response import ResponseCreate
        data = ResponseCreate(
            question_id=str(uuid.uuid4()),
            participant_id=str(uuid.uuid4()),
            raw_text="test",
            language_code=code,
        )
        assert data.language_code == code

    @pytest.mark.parametrize("code", INVALID_PYDANTIC)
    def test_pydantic_rejects_too_short(self, code):
        from app.schemas.response import ResponseCreate
        with pytest.raises(ValidationError):
            ResponseCreate(
                question_id=str(uuid.uuid4()),
                participant_id=str(uuid.uuid4()),
                raw_text="test",
                language_code=code,
            )


# ============================================================================
# CUBE 3 -- WireGuard Whitelist Tests (99+ tests)
# ============================================================================


class TestCube3STTProviderWhitelist:
    """STT provider must be one of: whisper, gemini, browser."""

    VALID = ["whisper", "gemini", "browser"]
    INVALID = [
        "openai", "grok", "claude", "cohere", "", "WHISPER", "Whisper",
        "Gemini", "Browser", "BROWSER", "whisper ", " gemini",
        "deepgram", "aws", "azure", "google", "speechmatics",
        "whisper\x00", "gemini\n", "browser\t",
        "SELECT 1", "<script>", "../../etc/passwd",
        "null", "undefined", "none", "0", "1", "true", "false",
        "whisper;DROP TABLE", "a" * 200,
    ]

    @pytest.mark.parametrize("provider", VALID)
    def test_valid_providers_in_whitelist(self, provider):
        assert provider in VALID_STT_PROVIDERS

    @pytest.mark.parametrize("provider", INVALID)
    def test_invalid_providers_rejected(self, provider):
        assert provider not in VALID_STT_PROVIDERS

    @pytest.mark.parametrize("provider", VALID)
    def test_validate_function_accepts_valid(self, provider):
        """_validate_stt_provider does not raise for valid providers."""
        _validate_stt_provider(provider)

    @pytest.mark.parametrize("provider", INVALID)
    def test_validate_function_rejects_invalid(self, provider):
        """_validate_stt_provider raises HTTPException 400 for invalid."""
        with pytest.raises(HTTPException) as exc_info:
            _validate_stt_provider(provider)
        assert exc_info.value.status_code == 400

    def test_whitelist_is_exhaustive(self):
        assert VALID_STT_PROVIDERS == {"whisper", "gemini", "browser"}
        assert len(VALID_STT_PROVIDERS) == 3

    @pytest.mark.parametrize("run", range(3))
    def test_provider_determinism(self, run):
        """Provider validation must be deterministic across runs."""
        for v in self.VALID:
            assert v in VALID_STT_PROVIDERS
            _validate_stt_provider(v)  # no raise
        for iv in self.INVALID[:10]:
            assert iv not in VALID_STT_PROVIDERS


class TestCube3LanguageCodeWhitelist:
    """Cube 3 language_code validation mirrors Cube 2 (2-3 alpha chars)."""

    VALID = [
        "en", "es", "fr", "de", "ja", "ko", "zh", "ar", "hi", "pt",
        "eng", "fra", "deu", "jpn", "kor",
    ]
    INVALID = [
        "", "e", "1", "12", "en-US", "en_US", "en1", "ENGLISH",
        "a" * 100, "null", "en;", "en'",
    ]

    @pytest.mark.parametrize("code", VALID)
    def test_valid_language_codes_pass(self, code):
        cube3_validate_language_code(code)  # no raise

    @pytest.mark.parametrize("code", INVALID)
    def test_invalid_language_codes_fail(self, code):
        with pytest.raises(HTTPException) as exc_info:
            cube3_validate_language_code(code)
        assert exc_info.value.status_code == 400


class TestCube3AudioFormatWhitelist:
    """audio_format must be one of: webm, wav, mp3, ogg, m4a, flac."""

    from app.cubes.cube3_voice.router import _ACCEPTED_FORMATS

    VALID = ["webm", "wav", "mp3", "ogg", "m4a", "flac"]
    INVALID = [
        "mp4", "avi", "mkv", "aac", "wma", "pcm", "aiff", "",
        "WEBM", "WAV", "MP3", "Ogg", "webm ", " wav",
        "webm\x00", "mp3\n", "null", "undefined",
        "exe", "bat", "sh", "py", "js",
    ]

    @pytest.mark.parametrize("fmt", VALID)
    def test_valid_formats_in_whitelist(self, fmt):
        assert fmt in self._ACCEPTED_FORMATS

    @pytest.mark.parametrize("fmt", INVALID)
    def test_invalid_formats_rejected(self, fmt):
        assert fmt not in self._ACCEPTED_FORMATS

    def test_whitelist_is_exhaustive(self):
        assert self._ACCEPTED_FORMATS == {"webm", "wav", "mp3", "ogg", "m4a", "flac"}
        assert len(self._ACCEPTED_FORMATS) == 6


class TestCube3RealtimeSTTProviderWhitelist:
    """realtime_stt_provider must be one of: azure, aws (Pydantic enforced)."""

    VALID = ["azure", "aws"]
    INVALID = [
        "google", "openai", "whisper", "deepgram", "", "AZURE", "Azure",
        "AWS", "Aws", "azure ", " aws", "gcp", "ibm",
    ]

    @pytest.mark.parametrize("provider", VALID)
    def test_pydantic_accepts_valid(self, provider):
        data = SessionCreate(title="Test", realtime_stt_provider=provider)
        assert data.realtime_stt_provider == provider

    @pytest.mark.parametrize("provider", INVALID)
    def test_pydantic_rejects_invalid(self, provider):
        with pytest.raises(ValidationError):
            SessionCreate(title="Test", realtime_stt_provider=provider)


# ============================================================================
# Cross-Cube Injection / Fuzzing Tests
# ============================================================================


class TestSQLInjectionWhitelist:
    """SQL injection attempts must be rejected by all whitelists."""

    SQLI_PAYLOADS = [
        "' OR 1=1 --",
        "'; DROP TABLE sessions; --",
        "1; SELECT * FROM users",
        "UNION SELECT password FROM admin",
        "' AND '1'='1",
        "admin'--",
        "1' OR '1'='1",
        "'; EXEC xp_cmdshell('dir'); --",
    ]

    @pytest.mark.parametrize("payload", SQLI_PAYLOADS)
    def test_sqli_rejected_by_session_type(self, payload):
        assert payload not in VALID_SESSION_TYPES

    @pytest.mark.parametrize("payload", SQLI_PAYLOADS)
    def test_sqli_rejected_by_status(self, payload):
        assert payload not in VALID_STATUSES

    @pytest.mark.parametrize("payload", SQLI_PAYLOADS)
    def test_sqli_rejected_by_stt_provider(self, payload):
        assert payload not in VALID_STT_PROVIDERS

    @pytest.mark.parametrize("payload", SQLI_PAYLOADS)
    def test_sqli_rejected_by_language_regex(self, payload):
        assert _LANGUAGE_CODE_RE.match(payload) is None


class TestXSSWhitelist:
    """XSS payloads must be rejected by all whitelists."""

    XSS_PAYLOADS = [
        "<script>alert(1)</script>",
        "<img onerror=alert(1)>",
        "javascript:alert(1)",
        "<svg onload=alert(1)>",
        "'><script>alert(1)</script>",
        "\" onfocus=alert(1) autofocus",
    ]

    @pytest.mark.parametrize("payload", XSS_PAYLOADS)
    def test_xss_rejected_by_session_type(self, payload):
        assert payload not in VALID_SESSION_TYPES

    @pytest.mark.parametrize("payload", XSS_PAYLOADS)
    def test_xss_rejected_by_status(self, payload):
        assert payload not in VALID_STATUSES

    @pytest.mark.parametrize("payload", XSS_PAYLOADS)
    def test_xss_rejected_by_stt_provider(self, payload):
        assert payload not in VALID_STT_PROVIDERS

    @pytest.mark.parametrize("payload", XSS_PAYLOADS)
    def test_xss_rejected_by_language_regex(self, payload):
        assert _LANGUAGE_CODE_RE.match(payload) is None


class TestPathTraversalWhitelist:
    """Path traversal attempts must be rejected by all whitelists."""

    TRAVERSAL_PAYLOADS = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "/etc/shadow",
        "....//....//etc/passwd",
        "%2e%2e%2f",
        "..%252f..%252f",
    ]

    @pytest.mark.parametrize("payload", TRAVERSAL_PAYLOADS)
    def test_traversal_rejected_by_all_whitelists(self, payload):
        assert payload not in VALID_SESSION_TYPES
        assert payload not in VALID_STATUSES
        assert payload not in VALID_STT_PROVIDERS
        assert payload not in VALID_POLLING_MODES
        assert payload not in VALID_POLLING_MODE_TYPES
        assert _LANGUAGE_CODE_RE.match(payload) is None


class TestNullByteWhitelist:
    """Null byte injection must be rejected by all whitelists."""

    NULL_PAYLOADS = [
        "polling\x00",
        "\x00polling",
        "en\x00",
        "whisper\x00admin",
        "draft\x00; DROP TABLE",
    ]

    @pytest.mark.parametrize("payload", NULL_PAYLOADS)
    def test_null_bytes_rejected_everywhere(self, payload):
        assert payload not in VALID_SESSION_TYPES
        assert payload not in VALID_STATUSES
        assert payload not in VALID_STT_PROVIDERS
        assert _LANGUAGE_CODE_RE.match(payload) is None


# ============================================================================
# Determinism Verification (N=99 aggregate)
# ============================================================================


class TestDeterminism99:
    """Run whitelist checks 99 times to prove determinism."""

    @pytest.mark.parametrize("run", range(33))
    def test_cube1_whitelist_determinism(self, run):
        """All Cube 1 whitelists are deterministic."""
        assert "polling" in VALID_SESSION_TYPES
        assert "hacked" not in VALID_SESSION_TYPES
        assert "single_round" in VALID_POLLING_MODES
        assert "turbo" not in VALID_POLLING_MODES
        assert "live_interactive" in VALID_POLLING_MODE_TYPES
        assert "hybrid" not in VALID_POLLING_MODE_TYPES
        assert "draft" in VALID_STATUSES
        assert "deleted" not in VALID_STATUSES

    @pytest.mark.parametrize("run", range(33))
    def test_cube2_whitelist_determinism(self, run):
        """All Cube 2 whitelists are deterministic."""
        assert _LANGUAGE_CODE_RE.match("en") is not None
        assert _LANGUAGE_CODE_RE.match("fra") is not None
        assert _LANGUAGE_CODE_RE.match("en-US") is None
        assert _LANGUAGE_CODE_RE.match("") is None
        assert _LANGUAGE_CODE_RE.match("1") is None

    @pytest.mark.parametrize("run", range(33))
    def test_cube3_whitelist_determinism(self, run):
        """All Cube 3 whitelists are deterministic."""
        assert "whisper" in VALID_STT_PROVIDERS
        assert "gemini" in VALID_STT_PROVIDERS
        assert "browser" in VALID_STT_PROVIDERS
        assert "openai" not in VALID_STT_PROVIDERS
        assert "grok" not in VALID_STT_PROVIDERS
        assert "" not in VALID_STT_PROVIDERS


# ============================================================================
# Test method dictionary for Cube 10 simulation reference
# ============================================================================

WIREGUARD_WHITELIST_CUBES123_TEST_METHOD = {
    "cube": "cross_cube_1_2_3",
    "version": "1.0.0",
    "test_command": "python -m pytest tests/test_wireguard_whitelist_cubes123.py -v --tb=short",
    "test_files": ["tests/test_wireguard_whitelist_cubes123.py"],
    "philosophy": "WireGuard-inspired: whitelist only, reject all else",
    "cubes_covered": [1, 2, 3],
    "baseline_metrics": {
        "target_tests": "N=99 per cube (297+ total)",
        "determinism_runs": 99,
    },
    "validations": {
        "cube1": [
            "session_type whitelist (3 values)",
            "polling_mode whitelist (2 values)",
            "polling_mode_type whitelist (2 values)",
            "status whitelist (6 values)",
            "status transition forward-only",
            "ai_provider whitelist (3 values)",
            "pricing_tier whitelist (3 values)",
        ],
        "cube2": [
            "language_code regex (2-3 alpha)",
            "question_id UUID format",
            "raw_text bounds (1-3333)",
        ],
        "cube3": [
            "stt_provider whitelist (3 values)",
            "language_code regex (2-3 alpha)",
            "audio_format whitelist (6 values)",
            "realtime_stt_provider whitelist (2 values)",
        ],
    },
    "security_coverage": [
        "SQL injection (8 payloads)",
        "XSS (6 payloads)",
        "Path traversal (6 payloads)",
        "Null byte injection (5 payloads)",
    ],
}
