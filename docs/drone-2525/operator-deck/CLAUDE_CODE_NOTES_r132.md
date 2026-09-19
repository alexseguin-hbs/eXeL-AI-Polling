# Drone-2525 — handoff note for r.132 → r.133 (Claude Code, 2026-09-19)

HEAD: `drone-2525_v.00.00_r.132.html` (256197 B, sha256 `d48ec579e31a7dfd…`), served at `/drone-2525/play.html` byte-identical.
Register: `REVISIONS.md`. Patcher: `patches/r131_to_r132.py`. Two-phone gate: `frontend/scripts/drone-team-e2e.mjs`.

## The rule that landed
**The wire path obeys the same rules as the buttons.** `peerDesig(id, by, slot, kind)`, `wireApprove(id, by, quiet)`,
`importSnapshotDesig(pay)` are the ONLY ways a peer's mark, approval or snapshot touch `state.desig`/`state.tgtSlot`; the
reducer (`applyWorld`) and the receive path (`commIn`) both call them; when the envelope carried a canonical row the receive
path only speaks. `decide('HOLD'|'REJECT')` transmits its row. A tab message never downgrades a DIRECT link.

## r.133 (owed)
- A canonical range clock: host EXPOSE/LAPSE rows (or per-lane {k, phase, t} in the snapshot) so two phones raise the SAME
  silhouette at the same moment — today the hashes match because the event rows match, while each phone runs its own
  exposures from its own `dt`.
- Reduce in `orderKey` order (re-reduce the sorted log) so the world follows the hash on out-of-order delivery.
- 2v2+: `lobbyCanLaunch` still refuses match > 1 ("MULTI-PEER TRANSPORT NOT QUALIFIED") — one host, N joiners over
  WebRTC needs a mesh or a relay; the 38-AsM team test below runs the deck's own multi-seat logic in-process.
- Two real phones on a real network, recorded (the operator's hardware).
