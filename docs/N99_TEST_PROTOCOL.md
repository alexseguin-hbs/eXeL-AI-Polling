# N=99 Test Protocol — Standard Operating Procedure

> **Authority:** Master of Thought (MoT)
> **Agents:** All 12 Ascended Masters
> **Established:** 2026-04-13

## Purpose

The N=99 test validates that the entire SoI Governance Engine produces **deterministic, reproducible, secure** output across 99 consecutive runs. It is the gold standard for release readiness.

## When to Run

- Before every release
- After every SPIRAL cycle
- After any change to Cubes 6 (AI), 7 (Ranking), or 8 (Tokens)
- After any security-related change
- On demand by MoT

## Protocol Steps

### Phase 1: SPIRAL Forward (1→10)
Run each cube individually, N=5 runs per cube. Record Avg and StdDev timing.

```bash
cd backend && source .venv/bin/activate
for cube in cube1 cube2 cube3 cube4 cube5 cube6 cube7 cube8 cube9 cube10; do
  python -m pytest tests/$cube/ --tb=short -q  # Run 5 times, record timing
done
```

### Phase 2: SPIRAL Backward (10→1)
Same test, reverse order. Confirms no cross-cube dependency issues.

### Phase 3: Cross-Cube + Scale
```bash
python -m pytest tests/test_n99_ssses_spiral.py tests/test_1m_all_cubes.py \
  tests/test_broadcast_payload.py tests/test_cross_cube_chain.py \
  tests/test_wireguard_whitelist.py tests/test_wireguard_whitelist_cubes123.py \
  --tb=short -q
```

### Phase 4: 12-User Simulation
```bash
python -m pytest tests/test_12user_simulation.py tests/test_theming_36responses.py -v -s
```

### Phase 5: Live API Tests (requires API keys + billing gates)
```bash
LIVE_STT=1 LIVE_AI=1 python -m pytest tests/cube3/test_live_stt.py \
  tests/cube3/test_live_e2e_voice.py tests/cube6/test_live_pipeline.py -v
```

### Phase 6: Feature Removal Guards
```bash
python -m pytest tests/test_n99_ssses_spiral.py::TestFeatureRemovalGuard -v
```

### Phase 7: Full Suite (2,299+ tests)
```bash
python -m pytest tests/ --tb=short -q
```

### Phase 8: Gap & Opportunity Audit
All 12 Ascended Masters analyze each cube using SSSES methodology:
1. **Forward pass (1→10):** Identify gaps and opportunities per cube
2. **Backward pass (10→1):** Catch anything missed on first pass
3. **Theme the results:** Generate 9 key Gaps and 9 key Opportunities

## 12 Ascended Masters — Roles in N=99

| Master | Domain | N=99 Responsibility |
|--------|--------|---------------------|
| **Thoth** | Data & Analytics | Run full suite 3× for determinism, record metrics |
| **Thor** | Security | Verify WireGuard on all 10 cubes, audit auth/RBAC |
| **Sofia** | Languages | Verify 702+ lexicon keys, 10 Divinity languages, no English leaks |
| **Krishna** | Integration | Cross-cube chain tests, endpoint count, SDK verification |
| **Enlil** | Build | Per-cube test count audit, docs accuracy, migration check |
| **Athena** | Strategy | Write new tests for coverage gaps, test planning |
| **Aset** | Themes | Cube 6→7→9 pipeline consistency, theme hierarchy |
| **Enki** | Edge Cases | Boundary conditions, Unicode, RTL, anonymous users |
| **Odin** | Future-Proof | Dependency analysis, Supabase config, scaling readiness |
| **Christo** | User Flow | Verify User + Moderator paths, Trinity Redundancy |
| **Pangu** | Innovation | Create new simulation tests, broadcast payload tests |
| **Asar** | Synthesis | Feature removal detector, SPIRAL_METRICS update, final report |

## Pass Criteria

| Criterion | Requirement |
|-----------|-------------|
| Total tests | All pass (0 failures) |
| Skipped | Only live API tests (with documented reason) |
| SSSES Spiral | 48/48 (all cubes × 5 pillars) |
| WireGuard | All 10 cubes have whitelist constants |
| Feature Guards | 26/26 (all cubes + cross-cube) |
| Determinism | Same output across N=99 runs for ranking, theming, hashing |
| TypeScript | `tsc --noEmit` returns 0 errors |
| Timing | Each cube < 15s, full suite < 120s |

## Output Deliverables

1. **N=5 Per-Cube Timing Table** (Avg + StdDev)
2. **Gaps List** — Themed into 9 categories
3. **Opportunities List** — Themed into 9 categories
4. **SPIRAL_METRICS.md** — Updated with new baseline
5. **CLAUDE.md** — Updated test total
6. **Git commit** with all test results

## Gap & Opportunity Theming

After both passes, raw gaps and opportunities are classified into 9 themed categories each:

**Gap Categories (Theme2_9):**
Supporting (what's strong but has small gaps), Neutral (what works but isn't optimized), Risk (what could break under load or attack)

**Opportunity Categories (Theme2_9):**
Quick Wins (< 1 hour), Medium Effort (1-4 hours), Strategic (requires design discussion)

Each category further reduces: 9 → 6 → 3 top priorities.
