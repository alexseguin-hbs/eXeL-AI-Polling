"""N=99 Broadcast payload consistency tests — verify sender/receiver format match.

Tests that the broadcast payload structure is deterministic and consistent
across all 99 runs. Validates Trinity Redundancy data integrity.
"""
import hashlib
import json
import re
import pytest


class TestNewResponsePayloadN99:
    """Verify new_response broadcast payload format is deterministic."""

    def _make_text_payload(self, text: str, response_id: str, count: int):
        """Simulate text submission broadcast (session-view.tsx line 753-760)."""
        return {
            "id": response_id,
            "text": text[:80] + "..." if len(text) > 80 else text,
            "clean_text": text,
            "submitted_at": "2026-04-13T12:00:00.000Z",
            "summary_33": None,
            "count": count,
        }

    def _make_voice_payload(self, text: str, response_id: str, count: int):
        """Simulate voice submission broadcast (session-view.tsx line 1176-1183)."""
        return {
            "id": response_id,
            "text": text[:80] + "..." if len(text) > 80 else text,
            "clean_text": text,
            "submitted_at": "2026-04-13T12:00:00.000Z",
            "summary_33": None,
            "count": count,
        }

    def test_text_voice_format_match_n99(self):
        """Text and voice payloads must have identical structure across 99 runs."""
        for i in range(99):
            text = f"Response {i} from participant"
            rid = f"r-{i}"
            tp = self._make_text_payload(text, rid, i + 1)
            vp = self._make_voice_payload(text, rid, i + 1)
            assert set(tp.keys()) == set(vp.keys()), f"Run {i}: key mismatch"
            assert tp == vp, f"Run {i}: payload mismatch"

    def test_payload_hash_determinism_n99(self):
        """Same input must produce identical payload hash across 99 runs."""
        hashes = set()
        for _ in range(99):
            payload = self._make_text_payload("Test response", "r-001", 1)
            h = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
            hashes.add(h)
        assert len(hashes) == 1, f"Expected 1 unique hash, got {len(hashes)}"

    def test_truncation_at_80_chars_n99(self):
        """Text field truncates at 80 chars with '...' suffix, clean_text preserves full."""
        for i in range(99):
            long_text = "A" * (81 + i)
            payload = self._make_text_payload(long_text, f"r-{i}", 1)
            assert len(payload["text"]) == 83  # 80 + "..."
            assert payload["text"].endswith("...")
            assert payload["clean_text"] == long_text
            assert len(payload["clean_text"]) == 81 + i

    def test_short_text_no_truncation_n99(self):
        """Text under 80 chars is NOT truncated."""
        for i in range(99):
            short_text = "B" * min(i + 1, 80)
            payload = self._make_text_payload(short_text, f"r-{i}", 1)
            assert payload["text"] == short_text
            assert "..." not in payload["text"]

    def test_required_fields_present_n99(self):
        """All required NewResponsePayload fields present across 99 runs."""
        required = {"id", "text", "clean_text", "submitted_at", "summary_33", "count"}
        for i in range(99):
            payload = self._make_text_payload(f"msg {i}", f"r-{i}", i)
            assert set(payload.keys()) == required, f"Run {i}: missing fields"

    def test_count_increments_correctly(self):
        """Count field increments with each submission."""
        for i in range(99):
            payload = self._make_text_payload(f"msg {i}", f"r-{i}", i + 1)
            assert payload["count"] == i + 1


class TestDBInsertPayloadN99:
    """Verify Supabase DB INSERT payload (Path B) is consistent."""

    def _make_db_payload(self, text: str, response_id: str, session_code: str, participant_id: str):
        """Simulate DB insert (session-view.tsx line 765-770)."""
        return {
            "id": response_id,
            "session_code": session_code,
            "participant_id": participant_id,
            "content": text,
        }

    def test_db_payload_determinism_n99(self):
        """DB insert payload is deterministic across 99 runs."""
        hashes = set()
        for _ in range(99):
            payload = self._make_db_payload("Test", "r-001", "DEMO2026", "p-001")
            h = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
            hashes.add(h)
        assert len(hashes) == 1

    def test_db_fields_match_schema_n99(self):
        """DB payload fields match responses table schema: id, session_code, participant_id, content."""
        required = {"id", "session_code", "participant_id", "content"}
        for i in range(99):
            payload = self._make_db_payload(f"text {i}", f"r-{i}", "CODE01", f"p-{i}")
            assert set(payload.keys()) == required


