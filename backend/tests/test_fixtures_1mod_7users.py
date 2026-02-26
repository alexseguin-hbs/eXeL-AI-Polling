"""Standard Test Fixtures: 1 Moderator + 7 Users

Reiterative test data for all cubes. This single file defines every
default input and expected output for a complete session lifecycle:

  Moderator (M1) creates session → 7 Users (U1–U7) join → submit text
  responses → AI themes → rank → tokens → report

Each cube section documents:
  INPUTS  — what that cube receives
  OUTPUTS — what that cube produces (expected values for assertions)

Usage:
  from tests.test_fixtures_1mod_7users import (
      MODERATOR, USERS, SESSION_CONFIG, CUBE1_INPUTS, CUBE1_OUTPUTS, ...
  )

All IDs are deterministic UUIDs (UUID5 from names) for reproducible tests.
"""

import uuid

# ---------------------------------------------------------------------------
# Deterministic IDs (UUID5 seeded — same every run)
# ---------------------------------------------------------------------------

_NS = uuid.UUID("12345678-1234-5678-1234-567812345678")

SESSION_ID = uuid.uuid5(_NS, "test-session-2026")
QUESTION_1_ID = uuid.uuid5(_NS, "question-1")
QUESTION_2_ID = uuid.uuid5(_NS, "question-2")
QUESTION_3_ID = uuid.uuid5(_NS, "question-3")

MOD_PARTICIPANT_ID = uuid.uuid5(_NS, "mod-participant")
USER_PARTICIPANT_IDS = [uuid.uuid5(_NS, f"user-{i}-participant") for i in range(1, 8)]

RESPONSE_IDS = {
    f"U{i}": uuid.uuid5(_NS, f"response-user-{i}") for i in range(1, 8)
}


# ---------------------------------------------------------------------------
# Moderator (1)
# ---------------------------------------------------------------------------

MODERATOR = {
    "user_id": "auth0|mod_001",
    "email": "moderator@test.com",
    "display_name": "Session Moderator",
    "role": "moderator",
    "permissions": ["create:session", "manage:session"],
    "language_code": "en",
    "theme_id": "exel-cyan",
}


# ---------------------------------------------------------------------------
# Users (7) — diverse languages, anonymity modes, opt-in choices
# ---------------------------------------------------------------------------

USERS = [
    {
        "id": "U1",
        "user_id": "auth0|user_001",
        "email": "alice@test.com",
        "display_name": "Alice",
        "language_code": "en",
        "results_opt_in": True,
        "join_anonymous": False,
    },
    {
        "id": "U2",
        "user_id": "auth0|user_002",
        "email": "bob@test.com",
        "display_name": "Bob",
        "language_code": "es",
        "results_opt_in": True,
        "join_anonymous": False,
    },
    {
        "id": "U3",
        "user_id": "auth0|user_003",
        "email": "chen@test.com",
        "display_name": "Chen Wei",
        "language_code": "zh",
        "results_opt_in": False,
        "join_anonymous": False,
    },
    {
        "id": "U4",
        "user_id": None,  # Anonymous user
        "email": None,
        "display_name": None,
        "language_code": "fr",
        "results_opt_in": False,
        "join_anonymous": True,
    },
    {
        "id": "U5",
        "user_id": "auth0|user_005",
        "email": "priya@test.com",
        "display_name": "Priya",
        "language_code": "hi",
        "results_opt_in": True,
        "join_anonymous": False,
    },
    {
        "id": "U6",
        "user_id": "auth0|user_006",
        "email": "ahmed@test.com",
        "display_name": "Ahmed",
        "language_code": "ar",
        "results_opt_in": True,
        "join_anonymous": False,
    },
    {
        "id": "U7",
        "user_id": "auth0|user_007",
        "email": "yuki@test.com",
        "display_name": "Yuki",
        "language_code": "ja",
        "results_opt_in": False,
        "join_anonymous": False,
    },
]


# ---------------------------------------------------------------------------
# Session Config (Moderator creates this)
# ---------------------------------------------------------------------------

