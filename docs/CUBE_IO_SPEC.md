# Cube I/O Specification — Challenger Checkout Reference

> **Purpose:** This document defines the exact inputs, outputs, dependencies, and metrics for each Cube.
> A Challenger (Lead Developer) uses this to check out a Cube, modify it, and run simulation tests
> to beat the live version's SSSES metrics.
>
> **Rule:** You may only modify code INSIDE your checked-out Cube directory. All cross-cube interfaces
> (inputs you receive, outputs you produce) must remain identical. The simulation runner (Cube 10)
> verifies your modified Cube produces the same output format with equal or better metrics.

---

## Dependency Graph

```
Cube 1 (Session) ──→ Cube 5 (Gateway), Cube 6 (AI)
Cube 2 (Text)    ──→ Cube 5 (Gateway)
Cube 3 (Voice)   ──→ Cube 2 (Text), Cube 5 (Gateway)
Cube 4 (Collector) ── standalone (no cube imports)
Cube 5 (Gateway) ──→ Cube 6 (AI)
Cube 6 (AI)      ── standalone (no cube imports)
Cube 7 (Ranking) ──→ Cube 5 (Gateway)
Cube 8 (Tokens)  ── standalone (no cube imports)
Cube 9 (Reports) ──→ Cube 10 (Simulation replay)
Cube 10 (Sim)    ── standalone (no cube imports)
```

**Standalone Cubes (easiest to check out):** 4, 6, 8, 10
**Cubes with dependencies (must mock imports):** 1, 2, 3, 5, 7, 9

---

## Cube 1 — Session Join & QR

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube1_session/` |
| **Files** | `service.py` (700 lines), `router.py` |
| **Endpoints** | 18 routes |
| **Tests** | 59 (`tests/cube1/`) |
| **CRS** | CRS-01 → CRS-06 |
| **Depends on** | Cube 5 (time tracking), Cube 6 (semaphore release) |

### Inputs (what this Cube receives)
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `SessionCreate` | Pydantic schema | HTTP POST | Title, description, session_type, polling_mode, pricing_tier |
| `JoinRequest` | Pydantic schema | HTTP POST | display_name, language_code, results_opt_in |
| `short_code` | str (8 chars) | URL param | Human-readable session code |
| `session_id` | UUID | URL param | Session identifier |

### Outputs (what this Cube produces)
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| `Session` | ORM object | All cubes | Full session record with status, config, seed |
| `Participant` | ORM object | Cubes 2,3,4,5 | Joined participant with language, anonymity |
| `QR PNG` | bytes | Frontend | QR code image for session join |
| `short_code` | str | Frontend + KV | 8-char join code |
| Status broadcast | Supabase | Frontend | `status`, `session_update`, `presence` events |

### Baseline Metrics (for Challenger to beat)
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 59/59 | Must pass ALL |
| Test duration | ~350ms | Must not exceed 500ms |
| Short code generation | <50ms per code | Must not exceed 50ms |
| State transitions | Forward-only enforced | Must maintain |

---

## Cube 2 — Text Submission Handler

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube2_text/` |
| **Files** | `service.py` (779 lines), `router.py` |
| **Endpoints** | 4 routes |
| **Tests** | 66 (`tests/cube2/`) |
| **CRS** | CRS-05 → CRS-08 |
| **Depends on** | Cube 5 (time tracking) |

### Inputs
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `raw_text` | str (max 3333 chars) | HTTP POST body | User's typed response |
| `session_id` | UUID | URL param | Active polling session |
| `question_id` | UUID | Body | Current question being answered |
| `participant_id` | UUID | Body | Authenticated participant |
| `language_code` | str (2-3 alpha) | Body | User's language (WireGuard validated) |

### Outputs
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| `ResponseMeta` | ORM | Cube 4, 6, 9 | Response record with hash, timestamp |
| `clean_text` | str | Cube 6 (Phase A) | PII-scrubbed text |
| `response_hash` | str (SHA-256) | Cube 10 (replay) | Deterministic content hash |
| `summary_33` | str | Dashboard live feed | AI-generated 33-word summary (via Cube 6) |

### Baseline Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 66/66 | Must pass ALL |
| PII scrubbing | Deterministic (N=99) | Must be deterministic |
| Response hash | SHA-256, stable | Must not change for same input |

