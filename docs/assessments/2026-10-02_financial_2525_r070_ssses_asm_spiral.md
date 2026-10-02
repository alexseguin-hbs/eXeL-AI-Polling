# Financial-2525 r.070 — SSSES · AsM · Spiral (2026-10-02)

> Operator, addendum 155 (verbatim): "put key for "Alerts" / Show Red - - - Red Alert / Show Amber - - - Amber Alert / move as much
> unneeded text from Credit cards / No more feedback for me; implement, SSSES, AsM, and Spiral test"

Revision under test: **v.000_r.070** (decision commit c787095). Everything below was run on the code and on the BUILT static export
(`frontend/out`, phone 390 × 844 and landscape 844 × 390, signed in through a test browser), before the push.

## What r.070 changes on the Credit cards panel

| | r.069 (before) | r.070 (after) |
|---|---|---|
| Alerts key | — | under the chart: **Alerts · - - - Red Alert · - - - Amber Alert** (red first, the chart's own dash 5/4 and colours) |
| Level line | `OK · 25% · Amber at $1,500.00 (50%) · Red at $2,000.00 (67%)` | removed — the key, the Balance's colour and the cockpit warning carry it |
| Chart at rest | `$735.27` readout + boxed date `2026.10.02 04.55` | nothing but the dashed now line; a tap or a finger still shows the value and its boxed date |
| Available | "Available credit" | "Available" (his word, under the Credit cards heading) |
| Cockpit warning | `⚠ Amber · …` / `⚠ Red · …` | `⚠ Amber Alert · …` / `⚠ Red Alert · …` |
| Screen reader | — | the Balance is followed by " · Amber Alert" / " · Red Alert" when a level is reached (colour is never the only carrier) |

Text on the panel at rest, measured: `CREDIT CARDS · Pay card · Capital One · USAA · Balance $735.27 · Available $2,264.73 · Alerts · Red Alert ·
Amber Alert` (plus the chart's axis marks). The level figures remain in the card's ⚙ settings (Limit · Balance as of today · Amber at · Red at).

## AsM test — the twelve users, run on the real code

| Simulation | What it runs | Result |
|---|---|---|
| `scripts/fin-asm-144.mjs` (r.066) | 12 AsM × 12 transaction scenarios on accrual.ts + record.ts | **144/144** |
| `scripts/fin-asm-cards-144.mjs` (new, r.070) | 12 AsM × 12 credit-card scenarios on cards.ts + accrual.ts — purchase raises the balance; purchase lowers Available once; payment lowers the balance; count-once; paying the opening balance lowers Available; a payment beyond purchases counts only the excess; a payment on any field pays the card; no alert below amber; Amber Alert at the amber line; Red Alert at the red line; over the limit shown, never refused; settings refuse, re-base and merge | **144/144** |

**Proof the card simulation can fail** (a probe that cannot go red is not evidence): three planted defects in `cards.ts`, each restored after —

| Planted defect | Result |
|---|---|
| Amber from `>` instead of `>=` the amber line | 132/144 (the twelve "Amber Alert at the amber line" scenarios fail) |
| Count-once removed (a covered payment lowers Available again) | 120/144 |
| Card payments ignored | 108/144 |

Both simulations now run inside `test:ci` (`test:fin-asm-144`, `test:fin-asm-cards`), so every future build re-runs the 288 scenarios.

## Spiral test — forward and backward through everything the change touches

**Forward (the Credit cards panel → what depends on it):**
- Cockpit warning at the top of Accrual Units — reads the same alert words (measured: `⚠ Amber Alert · Capital One $1,535.27 / $3,000.00`,
  `⚠ Red Alert · Capital One $2,035.27 / $3,000.00`) — PASS
- Shared chart (`components/2525-core/rcore-chart.tsx`, used only by Financial-2525's two charts): an empty selected-label now draws no box;
  the main REAL-TIME FINANCIALS chart never passes an empty label — captured at rest, its three rate figures and boxed date are unchanged — PASS
- Lexicon, 33 languages: one key added (`fin.card_alerts`), `fin.card_level_ok` retired, three English words changed — all staged English-only
  in AFTER_FILL (no fill until the English is final, operator law 2026-09-30); every other language falls back to the English —
  lexicon-coverage 129/0 · financial-i18n 886/0 — PASS
- Vector law (strokes only, the thirteen colours) on the Financial surface, now with the key's SVG swatches — 29/0 — PASS
- Layout: the key is one row in portrait and landscape; no sideways scroll; no page errors — PASS

**Backward (the record → the code):**
- The ask: addendum 155 verbatim, sidecar re-hashed, `handoffSha256` + history in the domain JSON — asks-persist 125/0 — PASS
- Domain JSON revision 0.070 (decision, cites c787095) · FD-85 · ledger rev 139 · CRS/README/DECISIONS re-rendered — financial-crs 574/0 · traceability
  61/0 — PASS
- R-CORE panel record regenerated (`financial-ledger.gen.ts`) — rcore-revisions 49/0 · rcore-stage2 78/0 — PASS

**Full chain:** tsc 0 errors · full `test:ci` exit 0 (including both simulations) · `next build` exit 0 (one stamp, smoke).

## SSSES (this revision)

| Pillar | Score | Evidence |
|---|---|---|
| Security | 100 | no new data path, storage or network call; the cards stay seeded for the operator only (`seedFor`); every new string is rendered as text by React — no raw HTML |
| Stability | 100 | 187 surface gates incl. the r.070 gate (fails if the key goes or the level line returns); 288 simulated scenarios with three planted defects caught; both orientations measured |
| Scalability | 100 | pure render, constant cost per card (six DOM nodes for the key); no per-frame work added |
| Efficiency | 95 | fewer text nodes on the face (level line gone); the card chart's date function is called once more per paint (a string format) |
| Succinctness | 100 | `pct` and the level line deleted; one literal `ALERT_WORD` map replaces a template key (translation scanners can see every key) |

## AsM reviewer lenses (twelve lenses, three read-only reviewers, before the push)

_(filled in from the reviewers' reports below)_