SESSION_CONFIG = {
    "title": "AI Governance — Standard Test Session",
    "description": "Reiterative test session for 1 Moderator + 7 Users across all cubes",
    "created_by": MODERATOR["user_id"],
    "anonymity_mode": "identified",
    "cycle_mode": "single",
    "max_cycles": 1,
    "ranking_mode": "auto",
    "language": "en",
    "max_response_length": 3333,
    "ai_provider": "openai",
    # Cube 1 extended fields
    "session_type": "polling",
    "polling_mode": "single_round",
    "pricing_tier": "free",
    "max_participants": 19,
    "fee_amount_cents": 0,
    "cost_splitting_enabled": False,
    "reward_enabled": True,
    "reward_amount_cents": 2500,  # $25 gamified reward
    "cqs_weights": {
        "insight": 20,
        "depth": 15,
        "future_impact": 25,
        "originality": 15,
        "actionability": 15,
        "relevance": 10,
    },
    "theme2_voting_level": "theme2_9",
    "live_feed_enabled": False,
    "theme_id": "exel-cyan",
    "custom_accent_color": None,
}

QUESTIONS = [
    {
        "id": QUESTION_1_ID,
        "text": "What are the biggest risks of deploying AI in public governance?",
        "order_index": 0,
    },
    {
        "id": QUESTION_2_ID,
        "text": "How should AI transparency be enforced for government use?",
        "order_index": 1,
    },
    {
        "id": QUESTION_3_ID,
        "text": "What safeguards would make you trust AI in decision-making?",
        "order_index": 2,
    },
]


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 1 — Session Join & QR
# ═══════════════════════════════════════════════════════════════════════════

CUBE1_INPUTS = {
    "moderator": {
        "action": "create_session",
        "config": SESSION_CONFIG,
        "questions": QUESTIONS,
        "state_transitions": ["draft", "open", "polling", "ranking", "closed", "archived"],
    },
    "users": [
        {
            "id": u["id"],
            "action": "join_session",
            "display_name": u["display_name"],
            "language_code": u["language_code"],
            "results_opt_in": u["results_opt_in"],
            "join_anonymous": u["join_anonymous"],
        }
        for u in USERS
    ],
}

CUBE1_OUTPUTS = {
    "session": {
        "id": SESSION_ID,
        "short_code_length": 8,
        "status_after_create": "draft",
        "status_after_open": "open",
        "status_after_poll": "polling",
        "participant_count": 7,
        "qr_png_magic_bytes": b"\x89PNG",
    },
    "participants": [
        {
            "id": u["id"],
            "language_code": u["language_code"],
            "results_opt_in": u["results_opt_in"],
            "is_active": True,
            "payment_status": "unpaid",  # Free tier
            "has_anon_hash": u["join_anonymous"],
        }
        for u in USERS
    ],
    "tokens_on_login": {
        "heart": 1.0,   # ♡ 1 awarded on login
        "human": 0.0,   # 웃 $0 (hi_enabled=False)
        "unity": 5.0,   # ◬ 5x ♡ multiplier
    },
}


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 2 — Text Submission Handler
# ═══════════════════════════════════════════════════════════════════════════

