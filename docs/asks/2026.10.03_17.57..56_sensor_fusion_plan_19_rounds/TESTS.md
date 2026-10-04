# Part C tests — the numbered list (moved out of PLAN.md in revision 0.11)

> This file is the seed for the test-spec header of `frontend/tests/sensor-fusion-loop.test.mjs`. Grok copies it there as a comment
> block when C1 ships; until then it lives here, beside `PLAN.md`. Numbers have no gaps; a new check extends a test, never renumbers.
> Each item is a method to build, not a test that exists today.

## Tests (when built)
In `frontend/tests/sensor-fusion-loop.test.mjs` and `sensor-fusion-loop-replay.test.mjs` (plain Node). Each joins `test:ci` only when
its revision ships.
1. Every row holds p99 + P ≤ A − m ≤ B (exact equality and P ≥ A refused); a 121 ms Drone box is cleared; an unmapped tier is refused.
2. Each failure row gives its action; none gives "continue".
3. A model with no card, or a mismatched card hash, is refused; a v2 card missing `burstLen` or `falseTracksPerClearMin` is refused
   for any loop (0.11).
4. A model too slow for a loop's budget on a tier cannot be selected.
5. A pinned clip gives the same decisions twice; an injected dropout gives the safe action.
6. Browser and Python give the same detections at the same per-class thresholds on one pinned frame set, with the same count when one class id is out of range.
7. No loop action changes a Drone-2525 slot, approval or fire state (extends Part B test 7).
8. 60 s of black or smeared frames with zero boxes never returns continue; 60 s of healthy empty heartbeats never trips; for every row, 1, 2 and 3 drops at p50 and p99: fewer than k never trip, k always do;
   a frame with its left third smeared fails the occluded-tile rule; a thermal night clip is scored on the thermal floor, not RGB (0.11).
9. Every family shows its own status words from `loop-spec.json` (0.11); `components/sensor-fusion/loop-panel.tsx` reads the same Detection and command record types as `round.tsx` (0.13); every safe action belongs to its vehicle's set; `person`/`swimmer` never widen past slow, hover, hold or stop; every action word in Part C
   prose belongs to its vehicle's set (the citations test scans it).
10. One changed byte in `edgetpu.tflite` is refused; an unknown contract major gives the safe action; `checkid` is refused.
11. A takeover overrides any loop action within one tick, except a family clamp in the precedence table; the test reads that table (0.11); one member cannot sign both card and gate.
12. Golden vectors give the same action in Node and Python; a Detection record round-trips through the `vision_msgs/Detection2DArray`
    and MAVLink `OBSTACLE_DISTANCE` bridges unchanged (0.11). (0.13) Each action word's setpoint gives the same command sequence in Node and Python, "slow"
    included (`MAV_CMD_DO_CHANGE_SPEED`, velocity setpoint or Nav2 speed limit); a bridge refuses an unauthenticated link and strips
    person classes; loop replay imports only `fnv1a64`, never the fire-gate `Ledger`, `replayHash` or `DecisionRecord` (source check).
13. A v1.1 record acts like v1.0; no capture ms, a future stamp or a skewed domain gives the safe action; a pinned tensor with class id 999
    gives `unknown` in Node and Python, and the loop gives slow.
14. Alternating good and bad frames never return "continue"; a 10 fps flicker never beats the dwell; after a takeover or "detector lost"
    only a human re-arm restarts the loop.
15. A stick past the dead-band on tick t voids the loop output on tick t (arbiter; keys and analogue sticks; all vehicles); the dead-band
    is read from `stick-sets.ts` (source check); with `crew.pilot` set to AI a human stick still wins and a loop slow caps the AI; a stick
    toward a sensed drop-off on `mass-droid` gives stop and "Stopped: drop-off ahead"; a press-and-hold creep override past a false
    cliff reading moves at creep speed, logs a field event and is refused while the downward range shows a real drop (0.11); no `lib/2525-core` file imports `@/lib/drone-2525`.
16. At recall 1 the emulator's boxes match the projected obstacles within 1 unit; every `drone-avoid-01` class has an arena object.
17. Each air action, through `stepFlight` from quad, wing and transition mode, ends inside the budget (wing: "begin loiter" inside B − A);
    water and ground actions end inside B; no action lacks an actuator mapping.
