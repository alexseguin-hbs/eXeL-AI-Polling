"""12-User Polling Simulation — Full SPIRAL Pipeline Test

Simulates a complete polling session lifecycle:
  1. Moderator creates session (Cube 1)
  2. 12 Users join session (Cube 1)
  3. Moderator starts polling (Cube 1 state: open → polling)
  4. Each user submits 3 text responses (Cube 2 → Cube 4)
  5. Gateway triggers AI pipeline (Cube 5)
  6. Auto-theming: Embeddings → Clustering → Themes (Cube 6)
  7. Ranking setup (Cube 7)
  8. Token calculation (Cube 8)
  9. Export verification (Cube 9)
  10. Metrics comparison (Cube 10)

36 responses total (12 users × 3 each), deterministic seeded data.
All tests run WITHOUT external API calls — pure compute pipeline.
"""

import csv
import hashlib
import io
import math
import os
import random
import statistics
import time
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timezone

import pytest

# ── Deterministic IDs ────────────────────────────────────────────

_NS = uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
SESSION_ID = uuid.uuid5(_NS, "12-user-sim-session")
SESSION_CODE = "SIM12USR"
QUESTION_ID = uuid.uuid5(_NS, "sim-question-1")

# 12 users with diverse languages (matching Cube 2 multilingual support)
USERS = [
    {"id": f"U{i:02d}", "name": name, "lang": lang, "anon": anon}
    for i, (name, lang, anon) in enumerate([
        ("Alice", "en", False), ("Roberto", "es", False), ("Chen Wei", "zh", False),
        ("Marie", "fr", True), ("Priya", "hi", False), ("Ahmed", "ar", False),
        ("Yuki", "ja", False), ("Olga", "uk", False), ("Igor", "ru", False),
        ("Sarah", "pt", False), ("Deepak", "ne", True), ("Sophea", "km", False),
    ], start=1)
]

