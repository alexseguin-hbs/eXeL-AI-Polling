# RED FIRST — DD-81 · the `</>` chip takes the badge's own place

**His words (2026-10-17, asked twice):**

> place code at bottom center of R-CORE JUST LIKE R-CORE IS AT BOTTOM center all screens

**The law he is pointing at, already written and already gated:** `components/2525-core/rcore-badge.tsx:71` is
`className="flex w-full justify-center"` — a full-width centred row in normal flow, mounted last, never a fixed
overlay — pinned by `tests/rcore-revisions.test.mjs:120` under his own 2026-09-25 words *"Smaller logo is in
bottom center of all Innovation 2525 projects."* DD-81 is that law one level in.

## 1 · The four source legs, RED on the r.215 panel (the chip inside the `role="group"` mode strip)

```
$ node tests/rcore-code-record.test.mjs        # the legs inserted, the panel untouched
FAIL: the chip stands in a FULL-WIDTH CENTRED ROW, in the badge's own class grammar (DD-81)
FAIL: the mode strip keeps Unified and Side-by-side ONLY — the chip is no longer a third segment beside two text labels
FAIL: the chip is MOUNTED LAST in the panel body — nothing renders below it (the badge's own rule)
FAIL: the code elements open ABOVE the chip, so the chip does not move when it opens (as the badge does not move when its panel opens)
rcore-code-record: 262 passed, 4 failed
```

Green after the move: `rcore-code-record: 266 passed, 0 failed`.

## 2 · WHAT THE FIRST CUT GOT WRONG, measured rather than guessed

Last-in-flow satisfied his sentence to the letter and defeated it in fact. Measured on the built export, with
the chip mounted last and nothing else:

| viewport | chip's top inside the panel body |
|---|---|
| 375 × 812 | **17,595 px** |
| 428 × 926 | **17,198 px** |
| 1280 × 900 | **14,396 px** |

Below Financial-2525's 166-row history. On a page the badge is at the bottom and he **finds** it — that is the
whole of his sentence. So the row became `position: sticky; bottom: 0`: still normal flow, never `fixed` (the
thing `rcore-revisions.test.mjs:120` bans), riding the bottom of the panel at every scroll position and settling
at the true bottom at the end. Three further legs hold it there, red before the sticky edit:

```
FAIL: the bottom-centre row is STICKY to the bottom of the panel, so he sees it at every scroll position
FAIL: it is sticky and never FIXED — the badge's law (rcore-revisions.test.mjs:120) holds one level in
FAIL: the row clears the phone's home bar (the page contract's safe-area rule)
```

Green after: `rcore-code-record: 269 passed, 0 failed`.

## 3 · Measured on the built export, three sizes, all three beats — 36 of 36

```
  ✓ 375: the row is sticky (computed position sticky)
  ✓ 375: with the panel scrolled to the TOP the chip is ON SCREEN at the bottom (768-812 of 812)
  ✓ 375: the chip is CENTRED in a full-width row (mid 171 of 172, row 343 px)
  ✓ 375: the chip is NOT inside the WHAT CHANGED mode strip
  ✓ 375: in the live DOM the chip comes AFTER the mode strip and is the LAST child of the panel body
  ✓ 375: no horizontal page scroll (375 of 375)
       beat 1 box 48×24
  ✓ 375: beat 2 — the wordmark stays centred (152×52)
  ✓ 375: beat 3 — the code elements open
  ✓ 375: beat 3 — the code opens ABOVE the chip; the chip is still last and still on screen at the bottom
  ✓ 428x926: with the panel scrolled to the TOP the chip is ON SCREEN at the bottom (882-926 of 926)
  ✓ 428x926: the chip is CENTRED in a full-width row (mid 198 of 198, row 396 px)
  ✓ pc: with the panel scrolled to the TOP the chip is ON SCREEN at the bottom (856-900 of 900)
  ✓ pc: the chip is CENTRED in a full-width row (mid 534 of 534, row 1068 px)
dd81-shots: 0 failed
```

**428 × 926 is the size he actually holds** and is still not one of the CI viewports — carried, named, owed.

## 4 · One measurement correction of my own

The first viewport leg asserted `chip.top > strip.bottom`. That is the wrong test for a sticky row: pinned at
the bottom of the viewport, the chip legitimately sits ABOVE content that is further down the scroll, so the leg
went red at 375 while the layout was correct. It was replaced with the invariant that actually holds —
`compareDocumentPosition` plus `parentElement.lastElementChild === row` — document order, which is what "mounted
last" means.

## 5 · Not mine, named not hidden

`scripts/sf-layout-smoke.mjs` (postbuild, Chromium-gated) fails one of 27 legs:
`844×390: the whole picture and SAVE BOX are in one view (picture 170 px, -132 px above the buttons)`.
It is **pre-existing** — proven by running the same script against the `out/` of a build made before this change
(`98e1b25e6`), where it fails identically. It is a SensorFusion labeler layout defect at 844×390, it does not
reach the deploy (Cloudflare Workers Builds has no Chromium, so `smoke-if-chromium.mjs` skips there), and it is
out of this change's scope. Carried and owed.
