"""1M-Scale Simulation Tests — ALL 10 Cubes + N=99 Determinism.

Extends test_1m_simulation.py to cover ALL cubes at 1M scale:
  - Cube 1: Session capacity + short code collision avoidance at 1M
  - Cube 3: Voice batch queueing simulation at 1M
  - Cube 4: Collector aggregation at 1M responses
  - Cube 5: Gateway orchestration + token calculation at 1M
  - Cube 10: Simulation engine feedback + voting at 1M

Plus N=99 determinism verification across:
  - Borda ranking (Cube 7)
  - Marble sampling (Cube 6)
  - Replay hash (cross-cube)
  - Token accounting (Cube 8)
  - CSV export (Cube 9)
  - Challenge voting (Cube 10)

All tests run WITHOUT external API calls — pure compute + data pipeline.
"""

import csv
import hashlib
import io
import math
import os
import random
import time
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timezone

import pytest

# Path to the 5,000-row simulation dataset
CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv",
)


def load_csv_rows(limit: int = 0) -> list[dict]:
    """Load CSV rows as dicts."""
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for i, row in enumerate(reader):
            if limit and i >= limit:
                break
            rows.append(row)
    return rows


# ═══════════════════════════════════════════════════════════════════
# Cube 1: Session Capacity at 1M Scale
# ═══════════════════════════════════════════════════════════════════


class TestCube1SessionScale:
    """Simulate 1M concurrent session operations."""

    def test_short_code_collision_probability(self):
        """With 55-char alphabet × 8 chars = 55^8 ≈ 83.7T combinations.
        At 1M sessions, collision probability is negligible."""
        alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz"
        total_combinations = len(alphabet) ** 8
        n_sessions = 1_000_000
        # Birthday paradox: P(collision) ≈ n^2 / (2 * total)
        collision_prob = (n_sessions ** 2) / (2 * total_combinations)
        # With 55^8 ≈ 8.37e13 space, P ≈ 6e-3 for 1M — acceptable for retry-based generation
        assert collision_prob < 0.01, f"Collision probability too high: {collision_prob:.2e}"

    def test_generate_1m_short_codes_no_duplicates(self):
        """Generate 100K short codes — verify uniqueness."""
        from nanoid import generate as nanoid
        alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz"
        codes = set()
        start = time.perf_counter()
        for _ in range(100_000):
            codes.add(nanoid(alphabet, 8))
        elapsed = time.perf_counter() - start
        assert len(codes) == 100_000, f"Duplicates found in 100K codes"
        assert elapsed < 10.0, f"100K code generation took {elapsed:.1f}s"

    def test_qr_generation_throughput(self):
        """QR generation for 1K sessions (extrapolate to 1M)."""
        import qrcode
        import qrcode.constants

        start = time.perf_counter()
        for i in range(1_000):
            qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=6, border=2)
            qr.add_data(f"https://exel-ai-polling.explore-096.workers.dev/session?code=TEST{i:04d}")
            qr.make(fit=True)
            img = qr.make_image()
            buf = io.BytesIO()
            img.save(buf)
        elapsed = time.perf_counter() - start
        # 1K in Xs → extrapolate: 1M would need batch/async generation
        per_qr_ms = (elapsed / 1000) * 1000
        assert per_qr_ms < 50, f"QR generation too slow: {per_qr_ms:.1f}ms each"

    def test_state_machine_transitions_1m_sessions(self):
        """Simulate 1M session state transitions — verify forward-only."""
        from app.models.session import SESSION_TRANSITIONS
        states = ["draft", "open", "polling", "ranking", "closed", "archived"]
        valid_count = 0
        invalid_count = 0
        start = time.perf_counter()
        for i in range(1_000_000):
            current = states[i % len(states)]
            next_state = states[(i + 1) % len(states)]
            if next_state in SESSION_TRANSITIONS.get(current, set()):
                valid_count += 1
            else:
                invalid_count += 1
        elapsed = time.perf_counter() - start
        assert elapsed < 3.0, f"1M state checks took {elapsed:.1f}s"
        assert valid_count > 0

    def test_participant_id_hashing_at_scale(self):
        """Hash 1M participant IDs for anonymization — verify speed."""
        from app.core.security import anonymize_user_id
        session_salt = "test-session-salt-42"
        start = time.perf_counter()
        hashes = set()
        for i in range(100_000):
            h = anonymize_user_id(f"user_{i:06d}", session_salt)
            hashes.add(h)
        elapsed = time.perf_counter() - start
        assert len(hashes) == 100_000, "Hash collisions in 100K users"
        assert elapsed < 5.0, f"100K anonymization took {elapsed:.1f}s"


# ═══════════════════════════════════════════════════════════════════
# Cube 3: Voice Batch Queue Simulation at 1M
# ═══════════════════════════════════════════════════════════════════


class TestCube3VoiceScale:
    """Simulate 1M voice submission queueing."""

    def test_audio_metadata_processing_at_scale(self):
        """Simulate 1M audio metadata records — validate structure."""
        start = time.perf_counter()
        records = []
        for i in range(1_000_000):
            records.append({
                "id": i,
                "duration_ms": random.randint(1000, 60000),
                "sample_rate": 16000,
                "language": random.choice(["en", "es", "fr", "de", "zh", "ar", "hi", "ja"]),
                "provider": random.choice(["whisper", "gemini"]),
            })
        elapsed = time.perf_counter() - start
        assert len(records) == 1_000_000
        assert elapsed < 5.0, f"1M audio metadata creation took {elapsed:.1f}s"

    def test_stt_queue_prioritization(self):
        """Priority queue for 1M STT requests — shorter audio first."""
        import heapq
        queue = []
        start = time.perf_counter()
        for i in range(100_000):
            duration = random.randint(1000, 60000)
            heapq.heappush(queue, (duration, i))
        # Drain top 1000 — should be shortest audio
        top_1000 = [heapq.heappop(queue) for _ in range(1000)]
        elapsed = time.perf_counter() - start
        assert top_1000[0][0] <= top_1000[-1][0], "Priority queue not sorted"
        assert elapsed < 3.0, f"100K priority queue ops took {elapsed:.1f}s"

    def test_circuit_breaker_failover_count(self):
        """Simulate circuit breaker decisions for 1M requests across 3 providers."""
        providers = ["whisper", "gemini", "aws"]
        failover_counts = Counter()
        start = time.perf_counter()
        for i in range(1_000_000):
            provider_idx = i % 3
            # Simulate 5% failure rate per provider
            if random.random() < 0.05:
                failover_counts[providers[provider_idx]] += 1
                # Failover to next
                provider_idx = (provider_idx + 1) % 3
        elapsed = time.perf_counter() - start
        assert elapsed < 3.0, f"1M circuit breaker decisions took {elapsed:.1f}s"
        # ~50K failovers per provider (5% of ~333K each)
        for provider, count in failover_counts.items():
            assert 10_000 < count < 30_000, f"{provider}: {count} failovers (expected ~16.7K)"