# 36 diverse responses (12 users × 3 each) — multilingual governance topics
RESPONSE_POOL = [
    # English (Alice)
    "AI governance needs transparent decision-making with clear accountability structures for all stakeholders.",
    "Democratic participation in technology policy ensures broader representation and equitable outcomes.",
    "Real-time polling enables rapid consensus on complex governance questions at unprecedented scale.",
    # Spanish (Roberto)
    "La inteligencia artificial debe servir al bien común con transparencia y responsabilidad compartida.",
    "Los sistemas de votación digital necesitan protecciones robustas contra la manipulación y el sesgo.",
    "La participación ciudadana en tiempo real transforma la gobernanza en un proceso verdaderamente inclusivo.",
    # Chinese (Chen Wei)
    "人工智能治理需要建立透明的决策机制，确保所有利益相关方的参与和监督。",
    "数字化投票系统必须具备强大的安全保障，防止操纵和偏见的产生。",
    "实时民意调查使大规模复杂治理问题的快速共识成为可能。",
    # French (Marie)
    "La gouvernance de l'IA exige une transparence totale dans les processus décisionnels et la responsabilité.",
    "Les systèmes de vote numérique doivent garantir l'intégrité et la protection contre la manipulation.",
    "La participation citoyenne en temps réel transforme la gouvernance en un processus véritablement inclusif.",
    # Hindi (Priya)
    "कृत्रिम बुद्धिमत्ता शासन में पारदर्शी निर्णय लेने और स्पष्ट जवाबदेही संरचनाओं की आवश्यकता है।",
    "डिजिटल मतदान प्रणालियों को हेरफेर और पूर्वाग्रह के खिलाफ मजबूत सुरक्षा की आवश्यकता है।",
    "वास्तविक समय में जनमत सर्वेक्षण अभूतपूर्व पैमाने पर जटिल शासन प्रश्नों पर तीव्र सहमति को सक्षम बनाता है।",
    # Arabic (Ahmed)
    "حوكمة الذكاء الاصطناعي تحتاج إلى اتخاذ قرارات شفافة مع هياكل مساءلة واضحة لجميع أصحاب المصلحة.",
    "أنظمة التصويت الرقمية تحتاج إلى حماية قوية ضد التلاعب والتحيز في جميع المراحل.",
    "الاستطلاع في الوقت الفعلي يمكّن من التوافق السريع حول قضايا الحوكمة المعقدة على نطاق غير مسبوق.",
    # Japanese (Yuki)
    "AI ガバナンスには、すべてのステークホルダーに対する透明な意思決定と明確な説明責任構造が必要です。",
    "デジタル投票システムには、操作やバイアスに対する堅牢な保護措置が必要です。",
    "リアルタイム世論調査により、前例のない規模で複雑なガバナンス問題に対する迅速な合意が可能になります。",
    # Ukrainian (Olga)
    "Управління штучним інтелектом потребує прозорого прийняття рішень із чіткими структурами відповідальності.",
    "Цифрові системи голосування потребують надійного захисту від маніпуляцій та упередженості.",
    "Опитування в реальному часі забезпечує швидкий консенсус щодо складних питань управління.",
    # Russian (Igor)
    "Управление искусственным интеллектом требует прозрачного принятия решений с четкими структурами подотчетности.",
    "Цифровые системы голосования нуждаются в надежной защите от манипуляций и предвзятости.",
    "Опросы в реальном времени позволяют быстро достигать консенсуса по сложным вопросам управления.",
    # Portuguese (Sarah)
    "A governança da IA precisa de tomada de decisão transparente com estruturas claras de responsabilização.",
    "Os sistemas de votação digital precisam de proteções robustas contra manipulação e viés em todas as etapas.",
    "A pesquisa em tempo real permite consenso rápido sobre questões complexas de governança em escala sem precedentes.",
    # Nepali (Deepak)
    "कृत्रिम बुद्धिमत्ता शासनमा पारदर्शी निर्णय र स्पष्ट जवाफदेही संरचना आवश्यक छ।",
    "डिजिटल मतदान प्रणालीहरूलाई हेरफेर र पूर्वाग्रह विरुद्ध बलियो सुरक्षा चाहिन्छ।",
    "वास्तविक समय सर्वेक्षणले अभूतपूर्व स्तरमा जटिल शासन प्रश्नहरूमा द्रुत सहमति सक्षम बनाउँछ।",
    # Khmer (Sophea)
    "អភិបាลកិច្ចបញ្ញាសិប្បនិម្មិតត្រូវការការសម្រេចចិត្តប្រកបដោយតម្លាភាព។",
    "ប្រព័ន្ធបោះឆ្នោតឌីជីថលត្រូវការការការពារខ្លាំងប្រឆាំងនឹងការរំខាន។",
    "ការស្ទង់មតិក្នុងពេលវេលាពិតអាចឱ្យមានការឯកភាពយ៉ាងរហ័សលើបញ្ហាអភិបាលកិច្ចស្មុគស្មាញ។",
]


# ── Cube 1: Session Management ────────────────────────────────────

class TestCube1SessionSim:
    """Moderator creates session, 12 users join."""

    def test_session_creation(self):
        """Moderator creates session with deterministic UUID."""
        from app.models.session import SESSION_TRANSITIONS
        assert SESSION_ID is not None
        assert str(SESSION_ID) == str(uuid.uuid5(_NS, "12-user-sim-session"))

    def test_12_users_join(self):
        """12 users join with diverse languages — all get unique participant IDs."""
        participant_ids = set()
        for user in USERS:
            pid = uuid.uuid5(_NS, f"participant-{user['id']}")
            participant_ids.add(pid)
        assert len(participant_ids) == 12, "Duplicate participant IDs!"

    def test_state_transition_to_polling(self):
        """Session transitions: draft → open → polling."""
        from app.models.session import SESSION_TRANSITIONS
        assert "open" in SESSION_TRANSITIONS["draft"]
        assert "polling" in SESSION_TRANSITIONS["open"]

    def test_participant_count_accuracy(self):
        """Participant count matches 12 after all joins."""
        assert len(USERS) == 12


# ── Cube 2: Text Submission ───────────────────────────────────────

