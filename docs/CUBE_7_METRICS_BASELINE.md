# Cube 7 · Ranking Optimization Metrics Baseline

> **Purpose.** A SUPER developer (or Cube 10 Challenger) can check out Cube 7, attempt optimizations, and then run this identical benchmark to compare. This document is the frozen reference so parallel input/output verification is possible.
>
> **Rule.** To "beat" this baseline, the Challenger must produce (a) identical replay hashes on the same seed and (b) strictly better metrics on ≥3 of the 5 measured axes with no regression on the other 2.

**Baseline captured:** 2026-07-03 · commit `9a85c18+` · Python 3.12.3 · WSL2 Linux 6.6.87.2 · single core measurement.

---

## 1 · Throughput (BordaAccumulator streaming)

| Voters × Themes | Avg | σ | Throughput | Notes |
|:-:|:-:|:-:|:-:|---|
| 100 × 3 | 590.8 µs | 496.6 µs | 169,260 votes/sec | Typical small poll (Free tier) |
| 100 × 9 | 594.0 µs | 122.0 µs | 168,344 votes/sec | Full Flower-of-Life geometry |
| 1,000 × 9 | 5.34 ms | 0.58 ms | 187,120 votes/sec | Mid-size — best throughput observed |
| 100,000 × 9 | 606.0 ms | 21.6 ms | 165,006 votes/sec | Enterprise session |
| 1,000,000 × 9 | 6098.9 ms | 124.6 ms | 163,963 votes/sec | Burst-capacity target |

**Observations:**
- Throughput is essentially linear O(N) — flat ~165K votes/sec across all scales. Confirms `add_vote` is O(K) per call, not O(N).
- σ/mean stays under 5% at scale — hot path is deterministic; noise is GIL + allocator.
- 1M under 7s = **8.5× headroom** vs the CRS-12.03 target of 60s.

**Optimization targets (in decreasing ROI for a Challenger):**
1. **Inner loop of `add_vote`** — `for position, theme_id in enumerate(ranked_theme_ids)` runs 9M times at 1M scale. Vectorizing (numpy or Cython) is the highest-value swing.
2. **Hash streaming (`_hash_state.update`)** — every vote hashes; consider batched hash updates.
3. **Two dict updates per position** (`_scores`, `_vote_counts`) — could collapse into a single `Counter`-style structure keyed by (theme, position).

---

## 2 · Determinism (immutable — CANNOT regress)

| Metric | Baseline | How to verify |
|---|---|---|
| Replay hash algorithm | `sha256(algorithm:seed:cat=X:lvl=Y:rankings_sorted)` | `_compute_replay_hash` |
| N=5 determinism | 5/5 identical hashes | `test_n5_determinism`, `test_replay_hash_n5` |
| Cross-shard merge equivalence | 2-shard = 10-shard = single | `TestAccumulatorMerge` |
| Streaming vs batch equivalence | 1000 voter exact match | `TestStreamingBatchEquivalence` |
| Slice-pinned hash | (cat, lvl) folded into hash | `_compute_replay_hash(theme01_category, theme_level)` |
| Tamper detection | Modified ranking breaks hash | `test_tampered_ranking_breaks_chain` |

**Rule.** A Challenger that speeds Borda up but produces a different replay hash **fails** the SIM check. This is non-negotiable.

---

## 3 · Correctness invariants

| Invariant | Value | Test |
|---|:-:|---|
| Total Borda points | `N × K × (K-1) / 2` | `test_borda_total_is_invariant` |
| Weighted total | `Σ weights × K × (K-1) / 2` | `test_weighted_scores_sum_to_weighted_total` |
| Sort stability under all-tied | Deterministic via seed | `test_all_tied_9_themes_stable` |
| Influence cap | 15% max per participant | `test_influence_cap_protects_democracy` |
| Zero stake behavior | Minimum weight, never 0 | `test_zero_stake_gets_minimum_weight` |
| Anomaly precision | 0 false positives in diverse 50 | `test_50_diverse_voters_zero_false_positives` |
| Governance reorder | Preserves count + valid positions | `TestGovernanceAtomicity` |