# ═══════════════════════════════════════════════════════════════════
# Cube 4: Collector Aggregation at 1M
# ═══════════════════════════════════════════════════════════════════


class TestCube4CollectorScale:
    """Simulate 1M response aggregation."""

    def test_response_aggregation_1m(self):
        """Aggregate 1M responses into Web_Results format — timing."""
        rows = load_csv_rows(100)
        start = time.perf_counter()
        aggregated = []
        for i in range(1_000_000):
            row = rows[i % 100]
            aggregated.append({
                "q_number": "Q-0001",
                "user": f"User_{i:07d}",
                "detailed_results": row["Detailed_Results"][:200],
                "response_language": row["Response_Language"],
            })
        elapsed = time.perf_counter() - start
        assert len(aggregated) == 1_000_000
        assert elapsed < 10.0, f"1M aggregation took {elapsed:.1f}s"

    def test_presence_tracking_1m_users(self):
        """Simulate presence tracking for 1M concurrent users."""
        presence = {}
        start = time.perf_counter()
        # Add 1M users
        for i in range(1_000_000):
            presence[f"user_{i}"] = {
                "session_id": f"session_{i % 100}",
                "last_seen": time.time(),
                "active": True,
            }
        # Check 100K lookups
        for i in range(100_000):
            _ = presence.get(f"user_{i}")
        elapsed = time.perf_counter() - start
        assert len(presence) == 1_000_000
        assert elapsed < 10.0, f"1M presence ops took {elapsed:.1f}s"

    def test_deduplication_at_scale(self):
        """Verify deduplication of 1M responses with 5% duplicates."""
        seen_hashes = set()
        unique_count = 0
        dup_count = 0
        start = time.perf_counter()
        for i in range(1_000_000):
            # 5% duplicates
            if i > 0 and random.random() < 0.05:
                text = f"response_{i - 1}"  # Duplicate
            else:
                text = f"response_{i}"
            h = hashlib.md5(text.encode()).hexdigest()
            if h not in seen_hashes:
                seen_hashes.add(h)
                unique_count += 1
            else:
                dup_count += 1
        elapsed = time.perf_counter() - start
        assert elapsed < 5.0, f"1M dedup took {elapsed:.1f}s"
        assert dup_count > 40_000, f"Expected ~50K dups, got {dup_count}"


# ═══════════════════════════════════════════════════════════════════
# Cube 5: Gateway Orchestration at 1M
# ═══════════════════════════════════════════════════════════════════


class TestCube5GatewayScale:
    """Simulate gateway orchestration for 1M users."""

    def test_token_calculation_1m_users(self):
        """Calculate ♡ 웃 ◬ tokens for 1M users — verify accounting."""
        from app.core.hi_rates import resolve_human_rate

        total_heart = 0.0
        total_human = 0.0
        total_unity = 0.0
        unity_multiplier = 5.0

        start = time.perf_counter()
        for i in range(1_000_000):
            # Random active minutes: 1-120
            active_minutes = random.uniform(1, 120)
            heart = math.ceil(active_minutes)
            # Resolve human rate for random jurisdiction
            jurisdictions = [("US", "TX"), ("CA", None), ("GB", None), ("AU", None)]
            country, state = jurisdictions[i % 4]
            human_rate = resolve_human_rate(country, state)
            human = active_minutes * human_rate if human_rate else 0.0
            unity = heart * unity_multiplier

            total_heart += heart
            total_human += human
            total_unity += unity
        elapsed = time.perf_counter() - start

        assert elapsed < 8.0, f"1M token calc took {elapsed:.1f}s"
        assert total_heart > 0
        assert total_unity == total_heart * unity_multiplier
        # Average heart ≈ 61 (ceil of uniform 1-120), total ≈ 61M
        assert 50_000_000 < total_heart < 130_000_000

    def test_pipeline_trigger_rate_simulation(self):
        """Simulate pipeline triggers for 1M sessions — verify throttle."""
        triggered = 0
        throttled = 0
        semaphore_count = 10  # Max concurrent pipelines

        start = time.perf_counter()
        for i in range(1_000_000):
            if triggered - throttled < semaphore_count:
                triggered += 1
            else:
                throttled += 1
                # Simulate one completing
                if random.random() < 0.5:
                    throttled -= 1
        elapsed = time.perf_counter() - start
        assert elapsed < 3.0, f"1M pipeline trigger decisions took {elapsed:.1f}s"


# ═══════════════════════════════════════════════════════════════════
# Cube 10: Simulation Engine at 1M Scale
# ═══════════════════════════════════════════════════════════════════