# Each user responds to Question 1
CUBE2_INPUTS = {
    "question_id": QUESTION_1_ID,
    "responses": [
        {
            "id": "U1",
            "participant_id": USER_PARTICIPANT_IDS[0],
            "raw_text": "The biggest risk is lack of accountability. When an AI system makes a wrong decision in governance, who is responsible? We need clear chains of human oversight.",
            "language_code": "en",
        },
        {
            "id": "U2",
            "participant_id": USER_PARTICIPANT_IDS[1],
            "raw_text": "El mayor riesgo es la falta de transparencia. Los ciudadanos deben poder entender cómo se toman las decisiones que afectan sus vidas.",
            "language_code": "es",
        },
        {
            "id": "U3",
            "participant_id": USER_PARTICIPANT_IDS[2],
            "raw_text": "最大的风险是算法偏见。如果训练数据包含历史偏见，AI系统会在治理中放大这些不公平。",
            "language_code": "zh",
        },
        {
            "id": "U4",
            "participant_id": USER_PARTICIPANT_IDS[3],
            "raw_text": "Le risque principal est la déshumanisation des services publics. Les décisions qui affectent les gens doivent être prises avec empathie, pas seulement par des algorithmes.",
            "language_code": "fr",
        },
        {
            "id": "U5",
            "participant_id": USER_PARTICIPANT_IDS[4],
            "raw_text": "Privacy is the biggest concern. Government AI systems will have access to vast amounts of citizen data. We need strong data protection laws before deploying any AI in governance.",
            "language_code": "hi",  # User chose Hindi but writes in English — valid
        },
        {
            "id": "U6",
            "participant_id": USER_PARTICIPANT_IDS[5],
            "raw_text": "أكبر مخاطر الذكاء الاصطناعي في الحوكمة هو فقدان السيادة البشرية. يجب أن يبقى البشر هم صانعو القرار النهائيون.",
            "language_code": "ar",
        },
        {
            "id": "U7",
            "participant_id": USER_PARTICIPANT_IDS[6],
            "raw_text": "AIの最大のリスクはセキュリティの脆弱性です。政府のAIシステムがハッキングされた場合、国家安全保障に重大な影響を与える可能性があります。",
            "language_code": "ja",
        },
    ],
    # PII test case — U1's second response (for PII scrubbing verification)
    "pii_test_response": {
        "participant_id": USER_PARTICIPANT_IDS[0],
        "raw_text": "Contact me at alice@test.com or call 555-123-4567 for details.",
        "language_code": "en",
    },
}

CUBE2_OUTPUTS = {
    "responses": [
        {
            "id": "U1",
            "has_response_hash": True,
            "hash_length": 64,  # SHA-256 hex
            "pii_detected": False,
            "profanity_detected": False,
            "mongo_stored": True,
            "postgres_stored": True,
        },
        {
            "id": "U2",
            "has_response_hash": True,
            "hash_length": 64,
            "pii_detected": False,
            "profanity_detected": False,
            "mongo_stored": True,
            "postgres_stored": True,
        },
        {
            "id": "U3",
            "has_response_hash": True,
            "hash_length": 64,
            "pii_detected": False,
            "profanity_detected": False,
            "mongo_stored": True,
            "postgres_stored": True,
        },
        {
            "id": "U4",
            "has_response_hash": True,
            "hash_length": 64,
            "pii_detected": False,
            "profanity_detected": False,
            "mongo_stored": True,
            "postgres_stored": True,
        },
        {
            "id": "U5",
            "has_response_hash": True,
            "hash_length": 64,
            "pii_detected": False,
            "profanity_detected": False,
            "mongo_stored": True,
            "postgres_stored": True,
        },
        {
            "id": "U6",
            "has_response_hash": True,
            "hash_length": 64,
            "pii_detected": False,
            "profanity_detected": False,
            "mongo_stored": True,
            "postgres_stored": True,
        },
        {
            "id": "U7",
            "has_response_hash": True,
            "hash_length": 64,
            "pii_detected": False,
            "profanity_detected": False,
            "mongo_stored": True,
            "postgres_stored": True,
        },
    ],
    "pii_test": {
        "pii_detected": True,
        "pii_types": ["EMAIL", "PHONE"],
        "scrubbed_contains": ["[EMAIL_REDACTED]", "[PHONE_REDACTED]"],
    },
    "tokens_per_submission": {
        "heart_min": 0.0,  # Depends on time tracking duration
        "unity_multiplier": 5,
    },
    "redis_event_channel": "session:{session_id}:responses",
}


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 3 — Voice-to-Text Engine (MVP2 — stub inputs for forward compat)
# ═══════════════════════════════════════════════════════════════════════════

CUBE3_INPUTS = {
    "audio_samples": [
        {
            "id": "U1",
            "participant_id": USER_PARTICIPANT_IDS[0],
            "audio_format": "webm",
            "duration_seconds": 12.5,
            "language_code": "en",
            "stt_provider": "openai",
        },
        {
            "id": "U2",
            "participant_id": USER_PARTICIPANT_IDS[1],
            "audio_format": "webm",
            "duration_seconds": 15.0,
            "language_code": "es",
            "stt_provider": "openai",
        },
    ],
}

