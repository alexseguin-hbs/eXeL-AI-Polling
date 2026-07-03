# CRS + Sub-CRS Delta — 2026-07-03 Cube 7 Closeout Session

> **Scope.** Captures every new / clarified CRS traceability row added during the Cube 7 finalization + Level 3 substrate design. Existing rows in `docs/CUBES_4-6.md` and `docs/CUBES_7-9.md` are unchanged; this file is the delta.

**Anchoring commit:** `3afa3c2` on `main`.

---

## Cube 6 · AI Pipeline (new sub-CRS)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-13.02.01** | CRS-13.02.01.IN | CRS-13.02.01.OUT | **Implemented** | 1 | LLM-parsed theme labels are deduplicated case-insensitively in `_parse_reduced_themes` before entering the reduction chain. | Zero duplicate labels in `themes` table per (session, cycle, level); replay hash byte-identical across N=5 reruns. | Enki edge-case fix — duplicates were inflating counts + breaking replay hash. |
| **CRS-13.04** | CRS-13.04.IN | CRS-13.04.OUT | **Implemented** | 1 | Always-9 padding: every session emits exactly 9 / 6 / 3 sub-themes per Theme01 category, padded with `is_empty=True` placeholders when responses are insufficient. | Every `themes` row-set contains exactly 3 Theme01 parents × (9+6+3) = 57 sub-themes per cycle. | Flower of Life geometry contract; frontend dims empty petals to 25% opacity. |
| **CRS-13.05** | CRS-13.05.IN | CRS-13.05.OUT | **Implemented** | 1 | `themes_ready` broadcast payload carries `short_code`, `cycle_id`, `contract_version` in addition to legacy fields. | Krishna contract audit passes: payload matches `CUBE_6_7_8_SIM_PLAYBACK_CONTRACT.md`. | Contract-drift fix. |

## Cube 7 · Ranking (new sub-CRS)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-11.05** | CRS-11.05.IN | CRS-11.05.OUT | **Implemented** | 1 | `submit_user_ranking` excludes empty placeholder themes (`Theme.label = ""`) from the `valid_ids` set. Participants can only rank themes carrying actual feedback. | Zero empty-slot theme IDs accepted as valid submissions; 100% of submissions with empty IDs return 400 with `missing`/`extra` set diff. | Enki fix — prevents empty placeholders from corrupting Borda count. |
| **CRS-12.05** | CRS-12.05.IN | CRS-12.05.OUT | **Implemented** | 1 | Slice-pinned replay hash: `_compute_replay_hash` folds `theme01_category` + `theme_level` into the SHA-256 payload so replays are pinned to the aggregated slice. | Identical (rankings, seed, category, level) tuple produces byte-identical hash across N=5 reruns; changing category or level produces a different hash. | Step 5 (2026-07-03) determinism upgrade. |
| **CRS-11.06** | CRS-11.06.IN | CRS-11.06.OUT | **Implemented** | 1 | `ranking_complete` broadcast payload carries `algorithm`, `theme01_category`, `theme_level`, `replay_hash`, `anomaly_count`, `excluded_participants`, `participant_count`, `contract_version`. | Krishna contract audit passes: payload matches `CUBE_6_7_8_SIM_PLAYBACK_CONTRACT.md`. | Contract-drift fix. |
| **CRS-11.07** | CRS-11.07.IN | CRS-11.07.OUT | **Implemented** | 1 | Cube 7 → Cube 8 handoff (`trigger_cqs_scoring`) carries `cycle_id`, `algorithm`, `participant_count`, `replay_hash` as trigger metadata. | Downstream Cube 8 disbursement records the exact aggregation slice used; audit trail complete. | Contract-drift fix. |
| **CRS-22.03** | CRS-22.03.IN | CRS-22.03.OUT | **Implemented** | 1 | SIM WireGuard whitelists: `VALID_SIM_MODES = {playback, live, dual_view}`, `VALID_SIM_ROLES = {moderator, user1, user2}`. | N=99 tests per whitelist reject 20+ injection payloads (SQL / XSS / null byte / whitespace variants) with 100% precision. | Matches Cube 1-6 WireGuard pattern. |

## Cube 9 · Reports (new sub-CRS)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-14.03** | CRS-14.03.IN | CRS-14.03.OUT | **Implemented** | 1 | 20-column CSV schema: adds `Theme01_Category` (normalized `risk\|support\|neutral` via Cube 6's `_category_key` resolver) between `Theme01` and `Theme01_Confidence`. Always FREE. | Every exported row has a non-null category value matching the canonical mapping; existing 19-column consumers can migrate by ignoring column 10. | Slice-pinned programmatic filter aid for downstream analytics. |