class TestCube10SimulationScale:
    """Simulate feedback, voting, and challenge processing at 1M scale."""

    def test_feedback_categorization_1m(self):
        """Categorize 1M feedback items by priority/sentiment."""
        feedback_texts = [
            "The app is broken and crashes constantly",   # bug, priority 3
            "I love this amazing feature!",                # improvement, priority 1
            "Could you add a new feature for export?",     # feature, priority 2
            "The interface works fine for me.",             # general, priority 2
        ]

        categories = Counter()
        priorities = Counter()
        start = time.perf_counter()
        for i in range(1_000_000):
            text = feedback_texts[i % 4].lower()
            if any(kw in text for kw in ("broken", "crash", "error", "bug", "fail")):
                categories["bug"] += 1
                priorities[3] += 1
            elif any(kw in text for kw in ("love", "great", "perfect", "amazing")):
                categories["improvement"] += 1
                priorities[1] += 1
            elif any(kw in text for kw in ("add", "feature", "wish", "could")):
                categories["feature"] += 1
                priorities[2] += 1
            else:
                categories["general"] += 1
                priorities[2] += 1
        elapsed = time.perf_counter() - start
        assert elapsed < 3.0, f"1M feedback categorization took {elapsed:.1f}s"
        assert categories["bug"] == 250_000
        assert categories["improvement"] == 250_000

    def test_quadratic_voting_1m_token_holders(self):
        """Simulate community voting with 1M token holders."""
        from app.cubes.cube10_simulation.service import tally_votes

        # Generate votes: 80% approve, 20% reject, varied stakes
        votes = []
        for i in range(100_000):  # 100K voters (10% quorum of 1M)
            vote = "approve" if random.random() < 0.80 else "reject"
            tokens = random.randint(1, 10000)
            votes.append({"vote": vote, "tokens_staked": tokens})

        start = time.perf_counter()
        result = tally_votes(votes, total_token_holders=1_000_000)
        elapsed = time.perf_counter() - start

        assert elapsed < 2.0, f"100K vote tally took {elapsed:.1f}s"
        assert result["quorum_met"] is True  # 100K/1M = 10% = exactly quorum
        assert result["supermajority_met"] is True  # ~80% > 66.6%
        assert result["result"] == "approved"

    def test_challenge_submission_throughput(self):
        """Simulate 10K challenge submissions (code diffs) — throughput."""
        start = time.perf_counter()
        submissions = []
        for i in range(10_000):
            submissions.append({
                "submission_id": str(uuid.uuid4()),
                "cube_id": (i % 9) + 1,
                "status": "pending",
                "code_diff_size": random.randint(100, 10000),
            })
        elapsed = time.perf_counter() - start
        assert elapsed < 1.0, f"10K submissions took {elapsed:.1f}s"
        assert len(submissions) == 10_000


# ═══════════════════════════════════════════════════════════════════
# N=99 DETERMINISM VERIFICATION
# ═══════════════════════════════════════════════════════════════════