CUBE3_OUTPUTS = {
    "transcriptions": [
        {
            "id": "U1",
            "transcript_not_empty": True,
            "confidence_min": 0.6,
            "language_code": "en",
            "forwarded_to_cube2": True,
        },
        {
            "id": "U2",
            "transcript_not_empty": True,
            "confidence_min": 0.6,
            "language_code": "es",
            "forwarded_to_cube2": True,
        },
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 4 — Response Collector (stub)
# ═══════════════════════════════════════════════════════════════════════════

CUBE4_INPUTS = {
    "source": "cube2",
    "total_responses": 7,
    "response_sources": {"text": 7, "voice": 0},
}

CUBE4_OUTPUTS = {
    "collected_count": 7,
    "mongo_docs_count": 7,
    "postgres_meta_count": 7,
    "presence_tracked": 7,
}


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 5 — User Input Gateway / Orchestrator
# ═══════════════════════════════════════════════════════════════════════════

CUBE5_INPUTS = {
    "time_tracking": [
        {
            "id": u["id"],
            "action_type": "responding",
            "duration_minutes": 2.0 + i * 0.5,  # U1=2min, U2=2.5min, ..., U7=5min
        }
        for i, u in enumerate(USERS)
    ],
    "login_entries": [
        {"id": u["id"], "action_type": "login"} for u in USERS
    ],
}

CUBE5_OUTPUTS = {
    "token_calculations": [
        {
            "id": u["id"],
            # ♡ = ceil(active_minutes), +1 for login
            "heart": 1 + int(2.0 + i * 0.5),  # U1=3, U2=3, U3=4, U4=4, U5=5, U6=5, U7=6
            "human": 0.0,  # hi_enabled=False
            # ◬ = ♡ * 5
            "unity": (1 + int(2.0 + i * 0.5)) * 5,
        }
        for i, u in enumerate(USERS)
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 6 — AI Theming Clusterer (stub — expected shape)
# ═══════════════════════════════════════════════════════════════════════════

CUBE6_INPUTS = {
    "responses_count": 7,
    "ai_provider": "openai",
    "embedding_model": "text-embedding-3-small",
    "cluster_seed": 42,
}

CUBE6_OUTPUTS = {
    "theme1_categories": ["Risk & Concerns", "Supporting Comments", "Neutral Comments"],
    "theme2_9_count": 9,
    "theme2_6_count": 6,
    "theme2_3_count": 3,
    "summaries_per_response": {
        "333_word_max": 333,
        "111_word_max": 111,
        "33_word_max": 33,
    },
    "confidence_threshold": 0.65,  # Below 65% → reclassify as Neutral
    "deterministic": True,  # Same input → same output (seeded)
}


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 7 — Prioritization & Voting (stub — expected shape)
# ═══════════════════════════════════════════════════════════════════════════

CUBE7_INPUTS = {
    "voting_level": "theme2_9",
    "rankings": [
        {
            "id": u["id"],
            # Each user ranks their top 3 theme2_9 clusters (1=highest)
            "ranked_themes": [
                {"theme_id": f"theme2_9_{(i + 0) % 9}", "rank": 1},
                {"theme_id": f"theme2_9_{(i + 1) % 9}", "rank": 2},
                {"theme_id": f"theme2_9_{(i + 2) % 9}", "rank": 3},
            ],
        }
        for i, u in enumerate(USERS)
    ],
}

CUBE7_OUTPUTS = {
    "aggregated_ranking_count": 9,
    "top_theme_has_highest_score": True,
    "governance_weight_applied": True,
    "quadratic_normalization": True,
}


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 8 — Token Reward Calculator (stub — expected shape)
# ═══════════════════════════════════════════════════════════════════════════

CUBE8_INPUTS = {
    "session_id": SESSION_ID,
    "users": [
        {
            "id": u["id"],
            "user_id": u["user_id"],
        }
        for u in USERS
    ],
}

CUBE8_OUTPUTS = {
    "ledger_entries_per_user": 2,  # 1 login + 1 responding
    "lifecycle_state": "pending",
    "reward_winner_count": 1,  # Exactly 1 CQS winner
    "reward_amount_cents": 2500,
    "total_heart_tokens": sum(
        1 + int(2.0 + i * 0.5) for i in range(7)
    ),  # Sum of all user ♡
}


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 9 — Reports, Export & Dashboards (stub — expected shape)
# ═══════════════════════════════════════════════════════════════════════════

CUBE9_INPUTS = {
    "session_id": SESSION_ID,
    "export_formats": ["csv", "pdf"],
    "results_recipients": [u["id"] for u in USERS if u["results_opt_in"]],
    # U1, U2, U5, U6 opted in
}

CUBE9_OUTPUTS = {
    "csv_columns": 15,  # Matches target output schema
    "csv_rows": 7,  # 1 per response
    "results_distributed_to": ["U1", "U2", "U5", "U6"],
    "results_excluded": ["U3", "U4", "U7"],  # Opted out
    "pixelated_token_generated": True,
}


# ═══════════════════════════════════════════════════════════════════════════
# CUBE 10 — Simulation Orchestrator (stub — expected shape)
# ═══════════════════════════════════════════════════════════════════════════

CUBE10_INPUTS = {
    "replay_session_id": SESSION_ID,
    "cube_under_test": "cube1_session",
    "replay_mode": "full",
}

CUBE10_OUTPUTS = {
    "replay_matches_production": True,
    "all_tests_pass": True,
    "metrics_not_degraded": True,
}


# ═══════════════════════════════════════════════════════════════════════════
# FRONTEND — Settings & Theme Fixtures
# ═══════════════════════════════════════════════════════════════════════════

FRONTEND_THEME_INPUTS = {
    "pre_auth_theme": "exel-cyan",
    "moderator_theme_selection": "sunset",
    "custom_accent_hex": "#FF6B35",
    "easter_egg_sequence": ["exel-cyan", "sunset", "violet"],
    "easter_egg_timeout_ms": 5000,
}

FRONTEND_THEME_OUTPUTS = {
    "pre_auth": {
        "navbar_exel_color": "hsl(var(--primary))",  # AI Cyan
        "badge_color": "#00D7E4",  # exel-cyan swatch
        "theme_grid_disabled": True,  # For polling users
        "theme_grid_opacity": 0.4,
        "theme_grid_clickable": True,  # Easter egg clicks pass through
    },
    "moderator_logged_in": {
        "theme_grid_disabled": False,
        "can_change_theme": True,
        "session_cascade": True,  # Theme applies to all participants
    },
    "after_logout": {
        "theme_resets_to": "exel-cyan",
        "session_theme_cleared": True,
        "custom_accent_cleared": True,
    },
    "easter_egg_unlocked": {
        "badge_blinks": True,
        "badge_clickable": True,
        "simulation_mode_available": True,
    },
}

FRONTEND_LANGUAGE_INPUTS = {
    "users": [
        {"id": u["id"], "language_code": u["language_code"]}
        for u in USERS
    ],
    "pinned_languages": ["en", "es"],
    "total_approved_languages": 33,
}

FRONTEND_LANGUAGE_OUTPUTS = {
    "dropdown_pinned_first": ["en", "es"],
    "locale_persisted_key": "exel-active-locale",
    "ui_switches_instantly": True,
    "settings_uses_same_lexicon": True,
}


# ═══════════════════════════════════════════════════════════════════════════
# SUMMARY — Quick Reference
# ═══════════════════════════════════════════════════════════════════════════

FIXTURE_SUMMARY = {
    "moderator_count": 1,
    "user_count": 7,
    "total_participants": 8,
    "languages_represented": ["en", "es", "zh", "fr", "hi", "ar", "ja"],
    "anonymous_users": ["U4"],
    "results_opted_in": ["U1", "U2", "U5", "U6"],
    "results_opted_out": ["U3", "U4", "U7"],
    "questions_count": 3,
    "cubes_covered": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "session_type": "polling",
    "pricing_tier": "free",
}
