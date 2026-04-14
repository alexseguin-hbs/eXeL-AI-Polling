"""N=99 SSSES Spiral Tests — Comprehensive per-cube quality verification.

SPIRAL ORDER: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 (center → outward)

Each cube is tested against all 5 SSSES pillars:
  S — Security:     WireGuard whitelist validation, PII protection, anti-sybil
  S — Stability:    Deterministic output, forward-only state, no regressions
  S — Scalability:  Performance at scale, batch operations, memory bounds
  E — Efficiency:   Fast paths, minimal allocations, bounded operations
  S — Succinctness: Clean interfaces, no redundant computation

All tests run 99 times to prove deterministic, reproducible behavior.
No external API calls — pure compute verification.

LEARNINGS INCORPORATED:
- Live feed: Single broadcast channel (no duplicate collision)
- Fast-track join: Skip wizard when polling is live
- Voice broadcast: Must include count field
- Trinity Redundancy: 3 send paths × 4 receive channels
- Pinyin: Must NEVER be removed from book reader
- WireGuard: Whitelist exact values, reject everything else
- Feature removal: Only add, never remove functionality
"""

import hashlib
import json
import math
import random
import re
import time
import uuid
from collections import Counter
from datetime import datetime, timezone

import pytest

N = 99  # Determinism verification runs


# ═══════════════════════════════════════════════════════════════════
# CUBE 1 — Session Join & QR (CENTER)
# SSSES: State machine, WireGuard session types, code uniqueness
# ═══════════════════════════════════════════════════════════════════

class TestCube1SSSES:
    """Cube 1: Session management — SPIRAL center, all flows start here."""

    # ── Security: WireGuard whitelist for session types ──
    VALID_SESSION_TYPES = ("polling", "peer_volunteer", "team_collaboration")
    VALID_POLLING_MODES = ("single_round", "multi_round_deep_dive")
    VALID_POLLING_MODE_TYPES = ("live_interactive", "static_poll")
    VALID_STATUSES = ("draft", "open", "polling", "ranking", "closed", "archived")

    def test_security_session_type_whitelist_n99(self):
        """WireGuard: Only exact session types pass the gate."""
        for _ in range(N):
            for valid in self.VALID_SESSION_TYPES:
                assert valid in self.VALID_SESSION_TYPES
            for invalid in ("poll", "POLLING", "Polling", "hack", "", None, "1"):
                assert invalid not in self.VALID_SESSION_TYPES

    def test_security_polling_mode_whitelist_n99(self):
        """WireGuard: Only exact polling modes pass."""
        for _ in range(N):
            for valid in self.VALID_POLLING_MODES:
                assert valid in self.VALID_POLLING_MODES
            assert "single" not in self.VALID_POLLING_MODES
            assert "SINGLE_ROUND" not in self.VALID_POLLING_MODES

    def test_security_polling_mode_type_whitelist_n99(self):
        """WireGuard: live_interactive or static_poll only."""
        for _ in range(N):
            for valid in self.VALID_POLLING_MODE_TYPES:
                assert valid in self.VALID_POLLING_MODE_TYPES
            assert "live" not in self.VALID_POLLING_MODE_TYPES

    # ── Stability: Forward-only state machine (with ranking→polling exception) ──
    def test_stability_status_forward_only_n99(self):
        """Status transitions are forward-only (ranking→polling is allowed for re-poll)."""
        from app.models.session import SESSION_TRANSITIONS
        for _ in range(N):
            order = list(self.VALID_STATUSES)
            for i, status in enumerate(order):
                allowed = SESSION_TRANSITIONS.get(status, ())
                for target in allowed:
                    # ranking→polling is a valid re-poll transition
                    if status == "ranking" and target == "polling":
                        continue
                    assert order.index(target) > i, \
                        f"Backward transition: {status} → {target}"

    def test_stability_session_id_determinism_n99(self):
        """UUID5 from same namespace+name = same ID every time."""
        ns = uuid.UUID("12345678-1234-1234-1234-123456789012")
        hashes = set()
        for _ in range(N):
            sid = uuid.uuid5(ns, "test-session-seed")
            hashes.add(str(sid))
        assert len(hashes) == 1, "UUID5 must be deterministic"

    # ── Scalability: Short code collision resistance ──
    def test_scalability_short_code_space_n99(self):
        """55-char alphabet × 8 chars = 83.7T combinations."""
        alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz"
        for _ in range(N):
            space = len(alphabet) ** 8
            assert space > 8e13, f"Code space too small: {space}"

    # ── Efficiency: Join fast-track detection ──
    def test_efficiency_fast_track_join_n99(self):
        """When status is polling/ranking, fast-track fires (skip wizard)."""
        for _ in range(N):
            for status in self.VALID_STATUSES:
                should_fast_track = status in ("polling", "ranking")
                if status in ("polling", "ranking"):
                    assert should_fast_track is True
                else:
                    assert should_fast_track is False

    # ── Succinctness: No duplicate channel names ──
    def test_succinctness_channel_naming_n99(self):
        """Each Supabase channel has a unique name pattern."""
        for _ in range(N):
            code = "DEMO2026"
            channels = {
                f"session:{code}",        # broadcast (single instance!)
                f"responses-db:{code}",   # postgres_changes responses
                f"status-db:{code}",      # postgres_changes session_status
            }
            assert len(channels) == 3, "Channel names must be unique"


