# Polling, activated for real: live priority voting (Theme01→Theme02→Rank), API-driven 3/6/9 theme visuals with 33/111/333 per-theme descriptions, revision history, a verified per-cube SIM, and a real 1M-user load/infra proof — all AsM-tested on Fable 5.1

## Context — why this work

The fundraise gate is **a working demo credible at 1M unique users, running on the real engine** (operator, 2026‑09‑13). Exploration this session (6 read-only Explore agents) established the honest current state:

- **The 3/6/9 theme visuals are mock in the shipped demo.** The backend Cube‑6 pipeline is real and deterministic — it genuinely produces the all→9→6→3 hierarchy (`backend/app/cubes/cube6_ai/phase_b.py:426` `_reduce_themes`) and stores per‑theme 333/111/33 summaries (`backend/app/models/theme.py:37-39`, generator `cube6_ai/theme_summarizer.py:138`). But the frontend defaults to `NEXT_PUBLIC_MOCK_MODE=true` (`frontend/lib/api.ts:10`), `mock-data.ts` has no `/themes`·`/rankings`·`/ai/*` handlers, and the showcase codes (`DEMO2026`/`PAST0001`/`STATIC01`) short‑circuit to a seeded in‑browser dataset (`frontend/components/flower-of-life/flower-visualization.tsx:36,92,99`, `frontend/lib/sample-session-data.ts`). Per‑theme 111/333 are generated+stored but **not exposed** (`ThemeRead` omits them, `backend/app/schemas/theme.py:7-25`; `/themes/summarize` is a dry‑run, `router.py:145,149`).
- **Voting works on the backend but is unreachable in the demo and is one‑shot.** Cube‑7 has the full deterministic surface (Borda/quadratic + 15% influence cap + seeded tiebreak + replay hash + anti‑sybil, `backend/app/cubes/cube7_ranking/ranking_aggregation.py`, `ranking_governance.py`) and broadcasts `ranking_progress`/`ranking_complete`/`ranking_override` on `session:{short_code}`. But `mock-data.ts` has no `/rankings` handler (real‑session vote 404s), the live‑consume hook `frontend/lib/use-realtime-ranking.ts` is **orphaned** (no importer), the results phase shows Cube‑6 order not aggregated rank (`session-view.tsx:1244`), and voting is **one ballot per cycle with `cycle_id` hardcoded to 1** (`ranking_submission.py:43,119-133`) — no re‑vote, no cycle advance, no re‑open, no continuous re‑aggregation.
- **"1M" is single‑process simulation, not load.** Every 1M test is a Python `for` loop + throughput math (`backend/tests/test_1m_simulation.py`, `test_1m_all_cubes.py`); the largest real end‑to‑end run is **3 emulated phones on a local relay** (`frontend/scripts/pod-live-run-2026-09-11.mjs`). No load generator, no concurrency, Tier‑4 scale path is "⚠ operator infra" (`docs/HWR_SCALE_OPTIMIZATION.md:35`), observability is aspirational.
- **The per‑cube SIM easter‑egg works but shows real code for only ~6 of ~30 functions.** Unlock (Cyan→Sunset→Violet → blinking badge → `/session` → CUBE SIM → `/sim`) is solid (`frontend/lib/easter-egg-context.tsx:70`, `components/powered-badge.tsx`, `components/cube-dev-sim.tsx`), but the mock contract function names don't match the baked source keys (`frontend/lib/mock-data.ts:749-757` vs `frontend/lib/sim-live-source.ts`), so cubes 3/4/6/7/8 render placeholders; it covers cubes 1–9 only; no tests guard it.
- **Determinism/replay is the genuinely strong, real part** (SHA‑256 N=99, cross‑cube hash chain, 9‑cube replay — `test_1m_all_cubes.py`, `cube10_simulation/replay_service.py`).