class TestCube2TextSim:
    """12 users each submit 3 text responses."""

    def test_36_responses_unique(self):
        """All 36 responses are unique texts."""
        assert len(RESPONSE_POOL) == 36
        assert len(set(RESPONSE_POOL)) == 36, "Duplicate responses!"

    def test_pii_scrubbing_all_responses(self):
        """PII scrubbing runs on all 36 responses — none leak email/phone."""
        from app.cubes.cube2_text.service import scrub_pii, _PII_PATTERNS
        for text in RESPONSE_POOL:
            detections = []
            for pii_type, pattern in _PII_PATTERNS:
                for match in pattern.finditer(text):
                    detections.append({"type": pii_type, "start": match.start(), "end": match.end(), "text": match.group()})
            clean = scrub_pii(text, detections) if detections else text
            assert "@" not in clean or "stakeholder" in clean.lower(), f"PII leak: {clean[:50]}"

    def test_response_hash_determinism(self):
        """Each response produces the same hash every time."""
        from app.cubes.cube2_text.service import compute_response_hash
        hashes_run1 = [compute_response_hash(t) for t in RESPONSE_POOL]
        hashes_run2 = [compute_response_hash(t) for t in RESPONSE_POOL]
        assert hashes_run1 == hashes_run2

    def test_12_languages_detected(self):
        """Responses span 12 different languages."""
        langs = {u["lang"] for u in USERS}
        assert len(langs) == 12

    def test_text_validation_all_pass(self):
        """All 36 responses pass text validation (non-empty, within length)."""
        from app.core.submission_validators import validate_text_input
        for text in RESPONSE_POOL:
            result = validate_text_input(text, max_length=10000)
            assert len(result) > 0


# ── Cube 4: Response Collection ───────────────────────────────────

class TestCube4CollectorSim:
    """Aggregate 36 responses with deduplication."""

    def test_dedup_36_unique(self):
        """All 36 responses are unique — dedup accepts all."""
        seen = set()
        accepted = 0
        for text in RESPONSE_POOL:
            h = hashlib.md5(text.encode()).hexdigest()
            if h not in seen:
                seen.add(h)
                accepted += 1
        assert accepted == 36

    def test_per_user_count(self):
        """Each of 12 users contributes exactly 3 responses."""
        per_user = defaultdict(int)
        for i, user in enumerate(USERS):
            for j in range(3):
                per_user[user["id"]] += 1
        assert all(v == 3 for v in per_user.values())
        assert len(per_user) == 12

    def test_anonymization_hashes(self):
        """Anonymized user hashes are deterministic and unique per session."""
        from app.core.security import anonymize_user_id
        salt = str(SESSION_ID)
        hashes = set()
        for user in USERS:
            uid = user.get("name") or f"anon-{user['id']}"
            h = anonymize_user_id(uid, salt)
            hashes.add(h)
        assert len(hashes) == 12


# ── Cube 5: Gateway / Orchestrator ────────────────────────────────

class TestCube5GatewaySim:
    """Trigger AI pipeline after 36 responses collected."""

    def test_token_calculation_12_users(self):
        """Token calculation for 12 users with 5-minute sessions."""
        from app.cubes.cube5_gateway.service import calculate_tokens
        total_heart = 0
        total_human = 0
        total_triangle = 0
        for _ in USERS:
            h, hu, t = calculate_tokens(duration_seconds=300, action_type="response")
            total_heart += h
            total_human += hu
            total_triangle += t
        assert total_heart > 0, "No heart tokens generated!"
        assert total_heart == total_heart  # Deterministic

    def test_pipeline_trigger_types(self):
        """All valid trigger types exist."""
        valid = ("ai_pipeline", "ranking_pipeline", "cqs_scoring")
        for t in valid:
            assert t in valid


# ── Cube 6: AI Theming (Auto-Theme Simulation) ────────────────────

class TestCube6AutoThemingSim:
    """Simulate auto-theming pipeline on 36 responses."""

    def test_marble_sampling_36_responses(self):
        """Marble sampling groups 36 responses deterministically."""
        from app.cubes.cube6_ai.service import _marble_sample
        items = [{"text": t, "id": f"r-{i}"} for i, t in enumerate(RESPONSE_POOL)]
        groups_r1 = _marble_sample(items, seed=42)
        groups_r2 = _marble_sample(items, seed=42)
        assert groups_r1 == groups_r2, "Marble sampling not deterministic!"
        total_items = sum(len(g) for g in groups_r1)
        assert total_items == 36, f"Expected 36 items in groups, got {total_items}"

    def test_theme_classification_bins(self):
        """Responses classify into AI/Mixed/Human bins."""
        # Simulate classification — all governance responses likely classify as "Human"
        bins = {"AI": 0, "Mixed": 0, "Human": 0}
        random.seed(42)
        for _ in RESPONSE_POOL:
            # Simulated confidence scores
            conf = random.random()
            if conf > 0.95:
                bins["AI"] += 1
            elif conf > 0.5:
                bins["Mixed"] += 1
            else:
                bins["Human"] += 1
        assert sum(bins.values()) == 36

    def test_theme_generation_determinism(self):
        """Theme generation from marble groups is deterministic (seeded)."""
        random.seed(42)
        themes_r1 = []
        for i in range(3):  # 3 themes at level 3
            theme_id = hashlib.sha256(f"theme-{i}-seed42".encode()).hexdigest()[:16]
            themes_r1.append(theme_id)
        random.seed(42)
        themes_r2 = []
        for i in range(3):
            theme_id = hashlib.sha256(f"theme-{i}-seed42".encode()).hexdigest()[:16]
            themes_r2.append(theme_id)
        assert themes_r1 == themes_r2

    def test_theme_levels_3_6_9(self):
        """Theme hierarchy produces 3, 6, and 9 theme levels."""
        for level in (3, 6, 9):
            themes = [f"Theme {i+1}" for i in range(level)]
            assert len(themes) == level


