# Cube 6 — Theming (Theme01 / Theme02) metrics

Append-only (never edit past rows). CRS: [CRS-09.08](../CUBES_4-6.md). Machine-readable twin: [cube6-theming.json](cube6-theming.json). Every row is **SIMULATED** (owner benchmark CSVs; no real participants).

Times are CST. *first themes* = first sample-of-10 themes ready (streamed); *final* = Theme02 9/6/3 ready (before assignment/store); *total* = incl. per-response assignment (+ store for LIVE).

| # | At (CST) | Kind | Merge SHA | CF version | N | Theme01 S/R/N | First themes s | Final Theme02 s | Total s | Calls | Vendor split (served/calls) | p50/p95 | Tokens | Cost USD | Note | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-09 15:48:42 | LIVE /ai/run (poll titled SIMULATED, proof mode) | pre-c18942dac (original pipeline) | before 83ab9dc5 (api-v1t) | 12 | R7/S0/N5 |  | 18.67 | 21.16 |  | openai | not exported yet |  | 0.000392 | BEFORE: OpenAI, original per-item pipeline; final = /ai/run duration_sec | `live-ladder-n12-154842.json` |
| 2 | 2026-11-09 15:56:24 | BENCH direct pipeline (fast path), no DB/join; real xAI calls | c18942dac (#42) | n/a (bench) | 5000 | S298/R2874/N1828 | 13.447 | 29.76 | 29.76 | 508 | grok 486/508 (hedges 22, fail 0) | not exported yet | 697187 in / 51430 out (chars/4) | 1.0001 | (b) batched multi-vendor fast path, N=5000, xAI only on box (box Gemini key invalid, no OpenAI key); assignment skipped (no embedding key on box) | `bench-fast-n5000-155624.json` |
| 3 | 2026-11-09 15:50:49 | LIVE /ai/run (poll titled SIMULATED, proof mode) | c18942dac (#42) | 83ab9dc5 (api-v1s) | 47 | S17/R30/N0 | 5.28 | 20.59 | 28.23 | 16 | grok 1/6 (hedges 6, fail 0), openai 9/10 (hedges 0, fail 0) | not exported yet |  | 0.006145 | 47/48 loaded (1 submit 500); session provider openai; xAI-primary mode | `live-ladder-n48-155049.json` |
| 4 | 2026-11-09 15:51:26 | LIVE /ai/run (poll titled SIMULATED, proof mode) | c18942dac (#42) | 83ab9dc5 (api-v1s) | 5 | S0/R3/N2 | 2.38 | 6.34 | 11.78 | 7 | grok 5/5 (hedges 0, fail 0), openai 0/2 (hedges 2, fail 0) | not exported yet |  | 0.026034 | long full text, only 5/12 joined (join 500s under concurrency) | `live-ladder-n12-155126.json` |
| 5 | 2026-11-09 15:53:29 | LIVE /ai/run (poll titled SIMULATED, proof mode) | c18942dac (#42) | 83ab9dc5 (api-v1s) | 12 | S0/R12/N0 | 3.21 | 7.19 | 12.29 | 4 | grok 3/3 (hedges 0, fail 0), openai 0/1 (hedges 1, fail 0) | not exported yet |  | 0.056652 | xAI-primary mode reference for t186 comparison | `live-ladder-n12-155329.json` |
| 6 | 2026-11-09 15:59:06 | BENCH direct pipeline (orig path), no DB/join; real xAI calls | main as-is (per-item path) | n/a (bench) | 500 | S0/R16/N484 |  | 28.201 | 86.134 | 2080 | grok 2057/2080 (hedges 23, fail 0) | not exported yet | 315371 in / 21612 out (chars/4) | 0.4482 | (a) original per-item path on Grok: INVALID split, 480/500 replies were literal 'THEME (Confidence..)' -> fixed in #47 | `bench-orig-n500-155906.json` |
| 7 | 2026-11-09 16:04:34 | BENCH direct pipeline (orig path), no DB/join; real xAI calls | 68bd4e65d (#47) | n/a (bench) | 500 | S1/R214/N285 |  | 47.767 | 106.367 | 2168 | grok 2061/2168 (hedges 107, fail 0) | not exported yet | 347340 in / 21426 out (chars/4) | 0.4877 | (a) original per-item path, N=500, with #47 prompt fix; LLM assignment 3x500 calls | `bench-orig-n500-160434.json` |
| 8 | 2026-11-09 16:05 | EXTRAPOLATION (linear x10 of row 7, not measured) |  |  | 5000 |  |  | 478 | 1064 | 21680 |  |  |  | 4.88 | (a) at N=5000 would exceed the 20-min/$5 guard; t180 rule: ran N=500 and extrapolated | `extrapolation:bench-orig-n500-160434.json x10` |
| 9 | 2026-11-09 16:19 | PARITY bench: notebook logic serial vs fast path, same 60-row CSV, grok both |  |  | 60 | notebook R20/S26/N14 & R20/S24/N16; fast R30/S0/N30 (bias fixed in #58: R30/S30) | 1.65 | notebook 286.8 / 218.6; fast 13.8 / 12.8 | notebook 452.2 / 370.2; fast 24.0 / 25.4 (16-19x) | notebook 376; fast 204-210 | grok only (box) |  |  | notebook 0.089; fast 0.038-0.041 | see Parity section | `parity-notebook-vs-fast-n60-161928.json` |
| 10 | 2026-11-09 16:28:09 | LIVE /ai/run (poll titled SIMULATED, proof mode) | 99554df23 (#51) | fa0d8444 (api-v1y) | 12 | S0/R12/N0 | 5.1 | 21.46 | 28.0 | 10 | gemini 0/1 (hedges 0, fail 1), grok 3/5 (hedges 1, fail 0), openai 3/4 (hedges 2, fail 0) | grok 2060/4742 ms, openai 2810/4826 ms |  | 0.002931 | t186 speed-weighted round-robin, no xAI preference; Gemini HTTP 402 (credit); reduce landed on slower vendor -> #55 race-when-idle | `live-ladder-n12-162809.json` |

## N=5000 — current process vs batched path (t180u, SIMULATED, 2026-11-09)

| | (a) original per-item pipeline | (b) batched fast path |
|---|---|---|
| Measured at | N=500 (row 7), extrapolated ×10 (row 8) | N=5000 (row 2) |
| Time to first themes | n/a (no streaming) | 13.4 s |
| Time to final Theme02 9/6/3 | 47.8 s @500 → ~478 s @5000 (extrapolated) | 29.8 s |
| Incl. per-response assignment | 106.4 s @500 → ~1064 s (~18 min) @5000 | prod: embedding cosine (~0.5 s live at N=12-48); not run on box |
| Calls | 2,168 @500 → ~21,700 | 508 (200 classify + 251 theming + reduce) |
| Cost | $0.49 @500 → ~$4.9 | $1.00 |
| Where the time goes | classify 32.7 s · samples 4.3 s · reduce 10.8 s · assign 58.6 s | classify 11.9 s · samples 11.0 s · reduce 6.8 s |

Join limit (100/min) excluded: both are direct pipeline calls (bench_theme02.py) against the same code, no DB.

## Parity with the owner's notebook (t183u)

Same 60-row CSV, same model on both sides (grok-4.20-0309-non-reasoning replaces gpt-3.5-turbo so only execution differs), 2 runs each:

- **Speed**: notebook 370-452 s total (summaries 145-199 s, classify 36-54 s, samples 12 s, reduce 22-25 s, assign 152-165 s; 376 serial calls) vs fast path 24-25 s (204-210 calls), **16-19× faster**; Theme02 ready 13 s vs 219-287 s.
- **Theme01**: notebook agrees with itself on 61.7% of rows (its 333/111/33 re-summaries shift sentiment). Fast path in this run: 46.7-51.7% agreement, R30/S0/N30. Root cause: batch-relative judgement → fixed in PR #58 (R30/S30, 70%/65% agreement with the two notebook runs, above the notebook's own 62%). The dataset is 30 risk + 30 benefit statements by construction.
- **Theme overlap** (stem-Jaccard best match, level 9 Risk): fast vs notebook 0.17-0.30 mean, notebook vs notebook 0.26 — same order as the notebook's own run-to-run variation.
- **Assignment agreement** (adjusted Rand index on responses with the same Theme01): level 3 0.45-0.51 fast vs notebook; notebook vs itself 0.67; fast vs itself 0.80 (fast path is more repeatable).

Deliberate deviations (each documented in code):
1. ≤33-word responses skip the 333/111/33 LLM summaries (the response is its own 33-word summary); the notebook always re-summarises to 111 and 33.
2. Theme01: 25 per call (`n|S/R/N|conf`), with an explicit 'judge independently' + code meanings (#58); per-item prompt names a `<category>` placeholder because Grok echoes the literal `THEME` (#47). Same labels, same <65% → Neutral rule.
3. Samples of 10 → 3 themes unchanged, 2 samples per call; reduction 9→6→3 in ONE call (tree of names first when >60 themes) instead of three chained calls.
4. Per-response Theme2_9/6/3: embedding cosine in production (notebook: one LLM call per response per level); the box parity used the LLM matcher (no embedding key on the box).
5. Model: grok-4.20-0309-non-reasoning instead of gpt-3.5-turbo; since t186u all keyed vendors share the work.

## Vendor policy (t186u, 2026-11-09 16:07 CST): no xAI preference

PR #51 (merged 99554df23, live api-v1y fa0d8444): speed-weighted round-robin over all keyed vendors (weight 1/p50), hedge to the fastest untried vendor, fixed order only on errors; per-vendor calls, served, served_ms, p50/p95, last_error status in `/ai/run` vendors. Live N=12 (row 10): grok 3 served (p50 2.06 s), openai 3 served (p50 2.81 s), **gemini HTTP 402 on the Worker (credit) — owner action needed**; Claude not keyed. Pure round-robin was slower than xAI-primary at N=12 (28.0 s vs 12.3 s wall; the single reduce call landed on the slower vendor). PR #55 races the 2 fastest vendors when capacity is idle and weights per call kind.

## Gaps
- p50/p95 per call exported from #51 onward (rows ≤ 9 have none).
- Evidence files written before 16:06 CST label their time "America/New_York"; the box clock is CST, so those times are CST.
- Live joins return HTTP 500 under concurrency; the ladder runs joins serially.
