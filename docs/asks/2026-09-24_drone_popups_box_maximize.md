# Operator ask — 2026-09-24 (Drone-2525 range UI, two screenshots)

> again, pop ups are good in prior version (see all targets Up for Target - Up mode). and see orange box to
> indicate target is Approved. Red box equals target approved.
>
> Add maximize from Mission Planning in upper right versus words to indicate Full Screen Mode (and minimize
> arrows instead of Exit)

Reference screenshots:
- docs/asks/2026-09-24_drone_popups_box_current.png — the served range (TRAINING · RESET / "Target - Up"): all
  targets up at 50–300 m, a red bullseye reticle, LOCK C-100C-L21; the top bar shows a "FULL" WORD button and
  the header X (Exit) top-left.
- docs/asks/2026-09-24_drone_box_amber_red.jpg — the 3-frame reference for the designation box: (1) no box, (2)
  AMBER box on TARGET ("T1 · 150M E · AMBER"), (3) RED box on APPROVE ("T1 · 150M E · RED").

What it means:
1. POP-UPS · TARGET-UP: in TRAINING · RESET ("Target - Up") every target is UP together (as in the prior good
   version); a hit target returns. Confirm the served deck shows all-up and that a pop can be fired (the r.151
   FIRE-gate fix). If any target is missing or unfireable, fix it.
2. THE DESIGNATION BOX: TARGET draws an AMBER (orange) box around the designated target; APPROVE turns that box
   RED. The box must be visible around the marked target (not just the reticle). (Operator wrote "Approved" for
   both; intent per the frames: amber = targeted/marked, red = approved.)
3. MAXIMIZE ICON, not the word: replace the "FULL" text button (upper right) with the Mission-Planning maximize
   ICON (the ⤢-style control Security-2525 Mission Planning uses), same affordance.
4. MINIMIZE ARROWS, not "Exit": replace the header X (Exit) with a minimize-arrows control.
