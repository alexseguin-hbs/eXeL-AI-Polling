# SensorFusion CRS proposals — 2026-11-09

**Status: PROPOSED (not implemented).**  
Design: [ANON_HEART_TOKENS_PROPOSAL_2026-11-09.md](./ANON_HEART_TOKENS_PROPOSAL_2026-11-09.md).

Do **not** write these into `sensorfusion-2525.code.json` revisions until an implementation commit exists.

## Proposed CRS ids
| CRS | Topic |
|-----|--------|
| CRS-05.04 | Anonymous SF seats (Supabase anon auth uid + unique display name) |
| CRS-08.04 | Shared project class list / autocomplete |
| CRS-08.05 | Normalize + did-you-mean before new class |
| CRS-08.06 | Moderator class merge (append-only history) |
| CRS-19.07 | Per-user active labeling/review time |
| CRS-19.08 | Append-only WORK TRACEABILITY log |
| CRS-24.03 | `actor_uid = auth.uid()` for work events |
| CRS-25.02 | ♡/◬ education credit; 웃 gated by `human_enabled` |
| CRS-32.04 | Per-user / per-project export |

## Related verified (only)
| Item | Evidence |
|------|----------|
| PR #16 correction binding | mergedAt `2026-11-09T13:27:30Z` |
| PR #20 Auth0 audience prep | merge SHA `56c24257f4584e03a22b5d733c0f0c194915082f` |
| API api-v1n deploy | Worker version `53a50280-de69-42b6-80c2-92b1a56af2f1` |
| E2E after api-v1n | 41/41 PASS — agent path `/workspace/research-exel/artifacts/e2e-launch/` |

Token rates: reuse Cube 5 (`♡=ceil(minutes)` per entry / floor public accum; login ♡1; ◬=5×♡). No per-box ♡ rate in repo.

## Verified 2026-11-09 (W3) — CRS-09 / CRS-39 summary tier expose

- ResponseRead/ResponseListItem + cube2 list/detail now return `summary_111`/`summary_333` (generation unchanged).
- ThemeRead + enriched themes API return `summary_111`/`summary_333` from `theme_summary_*`.
- Flower ResponseDrawer wired via `GET /collected?include_summaries&include_themes` → ThemedResponse.
- Cost ledger: `AICostLog.phase=phase_a` maps to `CostKind.PHASE_A` (was lumped as theme02).
- Paid-view: `apply_response_paid_view_gate` passthrough TODO for W2 unlock (no payment module edits).
- Tests: `tests/cube2/test_summary_tiers_expose.py` (5), FE `adapt-collected-responses.test.mjs`.
