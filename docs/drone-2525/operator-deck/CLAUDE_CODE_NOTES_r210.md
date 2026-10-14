# Drone-2525 · operator deck r.210 — THE ICON AT THE BOTTOM OPENS THE HISTORY CHAIN

Artefact commit `328ed8d` · deck sha256 `62fae4bd572a7dc3bbf729f8e1ee1636a0e427dc3c4bff9b2f463291e3350b3f` · patch `patches/r209_to_r210.py` · red-first `redfirst/r210.md`

## His words

> **Also, not seeing RCORE LOGO TO SEE HISTORY CHAIN**

and, asked where it belongs:

> **icon at bottom**
>
> **same as all other rcore single links at bottom below Target Approve, Fire**

(2026-10-14, **DD-49**.)

## The cause — and it is mine

Measured on the shipped r.209 bytes before a line was written: `grep` for `rcoreBadge`, `RCORE_LEDGER` or
`data-rcore` in `frontend/public/drone-2525/play.html` returns **nothing**. No badge, no panel, no history, no
ledger data. The only R-CORE a player could reach was a static line buried in CONTROLS
(`<div class="log" id="rcoreLoop">REALITY → OBSERVE → RECORD → …`), not clickable and naming no revision; and
`<span id="loopTxt" style="display:none">R-CORE</span>` is deliberately hidden.

Meanwhile **nine** React surfaces mount the shared `RCoreBadge` with the same one-line comment — SoI, Security,
Architect, Celestial, Financial, Settings, SensorFusion, SIM **and the Drone route**
(`components/drone-2525/command-ux1.tsx:147`). So `/main/Drone-2525` has been showing a Drone history while the
deck he actually plays showed none.

How it got lost: r.195 added a `position:fixed` badge at z-index 9 over the dock plus a hand-typed five-row
history — off the shared vocabulary and against the shared rule. r.196's restore removed both, correctly. The
shared-format replacement has been deferred at **every revision since: r.196, r.197, r.198, r.199, r.200, r.201,
r.202, r.203, r.204, r.205, r.206, r.207, r.209 — thirteen times**, tracked in the register's own Owed list, which
slipped r.199 → r.200 → r.202 → r.204 → r.210 → r.214. He did not have to ask twice. He had to ask after I had
moved it thirteen times. That belongs here in those words.

## The invariant

> *The range's R-CORE history is the SAME history, in the same words and the same two-click shape, as every other
> 2525 surface — reached by an icon at the bottom of the glass, fed by the shared ledger, never hand-typed and
> never covering the picture.*

## What a player meets

1. A small framed reticle — **his own raster**, not a glyph — at the bottom of the glass, below TARGET · APPROVE ·
   FIRE, in portrait; beside them in landscape, where the deck leaves no room below.
2. One press: it becomes the **R-CORE wordmark pill**.
3. A second press: the **Version History and compare** panel, the same one Vision-2525 and the eight other
   surfaces show — his wordmark at the top, `Version History · Drone-2525 · /main/Drone-2525 · 87 rev`, the
   latest/historical tag, two impact-ticked scrubbers with ‹/› steppers, *vs previous* and *v1 vs latest*, the
   filterable stat chips, the summary line, numbered KEY IMPROVEMENTS with L1–L5 chips, Unified ↔ Side by side
   over the word diff, the change navigator, the collapsed Details table, the newest-first timeline with D# and ⎇
   commit citations, and the self-contained HTML download.
4. Escape, the × or the scrim closes it; Escape again collapses the pill back to the icon.

## Where it sits, and why that is measured rather than chosen

`placeRcore()` is called from `placeFace()`'s tail and re-run by the same `MutationObserver` — the deck's own rule
for the button row: *measured, never guessed*. Measured on the r.209 bytes, range entered at Lane 21 TRAIN UP:

| viewport | `#face` | room below | placement |
|---|---|---|---|
| 390×844 | y 732–772 | **72 px** | below the buttons |
| 375×667 | y 555–595 | **72 px** | below |
| 428×926 — his phone | y 814–854 | **72 px** | below |
| 844×390 | y 326–370 | **20 px** | beside, same line, left of the buttons and clear of the stick |
| 667×375 | y 311–355 | **20 px** | beside |

The badge also joins `hudKeepOut()`'s one keep-out list, so no lane sign, caption, LOCK line or corner status can
land on it.

## The one green gate that was rewritten

`drone-playable.test.mjs` required the literal string `#rcoreBadge{position:fixed` to be **absent** — the cheap
way to forbid r.195's floating badge.

The deck has **no flow slot at the bottom**: `#face` is itself `position:fixed`, and the `#app` grid's dock row is
`display:none` at **0 px**. Mounting the badge in flow would have shrunk **his picture** by ~54 px — changing
something he did not ask to change, which his own rule forbids. So the badge joins the same control layer `#face`
is in, and the invariant the string stood for is kept by **measurement**: the new boot row
`RCORE_NEVER_COVERS_THE_PICTURE` walks **every** visible box on the page (637 at 428×926) and fails if the badge
touches one.

That is strictly stronger. The string could not catch a badge at `position:absolute` sitting on top of TARGET; the
measurement does. Proven by sabotage on the real cut — moved over the buttons → RED, moved off the edge → RED,
removed from the keep-out list → RED. The ban on a hand-typed history is untouched, and
`frontend/tests/rcore-revisions.test.mjs` — the rule for the React surfaces, where the page *does* scroll and the
badge *does* belong in flow — is not relaxed by one word.

