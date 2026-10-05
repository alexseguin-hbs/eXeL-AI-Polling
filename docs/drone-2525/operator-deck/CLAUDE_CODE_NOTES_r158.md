# r.158 — notes (Claude Code, 2026-10-05)

Operator, verbatim (Addendum 6): "Grok, for Range on Qual and Train Up and Train Down, there are grey phantom targets.  Also the lane markers need to be on the actual "sign"   <-- 20 21 --> like attached"

1. Phantoms: drawPlates drew the ±1 neighbour lanes' standing silhouettes in STROKE grey (r.144). Now only my lane's standing targets are drawn on the range. QA NO_PHANTOM_TARGETS: my lane's N silhouettes, 0 grey, while other lanes' targets stand.
2. Sign: MARKER_BOARD_W 1.2 m × MARKER_BOARD 0.6 m; markerSegs draws the post; boardLabels draws the board on the screen around the numbers, centred on the board's centre (never smaller than the words). QA LANE_NUMBERS_ON_THE_SIGN.
3. Lane lines (Addendum 7): laneLineSegs + drawLaneLines — a 35% grey dotted line (dash 2/7) along each lane edge, post to post, 100 → 200 → 300 m. QA LANE_LINES_SIGN_TO_SIGN.
4. Unchanged: the fire doctrine (TARGET amber → APPROVE red, a named human → FIRE), simulation only; every lane keeps its 11 targets.

Deck sha256 62f9fd1f0121c21da790d9f68713df2aa49b6ccca6f9b4f70a1694d2d15af37d · 419540 bytes · chain 040727fe8428286b54344773149a67d70dfe250519aedf1ba43ebe4573fcf604