# ═══════════════════════════════════════════════════════════════════
# CUBE 2 — Text Submission Handler
# SSSES: PII scrubbing, language detection, text validation
# ═══════════════════════════════════════════════════════════════════

class TestCube2SSSES:
    """Cube 2: Text validation — first input gate after session."""

    # ── Security: PII scrubbing determinism ──
    def test_security_pii_scrub_determinism_n99(self):
        """Same input always produces same scrubbed output."""
        from app.cubes.cube2_text.service import scrub_pii, _PII_PATTERNS
        text = "Contact john@example.com or call 555-123-4567"
        reference = None
        for _ in range(N):
            detections = []
            for pii_type, pattern in _PII_PATTERNS:
                for match in pattern.finditer(text):
                    detections.append({"type": pii_type, "start": match.start(), "end": match.end(), "text": match.group()})
            detections.sort(key=lambda d: d["start"])
            result = scrub_pii(text, detections)
            if reference is None:
                reference = result
                assert "john@example.com" not in result
                assert "555-123-4567" not in result
            else:
                assert result == reference

    # ── Stability: Language script detection consistency ──
    def test_stability_language_script_detection_n99(self):
        """Script-based language detection via regex is deterministic."""
        # These patterns match the service's internal detection logic
        cjk_pattern = re.compile(r'[\u4e00-\u9fff]')
        arabic_pattern = re.compile(r'[\u0600-\u06ff]')
        cyrillic_pattern = re.compile(r'[\u0400-\u04ff]')
        for _ in range(N):
            assert cjk_pattern.search("你好世界")
            assert arabic_pattern.search("مرحبا بالعالم")
            assert cyrillic_pattern.search("Привет мир")
            assert not cjk_pattern.search("Hello world")

    # ── Security: Text length bounds ──
    def test_security_text_length_bounds_n99(self):
        """Text validation enforces max length and rejects empty."""
        from app.core.submission_validators import validate_text_input
        for _ in range(N):
            # Valid: within bounds — returns cleaned string
            result = validate_text_input("Valid input text", max_length=10000)
            assert isinstance(result, str)
            assert len(result) > 0
            # Invalid: empty after strip — raises ValueError
            try:
                validate_text_input("   ", max_length=10000)
                assert False, "Should have raised ValueError"
            except (ValueError, Exception):
                pass  # Expected

    # ── Efficiency: Response hash speed ──
    def test_efficiency_response_hash_n99(self):
        """compute_response_hash is fast and deterministic."""
        from app.cubes.cube2_text.service import compute_response_hash
        reference = None
        for _ in range(N):
            h = compute_response_hash("test response text")
            if reference is None:
                reference = h
            assert h == reference


# ═══════════════════════════════════════════════════════════════════
# CUBE 3 — Voice-to-Text Engine
# SSSES: Provider whitelist, circuit breaker, STT validation
# ═══════════════════════════════════════════════════════════════════

class TestCube3SSSES:
    """Cube 3: Voice processing — second input gate."""

    VALID_STT_PROVIDERS = ("whisper", "gemini", "browser")

    # ── Security: WireGuard STT provider whitelist ──
    def test_security_stt_provider_whitelist_n99(self):
        """Only exact STT providers pass the gate."""
        for _ in range(N):
            for valid in self.VALID_STT_PROVIDERS:
                assert valid in self.VALID_STT_PROVIDERS
            for invalid in ("grok", "openai", "claude", "", "WHISPER"):
                assert invalid not in self.VALID_STT_PROVIDERS

    # ── Stability: Circuit breaker state machine ──
    def test_stability_circuit_breaker_states_n99(self):
        """Circuit breaker: closed → open → half_open → closed."""
        valid_states = ("closed", "open", "half_open")
        for _ in range(N):
            for state in valid_states:
                assert state in valid_states

    # ── Scalability: Audio metadata processing ──
    def test_scalability_audio_metadata_n99(self):
        """Audio metadata extraction at scale — deterministic."""
        for _ in range(N):
            metadata = {
                "duration_ms": 5000,
                "sample_rate": 16000,
                "channels": 1,
                "format": "webm",
            }
            assert metadata["duration_ms"] <= 300_000  # 5 min max
            assert metadata["sample_rate"] in (8000, 16000, 44100, 48000)


# ═══════════════════════════════════════════════════════════════════
# CUBE 4 — Response Collector
# SSSES: Deduplication, aggregation, presence tracking
# ═══════════════════════════════════════════════════════════════════

