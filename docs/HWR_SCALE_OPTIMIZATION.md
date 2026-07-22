# HWR × Supabase × API — 4-Tier Scale Optimization (2026-07-22)

The Hexagonal Write Rotor is not one place — it is a **distributor-cap that spans four tiers**:
client → local edge → API → cloud Supabase. Each tier is a ring that absorbs fast and coalesces
before the next. Merged with **R-Core** (every tier is replay-deterministic; replay = re-attribution,
not re-ingest) and **Vision-2525** (6 faces = 6 modular units = drone-swarm / edge-node fleet;
6 faces + 1 hub = Seed of Life = the coordinator).

> **Sacred:** the Trinity-Redundancy live-delivery (`session-view.tsx` Paths A/B/C at 752/764/774 +
> the moderator Channels A–D) is **never modified**. HWR layers additively for **bulk / high-throughput**
> paths (bulk import, SIM replay, 1M absorb). Single live responses keep the exact 3-path delivery.

## Why the 7.74 s micro-benchmark is the wrong metric

Measured single-process 1M (offline):

| Path | 1M time | rows/s |
|------|--------:|-------:|
| BEFORE HWR — single-stream append | **0.26 s** | 3.8 M/s |
| AFTER HWR — 6-face write | 1.30 s | 0.77 M/s |
| AFTER HWR — coalesce (content-hash, original) | 6.44 s | 0.16 M/s |
| AFTER HWR — coalesce (natural-key, shipped) | **2.46 s** | 0.41 M/s |

In a single process HWR is *net overhead* — it adds seeded face-hashing + a coalesce pass. That is
expected: its value is **concurrency + API-call reduction**, which a single-threaded loop cannot show.
The honest production win is that the cost **moves off the client/Python and onto the DB**, and the
number of network round-trips collapses.

## The four tiers (with the code that implements them)

| Tier | Today | HWR optimization | Status |
|------|-------|------------------|--------|
| **1 · Client** | 3 parallel single-record calls/response (sacred); no batching | `lib/hwr-client.ts` — micro-batch buffer + content/key dedup + size/time flush; live bypasses it | ✅ shipped (H-T1) |
| **2 · API** | per-response POST only; no bulk/idempotency | `write_rotor.absorb_bulk` + `hwr_absorb(jsonb)` RPC — one `INSERT…SELECT jsonb_to_recordset` per chunk; **1M calls → ~100** | ✅ helper+SQL (H-C, `027`) |
| **3 · Local edge** | `functions/api/responses.js` read-modify-write blob (KV disabled → Cache API); no Durable Objects | edge-rotor coalesce + **Durable-Object-per-session hub**; edge dedup mirrors `coalesce(dedup_key)` | ⚠ operator infra (KV/DO binding) |
| **4 · Cloud Supabase** | async engine; `hwr_face` cols live (`026 STEP1`) but flag off → single-table | 6 HASH partitions (`026 STEP2`) + **6 parallel `COPY FROM STDIN`** + Postgres-computes-face + matview hub + Realtime delta | ⚠ operator SQL |

## The A–I techniques (mapped to tiers)

- **A · No coalesce in prod (T4):** the 6 partitions *are* storage; reads go through the partitioned
  parent transparently, dedup = a UNIQUE constraint amortized into writes → the 2.46 s coalesce pass
  disappears from the hot path.
- **B · Streaming-Merkle replay_hash (all tiers):** each face folds a rolling digest at write-time;
  the replay proof finalizes in **O(FACES)**, not O(rows). Opt-in (`RotorRing(track_merkle=True)`), so
  the fast path is unchanged. ✅ shipped.
- **C · Bulk absorb (T2):** `absorb_bulk` + `hwr_absorb(jsonb)` — **1M calls → ~100**. ✅ shipped.
- **D · 6 parallel COPY (T4):** `COPY FROM STDIN` on each of the 6 partitions concurrently
  (~1M rows/s each, no lock contention) — the distributor-cap realized in Postgres.
- **E · Postgres computes the face (T4):** declarative HASH partitioning routes on
  `hashtextextended(key)%6` during COPY → the 1.30 s Python face-hash → ~0 in prod; `rotor_face`
  stays the offline **oracle** for replay/backward-attribution.
- **F · Bloom fast-path dedup (T1/T4):** O(1) probabilistic "seen?" with the UNIQUE constraint as the
  exact backstop — kills the growing in-memory `set()`.
- **G · Back-pressure + sampling (T1/T3):** 6 async face-workers with queue-depth back-pressure →
  sampling mode on surge (matches the CLAUDE.md burst strategy). Any subset of faces coalescing = the
  write-layer Trinity.
- **H · Incremental matview hub + Realtime (T4):** "pull together once processed" = a matview refreshed
  CONCURRENTLY → Supabase Realtime broadcasts the coalesced delta; consumers subscribe, not poll.
- **I · Replay = re-attribution (all tiers):** because face = seeded(key, seq), a 1M "replay" is an
  O(1)/row deterministic re-derivation, not a re-ingest. Proven end-to-end by
  `test_cross_tier_face_agreement_n99` (client=edge=origin=DB agree on the face). ✅ shipped.

## Projected production 1M path

- **~1 COPY batch** (sub-second absorb across 6 partitions, no lock contention), **not** a 7.74 s
  single-thread loop.
- **~100 bulk RPCs instead of 1M calls** (Tier 2 `hwr_absorb`).
- **O(1) replay-hash** finalize (streaming Merkle) + O(1)/row replay re-attribution.
- Cost dominated by the DB (where it belongs), not the client or Python.

## What is offline-implementable now vs operator infra

- **Offline / shipped:** T1 client-rotor (`hwr-client.ts`), B streaming-Merkle, C `absorb_bulk` helper,
  I cross-tier chain test. All gated, in `main`.
- **Operator infra (prepared/linted, applied by operator):** `026 STEP2` 6 HASH partitions + matview
  (T4 D/H) · `027` `hwr_absorb` bulk RPC (T2) · the Cloudflare **KV/Durable Object** bindings
  (`wrangler.jsonc` — KV currently commented → Cache API) for the T3 edge-rotor.

## Vision-2525 framing

The 6 faces are the same primitive a drone swarm uses later (6 modular units + 1 coordinator); the hub
(6 + 1 = Seed of Life) is the Durable Object / matview coordinator. As BYOK + edge compute grow,
absorption moves closer to the user — "the cube gets smaller faster" — until AI/HI Shared-Intent
contributions can replace platform paid-infra.
