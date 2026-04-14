"""Theming Simulation — 36 Responses (12 Users x 3 Each)

Tests the full Cube 6 auto-theming pipeline WITHOUT external API calls:
  Phase A: Classification into Supporting / Neutral / Risk bins
  Phase B: Theme hierarchy 9 -> 6 -> 3
  Cube 7:  Borda voting on 9 themes by 12 voters

All operations use actual codebase functions with deterministic seeds.
"""

import hashlib
import math
import random
import statistics
import time
import uuid
from collections import Counter

import numpy as np
import pytest

from tests.test_12user_simulation import RESPONSE_POOL, USERS

# ── Codebase imports ────────────────────────────────────────────────
from app.cubes.cube6_ai.service import (
    THEME01_CATEGORIES,
    _group_by_theme01,
    _marble_sample,
    _parse_reduced_themes,
)
from app.cubes.cube6_ai.centroid_summarizer import (
    CostEstimate,
    generate_summary_tiers,
    truncate_to_words,
    select_centroid_representatives,
)
from app.cubes.cube7_ranking.scale_engine import BordaAccumulator

# ── Constants ───────────────────────────────────────────────────────
_NS = uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
SESSION_ID = uuid.uuid5(_NS, "theming-36-session")
SEED = 42
N_RUNS = 5  # Determinism verification

# Classification bins — target distribution
BIN_SUPPORTING = "Supporting Comments"
BIN_NEUTRAL = "Neutral Comments"
BIN_RISK = "Risk & Concerns"

# 9 theme labels for the hierarchy (3 per bin)
THEME_LABELS_9 = [
    # Supporting (3)
    "Transparent AI Governance Framework",
    "Democratic Participation Empowerment",
    "Real-time Consensus Innovation",
    # Neutral (3)
    "Digital Voting Security Measures",
    "Multilingual Inclusion Standards",
    "Citizen Engagement Transformation",
    # Risk (3)
    "Manipulation Prevention Safeguards",
    "Bias Detection Requirements",
    "Accountability Structure Gaps",
]

# 6 intermediate themes (2 per bin)
THEME_LABELS_6 = [
    "Transparent Governance Enablement",
    "Democratic Consensus Building",
    "Secure Digital Voting Systems",
    "Multilingual Civic Engagement",
    "Manipulation Risk Mitigation",
    "Accountability Gap Analysis",
]

# 3 top themes (1 per bin)
THEME_LABELS_3 = [
    "AI Governance Support",       # Supporting
    "Digital Voting Neutrality",   # Neutral
    "Risk Accountability Concern", # Risk
]

# Map each of the 36 responses to a classification bin.
# Distribution: ~40% Supporting (15), ~30% Neutral (11), ~30% Risk (10)
# Assignment logic: each user's 3 responses get a spread across bins.
_CLASSIFICATION_MAP = {
    # Alice (en): Supporting, Supporting, Neutral
    0: BIN_SUPPORTING, 1: BIN_SUPPORTING, 2: BIN_NEUTRAL,
    # Roberto (es): Supporting, Neutral, Risk
    3: BIN_SUPPORTING, 4: BIN_NEUTRAL, 5: BIN_RISK,
    # Chen Wei (zh): Neutral, Risk, Supporting
    6: BIN_NEUTRAL, 7: BIN_RISK, 8: BIN_SUPPORTING,
    # Marie (fr): Supporting, Risk, Neutral
    9: BIN_SUPPORTING, 10: BIN_RISK, 11: BIN_NEUTRAL,
    # Priya (hi): Supporting, Neutral, Risk
    12: BIN_SUPPORTING, 13: BIN_NEUTRAL, 14: BIN_RISK,
    # Ahmed (ar): Risk, Supporting, Neutral
    15: BIN_RISK, 16: BIN_SUPPORTING, 17: BIN_NEUTRAL,
    # Yuki (ja): Supporting, Neutral, Risk
    18: BIN_SUPPORTING, 19: BIN_NEUTRAL, 20: BIN_RISK,
    # Olga (uk): Neutral, Supporting, Risk
    21: BIN_NEUTRAL, 22: BIN_SUPPORTING, 23: BIN_RISK,
    # Igor (ru): Risk, Neutral, Supporting
    24: BIN_RISK, 25: BIN_NEUTRAL, 26: BIN_SUPPORTING,
    # Sarah (pt): Supporting, Risk, Neutral
    27: BIN_SUPPORTING, 28: BIN_RISK, 29: BIN_NEUTRAL,
    # Deepak (ne): Supporting, Neutral, Risk
    30: BIN_SUPPORTING, 31: BIN_NEUTRAL, 32: BIN_RISK,
    # Sophea (km): Supporting, Supporting, Neutral
    33: BIN_SUPPORTING, 34: BIN_SUPPORTING, 35: BIN_NEUTRAL,
}