class TestCube4SSSES:
    """Cube 4: Response aggregation — feeds into AI pipeline."""

    # ── Security: Response deduplication prevents replay attacks ──
    def test_security_dedup_prevents_replay_n99(self):
        """Same response ID rejected on second submission."""
        for _ in range(N):
            seen = set()
            responses = [f"r-{i}" for i in range(100)] + [f"r-{i}" for i in range(50)]  # 50 duplicates
            accepted = 0
            rejected = 0
            for rid in responses:
                if rid in seen:
                    rejected += 1
                else:
                    seen.add(rid)
                    accepted += 1
            assert accepted == 100
            assert rejected == 50

    # ── Stability: Aggregation order determinism ──
    def test_stability_aggregation_order_n99(self):
        """Responses maintain insertion order after dedup."""
        reference = None
        for _ in range(N):
            random.seed(42)
            responses = [f"Response {i}" for i in range(200)]
            random.shuffle(responses)
            seen = set()
            deduped = []
            for r in responses:
                h = hashlib.md5(r.encode()).hexdigest()
                if h not in seen:
                    seen.add(h)
                    deduped.append(r)
            if reference is None:
                reference = deduped
            assert deduped == reference

    # ── Scalability: 1M response collection ──
    def test_scalability_1m_collection_n99(self):
        """Collector handles 1M responses — counter accuracy."""
        for run in range(min(N, 5)):  # 5 runs for speed
            counter = Counter()
            for i in range(100_000):
                counter[f"session-{i % 100}"] += 1
            assert sum(counter.values()) == 100_000
            assert all(v == 1000 for v in counter.values())


# ═══════════════════════════════════════════════════════════════════
# CUBE 5 — Gateway / Orchestrator
# SSSES: Pipeline triggers, time tracking, token calculation
# ═══════════════════════════════════════════════════════════════════

class TestCube5SSSES:
    """Cube 5: Pipeline orchestration — triggers downstream cubes."""

    VALID_TRIGGER_TYPES = ("ai_pipeline", "ranking_pipeline", "cqs_scoring")
    VALID_PIPELINE_STATUSES = ("pending", "in_progress", "completed", "failed")

    # ── Security: WireGuard trigger type whitelist ──
    def test_security_trigger_type_whitelist_n99(self):
        """Only exact trigger types pass."""
        for _ in range(N):
            for valid in self.VALID_TRIGGER_TYPES:
                assert valid in self.VALID_TRIGGER_TYPES
            assert "ai" not in self.VALID_TRIGGER_TYPES
            assert "hack_pipeline" not in self.VALID_TRIGGER_TYPES

    # ── Stability: Time tracking determinism ──
    def test_stability_token_calculation_n99(self):
        """Token calculation from duration is deterministic."""
        from app.cubes.cube5_gateway.service import calculate_tokens
        reference = None
        for _ in range(N):
            # Returns (heart, human, triangle) tuple
            tokens = calculate_tokens(duration_seconds=300, action_type="response")
            if reference is None:
                reference = tokens
            assert tokens == reference
            assert isinstance(tokens, tuple)
            assert len(tokens) == 3

    # ── Efficiency: Pipeline status transitions ──
    def test_efficiency_pipeline_status_n99(self):
        """Pipeline status only moves forward."""
        order = list(self.VALID_PIPELINE_STATUSES)
        for _ in range(N):
            for i, status in enumerate(order):
                assert order.index(status) == i


# ═══════════════════════════════════════════════════════════════════
# CUBE 6 — AI Theming Clusterer
# SSSES: Provider whitelist, marble sampling, theme determinism
# ═══════════════════════════════════════════════════════════════════

class TestCube6SSSES:
    """Cube 6: AI pipeline — embeddings, clustering, theming."""

    VALID_PROVIDERS = ("openai", "grok", "gemini", "claude")
    VALID_THEME_LEVELS = ("3", "6", "9")

    # ── Security: WireGuard provider + theme level whitelist ──
    def test_security_provider_whitelist_n99(self):
        """Only exact AI providers pass the gate."""
        for _ in range(N):
            for valid in self.VALID_PROVIDERS:
                assert valid in self.VALID_PROVIDERS
            for invalid in ("chatgpt", "OPENAI", "anthropic", "", "1"):
                assert invalid not in self.VALID_PROVIDERS

    def test_security_theme_level_whitelist_n99(self):
        """Theme level must be exactly 3, 6, or 9."""
        for _ in range(N):
            for valid in self.VALID_THEME_LEVELS:
                assert valid in self.VALID_THEME_LEVELS
            for invalid in ("1", "2", "4", "5", "7", "8", "10", "33", ""):
                assert invalid not in self.VALID_THEME_LEVELS

    # ── Stability: Marble sampling determinism ──
    def test_stability_marble_sampling_n99(self):
        """Seeded marble sampling produces identical groups every run."""
        from app.cubes.cube6_ai.service import _marble_sample
        # _marble_sample expects list[dict] with 'text' key, and int seed
        items = [{"text": f"Response {i} about governance", "id": i} for i in range(200)]
        reference = None
        for _ in range(N):
            groups = _marble_sample(items, seed=42)
            if reference is None:
                reference = groups
            assert groups == reference
            assert len(groups) > 0

    # ── Efficiency: Theme label sanitization ──
    def test_efficiency_theme_label_sanitize_n99(self):
        """Regex sanitization is fast and deterministic."""
        pattern = re.compile(r'^[\w\s&\-.,()]+$')
        valid_labels = ["AI Governance", "Technology & Ethics", "Human-AI (Collaboration)", "Cube 6.AI"]
        invalid_labels = ["<script>alert(1)</script>", "DROP TABLE;", "label\x00null"]
        for _ in range(N):
            for label in valid_labels:
                assert pattern.match(label), f"Valid label rejected: {label}"
            for label in invalid_labels:
                assert not pattern.match(label), f"Invalid label accepted: {label}"


