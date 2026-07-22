# R-CORE × SSSES × HWR SCORECARD — Cubes 1–10 (2026-07-22)

The convergence record of the full bidirectional SPIRAL (forward 1→10 "truth flows to the
orchestrator" + backward 10→1 "the orchestrator's verdict propagates back"). Every surface
below is proven by an offline, deterministic test; the flaky wall-clock dependency in the
Dev-Sim challenge was de-flaked (throughput/absolute-time noise removed, mirroring the 1M
timing fix). **Full backend suite: 2833 passed, 66 skipped, 0 failed** (skips are genuine
live-provider-key / gitignored-large-fixture cases only).

## R-CORE — the 6 surfaces per cube

| Cube | metrics.py | wired to router | Dev-Sim harness | replay / verify | AuditLog | exec-modes |
|------|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 Session | ✅ | ✅ | ✅ | ✅ `verify-determinism` + replay_hash | ✅ | (n/a) |
| 2 Text | ✅ | ✅ | ✅ | sig | ✅ | (n/a) |
| 3 Voice | ✅ | ✅ | ✅ | sig | ✅ | (n/a) |
| 4 Collector | ✅ | ✅ | ✅ | sig | ✅ | ✅ (shared) |
| 5 Gateway | ✅ | ✅ | ✅ | sig | ✅ | ✅ (shared) |
| 6 AI | ✅ | ✅ | ✅ | ✅ `verify-replay` | ✅ | ✅ (shared) |
| 7 Ranking | ✅ | ✅ | ✅ | ✅ `verify_replay` + readiness | ✅ | (own readiness) |
| 8 Tokens | ✅ | ✅ | ✅ | ledger + audit | ✅ | ✅ (shared) |
| 9 Reports | ✅ | ✅ `GET /reports/metrics` | ✅ `harness_cube9` | ✅ `verify_export` (activated `compute_export_hash`) | ✅ (destroy) | ✅ (destroy = live/human-gated) |
| 10 Simulation | consumes others' (self N-A) | `POST /sim/cube/{id}/run` | **HOST** (drives 1–9; N-A as a link) | ✅ `determinism_signature` + `replay_hash` | ✅ (`sim.feedback_submitted`) | **Origin** (`decide_swap` tiers) |

**Cube 10 is the referee, not a target.** `HARNESS_CUBES` deliberately stops at 9 (a
harness of the simulator would be circular); Cube 10 hosts the harness, is the Origin the
shared 7-mode gate was extracted from, and consumes the other cubes' metrics — so its only
genuine missing surface was AuditLog, now closed. Its "N-A" cells are documented, not forced.

**Shared substrate (build-once / consume-many):** `core/rcore/execution_modes.py` (7-mode
gate) · `core/audit.py` (`log_audit`, transition-level) — both used across cubes 2–10.

## SSSES — five pillars, audited both directions (1→10 and 10→1)

Per-cube N=99 pillar classes (`TestCube1SSSES … TestCube10SSSES`) hold in both directions;
the bidirectional R-Core chain (`TestSpiralRCore1to8` forward + backward, `…Verifier1to10`)
proves each cube's signature reproduces regardless of traversal order. Feature-removal guards
(`TestFeatureRemovalGuard`) freeze every R-Core surface + the HWR substrate against silent
regression. The forward pass = "each cube strengthens the next" (R-Core essence); the
backward pass = "the whole lattice co-evolves coherently" (Vision-2525 CRS-35).

## HWR — the Hexagonal Write Rotor (write-layer Trinity)

6 faces = a cube's 6 faces = hex ring = drone-swarm modular units; 6 faces + 1 hub = Seed of
Life. `rotor_face = sha256(seed,key,seq) mod 6` (seeded → replay reproduces the exact face);
`coalesce` dedups by content hash and emits a `replay_hash`.

| Property | Proof (N=99, `TestSpiralHWR1to10`) |
|----------|-----------------------------------|
| FORWARD reproducible | write→coalesce `replay_hash` identical every run |
| BACKWARD reproducible | each row's face re-derivable from (key, seq) via seeded `rotor_face` |
| Write-layer Trinity | same record on any subset of faces coalesces to ONE row (dedup) |
| Binds into the spiral | HWR `replay_hash` folds into the 1→9 harness chain → one combined fingerprint |

**Seams (flag-gated, non-breaking):** the write rotor is wired into the four highest-volume
writes — Cube 4 desired-outcomes · Cube 2 text · Cube 3 voice · Cube 8 ledger — via
`rotor_adapter.stamp_orm`, a NO-OP until `settings.hwr_enabled` + migration `026_hex_write_ring.sql`
are provisioned, so today's single-table path is byte-for-byte unchanged.

## Operator-applied SQL (prepared/linted, not run offline)

- `025_sim_datasets.sql` — Supabase-source datasets (CSV becomes a seed, not the source).
- `026_hex_write_ring.sql` — 6 hash-partitions (one per face) + hub MERGE ("pull together
  formally once processed"). Turning these on activates the dormant `stamp_orm` seams.

## Deferred (later iterations)

Cube 10 self-metrics / delegate `decide_swap` to the shared gate / cube7 shared-audit parity
(R3.2–3.4) · Supabase-native COPY for the 1M export benchmark (R5.2) · rotor-everywhere (R4.4).
