# Fail → fix → retest ledger (worker evidence; not suite `complete`)

America/Chicago 2026-11-08. H.I. = user. No HTML. No merges.

## N2/N3 Payments
| Step | SHA | Result |
|------|-----|--------|
| BEFORE main | `4c2761a` | tsc TS1005/1128; Workers red; panel static; idempotency unused; weekly HTTP absent |
| FIX PR3 | `1dcd2ae` | tsc0; Workers green; selector braces only |
| FIX PR7 (stacked PR3) | `6fc16a2` | 5/5 idempotency; fee panel GET client; t() englishDefault; settings rev7; 21+14 tests; tsc0 |
| STILL BLOCKED | — | weekly official HTTP (`weekly_http_lookup_ready=False`); 33-lang unverified; main still red until merge; jurisdiction 60≠59 preexisting |
Evidence: `/workspace/research-exel/artifacts/workers/payments/`

## N5/N6 Pod
| Step | SHA | Result |
|------|-----|--------|
| BEFORE | `787bfb5` | English PERSIST_STATUS_COPY / record hints / free_tools |
| FIX keying | `3a3c96a` → head `dd36f71` | t() keys soi.pod.persist* + record.hint* + free_tools_note; persist 40; lexicon 87; + regression greens |
| STILL BLOCKED | — | AFTER_FILL 13×32 PENDING (not 33-pass); team Supabase E2E BLOCKED; DB transitions NONE — **keying ≠ save** |
Evidence: `/workspace/research-exel/artifacts/workers/pod/` (+ SCREEN_INVENTORY_after_keyed_ui.md)

## N7 SensorFusion
| Step | SHA | Result |
|------|-----|--------|
| BEFORE | `7150bcc` | collab notes hardcoded English; rev78 |
| FIX keying | code `ae99d95` → head `7c63647`; rev79 | 12 sf.collab.* t()/AFTER_FILL; lexicon 10; collab 48; ledger 158 |
| STILL BLOCKED | — | non-en unverified (not 33-pass); shared lexicon-coverage fails payment `cube1.settings.cost_*` AFTER_FILL (payment owns); Workers red = main payment syntax; migration 044 not applied |
Evidence: `/workspace/research-exel/artifacts/workers/sensorfusion/`

## Suite rule
Baseline asserts on **main** still fail for gaps that only exist as fixed on open PR tips. Re-verify on those SHAs; never attribute PR tip greens to a main suite run.