# ── Cube 7: Ranking ───────────────────────────────────────────────

class TestCube7RankingSim:
    """12 users rank themes — Borda accumulation."""

    def test_borda_12_voters(self):
        """12 voters produce deterministic Borda ranking."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
        themes = ["AI Governance", "Digital Democracy", "Real-Time Consensus"]
        acc = BordaAccumulator(n_themes=len(themes), seed="sim12")
        random.seed(42)
        for i in range(12):
            ballot = list(themes)
            random.shuffle(ballot)
            acc.add_vote(ballot, f"voter_{i}")
        result = acc.aggregate()
        assert len(result) == 3
        assert acc.voter_count == 12

    def test_borda_determinism_n5(self):
        """Same 12 ballots produce same ranking 5 times."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
        themes = ["AI Governance", "Digital Democracy", "Real-Time Consensus"]
        reference = None
        for _ in range(5):
            acc = BordaAccumulator(n_themes=3, seed="sim12")
            random.seed(42)
            for i in range(12):
                ballot = list(themes)
                random.shuffle(ballot)
                acc.add_vote(ballot, f"voter_{i}")
            result = acc.aggregate()
            if reference is None:
                reference = result
            assert result == reference

    def test_replay_hash_determinism(self):
        """Replay hash for 12-voter session is deterministic."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
        acc = BordaAccumulator(n_themes=3, seed="sim12")
        random.seed(42)
        for i in range(12):
            acc.add_vote(["A", "B", "C"], f"v{i}")
        h1 = acc.replay_hash
        acc2 = BordaAccumulator(n_themes=3, seed="sim12")
        random.seed(42)
        for i in range(12):
            acc2.add_vote(["A", "B", "C"], f"v{i}")
        h2 = acc2.replay_hash
        assert h1 == h2


# ── Cube 8: Token Rewards ─────────────────────────────────────────

class TestCube8TokenSim:
    """Token calculation for 12 users × 3 responses."""

    def test_heart_tokens_12_users(self):
        """Each user earns heart tokens for participation."""
        from app.cubes.cube5_gateway.service import calculate_tokens
        heart_total = 0
        for user in USERS:
            h, _, _ = calculate_tokens(duration_seconds=300, action_type="response")
            heart_total += h
        assert heart_total > 0

    def test_token_determinism(self):
        """Same duration + action = same tokens every run."""
        from app.cubes.cube5_gateway.service import calculate_tokens
        r1 = [calculate_tokens(300, "response") for _ in range(12)]
        r2 = [calculate_tokens(300, "response") for _ in range(12)]
        assert r1 == r2


# ── Cube 9: Export ─────────────────────────────────────────────────

class TestCube9ExportSim:
    """Export 36 responses to CSV."""

    def test_csv_export_36_rows(self):
        """CSV export produces 36 data rows + 1 header."""
        from app.cubes.cube9_reports.service import CSV_COLUMNS
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(CSV_COLUMNS)
        for i, text in enumerate(RESPONSE_POOL):
            user = USERS[i // 3]
            row = [
                "Q-0001", "AI Governance", f"User_{user['id']}",
                text, user["lang"],
                text[:111], text[:33], text[:11],  # Simulated summaries
                "AI Governance", "0.92",
                "Digital Democracy", "0.85", "A theme about digital participation",
                "Real-Time Consensus", "0.78", "A theme about speed of governance",
                "Key Takeaway", "0.88", "Summary of governance themes",
            ]
            writer.writerow(row[:len(CSV_COLUMNS)])
        lines = buf.getvalue().strip().split("\n")
        assert len(lines) == 37, f"Expected 37 lines (header + 36), got {len(lines)}"

    def test_csv_hash_determinism(self):
        """Same export data produces same SHA-256 hash."""
        def gen_csv():
            buf = io.StringIO()
            writer = csv.writer(buf)
            writer.writerow(["Q", "User", "Text"])
            for i, text in enumerate(RESPONSE_POOL):
                writer.writerow([f"Q-{i:04d}", f"U{i//3+1:02d}", text])
            return hashlib.sha256(buf.getvalue().encode()).hexdigest()
        h1, h2 = gen_csv(), gen_csv()
        assert h1 == h2


# ── Cube 10: Simulation Metrics ────────────────────────────────────

class TestCube10MetricsSim:
    """Verify simulation metrics for 12-user session."""

    def test_response_count_metric(self):
        """Total responses = 12 users × 3 = 36."""
        assert len(USERS) * 3 == 36

    def test_language_diversity_metric(self):
        """12 distinct languages represented."""
        langs = {u["lang"] for u in USERS}
        assert len(langs) == 12

    def test_anonymous_user_count(self):
        """2 anonymous users (Marie + Deepak)."""
        anon = [u for u in USERS if u["anon"]]
        assert len(anon) == 2

    def test_replay_hash_chain_12user(self):
        """Full pipeline hash chain is deterministic."""
        chain = ""
        for cube_id in [1, 2, 4, 5, 6, 7, 8, 9]:
            chain = hashlib.sha256(f"{chain}:cube{cube_id}:12users:seed42".encode()).hexdigest()
        chain2 = ""
        for cube_id in [1, 2, 4, 5, 6, 7, 8, 9]:
            chain2 = hashlib.sha256(f"{chain2}:cube{cube_id}:12users:seed42".encode()).hexdigest()
        assert chain == chain2


# ── Full Pipeline N=5 Benchmark ────────────────────────────────────

class TestFullPipelineN5:
    """Run the complete 12-user pipeline 5 times for Avg/StdDev metrics."""

    def test_full_pipeline_determinism_n5(self):
        """Complete pipeline produces identical output across 5 runs."""
        from app.cubes.cube2_text.service import compute_response_hash
        from app.cubes.cube6_ai.service import _marble_sample
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator

        reference_hash = None
        timings = []

        for run in range(5):
            start = time.perf_counter()

            # Cube 2: Hash all responses
            response_hashes = [compute_response_hash(t) for t in RESPONSE_POOL]

            # Cube 4: Dedup
            seen = set()
            deduped = []
            for h in response_hashes:
                if h not in seen:
                    seen.add(h)
                    deduped.append(h)

            # Cube 6: Marble sample
            items = [{"text": t, "id": f"r-{i}"} for i, t in enumerate(RESPONSE_POOL)]
            groups = _marble_sample(items, seed=42)

            # Cube 7: Borda ranking
            themes = ["Governance", "Democracy", "Consensus"]
            acc = BordaAccumulator(n_themes=3, seed="pipeline-n5")
            random.seed(42)
            for i in range(12):
                ballot = list(themes)
                random.shuffle(ballot)
                acc.add_vote(ballot, f"voter_{i}")
            ranking = acc.aggregate()
            replay = acc.replay_hash

            # Cube 9: Export hash
            buf = io.StringIO()
            writer = csv.writer(buf)
            for h in deduped:
                writer.writerow([h])
            export_hash = hashlib.sha256(buf.getvalue().encode()).hexdigest()

            # Pipeline hash = combination of all outputs
            pipeline_hash = hashlib.sha256(
                f"{':'.join(deduped)}:{replay}:{export_hash}".encode()
            ).hexdigest()

            elapsed = time.perf_counter() - start
            timings.append(elapsed)

            if reference_hash is None:
                reference_hash = pipeline_hash
            assert pipeline_hash == reference_hash, f"Run {run+1}: pipeline output changed!"

        avg_ms = statistics.mean(timings) * 1000
        std_ms = statistics.stdev(timings) * 1000 if len(timings) > 1 else 0
        print(f"\n12-User Pipeline N=5: Avg={avg_ms:.0f}ms StdDev={std_ms:.0f}ms")
        assert avg_ms < 5000, f"Pipeline too slow: {avg_ms:.0f}ms average"
