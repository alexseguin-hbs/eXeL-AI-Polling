# Light Codex — canonical extended alphabet (share this with Grok / OpenAI)

The single source of truth in this repo is `frontend/lib/light-codex.ts` (browser/node) and its PDF binding
`frontend/lib/codex-pdf.ts`, tested by `frontend/tests/codex-pdf.test.mjs`. This folder mirrors that set for
sharing and for the Python signer.

**Colour order:** `B R Y G C V W` = Black, Red, Yellow, Green, Cyan, Violet, White. Every character is a
4-token group. **Green (G) is reserved for the transmission frame only.**

## Alphabet (collision-free, reversal-safe)
```
A WWCC  B RRRR  C CWRC  D YCCY  E CCRR  F WRRW  G YCYC  H WWRR  I YBBY  J CWWC
K YYCC  L YBYB  M WCWC  N CWCW  O RRYY  P CCCW  Q YYYY  R RWWR  S WWWC  T RWCC
U RWRW  V WRWR  W CCRW  X WCCW  Y YRYR  Z YCRB
(space) WBWB   . BBBW   - VCVC   _ VRVR   • VYVY   : VBVB
0 BBBB  1 WBBB  2 WWBB  3 WWWB  4 WWWW  5 VBBB  6 VWBB  7 VWWB  8 VWWW  9 VVVV
frame:  4 GGGG  3 GGGR  2 GGRR  1 GRRR
```

## What changed 2026-09-18 (vs the older signer)
1. **space no longer collides with 0.** Old `' ' → BBBB` equalled `'0' → BBBB`, so a space decoded as "0" and
   the signer's own `validate_no_duplicates()` would raise. Now `' ' → WBWB` (unused, no green, reversal
   `BWBW` unused); `'0'` stays `BBBB`. (eXeL AI's r0.104 sidestepped this by using periods as separators —
   `SYNC.LEVEL.3.SEQ.12`; fixing the alphabet lets a real space be used again as well.)
2. **Four symbols added (2026-09-08):** `-` VCVC · `_` VRVR · `•` VYVY · `:` VBVB. Each is unused by every
   letter/digit/frame, contains no green, and its token-reversal is unused — so a strand read backwards can
   never turn one into a taken character.

## Files here
- `Light_Codex_Encode_Decode.py` — the updated CLI signer/decoder (drop-in replacement for the older file):
  same three helix styles, same green 4321/1234 framing, this alphabet. `validate_no_duplicates()` passes.
- `light-codex.html` — a self-contained, dependency-free reference + encoder/decoder (open in any browser):
  the character table with colour swatches, text → codex PNG (single/double/hidden helix), and PNG → text
  decode with forward/reverse verification. This is the shareable artifact for Grok / OpenAI to align to.

## Not in this folder
The Drone-2525 **game** is a Next.js route (`/drone-2525`), not a single self-contained HTML — the ≤7.77 MB
standalone game HTML is a separate planned deliverable (plan P2/3). The current shareable single-file game
build is the operator's deck (r.104), produced by Grok / eXeL AI.
