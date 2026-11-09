# Worker evidence pointers (America/Chicago 2026-11-08)

These paths live on the shared agent box; they are **inputs** to N5–N8, not proofs of suite `complete`.

## Pod (N5/N6/N8) — PR4 `787bfb522f5be34b6468dd69feef42a0f4751488`
- `/workspace/research-exel/artifacts/workers/pod/ACCEPTANCE_EVIDENCE.md`
- `/workspace/research-exel/artifacts/workers/pod/CI_WORKERS_BUILDS_DIAGNOSIS.md` — Workers fail = main payment syntax, not pod
- `/workspace/research-exel/artifacts/workers/pod/T72_LEXICON_AUDIT.md` — persist-status English → lexicon FAIL/unverified
- `/workspace/research-exel/artifacts/workers/pod/T72_REALTIME_AUDIT.md` — DB transitions NONE; team save BLOCKED
- `/workspace/research-exel/artifacts/workers/pod/gate/` — before/after + SUPABASE_E2E_BLOCKED
- Local greens on PR4 head: persist 26, flow 27, invariant 463, sim 66, rcore-check, stage2 117, registry 106

## SensorFusion (N7) — PR5 `7150bcc69e503547c7c9a7c27ace06a6a1b6694e`
- `/workspace/research-exel/artifacts/workers/sensorfusion/ACCEPTANCE_CHECKLIST.md`
- Lexicon: no t(); 33-lang FAIL/UNVERIFIED (no-regression ≠ pass)
- Workers fail: same moderator-settings payment break on main
- Rev 78; migration 044 not applied; realtime DB transitions unverified

## Payments QA (N2/N3)
- `/cursor/stores/store-4ff5b235-5045-41af-8897-1124f2ebc55e/qa/BASELINE-QA-t71-t72.md`
- main typecheck red; PR3 hotfix `1dcd2ae` Workers green OPEN; weekly fetch absent; panel not API; idempotency unused

## Updates (same evening)
- Payments: PR3 `1dcd2ae` + PR7 `6fc16a2` — see FAIL_FIX_RETEST.md; weekly HTTP still blocked
- Pod: PR4 head `dd36f71` (key `3a3c96a`) — keyed UI; 13×32 PENDING; save still BLOCKED
- SensorFusion: PR5 head `7c63647` (lex `ae99d95`, rev79) — sf.collab.* keyed; non-en unverified; payment cost_* AFTER_FILL is payment debt