---

## Cube 3 — Voice-to-Text Engine

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube3_voice/` |
| **Files** | `service.py` (689), `realtime.py` (429), `providers/` (4 providers) |
| **Endpoints** | 4 routes + WebSocket |
| **Tests** | 106 (`tests/cube3/`) |
| **CRS** | CRS-08, CRS-15 |
| **Depends on** | Cube 2 (text pipeline), Cube 5 (time tracking) |

### Inputs
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `audio_bytes` | bytes (max 25MB) | HTTP POST multipart | Recorded audio (webm/mp3) |
| `language_code` | str | Body | Target transcription language |
| `provider` | str | Query param | STT provider (whisper/gemini/browser) |

### Outputs
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| `TranscriptionResult` | dataclass | Cube 2 pipeline | transcript, confidence, duration, provider |
| `VoiceResponse` | ORM | Cube 9 (export) | Audio metadata + transcript stored |
| All Cube 2 outputs | (via pipeline) | Cube 4, 6, 9 | PII-scrubbed text, summaries |

### Baseline Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 96/96 (+10 skipped live) | Must pass ALL |
| STT providers | 2 active (Whisper, Gemini) | Must maintain both |
| Circuit breaker | Failover chain working | Must maintain |

---

## Cube 4 — Response Collector

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube4_collector/` |
| **Files** | `service.py` (572 lines), `router.py` |
| **Endpoints** | 10 routes |
| **Tests** | 43 (`tests/cube4/`) |
| **CRS** | CRS-09, CRS-10 |
| **Depends on** | None (standalone) |

### Inputs
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `session_id` | UUID | URL param | Session to collect from |
| `page`, `page_size` | int | Query params | Pagination |

### Outputs
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| `CollectedResponse` | dict | Cube 6 (AI), Cube 9 (export) | Aggregated response with themes, summaries |
| `response_count` | int | Dashboard | Total responses for session |
| `response_languages` | dict | Analytics | Language distribution |
| `DesiredOutcome` | ORM | Cube 10 (metrics) | Moderator's expected outcome |

### Baseline Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 43/43 | Must pass ALL |
| Deduplication | MD5-based, deterministic | Must maintain |

---

## Cube 5 — Gateway / Orchestrator

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube5_gateway/` |
| **Files** | `service.py` (619 lines), `router.py`, `webhook_service.py` |
| **Endpoints** | 9 routes |
| **Tests** | 67 (`tests/cube5/`) |
| **CRS** | CRS-09 → CRS-11 |
| **Depends on** | Cube 6 (AI pipeline trigger) |

### Inputs
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `session_id` | UUID | Cube 1 (state transition) | Session entering ranking |
| `duration_seconds` | float | Timer | Participant active time |
| `action_type` | str | Cube 2/3 | "response", "voice_responding", etc. |

### Outputs
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| `(heart, human, triangle)` | tuple[float,float,float] | Cube 8 (ledger) | Token amounts earned |
| Pipeline trigger | async task | Cube 6 | Fires AI pipeline on session close |
| `TimeEntry` | ORM | Cube 9 (analytics) | Duration + token record |

### Baseline Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 67/67 | Must pass ALL |
| Token calculation | Deterministic | Must be deterministic |
| State machine | Validated transitions only | Must maintain |

---

## Cube 6 — AI Theming Clusterer

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube6_ai/` |
| **Files** | `phase_a.py` (261), `phase_b.py` (718), `pipeline.py` (330), `service.py` (facade), `cqs_engine.py`, `centroid_summarizer.py`, `theme_summarizer.py`, `scale_pipeline.py`, `providers/` |
| **Endpoints** | 5 routes |
| **Tests** | 154 (`tests/cube6/`) |
| **CRS** | CRS-11 → CRS-14 |
| **Depends on** | None (standalone — providers are internal) |

### Inputs
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `session_id` | UUID | Cube 5 (pipeline trigger) | Session to theme |
| `raw_text` | str | Cube 2 (fire-and-forget) | Single response for Phase A summary |
| `ai_provider` | str | Session config | "openai", "grok", "gemini", "claude" |
| `seed` | str | Session config | Determinism seed |