---

## 4 · Anomaly detection cost

| Op | Cost |
|---|:-:|
| `detect_voting_anomalies` per session | O(N × K) — one pass over all rankings |
| Sybil burst threshold | ≥3 identical rankings within 10s window |
| False-positive tolerance | 0 in the fixture set |

Bulk O(N × K) makes anomaly detection the **second-fastest** phase (after add_vote). If a Challenger accelerates aggregation but does not maintain the same anomaly precision, it fails.

---

## 5 · Broadcast latency

| Path | Target | Actual |
|---|:-:|:-:|
| `ranking_progress` (Supabase Broadcast) | ≤200ms | ~50ms observed |
| `ranking_complete` (Supabase Broadcast) | ≤500ms | ~50-100ms observed |
| Sharded broadcast to 100 shards | ≤2s | Not yet measured under load |

---

## 6 · Test suite metrics (SSSES-anchored)

| Signal | Value |
|---|:-:|
| Test count | **188** (Cube 7 only) |
| Wall time (full suite) | **6.89 – 7.26 s** (varies ±5%) |
| Line coverage (unit) | Not yet measured (Challenger deliverable) |
| WireGuard whitelist tests | 20 (Cube 7 specific) + 6 (SIM) = 26 |
| Determinism tests | 5 (`n5` runs across 3-, 6-, 9-theme, quadratic, full pipeline) |

---

## 7 · Memory profile (single accumulator, 1M voters × 9 themes)

- `_scores` dict: 9 float entries → **~500 bytes**
- `_vote_counts` dict: 9 int entries → **~500 bytes**
- `_hash_state`: SHA-256 hasher → **112 bytes**
- **Total resident state: < 2 KB regardless of voter count.**

This is Cube 7's most defensible property — an optimization that spikes memory sacrifices the streaming guarantee.

---

## 8 · Slice-pinned hash inputs (Step 5 · 2026-07-03)

Baseline hash formula:

```
sha256(
    "borda_count" | "quadratic_borda"     # algorithm
  + ":" + effective_seed
  + ":cat=" + (theme01_category or "")   # empty when not slice-scoped
  + ":lvl=" + (theme_level or "")        # empty when not slice-scoped
  + ":" + "|".join(sorted(rankings_as_comma_joined_strings))
)
```

A Challenger who changes the input order, delimiter, or canonicalization breaks replay across the deployed base. **Do not touch this without a coordinated migration.**

---

## 9 · How a Challenger runs the parallel test

```bash
# 1. Checkout Cube 7 in isolation
cd backend && cp -r app/cubes/cube7_ranking app/cubes/cube7_ranking_challenger

# 2. Modify only files inside cube7_ranking_challenger/

# 3. Run the exact suite against both
python -m pytest tests/cube7/ --tb=short
python -m pytest tests/cube7_challenger/ --tb=short  # same tests, aliased imports

# 4. Run the perf script (below) against both and diff

# 5. Verify replay-hash parity on the reference dataset:
python -c "from app.cubes.cube7_ranking.ranking_aggregation import _compute_replay_hash; ..."
python -c "from app.cubes.cube7_ranking_challenger.ranking_aggregation import _compute_replay_hash; ..."
# Both must return the same hash for the same inputs — else FAIL.

# 6. Report the delta as: throughput +X%, replay_hash MATCH, tests PASS.
```

---

## 10 · Success criteria (Challenger wins if…)

- ≥ **20% throughput improvement** on the 100K × 9 benchmark, AND
- Zero test failures, AND
- Identical replay hash for the reference fixture, AND
- Memory delta within ±10% of baseline, AND
- No SSSES pillar drops below the current score.

Anything less = not a win. This bar is intentional — Cube 7 is on the hot path for every session and any regression cascades.
