# Claude Code notes · r.198 (2026-10-12) — QUAL: the five positions on the card; the range goes cold

**Asks (operator 2026-10-11, verbatim):** "i need Raster for each pose" · "I want clear rasters for 5 shooting positions; same height as magazines and
stop light accept a rounded square" · "we match the shooting position tonthe target and 4 magazines that we actually test in wualifications for army
range" · "mini poses are raster sinplications 1983 starwars video game style with words of these 5" · "standing; Prone unsupported, Prone Supported,
Kneeling Supported, Standing Supported" · (2026-10-12) "dont use stick figures; better high resolution modern images, make gun different color than
person". Decisions (2026-10-11): trace the five from his TC 3-22.9 figures; one pose at a time on the card. The last word wins: his own figures,
at high resolution, the rifle in its own colour — no stick figures.

**Invariant (in the deck as a comment on `POSE_BY_ENG`):** in QUAL the pose on the card is the position the current engagement is fired from and the
magazine is the one the Army test loads for that phase; every target still needs TARGET → APPROVE → FIRE; the table ends cold, on the record.

## Causes
1. r.178 showed the position only as a toast ("PHASE n · pos · PRESS RELOAD · MOVE"); r.180–r.194 (hand edits never registered) drew it five ways —
   a row of stick figures, one tile, line art, then five FILLED multi-colour SVGs (three colours off the deck's own thirteen) in a 58×52 box of its own
   height with the word outside and a hand-typed `left:158px` — art pasted into the file with no source and no gate.
2. The cold range (r.179/r.181) lived only in those hand edits; r.196 restored the r.178 base without it, so the table ended with "QUAL DONE" and plates
   still standing.

## What a player meets
- QUAL 40: beside the round count, a rounded square the magazine's height shows the engagement's position as his own TC 3-22.9 figure (ivory, the rifle gold) with its word —
  STANDING for the 50 R, PRONE UNSUPPORTED through engagement 5 (MAG 1), PRONE SUPPORTED (MAG 2), KNEELING SUPPORTED (MAG 3), STANDING SUPPORTED
  (MAG 4); in the rest between phases the card already shows the next position; outside QUAL there is no card.
- The 40th round: every plate down, every mark cleared, CEASE FIRE · UNLOAD · SHOW CLEAR · the score · THE LINE IS CLEAR · RANGE IS COLD · PRESS
  RESTART on the glass; the light reads CEASE FIRE · COLD; RELOAD reads UNLOAD and refuses; the card reads RANGE IS COLD.

## The rasters (his pages, one recipe, one file)
- Source: his five TC 3-22.9 pages as he sent them (`docs/asks/img/2026.10.11_18.56..53_drone2525_shot3..7.jpg`, 1284 px wide).
- `frontend/scripts/trace-poses.mjs` + the recipe `docs/drone-2525/poses/poses.v2.json`: Chromium decodes the page; each pixel of the figure crop is
  classed by luminance — paper (> 228) → transparent · the uniform's grey (185–228) → the PERSON, `T13.SI` · mid grey (110–185) in the long, filled
  horizontal rows of a component → the RIFLE, `T13.DOME` · black (< 110) thin → outline, `T13.ROAD`; the numbered callouts are found three ways (an
  enclosed white interior, a digit, a round ring) and painted over along their radii so the figure's edge runs through them as it did; the prone
  figures are mirrored so every rifle points right; the crop is fitted into 256×256 by majority vote. Node writes a 2-bit palette PNG with stored
  deflate (crc32/adler32 in the script) — `pose-0..4.png`, ≈16.7 KB each, `POSES.sha256`. The patcher embeds them as `POSE_PNG` data URIs; the card
  is one `<img>` (52×52, smooth) with the word under it. A few callout rings at the figures' edges survive at full size; at the card's 52 px they are
  below one pixel. Re-tracing needs Playwright (the decoder), so the carried PNGs are the record and the gate holds them, not a regeneration.

## Gates
- `tests/pose-rasters.test.mjs` (node-only, in prebuild and test:ci): the carried PNGs are 256×256 2-bit palette files whose palette is exactly
  transparent · person · outline · rifle from the deck's own T13 (the gun never the person's colour); the served and the carried deck embed exactly
  those bytes; the five words in his order; `POSE_BY_ENG` exact; `POSES.sha256`; the tracer carried beside the recipe.
- Deck QA: `POSE_MATCHES_THE_ENGAGEMENT` (engagements 1, 2, 5, 6, 10, 11, 14, 15, 18, the two phase rests, done, outside QUAL),
  `POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT` (75×75 vs 75, radius 12, one row, between the count and the light, the figure 52×52),
  `QUAL_ENDS_COLD` (every plate down, marks cleared, the words, UNLOAD refuses, the COLD row 37/40, the light); `QUAL_DONE_SAYS_RESTART` re-stated
  to the cold words. `drone-playable`: the words, the table, five data URIs, one image node, the card CSS, `qualFinish` with the COLD row,
  `qualDropStrays`, no "QUAL DONE" left.
- Boot QA both orientations (only `SYNC_DIRECT` red); `drone-team-e2e` 10/10; `range-2525`; the record gates; `tsc` clean; `next build`.

## Open (defaults taken, on the record)
- The colours: person `T13.SI` (ivory), rifle `T13.DOME` (gold, like the count magazine), outline `T13.ROAD` — one line each in the recipe.
- The phase-rest sentence stays r.178's "PHASE n · <position> · PRESS RELOAD · MOVE"; r.181's tower voice ("CEASE FIRE · LOCK AND LOAD · <position>")
  is not carried.
- A mid-phase reload with rounds left: r.178's rule unchanged.

## Owed
- r.199 R-CORE on the range in the shared format from the shared ledger; DD-01…DD-06; the ship column filled.

Artefact commit `d93370d` · deck sha256 `d8cc52d45d2a7af2a5fba4c27f6dae3d57afe524560476b4fc7542c6fdfabc41`.
