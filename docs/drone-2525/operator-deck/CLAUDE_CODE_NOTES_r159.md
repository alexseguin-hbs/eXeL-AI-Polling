# r.159 — notes (Claude Code, 2026-10-05)

Operator, verbatim (Addenda 9–10): "Signs need to be smaller like uploaded images (realistic as photo uploaded)" · "DO not cover targets with signs" · "And have White/Black like uploaded image" · "PC operations must be able to use arrows for turret and arrows and asdw for drone operations.  Once should also be able to operate mouse.  Right click should target approve, left click fire.  or T or space for target, space for approve, and F for fire."

1. Signs: MARKER_BOARD_W 0.6 m × MARKER_BOARD 0.35 m; boardLabels returns the real projected board rectangle and a font size that fits it; the painter fills it white and writes black numbers when the font is ≥ 5 px; signCoversTarget(r) drops a sign that touches a standing target of my lane. QA LANE_NUMBERS_ON_THE_SIGN, SIGNS_NEVER_COVER_TARGETS.
2. PC: pcTargetApprove(obj) is the one door for SPACE and the right click (target → approve → "fire with F"); left click → fireN; the contextmenu is suppressed on the picture; arrows/WASD as before (controlLaw). QA PC_KEYS_AND_MOUSE.
3. Unchanged: TARGET (amber) → APPROVE (red, a named human) → FIRE; FIRE refuses anything not red; simulation only.

Deck sha256 d30d2ca9d0cc9d05c22b1c98cebcb1072c3f963a6a8fb71f6a0a8d41766644cb · 423674 bytes · chain 2c1cdd94fffe718bb085d4b2fa5c0e156f57d0da08dd87f3b9f10190315218b7
