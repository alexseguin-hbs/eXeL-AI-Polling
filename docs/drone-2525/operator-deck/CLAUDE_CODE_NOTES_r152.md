# CLAUDE_CODE_NOTES r.152 — the full-screen control is an icon, not a word (2026-09-24)

Built by `patches/r151_to_r152.py` (8 asserted edits; a miss refuses) from r.151. Ask:
`docs/asks/2026-09-24_drone_popups_box_maximize.md` — **"Add maximize from Mission Planning in upper right versus words to
indicate Full Screen Mode (and minimize arrows instead of Exit)"**, with two screenshots. Two things were asked; one was a
change, one was a reconfirmation.

## Change 1 — the icon (what shipped)
Invariant, in the operator's words: **the full-screen control looks like the rest of the app.** The app's maximize/minimize
affordance is the ChartFrame glyph in `frontend/app/SoI-2525/page.tsx` (`portfolioMax ? "⤡" : "⤢"`) and Security-2525 Mission
Planning's Maximize2 / Minimize2 — **`⤢` to enter full screen, `⤡` to exit.** The deck carried two controls whose label was the
WORD `FULL`, toggled to `EXIT`:
- `btnFullBar` — top `.bar`
- `btnFull` — `#magBar`

What changed (and only this):
1. Both buttons' rest label is now `⤢` (was `FULL`); a descriptive `title` + `aria-label` (`full screen`) carries the meaning the
   word used to.
2. The toggle writes `b.textContent = on ? '⤡' : '⤢'` (was `on ? 'EXIT' : 'FULL'`) and updates `title` / `aria-label` to
   `exit full screen` / `full screen`.
3. `#btnFullBar{order:9;margin-left:8px;font-size:16px;line-height:1;padding:2px 12px}` — the top-bar maximize icon renders LAST in
   the flex bar, where the existing `flex:1` spacer right-aligns it at the **upper-right without disturbing the CONTROLS / DATA / MORE
   dropdowns** (they keep their places), bumped to a comfortable tap size. `#magBar #btnFull{font-size:15px}` so its glyph reads.

Out of scope, untouched: `setFull` (the CSS `#app.full` mode + `requestFullscreen`/`exitFullscreen`), the `#app.full` rule that hides
the words while the sticks · TARGET · APPROVE · FIRE · RELOAD stay, the `fullscreenchange` listener. Only the label glyphs, the two
buttons' `title`/`aria-label`, and the top-bar button's position/size moved.

## Change 2 — the pop-ups (verified, no fix)
The operator re-asked to confirm pop-up behaviour. Confirmed on the SERVED deck (`public/drone-2525/play.html`), headless Chromium,
390 px, both the deck's own boot QA and a driven walk:
- **(a) TRAINING · RESET ("Target - Up"):** every target is up together (50–300 m) — boot rows `TRAIN_ALL_UP` / `MODE_RESET_RETURNS`.
- **(b) TARGET on a pop → an AMBER box** (T13.GIMBAL) around it — boot rows `AMBER` / `VOXEL_BOX_FOLLOWS_THE_MARK`.
- **(c) APPROVE → the box turns RED** (T13.LOCK) — boot rows `RED` / `VOXEL_BOX_FOLLOWS_THE_MARK`.
- **(d) FIRE on an approved pop → HIT** (a round spent, not `TARGET_OFF_PICTURE`) — boot rows `FIRE_HITS_A_POP` /
  `FIRE_ON_THE_BOX_STILL_HITS` (the r.151 fix).

All four already work. **No change was made to the pop / box / fire logic** — the r.151 `LOCK_REACH_PX` fire fix is untouched.

## The gate
- **`FULLSCREEN_IS_AN_ICON`** (in-file boot QA, beside `HUD_SCORE_WRAPS`): reads both buttons at both toggle states — off →
  `⤢`/`⤢`, full → `⤡`/`⤡`, never the word. The note carries the measured glyphs; `scripts/drone-deck-qa.mjs` holds it to a note regex
  (a predicate replaced by `true` cannot pass).
- **REPO source gate** (`tests/drone-playable.test.mjs`): the served bytes carry the `⤢`/`⤡` glyphs on `btnFullBar` and `btnFull`, the
  toggle writes `on?'⤡':'⤢'`, the top-bar button is `order:9` right-aligned, and `>FULL</button>` / `on?'EXIT':'FULL'` are GONE.

## Do not regress
- The full-screen glyphs are `⤢` (U+2922, maximize) and `⤡` (U+2921, minimize), one source with the SoI-2525 ChartFrame convention.
- `setFull` and the `#app.full` behaviour are out of scope for this change.
- The pop / box / fire logic (r.151's `LOCK_REACH_PX`) is out of scope — it was verified, not changed.