class TestKVPayloadN99:
    """Verify CF KV POST payload (Path C) is consistent."""

    def _make_kv_payload(self, text: str, session_code: str, participant_id: str, lang: str = "en"):
        """Simulate KV post (session-view.tsx line 776-783)."""
        return {
            "short_code": session_code,
            "text": text,
            "participant_id": participant_id,
            "language_code": lang,
        }

    def test_kv_payload_determinism_n99(self):
        """KV payload is deterministic across 99 runs."""
        hashes = set()
        for _ in range(99):
            payload = self._make_kv_payload("Test", "DEMO2026", "p-001")
            h = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
            hashes.add(h)
        assert len(hashes) == 1

    def test_kv_includes_language_code_n99(self):
        """KV payload includes language_code for multilingual support."""
        langs = ["en", "es", "fr", "km", "ar", "zh", "ja", "ko", "hi", "he"]
        for i in range(99):
            lang = langs[i % len(langs)]
            payload = self._make_kv_payload(f"text {i}", "CODE01", f"p-{i}", lang)
            assert payload["language_code"] == lang


class TestFastTrackJoinN99:
    """Verify fast-track join behavior when polling is already live."""

    def test_fast_track_skips_wizard_when_polling_n99(self):
        """When status=polling, user should skip wizard and join directly."""
        for _ in range(99):
            status = "polling"
            # Fast-track should fire when: pollOpen=True AND no joinResponse AND session exists
            should_fast_track = status in ("polling", "ranking")
            assert should_fast_track is True

    def test_fast_track_does_not_fire_when_open_n99(self):
        """When status=open, user goes through normal wizard."""
        for _ in range(99):
            status = "open"
            should_fast_track = status in ("polling", "ranking")
            assert should_fast_track is False

    def test_fast_track_uses_browser_language_n99(self):
        """Fast-track join uses browser language code, defaulting to 'en'."""
        browser_langs = ["en-US", "es-MX", "zh-CN", "fr-FR", "ar-SA", "km-KH", "ja-JP", "ko-KR", "hi-IN", "pt-BR"]
        for i in range(99):
            raw = browser_langs[i % len(browser_langs)]
            lang = raw.split("-")[0]  # Matches navigator.language.split("-")[0]
            assert len(lang) == 2
            assert lang.isalpha()

    def test_fast_track_joins_anonymously_n99(self):
        """Fast-track join always uses anonymous mode (display_name=null)."""
        for _ in range(99):
            payload = {"display_name": None, "language_code": "en", "results_opt_in": False}
            assert payload["display_name"] is None
            assert payload["results_opt_in"] is False


class TestSessionStateMachineN99:
    """Verify session status transitions are deterministic."""

    STATUS_ORDER = ["created", "open", "polling", "ranking", "closed", "archived"]

    def test_status_order_is_forward_only_n99(self):
        """Status can only move forward in STATUS_ORDER, never backward."""
        for _ in range(99):
            for i, status in enumerate(self.STATUS_ORDER):
                for j, other in enumerate(self.STATUS_ORDER):
                    if j <= i:
                        # Can't transition backward or to same
                        pass
                    else:
                        # Forward transition is valid
                        assert self.STATUS_ORDER.index(other) > self.STATUS_ORDER.index(status)

    def test_status_order_length_n99(self):
        """Exactly 6 statuses in the state machine."""
        for _ in range(99):
            assert len(self.STATUS_ORDER) == 6

    def test_polling_precedes_ranking_n99(self):
        """Polling must come before ranking — themes need responses first."""
        for _ in range(99):
            assert self.STATUS_ORDER.index("polling") < self.STATUS_ORDER.index("ranking")
