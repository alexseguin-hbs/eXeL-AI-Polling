# N9 gate doctrine (authoritative + source disagreements)

Pinned research base: `4c2761a6618a4f24c9c940cedee93a98b7938c58` (main after PR#2).  
H.I. = the user. Simulated AsM/MoT tallies are **not** independent reviews or Claude MoT sign-off.

## SSSES (from `SSSES.md` + MoT t72u paste)
Five pillars scored **0–100**; production-ready **only** when all five are **100**. Every commit states SSSES impact — **this suite never invents scores/deltas**.

| Pillar | Signal |
|--------|--------|
| Security | RLS, rate-limit, PII, no leaks |
| Stability | phone+desktop, QR+code, pre/post join |
| Scalability | 100+ → 1M requires **measured** evidence — registered capacity alone ≠ pass |
| Efficiency | <100ms auto-advance **measured**; min poll; correct deps |
| Succinctness | single-responsibility; <300 LOC/function |

Mandatory sub-checklists: **Realtime** (subscribed-channel sends, status-only-forward, DB on every transition) and **Lexicon** (all UI `t()` ×33 langs, zero hardcoded English). Unknown → `fail`/`blocked`/`unverified` — never green-washed 100.

## SPIRAL
Bidirectional forward 1→10 + backward 10→1; non-regression for larger user base + increased modularity; baselines N5/N9/N18 in `docs/SPIRAL_METRICS.md` via `spiral9`; past·present·future. Default suite does **not** claim a million-user live run.

## AsM 111 / MoT 333
Exactly **12×111** before and after each round (Aset…Thor lenses). MoT **333** = 3×111 collecting reviews + option/risk/value tally + decision/P0P1/next actions. Tokenizer: `trim().split(/\s+/).filter(Boolean)`. Fleet refuse gate is authoritative for review artifacts.

### Source disagreements (do not silently reconcile)
| Topic | Sources | Suite rule |
|-------|---------|------------|
| MoT paragraph exactness | Fleet gate exact 111×3; pod-synthesis soft ~333 (300–345); ai-core ±3; Vision §14 “exactly 333” | **Review AARs use fleet exactness**; pod product soft band is separate |
| Dash tokens | JS fleet counts dashes as words; `lv-gate` excludes dash-only | Review validators = fleet |
| `test:asm-cup` / `test:mot-ladder` | Named AsM/MoT but are drone sims | **Not** word-count gates |
| 48-agent Architect fleet | Unverified / out of scope (t72u) | Not required for this suite |
| Weekly fee “lookup” | Docs/config only; no official HTTP fetch (QA) | Assert **fail** of official-fetch claim |
| Cost panel API | Static catalog, not `/payments/provider-fees` | Assert **fail** of API-wired claim |
| SF/pod 33-lang | Preexisting English; no-regression ≠ pass | Policy status **fail/unverified** |
| PR4/PR5 Workers red | Same main `moderator-settings` payment syntax | Classify **preexisting**, not SF/pod regression |

## Fail→fix→retest pattern
Example: main typecheck S0 → PR3 `1dcd2ae` hotfix Workers green — record both; do not wait for a perfect system to run the suite.

## Fail→fix→retest (2026-11-08 worker iterations)
See `evidence/samples/FAIL_FIX_RETEST.md`. Weekly HTTP lookup remains blocked even after PR7. Pod/SF t() keying is not a 33-language pass and not a Supabase save.