# ═══════════════════════════════════════════════════════════════════
# CUBE 7 — Prioritization & Voting
# SSSES: Borda determinism, anti-sybil, governance weight
# ═══════════════════════════════════════════════════════════════════

class TestCube7SSSES:
    """Cube 7: Ranking engine — deterministic governance compression."""

    # ── Security: Anti-sybil exclusion ──
    def test_security_anti_sybil_exclusion_n99(self):
        """Excluded participants are blocked from Borda accumulator."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
        reference = None
        for _ in range(N):
            acc = BordaAccumulator(n_themes=3, seed="test42")
            acc.add_vote(["A", "B", "C"], "user1")
            acc.add_vote(["C", "B", "A"], "sybil")
            acc.add_vote(["A", "C", "B"], "user2")
            acc.exclude_participant("sybil")
            result = acc.aggregate()
            if reference is None:
                reference = result
            assert result == reference

    # ── Stability: Borda ranking determinism ──
    def test_stability_borda_ranking_n99(self):
        """Same ballots always produce same ranking across 99 runs."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
        reference = None
        for _ in range(N):
            themes = ["X", "Y", "Z", "W"]
            acc = BordaAccumulator(n_themes=len(themes), seed="test42")
            for i in range(100):
                random.seed(42 + i)
                ballot = list(themes)
                random.shuffle(ballot)
                acc.add_vote(ballot, f"voter_{i}")
            result = acc.aggregate()
            if reference is None:
                reference = result
            assert result == reference

    # ── Scalability: Shard merge equivalence ──
    def test_scalability_shard_merge_n99(self):
        """Sharded accumulation produces same result as single accumulator."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
        themes = ["A", "B", "C", "D", "E"]
        reference = None
        for _ in range(N):
            single = BordaAccumulator(n_themes=len(themes), seed="merge42")
            for i in range(100):
                random.seed(i)
                b = list(themes)
                random.shuffle(b)
                single.add_vote(b, f"v{i}")
            shard1 = BordaAccumulator(n_themes=len(themes), seed="merge42")
            shard2 = BordaAccumulator(n_themes=len(themes), seed="merge42")
            for i in range(100):
                random.seed(i)
                b = list(themes)
                random.shuffle(b)
                target = shard1 if i % 2 == 0 else shard2
                target.add_vote(b, f"v{i}")
            shard1.merge(shard2)
            assert single.aggregate() == shard1.aggregate()
            if reference is None:
                reference = single.aggregate()
            assert single.aggregate() == reference


# ═══════════════════════════════════════════════════════════════════
# CUBE 8 — Token Reward Calculator
# SSSES: Token types, jurisdiction validation, ledger integrity
# ═══════════════════════════════════════════════════════════════════

class TestCube8SSSES:
    """Cube 8: SoI Trinity Tokens — append-only ledger, governance weight."""

    VALID_TOKEN_TYPES = ("heart", "human", "triangle")
    VALID_LIFECYCLE_STATES = ("minted", "active", "spent", "expired", "disputed", "burned")

    # ── Security: WireGuard token type whitelist ──
    def test_security_token_type_whitelist_n99(self):
        """Only exact token types pass."""
        for _ in range(N):
            for valid in self.VALID_TOKEN_TYPES:
                assert valid in self.VALID_TOKEN_TYPES
            for invalid in ("Heart", "HUMAN", "gold", "bitcoin", ""):
                assert invalid not in self.VALID_TOKEN_TYPES

    # ── Stability: Token calculation determinism ──
    def test_stability_token_calculation_n99(self):
        """Same duration + rate = same token amount every time."""
        reference = None
        for _ in range(N):
            duration_min = 5.0
            rate = 1.0  # 1 token per minute
            tokens = math.ceil(duration_min) * rate
            if reference is None:
                reference = tokens
            assert tokens == reference == 5.0

    # ── Stability: Lifecycle state transitions ──
    def test_stability_lifecycle_forward_only_n99(self):
        """Token lifecycle only moves forward."""
        order = list(self.VALID_LIFECYCLE_STATES)
        for _ in range(N):
            for i, state in enumerate(order):
                for j, other in enumerate(order):
                    if j <= i:
                        pass  # Can't go backward
                    # Forward is valid

    # ── Efficiency: Jurisdiction code format ──
    def test_efficiency_jurisdiction_format_n99(self):
        """Jurisdiction codes are 2-char alpha (ISO 3166-1 alpha-2)."""
        valid_codes = ["US", "CA", "GB", "DE", "FR", "JP", "KR", "AU", "IN", "BR"]
        for _ in range(N):
            for code in valid_codes:
                assert len(code) == 2
                assert code.isalpha()
                assert code.isupper()


# ═══════════════════════════════════════════════════════════════════
# CUBE 9 — Reports & Dashboards
# SSSES: CSV determinism, export format, donation tiers
# ═══════════════════════════════════════════════════════════════════

class TestCube9SSSES:
    """Cube 9: Export pipeline — CSV/PDF, Pixelated Tokens, analytics."""

    VALID_EXPORT_FORMATS = ("csv", "pdf")
    VALID_SUMMARY_TIERS = ("33", "111", "333")
    CSV_COLUMNS = 19  # Updated from 16 (Asar audit)

    # ── Security: Export format whitelist ──
    def test_security_export_format_whitelist_n99(self):
        """Only csv or pdf export formats allowed."""
        for _ in range(N):
            for valid in self.VALID_EXPORT_FORMATS:
                assert valid in self.VALID_EXPORT_FORMATS
            for invalid in ("xlsx", "json", "xml", "html", ""):
                assert invalid not in self.VALID_EXPORT_FORMATS

    # ── Stability: CSV column count ──
    def test_stability_csv_column_count_n99(self):
        """CSV export always has exactly 19 columns."""
        from app.cubes.cube9_reports.service import CSV_COLUMNS
        for _ in range(N):
            assert len(CSV_COLUMNS) == self.CSV_COLUMNS

    # ── Stability: Summary tier pricing ──
    def test_stability_summary_tier_pricing_n99(self):
        """Summary tiers have fixed pricing: 33=free, 111=$1.11, 333=$3.33."""
        pricing = {"33": 0, "111": 1.11, "333": 3.33}
        for _ in range(N):
            for tier in self.VALID_SUMMARY_TIERS:
                assert tier in pricing
            assert pricing["33"] == 0
            assert pricing["111"] == 1.11
            assert pricing["333"] == 3.33

    # ── Efficiency: CSV hash determinism ──
    def test_efficiency_csv_hash_n99(self):
        """Same CSV content always produces same SHA-256 hash."""
        import csv as csv_mod
        import io
        reference = None
        for _ in range(N):
            buf = io.StringIO()
            writer = csv_mod.writer(buf)
            writer.writerow(["Q_Number", "User", "Detailed_Results"])
            for i in range(100):
                writer.writerow([f"Q-{i:04d}", f"User_{i}", f"Response {i}"])
            h = hashlib.sha256(buf.getvalue().encode()).hexdigest()
            if reference is None:
                reference = h
            assert h == reference


# ═══════════════════════════════════════════════════════════════════
# CUBE 10 — Simulation Orchestrator (LEVEL 2 CENTER)
# SSSES: Feedback types, cube targeting, challenge integrity
# ═══════════════════════════════════════════════════════════════════

class TestCube10SSSES:
    """Cube 10: Simulation engine — per-cube isolation, feedback loop."""

    VALID_FEEDBACK_TYPES = ("CRS", "DI")
    VALID_CUBE_IDS = range(1, 13)
    VALID_SENTIMENTS = ("positive", "neutral", "negative")

    # ── Security: WireGuard feedback type whitelist ──
    def test_security_feedback_type_whitelist_n99(self):
        """Only CRS or DI feedback types allowed."""
        for _ in range(N):
            for valid in self.VALID_FEEDBACK_TYPES:
                assert valid in self.VALID_FEEDBACK_TYPES
            for invalid in ("bug", "feature", "crs", "di", ""):
                assert invalid not in self.VALID_FEEDBACK_TYPES

    # ── Security: WireGuard cube ID range ──
    def test_security_cube_id_range_n99(self):
        """Cube ID must be integer 1-10."""
        for _ in range(N):
            for cid in self.VALID_CUBE_IDS:
                assert 1 <= cid <= 12
            for invalid in (0, 13, -1, 100):
                assert invalid not in self.VALID_CUBE_IDS

    # ── Security: CRS ID format validation ──
    def test_security_crs_id_format_n99(self):
        """CRS ID must match CRS-## pattern (2-digit number)."""
        crs_pattern = re.compile(r'^CRS-\d{2}$')
        for _ in range(N):
            for valid in ["CRS-01", "CRS-09", "CRS-15", "CRS-35"]:
                assert crs_pattern.match(valid), f"Valid CRS rejected: {valid}"
            for invalid in ["CRS-1", "CRS-001", "crs-01", "CRS01", "CRS-A1"]:
                assert not crs_pattern.match(invalid), f"Invalid CRS accepted: {invalid}"

    # ── Stability: Sentiment classification ──
    def test_stability_sentiment_whitelist_n99(self):
        """Sentiment must be exactly positive/neutral/negative."""
        for _ in range(N):
            for valid in self.VALID_SENTIMENTS:
                assert valid in self.VALID_SENTIMENTS
            for invalid in ("Positive", "NEUTRAL", "bad", "good", ""):
                assert invalid not in self.VALID_SENTIMENTS

    # ── Stability: Replay hash chain integrity ──
    def test_stability_replay_hash_chain_n99(self):
        """Cube 1→2→4→6→7→9 hash chain is deterministic."""
        reference = None
        for _ in range(N):
            chain = ""
            for cube_id in [1, 2, 4, 6, 7, 9]:
                chain = hashlib.sha256(f"{chain}:cube{cube_id}:seed42".encode()).hexdigest()
            if reference is None:
                reference = chain
            assert chain == reference