### Operator decisions (this session)
1. **Demo data = the REAL backend**, using the existing Cube 1–10 response‑intake path — not the mock showcase. **Plus an AI + HI supplemented‑input option**: a moderator can enrich/de‑risk a survey with AI‑generated and Human‑Intelligence supplemental responses (creative input), reusing the Innovation‑Pod AsM‑assisted pattern feeding Cube‑6.
2. **1M = real load test + real infra** (the big lift) — a genuine concurrent load generator, the Tier‑4 scale path deployed, and a live metrics dashboard. Not a simulated-only dashboard.
3. **33/111/333 = all three tiers per theme** — every theme, at any 3/6/9 level, offers a 33/111/333 description toggle (like the response drawer's tier switch).
4. **Living voting = live priorities selected by users, staged Theme01 → Theme02 → Ranking** (the CRS journey), aggregating live.

### Execution constraints (from CLAUDE.md, MoT‑enforced)
- Execution fleets (AsM review, simulation/verification, translation‑style batches) run on **Fable 5.1** (`model:"fable"`); AsM prompts use **"reviewer‑lens / simulated reviewer" wording** (not "Ascended Masters") to clear Fable's safeguard, as proven earlier this session.
- **Never modify the SACRED Trinity‑Redundancy code without live verification**: `frontend/app/dashboard/page.tsx` Channels A–D + `addResponse`/`addSpiralResponse` (~`:245-296`), `frontend/components/session-view.tsx` Paths A–C, `frontend/lib/mock-data.ts` `startSpiralTest`. New ranking UI uses the separate `session:{short_code}` channel and lives only in the JSX render region (~`dashboard/page.tsx:974-985`).
- PERSIST FIRST; **run full `test:ci` before every push** (a partial‑gate push failed Deploy earlier this session); FIX THE CLASS; NO REWORK (reuse the primitives below); commit+push **both refs** (`main` + `claude/debug-wsl-issues-yYdPP`); report `SHA | committed | pushed | LIVE` via `cd frontend && npm run status` + GitHub Actions "Deploy"/"Verify Live" (sandbox 403s the host → say UNVERIFIED and confirm via Actions).

## Workstreams

### WS‑A — Activate the real pipeline for the demo (flip mock → live, expose what's missing)
- Add an explicit **live‑demo mode**: drive the demo session against the real backend (`NEXT_PUBLIC_MOCK_MODE=false`) rather than the seeded showcase; keep the showcase only as an offline fallback (do not delete). Confirm the real intake path Cube 1 (create/join) → Cubes 2/3 (text/voice) → Cube 4 (collect) → Cube 5 (orchestrate) → Cube 6 (theme) works end‑to‑end against hosted Supabase.
- **Expose per‑theme tiers**: extend `ThemeRead` (`backend/app/schemas/theme.py`) with `theme_summary_33/111/333`; map them in `frontend/lib/adapt-live-themes.ts` into an extended `ThemeInfo` (`frontend/lib/types.ts:168`). Make `/sessions/{id}/themes/summarize` call the real provider (BYOK) instead of the `ai_provider_fn=None` dry run (`cube6_ai/router.py:145`).
- **Dependency (operator infra):** hosted backend URL, Supabase URL/key, and an AI‑provider BYOK key. Flag in the plan output; the live demo cannot be proven from the sandbox (proxy 403s hosts).

### WS‑B — 3/6/9 theme visuals, API‑driven, with all‑three‑tier per‑theme descriptions + default ranked view
- Frontend `ThemeCircle` (`frontend/components/flower-of-life/theme-circle.tsx:174`) and a new **ranked‑themes panel** gain a **33/111/333 toggle per theme** (reuse the tier‑switch pattern from `response-drawer.tsx:154-165`, including the `isPaidTier` gate on 111/333).
- Add a **"Ranked themes" section as a default** on the results page, inserted between the Theme Analysis card and Configuration (`frontend/app/dashboard/page.tsx:~982`), fed by `GET /sessions/{id}/rankings` on mount + the (now‑wired) realtime hook. Read‑only ordered list mirroring the participant `ThemeRankingDnD` items.
- Verify the live `/themes` path renders the 3/6/9 rotary (`components/flower-of-life/rotary-knob.tsx`) from real `theme_level` rows via `adapt-live-themes.ts` (already coded; just needs live data from WS‑A).

### WS‑C — Living priority voting (Theme01 → Theme02 → Ranking), live, fully working
- **Staged flow (CRS journey):** participants first prioritize **Theme01** (3 top categories), then **Theme02** (3/6/9 sub‑themes) for the chosen category, then the **ranking** stage — each stage a live‑aggregating selection. Model the stage in session state (reuse `session.current_cycle`/`cycle_mode`/`max_cycles`, `backend/app/models/session.py:46-48`).
- **Make voting reachable + living (backend):** thread `session.current_cycle` into `POST /rankings` + `submit_user_ranking` (drop hardcoded `cycle_id=1`, `ranking_submission.py:43`); **allow ballot replacement within an open cycle** (update instead of reject at `:119-133`); push **moving aggregate scores** in `ranking_progress` (or auto re‑aggregate on each ballot) instead of moderator‑snapshot only; add a **re‑open / advance‑stage endpoint** (`cube1_session/router.py` currently open/poll/rank/close/archive only); implement the real `SupabaseVoteAccumulator.flush_to_db` (stub at `scale_engine.py:197-214`).
- **Make voting work in the demo (frontend):** wire the orphaned `use-realtime-ranking.ts` into the results + participant surfaces; relax the forward‑only status guard so `ranking→polling` re‑open is honored (`frontend/lib/session-utils.ts:4`, `session-view.tsx:629,645,1218`); let `ThemeRankingDnD` re‑submit while the stage is open; show the live aggregate reordering.
- **AI + HI supplemented inputs option:** a moderator toggle to inject AI‑generated and HI (human) supplemental responses into the response pool before theming/voting, to de‑risk a thin survey (reuse the Innovation‑Pod AsM‑assisted simulation feeding Cube‑6; clearly label AI‑authored per "anything an AI writes is shown as AI‑written").

### WS‑D — Revision‑history control for polling results
- Reuse the **SoI‑2525 slide‑version pattern**: `SlideVersion` + `makeSlideVersion`/`mergeSlideVersions`/`slideVersionTimeline` (`frontend/lib/innovation-data.ts:1689-1731`) + the diff engine `frontend/lib/version-diff.ts` + the compare UI `frontend/components/soi-slide-compare.tsx`. Snapshot each themed‑results + ranking state (theme→33/111/333 map, counts, confidence, aggregated order) as an append‑only version; add a **replay scrubber + A↔B compare** on the results page. localStorage‑first + best‑effort Supabase mirror (as the slide history does).
- Complement with an append‑only `docs/traceability/polling.ledger.json` (reuse `frontend/scripts/build-traceability.mjs` contract) for the curated ship history.

### WS‑E — Per‑cube SIM easter‑egg: real inputs/outputs + full code, double‑checked
- **Fix the code resolution** so LIVE panels show real source for **all** contract functions: align `_SIM_CUBES` contract function names (`frontend/lib/mock-data.ts:749-757`) to the baked keys in `frontend/lib/sim-live-source.ts` (or regenerate `sim-live-source.ts` keyed by the contract names). Target: 0 placeholder blocks across cubes 1–9.
- **Extend coverage** beyond cubes 1–9 toward the full set the SIM claims (10+, as far as real source exists), and correct the "Cube Dev Sim · 1–9" branding vs "Cube 10 SIM".
- **Add regression tests**: unlock state machine (Cyan→Sunset→Violet), badge‑blink/enter, and per‑cube I/O + code resolution (assert no block falls back to the generated placeholder). Wire into `test:ci`.

### WS‑F — Real 1M‑unique‑user load + infra + live dashboard (the big lift), AsM‑tested
- **Load generator:** a real concurrent client swarm (k6 or Locust) driving `join → submit response → vote (Theme01/Theme02/rank)` at 100K→1M unique users; runnable command + report.
- **Scale infra (Tier‑4):** deploy the designed path in `docs/HWR_SCALE_OPTIMIZATION.md` — HASH partitions + parallel `COPY FROM STDIN`, Durable‑Object‑per‑session hub, matview + Supabase Realtime fan‑out; prove live delivery (Trinity Redundancy) and voting hold under load.
- **Observability:** a live metrics dashboard (Prometheus/Grafana or equivalent) showing ingestion rate, broadcast latency, vote throughput, clustering time — the artifact a diligence review watches hold at 1M.
- **AsM fleet as a repeatable harness (Fable 5.1):** turn the ad‑hoc reviewer‑lens orchestration into a repeatable run that exercises the living‑voting + theme + demo path and gates on the deterministic replay/verify proofs; each round produces the standard HTML feedback artifact.
- **Dependency (operator infra):** this workstream requires provisioned cloud infra (DB partitions, Durable Objects/Workers, metrics stack) and is the multi‑week lift; it can proceed in parallel with A–E once infra exists.

## Reused primitives (no rework)
- Theme viz: `components/flower-of-life/*` (`flower-visualization.tsx`, `theme-circle.tsx`, `rotary-knob.tsx`), `lib/adapt-live-themes.ts`, `lib/types.ts`.
- Voting: `components/theme-ranking-dnd.tsx`, `lib/use-realtime-ranking.ts`, `backend/app/cubes/cube7_ranking/*`.
- Revision history: `lib/version-diff.ts`, `lib/innovation-data.ts` slide‑version helpers, `components/soi-slide-compare.tsx`, `scripts/build-traceability.mjs`.
- SIM: `components/cube-dev-sim.tsx`, `lib/sim-live-source.ts`, `lib/sim-sections.ts`, `lib/easter-egg-context.tsx`.
- Backend theming/summaries: `cube6_ai/{pipeline,phase_b,theme_summarizer}.py`, `models/theme.py`, `models/response_summary.py`.
- Determinism/replay + scale math: `cube10_simulation/replay_service.py`, `backend/app/core/scale_engine.py`, `backend/tests/test_1m_*.py`.

## Verification (end‑to‑end per workstream)
1. **WS‑A/B:** against hosted infra with `MOCK_MODE=false`, a real session's `/themes` renders the 3/6/9 rotary from live rows; each theme shows a working 33/111/333 toggle (111/333 gated by tier); ranked‑themes section populates from `GET /rankings`. `test:ci` green.
2. **WS‑C:** a participant selects Theme01 → Theme02 → ranks; can adjust the ballot while open; a second browser sees the aggregate reorder live; re‑open advances a new cycle; AI+HI supplement injects labeled responses. New backend tests for cycle‑advance, ballot replacement, and broadcast delivery; `backend pytest tests/cube7` + frontend gates green.
3. **WS‑D:** save several result versions, scrub the replay, run an A↔B compare showing theme/description/rank diffs; `traceability` gate green.
4. **WS‑E:** in `/sim`, every cube 1–9 block shows real source (no placeholder); unlock + per‑cube I/O tests in `test:ci`.
5. **WS‑F:** the load generator drives ≥100K→1M concurrent users; the dashboard shows the system holding within CLAUDE.md targets; determinism/replay proofs pass at scale; AsM harness produces a green review artifact.
6. Every commit: full `test:ci` + `next build`, push both refs, confirm Cloudflare **Deploy** success via GitHub Actions, report `SHA | committed | pushed | LIVE`.

## Suggested sequencing
- **Track 1 (real demo, no new cloud infra beyond hosted backend+Supabase+AI key):** WS‑A → WS‑B → WS‑C → WS‑D → WS‑E. Delivers a real, click‑through, living‑voting demo with API‑driven visuals, per‑theme descriptions, revision history, and a verified SIM.
- **Track 2 (the 1M lift, needs provisioned infra):** WS‑F in parallel once infra is available.

## Not in this plan
- Touching the SACRED Trinity‑Redundancy code paths without live verification.
- Deleting the deterministic showcase (kept as an offline fallback, not the primary demo).
- The Innovation‑Pod / whole‑site translation work (already shipped this session).
