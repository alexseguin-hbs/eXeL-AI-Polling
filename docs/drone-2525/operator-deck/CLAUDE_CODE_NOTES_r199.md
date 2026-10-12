# Claude Code notes · r.199 (2026-10-12) — QUAL: the five positions are his own picture, cut exactly, on a square box against the light

**Asks (operator 2026-10-12, verbatim):** "use this from eXeL AI" · "use my images exactly for 5 shooting positions" · "DO NOT USE your images BUT
eXeL AI corrected inages" · "heres perfect images" · "STOP TRYING YOURS USE MINE / DELETE THE ORIGINAL AND USE eXeL AI" · "heres the correction,
just remove borders around text" · "show me the 5 shooting positions" · "k; so when showing positions it will be in square box right of the center
magazine with counter (as visual reminder to gamer" · "better yet, have it left of fire box" · "with stop light indicstor on targets" · "push and
commit". Ask file `docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md` (addendum 2026-10-12, shots 12–28, hashed).

**Invariant (in the deck as the patch header):** the position on the card is HIS figure — cut from his own picture by one carried script, never
redrawn, the rifle its own colour as he drew it — one at a time, matched to the engagement and the magazine as in r.198; the box is a square of
the magazine's height that sits against the light's left edge and never touches the count, on a 375-px phone as on a wide one; the targets keep
the light's colours (amber targeted, red approved — r.196).

## Causes
1. r.198 traced his TC 3-22.9 pages into one-colour figures; he rejected them three times in one hour ("your range silhouettes look fucked" ·
   "DO NOT USE your images" · "STOP TRYING YOURS USE MINE") and sent his own picture: five tan figures with dark rifles on black (shot12), then
   the same with cyan labels (shot13) and in cards (shot14, "the correction, just remove borders around text"). The rule from here: the picture
   is the master; the code cuts it, it does not draw it.
2. r.198 placed the box right of the centred count (`left:calc(50% + 32px)`). He wants it against the fire light ("better yet, have it left of
   fire box") — the gamer's eye goes from the position to the light to the targets. The light's width floated with its word (50–85 px, widest on
   "NEXT 3 S"), so a box hugging it would have met the count on a 375-px phone; the light now has one width.

## What a player meets
- QUAL 40: against the light's left edge, a 75-px square shows his figure for the engagement — TACTICAL STANDING for the 50 R, UNSUPPORTED PRONE
  through engagement 5 (MAG 1), SUPPORTED PRONE (MAG 2), SUPPORTED KNEELING (MAG 3), SUPPORTED STANDING (MAG 4) — the tan soldier, the dark
  rifle, the sandbag / post / wall as he drew them, the word under it in the cyan of his cards, no border around the word. The rest between phases shows the next; done
  reads RANGE IS COLD. Outside QUAL there is no box.
- The light reads the same words in a box one width wide (72): WAIT · READY · FIRE · CEASE FIRE, the QUAL count, the TRAIN DOWN clock (11 px).
- A target is amber when targeted and red when approved (unchanged, r.196) — "stop light indicator on targets".

## The figures (his picture, one cut, one record)
- Source: `docs/asks/img/2026.10.11_18.56..53_drone2525_shot12.png` (1672×941, the five on black), sha256 in the ask's sidecar.
- `docs/drone-2525/poses/cut-stances.py` (python3 + ImageMagick): pixels above the black (grey > 40) are labelled as 8-connected shapes; a
  shape of 5,000 px or more is a figure, a smaller one joins the figure within 30 px (the wall top of SUPPORTED STANDING); five figures, left
  to right. Each is cut with its own shape as the alpha (closed by 3 px so the dark lines inside the figure are not holes), a neighbour's
  pixels in the same crop masked out (the prone figures' crops overlap by two columns), fitted to a longest side of 256 px →
  `stance-0..4.png` (RGBA; 239×256, 256×73, 256×81, 256×226, 165×256; 19–57 KB), `POSES.sha256`. Embedded as `POSE_PNG` data URIs.
- Deleted ("DELETE THE ORIGINAL"): `docs/drone-2525/poses/pose-0..4.png`, `poses.v2.json`, `frontend/scripts/trace-poses.mjs`.
  `HASHES_r198.sha256` still names them as what r.198 shipped; the register row for r.198 stands.
- The words: his labels from his own cards, in his order — TACTICAL STANDING · UNSUPPORTED PRONE · SUPPORTED PRONE · SUPPORTED KNEELING ·
  SUPPORTED STANDING. `POSE_BY_ENG` unchanged (1 · 2–5 · 6–10 · 11–14 · 15–18).

## The box
- `#posWell`: 75×75, radius 12, `right:76px` inside `#magWell` (whose right edge is the light's) → 4 px to the light. The figure stands on the
  floor of a 69×52 box (`#posPic`, `align-items:flex-end`), `max-width:69px;max-height:52px;width:auto;height:auto` so its shape is kept; the
  word (7 px, two lines) under it.
- `#app.range #startLight{width:72px;box-sizing:border-box;padding:4px 3px}`; the word's letter-spacing .14em → .06em ("CEASE FIRE" 59.6 px),
  the clock 13 → 11 px ("NEXT 3 S" 58 px, "12:34.5" 51 px) — all inside the 64-px interior. Measured on the r.198 bytes: the light was 84.9 wide
  on "NEXT 3 S", 76.3 on the clock, 50.4 on "COLD".
- Room on a phone: 375 wide → RELOAD 8–73 · count 167–209 · box 216–291 · light 295–367 (7 px between the count and the box); 390 wide → 14 px.

## Gates
- `tests/pose-rasters.test.mjs` (node-only, in prebuild and test:ci) rewritten: his picture carried and its sha in the sidecar; the cut script
  carried ("connected shape"); the five RGBA PNGs, longest side 256, ≤ 64 KB; `POSES.sha256`; the served and the carried deck embed them
  byte-equal; his words and the table; the CSS of the box (right:76px, 75×75) and the light (72 wide); one figure box, one image node; the
  originals gone; no tracer named in the deck.
- Deck QA: `POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT` re-stated (square of the magazine's height; one row; against the light ≤ 8 px
  and ≥ 4 px clear of the count, measured; the figure box 69×52 and the image's fit), `POSE_MATCHES_THE_ENGAGEMENT` re-stated to his words.
  `drone-playable`: his words, the box CSS, the light's width, `#posPic`, no `left:calc(50% + 32px)`, no tracer. Boot QA both orientations
  (only `SYNC_DIRECT` red); `drone-team-e2e`; `range-2525`; the record gates; `asks-persist`; `tsc` clean.

## Open (defaults taken, on the record)
- The toast between phases says his words too ("PHASE 2 · SUPPORTED PRONE · PRESS RELOAD · MOVE" — `IWQ_VI[].pos`), so the glass has one vocabulary (review note, Enlil); the word under the figure is the cyan of his cards (T13.WIRE), 7 px in two lines.
- The figure is fitted to 69×52 (the prone figures read 69×20 on the phone); if he wants them larger the box widens, not the figure stretched.

## Owed (one at a time, after this is LIVE)
- The magazine proportions to his crops (shot15 flipped on the y axis, shots 17/18 copied exactly, the count centred) · the label clutter
  (shots 21/22) · Drone-2525 on the Vision-2525 worlds page (shot20) · R-CORE in the shared format (shot19; the rehearsed port) → r.200+.

Artefact commit `4911e6b` · deck sha256 `a6664bfe507e4dfa08b89c5ad95a050214f45016ffe57cf18f09b4bec9aa8973`.
