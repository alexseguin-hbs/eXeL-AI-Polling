# Claude Code notes · r.209 (2026-10-14) — THE SHEET NAMES THE MAP

## His ask, verbatim — and he sent it twice

> This should have the range at top

Sent 2026-10-14 with a screenshot of the QR share sheet, and **sent again with the identical screenshot**
(`docs/asks/img/2026.10.11_18.56..53_drone2525_shot58.png`, sha256 `660e8c66…e133e7`; the second upload is
byte-identical). His own law governs what that means: *when the operator repeats himself, the last answer missed —
change what you do, not how you describe it.* So this is its own revision, built first and alone, ahead of the map
ladder it belongs to.

Persisted before any code, in its own commit, with the five other messages of that day and DD-41…DD-49:
`docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md` (`asks-persist` 220/0).

## What was measured on the shipped r.208 bytes, before a line was written

| | |
|---|---|
| the heading | `LANE 21 · TURRET · TRAIN UP` — written at `play.html:8084`, static default at `:660` |
| the word "map" on the sheet | **absent** |
| the link | `…/drone-2525/play.html?range=21&role=turret&mode=train-up` — `?range=` means the **lane** |
| a Capital station | **could not be shared at all**: there is no parameter that names one |

With the ladder he named the same day (DD-47: THE RANGE → THE CAPITAL → CITY OF AUSTIN → LANDMARKS OF TEXAS →
MAJOR TEXAS CITIES → THE STATE OF TEXAS) the missing word is the map.

## What a player meets now

```
BEFORE   LANE 21 · TURRET · TRAIN UP
AFTER    THE RANGE · LANE 21 · TURRET · TRAIN UP
         https://…/drone-2525/play.html?range=21&role=turret&mode=train-up      ← unchanged

off the range
         THE CAPITAL · TURRET 21/42 · TRAIN UP
         https://…/drone-2525/play.html?map=capital&station=21&role=turret&mode=train-up
```

Three details that are deliberate, not accidents:
1. **The seat is read from the rung.** `units[].label` is **already** `TURRET i/42` (r.131) and is reused, not
   re-derived. But the range parks those same 42 units and renames them `LANE n`, so off the range the seat falls
   back to the station form rather than showing a lane number on the Capital.
2. **The fixed ` · TURRET · ` is dropped where the seat already names the craft**, so the Capital form reads
   `THE CAPITAL · TURRET 21/42 · TRAIN UP` and not `TURRET` twice. The range keeps his own wording exactly.
3. **The link is additive.** The range's own return line is **byte-identical** to r.208's.

## Why byte-identical matters, and what it saved

Two things pin that line, and both would have had to be rewritten if the map had replaced `?range=` instead of
joining it:
- `frontend/tests/drone-playable.test.mjs:87` pins the link's **exact source text**
  (`/play\.html\?range='\+lane\+'&role=turret&mode='\+mode/`). It needed **no re-expression**.
- `.github/workflows/verify-live.yml` **fetches** `play.html?range=21&role=turret&mode=train-up` on every run.
  Untouched.

The `?map=` **reader** is deliberately NOT here. It lands with the ladder in r.211. A link nothing reads yet would
be a promise the deck cannot keep.

## The ladder's first members, and why they are hoisted

`rungIsRange()`, `rungWord()` and `rungSeat()` land in the append zone after `const _mp`, as **hoisted `function`
declarations — never `const`**. `toolSelfTest()` runs at `:5341`, *above* that line, and a `const` there is in its
temporal dead zone at boot. That is the exact failure r.208 records at `:5727` ("VAR, not let … a deck that never
finished booting"). `drone-playable` now pins the hoisting, so it cannot regress silently.

r.211 **extends** `rungIsRange` with `state._selMap` rather than writing a second set — the NO REWORK answer to
his ask to get rid of duplicate menus.

## Gates — red first

Kept in `redfirst/r209.md`: both new `drone-playable` assertions run against the **shipped r.208 bytes** with the
assertions inserted and nothing else changed, and both FAIL. A gate that cannot fail is not a gate.

New boot row **`THE_SHEET_NAMES_THE_MAP`**, **deferred** — the sheet is wired by an IIFE far below the boot
self-check, so the row waits for it, presses the real `#btnQr`, reads the real heading and the real link, and
closes the sheet again. The other rung is read inside **one synchronous block** (`rungWord`/`rungSeat` do not
yield), so no frame can interleave, the scene is never entered, and nothing on the range can drift.

## The range is untouched — proven, not promised

- `tests/range-frozen.test.mjs` — **100 definitions, 0 moved**. `tests/range-spans.json` is not edited.
- `tests/range-2525.test.mjs` — 118, the source-text pins intact.
- Both play-throughs re-run on the **shipped bytes**.

## Owed, carried forward unchanged

The arena record and `mission-planning.tsx` still carry the Capitol footprint 24.9 % too deep north to south ·
no `test:drone-play` runner in CI (both play-throughs are manual evidence) · Verify Live polls 10 minutes against
an 18-minute job · 428×926, the size he actually holds, is still not a CI viewport · the 360-px phones are red and
undeclared.

**Next: r.210 — the R-CORE icon at the bottom, below TARGET · APPROVE · FIRE, opening the history chain** (DD-49;
his words: *"icon at bottom"*, *"same as all other rcore single links at bottom below Target Approve, Fire"*).
It is a debt of this work, not a new ask: r.195 shipped a `position:fixed` badge with a hand-typed five-row
history, r.196's restore correctly removed it, and the shared-format replacement has been deferred in the Owed
section of **every notes file from r.196 to r.208** — thirteen consecutive revisions, the number slipping
r.199 → r.200 → r.202 → r.204 → r.210 → r.214. He should not have had to notice.

Artefact commit `a6f0424` · carried `drone-2525_r.209.html` sha256 `d7b139b02c4d1071cb86a22b62a3cf3f74aaee651578ef94682512ee7b401353`.