18. Bytes and roster: a right-named file with another sha256 is never loaded (one buffer, no second fetch); one changed edge-script byte
    drops the loop to simulation; a forged entry breaks the chain; a revoked key or unsigned roster fails; a stale cached `models.json` is
    refused; v1 readers parse v2; edge copies and the `play.html` bundle hash equal; no plain member id under `public/sensor-fusion/`; a
    camera place refuses the self-update and `BASE`.
19. One injected takeover adds one hard-case task with its clip hash; an off-domain clip set trips the drift row.
20. A retired card cannot be selected; its history still replays.
21. Gate 2: one obstacle hit in N runs fails; live, a sudden class flip or a box jumping past the tracker gate gives slow and a field
    event (0.11); a glare burst of K frames, or a miss run longer than H, gives the safe action; synthetic
    frames never enter held-out or replay, and match the emulator at recall 1.
22. The arena hash is unchanged by an empty obstacle layer.
23. Pose, tracker and range: a 20° bank with a level-camera box gives the world bearing; a pose older than m is refused; Node and Python
    give the same track ids over a pinned 40-frame clip; a 2× range disagreement never returns continue; a record with no pose is
    replay-ready only; a skewed flight-controller clock without a fresh offset is refused.
24. A 4-frame camera buffer never reports an age under the real one; a browser with no stamp source is never loop-ready; a clip replays
    in its own domain and the same records are refused live.
25. The citations test fails if a later migration re-grants `anon` on 040 or 041, or a step marked open names an existing migration.
26. Every row has ≥ 5 ms slack; a soak with 2% of boxes over A refuses the row; a Gate 2 row missing N, clearance or cap is refused.
27. A wire across the loiter circle makes the Drone climb to the ceiling; nothing surfaces or approaches inside a stand-off; stopping
    distance and turn radius come from the vehicle parameter file. Golden (0.11): a 1 cm wire at 2 px on a 640 px, 70° input is seen
    to about 2.3 m; ~~at 3 m/s the Drone's minimum detection range is 2.0 m~~ (withdrawn 0.13: impossible, see PLAN.md speed envelope);
    a wing-mode leg below the wire ceiling in an unmapped area is refused before arming. Golden (0.13): an unmapped quad with no
    rangefinder is refused; the wire ceiling is read from the region's spec file, and a 25 m mapped span raises it to 28 m; a rangefinder
    with no measured 1 cm wire rate is refused as wire cover; a GNSS bound over the margin drops a mapped row to the unmapped rule; the
    wing loiter circle radius is at least the turn radius.
28. A foreign domain with a fresh offset inside m is accepted, a stale one is not; a pre-reboot stamp is refused; a polar record and a
    two-camera disagreement give the golden action; a record with no medium is refused.
29. Every vehicle id in `controls.ts:20-21` gets a `VehicleCommand` of its own family, and only air gets `FlightInput`; a pinned record
    stream gives identical command sequences from `loop-actions.ts` and `loop_runner.py`; `actuators.json` in `edge/` and `download/` match
    byte for byte; an unsigned MAVLink or ROS 2 link refuses to arm; a v2 spec read by a v1 runner gives the safe action; Gate 2 and C6
    refuse without the takeover drill records; every loop class names a covering sensor, and an unmapped-wire burst miss is a Gate 2 scenario;
    every `PlatformId` in `platform.ts:13` is mapped in `contract.json` or marked no-loop, D1Q has no wing row, and D1F below the wire
    ceiling outside mapped spans is refused (0.13).
30. A single tap never re-arms; each re-arm and takeover writes a field event with a salted id; 60 s without input after "detector lost"
    keeps the safe action and repeats "You have control"; an air stick past the dead-band shows "You have full control; the loop is
    only advising" and writes a field event (0.11).
31. `loop-ready` is refused for a vehicle absent from `VEHICLE_MODELS` (golden: `manta-mini-66-33` is in `VEHICLES` but not
    `VEHICLE_MODELS`, so it is refused); arming is refused when the autopilot's link-loss failsafe is off or would continue (0.11); C6 needs the signed gate hash and the safety pilot's salted id; every
    action maps to a protocol action for every family in `actuators.json`; an undeclared autopilot version is refused; golden vectors per family;
    an action word with no speed or mode message in its row refuses arm (0.13).