### Outputs
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| `ResponseSummary` | ORM | Dashboard, Cube 9 | 333/111/33 word summaries |
| `Theme` | ORM | Cube 7 (ranking), Cube 9 (export) | Theme labels with confidence |
| `replay_hash` | str | Cube 10 (verification) | SHA-256 of pipeline output |
| `summary_ready` broadcast | Supabase | Dashboard | Live summary notification |
| `themes_ready` broadcast | Supabase | Dashboard | Theming complete notification |

### Baseline Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 154/154 | Must pass ALL |
| Marble sampling | Seeded, deterministic (N=99) | Must be deterministic |
| Theme hierarchy | 9 → 6 → 3 reduction | Must maintain hierarchy |
| Batch embedding | Chunks of 1000 | Must not exceed single-call size |
| Phase A latency | <500ms per response | Must not exceed 1s |

---

## Cube 7 — Prioritization & Voting

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube7_ranking/` |
| **Files** | `ranking_submission.py` (152), `ranking_aggregation.py` (357), `ranking_governance.py` (713), `service.py` (facade), `scale_engine.py` |
| **Endpoints** | 11 routes |
| **Tests** | 164 (`tests/cube7/`) |
| **CRS** | CRS-11 → CRS-13, CRS-16, CRS-17, CRS-22 |
| **Depends on** | Cube 5 (CQS trigger) |

### Inputs
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `ranked_theme_ids` | list[str] | HTTP POST (User) | User's theme ranking order |
| `participant_id` | str | Auth | Who is voting |
| `theme_level` | str ("3"/"6"/"9") | Query param | Which hierarchy level to rank |

### Outputs
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| `AggregatedRanking` | ORM | Cube 9 (export) | Borda scores + deterministic ordering |
| `replay_hash` | str | Cube 10 (replay) | SHA-256 of ranking output |
| `ranking_complete` broadcast | Supabase | Dashboard | Ranking finished notification |
| `BordaAccumulator.aggregate()` | list[tuple] | Internal | Sorted (theme_id, score) pairs |

### Baseline Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 164/164 | Must pass ALL |
| Borda ranking | Deterministic (N=99, seeded) | Must be deterministic |
| Anti-sybil | Exclusion verified | Must maintain |
| Shard merge | Equivalent to single accumulator | Must maintain |
| 10K voters | <7s | Must not exceed 10s |

---

## Cube 8 — Token Reward Calculator

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube8_tokens/` |
| **Files** | `service.py` (811 lines), `router.py` |
| **Endpoints** | 18 routes |
| **Tests** | 194 (`tests/cube8/`) |
| **CRS** | CRS-18, CRS-19, CRS-24, CRS-25, CRS-32 → CRS-35 |
| **Depends on** | None (standalone) |

### Inputs
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `session_id` | UUID | Cube 5 | Session for token accounting |
| `user_id` | str | Auth | Token recipient |
| `delta_heart/human/unity` | float | Cube 5 (calculation) | Token amounts to award |
| `amount_usd` | float | Stripe webhook | Payment for HI token conversion |

### Outputs
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| `TokenLedger` | ORM (append-only) | Cube 9 (export) | Immutable ledger entry |
| Balance dict | dict | Dashboard, API | {total_heart, total_human, total_unity} |
| Session summary | dict | Moderator dashboard | Aggregated stats (SQL SUM) |
| `tokens_awarded` broadcast | Supabase | Dashboard | Token event notification |

### Baseline Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 194/194 | Must pass ALL |
| Lifecycle transitions | Forward-only state machine | Must maintain |
| SQL aggregation | SUM/GROUP BY (no Python-side) | Must use SQL |
| HI conversion | $7.25 = 1.0 웃 | Must maintain exact rate |

---

