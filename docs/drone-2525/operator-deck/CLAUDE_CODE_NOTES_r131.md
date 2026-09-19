# Drone-2525 — handoff note for r.131 → r.132 (Claude Code, 2026-09-19)

HEAD: `drone-2525_v.00.00_r.131.html` (245877 B, sha256 `700a51469e3e5ab1…`), served at `/drone-2525/play.html`
byte-identical. Register: `REVISIONS.md` (append-only, chain-hashed). Fleet review that produced it:
`docs/assessments/2026-09-19_r130_fleet_review.md`. Patchers carried under `patches/`.

## Carry forward (the rules, in one place)
1. **ONE forward basis** — `fwdOf/rightOf/yawTo`; **ONE world position** — `worldOf(ref)`; **ONE aim** — `aimUnitAt(u,ref,lo,hi)` from
   the camera EYE to the centre of mass. Never derive a forward, a target position or an aim inline again.
2. **Authority is scoped to the exposure.** `rangeRelease(q)` on hit or lapse. `applyHit` refuses a plate that is not the lane's
   current, standing exposure. One round per exposure in QUAL·40 (`q._eng`). A miss never re-arms the CH5 second authority.
3. **What you must hit takes the segment budget first** — `drawPlates` (range) / `drawTargets` (Capitol) before the world; the swarm
   only from headroom.
4. **The record over the toast.** HIT rows carry the band; LAPSE and QUAL advances are events; `pack().qual` exists; the batch
   says SIM; QA restores events and leaves no designation.
5. **QA rows must be able to fail for the reason they name** (fleet lens 8B): picture-terms rows at non-zero yaw
   (`PIT_SEES_300_RIGHT_250_LEFT`, `PAN_RIGHT_MOVES_WORLD_LEFT`, `FWD_AT_YAW90`), the SAME plate returning, `qualH===0`.
   The deck's rows now run in CI (`npm run test:drone-deck-qa`) against `tests/deck-qa-manifest.mjs`.

## r.132 (owed): the wire path and the room
- Net APPROVE through the same rule as the button (phase must be amber; in LIVE the approver is a seated member ≠ designator).
- Net DESIG writes `tgtSlot`, honours the lane guard, never overwrites a red singleton; a foreign-lane mark is shown as a peer
  mark, never adopted as my box.
- SNAPSHOT never imports red or `hiApproved`; restores `lobby.phase`.
- Six ambers, six approvals: `approveDesig(who, slot)` and `fireN(n)` honour the slot; the HUD shows who marked / who cleared.
- A canonical range clock (host EXPOSE/LAPSE events or per-lane {k, phase, t} in the snapshot) before any two-phone RANGE claim.
- Reduce in `orderKey` order (re-reduce the sorted log) so the world follows the hash.
