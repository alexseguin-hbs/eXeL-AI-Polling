# Cube 6 → 7 → 8 · SIM Playback I/O Contract

> **Purpose.** Pin the exact payload shapes and event boundaries so Cube 10 SIM can replay a full Cube 6 → 7 → 8 pipeline deterministically (same inputs → same outputs → same replay hash), and so the SIM split-screen can render both moderator + user views against the same source of truth.
>
> **Scope.** This is the *playback contract* — not the raw DB schema. It is the frozen wire format that SIM writes on record and reads on replay.
>
> **Determinism.** Every payload here participates in the replay hash chain. Changes to any field require a version bump on `CONTRACT_VERSION`.

---

## Contract Version

```
CONTRACT_VERSION = "2026-07-03.1"
```

Bump when: adding required fields, changing types, changing ordering rules.
Do NOT bump when: adding optional fields with safe defaults.

---

## The Three Handoffs

```
  ┌────────────┐  themes_ready  ┌────────────┐  ranking_complete  ┌────────────┐
  │  Cube 6    │ ──────────────>│  Cube 7    │ ──────────────────>│  Cube 8    │
  │  AI Themes │                │  Ranking   │  (via Cube 5 gw)   │  Tokens    │
  └────────────┘                └────────────┘                    └────────────┘
       ▲                              ▲                                 ▲
       │                              │                                 │
       └── SIM playback replays each event in order ─────────────────────┘
```

---

## Handoff 1 · Cube 6 → Cube 7 (`themes_ready`)

**Trigger.** Cube 6 pipeline completes Step 8 (`_store_results`).
**Transport.** Supabase Broadcast on channel `session:{short_code}` + persistent write to `themes` + `theme_samples` tables.
**Consumer.** Frontend flower-of-life UI. Cube 7 reads from DB when the moderator triggers ranking.

### Broadcast payload

```json
{
  "event": "themes_ready",
  "session_id": "uuid",
  "short_code": "DEMO2026",
  "cycle_id": 1,
  "theme_count": 27,
  "total_responses": 5000,
  "replay_hash": "sha256:...",
  "duration_sec": 4.87,
  "contract_version": "2026-07-03.1"
}
```

### Themes table row (per theme)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `session_id` | UUID | FK |
| `cycle_id` | int | Default 1 |
| `label` | str(255) | Empty string when `is_empty=True` |
| `summary` | text | Empty when `is_empty=True` |
| `confidence` | float | 0.0 for empty slots |
| `response_count` | int | 0 for empty slots |
| `parent_theme_id` | UUID? | Points to Theme01 parent |
| `cluster_metadata` | JSON | `{level, slot_index, is_empty}` |
| `ai_provider` | str | `openai` / `gemini` / `grok` / `claude` |
| `ai_model` | str | Model version snapshot |

### Cluster metadata (JSON)

```json
{
  "level": "9" | "6" | "3",
  "slot_index": 0..8,
  "is_empty": true | false
}
```

**Always-9 padding rule.** Every session emits **exactly 3 (Theme01 categories) × (9 + 6 + 3) = 54 theme rows** at Level 2, plus 3 Theme01 parents = **57 total per cycle**. When a category or level has too few real themes, the remainder is padded with `is_empty=True` placeholders. Flower-of-Life renders these at `opacity: 0.25, filter: grayscale(1)`.

### Replay hash inputs (Cube 6)

```
sha256(
    algorithm="cube6.pipeline.v1"
  + seed
  + provider_name + provider_model
  + "|".join(sorted(theme01_labels))
  + "|".join(sorted(theme2_labels, per_level))
  + is_empty_flags_bitmap
)
```

---

## Handoff 2 · Cube 7 → Cube 8 (`ranking_complete`)

**Trigger.** Moderator triggers `POST /rankings/aggregate` OR auto-aggregation on all-submitted.
**Transport.** Supabase Broadcast on `session:{short_code}` + persistent write to `aggregated_rankings` table + routed to Cube 8 via `cube5_gateway.trigger_cqs_scoring()`.

### Broadcast payload

```json
{
  "event": "ranking_complete",
  "session_id": "uuid",
  "short_code": "DEMO2026",
  "cycle_id": 1,
  "algorithm": "borda_count" | "quadratic_borda",
  "participant_count": 15,
  "theme01_category": "risk" | "support" | "neutral" | null,
  "theme_level": "3" | "6" | "9",
  "top_theme2_id": "uuid",
  "top_theme2_label": "Data Privacy Controls",
  "replay_hash": "sha256:...",
  "anomaly_count": 0,
  "excluded_participants": 0,
  "contract_version": "2026-07-03.1"
}
```

