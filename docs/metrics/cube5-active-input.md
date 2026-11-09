# Cube 5 — active-input ♡ S.I. metrics (append-only)

Rule version: `si-active-input-v1-2026-11-09`. Rate: reuse Cube 5 `calculate_tokens` (♡=ceil(active minutes), ◬=5×♡). **No invented tokens/min.**

| at_cst | n | path | active_ms_p50 | heart_sum | notes | evidence |
|--------|---|------|---------------|-----------|-------|----------|
| 2026-11-09 16:30 | 7 | unit anti-gaming | n/a | n/a | SIMULATED unit tests (idle/paste/inflate/empty/tokens) | `backend/tests/cube5/test_active_input_credit.py` 7 passed |
| 2026-11-09 16:52 | 2 | live proof api-v1y | 2979 / 0 | 1+0 | SIMULATED proof7: typed responding_active wall-capped ♡1 (claim 90s→2979ms); paste time_entry ♡0 paste_detected=true; after admin restart proof container | fleet/engagement-si/si-active-proof.json + Supabase time_entries/token_ledger |