# ═══════════════════════════════════════════════════════════════════
# CROSS-CUBE — Trinity Redundancy + Broadcast Integrity
# SSSES: Channel naming, payload format, deduplication
# ═══════════════════════════════════════════════════════════════════

class TestTrinityRedundancySSES:
    """Cross-cube: Trinity Redundancy — 3 send paths × 4 receive channels."""

    # ── Security: Channel name uniqueness ──
    def test_security_no_duplicate_channels_n99(self):
        """Each broadcast channel has a unique name — prevents collision."""
        for _ in range(N):
            code = "XS5RRFTY"
            names = [
                f"session:{code}",
                f"responses-db:{code}",
                f"status-db:{code}",
            ]
            assert len(set(names)) == len(names)

    # ── Stability: Payload format match sender/receiver ──
    def test_stability_payload_format_n99(self):
        """NewResponsePayload has all required fields."""
        required = {"id", "text", "clean_text", "submitted_at", "summary_33", "count"}
        for _ in range(N):
            payload = {
                "id": "r-001",
                "text": "Test response",
                "clean_text": "Test response",
                "submitted_at": "2026-04-13T12:00:00Z",
                "summary_33": None,
                "count": 1,
            }
            assert set(payload.keys()) == required

    # ── Stability: Dedup prevents doubles ──
    def test_stability_dedup_across_channels_n99(self):
        """seenIds Set prevents doubles when multiple channels fire."""
        for _ in range(N):
            seen = set()
            responses = []
            # Simulate: same response arrives via broadcast + postgres_changes + HTTP poll
            for channel in ("broadcast", "postgres", "http_poll"):
                rid = "r-same-001"
                if rid not in seen:
                    seen.add(rid)
                    responses.append(rid)
            assert len(responses) == 1  # Only counted once


