# Claude Code notes — Drone-2525 r.047 → r.050

HEAD: `drone-2525_v.00.00_r.050.html`  
Prior pack: `CLAUDE_CODE_NOTES_r042_r047.md`  
Do not skip numbers. Do not overwrite `ASM_CUP_99.*`.

---

## r.047 (baseline of this slice)

- Default **click / tap = TARGET**. Immediate. No 280 ms wait.
- **Double-tap / double-click = FIRE**.
- TARGET button and voice `target` are redundant designate paths.
- Do not slew the camera with `targetN()` on a simple click.

---

## r.048

HI shots: turret look-stick in the corner; target only a color shift; FIRE too easy.

- Turret: L stick hidden. **R look-stick centered** above the dock.
- TARGET / FIRE sit above the dock, not on top of it.
- `drawTbox()`: HUD rectangle on the designated object + **T1/T2/T3**.
- FIRE without a box → `NO RED BOX` (`reason: NO_RED_BOX`).

---

## r.049

HI: first mark is not a shot. Second person must approve.

| Phase | Color | Who | Fire |
|---|---|---|---|
| none | — | — | no |
| **amber** | `#F0A020` GIMBAL | first HI TARGET / click | no · toast `AMBER · SECOND HI APPROVE` |
| **red** | `#E24B3B` LOCK | second HI APPROVE | yes |

- `state.desig.phase = 'amber' | 'red'`
- `approveDesig('HI-2')` on this device (solo second authority).
- Other tab: BroadcastChannel `{k:'APPROVE', id}` turns the box red on the net.
- APPROVE face button next to TARGET / FIRE.
- Play HUD: `AMBER POP-5` vs `RED POP-5`.
- Decision record on APPROVE: `hiApproved`, `by`, `from` (designator).

---

## r.050

HI: keep click / double-click redundancy on top of amber→red.

- Click / tap still **TARGET → amber** (toast `T1 … AMBER`).
- Double-click still **FIRE**, but only if phase is **red**.
- CONTROLS copy: `CLICK / TAP = TARGET (amber) · DOUBLE TAP = FIRE (needs red box)`.
- Paths that all designate (amber): click, TARGET button, voice `target`.
- Paths that all fire (need red): double-click, FIRE button, voice `fire`.

Double-click must **not** skip APPROVE.

---

## Contract for r.051+

```
click / TARGET / voice target  →  amber box + Tn
APPROVE (HI-2 or net peer)     →  red box
FIRE / double-click / voice fire →  only if phase==='red'
```

Turret: one centered look stick. Civic sim only. HI authority. Next file is **r.051** only if something changes.