## The engine is a port, and the port is proven

Ported, function by function, from `lib/2525-core/revisions.ts` and `lib/version-diff.ts`: `rcCompare` ·
`rcDiffTokens` · `rcDiffText` · `rcTokenize` · `rcSideBySide` · `rcUnified` · `rcEscHtml` · `rcEscAttr` ·
`rcStripBidi` · `rcRedact` · `rcFirstSentence` · `rcFromLedger` · `rcImpactOf` · `rcCategoryOf` · `rcFnv1a` ·
`rcDownloadHtml`.

Run beside the TypeScript originals over this very ledger: **756 assertions, 0 failures** — the adapter entry for
entry, 86 consecutive LCS diffs, both renderers, impact, category, first-sentence, redaction, 41 full
`compareRevisions` objects field for field, the unknown-pick and reversed-order fallbacks, the escapers on bidi
and zero-width input, and the 3000-token cap.

Two behaviours a careless port gets wrong, both pinned as source text by the gate:
- the **LCS tie-break** — `dp[i+1][j] >= dp[i][j+1]` emits the **deletion** first on a tie. Reverse it and the
  rendered diff differs from every other surface's.
- **impact is read from the TEXT before the kind.** It is not a kind→impact ladder: nine of these 87 rows land
  somewhere a naive ladder would not put them.

## The data

`RCORE_LEDGER` is `docs/traceability/drone-2525.ledger.json`, model ids redacted at embed exactly as the shared
adapter redacts at render, **through rev 87** — the revision before this one. The deck cannot contain its own
release row, which is written in the records commit after these bytes are frozen, so the file is exactly **one**
entry longer. `tests/deck-rcore.test.mjs` holds that lag to exactly one, field for field, and fails at two.

## Gates

- **New:** `tests/deck-rcore.test.mjs` — in **both** `test:ci` and `prebuild`, so a red one fails the Cloudflare
  build as well (the r.208 precedent). **7 passed, 79 failed** on the r.209 bytes; green on these.
- **New boot rows** (deferred, because the badge is wired by an IIFE far below the boot self-check):
  `RCORE_IS_ON_THE_GLASS` · `RCORE_IS_THE_SHARED_HISTORY` · `RCORE_NEVER_COVERS_THE_PICTURE`. They press the real
  buttons, read the real geometry, and put the page back (`QA_LEAVES_NO_TRACE`).
- **Re-expressed:** `drone-playable.test.mjs` — the data-URI count 13 → 15 (the two rasters), the string ban
  replaced as above, and four added assertions.
- **Unchanged and still green:** `tests/rcore-revisions.test.mjs`, `tests/range-frozen.test.mjs` (100 definitions,
  **0 moved**), `tests/range-2525.test.mjs`.

## The range is untouched (DD-35)

No frozen span is edited. `range-frozen` 100 definitions at 0 moved; `range-2525` 118; and both play-throughs were
re-run against the r.210 cut and the **shipped** r.209 served side by side:

- **TRAIN UP — IDENTICAL** field for field, clock dropped: the fifteen `looks`, the three hits, the magazine
  counts, the double-tap leg, the sky-tap refusal and the 3.3× caption measurement.
- **QUAL 40 — IDENTICAL, 40/40 EXPERT on both**, 0 errors, 231 s, the same closing strip.

Stated plainly rather than glossed: the raw QUAL timelines are 167 entries against 168, and the extra one is the
harness's own `phantom-check` sampling note (`up:1, n:0, strays:[]` — a plate raised in the model one frame before
`#phScore` was repainted). It is not a signal, and that was settled by experiment rather than by argument: the
table was run **twice on each revision**, and **r.209's own second run produced 168 entries with 38 notes** —
exactly what r.210 produced, on bytes that had not changed. The count varies run to run because the note fires
whenever the harness samples inside that one-frame window. With those notes set aside, **both pairs are 130
entries and byte-identical**.

## What it costs, measured rather than guessed

The file grows **963,108 → 1,144,501 B** (+181,393): the embedded record 81 KB, the two rasters 45 KB as base64,
the engine, the panel and the badge the rest. The deck's own ceiling is 7.77 MB, so there is room, but the boot
cost is real and is stated rather than glossed — median of three loads at 428×926:

| | r.209 | r.210 | |
|---|---|---|---|
| `domInteractive`, no throttle | 1,120 ms | **1,309 ms** | +189 ms |
| `domInteractive`, 4× CPU throttle | 5,140 ms | **5,319 ms** | +179 ms |

It is a flat parse cost, not a per-frame one: `domComplete` moves by the same amount and the frame loop is
untouched (`drone-deck-qa` reports the same fps and the same drawn frames). The panel's HTML is built only when
he opens it, and the compare runs only on a pick — nothing in the engine runs at boot.

## Owed, and named so he never has to say it twice

- **The ×33 fill of the deck's `rcore.*` strings.** The deck has no lexicon, so the panel ships the English of the
  52 keys verbatim. Staged and listed, under his own law: *no translation fill before the English is final.*
- **Code mode (DD-53) and the Cube-SIM easter egg (DD-54)** are a second reading of this same panel, and are the
  next pass over it — not in these bytes.
- Carried, unchanged: the arena record and `mission-planning.tsx` still hold the Capitol footprint 24.9 % too deep
  north to south; no `test:drone-play` runner in CI; Verify Live polls 10 minutes against an 18-minute job;
  428×926 — the size he actually holds — is still not a CI viewport.