## Frontend · Cross-Cube (new)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric |
|---|---|---|---|:-:|---|---|
| **CRS-29.01** | CRS-29.01.IN | CRS-29.01.OUT | **Implemented** | 2 | `useSessionBroadcast` hook subscribes to `ranking_progress` + `ranking_complete` broadcast events; dashboard consumer wires callbacks. | Events received in dashboard tree; `RankingProgressPayload` / `RankingCompletePayload` TypeScript contracts published. |
| **CRS-29.02** | CRS-29.02.IN | CRS-29.02.OUT | **Implemented** | 2 | `/sim` split-screen route: Moderator LEFT iframe + User 1 RIGHT iframe + QR + phone-link for User 2 second device. Easter-egg gated. | Route redirects to `/` when `simulationMode` + `cube10Access` are both unset; renders 3-way live sync when gate passes. |
| **CRS-29.03** | CRS-29.03.IN | CRS-29.03.OUT | **Implemented** | 1 | Bilingual reader inserts explicit space between sentences for non-CJK languages after regex split. | Rendered sentences never show `.` immediately followed by capital letter (except URL / initialism false positives). |
| **CRS-06.02** | CRS-06.02.IN | CRS-06.02.OUT | **Implemented** | 1 | `frame-ancestors 'self'` CSP + `X-Frame-Options: SAMEORIGIN` — cross-origin embedding still blocked; same-origin iframes enabled for `/sim` split-screen. | Any external site attempting to iframe an eXeL Polling page receives frame-ancestors violation. |

---

## Cube 19-27 · Level 3 (new — first draft, framework layer only)

The Level 3 substrate is documented at `docs/CUBE_19_27_LEVEL_3_FRAMEWORK.md` (contract `L3-2026-07-03.7`). No implementation code exists yet. Each cube gets a placeholder CRS row:

| Cube | Placeholder CRS | Status | MVP |
|:-:|---|---|:-:|
| 19 · Innovation Life Cycle | CRS-L3.19 | **Planned** | 3 |
| 20 · Concept Ingest | CRS-L3.20 | **Planned** | 3 |
| 21 · Model Ingest | CRS-L3.21 | **Planned** | 3 |
| 22 · Proposal Collector | CRS-L3.22 | **Planned** | 3 |
| 23 · De-Risk Gateway | CRS-L3.23 | **Planned** | 3 |
| 24 · Estimator AI | CRS-L3.24 | **Planned** | 3 |
| 25 · Governance & Quote Board | CRS-L3.25 | **Planned** | 3 |
| 26 · Execution Marketplace | CRS-L3.26 | **Planned** | 3 |
| 27 · Delivery & Actuals | CRS-L3.27 | **Planned** | 3 |

Each Level 3 cube inherits and extends behaviors from its Level 1 counterpart (Cube N mod 9 for N > 18). See the framework doc for the reuse matrix.

---

## Change summary — everything shipped 2026-07-03

**Backend:**
- Cube 5 `trigger_cqs_scoring` — extended kwargs (cycle_id, algorithm, participant_count, replay_hash)
- Cube 6 `_parse_reduced_themes` — dedupe by case-insensitive label
- Cube 6 `_pad_themes_to_target` — new fn, always emits 9/6/3 with `is_empty` placeholders
- Cube 6 `_reduce_themes` — invokes padder for empty categories
- Cube 6 `_store_results` — empty themes stored with `label=""` + `cluster_metadata.is_empty=True`
- Cube 6 `themes_ready` broadcast — full contract payload
- Cube 7 `submit_user_ranking` — filter `Theme.label != ""` from valid_ids
- Cube 7 `_compute_replay_hash` — slice-pinned (category + level)
- Cube 7 `emit_ranking_complete` — full contract payload
- Cube 7 router — VALID_SIM_MODES + VALID_SIM_ROLES whitelists
- Cube 9 `CSV_COLUMNS` — 20 columns (adds Theme01_Category)
- Cube 9 `export_session_csv` — populates Theme01_Category via `_category_key`

**Frontend:**
- New `/sim` route (`frontend/app/sim/page.tsx`) — split-screen with iframes + QR
- `useSessionBroadcast` — ranking_progress + ranking_complete subscriptions
- `dashboard/page.tsx` — passes new callbacks to hook
- `theme-circle.tsx` — dims empty placeholder petals (opacity 0.25 + grayscale)
- `types.ts` — `ThemeInfo.isEmpty?: boolean`
- `lexicon-data.ts` — 5 new keys (`cube10.sim.split_moderator/user1/user2_phone/exit/link_copied`)
- `bilingual-reader.tsx` — inter-sentence space fix
- `public/_headers` — SAMEORIGIN + frame-ancestors 'self'
- `public/audio/*.mp3` — real songs replace 5-month-old faulty MP3s

**Docs:**
- `docs/CUBE_6_7_8_SIM_PLAYBACK_CONTRACT.md` — new
- `docs/CUBE_7_METRICS_BASELINE.md` — new (frozen perf baseline)
- `docs/CUBE_7_FINAL_SSSES_REPORT.md` — new
- `docs/CUBE_19_27_LEVEL_3_FRAMEWORK.md` — new (v.7)
- `docs/CRS_TRACEABILITY_2026-07-03.md` — this file
- `docs/CUBES_7-9.md` — 20-column CSV note + Theme01_Category row
- `CLAUDE.md` — 20-column schema line

**Tests:**
- `tests/cube6/test_phase_b_e2e.py::TestPadThemesToTarget` — 7 new tests
- `tests/test_wireguard_whitelist.py` — +6 tests for SIM whitelists
- Cube 9 schema tests — updated to expect 20 columns

**Determinism proof:** 3× forward + 3× reverse SPIRAL sweep on Cubes 1-7 = 4,590 test executions, 0 failures, 0 drift.