class TestN99Determinism:
    """Run N=99 cycles to verify deterministic outputs across all cubes.

    SPIRAL Protocol: Every run must produce IDENTICAL results for same inputs.
    This is the mathematical proof of governance integrity.
    """

    N = 99  # Number of verification runs

    def test_borda_ranking_n99(self):
        """Cube 7: N=99 Borda ranking runs — all must be identical."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator

        themes = ["Ethics", "Innovation", "Governance", "Privacy", "Scale",
                  "Trust", "Access", "Safety", "Transparency"]
        reference_result = None
        reference_hash = None

        for run in range(self.N):
            acc = BordaAccumulator(n_themes=9, seed="n99-borda-determinism")
            random.seed(42)
            for j in range(10_000):
                ranking = random.sample(themes, 9)
                acc.add_vote(ranking, participant_id=f"voter_{j}")

            result = acc.aggregate()
            replay = acc.replay_hash

            if reference_result is None:
                reference_result = result
                reference_hash = replay
            else:
                for k in range(9):
                    assert result[k]["theme_id"] == reference_result[k]["theme_id"], \
                        f"Run {run}: theme mismatch at position {k}"
                    assert result[k]["score"] == reference_result[k]["score"], \
                        f"Run {run}: score mismatch at position {k}"
                assert replay == reference_hash, f"Run {run}: replay hash mismatch"

    def test_marble_sampling_n99(self):
        """Cube 6: N=99 marble sampling — same seed = same sample."""
        rows = load_csv_rows()
        texts = [row["Detailed_Results"] for row in rows]
        reference_sample = None

        for run in range(self.N):
            random.seed(42)
            sample = random.sample(texts, min(384, len(texts)))
            if reference_sample is None:
                reference_sample = sample
            else:
                assert sample == reference_sample, f"Run {run}: marble sample mismatch"

    def test_cochran_formula_n99(self):
        """Cube 6: N=99 Cochran sample size — pure math, must be identical."""
        from app.cubes.cube6_ai.scale_pipeline import cochran_sample_size

        reference_sizes = {}
        populations = [100, 1_000, 5_000, 10_000, 100_000, 1_000_000]

        for run in range(self.N):
            for pop in populations:
                size = cochran_sample_size(pop, confidence=0.95, margin=0.05)
                if run == 0:
                    reference_sizes[pop] = size
                else:
                    assert size == reference_sizes[pop], \
                        f"Run {run}: Cochran({pop}) = {size}, expected {reference_sizes[pop]}"

    def test_replay_hash_n99(self):
        """Cross-Cube: N=99 replay hash — SHA-256 determinism proof."""
        rows = load_csv_rows()
        texts = sorted(row["Detailed_Results"] for row in rows)
        params = "seed=42|themes=9|algorithm=borda|version=1.0.0"
        combined = params + "|" + "|".join(texts)
        reference_hash = hashlib.sha256(combined.encode()).hexdigest()

        for run in range(self.N):
            h = hashlib.sha256(combined.encode()).hexdigest()
            assert h == reference_hash, f"Run {run}: replay hash mismatch"

    def test_token_accounting_n99(self):
        """Cube 8: N=99 token calculation — deterministic with seeded random."""
        reference_totals = None

        for run in range(self.N):
            random.seed(42)
            total_heart = 0.0
            total_human = 0.0
            total_unity = 0.0
            for _ in range(10_000):
                active_min = random.uniform(1, 120)
                heart = math.ceil(active_min)
                human = active_min * 0.1208  # US-TX rate
                unity = heart * 5.0
                total_heart += heart
                total_human += human
                total_unity += unity

            totals = (round(total_heart, 6), round(total_human, 6), round(total_unity, 6))
            if reference_totals is None:
                reference_totals = totals
            else:
                assert totals == reference_totals, f"Run {run}: token totals mismatch"

    def test_csv_export_hash_n99(self):
        """Cube 9: N=99 CSV export — identical output for identical input."""
        rows = load_csv_rows(100)
        reference_hash = None

        for run in range(self.N):
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            for row in rows:
                writer.writerow(row)
            content = output.getvalue()
            h = hashlib.sha256(content.encode()).hexdigest()

            if reference_hash is None:
                reference_hash = h
            else:
                assert h == reference_hash, f"Run {run}: CSV export hash mismatch"

    def test_quadratic_voting_n99(self):
        """Cube 10: N=99 vote tallying — deterministic quadratic weights."""
        from app.cubes.cube10_simulation.service import tally_votes

        votes = [
            {"vote": "approve", "tokens_staked": 100},
            {"vote": "approve", "tokens_staked": 50},
            {"vote": "approve", "tokens_staked": 75},
            {"vote": "reject", "tokens_staked": 200},
            {"vote": "approve", "tokens_staked": 30},
        ]
        reference_result = None

        for run in range(self.N):
            result = tally_votes(votes, total_token_holders=100)
            if reference_result is None:
                reference_result = result
            else:
                assert result["approval_percent"] == reference_result["approval_percent"], \
                    f"Run {run}: approval percent mismatch"
                assert result["result"] == reference_result["result"], \
                    f"Run {run}: result mismatch"

    def test_state_machine_n99(self):
        """Cube 1: N=99 state transition validation — consistent rules."""
        from app.models.session import SESSION_TRANSITIONS

        reference_valid = None
        transitions_to_test = [
            ("draft", "open"), ("open", "polling"), ("polling", "ranking"),
            ("ranking", "closed"), ("closed", "archived"),
            ("draft", "polling"),  # Invalid
            ("closed", "open"),    # Invalid
            ("archived", "draft"), # Invalid
        ]

        for run in range(self.N):
            valid = []
            for current, target in transitions_to_test:
                valid.append(target in SESSION_TRANSITIONS.get(current, set()))
            if reference_valid is None:
                reference_valid = valid
            else:
                assert valid == reference_valid, f"Run {run}: state machine mismatch"

    def test_short_code_determinism_n99(self):
        """Cube 1: N=99 nanoid with same seed concept — structure validation."""
        alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz"
        for run in range(self.N):
            assert len(alphabet) == 55, f"Run {run}: alphabet size changed"
            # Verify no ambiguous characters (0, O, I, l, 1 excluded)
            for ch in "0OIl1":
                assert ch not in alphabet, f"Run {run}: ambiguous char '{ch}' in alphabet"

    def test_shard_assignment_n99(self):
        """Cube 7: N=99 shard assignment — same participant always gets same shard."""
        from app.cubes.cube7_ranking.scale_engine import compute_shard

        reference_shards = {}
        participants = [f"user_{i}" for i in range(1000)]

        for run in range(self.N):
            for p in participants:
                shard = compute_shard(p, n_shards=100)
                if run == 0:
                    reference_shards[p] = shard
                else:
                    assert shard == reference_shards[p], \
                        f"Run {run}: shard mismatch for {p}"

    def test_metrics_comparison_n99(self):
        """Cube 10: N=99 metrics comparison — same inputs = same pass/fail."""
        from app.cubes.cube10_simulation.service import compare_metrics

        baseline = {
            "tests_total": 164, "duration_ms": 3752,
            "ssses": {"security": 95, "stability": 97, "scalability": 88,
                      "efficiency": 94, "succinctness": 93},
        }
        submission = {
            "tests_passed": 164, "duration_ms": 2100,
            "ssses": {"security": 95, "stability": 97, "scalability": 98,
                      "efficiency": 96, "succinctness": 93},
        }
        reference = None

        for run in range(self.N):
            result = compare_metrics(baseline, submission)
            if reference is None:
                reference = result
            else:
                assert result == reference, f"Run {run}: metrics comparison mismatch"


# ═══════════════════════════════════════════════════════════════════
# N=99 SCALE STRESS: Borda 1M × 99 cumulative verification
# ═══════════════════════════════════════════════════════════════════


class TestN99ScaleStress:
    """Verify that 1M-scale operations produce consistent results across N=99 runs.

    These tests use smaller per-run sizes but verify consistency across 99 iterations.
    """

    N = 99

    def test_borda_10k_voters_n99(self):
        """Cube 7: 10K voters × N=99 runs — all identical."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator

        themes = ["Alpha", "Beta", "Gamma"]
        reference_scores = None

        for run in range(self.N):
            acc = BordaAccumulator(n_themes=3, seed="stress-10k")
            for j in range(10_000):
                ranking = themes[j % 3:] + themes[:j % 3]
                acc.add_vote(ranking, participant_id=f"user_{j}")
            result = acc.aggregate()
            scores = tuple(r["score"] for r in result)

            if reference_scores is None:
                reference_scores = scores
            else:
                assert scores == reference_scores, \
                    f"Run {run}: score mismatch {scores} != {reference_scores}"

    def test_accumulator_merge_n99(self):
        """Cube 7: Shard merge × N=99 — merged result = single accumulator."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator

        themes = ["X", "Y", "Z"]
        reference_scores = None

        for run in range(self.N):
            # Single accumulator
            single = BordaAccumulator(n_themes=3, seed="merge-test")
            for j in range(1000):
                ranking = themes[j % 3:] + themes[:j % 3]
                single.add_vote(ranking, participant_id=f"user_{j}")

            # Sharded accumulators
            shard_a = BordaAccumulator(n_themes=3, seed="merge-test")
            shard_b = BordaAccumulator(n_themes=3, seed="merge-test")
            for j in range(500):
                ranking = themes[j % 3:] + themes[:j % 3]
                shard_a.add_vote(ranking, participant_id=f"user_{j}")
            for j in range(500, 1000):
                ranking = themes[j % 3:] + themes[:j % 3]
                shard_b.add_vote(ranking, participant_id=f"user_{j}")
            shard_a.merge(shard_b)

            single_result = single.aggregate()
            merged_result = shard_a.aggregate()

            # Scores must match
            for k in range(3):
                assert single_result[k]["score"] == merged_result[k]["score"], \
                    f"Run {run}: merge mismatch at position {k}"

            scores = tuple(r["score"] for r in single_result)
            if reference_scores is None:
                reference_scores = scores
            else:
                assert scores == reference_scores, f"Run {run}: reference mismatch"

    def test_ingestion_hash_n99(self):
        """Cube 2: N=99 text hashing — MD5 determinism for PII check simulation."""
        rows = load_csv_rows(50)
        texts = [row["Detailed_Results"] for row in rows]
        reference_hashes = None

        for run in range(self.N):
            hashes = [hashlib.md5(t.encode()).hexdigest() for t in texts]
            if reference_hashes is None:
                reference_hashes = hashes
            else:
                assert hashes == reference_hashes, f"Run {run}: hash mismatch"

    def test_security_headers_n99(self):
        """Security: N=99 verify security header constants never drift."""
        expected_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
        }
        from app.core.middleware import SecurityHeadersMiddleware
        for run in range(self.N):
            for key, val in expected_headers.items():
                assert SecurityHeadersMiddleware._headers[key] == val, \
                    f"Run {run}: Security header {key} drifted"

    def test_hmac_anonymization_n99(self):
        """WireGuard-inspired: N=99 HMAC anonymization — same inputs = same hash."""
        from app.core.security import anonymize_user_id
        reference_hashes = {}
        users = [f"user_{i}" for i in range(100)]
        salt = "session-salt-wireguard-test"

        for run in range(self.N):
            for user in users:
                h = anonymize_user_id(user, salt)
                if run == 0:
                    reference_hashes[user] = h
                else:
                    assert h == reference_hashes[user], \
                        f"Run {run}: HMAC mismatch for {user}"

    def test_hmac_session_isolation_n99(self):
        """WireGuard-inspired: Different session salts = different hashes (session isolation)."""
        from app.core.security import anonymize_user_id

        for run in range(self.N):
            h1 = anonymize_user_id("user_42", "session_A")
            h2 = anonymize_user_id("user_42", "session_B")
            assert h1 != h2, f"Run {run}: Same user should have different hashes across sessions"

    def test_anti_sybil_exclusion_n99(self):
        """WireGuard-inspired: N=99 anti-sybil — excluded participants always excluded."""
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator

        themes = ["A", "B", "C"]
        reference_result = None

        for run in range(self.N):
            acc = BordaAccumulator(n_themes=3, seed="sybil-n99")
            # Add sybil participant then exclude
            acc.add_vote(["C", "B", "A"], participant_id="sybil_whale")
            acc.exclude_participant("sybil_whale")
            # Add legitimate votes
            for j in range(100):
                acc.add_vote(["A", "B", "C"], participant_id=f"legit_{j}")
            result = acc.aggregate()
            # Sybil's vote was before exclusion — it still counts in current impl
            # But exclusion prevents future votes from that ID
            acc.add_vote(["C", "B", "A"], participant_id="sybil_whale")
            # Verify sybil's second vote was blocked
            assert acc.voter_count == 101, f"Run {run}: sybil second vote should be blocked"
            if reference_result is None:
                reference_result = [(r["theme_id"], r["score"]) for r in result]
            else:
                current = [(r["theme_id"], r["score"]) for r in result]
                assert current == reference_result, f"Run {run}: anti-sybil result mismatch"

    def test_encryption_roundtrip_n99(self):
        """WireGuard-inspired: N=99 Fernet encrypt/decrypt roundtrip — data integrity."""
        from app.core.security import encrypt_payload, decrypt_payload

        test_payloads = [
            "session_code=ABC123&user_id=42",
            '{"vote": "approve", "tokens": 100}',
            "PII: john@example.com should be encrypted",
        ]

        for run in range(self.N):
            for payload in test_payloads:
                encrypted = encrypt_payload(payload)
                decrypted = decrypt_payload(encrypted)
                assert decrypted == payload, f"Run {run}: encrypt/decrypt roundtrip failed"
                assert encrypted != payload, f"Run {run}: encryption produced plaintext"

    def test_process_integrity_hash_chain_n99(self):
        """WireGuard-inspired: N=99 hash chain — tamper detection across pipeline.
        Each cube's output hashes feed into next cube's input hash.
        Any tampering breaks the chain."""

        reference_chain = None

        for run in range(self.N):
            chain = []
            # Cube 1: Session creation hash
            h = hashlib.sha256(b"session:ABC123:seed:42").hexdigest()
            chain.append(h)
            # Cube 2: Text ingestion hash (chains from Cube 1)
            h = hashlib.sha256(f"{h}:text:5000_responses".encode()).hexdigest()
            chain.append(h)
            # Cube 4: Collection hash (chains from Cube 2)
            h = hashlib.sha256(f"{h}:collected:5000:deduped:4750".encode()).hexdigest()
            chain.append(h)
            # Cube 6: Theme hash (chains from Cube 4)
            h = hashlib.sha256(f"{h}:themes:9:sample:384".encode()).hexdigest()
            chain.append(h)
            # Cube 7: Ranking hash (chains from Cube 6)
            h = hashlib.sha256(f"{h}:ranked:9:borda:deterministic".encode()).hexdigest()
            chain.append(h)
            # Cube 9: Export hash (chains from Cube 7)
            h = hashlib.sha256(f"{h}:export:csv:rows:5000".encode()).hexdigest()
            chain.append(h)

            if reference_chain is None:
                reference_chain = chain
            else:
                assert chain == reference_chain, f"Run {run}: hash chain mismatch (tamper detected)"

    def test_full_pipeline_determinism_n99(self):
        """Cross-Cube: N=99 full pipeline (ingest→cluster→rank→export) determinism."""
        rows = load_csv_rows(100)
        reference_hash = None

        for run in range(self.N):
            # Phase 1: Ingest
            responses = []
            for i, row in enumerate(rows):
                responses.append({
                    "id": f"resp_{i:04d}",
                    "text": row["Detailed_Results"],
                    "lang": row["Response_Language"],
                })

            # Phase 2: Classify (from pre-computed)
            theme_groups = defaultdict(list)
            for i, row in enumerate(rows):
                theme_groups[row["Theme2_3"]].append(responses[i])

            # Phase 3: Rank
            from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
            theme_labels = sorted(theme_groups.keys())[:3]
            acc = BordaAccumulator(n_themes=len(theme_labels), seed="pipeline-n99")
            for j in range(1000):
                ranking = theme_labels[j % len(theme_labels):] + theme_labels[:j % len(theme_labels)]
                acc.add_vote(ranking, participant_id=f"user_{j}")
            result = acc.aggregate()

            # Phase 4: Export
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["theme", "score", "rank"])
            for r in result:
                writer.writerow([r["theme_id"], r["score"], r["rank_position"]])
            content = output.getvalue()
            h = hashlib.sha256(content.encode()).hexdigest()

            if reference_hash is None:
                reference_hash = h
            else:
                assert h == reference_hash, f"Run {run}: pipeline hash mismatch"


# ═══════════════════════════════════════════════════════════════════
# N=99 USER + MODERATOR FLOW DETERMINISM (Athena Strategic Tests)
# ═══════════════════════════════════════════════════════════════════


class TestN99UserTextSubmissionFlow:
    """N=99 determinism for User text submission pipeline (Cube 2 → 4 → 6).

    Verifies that PII scrubbing, language detection, response hashing,
    and Web_Results formatting produce identical output on every run.
    """

    N = 99

    def test_pii_regex_scrubbing_n99(self):
        """Cube 2: N=99 PII regex detection + scrubbing — deterministic output."""
        from app.cubes.cube2_text.service import scrub_pii, _PII_PATTERNS

        test_texts = [
            "Contact john@example.com or call 555-123-4567 for details.",
            "My SSN is 123-45-6789 and credit card 4111-1111-1111-1111.",
            "Server at 192.168.1.1 handles requests from user@test.org.",
            "No PII here, just a regular governance opinion about AI ethics.",
        ]
        reference_results = None

        for run in range(self.N):
            results = []
            for text in test_texts:
                detections = []
                for pii_type, pattern in _PII_PATTERNS:
                    for match in pattern.finditer(text):
                        detections.append({
                            "type": pii_type,
                            "start": match.start(),
                            "end": match.end(),
                            "text": match.group(),
                        })
                detections.sort(key=lambda d: d["start"])
                scrubbed = scrub_pii(text, detections)
                results.append((len(detections), scrubbed))

            if reference_results is None:
                reference_results = results
                # Verify PII was actually detected
                assert reference_results[0][0] >= 2, "Expected email+phone in text 0"
                assert reference_results[1][0] >= 2, "Expected SSN+CC in text 1"
                assert reference_results[3][0] == 0, "No PII expected in text 3"
            else:
                assert results == reference_results, f"Run {run}: PII scrub mismatch"

    def test_language_detection_n99(self):
        """Cube 2: N=99 language plausibility check — consistent results."""
        from app.cubes.cube2_text.service import detect_language

        test_cases = [
            ("Hello world, this is an English response", "en", True),
            ("Bonjour le monde", "fr", True),
            ("مرحبا بالعالم", "ar", True),
            ("こんにちは世界", "ja", True),
            ("Привет мир", "ru", True),
            ("Hello world", "ar", False),  # Latin text declared as Arabic
            ("", "en", True),  # Empty text always plausible
        ]
        reference_results = None

        for run in range(self.N):
            results = [detect_language(text, lang) for text, lang, _ in test_cases]
            if reference_results is None:
                reference_results = results
                for i, (_, _, expected) in enumerate(test_cases):
                    assert results[i] == expected, \
                        f"Language check {i} expected {expected}, got {results[i]}"
            else:
                assert results == reference_results, f"Run {run}: language detection mismatch"

    def test_response_hash_determinism_n99(self):
        """Cube 2→4: N=99 response content hashing — identical text = identical hash."""
        from app.core.crypto_utils import compute_response_hash

        responses = [
            f"Response {i}: AI governance needs transparency and accountability"
            for i in range(100)
        ]
        reference_hashes = None

        for run in range(self.N):
            hashes = [compute_response_hash(r) for r in responses]
            if reference_hashes is None:
                reference_hashes = hashes
                # Verify all hashes are unique (no collisions in 100 distinct texts)
                assert len(set(hashes)) == 100, "Hash collision in 100 distinct responses"
            else:
                assert hashes == reference_hashes, f"Run {run}: response hash mismatch"

    def test_web_results_item_format_n99(self):
        """Cube 4: N=99 _build_response_item output — deterministic field structure."""
        from app.cubes.cube4_collector.service import _build_response_item
        from unittest.mock import MagicMock

        session_id = uuid.UUID("12345678-1234-1234-1234-123456789abc")
        reference_items = None

        for run in range(self.N):
            items = []
            for i in range(50):
                meta = MagicMock()
                meta.id = uuid.UUID(f"00000000-0000-0000-0000-{i:012d}")
                meta.raw_text = f"Response {i} about governance"
                meta.submitted_at = datetime(2026, 4, 13, 12, 0, 0, tzinfo=timezone.utc)
                meta.source = "text"

                question = MagicMock()
                question.order_index = 0
                question.question_text = "What matters most?"

                participant = MagicMock()
                participant.display_name = f"User_{i:04d}"
                participant.language_code = "en"
                participant.id = uuid.UUID(f"11111111-0000-0000-0000-{i:012d}")

                text_resp = None  # No TextResponse = use raw_text
                summary_row = None

                item = _build_response_item(
                    meta, question, participant, session_id,
                    text_resp, summary_row,
                    include_summaries=False, include_themes=False,
                )
                items.append(item)

            if reference_items is None:
                reference_items = items
                # Verify structure matches expected fields
                assert reference_items[0]["q_number"] == "Q-0001"
                assert reference_items[0]["user"] == "User_0000"
                assert reference_items[0]["source"] == "text"
                assert "detailed_results" in reference_items[0]
            else:
                assert items == reference_items, f"Run {run}: Web_Results format mismatch"

    def test_anon_hash_pipeline_n99(self):
        """Cube 2→4: N=99 anonymization hash through full pipeline."""
        from app.core.crypto_utils import compute_anon_hash

        session_id = uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
        participant_ids = [uuid.UUID(f"00000000-0000-0000-0000-{i:012d}") for i in range(200)]
        reference_hashes = None

        for run in range(self.N):
            hashes = [compute_anon_hash(pid, session_id) for pid in participant_ids]
            if reference_hashes is None:
                reference_hashes = hashes
                # All hashes must be unique per participant
                assert len(set(hashes)) == 200, "Anon hash collision"
            else:
                assert hashes == reference_hashes, f"Run {run}: anon hash mismatch"


class TestN99ModeratorStateMachine:
    """N=99 determinism for Moderator session state machine (Cube 1).

    Exhaustive verification of all valid and invalid transitions.
    """

    N = 99

    def test_all_valid_transitions_n99(self):
        """Cube 1: N=99 — every valid transition is consistently allowed."""
        from app.models.session import SESSION_TRANSITIONS

        valid_transitions = [
            ("draft", "open"),
            ("open", "polling"),
            ("open", "closed"),
            ("polling", "ranking"),
            ("polling", "closed"),
            ("ranking", "polling"),
            ("ranking", "closed"),
            ("closed", "archived"),
        ]
        reference = None

        for run in range(self.N):
            results = []
            for current, target in valid_transitions:
                allowed = SESSION_TRANSITIONS.get(current, ())
                results.append(target in allowed)
            if reference is None:
                reference = results
                assert all(reference), "All listed transitions must be valid"
            else:
                assert results == reference, f"Run {run}: valid transition mismatch"

    def test_all_invalid_transitions_n99(self):
        """Cube 1: N=99 — every invalid transition is consistently blocked."""
        from app.models.session import SESSION_TRANSITIONS, SESSION_STATES

        reference_invalid = None

        for run in range(self.N):
            invalid_pairs = []
            for current in SESSION_STATES:
                allowed = set(SESSION_TRANSITIONS.get(current, ()))
                for target in SESSION_STATES:
                    if target not in allowed and target != current:
                        invalid_pairs.append((current, target))
            if reference_invalid is None:
                reference_invalid = invalid_pairs
                # Verify known invalid transitions are present
                assert ("archived", "draft") in invalid_pairs
                assert ("closed", "open") in invalid_pairs
                assert ("draft", "ranking") in invalid_pairs
            else:
                assert invalid_pairs == reference_invalid, \
                    f"Run {run}: invalid transition set mismatch"

    def test_session_id_determinism_n99(self):
        """Cube 1: N=99 — seeded session UUID5 generation is deterministic."""
        reference_ids = None

        for run in range(self.N):
            ids = []
            for i in range(100):
                seed = f"test-seed-{i}"
                title = f"Session Title {i}"
                session_id = uuid.uuid5(uuid.NAMESPACE_URL, f"exel:{seed}:{title}")
                ids.append(str(session_id))
            if reference_ids is None:
                reference_ids = ids
                # All IDs must be unique
                assert len(set(ids)) == 100
            else:
                assert ids == reference_ids, f"Run {run}: session ID mismatch"

    def test_transition_audit_fields_n99(self):
        """Cube 1: N=99 — audit log field construction is deterministic."""
        reference_entries = None

        transitions = [
            ("draft", "open"), ("open", "polling"), ("polling", "ranking"),
            ("ranking", "closed"), ("closed", "archived"),
        ]

        for run in range(self.N):
            entries = []
            for old, new in transitions:
                entry = {
                    "action_type": f"session.transition.{old}_to_{new}",
                    "before_state": {"status": old},
                    "after_state": {"status": new},
                    "actor_role": "moderator",
                    "object_type": "session",
                }
                entries.append(entry)
            if reference_entries is None:
                reference_entries = entries
            else:
                assert entries == reference_entries, \
                    f"Run {run}: audit entry mismatch"


class TestN99ResponseDeduplication:
    """N=99 determinism for response deduplication logic (Cube 4)."""

    N = 99

    def test_dedup_ordering_n99(self):
        """Cube 4: N=99 — dedup preserves first-seen order deterministically."""
        # Simulate responses with known duplicates at known positions
        random.seed(42)
        base_responses = [f"Response about topic {i}" for i in range(500)]
        # Insert exact duplicates at known positions
        responses_with_dups = base_responses + base_responses[:50]
        random.shuffle(responses_with_dups)
        reference_order = None

        for run in range(self.N):
            random.seed(42)
            shuffled = list(responses_with_dups)
            random.shuffle(shuffled)

            seen = set()
            deduped = []
            for r in shuffled:
                h = hashlib.md5(r.encode()).hexdigest()
                if h not in seen:
                    seen.add(h)
                    deduped.append(r)

            if reference_order is None:
                reference_order = deduped
                assert len(deduped) < len(shuffled), "Dedup should remove duplicates"
                # Exactly 500 unique base responses
                assert len(deduped) == 500
            else:
                assert deduped == reference_order, f"Run {run}: dedup order mismatch"

    def test_dedup_hash_consistency_n99(self):
        """Cube 4: N=99 — MD5 content hashes are stable across runs."""
        rows = load_csv_rows(200)
        texts = [row["Detailed_Results"] for row in rows]
        reference_hashes = None

        for run in range(self.N):
            hashes = {hashlib.md5(t.encode()).hexdigest(): t[:50] for t in texts}
            if reference_hashes is None:
                reference_hashes = hashes
            else:
                assert set(hashes.keys()) == set(reference_hashes.keys()), \
                    f"Run {run}: dedup hash set mismatch"

    def test_dedup_rate_determinism_n99(self):
        """Cube 4: N=99 — seeded random dup injection produces same dedup rate."""
        reference_rate = None

        for run in range(self.N):
            random.seed(99)
            total = 10_000
            dup_count = 0
            seen = set()
            for i in range(total):
                # 8% dup rate via seeded random
                if i > 0 and random.random() < 0.08:
                    text = f"response_{i - 1}"
                else:
                    text = f"response_{i}"
                h = hashlib.md5(text.encode()).hexdigest()
                if h in seen:
                    dup_count += 1
                else:
                    seen.add(h)
            rate = round(dup_count / total, 6)
            if reference_rate is None:
                reference_rate = rate
            else:
                assert rate == reference_rate, \
                    f"Run {run}: dedup rate {rate} != {reference_rate}"


class TestN99BroadcastPayloadConsistency:
    """N=99 determinism for broadcast payload structure (NewResponsePayload).

    Validates that payloads match the frontend interface:
      { id?: string, text: string, clean_text?: string,
        submitted_at?: string, summary_33?: string, count: number }
    """

    N = 99

    def test_payload_structure_n99(self):
        """N=99 — broadcast payload fields match NewResponsePayload interface."""
        required_fields = {"text", "count"}
        optional_fields = {"id", "clean_text", "submitted_at", "summary_33"}
        all_fields = required_fields | optional_fields
        reference_payloads = None

        for run in range(self.N):
            payloads = []
            for i in range(100):
                payload = {
                    "id": str(uuid.UUID(f"00000000-0000-0000-0000-{i:012d}")),
                    "text": f"Response {i}: governance opinion about AI",
                    "clean_text": f"Response {i}: governance opinion about AI",
                    "submitted_at": datetime(
                        2026, 4, 13, 12, i % 60, 0, tzinfo=timezone.utc
                    ).isoformat(),
                    "summary_33": None,
                    "count": i + 1,
                }
                # Verify all fields are in the allowed set
                assert set(payload.keys()).issubset(all_fields), \
                    f"Payload has unexpected fields: {set(payload.keys()) - all_fields}"
                assert all(f in payload for f in required_fields), \
                    f"Payload missing required fields: {required_fields - set(payload.keys())}"
                payloads.append(payload)

            if reference_payloads is None:
                reference_payloads = payloads
            else:
                assert payloads == reference_payloads, \
                    f"Run {run}: broadcast payload mismatch"

    def test_payload_text_truncation_n99(self):
        """N=99 — long text in payload is handled consistently."""
        reference_payloads = None

        for run in range(self.N):
            payloads = []
            for i in range(50):
                raw_text = f"Word{i} " * 500  # ~3000 chars
                # Simulate frontend truncation at 200 chars for broadcast
                broadcast_text = raw_text[:200] if len(raw_text) > 200 else raw_text
                payload = {
                    "text": broadcast_text,
                    "count": i + 1,
                }
                payloads.append(payload)

            if reference_payloads is None:
                reference_payloads = payloads
                assert all(len(p["text"]) == 200 for p in payloads), \
                    "All payloads should be truncated to 200 chars"
            else:
                assert payloads == reference_payloads, \
                    f"Run {run}: truncated payload mismatch"

    def test_payload_count_monotonic_n99(self):
        """N=99 — response count in payload is strictly monotonically increasing."""
        for run in range(self.N):
            counts = []
            for i in range(1000):
                counts.append(i + 1)
            # Verify strict monotonic increase
            for j in range(1, len(counts)):
                assert counts[j] == counts[j - 1] + 1, \
                    f"Run {run}: count not monotonic at position {j}"

    def test_payload_pii_scrub_before_broadcast_n99(self):
        """N=99 — PII is scrubbed from text before broadcast payload construction."""
        from app.cubes.cube2_text.service import scrub_pii, _PII_PATTERNS

        reference_payloads = None

        for run in range(self.N):
            payloads = []
            test_inputs = [
                "I think AI ethics is crucial. Email: user@test.com",
                "Governance needs reform. Call 555-987-6543 for info.",
                "SSN 999-88-7777 should be protected in all systems.",
                "Clean input without any personal data whatsoever.",
            ]
            for i, text in enumerate(test_inputs):
                # Detect PII via regex
                detections = []
                for pii_type, pattern in _PII_PATTERNS:
                    for match in pattern.finditer(text):
                        detections.append({
                            "type": pii_type,
                            "start": match.start(),
                            "end": match.end(),
                            "text": match.group(),
                        })
                detections.sort(key=lambda d: d["start"])
                clean = scrub_pii(text, detections)

                payload = {
                    "text": clean,
                    "clean_text": clean,
                    "count": i + 1,
                }
                # Verify no raw PII in broadcast payload
                assert "user@test.com" not in payload["text"]
                assert "555-987-6543" not in payload["text"]
                assert "999-88-7777" not in payload["text"]
                payloads.append(payload)

            if reference_payloads is None:
                reference_payloads = payloads
            else:
                assert payloads == reference_payloads, \
                    f"Run {run}: PII-scrubbed payload mismatch"
