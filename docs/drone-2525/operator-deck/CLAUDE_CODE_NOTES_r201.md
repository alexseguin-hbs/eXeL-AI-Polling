# Claude Code notes · r.201 (2026-10-12) — the magazine keeps its frame

**Source:** the AsM review of r.200 (Sofia), against the operator's r0.178 picture — "why dont the magazines still not look like image 3?"
(2026-10-12). Image 3 at 3 rounds: the gold frame, three red lines, a red "3". r.200 painted the whole count magazine amber below 21 rounds and
red at 5 — a line of r.178's own code (`hudMag`: `frame.setAttribute('stroke', r>20?'#C9A227':tone)`) that his picture never showed.

**Invariant (the patch header):** the frame is gold at every count; the colour of the count lives in the round lines and the number only; a count
of n ≤ 19 lights at least n lines; nothing else of r.200's drawing changes.

## His colour rule (2026-10-12, verbatim: "center is counter where green rounds indicate >= 20, amber is 6 -19, and red is 5 and less")
- `hudMag`'s tone: `r<=5 ? red : (r<20 ? amber : green)` — green at 20 and above (r.178 read amber at exactly 20). The QA row holds 19 amber and 20 green.

## What changed
- `hudMag`: the frame's stroke is `#C9A227` always; the tone (green > 20 · amber 6–20 · red ≤ 5) goes to the round lines and the number.
- The lit lines: `max(min(r, 19), round(19·r/cap))` — 3 rounds light three lines, 12 light twelve, a magazine of 20 and above reads full
  (cap 30); a QUAL magazine (cap 10) still reads full at 10 and empties by its share.
- `#magRounds` 13 px / 700 → 11 px / 500 (the word's size; his "3" is small). `#magWell b` letter-spacing .06em → .14em (his picture's word; the
  card takes the width his phone's font gives it — r.200's "59 px" was measured in a Linux font and is not a phone number).

## Also from the AsM review of r.200 (Thor, after its push)
- The narrow-phone rule (`@media (max-width:367px)`) sat BEFORE the light's own rule and lost the cascade: a 360-px phone kept the 72-px light
  while the box moved to `right:68px` — they overlapped. The rule now comes last in the stylesheet; `LIGHT_WORDS_FIT_ONE_WIDTH` asserts the
  order through CSSOM (the media rule's index after the light rule's) and that the light's content never overflows its box
  (`scrollWidth/Height ≤ clientWidth/Height`, the clock's right edge inside). The lamps' gap 4 → 3 so the content (69) sits in the 69-px box.

## Gates
- Deck QA `MAGAZINE_KEEPS_ITS_FRAME`: at 3, 12 and 30 rounds the frame's stroke, the count of lit lines and the number's colour, the magazine
  restored after. `drone-playable`: the gold line, the lit rule, the number's size, the word's spacing, the row present. The record gates;
  `range-2525`; `drone-team-e2e`; `tsc` clean.

## Owed
- R-CORE in the shared format (the rehearsed port, now r.202) · Drone-2525 on the Vision-2525 worlds page (its own commit, outside the deck) ·
  the label clutter was answered by r.196 (`LABELS_ONLY_WHILE_MARKED`: a label only while a target is marked).

Artefact commit `9ea7ef4` · deck sha256 `2b66093f883dc070675193e261821129fc03a7b04699a318cf61debb6b49abaf`.