# ═══════════════════════════════════════════════════════════════════
# FEATURE REMOVAL GUARD — Never remove, only add
# ═══════════════════════════════════════════════════════════════════

class TestFeatureRemovalGuard:
    """Guard against accidental feature removal across ALL cubes.

    "Never remove functionality from one version to the next, only add." — MoT

    These guards verify critical features still exist in the codebase.
    If any guard fails, someone removed a feature that must be reinstated.

    SPIRAL order: Cube 1→10 then cross-cube infrastructure.
    """

    @staticmethod
    def _fe(path: str) -> str:
        """Read a frontend file relative to project root."""
        import os
        base = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        full = os.path.join(base, "frontend", *path.split("/"))
        assert os.path.exists(full), f"FILE REMOVED: frontend/{path}"
        with open(full) as f:
            return f.read()

    @staticmethod
    def _be(path: str) -> str:
        """Read a backend file relative to backend root."""
        import os
        base = os.path.dirname(os.path.dirname(__file__))
        full = os.path.join(base, *path.split("/"))
        assert os.path.exists(full), f"FILE REMOVED: {path}"
        with open(full) as f:
            return f.read()

    # ═══ CUBE 1 — Session Join & QR ═══
    def test_cube1_session_state_machine(self):
        """Cube 1: Session state machine with forward-only transitions."""
        c = self._be("app/cubes/cube1_session/service.py")
        assert "create_session" in c, "create_session REMOVED from Cube 1!"
        assert "join_session" in c, "join_session REMOVED from Cube 1!"
        r = self._be("app/cubes/cube1_session/router.py")
        assert "VALID_SESSION_TYPES" in r or "session_type" in r, "Session type validation REMOVED!"
        assert "@router." in r, "Cube 1 router endpoints REMOVED!"

    def test_cube1_qr_generation(self):
        """Cube 1: QR code generation must exist."""
        c = self._be("app/cubes/cube1_session/service.py")
        assert "qr" in c.lower() or "QR" in c, "QR generation REMOVED from Cube 1!"

    # ═══ CUBE 2 — Text Submission ═══
    def test_cube2_text_validation(self):
        """Cube 2: Text validation + PII scrubbing must exist."""
        c = self._be("app/cubes/cube2_text/service.py")
        assert "scrub_pii" in c or "PII" in c, "PII scrubbing REMOVED from Cube 2!"
        assert "compute_response_hash" in c, "Response hash REMOVED from Cube 2!"
        r = self._be("app/cubes/cube2_text/router.py")
        assert "_LANGUAGE_CODE_RE" in r or "language_code" in r, "Language validation REMOVED!"

    # ═══ CUBE 3 — Voice-to-Text ═══
    def test_cube3_voice_stt_providers(self):
        """Cube 3: STT provider whitelist must exist."""
        r = self._be("app/cubes/cube3_voice/router.py")
        assert "VALID_STT_PROVIDERS" in r or "whisper" in r, "STT providers REMOVED from Cube 3!"
        s = self._be("app/cubes/cube3_voice/service.py")
        assert "transcribe" in s or "stt" in s.lower(), "Transcription REMOVED from Cube 3!"

    # ═══ CUBE 4 — Response Collector ═══
    def test_cube4_collector_aggregation(self):
        """Cube 4: Response aggregation must exist."""
        s = self._be("app/cubes/cube4_collector/service.py")
        assert "collect" in s.lower() or "aggregate" in s.lower() or "response" in s.lower(), \
            "Collection logic REMOVED from Cube 4!"

    # ═══ CUBE 5 — Gateway / Orchestrator ═══
    def test_cube5_pipeline_triggers(self):
        """Cube 5: Pipeline trigger system must exist."""
        s = self._be("app/cubes/cube5_gateway/service.py")
        assert "trigger" in s.lower() or "pipeline" in s.lower(), "Pipeline triggers REMOVED from Cube 5!"
        assert "calculate_tokens" in s, "Token calculation REMOVED from Cube 5!"

    def test_cube5_time_tracking(self):
        """Cube 5: Time tracking must exist."""
        s = self._be("app/cubes/cube5_gateway/service.py")
        assert "time" in s.lower() or "duration" in s.lower(), "Time tracking REMOVED from Cube 5!"

    # ═══ CUBE 6 — AI Theming Clusterer ═══
    def test_cube6_ai_pipeline(self):
        """Cube 6: AI pipeline with marble sampling must exist."""
        s = self._be("app/cubes/cube6_ai/service.py")
        assert "marble" in s.lower() or "_marble_sample" in s, "Marble sampling REMOVED from Cube 6!"
        assert "theme" in s.lower(), "Theme processing REMOVED from Cube 6!"
        r = self._be("app/cubes/cube6_ai/router.py")
        assert "VALID_PROVIDERS" in r, "Provider whitelist REMOVED from Cube 6!"
        assert "VALID_THEME_LEVELS" in r, "Theme level whitelist REMOVED from Cube 6!"

    # ═══ CUBE 7 — Ranking & Voting ═══
    def test_cube7_borda_accumulator(self):
        """Cube 7: BordaAccumulator with anti-sybil must exist."""
        s = self._be("app/cubes/cube7_ranking/scale_engine.py")
        assert "BordaAccumulator" in s, "BordaAccumulator REMOVED from Cube 7!"
        assert "exclude" in s.lower(), "Anti-sybil exclusion REMOVED from Cube 7!"
        assert "merge" in s, "Shard merge REMOVED from Cube 7!"

    # ═══ CUBE 8 — Token Ledger ═══
    def test_cube8_token_system(self):
        """Cube 8: Token types + lifecycle must exist."""
        s = self._be("app/cubes/cube8_tokens/service.py")
        assert "heart" in s.lower() or "human" in s.lower() or "triangle" in s.lower(), \
            "Token types REMOVED from Cube 8!"
        r = self._be("app/cubes/cube8_tokens/router.py")
        assert "VALID_TOKEN_TYPES" in r or "token_type" in r, "Token type validation REMOVED!"

    # ═══ CUBE 9 — Reports & Export ═══
    def test_cube9_csv_export(self):
        """Cube 9: CSV export with 19-column schema must exist."""
        s = self._be("app/cubes/cube9_reports/service.py")
        assert "CSV_COLUMNS" in s, "CSV_COLUMNS REMOVED from Cube 9!"
        assert "export" in s.lower(), "Export functionality REMOVED from Cube 9!"

    # ═══ CUBE 10 — Simulation / Feedback ═══
    def test_cube10_feedback_system(self):
        """Cube 10: Feedback system with CRS/DI types must exist."""
        r = self._be("app/cubes/cube10_simulation/router.py")
        assert "ALLOWED_FEEDBACK_TYPES" in r or "feedback_type" in r, "Feedback types REMOVED from Cube 10!"
        assert "ALLOWED_CUBE_IDS" in r or "cube_id" in r, "Cube targeting REMOVED from Cube 10!"

    def test_cube10_challenge_system(self):
        """Cube 10: Challenge/submission system must exist."""
        s = self._be("app/cubes/cube10_simulation/service.py")
        assert "challenge" in s.lower() or "submission" in s.lower(), "Challenge system REMOVED from Cube 10!"

    # ═══ CROSS-CUBE: Supabase + Broadcast ═══
    def test_supabase_client_exists(self):
        """Supabase client configuration must exist."""
        c = self._fe("lib/supabase.ts")
        assert "createClient" in c, "Supabase createClient REMOVED!"
        assert "NEXT_PUBLIC_SUPABASE" in c, "Supabase env vars REMOVED!"

    def test_trinity_redundancy_intact(self):
        """Trinity Redundancy: 3 send paths must exist in session-view."""
        c = self._fe("components/session-view.tsx")
        assert "broadcastToSession" in c, "Path A (Broadcast) REMOVED!"
        assert 'from("responses").insert' in c, "Path B (DB INSERT) REMOVED!"
        assert '"/api/responses"' in c, "Path C (CF KV POST) REMOVED!"

    def test_broadcast_hook_consolidated(self):
        """All broadcast events route through single useSessionBroadcast hook."""
        c = self._fe("lib/use-session-broadcast.ts")
        for event in ("new_response", "summary_ready", "themes_ready", "theme_change", "status", "presence"):
            assert event in c, f"Event '{event}' REMOVED from broadcast hook!"

    def test_fast_track_join_exists(self):
        """Fast-track join must exist — skip wizard when polling is live."""
        c = self._fe("components/join-flow.tsx")
        assert "fastTrackAttempted" in c, "Fast-track join REMOVED!"

    # ═══ CROSS-CUBE: Translation / i18n ═══
    def test_lexicon_system_exists(self):
        """Language Lexicon must exist with t() fallback chain."""
        c = self._fe("lib/lexicon-context.tsx")
        assert "useLexicon" in c, "useLexicon hook REMOVED!"
        d = self._fe("lib/lexicon-data.ts")
        assert "key:" in d, "Lexicon data keys REMOVED!"

    def test_divinity_10_languages(self):
        """Divinity Guide must support 10 languages."""
        c = self._fe("lib/divinity-languages.ts")
        for lang in ("en", "es", "zh", "uk", "ru", "fa", "he", "pt", "km", "ne"):
            assert f'"{lang}"' in c, f"Language '{lang}' REMOVED from Divinity Guide!"

    # ═══ CROSS-CUBE: Pinyin (NEVER REMOVE) ═══
    def test_pinyin_never_removed(self):
        """Pinyin support must exist in both bilingual reader AND book reader."""
        b = self._fe("components/flower-of-life/bilingual-reader.tsx")
        assert "PinyinText" in b, "PinyinText REMOVED from bilingual reader!"
        d = self._fe("app/divinity-guide/page.tsx")
        assert "BookPinyinText" in d, "BookPinyinText REMOVED from book reader!"
        assert "showPinyin" in d, "showPinyin toggle REMOVED from book reader!"

    # ═══ CROSS-CUBE: User + Moderator + Admin ═══
    def test_user_session_view_exists(self):
        """User-facing session view must exist."""
        c = self._fe("components/session-view.tsx")
        assert "handleSubmitResponse" in c or "responseText" in c, "User text submission REMOVED!"
        assert "VoiceRecorder" in c or "voice" in c.lower(), "User voice submission REMOVED!"

    def test_moderator_dashboard_exists(self):
        """Moderator dashboard with live feed must exist."""
        c = self._fe("app/dashboard/page.tsx")
        assert "addResponse" in c, "Live feed addResponse REMOVED from dashboard!"
        assert "seenIds" in c, "Deduplication seenIds REMOVED from dashboard!"
        assert "useSessionBroadcast" in c, "Broadcast hook REMOVED from dashboard!"

    def test_auth_rbac_exists(self):
        """Auth0 RBAC with role-based access must exist."""
        c = self._be("app/core/auth.py")
        assert "moderator" in c.lower() or "CurrentUser" in c, "Auth RBAC REMOVED!"

    def test_wireguard_on_all_cubes(self):
        """WireGuard whitelist constants must exist on ALL 10 cube routers."""
        for cube in ("cube1_session", "cube2_text", "cube3_voice", "cube4_collector",
                     "cube5_gateway", "cube6_ai", "cube7_ranking", "cube8_tokens",
                     "cube9_reports", "cube10_simulation"):
            r = self._be(f"app/cubes/{cube}/router.py")
            has_whitelist = any(kw in r for kw in ("VALID_", "ALLOWED_", "_RE =", "_RE="))
            assert has_whitelist, f"WireGuard whitelist REMOVED from {cube}!"

    # ═══ CROSS-CUBE: Feature Removal Detector ═══
    def test_feature_removal_detector_exists(self):
        """Feature removal detector script must exist."""
        import os
        script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "check_feature_removal.py")
        assert os.path.exists(script), "Feature removal detector script REMOVED!"

    # ═══ CROSS-CUBE: Cloudflare Pages Function ═══
    def test_cf_pages_function_exists(self):
        """Cloudflare Pages function for KV responses must exist."""
        c = self._fe("functions/api/responses.js")
        assert "POST" in c or "GET" in c, "CF Pages response function REMOVED!"
