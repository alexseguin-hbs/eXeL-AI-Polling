# r.161 — notes (Claude Code, 2026-10-05)

Operator, verbatim: "T for Target, Space for Approve, and F for fire do not work.  Also if I click with mouse on target, the center of bulleye to move to that location for max use of mouse." · "ensure click on mouse moves position of turret to center bulleye on target."

1. Root cause of "T doesn't work": KeyT called targetN((slot % 99) + 1) — each press stepped to the next slot and marked the next-nearest target, not the one under the bullseye. Now KeyT = the TARGET button (markLock(lockOn())).
2. GAME_KEYS beat a focused BUTTON/SELECT (blur + preventDefault). F = fireN(slot||1).
3. mouseAim(sx,sy): on a target → aimUnitAt (bullseye centred), remembered as state.aimRef so lockOn returns it while the bullseye stays on it; on blank ground → turn by atan(dx/focal); on the red mark under the bullseye → fireN. Right click aims then pcTargetApprove.
4. Mark toast in plain words. QA MOUSE_CLICK_CENTRES_THE_BULLSEYE, KEYS_BEAT_FOCUS; PC_KEYS_AND_MOUSE re-pointed.
5. Headless walk (1280×800): aim at 200 M RIGHT, picker focused → T: AMBER 200 M RIGHT · Space: RED · F: HIT.

Deck sha256 543ed59859ab6c17329cf082d5fd22d6cf3f3305eb85179ca1ae7c61c9121403 · 428373 bytes · chain 10ef6640d7e7f7b8cc213d7056eafea1965a11a0101b40abc15b47c1c3b02774