32. With Coral on and a card measured on `detect.tflite`, an armed loop refuses (extends `sensor-fusion-coral.test.mjs`); flipping the
    switch while armed changes nothing and logs one field event; a failed load never falls back to the other file.
33. 300 runs on one layout are refused as N; an unmapped-wire stratum with 30 runs cannot carry a 1% claim (0.11); a provisional card can never be signed.
34. A card lapses to replay-ready when its own `loop-spec.json` section, the edge script or `detect-contract.ts` changes hash, or past its
    max age; adding a camera hazard leaves the Drone's card loop-ready, and changing a Drone threshold lapses it; a spec hash changed mid-run leaves the armed loop's command stream unchanged until the
    next arm (0.11).
35. A takeover's hard-case task lands in the named store; no clip from region A's held-out appears in region B's train.
36. A person or swimmer can never be a goal; a person in the corridor during approach gives stop within one tick; a lost goal, a goal
    inside a stand-off and two candidates each give stop, never approach; a follow target faster than max speed, outside the geofence or in
    another robot's corridor gives stop and clears the goal; a dock marker lost at 3 cm docks on odometry, the same loss at 50 cm stops.
37. A camera-cleared card is refused by a loop; a loop-ready card on a camera only alerts; an unknown place gives no action; the camera
    path imports nothing from `loop-actions.ts`, writes no `FlightInput` and sends no image bytes to `/api/notify` (source check); no alert route is public.
38. 100 frames of one spill give one alert; an unacknowledged alert escalates on time; an offline recipient's alert is queued; a
    failed-blur stub stores nothing; an acknowledgement stops escalation and a second is a no-op; an alert with an image and no consent id is
    refused; an unpaired device never receives an alert; the eleventh pairing guess and an expired code are refused;
    reports get the staff line, acknowledgement and escalation; Node and Python pairing derive the same key from one transcript; an unacknowledged smoke alert sounds the local audible alert within its budget.
39. A camera card listing `checkid`, `head`, `eyes` or a face label is refused; an unconsented school picture blocks the merge and the
    camera clearance; removing one consented clip lapses every card that used it; retention equals decision 18; fall and crowd ids are refused
    while decision 20 is open; no camera alert or field event carries a track id older than the cool-down; camera field events and hard
    cases keep 7 days, and a camera hard case without a consent id never enters R2; each refused contributor picture maps to exactly one
    plain sentence (0.11).
40. A row missing a Gate 2 or card value, or a class with no floor, is refused; 3 clear clips are refused; a card over its bearing ceiling is not ready; the three class lists match; a camera place
    missing any value, or a robot alert purpose with no values row, is refused; a smoke clip scored above 10 s, or scored on fewer than
    59 alerts, is not ready; a p99 claim on fewer than 299 events is refused; measured pilot recall 0.93 against an assumed 0.96 raises the
    142 quota; every purpose has an output kind (action, alert or report); zero false confirmed tracks pass at 25 Drone clear minutes and
    fail at 24, pass at 50 Manta minutes and fail at 49; a report purpose with no class list is refused; a row with no speed envelope or
    covering sensor (Drone person, Manta swimmer) is refused; a `c1-bench.json` under 299 frames per tier is refused; each speed row's v × B + stop + v × A_track equals its printed range;
    a quota sized iid but scored clustered is refused (0.11). (0.13) Every worked number in PLAN.md prose is recomputed from the parameter
    file (the wire sum is 3.6 m); the wing row is computed at stall (46.8 m) and cruise (62.6 m) from `domain.gen.ts:1302-1314`; eXeL
    dock creep 0.1 m/s gives exactly 2 cm and is refused; A_track is (N + `burstLen`) × P; a report with no retention class is refused;
    unmapped wire carries its own 628 quota at the 0.97 floor.
41. A provisional card reaches only controller-proven; no signature or roster commit carries a personal email; no file under
    `public/sensor-fusion/` holds the salt; one member id hashes differently in two projects; signing keys are non-extractable; a roster change with one root-holder signature is refused (0.11). (0.13) The reaction-time ceiling
    is (range − stop − clearance) ÷ v per row, and a MASS-AI drill p95 of 1.2 s against its 1.17 s refuses arm.
