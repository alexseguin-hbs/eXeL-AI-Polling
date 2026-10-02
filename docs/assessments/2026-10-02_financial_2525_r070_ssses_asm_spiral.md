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

All three reviewers returned **FIX-FIRST**. They agreed on the blockers, and every blocker and should-fix below was folded before the push.

| Reviewer · lenses | Grades | Verdict |
|---|---|---|
| Flow and meaning · Athena · Christo · Aset · Asar | C · B · B · C | FIX-FIRST |
| Correctness and edges · Enki · Enlil · Krishna · Odin | D · C · A · B | FIX-FIRST |
| Quality and risk · Thor · Thoth · Sofia · Pangu | B · C · C · B | FIX-FIRST |

**Folded:**
- **The 1-second reset (blocker; all three reviewers found it).** On a phone the card chart lost a tapped value, and reset a zoom, at every 1-second tick, because its window followed the clock. It is fixed in two places:
  - the card chart's window now moves once a day;
  - the shared chart keeps a tap and a zoom whenever its window only slides or grows. That fixes the whole class: the main chart lost them once a minute.
  - "Quiet at rest" is now an explicit flag, not an `ms === now` comparison.
- **Saving a card's levels double-counted (blocker, Enki; a defect since r.067).** Saving with the balance untouched counted every move since the opening twice, which could raise a false "Over limit". The save is now the pure `applyCardSettings`, gated in the card tests and the AsM simulation.
- **Tapped colour (Thoth, Enki, Aset).** A tapped figure takes its own moment's colour.
- **Screen readers (Aset, Sofia).** The key is hidden from screen readers. The chart speaks the balance and both alert levels.
- **Settings words (Christo, Aset).** The settings read **Amber Alert at** / **Red Alert at**.
- **Contrast (Sofia).** The card's red alert text is red-400: 5.40:1 and 6.07:1 on his theme. Red-500 measured 3.97:1 and 4.46:1.
- **Gate gaps (Enlil).** Five planted defects now fail the gates: the alert words swapped, the chart dash changed, the warning limited to amber, the r.067 double count, and the quiet flag removed.
- **Card names (Thor).**
  - The operator's card figures no longer ship in the public bundle, because no card is seeded.
  - Digits of every script count toward the card-number refusal.
- **Comment drift (Enlil, Asar).** The panel comment and the ALERT_WORD placement are corrected.

**Found by the touch walk after the folds:** two cards set up within the same second shared an id. The second card was unreachable, and a removal took both. Every new card now gets a unique id (`uniqueCardId`, gated).

**Touch walk on the final candidate** (built page, phone 390 × 844, touch emulation, his cyan theme):
- Closed, the panel reads only "CREDIT CARDS". Opened with no cards, it shows only "Add card".
- Capital One set up with the alerts blank shows the hints $1,500.00 / $2,000.00. "4111 1111 1111 1111" as a name is refused.
- USAA set up blank gets $500.00 / $666.67.
- Purchases raise "⚠ Amber Alert · Capital One $1,535.27 / $3,000.00", then "⚠ Red Alert … $2,035.27" in rgb(248,113,113).
- Saving the levels only keeps $2,035.27.
- A touch tap on the card chart is still drawn at 250 ms, 1.6 s and 3 s. A zoom is unchanged after 2.5 s.
- A tap on the main chart is unchanged across a minute boundary.
- Remove asks once more ("Capital One · Remove card · Cancel") and leaves USAA.
- No sideways scroll, no page errors.

**Left for the operator (not built; his call):**
- Show the alert amounts in the key ("Red Alert $670"). That adds text back.
- "Available" now names both cash and card credit on one view.
- A payoff runway, and the distance to the next alert.
- An older layout bug at phone width: a large negative Available runs into the Accrual Rate (Sofia, c4 capture). It is outside this revision.