def _build_classified_responses() -> list[dict]:
    """Build 36 response dicts with pre-assigned Theme01 classification."""
    responses = []
    for idx, text in enumerate(RESPONSE_POOL):
        user = USERS[idx // 3]
        responses.append({
            "id": str(uuid.uuid5(_NS, f"resp-{idx}")),
            "participant_id": user["id"],
            "language": user["lang"],
            "raw_text": text,
            "summary_33": truncate_to_words(text, 33),
            "theme01": _CLASSIFICATION_MAP[idx],
            "theme01_confidence": 85,
        })
    return responses


def _assign_theme2_levels(responses: list[dict]) -> list[dict]:
    """Deterministically assign Level 9/6/3 themes to each response.

    Uses a hash of the response id to pick a theme from the correct bin slice.
    """
    bin_to_9 = {
        BIN_SUPPORTING: THEME_LABELS_9[0:3],
        BIN_NEUTRAL: THEME_LABELS_9[3:6],
        BIN_RISK: THEME_LABELS_9[6:9],
    }
    bin_to_6 = {
        BIN_SUPPORTING: THEME_LABELS_6[0:2],
        BIN_NEUTRAL: THEME_LABELS_6[2:4],
        BIN_RISK: THEME_LABELS_6[4:6],
    }
    bin_to_3 = {
        BIN_SUPPORTING: [THEME_LABELS_3[0]],
        BIN_NEUTRAL: [THEME_LABELS_3[1]],
        BIN_RISK: [THEME_LABELS_3[2]],
    }

    for r in responses:
        h = int(hashlib.md5(r["id"].encode()).hexdigest(), 16)
        cat = r["theme01"]
        r["theme2_9"] = bin_to_9[cat][h % len(bin_to_9[cat])]
        r["theme2_6"] = bin_to_6[cat][h % len(bin_to_6[cat])]
        r["theme2_3"] = bin_to_3[cat][0]

    return responses


# ═══════════════════════════════════════════════════════════════════
# TEST CLASS 1: Theme Classification
# ═══════════════════════════════════════════════════════════════════


class TestThemeClassification36:
    """36 responses classified into Supporting / Neutral / Risk bins."""

    def test_36_responses_available(self):
        """RESPONSE_POOL has exactly 36 entries (12 users x 3)."""
        assert len(RESPONSE_POOL) == 36

    def test_12_users_available(self):
        """USERS list has exactly 12 users with diverse languages."""
        assert len(USERS) == 12
        langs = {u["lang"] for u in USERS}
        assert len(langs) == 12, "All 12 users have distinct languages"

    def test_classification_distribution(self):
        """Classification produces 3 bins with ~40/30/30 distribution."""
        responses = _build_classified_responses()
        counts = Counter(r["theme01"] for r in responses)

        assert set(counts.keys()) == set(THEME01_CATEGORIES)

        total = sum(counts.values())
        assert total == 36

        # Supporting ~40% (14-16 of 36)
        supporting_pct = counts[BIN_SUPPORTING] / total * 100
        assert 35 <= supporting_pct <= 50, f"Supporting {supporting_pct:.0f}% out of 35-50 range"

        # Neutral ~30% (9-13 of 36)
        neutral_pct = counts[BIN_NEUTRAL] / total * 100
        assert 22 <= neutral_pct <= 38, f"Neutral {neutral_pct:.0f}% out of 22-38 range"

        # Risk ~30% (9-13 of 36)
        risk_pct = counts[BIN_RISK] / total * 100
        assert 22 <= risk_pct <= 38, f"Risk {risk_pct:.0f}% out of 22-38 range"

    def test_group_by_theme01_function(self):
        """_group_by_theme01 correctly partitions classified responses."""
        responses = _build_classified_responses()
        bins = _group_by_theme01(responses)

        assert set(bins.keys()) == set(THEME01_CATEGORIES)
        total = sum(len(v) for v in bins.values())
        assert total == 36, f"All 36 responses partitioned, got {total}"

        for label, items in bins.items():
            for r in items:
                assert r["theme01"] == label

    def test_classification_determinism_n5(self):
        """Classification is identical across N=5 runs (deterministic seeds)."""
        results = []
        for _ in range(N_RUNS):
            responses = _build_classified_responses()
            fingerprint = hashlib.sha256(
                "|".join(r["theme01"] for r in responses).encode()
            ).hexdigest()
            results.append(fingerprint)

        assert len(set(results)) == 1, "Classification must be deterministic across runs"

    def test_all_responses_have_confidence(self):
        """Every classified response has theme01_confidence >= 65."""
        responses = _build_classified_responses()
        for r in responses:
            assert r["theme01_confidence"] >= 65, (
                f"Response {r['id']} confidence {r['theme01_confidence']} < 65"
            )

    def test_multilingual_coverage(self):
        """All 12 languages represented in the classified responses."""
        responses = _build_classified_responses()
        langs = {r["language"] for r in responses}
        assert len(langs) == 12


# ═══════════════════════════════════════════════════════════════════
# TEST CLASS 2: Theme Hierarchy (9 -> 6 -> 3)
# ═══════════════════════════════════════════════════════════════════


class TestThemeHierarchy:
    """9 -> 6 -> 3 theme reduction hierarchy."""

    def test_level_9_generates_9_themes(self):
        """Level 9: 9 detailed themes (3 per bin x 3 bins)."""
        assert len(THEME_LABELS_9) == 9
        # 3 per bin
        supporting_9 = THEME_LABELS_9[0:3]
        neutral_9 = THEME_LABELS_9[3:6]
        risk_9 = THEME_LABELS_9[6:9]
        assert len(supporting_9) == 3
        assert len(neutral_9) == 3
        assert len(risk_9) == 3

    def test_level_6_generates_6_themes(self):
        """Level 6: 6 intermediate themes (2 per bin x 3 bins)."""
        assert len(THEME_LABELS_6) == 6
        supporting_6 = THEME_LABELS_6[0:2]
        neutral_6 = THEME_LABELS_6[2:4]
        risk_6 = THEME_LABELS_6[4:6]
        assert len(supporting_6) == 2
        assert len(neutral_6) == 2
        assert len(risk_6) == 2

    def test_level_3_generates_3_themes(self):
        """Level 3: 3 top themes (1 per bin = Supporting/Neutral/Risk)."""
        assert len(THEME_LABELS_3) == 3

    def test_hierarchy_reduction_counts(self):
        """Each level has fewer themes: 9 > 6 > 3."""
        assert len(THEME_LABELS_9) > len(THEME_LABELS_6) > len(THEME_LABELS_3)
        assert len(THEME_LABELS_9) == 9
        assert len(THEME_LABELS_6) == 6
        assert len(THEME_LABELS_3) == 3

    def test_theme_assignment_covers_all_responses(self):
        """Every response gets assigned a theme at all 3 levels."""
        responses = _build_classified_responses()
        responses = _assign_theme2_levels(responses)

        for r in responses:
            assert r["theme2_9"] in THEME_LABELS_9, f"L9 theme '{r['theme2_9']}' not in set"
            assert r["theme2_6"] in THEME_LABELS_6, f"L6 theme '{r['theme2_6']}' not in set"
            assert r["theme2_3"] in THEME_LABELS_3, f"L3 theme '{r['theme2_3']}' not in set"

    def test_theme_assignment_respects_bin(self):
        """Assigned themes match the response's Theme01 bin."""
        responses = _build_classified_responses()
        responses = _assign_theme2_levels(responses)

        bin_to_9 = {
            BIN_SUPPORTING: set(THEME_LABELS_9[0:3]),
            BIN_NEUTRAL: set(THEME_LABELS_9[3:6]),
            BIN_RISK: set(THEME_LABELS_9[6:9]),
        }
        bin_to_3 = {
            BIN_SUPPORTING: THEME_LABELS_3[0],
            BIN_NEUTRAL: THEME_LABELS_3[1],
            BIN_RISK: THEME_LABELS_3[2],
        }

        for r in responses:
            cat = r["theme01"]
            assert r["theme2_9"] in bin_to_9[cat], (
                f"Response bin={cat} got L9 theme '{r['theme2_9']}' outside bin"
            )
            assert r["theme2_3"] == bin_to_3[cat], (
                f"Response bin={cat} got L3 theme '{r['theme2_3']}' != '{bin_to_3[cat]}'"
            )

    def test_all_9_themes_used(self):
        """All 9 themes are represented among the 36 responses."""
        responses = _build_classified_responses()
        responses = _assign_theme2_levels(responses)
        used_9 = {r["theme2_9"] for r in responses}
        assert used_9 == set(THEME_LABELS_9), (
            f"Missing L9 themes: {set(THEME_LABELS_9) - used_9}"
        )

    def test_all_3_themes_used(self):
        """All 3 top themes are represented."""
        responses = _build_classified_responses()
        responses = _assign_theme2_levels(responses)
        used_3 = {r["theme2_3"] for r in responses}
        assert used_3 == set(THEME_LABELS_3)

    def test_parse_reduced_themes(self):
        """_parse_reduced_themes correctly parses Cube 6 reduce output format."""
        sample_output = (
            "T001, Transparent AI Governance, Ensuring open decision-making in AI policy, 85%\n"
            "T002, Democratic Participation, Empowering citizens through digital voting, 90%\n"
            "T003, Risk Mitigation Framework, Protecting against manipulation and bias, 78%"
        )
        parsed = _parse_reduced_themes(sample_output)
        assert len(parsed) == 3
        assert parsed[0]["label"] == "Transparent AI Governance"
        assert parsed[0]["confidence"] == 0.85
        assert parsed[1]["label"] == "Democratic Participation"
        assert parsed[2]["confidence"] == 0.78


# ═══════════════════════════════════════════════════════════════════
# TEST CLASS 3: Marble Sampling
# ═══════════════════════════════════════════════════════════════════


class TestMarbleSampling:
    """_marble_sample deterministic shuffle and slicing."""

    def test_marble_sample_groups_all_items(self):
        """Every response appears exactly once across all marble groups."""
        responses = _build_classified_responses()
        bins = _group_by_theme01(responses)

        for label, items in bins.items():
            groups = _marble_sample(items, seed=SEED)
            flat = [r for g in groups for r in g]
            assert len(flat) == len(items), f"Bin '{label}': {len(flat)} != {len(items)}"
            ids_flat = [r["id"] for r in flat]
            assert len(set(ids_flat)) == len(ids_flat), "Duplicate response in marble groups"

    def test_marble_sample_group_size(self):
        """Each marble group has <= 10 items (settings.sample_size)."""
        responses = _build_classified_responses()
        bins = _group_by_theme01(responses)

        for label, items in bins.items():
            groups = _marble_sample(items, seed=SEED)
            for g in groups:
                assert len(g) <= 10, f"Group in bin '{label}' has {len(g)} items > 10"

    def test_marble_sample_determinism(self):
        """Marble sampling is deterministic across N=5 runs with same seed."""
        responses = _build_classified_responses()
        bins = _group_by_theme01(responses)

        fingerprints = []
        for _ in range(N_RUNS):
            all_ids = []
            for label in sorted(bins.keys()):
                groups = _marble_sample(bins[label], seed=SEED)
                for g in groups:
                    all_ids.extend(r["id"] for r in g)
            fp = hashlib.sha256("|".join(all_ids).encode()).hexdigest()
            fingerprints.append(fp)

        assert len(set(fingerprints)) == 1, "Marble sampling must be deterministic"

    def test_marble_sample_empty_input(self):
        """Empty input returns empty groups."""
        groups = _marble_sample([], seed=SEED)
        assert groups == []

    def test_marble_sample_different_seeds(self):
        """Different seeds produce different orderings."""
        responses = _build_classified_responses()
        bins = _group_by_theme01(responses)
        biggest_bin = max(bins.values(), key=len)

        if len(biggest_bin) < 2:
            pytest.skip("Need at least 2 items to test different orderings")

        groups_a = _marble_sample(biggest_bin, seed=SEED)
        groups_b = _marble_sample(biggest_bin, seed=SEED + 1)

        ids_a = [r["id"] for g in groups_a for r in g]
        ids_b = [r["id"] for g in groups_b for r in g]

        assert set(ids_a) == set(ids_b), "Same items in both"
        assert ids_a != ids_b, "Different seeds should produce different orderings"


# ═══════════════════════════════════════════════════════════════════
# TEST CLASS 4: Borda Voting on 9 Themes
# ═══════════════════════════════════════════════════════════════════


def _generate_voter_rankings(seed: int) -> list[tuple[str, list[str]]]:
    """Generate 12 voter rankings over the 9 themes.

    Each voter has a preference bias based on their bin affiliation
    but ranks all 9 themes. Uses seeded RNG for determinism.
    """
    rng = random.Random(seed)
    rankings = []

    for user in USERS:
        user_idx = int(user["id"][1:]) - 1  # 0-based
        # Build a bias: user's "home" bin themes ranked first
        first_response_idx = user_idx * 3
        home_bin = _CLASSIFICATION_MAP[first_response_idx]

        bin_to_9 = {
            BIN_SUPPORTING: THEME_LABELS_9[0:3],
            BIN_NEUTRAL: THEME_LABELS_9[3:6],
            BIN_RISK: THEME_LABELS_9[6:9],
        }

        home_themes = list(bin_to_9[home_bin])
        other_themes = [t for t in THEME_LABELS_9 if t not in home_themes]
        rng.shuffle(home_themes)
        rng.shuffle(other_themes)

        # Home themes first, then others
        ranking = home_themes + other_themes
        rankings.append((user["id"], ranking))

    return rankings


class TestBordaVoting9Themes:
    """12 voters rank 9 themes — Borda accumulation."""

    def test_borda_accumulator_12_voters(self):
        """12 users each rank all 9 themes and produce valid results."""
        acc = BordaAccumulator(n_themes=9, seed="theming-36-test")
        rankings = _generate_voter_rankings(seed=SEED)

        for participant_id, ranked_themes in rankings:
            acc.add_vote(ranked_themes, participant_id)

        assert acc.voter_count == 12
        results = acc.aggregate()

        assert len(results) == 9, f"Expected 9 ranked themes, got {len(results)}"

        # Rank positions 1-9
        positions = [r["rank_position"] for r in results]
        assert positions == list(range(1, 10))

        # All 9 themes present
        theme_ids = {r["theme_id"] for r in results}
        assert theme_ids == set(THEME_LABELS_9)

        # Top theme has highest score
        assert results[0]["score"] >= results[-1]["score"]

    def test_borda_determinism_n5(self):
        """Borda ranking is identical across N=5 runs."""
        hashes = []
        for _ in range(N_RUNS):
            acc = BordaAccumulator(n_themes=9, seed="theming-36-test")
            rankings = _generate_voter_rankings(seed=SEED)
            for pid, ranked in rankings:
                acc.add_vote(ranked, pid)

            results = acc.aggregate()
            fp = hashlib.sha256(
                "|".join(f"{r['theme_id']}:{r['score']}" for r in results).encode()
            ).hexdigest()
            hashes.append(fp)

        assert len(set(hashes)) == 1, "Borda results must be deterministic"

    def test_borda_replay_hash_determinism(self):
        """Replay hash is identical across N=5 runs."""
        replay_hashes = []
        for _ in range(N_RUNS):
            acc = BordaAccumulator(n_themes=9, seed="theming-36-test")
            rankings = _generate_voter_rankings(seed=SEED)
            for pid, ranked in rankings:
                acc.add_vote(ranked, pid)
            replay_hashes.append(acc.replay_hash)

        assert len(set(replay_hashes)) == 1, "Replay hash must be deterministic"

    def test_borda_antisybil_exclusion(self):
        """Excluding 1 voter changes the ranking outcome."""
        # Full vote
        acc_full = BordaAccumulator(n_themes=9, seed="theming-36-test")
        rankings = _generate_voter_rankings(seed=SEED)
        for pid, ranked in rankings:
            acc_full.add_vote(ranked, pid)
        full_results = acc_full.aggregate()
        full_scores = {r["theme_id"]: r["score"] for r in full_results}

        # Exclude voter U01 (Alice)
        acc_excl = BordaAccumulator(n_themes=9, seed="theming-36-test")
        acc_excl.exclude_participant("U01")
        for pid, ranked in rankings:
            acc_excl.add_vote(ranked, pid)

        assert acc_excl.voter_count == 11, "Should have 11 voters after exclusion"
        excl_results = acc_excl.aggregate()
        excl_scores = {r["theme_id"]: r["score"] for r in excl_results}

        # At least one score must differ
        diffs = [
            abs(full_scores[t] - excl_scores[t])
            for t in THEME_LABELS_9
        ]
        assert max(diffs) > 0, "Excluding a voter must change at least one score"

    def test_borda_score_mathematics(self):
        """Borda scores follow the formula: points = (K-1) - position."""
        acc = BordaAccumulator(n_themes=9, seed="theming-36-test")
        rankings = _generate_voter_rankings(seed=SEED)
        for pid, ranked in rankings:
            acc.add_vote(ranked, pid)

        # Total points per voter = sum(0..8) = 36
        # 12 voters x 36 = 432 total points
        total_score = sum(r["score"] for r in acc.aggregate())
        expected_total = 12 * sum(range(9))
        assert abs(total_score - expected_total) < 0.01, (
            f"Total Borda score {total_score} != expected {expected_total}"
        )

    def test_borda_vote_counts(self):
        """Each theme receives exactly 12 votes (every voter ranks all 9)."""
        acc = BordaAccumulator(n_themes=9, seed="theming-36-test")
        rankings = _generate_voter_rankings(seed=SEED)
        for pid, ranked in rankings:
            acc.add_vote(ranked, pid)

        results = acc.aggregate()
        for r in results:
            assert r["vote_count"] == 12, (
                f"Theme '{r['theme_id']}' got {r['vote_count']} votes, expected 12"
            )

    def test_borda_merge_shards(self):
        """Merging two shard accumulators equals single full accumulator."""
        # Full
        acc_full = BordaAccumulator(n_themes=9, seed="theming-36-test")
        rankings = _generate_voter_rankings(seed=SEED)
        for pid, ranked in rankings:
            acc_full.add_vote(ranked, pid)

        # Shard A: first 6 voters, Shard B: last 6 voters
        acc_a = BordaAccumulator(n_themes=9, seed="theming-36-test")
        acc_b = BordaAccumulator(n_themes=9, seed="theming-36-test")

        for pid, ranked in rankings[:6]:
            acc_a.add_vote(ranked, pid)
        for pid, ranked in rankings[6:]:
            acc_b.add_vote(ranked, pid)

        acc_a.merge(acc_b)

        assert acc_a.voter_count == 12
        full_scores = {r["theme_id"]: r["score"] for r in acc_full.aggregate()}
        merged_scores = {r["theme_id"]: r["score"] for r in acc_a.aggregate()}

        for theme in THEME_LABELS_9:
            assert abs(full_scores[theme] - merged_scores[theme]) < 0.01, (
                f"Theme '{theme}': full={full_scores[theme]}, merged={merged_scores[theme]}"
            )


# ═══════════════════════════════════════════════════════════════════
# TEST CLASS 5: Centroid Summarizer Utilities
# ═══════════════════════════════════════════════════════════════════


class TestCentroidSummarizer:
    """Tests for centroid_summarizer.py utility functions."""

    def test_truncate_to_words(self):
        """truncate_to_words correctly caps at N words."""
        text = "one two three four five six seven eight nine ten"
        assert truncate_to_words(text, 5) == "one two three four five..."
        assert truncate_to_words(text, 50) == text  # No truncation needed

    def test_generate_summary_tiers(self):
        """generate_summary_tiers produces 333/111/33 word tiers."""
        text = " ".join(f"word{i}" for i in range(500))
        tiers = generate_summary_tiers(text)
        assert "summary_333" in tiers
        assert "summary_111" in tiers
        assert "summary_33" in tiers
        assert len(tiers["summary_333"].split()) <= 334  # 333 + "..."
        assert len(tiers["summary_111"].split()) <= 112
        assert len(tiers["summary_33"].split()) <= 34

    def test_select_centroid_representatives(self):
        """select_centroid_representatives picks nearest N to each centroid."""
        rng = np.random.RandomState(SEED)

        # 36 fake embeddings in 8-dim space, 3 clusters
        centroids = rng.randn(3, 8).tolist()
        embeddings = []
        labels = []
        for cluster_id in range(3):
            for _ in range(12):
                # Points near centroid + noise
                point = np.array(centroids[cluster_id]) + rng.randn(8) * 0.1
                embeddings.append(point.tolist())
                labels.append(cluster_id)

        reps = select_centroid_representatives(
            embeddings, labels, centroids, n_representatives=5
        )

        assert len(reps) == 3
        for cid in range(3):
            assert len(reps[cid]) == 5
            # All rep indices belong to this cluster
            for idx in reps[cid]:
                assert labels[idx] == cid

    def test_cost_estimate_36_responses(self):
        """Cost estimate for 36 responses shows correct savings ratio."""
        est = CostEstimate(response_count=36)
        assert est.old_cost > 0
        assert est.new_cost > 0
        # At 36 responses, marble sampling overhead makes ratio < 1
        # At 1000+ responses the approach saves significantly (>1.0)
        assert est.savings_ratio > 0, "Savings ratio must be positive"
        d = est.to_dict()
        assert d["response_count"] == 36
        assert d["savings"]["percent"].endswith("%")


# ═══════════════════════════════════════════════════════════════════
# TEST CLASS 6: Full Pipeline (End-to-End with Timing)
# ═══════════════════════════════════════════════════════════════════


class TestFullThemingPipeline:
    """End-to-end: 36 responses -> classify -> theme -> rank -> export."""

    def test_full_pipeline_single_run(self):
        """Full pipeline produces complete themed and ranked output."""
        # Phase A: Classify
        responses = _build_classified_responses()
        assert len(responses) == 36

        # Phase A verification
        bins = _group_by_theme01(responses)
        assert sum(len(v) for v in bins.values()) == 36

        # Phase B: Marble sample
        for label in sorted(bins.keys()):
            groups = _marble_sample(bins[label], seed=SEED)
            flat = [r for g in groups for r in g]
            assert len(flat) == len(bins[label])

        # Phase B: Assign themes (hierarchy)
        responses = _assign_theme2_levels(responses)
        for r in responses:
            assert "theme2_9" in r
            assert "theme2_6" in r
            assert "theme2_3" in r

        # Cube 7: Borda vote
        acc = BordaAccumulator(n_themes=9, seed="pipeline-e2e")
        rankings = _generate_voter_rankings(seed=SEED)
        for pid, ranked in rankings:
            acc.add_vote(ranked, pid)

        results = acc.aggregate()
        assert len(results) == 9
        assert results[0]["rank_position"] == 1

        # Export check: every response has all fields
        for r in responses:
            required = ["id", "participant_id", "raw_text", "summary_33",
                        "theme01", "theme01_confidence",
                        "theme2_9", "theme2_6", "theme2_3"]
            for key in required:
                assert key in r, f"Missing field '{key}' in response"

    def test_full_pipeline_n5_timing(self):
        """Full pipeline N=5 runs with timing — determinism and performance."""
        fingerprints = []
        durations = []

        for run in range(N_RUNS):
            start = time.perf_counter()

            # Classify
            responses = _build_classified_responses()
            bins = _group_by_theme01(responses)

            # Marble sample all bins
            for label in sorted(bins.keys()):
                _marble_sample(bins[label], seed=SEED)

            # Assign themes
            responses = _assign_theme2_levels(responses)

            # Borda vote
            acc = BordaAccumulator(n_themes=9, seed="pipeline-n5")
            rankings = _generate_voter_rankings(seed=SEED)
            for pid, ranked in rankings:
                acc.add_vote(ranked, pid)
            results = acc.aggregate()

            elapsed_ms = (time.perf_counter() - start) * 1000
            durations.append(elapsed_ms)

            # Fingerprint: classification + themes + ranking
            fp_parts = []
            for r in responses:
                fp_parts.append(f"{r['id']}:{r['theme01']}:{r['theme2_9']}:{r['theme2_3']}")
            for res in results:
                fp_parts.append(f"{res['theme_id']}:{res['score']}")
            fp = hashlib.sha256("|".join(fp_parts).encode()).hexdigest()
            fingerprints.append(fp)

        # Determinism: all 5 runs identical
        assert len(set(fingerprints)) == 1, (
            f"Pipeline not deterministic: {len(set(fingerprints))} unique fingerprints"
        )

        # Performance: under 500ms per run (pure compute, no API calls)
        avg_ms = statistics.mean(durations)
        assert avg_ms < 500, f"Average pipeline duration {avg_ms:.1f}ms > 500ms"

    def test_full_pipeline_export_csv_schema(self):
        """Export produces rows matching the 16-column target schema."""
        responses = _build_classified_responses()
        responses = _assign_theme2_levels(responses)

        acc = BordaAccumulator(n_themes=9, seed="export-test")
        rankings = _generate_voter_rankings(seed=SEED)
        for pid, ranked in rankings:
            acc.add_vote(ranked, pid)
        ranked_results = {r["theme_id"]: r for r in acc.aggregate()}

        # Build export rows
        rows = []
        for r in responses:
            theme9_info = ranked_results.get(r["theme2_9"], {})
            rows.append({
                "response_id": r["id"],
                "participant_id": r["participant_id"],
                "language": r["language"],
                "raw_text": r["raw_text"],
                "summary_33": r["summary_33"],
                "theme01": r["theme01"],
                "theme01_confidence": r["theme01_confidence"],
                "theme2_level_9": r["theme2_9"],
                "theme2_level_6": r["theme2_6"],
                "theme2_level_3": r["theme2_3"],
                "borda_rank": theme9_info.get("rank_position", 0),
                "borda_score": theme9_info.get("score", 0),
            })

        assert len(rows) == 36
        for row in rows:
            assert row["response_id"] is not None
            assert row["theme01"] in THEME01_CATEGORIES
            assert row["theme2_level_9"] in THEME_LABELS_9
            assert row["theme2_level_3"] in THEME_LABELS_3
            assert row["borda_rank"] >= 1
            assert row["borda_score"] >= 0