## Cube 9 — Reports & Dashboards

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube9_reports/` |
| **Files** | `service.py` (939 lines), `router.py`, `compression.py` |
| **Endpoints** | 14 routes |
| **Tests** | 93 (`tests/cube9/`) |
| **CRS** | CRS-14, CRS-15, CRS-19 → CRS-21 |
| **Depends on** | Cube 10 (replay service) |

### Inputs
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `session_id` | UUID | Dashboard action | Session to export |
| `content_tier` | str | Donation level | FREE through TALENT (8 tiers) |
| `summary_tier` | str ("33"/"111"/"333") | Query param | Summary word count |
| `export_format` | str ("csv"/"pdf") | Query param | Output format |

### Outputs
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| CSV bytes | io.BytesIO | Download | 19-column CSV with tier-filtered content |
| Streaming CSV | StreamingResponse | Download (>10K rows) | Chunked for large datasets |
| Analytics dashboard | dict | Moderator UI | Participation, timing, engagement |
| CQS dashboard | dict | Moderator UI | Quality scoring breakdown |

### Baseline Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 93/93 | Must pass ALL |
| CSV columns | 19 (exact) | Must not change |
| CSV hash | SHA-256 deterministic | Must be deterministic |
| 100K export | <15s | Must not exceed 20s |

---

## Cube 10 — Simulation Orchestrator

| Property | Value |
|----------|-------|
| **Directory** | `backend/app/cubes/cube10_simulation/` |
| **Files** | `service.py` (676 lines), `router.py`, `replay_service.py` |
| **Endpoints** | 11 routes |
| **Tests** | 121 (`tests/cube10/`) |
| **CRS** | CRS-25 (internal) |
| **Depends on** | None (standalone) |

### Inputs
| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `feedback_type` | str ("CRS"/"DI") | Any screen | User feedback classification |
| `cube_id` | int (1-10) | Feedback auto-tag | Which cube the feedback targets |
| `code_diff` | str | Challenger | Modified code for review |
| `challenge_id` | UUID | Admin | Challenge to accept/submit |

### Outputs
| Output | Type | Consumer | Description |
|--------|------|----------|-------------|
| Sandbox test results | dict | Metrics comparison | {tests_passed, tests_total, duration_ms, ssses} |
| Vote tally | dict | Admin approval | {approve_weighted, reject_weighted, result} |
| Challenge | ORM (PostgreSQL) | Challenger portal | Persisted challenge with status |
| Submission | ORM (PostgreSQL) | Review pipeline | Persisted code submission |

### Baseline Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Tests passed | 121/121 | Must pass ALL |
| Sandbox timeout | 60s max | Must not exceed 60s |
| Feedback persistence | PostgreSQL (not ephemeral) | Must persist |
| Vote tallying | Quadratic weights, supermajority | Must maintain |

---

## Challenger Checkout Process

```
1. Admin creates Challenge for Cube N
   → POST /api/v1/challenges {cube_id, title, acceptance_criteria}

2. Challenger claims Challenge
   → POST /api/v1/challenges/{id}/claim
   → Gets simulation_id + portal URL

3. Challenger modifies code in app/cubes/cubeN_name/
   → Must keep all I/O interfaces identical
   → May only change internal implementation

4. Challenger runs simulation tests
   → POST /api/v1/submissions {cube_id, code_diff}
   → Cube 10 runs: python -m pytest tests/cubeN/ --tb=short
   → Returns: {tests_passed, tests_total, duration_ms, ssses}

5. Metrics comparison against baseline
   → compare_metrics(baseline, submission)
   → ALL tests must pass (no decrease)
   → Duration must not exceed 120% of baseline
   → No SSSES pillar may decrease

6. If metrics pass → Community voting
   → tally_votes() with quadratic weights
   → Requires supermajority (66.7%) + quorum (33%)

7. If approved → Admin deploys
   → DeploymentLog entry created
   → Rollback available if issues found
```

---

## Shared Core (available to all Cubes)

All cubes may import from `app/core/`:

| Module | What It Provides |
|--------|-----------------|
| `auth.py` | `get_current_user`, `get_optional_current_user`, `CurrentUser` |
| `db.py` | `get_db` (AsyncSession dependency) |
| `config.py` | `settings` (env vars, API keys) |
| `rate_limit.py` | Global rate limiter |
| `middleware.py` | CORS, security headers |
| `security.py` | `anonymize_user_id`, crypto utils |
| `exceptions.py` | Custom HTTP exceptions |
| `circuit_breaker.py` | `CircuitBreaker` class |
| `supabase_broadcast.py` | `broadcast_event` for Realtime |
| `phase_a_retry.py` | Fire-and-forget Phase A with retry |
| `submission_validators.py` | `validate_text_input` |
