# Glossary — Sensor Fusion plan (moved from `PLAN.md` in revision 0.12)

**Words used here, in plain terms.**
- **Band:** a thin strip of Light Codex blocks the DETECT box writes into a video frame (Part B, future hardware).
- **Card:** the model's record — training data, per-class accuracy, speed per tier, and the hashes of its three files.
- **HAL tier:** the class of computer on the vehicle — pi, edge (a system-on-chip, not an Edge TPU) or accel (`lib/wire-core/hal.ts`).
- **Loop-ready:** passed closed-loop replay for one named loop and signed by a named human. Open-loop only = **replay-ready**.
- **Simulation-loop-ready:** passed both gates and signed, but only in a minimal world, because the vehicle has no model yet (Manta-2525, MASS-AI). Never flown.
- **Provisional card:** precision, recall, burst length and p99 assumed at the floors, so Gate 2 runs before any capture. Never signed.
- **Controller-proven (provisional):** Gate 2 passed on a provisional card. It cannot become simulation-loop-ready or loop-ready.
- **Goal target:** a marked place or object a robot drives to, follows, docks with or lines up on. A named human picks it. Never a person.
- **Risk alert:** a message to a named staff role: one plain sentence, the reason and a link to the blurred picture. It drives nothing.
- **Place:** where a model version runs: a robot (by vehicle id), a camera or a computer. The card lists its cleared places.
- **K-of-N:** a track counts once the object is seen in K of the last N frames.
- **False-track rate:** false confirmed tracks per clear minute at the card threshold (Gate 2's unit). It drives nuisance stops.
- **Safe action:** what a vehicle does when it cannot trust what it sees — air: hover (quad) or loiter then transition to quad (wing), then
  land or return; water: hold station; ground: stop. Never "continue". The loop table holds the rule per mode.
- **p99:** the capture-to-output time 99 of 100 frames beat. **Margin m:** spare time under the max age (proposed 10%), so a fresh box never clears on arrival.
- **B minus A:** the time left to act — the whole budget B less the oldest a box may be, A.
- **The three checks:** Gate 1 (the model, open-loop) · Gate 2 (the controller, closed-loop) · signed release (named humans sign both).
- **Medium:** what the camera looks through — air, water surface or under water; each has its own calibration.
- **Heartbeat:** a verified Detection record with zero objects: "alive and sees nothing".
- **Golden vector:** a fixed input with its expected output, run the same in Node and Python.
- **Open-loop vs closed-loop:** open-loop replays recorded frames; closed-loop moves the vehicle in a simulated world, so what it sees changes.
- **Held-out vs replay split:** held-out clips measure the model; replay clips test the loop. Neither is trained on.
- **Track:** one object followed across frames, with an id and a velocity. **Dwell:** the shortest stay in a careful action before relaxing.
- **C clear heartbeats:** verified empty records in a row needed before relaxing (C, so it is never confused with K-of-N).
- **Dead-band:** how far a stick must move to count as human input. One value, from `stick-sets.ts`.
- **Swept corridor:** the strip of space the vehicle will pass through in the next seconds.
- **Clock domain:** which device's clock stamped a time. Ages are compared only within one domain.
- **Lower bound:** the worst recall the held-out test still supports at 95% confidence (exact Clopper-Pearson).
- **Shadow:** a new card runs beside the live one on the same frames and never actuates (C5b).
- **Field event:** one append-only line in `field-events.jsonl` for a safe action, takeover, alert, drill or miss.
- **Hard cases:** field events turned into capture tasks, picked and reviewed first (R2).
- **Stand-off:** the distance inside which a vehicle never surfaces or approaches a person or swimmer.
- **Slack:** A − m − p99 − P, the time left over in the timing law. **Stale share:** the fraction of boxes older than A on arrival.
- **Cool-down:** the quiet time after one alert per hazard track. **Escalation:** the alert goes to a second named person if unacknowledged.
- **Report:** a third output kind — a sighting or finding sent to a named human. It drives nothing.
- **Pose:** the vehicle's attitude, gimbal angles and an IMU sample, stamped in the capture's clock domain.
- **Slow:** move at the row's creep speed (its parameter file), reached at the row's deceleration limit; the setpoint table in `loop-spec.json` holds it.
- **Creep:** the slowest controlled speed a row allows (m/s), used by slow, the false-cliff override and docking.
- **Covering sensor:** the independent sensor that catches what a class's detector misses.
The citation test checks that every glossary term used in Part C is in this list.