### Ranking progress (streamed during voting)

```json
{
  "event": "ranking_progress",
  "session_id": "uuid",
  "cycle_id": 1,
  "submissions": 8,
  "expected": 15
}
```

### Cube 7 → Cube 8 handoff (through Cube 5)

Cube 5 gateway function: `trigger_cqs_scoring(db, session_id, top_theme2_id)`

Payload passed to Cube 8's `disburse_cqs_reward()`:

```python
{
  "session_id": UUID,
  "top_theme2_id": UUID,
  "cycle_id": 1,
  "algorithm": str,
  "participant_count": int,
  "replay_hash": str,
}
```

### Replay hash inputs (Cube 7)

```
sha256(
    algorithm
  + seed
  + "cat=" + (theme01_category or "")
  + "lvl=" + (theme_level or "")
  + "|".join(sorted(rankings))   # rankings sorted, canonicalized
)
```

---

## Handoff 3 · Cube 8 side effects

Cube 8 writes to `token_ledger` and (if configured) `talent_profile`:

```json
{
  "ledger_entries": [
    {
      "participant_id": "uuid",
      "delta_heart": 3,
      "delta_human": 0,
      "delta_unity": 1,
      "source_event": "cqs_reward",
      "source_session_id": "uuid",
      "cycle_id": 1,
      "created_at": "iso8601"
    }
  ]
}
```

No downstream broadcast — Cube 8 is a terminal sink for the ranking flow.

---

## SIM Playback Requirements

To replay a Cube 6→7→8 sequence in SIM the fixture must include:

1. **Cube 6 output** — the `themes_ready` broadcast payload + the DB themes rows (all 57 per cycle).
2. **User rankings** — an array of `RankingSubmit` payloads keyed by participant.
3. **Cube 7 output** — the `ranking_complete` payload with `replay_hash`.
4. **Cube 8 output** — the ledger entries produced.

SIM playback loads these in order, verifies each replay hash matches the recorded hash, and renders the split-screen (moderator LEFT / user RIGHT) as each event fires.

### Fixture file layout

```
frontend/lib/sim-data/
  ├── index.ts              # ALL_SIM_POLLS + resolveThemesForLevel
  ├── demo_2026/            # per-session directory
  │    ├── themes.json      # Cube 6 output (themes_ready + rows)
  │    ├── rankings.jsonl   # Cube 7 input (one submission per line)
  │    ├── aggregated.json  # Cube 7 output (ranking_complete)
  │    └── ledger.json      # Cube 8 side-effects
  └── past0001/
       └── ...
```

### Replay hash verification

Every fixture ships with pre-computed hashes. SIM runs:

```python
recomputed = _compute_replay_hash(fixture.rankings, fixture.seed, ...)
assert recomputed == fixture.recorded_hash, "Replay drift detected"
```

Drift = code changed; investigate before shipping.

---

## Cross-cube invariants (must hold end-to-end)

| Invariant | Where enforced | Test |
|---|---|---|
| Every session emits exactly 57 theme rows/cycle | `_pad_themes_to_target` + `_reduce_themes` | `test_phase_b_e2e.py::TestPadThemesToTarget` |
| `ranking_complete.replay_hash` deterministic per (rankings, seed, category, level) | `_compute_replay_hash` | `test_ssses_optimization.py::TestReplayHashChain` |
| Cube 8 ledger sum = participant_count × cqs_reward | `disburse_cqs_reward` | `test_cube8/test_token_ledger.py` |
| SIM playback replay hash = original replay hash | `verify_replay` | `test_cube7/test_router_endpoints.py::TestVerifyReplay` |
| Empty theme slots invisible to ranking submission | `submit_user_ranking` validation | `test_ranking_service.py` |
| No SIM mutation outside easter-egg gate | Frontend gate + backend `VALID_SIM_MODES` | `test_wireguard_whitelist.py::TestWireGuardCube7SimModeN99` |

---

## Change log

| Version | Date | Change |
|---|---|---|
| `2026-07-03.1` | 2026-07-03 | Initial contract. Introduces `contract_version`, always-9 padding, slice-pinned replay hash (category+level), SIM whitelist enforcement. |
