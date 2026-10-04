# Sensor Fusion → DETECT → control loops — the plan for Grok (revision 0.10)

> Living plan, revised once per round of the 19-round SSSES · SPIRAL · AsM simulation (see `ASK.md`, `rNN.md`).
> Goal (operator): create Drone-2525, Manta-2525 and MASS-AI detection quickly as a global team — our models, introduced into control loops.
> Loop teams: start at Part C. Label teams: start at R2. Camera teams: start at the Addendum 1 section.
> Regional teams: your files are `capture-spec.json` and your section of `loop-spec.json`; your first test is the citations test; your
> blocking decision is in your week-one row.

**Done at round 19 (every later fold points to a line here).**
1. `drone-avoid-01` box is complete: both gates, signed, every value cited.
2. Every vehicle family gets its own command type and one on-vehicle loop host.
3. Every loop class names the sensor that covers its misses.
4. Every purpose has an output kind (action, alert or report), or is marked later.
5. Every statistical claim has a sample size and a stated method.
6. Each loop's spec section changes without lapsing another loop's card.
7. Every alert path is paired, local first, and never carries a picture without consent.
8. Every human who takes over has a recorded drill.
9. The plan meets its word budget, with the per-region tables generated from data.
10. The citations test is green at its pin, with no test-number gaps.
**Answer first** (decisions ranked by the teams each one blocks): 9, then 8, then 14 (17 and 21 next).
> You are Grok. Methods, files and tests for you to build; no code here. Each revision is listed in the history below; 0.00 was the merge of the two sources.
> Sources: `2026.10.03_17.43..08_sensor_fusion_ask_to_grok_capture_label_projects_v3_FINAL.md` (body, appendix omitted) ·
`2026.10.03_17.55..31_detect_cable_light_codex_video_for_grok.md`.

## Revision history
| Rev | Round | What changed |
|---|---|---|
| 0.00 | — | Consolidated v3 FINAL (R1–R10) + DETECT note. |
| 0.01 | 1 | Chain overview with owner roles; Today-vs-gap re-verified (R1 shipped, citations fixed); R1 reduced to its test; local vs server tracks; R4 split, guest read **and write** closed first (R4a); R2 domain conditions and numbers; R9 class floors + model card hand-off; new Part C (control loops, safe actions, HAL, sim-first, safety gate); one merged decision list; Part B citation + salt fix. |
| 0.02 | 2 | Glossary; Part C no longer waits on DETECT hardware (neutral versioned Detection record, adapters for cnn.js and the Python edge script, shared `loop-spec.json`); staleness in ms, heartbeat splits "clear" from "detector lost"; per-vehicle action sets; floor and world columns; open-loop vs closed-loop replay; card lives in `models.json` v2 with file sha256s and measured ms per tier; HAL fit corrected; train / held-out / replay split by clip; identity models never loop-eligible; false-negative row over an independent minimum; Part C build steps C1–C5 and a first loop-ready deliverable; gate re-cited; decisions 9 and 14. |
| 0.03 | 3 | One timing law (frame period, max age, heartbeat timeout, actuation) with Drone/Manta/MASS-AI values that add up; hold, recovery and human re-arm; one Detection record v1 shared with Part B (capture ms stamped at grab, confidence 0–9999, sensor and camera ids, optional range and track); box-to-path rule; two gates (model open-loop, controller closed-loop with a detection emulator); arena obstacle layer, `loop-actions.ts`, minimal water and ground worlds; supply-chain gate (BASE, self-update, hash-chained sign log, deny list, one labelmap source); held-out size from the floor, blur parity, local Level 2, 5% re-check; field-to-capture queue and drift row; first-week table per domain; Python runner. |
| 0.04 | 4 | Critical path at the top of Part C; timing law at p99 with a 10% margin and a soak, rows re-valued; Drone safe action per flight mode (loiter in wing mode, 4 s transition as its own term); one arbiter in `loop-actions.ts` reusing the `stick-sets.ts` dead-band; status lines, takeover and re-arm for all three vehicles; water and ground kinematic steps; Gate 2 pass line and a burst-miss emulator; held-out sized by an exact Clopper-Pearson bound; polyline labels for thin objects; pinned training recipe per region; real signatures (ECDSA P-256), roster out of `public/`, browser hash check, pinned `models.json`, byte-identical edge copies; R4a blocks C3; C2 parity on pinned tensors; minimum crew; citations re-anchored. |
| 0.05 | 5 | Re-based on the repo: R4a SHIPPED (042, `0c25475`) with its test wired into `test:ci`; pictures are PNG (`c49a9d4`), so R2, R5, R7, R9, R10 follow; citations re-anchored and the citations test promoted to the first local step with a line budget; seat RPC, review UPDATE policy and NULL-project quarantine (R4c); held-out sized by power (one-sided 95%, power 0.8); precision floors per class; Manta row re-valued with a 5 ms slack floor; wing-mode in-path by turn radius; Gate 2 valued (N ≥ 300, clearance, nuisance cap); simulation-loop-ready for Manta and MASS-AI; calibration by medium; clock-offset handshake and polar records; signer roster with rotation and revocation; one-buffer hash check in `cnn.js`; C6 bench then fenced field; Part B moved to an appendix. |
| 0.06 | 6 | Re-based on `origin/main` `b512ba7` with a "Shipped since the last round" box; citations held by anchor strings (line numbers are hints) and a word budget; R3, R6 and R9 extend the shipped `readVoc`, `markLevel2` and `mergeTraining` (no second merge); reviewer identity in the XML, and today's training.json marked unreviewed; R4c adds the missing review and labeler columns with `labeled_by = auth.uid()`; seat borrowing for small regions; held-out sized by distinct clips and a monotone power rule; nuisance stops gated by a per-frame false-positive rate on whole clear clips; capture burden and pixels-on-target; heartbeat H = kP + p50, dwell and K valued; minimum detection range adds track confirmation; boot-id clock domain; two new failure rows; the runtime file comes from the signed card, never the Coral switch (reuse `modelFile` / `runPlan` / `model_file`); provisional cards and a Gate 2 scenario generator; card lifetime; field-event store and signature write path named; actuator protocol actions; decisions 15 and 16. |
| 0.07 | 7 | Addendum 1 folded ("Robots, goals, risks and cameras"): eXeL AI robot row, places on the card, safety and goal layers, alerts to named staff via `lib/notify.ts`, schools policy as data, goal and alert failure rows, bearing ceilings, night sensor; Gate 2 and card values with clear-frame minutes; controller-proven (provisional); one class list per loop; ECDH citation, neutral signing identity, salt home; citations test scans `ASK.md`; decisions 17–18; tests 36–41; cuts to the 14,000-word budget. |
| 0.08 | 8 | Re-pinned at `026c2ed`: R3 and R9 import the unused `voc.ts`; `37df2c1` a regression, unnamed classes become `unknown`; citations test fails on drift from its pin; quotas 392, 142, 68, dock marker 124, 30 distinct clear clips; alerts off `lib/notify.ts`, local-only first (decision 19), no picture leaves the site, acknowledgement as a field event; camera values, role and week-one row; fall and crowd off (decision 20); MASS-AI safety-only (decision 21); goal speed, geofence and corridor rows; one ground action set; `actuators.json`; shadow (C5b); runtime format; cuts. |
| 0.09 | 9 | Arbiter returns a `VehicleCommand` per family (air, ground, water); one on-vehicle loop host `edge/loop_runner.py` held to `loop-actions.ts` by golden vectors; `actuators.json` moves to `public/sensor-fusion/`, keyed by autopilot and firmware major, signed links required; Detection record v1.2 pose block, one tracker (`track.ts`), range fusion rule; every loop class names the sensor that covers its misses (Drone wire, ground drop-off); `report` output kind; MASS-AI row and decision 21 match the operator's words; n_eff, percentile event minimums, precision quotas and pilot re-size; per-section spec hashes and a spec version handshake; staff devices pair through the shipped ECDH pairing; takeover drill; blind final approach; Manta loss split by source; per-tier input size; C1 bench named; tests renumbered without gaps; glossary terms; For schools card drafted; Done at round 19 list. |
| 0.10 | 10 | Frame health splits "clear" from "blind" (record v1.3); pose from the autopilot link; nuisance scored on false confirmed tracks per clear minute (Poisson), per-frame cap and n_eff dropped from Gate 2; speed envelope and worked minimum detection range per vehicle; covering sensor for Drone person and Manta swimmer; arbiter precedence (safety, human, AI pilot or goal) with core-owned command types and a per-family human-over-safety rule; stuck stick; link-lost and peer-corridor rows; report values and staff line; pairing hardened (non-extractable role keys, single-use code with expiry and lockout, Python port with interop vectors); link keys on the vehicle; clip tombstones; `VEHICLE_MODELS` data, replay R-CORE check, synthetic-floor contradiction resolved; test 9 pointer fixed; C1 bench ≥ 299 frames per tier. |

## The whole chain in one line (read this first)
capture (R2) → Level 1 boxes (R3) → Level 2 review (R6) → XML + Light Codex strip (R3, R10) → `<Set>.train.json` (R9) → model folder +
model card (hand-off, R9) → edge or DETECT (Part B, appendix) → display → **control loop** (Part C, C1–C6: Drone-2525 air · Manta-2525 water · MASS-AI ground).
The citation test also checks that every R and C number in this line exists as a heading or build step.

| Role | Picks up |
|---|---|
| Labeler | R2 capture, R3 Level 1 boxes |
| Reviewer (never the labeler) | R6 Level 2, R9 merge |
| Model builder | the training hand-off: train.json in, three files + model card out |
| Loop integrator (one per region: air, water, ground) | Part C replay gate, HAL fit, its world in `replay.ts` |
| Contract owner (one, cross-domain) | `detect-contract.ts`, `loop-spec.json`, `actuators.json`, golden vectors |
| Camera integrator (school region) | camera values, consent status, the local alert screen |

**Start here — one line per role (next action · file it touches).**
- Labeler: capture your region's first classes in the conditions listed (R2) · `public/sensor-fusion/capture-spec.json`.
- Reviewer: Level 2 another member's boxes, never your own (R6) · the set's `.xml` files.
- Model builder: run the pinned recipe on a merged set (R9) · `public/sensor-fusion/recipes/recipe.json`.
- Loop integrator: build your region's world and emulator (C4) · `lib/sensor-fusion/replay.ts`.
- Contract owner: write the record, the spec and the golden vectors (C1) · `lib/2525-core/detect-contract.ts`, `loop-spec.json`.
- Camera integrator: write the camera values and the consent check (Addendum 1 section) · `loop-spec.json`, `capture-spec.json`.

The R numbers are build steps, not plan revisions (0.NN) and not Sensor Fusion ledger releases.

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
- **False-positive rate:** false boxes per clear frame at the card threshold, after track confirmation. It drives nuisance stops.
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
- **K clear heartbeats:** verified empty records in a row needed before relaxing.
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
- **n_eff:** the effective number of independent frames when frames in one clip look alike; used only with a stated prior ρ.
- **Pose:** the vehicle's attitude, gimbal angles and an IMU sample, stamped in the capture's clock domain.
- **Covering sensor:** the independent sensor that catches what a class's detector misses.
The citation test checks that every glossary term used in Part C is in this list.

---

# Part A — Sensor Fusion: capture, label, build models as a team (v3 FINAL, R1–R10)

> Operator ask of 2026.10.03: **use the tokenomics visual from https://exel-ai-polling.explore-096.workers.dev/vision-2525/** for
> contribution time (screenshot: `2026.10.03_17.43..08_sensor_fusion_tokenomics_visual_vision2525.png`). v3 folds the twelve-lens test into v2.

You are Grok, coding `frontend/app/SensorFusion-2525/` and `frontend/public/sensor-fusion/` on `main`. Short sentences in the app. **One
revision at a time:** commit R1, wait until the live site serves it, then start R2.

## Rules that do not change
- A model is one folder with three files: `detect.tflite`, `edgetpu.tflite`, `labelmap.txt`. Never rename them. Never add a second way to store a model.
- Nothing a person sees names a database, an error code or a vendor. One plain sentence; the detail goes to the console.
- The screen never says "saved", "uploaded" or "reviewed" before it is true.
- New words: the key goes in `frontend/lib/lexicon-data.ts`, and its name goes in `AFTER_FILL` in
  `frontend/tests/lexicon-coverage.test.mjs:19`. It stays English until the operator says the English is final. No translation fill.
- A test for a later revision does not enter `test:ci` before that revision ships.
- **Citations are checked, not trusted.** `frontend/tests/sensor-fusion-plan-citations.test.mjs` (plain Node, script `test:sf-plan-cites`)
  is **the literal next commit, before any other R or C step**. The same commit adds `test:sf-coral` for the existing coral test; both join
  `test:ci` beside `test:sf-r4a` (`package.json:10`, `:192`); `test:sf-coral` runs with `node --experimental-strip-types`, since
  the coral test imports `sf.ts` (`sensor-fusion-coral.test.mjs:3`). Each citation is **path + anchor string**; the line number is only a hint.
  It fails if a path is missing, an anchor is absent, a step marked open names a migration that exists, a Part C status or term
  (loop-ready, replay-ready, simulation-loop-ready, controller-proven, provisional, goal target, risk alert, place) is not in the glossary,
  an `ASK.md` addendum heading is named in no PLAN.md section, or a loop's class lists (loop table, first deliverable, week-one table)
  differ from `loop-spec.json`. It records its **pin SHA** and fails when `git log <pin>..HEAD` touches a cited path with no plan note, or
  when a "no code commit since X" sentence disagrees with `git log X..HEAD -- frontend/`. **Round start:** it prints each cited file changed
  since the pin, and the editor refreshes those rows before folding. **Word budget:** 14,000 words in 0.07, falling by 1,000 each revision to 9,000 by 0.12 (the appendix
  counts); prose lines at most 360 characters, falling to 200 by 0.09 (tables exempt). It also fails when a numbered test list has a gap or
  a duplicate, when a citation is a bare file name that matches more than one path (write `frontend/notify-core.js`, never `notify-core.js`),
  or when a loop row's purpose has no purpose list and output kind in `loop-spec.json`.

## Today vs gap (read the code first — do not rebuild what ships)
**Shipped since the last round** (pinned at `origin/main` `026c2ed`; last code commit `8f2bddc`; code commits since the 0.06 pin:
`0140439`, `7a9d4f9`, `dd6d410`, `37df2c1`, `8f2bddc`).
- `0140439`: `lib/sensor-fusion/voc.ts` exists — `vocXml(page)` (:34), `readVoc` (:71), `VocPage`. Nothing imports it, and `sensor-fusion.tsx`
  still runs its own `vocXml` (~:186), `writeXml` (~:231) and `readVoc` (~:237): two readers today (R3). CPU is now the default (`sf.ts` `modelFile` ~:57, `runPlan` ~:62).
- `37df2c1`: `cnn.js:106-107` skips a box whose name is empty or the placeholder; Python keeps the placeholder name
  (`sensor_fusion_edge.py:178`). A **regression** against the adapter rule (C2 prerequisite).
- `7a9d4f9`, `dd6d410`, `8f2bddc`: ledger revisions 32 and 33 (`ledger.ts:234`); C steps take rev 34 or later.
- Earlier: `02872b9` `markLevel2` (~:454), `mergeTraining` (~:471); `3acb1d5`, `26d9d12`, `80e6a1c` `model_file` / `interpreter_for`, the `sf2525-coral`
  choice (~:757); `c49a9d4` PNG; `0c25475` R4a with `test:sf-r4a`. Gap: `test:sf-coral`.
| Already in the code | Where | Gap |
|---|---|---|
| Steps "Capture Images" and "Annotate Images" | `app/SensorFusion-2525/steps.tsx:2-3` | Capture takes only sensor + device today; video picking (R2) |
| AI accuracy meter | score `const top = hits.reduce` (~:783), toggle `setShowScores` (~:1195) in `sensor-fusion.tsx` | none — keep it |
| Six training icons as the step bar | ledger r. entries `ledger.ts:132-146` | none — keep them |
| Pascal VOC writer and reader | `function vocXml` (~:186), `function writeXml` (~:231), `function readVoc` (~:237) in `sensor-fusion.tsx`; unused `lib/sensor-fusion/voc.ts` (`0140439`) | the page **imports** `voc.ts` and deletes its three copies; never a third reader (R3) |
| Pictures saved as PNG | **SHIPPED** `c49a9d4`: `.png` names (`function peekNames`), `canvas.toBlob(..., "image/png")` (~:343, ~:865) | R2, R5, R7, R9, R10 follow PNG; the manifest's extension equals what the page writes |
| Picture + label tables | `040_sensor_fusion_pictures.sql`, `041_sensor_fusion_labels.sql`; **R4a SHIPPED** (`0c25475`, `042_sensor_fusion_members_only.sql`: guest policies dropped, `sensor_fusion_members`, member-only read and insert; `tests/sensor-fusion-r4a.test.mjs`) | 041 lacks `level`, `labeled_by` and review columns; `owner_key` is free text, never bound to `auth.uid()`; no way to seat a member; NULL-`project_id` rows vanish (R4c) |
| Model list | **SHIPPED:** `public/sensor-fusion/models.json`, read by `sf.ts:23`, `cnn.js:50` and both edge scripts (`:36-52`) | only the R1 test |
| Names `head.0001.png` that continue | built by `function peekNames` / `function commitNames` (~:267-272) | dot form → `<label>_<NNNN>.png` (R5), with migration |
| Fixed detection threshold | `cnn.js:104` (`score > 0.5`); also `sensor_fusion_edge.py:176` in both `edge/` and `download/` | per-class thresholds from the model card (Part C) |
| Invite codes | `lib/drone-2525/si-pod.ts:119` `inviteCode` = seeded hash fed to `randomPodCode`; `admits` `:149` runs in the browser | live codes from crypto bytes + a server check (R4b) |
| Vehicles | `lib/2525-core/controls.ts:20-21` (`vtol-quadwing`, `manta-99-66`, `manta-mini-66-33`, `ark-sail-33`, `mass-droid`); `:19`: only `turret` and `vtol-quadwing` exist today; `lib/drone-2525/platform.ts:10`; Manta project `lib/pod-projects.ts:86`; `lib/2525-core/MANIFEST.md` | no detection contract; no water or ground world, so Manta and MASS-AI replay is open-loop until one exists (decision 14) |
| Compute tiers | `lib/wire-core/hal.ts` `HAL_PROFILES` (pi/edge/accel), `halCnnMs`, `sensorFits`; `tests/drone-hal.test.mjs` | render budgets, not model time; the card carries measured ms (Part C) |
| Shipped labelmaps | `models.json`: `demo90` (COCO), `thermal01` (`:553`, dog, person), `checkid` (`:541`, four named people), `tree` (`:136`), `deer` (`:109`), `custom01` (`:145`, boat, car, bird), `head` (`:118`), `eyes` (`:127`) | no wire, pole, hull, pier, buoy or step; seed `drone-avoid-01` from `tree`, wildlife from `deer` (R9.5); `checkid`, `head`, `eyes` on the deny list |
| Model bytes source | `BASE`, a third-party master branch (`cnn.js:8`, `sensor_fusion_edge.py:34`); no browser hash check (`cnn.js:64`, `:67`); Python fetches at `:127`, installs by `os.replace` (`:128`), updates itself from `APP` (`:35`, `:285`) | pinned, hash-listed copies named by the signed card |
| Two edge-script copies | `public/sensor-fusion/edge/` and `download/`, byte-identical; `model_rows` reads a cached `home()` `models.json` first (`:39-47`) | `edge/` is the source, `download/` gated byte-identical |
| Detector timing | `sensor_fusion_edge.py:167-169` and `cnn.js:80`, `:116` time inference only | both adapters stamp capture time at the read (Part C) |
| Detection payload | `lib/light-codex-detect.ts` — **does not exist yet** | Part B method 1 |
| Pod clock | `lib/pod-clock.ts` | wire to project elements (R8) |
| Trinity cards (♡ SI · 웃 HI · ◬ AI) | `app/vision-2525/page.tsx:168-195`, data `lib/soi-framework.ts:32-34` | reuse as one shared component (R8) |

## Revisions, in order (each: its done line, its tests, then wait for LIVE)

**Start now, per region** (generated from the critical-path table in Part C; the citations test checks they agree).
- Everyone: `test:sf-plan-cites` and `test:sf-coral` (the next commit), then the R1 test.
- First slice per region, week 1: one class, one clip set, one emulator run with a provisional card → **controller-proven (provisional)** in
  the arena or minimal world. It is never signed; simulation-loop-ready needs a signed real card.
- Air, water, ground — each region in parallel: R2 capture, R3 Level 1, R6 Level 2 on one device, R5 alone, R7 Save set, R9 merge.
- Contract owner: C1, then C2. Loop integrators: their world and emulator for C4 (synthetic frames need no capture).
- R8 clock (`lib/pod-clock.ts:56`) and R10 strips: any region.
- Waits on decision 1: R4b group join, R4c seating, R5 group blocks, shared queues, Upload, shared time records.

**R1 · One model list — SHIPPED.** `models.json` exists and all four readers use it (see Today vs gap). Do not rebuild it.
*Only gap — the test:* every `models.json` entry has its three files; the name picker shows only the open model's labels.

**R2 · Capture from three sources, one set.** Sensor (name from the open model's `labelmap.txt`, default 4) · this device (files) ·
video. Video keeps the fewest different-enough frames: 4 frames/s; drop frames under the Laplacian floor (proposed 100 on a 640 px grey
frame) and near-copies within Hamming 6 of a 64-bit fingerprint; prefer frames where the model sees the object; keep 1 in 10 empty; cap 40
per minute; show "1,800 frames → 31 pictures" first. Every number lives in `public/sensor-fusion/capture-spec.json`, read by page and
Python. Strip GPS and EXIF; respect rotation; HEIC and JPEG uploads become PNG.
**Domain and conditions.** Each set records its domain (air · water-surface · underwater · ground) and sensor (rgb, thermal; sonar and
depth later) and tags the conditions a loop needs: glare, turbidity, spray, night, rain, lens fouling, dust or mud, motion blur, child
height (consent only). The R6 set check warns when a needed condition has zero pictures.
**People in pictures.** `person` is for avoidance, search and rescue, alerts and blurring only, never for engagement. Faces in shared sets
are blurred unless consent is recorded; school pictures need a consent id each (Addendum 1 section). **Identity models** (`checkid`, any
face or named-person labelmap) are never loop- or camera-eligible and never shared without recorded consent.
**Quotas per domain** (`capture-spec.json`): minutes per class = (held-out + replay + 300 train boxes) ÷ (kept picks/min on the R2 pinned
clip × boxes per pick); replay equals held-out; each needs **30 distinct clips per class**, scored with a clip-cluster bound. **Capture
burden:** classes × conditions × (held-out + replay) + train; per-condition quotas only report until the operator promotes one. Each class
records a **known size** and a minimum pixel extent at its minimum detection range (size ÷ range × focal length; polylines by length); a
camera and class pair below it is refused. Replay clips carry range truth for every class the loop steers on. Each camera has intrinsics
**per medium**; Gate 1 refuses a clip whose medium has no calibration, and a surface-trained Manta card is refused underwater. **Hard
cases** (field events, Part C) are picked first.
*Test (browser + Python runner):* a pinned 60 s clip gives ≤ 40 pictures, no near-copies, the same picks in both; an underwater clip scored
with air intrinsics is refused; 392 frames from 3 clips are "not ready"; a 1 cm wire at 40 m on a 640 px, 70° camera is refused.

**R3 · Annotate.** Four edge grips (left/right move sideways only, top/bottom up and down only) placed **outside** the box so a finger
never covers the line; thin high-contrast line; magnifier while dragging; one-pixel nudges. Boxes kept in picture pixels. SAVE BOX writes
to the device only. `lib/sensor-fusion/voc.ts` already ships (`vocXml(page)`, `readVoc`, `VocPage`) but nothing imports it, and `sensor-fusion.tsx` keeps its own
`vocXml`, `writeXml` and `readVoc`. **Make the page import `voc.ts` and delete the three inline copies**, then extend `voc.ts`; never a
third reader. A picture may have zero, one or many boxes.
Label names come from `labelmap.txt` ("did you mean …?" for close spellings), file-name safe (letters, digits, `-`); two labels that make
the same file name (`ray fin`, `rayfin`) are refused at entry.
**Thin objects** (wire, cable, mooring line) get a second label shape: a polyline, stored in the same VOC XML as a `<polyline>` element
that `readVoc` reads. The merge (R9) turns it into a chain of short boxes (minimum box size in `capture-spec.json`) only for detectors that
need boxes. labelImg ignores the extra element.
*Tests:* first, a source check finds exactly one `readVoc`, one `vocXml` and one merge function across `app/` and `lib/`, and the page imports
`voc.ts` (it fails today); `readVoc(vocXml(x))` equals `x`; a polyline round-trips; a diagonal wire polyline never becomes one box over 50%
of the frame; labelImg opens the file; a saved box equals the on-screen box within 1 pixel; five SAVE BOX = 0 downloads.

**R4a · Close the tables — SHIPPED** (`0c25475`, `supabase/migrations/042_sensor_fusion_members_only.sql`). Guest policies of 040 and 041
are dropped and only signed-in project members read or add. Do not rebuild it. Its test runs in `test:ci` as `test:sf-r4a` and in `prebuild`.
*Only gap:* the test should parse 042's SQL (no `anon` in any policy, every policy names `sensor_fusion_is_member`) if it still checks a self-model.

**R4c · Seating, review sign-off, old rows (server track, waits on decision 1).** Extends 042, never a parallel table. One
`SECURITY DEFINER` RPC admits a person on a valid invite (R4b) and is the **only** path into `sensor_fusion_members`; no INSERT policy is
granted. **Columns first:** migration 043 adds `level`, `labeled_by uuid DEFAULT auth.uid()`, `reviewed_by`, `reviewed_at`, `review` and
`note` to 041, binds the label INSERT check to `labeled_by = auth.uid()` and membership, and retires `owner_key` for new rows. An UPDATE
policy covers only the Level 2 columns, with `reviewed_by = auth.uid()` and `reviewed_by <> labeled_by`. NULL-`project_id` rows are
quarantined to `?diag=1`, never lost. An unseated person reads "Ask your project owner for an invite", never an empty list.
*Tests (SQL parse in `sensor-fusion-r4a.test.mjs`):* every label INSERT policy binds `auth.uid()`; the UPDATE policy names only columns
that exist after 043; a non-owner cannot seat anyone; no INSERT policy on `sensor_fusion_members`; a labeler cannot review their own box;
a NULL-project row is never readable; the unseated sentence shows.

**R4b · Group projects and roles.** Owner, contributor, reviewer, viewer; optional **teacher** (sees time and progress, never a race).
Live invite codes come from `randomPodCode` fed **crypto-random bytes**; the seeded `inviteCode` (`si-pod.ts:119`) stays for replay only.
Codes expire (as `INVITE_TTL_MS` does). Admission is checked **on the server** (the R4c seat RPC), not only by `admits` (`si-pod.ts:149`).
Sign-in required; a member id, never a name. Warn when faces appear; minors' consent is decision 3. **Waits for decision 1.**
*Tests:* a guest cannot join; an expired code is refused; one seed in live mode never repeats a code; a browser-only admission is refused.

**R5 · Names that never collide.** `<label>_<NNNN>.png` + `.xml`, 4 digits, 5+ past 9999. Alone: highest used + 1, never reused.
Group: temporary names while collecting; at **Close upload**, members in join order, each member's pictures in capture order, one unbroken
block each (`bird_0001`–`bird_1111`, then `bird_1112`–`bird_2222`).
A late member gets the next block; a leaver keeps theirs. Old `bird.0001` names are read and renamed once; the XML records every rename. Reopening after Close is the operator's decision.
*Test:* 2 × 1,111 pictures number as above; 10,000 pictures reach `bird_10000`; an old dot-name set migrates with no gap.

**R6 · Level 1 and Level 2.** Each box carries `level`, `labeled_by`, `labeled_at`; after review `reviewed_by`, `reviewed_at`, `review`
(accepted · fixed · rejected) and a short note back. The reviewer is never the labeler. **Local Level 2:** two members share one device,
each signed in with their own id, so Level 2 runs without decision 1. **Re-check against poisoning:** a second reviewer re-checks a random
5% of accepted boxes; a set above the spec's disagreement rate is blocked from train.json. A queue holds a picture for one person for 10
minutes. A set check flags near-duplicate names and boxes. Only accepted or fixed boxes train.
**Start from today's button.** The shipped `markLevel2` (~:454) promotes for whoever holds the phone. Extend it: the XML records
`labeled_by`, `reviewed_by` and the verdict, and equal ids are refused ("Someone else must review your boxes"). Until then `mergeTraining`
writes `"reviewed": "local-unreviewed"`, which the card schema refuses. **Small regions** borrow a reviewer, re-checker or signer seat from
another region through the R4c invite.
*Test:* a reviewer never sees their own box, also on a shared device; one id never writes level 2 on its own box; a level 2 box with no
`reviewed_by` is refused by the merge; today's training.json is refused by the card schema; a held picture frees after the timeout; a set
above the disagreement rate cannot be merged.

**R7 · Save set and upload.** `Pictures/<Set>/` (folder on a desktop, one zip on a phone) with every png+xml pair, `labelmap.txt` and a
manifest (schema version, model id + labelmap hash, member roster in join order, the rename log, and per file: sha256, label count, level,
member id, and a consent id for any school picture). The XML carries the same schema version. Warn before the phone's storage is full.
**Upload destination is the operator's decision.**
*Tests:* Save set makes one file; manifest hashes match; the manifest's extension is `.png`; a failed upload never says "uploaded"; no
screen names a database, error code or vendor.

**R8 · Contribution time, shown with the Vision-2525 tokenomics cards.**
- *Clock:* reuse `frontend/lib/pod-clock.ts` (`measure()`, `witnessedMinutes()`, `hhmmss()`), as `app/soi-session/page.tsx` and the
  Drone-2525 SI panel do. No second clock. Every working stretch counts (capture, Level 1, Level 2, merges, set checks). **Clocked, not
  claimed:** the platform records start and stop (member id, project, element, device); recorded time is never altered; a claim never
  exceeds witnessed time; idle closes a stretch. UTC stored, local time shown, `YYYY.MM.DD_HH.MM..SS`; order follows the clock's `seq`.
- *The visual (operator, 2026.10.03):* the three `/vision-2525/` cards — ♡ SI, 웃 HI, ◬ AI — with glyph disc, accent, purpose and law
  (`1 minute given = 1 ♡` · `1 웃 = 1 hour at 1× local min wage · earned = M × hours` · `◬ = witnessed acceleration · 1 min SI = 5 ◬
  illustrative, variable to ~10×`). **Method:** lift the markup at `app/vision-2525/page.tsx:176-192` (`TRINITY_ACCENT`, `:33`) into one
  shared `components/soi-trinity-cards.tsx`, used by both pages, never a copy. Value lines: ♡ minutes live; ◬ only as the illustrative
  multiple; 웃 "paid projects only" until the operator marks a project paid. Text reads through `soi.coin.*` (`lib/lexicon-data.ts:1306-1315`);
  Vision-2525 prints `c.name` raw today, so the shared component fixes that too (as `components/soi-section.tsx:38` does). Cards stack at 390 px.
- *Where:* the project page (team total, by element), each member's row, each model version. Paid projects → 웃 from the date marked
  paid, platform-clocked only (operator's decision). ♡ is never spent or traded (D12).
*Tests:* ten minutes of Level 1 make one stretch with all fields; idle is not counted; an over-claim is refused; team ♡ equals the sum of
members, the same in two time zones; both pages import one card component; no card string skips `t()`.

**R9 · XML while editing, one JSON after Level 2 (operator, 2026.10.03_17.48..49 CST).**
> Operator, verbatim: "default to xml for individual editing and we can merge to json after level 2 completed for model training"
- **XML is the source of truth.** One Pascal VOC `.xml` beside each `.png`, edited through Level 1 and Level 2 (R3, R6). Nobody edits the JSON.
- **Merge only when Level 2 is complete.** A **Merge for training** button appears once every picture has finished Level 2; until then it
  says how many wait. **Extend the shipped `mergeTraining`** (~:471; it already refuses while any box is short of Level 2) and move it into
  the shipped `lib/sensor-fusion/voc.ts` as one pure function that reads every XML through `readVoc` and writes one `<Set>.train.json`:
  images (file, width, height, sha256); categories in `labelmap.txt` order; only accepted or fixed boxes (rejected and Level-1-only counts
  printed); schema version, model id, labelmap hash and a hash over all the XMLs; a class-balance report per class and condition (under
  the box floor, proposed 300, the set is "not ready for loop X"). COCO layout recommended (decision 6).
- **Regenerated, never patched.** An edit goes back to the XML, a new review, a fresh merge. A JSON whose XML hash no longer matches is out of date.
- **Three splits, fixed before merging,** by clip or session, never by frame; the manifest (R7) records the split by sha256, and the merge
  refuses a held-out or replay hash. **Held-out size, by power:** the card reports the one-sided 95% exact (Clopper-Pearson) lower bound;
  n is the smallest count where **every n' ≥ n** clears the floor at the assumed true recall with power ≥ 0.8 (decimal proofs as comments
  in `capture-spec.json`). Proposed: 392 for 0.97 at a true 0.99; 142 for 0.90 at 0.96; 68 for 0.85 at 0.95; 124 for 0.95 at 0.99 (dock
  marker). Every class a loop or camera names has a floor, an assumed true recall and its quota in `capture-spec.json`; the schema refuses
  a class missing any of the three. A bound under its floor is "not ready". **Nuisance stops come from false positives per clear frame,
  not precision:** the cap is in the Part C values table, scored on **whole clear replay clips**, never R2's picks. The card also reports
  recall per class per condition, bearing error and the longest run of missed frames.
  **Blur parity:** person and swimmer recall is measured unblurred with consent or with the runtime's blur; the card says which, and they
  must agree for loop-ready. **One label source:** the `labelmap.txt` bytes (UTF-8, LF) are what every hash covers; `models.json` labels
  equal them; both adapters map name → index through that file only.
- **Training hand-off.** A pinned recipe, `public/sensor-fusion/recipes/recipe.json` (not `train/`, which holds UI icons): base model,
  input size **per HAL tier**, epochs, seed, quantization to `detect.tflite` and `edgetpu.tflite`, the base model's sha256 and the training
  environment digest. Any region runs it; the card records the recipe hash and both digests, and signing refuses base weights that differ.
  Per tier, the card records the minimum pixel extent and minimum detection range its input size implies; `capture-spec.json` takes its
  pixel-extent refusal from the smallest tier a loop allows. A pi-tier card whose range falls under a row's minimum detection range is
  refused for that row.
  Out: `<Set>.train.json` + labelmap hash. Back: the three files + a **model card**, a `card` object on the entry in `models.json` v2
  (schema-checked), never a fourth file. It holds: train.json hash; sha256 of the three files; per-class precision, recall and thresholds
  on held-out; `unknown` rate; domain; sensor (rgb, thermal; sonar and depth declared); `tierMs.{pi,edge,accel}` (device, file, runtime
  format `tflite` or `edgetpu` — a new format is refused until declared, decision 16 — input size, p50, p95, p99, longest delay, a soak of
  at least 10 minutes under load); `clearedLoops[]`, `clearedPlaces[]`; per-class bearing error. A named member who did not review signs it (decision 7).
- **First labelmap per loop (R9.5):** `drone-avoid-01`, `manta-dock-01`, `mass-nav-01`, seeded from shipped classes (bird, boat, person,
  car); new classes (wire, hull, buoy, step) start at zero. **Save set (R7)** carries the XMLs always, the JSON only when current. Page and
  Python merge the same way.
*Tests (plain Node):* a merge is refused while any picture is short of Level 2 or a box lacks sign-off; the same XMLs give byte-identical
JSON; box counts equal accepted plus fixed; one XML edit marks the JSON out of date; no held-out or replay hash is in train.json and no
clip spans two splits; every v2 card has all fields, including recipe hash and soak; 0.97 recall on 50, 98 of 100 at 0.97 and 58 of 60
at 0.90 are "not ready"; the quota golden table pins 392, 142, 68 and 124 and flags 391, 141 and 67 as not monotone-safe; browser and
Python compute the same labelmap hash.

**R10 · Light Codex as each picture's metadata (operator, 2026.10.03_17.51..01 CST).**
> Operator, verbatim: "within organizing workloads ; feel free to use LightCodex on image for level 1 and level 2 annotations; while also
> specifying time annotated on image, who captured or uploaded image, and who level 1 and level 2 approved with time stamps ( think light
> codex as metadata)."
- **Reuse:** `frontend/lib/light-codex.ts` — `placeSignature` writes, `decodeImage` reads, `unsupportedChars` refuses before writing.
- **One line per picture** (member ids, UTC stamps): `<file stem> · CAP <id> <stamp> <sensor|device|video> · L1 <id> <stamp> · L2 <id>
  <stamp> <accepted|fixed|rejected> · X <first 8 of the XML sha256>`. Each step writes a new codex and never edits the old one; the XML
  hash ties it to its XML, and a mismatch reads as out of date.
- **Never on the training picture, never on a JPEG.** A stripe would teach the model its colours, and JPEG breaks Light Codex (T14). The
  codex is a PNG strip beside the picture, `<label>_<NNNN>.codex.png`, in the set (R7); only its hash enters the training JSON (R9).
- The R6 queues read the strips to show each picture's state, who and when; stamps match the pod clock (R8). **The XML wins** a disagreement.
*Tests:* a PNG strip reads back exactly (16 of 16); through JPEG it never reads verified; an unsupported character is refused; L1 and L2
appear only after sign-off, by different ids; a stale XML hash is flagged; training pixels are unchanged.

## Tests file and runners
Labeler tests: `frontend/tests/sensor-fusion-labeler.test.mjs` (plain Node: R1, R3, R5, R6, R8, R9). SQL-parse (R4a, R4c):
`sensor-fusion-r4a.test.mjs`. Citations: `test:sf-plan-cites`; coral: `test:sf-coral`. Part C: own files. Browser (Playwright,
preinstalled Chromium): R10, R2 page side, R3 pixels, 390 px layout, R8 cards. **Python runner:** `test:sensor-fusion-py` runs R2 picks and
the golden vectors in a named job of `.github/workflows/deploy.yml` with a pinned `actions/setup-python` and requirements file (stdlib for
the vectors; today only `setup-node`, `deploy.yml:49`), outside `test:ci` until C1 ships. Page and Python picks compare on one shared
decoder output (pinned clip + frame hashes), never each side's own JPEG decode.

## Operator decisions — one list for the whole plan (asked, not assumed; recommended default in brackets)
1. Where group projects, roles, queues and time records are stored — the server track waits on it. [Supabase, behind R4a policies]
2. Where Upload sends sets. [the same project store]
3. Teacher role and consent rules for minors. [teacher on; minors only with recorded guardian consent; faces blurred]
4. What reopening a project after Close does. [new block numbers after the last; old blocks untouched]
5. When a project counts as paid (the 웃 switch). [only when the operator marks it]
6. The training JSON's layout. [COCO]
7. Where training runs and who may sign a model card. [any region's machine, running the pinned recipe whose hash the card records; a named
member who did not review; the operator signs the gate]
8. Which loop gets the first model. [Drone-2525 collision avoidance in the civic simulation]
9. The compute tier, max detection age and per-class floors per loop. [the Part C table's proposed values: tier, age column, recall-floor column]
10. DETECT: band, HDMI side channel, or both. [band first]
11. DETECT: which video links count. [HDMI only]
12. DETECT: code per person or per pair of boxes, and how a lost code is replaced. [per pair; re-pair to replace]
13. DETECT: protected content (HDCP). [unprotected sources only, unless licensed]
14. Who builds the fuller water and ground worlds, and when; whether `ark-sail-33` joins Manta. [the loop integrator of each region owns its
    minimal world in `replay.ts` now (C4); fuller worlds after the first air box is loop-ready; `ark-sail-33` later]
15. Retention periods. [field events 90 days; clips showing people 30 days unless consent is recorded; the replay test checks these numbers]
16. Whether a future accel tier may declare a fourth runtime file, or must stay Coral. [stay Coral; today the three-file rule would refuse it silently, so the refusal is stated]
17. The eXeL AI robot's vehicle id. [add `exel-robot` to `VEHICLES` with a `CONTROLS_SCHEMA` minor note; simulation-loop-ready until a vehicle model exists]
18. School retention. [clips showing minors 7 days; none leaves the site unless consent is recorded; the replay test checks the number]
19. How risk alerts reach staff. [(b) local only: the camera computer and staff devices paired through the shipped ECDH pairing, no server; (a) a server `alert` kind in
`notify-core.js` later, a link only, never a picture]
20. Whether fall and crowd hazards run on cameras that see minors. [off until decided; place and time only, never who]
21. Whether MASS-AI gains Addendum 1's goal and risk purposes. The operator asked for "targeting, obstacle avoidance, risk identification,
    etc for eXeL AI robot and Mass-AI robot". [MASS-AI takes the goal layer in the same build as `exel-nav-01`, behind the same arbiter and
    safety-first rule, with the eXeL AI robot's goal classes and 1° bearing ceiling; alternative he may choose: safety-only until
    `exel-nav-01` passes] The citations test checks every `ASK.md` addendum vehicle has a goal-purpose path.

## Out of scope
Running the training itself (the hand-off in R9 is in scope). Any change to existing model files or label files.

---

# Part C — Detections into control loops (Drone-2525 · Manta-2525 · MASS-AI)

> **Scope boundary (hard).** A detection steers, slows, holds or stops a vehicle — for navigation, collision avoidance, station keeping,
> inspection, wildlife, search and rescue, and the Drone-2525 civic simulation. It never marks, approves or fires anything. The
> Drone-2525 two-step named-human gate (TARGET amber → APPROVE red → FIRE, simulation only; amber → red two-step at
> `lib/drone-2525/challenge.ts:17`, CH5 two-person rule at `:103`, slot-box rule r.149 at `lib/drone-2525/domain.gen.ts:306`) is
> untouched. Real-world weapon targeting and detecting people for engagement are out of scope.

**Targeting here means goal targeting:** picking a place or object to drive to, follow or dock with. It never means aiming at a person.

Methods, files and tests for Grok; no code. **Loops take detections from the on-board model today** (`cnn.js`, `sensor_fusion_edge.py`)
**and from the DETECT band later**, on the local track, with no server.

**Critical path — what can start now.** The citation test checks that every step here exists as a heading or build step.
| Step | Needs | Waits on | Start |
|---|---|---|---|
| C1 contract + spec | nothing | — | now |
| C2 adapters | C1 | pinned raw tensors from one real run | now, after C1 |
| Citations test + R1 test | nothing | — | now (first local step) |
| R4a close the tables | — | — | **SHIPPED** (042, `0c25475`); test in `test:ci` as `test:sf-r4a` |
| R2 / R3 / R6 per region | nothing | crew of four per region | now |
| R9 merge + held-out | R6 | per-class quotas met | per region |
| Training (decision 7) | R9 | pinned recipe | any region's machine |
| C3 Gate 1 | trained card; reads 042 policies | replay clips | per region |
| C4 Gate 2 | C1, worlds | none on data (synthetic frames) | world work can start now |
| C5 signed release | C3, C4 | signer roster | after C3, C4 |
| C6 bench, then fenced field | C5 | a real vehicle and a named safety pilot | last |
| eXeL AI robot row + goal layer · first deliverable `exel-nav-01` | C1, decision 17 | minimal ground world with a dock marker | after C1 · owner: ground integrator · done: docks in the minimal world, both gates, signed |
| Camera place (alerts only) · first deliverable `edtech-hazard-01` | C1 alert output, local alert screen (decision 19 b) | consented school pictures, decisions 3, 18, 20 | policy now; capture after consent · owner: camera integrator · done: camera values met, signed for `camera` |

**Build steps (local track; each: done line, test, then wait for LIVE).**
- **C1 · Contract + spec.** `detect-contract.ts` and `loop-spec.json`, pure. *Done:* golden vectors pass in Node and Python.
  **C1 bench** (owner: contract owner): `cnn.js` and the edge script, capture to output, on one pi and one edge device, over a pinned frame
  set of at least 299 frames per tier (the p99 event minimum), written to `public/sensor-fusion/bench/c1-bench.json`. Decision 9 values stay "proposed" until that file exists; the citations test checks it.
- **One on-vehicle loop host.** `public/sensor-fusion/edge/loop_runner.py` (pi and edge tiers, C2 and C6) reads `loop-spec.json` and
  `actuators.json`, takes Detection records from the edge script, and runs a Python port of the arbiter and tracker. It passes the same golden
  vectors as `loop-actions.ts`: a pinned record stream gives identical command sequences in both (test 12). `test:sensor-fusion-py` is the
  CI job only; `loop_runner.py` is the process on the vehicle. `download/` carries a byte-identical copy.
- **C2 · Adapters.** `fromCnnHits` and the Python edge adapter. *Done:* the adapters agree on pinned raw output tensors (boxes, classes,
  scores, count saved as JSON from one real run), so CI needs no TFLite runtime. Real-inference parity is a manual check recorded on the card.
- **C3 · Gate 1, open-loop replay per domain.** Reads only rows that 042's member policies allow. *Done:* per-class P/R and p99 scored for
  air, water and ground. Air, water and ground run
  in parallel — one regional team each; "one revision at a time" binds only the live site.
- **C4 · Gate 2, closed loop.** Obstacle layer, detection emulator, `loop-actions.ts`, water and ground worlds. *Done:* the first loop-ready
  box below is met in simulation.
- **C5 · Signed release + rollback.** *Done:* a live loop refuses any model without a signed, hash-matched card.
- **C5b · Shadow.** A new signed card runs beside the live card on the same frames, writes disagreements as field events and never
  actuates. Promote it only after the shadow minutes in `loop-spec.json` with zero safety-relevant disagreement. *Test:* no shadow output
  reaches `loop-actions.ts` (source check); its disagreements land in `field-events.jsonl`.
- **C6 · Bench, then fenced field.** First a hardware-in-the-loop bench: recorded frames feed the real edge script, and the actuator-table
  output is read, not flown. Then a geofenced trial with a named safety pilot and the independent minimum active. *Done:* the C6 record
  carries the signed gate hash and the safety pilot's salted member id. Until a vehicle model exists, Manta and MASS-AI stop at C5.
  **Takeover drill:** before arming (Gate 2 and C6), the named human (pilot, boat crew or robot team) performs the takeovers and re-arms set in
  `loop-spec.json` in simulation, each written as a field event. Their measured reaction time is its own term in the actuator table,
  never inside B. C6 refuses without the drill records.
- **C4b · Vehicle model per region.** A parameter file and kinematic model for `manta-mini-66-33` and `mass-droid` (later `exel-robot`),
  owned by the region's loop integrator. *Done:* the vehicle is in `VEHICLE_MODELS` (vehicle id → parameter-file path), a data export of `lib/2525-core/controls.ts` with a
  `CONTROLS_SCHEMA` minor bump; the registry, this line and test 31 read that set, never a comment. This is the only path from simulation-loop-ready to
  loop-ready, so decision 14 gets a date.
- Each C step ships as its own Sensor Fusion ledger revision (`app/SensorFusion-2525/ledger.ts`; it is at rev 33, `:234`, so C steps take rev 34 or later).

## One loop contract, shared — never three copies
- **`lib/2525-core/detect-contract.ts`** (pure, new), registered in `lib/2525-core/MANIFEST.md`. Drone-2525 is the first consumer;
  Manta-2525, MASS-AI, the eXeL AI robot and the camera place are declared consumers.
- **Input: Detection record v1**, versioned like `CONTROLS_SCHEMA` (`controls.ts:17`). Required: label index (from `labelmap.txt`), box
  x, y, w, h as 0–9999, confidence 0–9999, capture time (ms), clock domain id (device id plus boot id), frame number, model id, labelmap
  hash, sensor id, camera id, calibration version, medium (air, water-surface, underwater) and runtime file. Optional: range (m), track id.
  Zero objects = a **heartbeat**. Part B carries the same record. Minor versions only add optional fields, which readers ignore; an unknown major gives the safe
  action. **v1.1** adds an optional geometry kind, `frame-box` or `polar` (range and bearing), for sonar and depth. **Two cameras:** records
  merge by camera id within one clock domain, and the most careful action wins. Golden vectors cover polar and disagreeing cameras.
  **v1.2** adds a **pose** block: roll, pitch, yaw, gimbal angles and an IMU sample stamped in the capture's clock domain. Box to path uses
  the pose nearest the capture stamp and refuses one older than m. Golden vector: a 20° bank with a level-camera box gives the world bearing.
  Capture (R2) logs pose and a per-medium calibration clip, so the bearing and dock ceilings can be met.
  **Pose source.** `loop_runner.py` reads MAVLink `ATTITUDE` (or ROS 2 `/imu`) from the autopilot link it already holds. It maps the flight
  controller's boot clock through the clock-offset handshake (MAVLink `TIMESYNC` is one method) and joins pose to records by capture stamp.
  A browser `cnn.js` record has no IMU, so it stays replay-ready only.
  **v1.3** adds a **frame-health** block: Laplacian sharpness, mean luma and occluded fraction. Floors per medium live in `loop-spec.json`,
  reusing the R2 Laplacian floor in `capture-spec.json`. A heartbeat below a floor means **blind**, never clear (mud, spray, a hand, night).
  R2 tags fouled clips into a Gate 1 "blind" bin, so the floors are set from captured frames.
- **Spec version handshake.** `loop-spec.json` carries a schema major and minor, and each loop, camera and policy section its own content
  hash. A reader refuses an unknown spec major with the safe action and ignores unknown minor fields, as for the record. Golden vector: a v2
  spec read by a v1 runner gives the safe action.
- **One tracker.** `lib/2525-core/track.ts` (pure, new): IoU association and a constant-velocity filter, K-of-N confirm, drop after H. It is
  the only source of track id and velocity for follow, the swept corridor and A_track; `loop_runner.py` ports it. Node and Python golden
  vectors pin track ids over a 40-frame clip.
- **Range fusion.** The independent rangefinder or depth wins over class known size. A disagreement over the ratio in `loop-spec.json`
  gives slow and a field event; a 2× disagreement never returns continue.
- **Capture time:** monotonic ms from the capturing device, stamped at grab, never after inference. **Python:** a grab thread keeps only the
  newest frame (or a buffer of 1), stamped at `grab()` (`camera.read`, `sensor_fusion_edge.py:235`). **Browser:** `requestVideoFrameCallback`
  `captureTime`, then `presentationTime`; with neither, the device is replay-ready only. The record names its stamp source. **Replay** uses
  the clip's recorded domain and checks it is monotonic. A live loop refuses a foreign domain unless a **clock-offset handshake** (stamped
  pings, methods in `detect-contract.ts`) gives a fresh offset whose bound fits inside m; that is how DETECT or a separate camera computer
  feeds a loop. No capture time, a future stamp or a foreign domain gives the safe action.
- **Adapters:** `fromCnnHits` turns `cnn.js` hits (`cnn.js:105-113`) into the record; the Python edge script gets the same adapter. Both
  clamp boxes to 0–1 before scaling. An out-of-range or unnamed class id becomes `unknown`, never dropped. **C2 prerequisite:** `37df2c1`
  made `cnn.js:106-107` skip such boxes while Python keeps the placeholder name (`sensor_fusion_edge.py:178`). `fromCnnHits` reads the raw hits before any
  display filter; the display may still hide them. `decodeDetections` is the third producer later.
- **Which file runs where — from the signed card, never the switch.** Reuse `modelFile` / `runPlan` (`sf.ts`) and `model_file` /
  `interpreter_for` (`sensor_fusion_edge.py`); no second mapping. A loop takes its tier and file from the card's `tierMs` entry. While a
  loop is armed, the `sf2525-coral` switch, the model picker and the self-update are refused. A file that differs from the card's, or an
  interpreter that fails to load, gives the safe action and a field event, never the other file.
- **Box to path:** bearing from the box centre and the intrinsics; range from the independent sensor or the class's known size. "In the
  path" = bearing inside the swept corridor and range under the stopping distance. **Wing mode cannot stop:** there it means inside the
  turn-radius arc; the loiter circle is checked clear first, or the Drone climbs to the geofence ceiling. Stopping distance and turn radius
  come from a vehicle parameter file per vehicle in `lib/2525-core` (in `MANIFEST.md`, read by `replay.ts`). **Minimum detection range** =
  speed × B + stopping distance (or turn radius) + speed × A_track, where A_track confirms a track K-of-N; each parameter file carries a
  worked number, and Gate 1 scores recall in that range bin. A one-frame box with no track gives only "slow".
- **One shared spec, two runtimes:** `public/sensor-fusion/loop-spec.json` holds actions, failure rows, budgets, ages, floors, thresholds,
  class lists, places and the schools policy. TypeScript and Python both read it; golden vectors run in both. Ids are domain-neutral.
- **Output:** an **action** from the vehicle's own set, an **alert** (Addendum 1 section), or a **report**, plus the reason for `?diag=1`. Air: continue,
  slow, hover, land, return. Water: continue, slow, hold station, surface. Ground safety layer: continue, slow, stop (brake held).
  A **report** carries the class, position, picture reference and a named human recipient, and drives nothing: search-and-rescue sightings
  (never a person's identity), wildlife sightings and inspection findings. A purpose with no class list and floors is marked "later" in
  its loop row. Test 40 checks every purpose has an output kind. **Report values** (`loop-spec.json`, beside the camera table): class,
  precision floor, time to report p95 (59 events), recipient role and channel. Reports use the paired alert channel, with the report kind
  in the channel interface in `detect-contract.ts`. The recipient sees a staff line ("Report: wildlife near pier 3"), Acknowledge and
  escalation, each a field event. A search-and-rescue report carries a position and a picture link, never an identity, and drives nothing.
- **Per-class thresholds** come from the card and replace the fixed `score > 0.5` (`cnn.js:104`, `sensor_fusion_edge.py:176`).
- **Hold and recovery:** tightening is instant. Relaxing needs the dwell and K verified clear heartbeats (both per row, required by the
  schema), so a 10 fps flicker never alternates faster than the dwell.
- **Takeover — one arbiter.** A pure function in `loop-actions.ts` takes the human axes (`axesFromHeld` or the stick), the loop action and
  the armed state, and returns one `VehicleCommand` plus a "human has control" flag. `VehicleCommand` is a union keyed by vehicle family:
  air carries `FlightInput` (`flight.ts:87`); ground carries speed, turn rate and brake; water carries surge, sway and hold. Each family has
  its own kinematic step and its own `actuators.json` rows; no non-air vehicle ever gets a `FlightInput`. The family types live in
  `lib/2525-core` (a `FlightAxes` type that `FlightInput` satisfies), so no core file imports `@/lib/drone-2525` (source check).
  **Precedence:** safety layer, then human, then AI crew pilot (`round.tsx:464`, `crew.pilot`) or goal layer; the AI pilot never overrides a
  human deflection or a safety slow. **Human over safety, per family** (`loop-spec.json`): on ground and water the independent minimum
  (cliff sensor, bumper, depth) still clamps human input toward a hazard it senses; on air the human has full authority, logged as a field event.
  Its dead-band is `DEFAULT_SETS.dead`
  (`lib/2525-core/stick-sets.ts:31`) within `SETS_LIMITS` (`:35`), never a second threshold. `components/drone-2525/round.tsx` (the one
  caller of `useControls`, `:465`) calls it every tick; a deflection past the dead-band wins that tick. Other vehicles get stick sets by
  vehicle id. The loop re-engages only on a human re-arm (two-tap or press-and-hold at 390 px), never by itself; each re-arm and takeover
  writes a field event with the salted member id.
- **Display:** boxes as strokes in the 13 Drone-2525 colours (`lib/drone-2525/arena-model.ts:2`); the action as one plain word; one status
  line at 390 px per state ("Loop is flying", "You have control", "Detector lost") and a re-arm control. Drone surfaces: `round.tsx` and
  `public/drone-2525/play.html`, which gets the arbiter as a built, hash-pinned bundle of `loop-actions.ts` and `detect-contract.ts`, never
  a hand copy. A contributor sees which of their pictures fed a loop-ready card, beside their ♡ minutes. The action word never covers the
  reticle or slot boxes; display never writes slot, approval or fire state. New words stay English in `AFTER_FILL`.

## The loops (bound to the vehicle ids in `lib/2525-core/controls.ts:21`)
**Your vehicle in one line.** Drone-2525: the air team's drone slows, hovers or lands for wires, trees, people. Manta-2525: the water
team's boat holds station near hulls, piers and swimmers. MASS-AI: the ground team's robot stops for obstacles and people. eXeL AI robot:
a second ground robot that also drives to, follows and docks with marked objects. EdTech camera: a school camera that only alerts named staff.
Each also gets a loop card of at most 8 plain lines on the 390 px project page (what it sees, may do, does when unsure, who takes over), words in `AFTER_FILL`.

| Vehicle | Loop purposes | Classes (first set) | Latency budget | Max detection age | HAL tier | Recall floor (proposed) | Safe action | Independent minimum | World | Human role |
|---|---|---|---|---|---|---|---|---|---|---|
| Drone-2525 (air; `vtol-quadwing`) | collision avoidance, wires and terrain, civic simulation; reports (later, until class lists and floors exist): inspection, wildlife, search and rescue | wire, pole, tree, bird, person (avoid only), vehicle | ≤ 155 ms end to end, ≥ 20 fps (frame 50 ms), p99 ≤ 50 ms | 120 ms (actuation ≤ 35 ms; heartbeat H = 3P + p50, ≤ 200 ms; dwell 1,000 ms, K 5; slack 8 ms; wing-to-quad transition 4 s is its own term) | edge or accel | 0.90; person 0.97; false tracks per clear minute ≤ the loop's cap | quad mode: hover; wing mode: begin loiter on a fixed circle inside B − A, then transition to quad and hover; then land if the return path is not known clear, else return | altitude + geofence holding mapped wire spans (the obstacle layer as data) | arena + detection emulator — closed loop (C4) | pilot watches, takes over, stops |
| Manta-2525 (water; `manta-mini-66-33` first, `manta-99-66`) | station keeping; reports (later, until class lists and floors exist): hull and pier inspection, marine wildlife | hull, pier, buoy, swimmer (avoid only), marine animal | ≤ 480 ms, ≥ 4 fps (frame 250 ms), p99 ≤ 100 ms | 420 ms (actuation ≤ 60 ms; heartbeat H = 3P + p50, ≤ 850 ms; dwell 2,000 ms, K 3; slack 28 ms) | edge | 0.85; swimmer 0.97; false tracks per clear minute ≤ the loop's cap | hold station (surface only for a submerged hull and never within the swimmer stand-off; to confirm for `manta-mini-66-33`) | depth + proximity hold | minimal 2D water world with current drift in `replay.ts` — controller gate only | boat crew watches, takes over, stops |
| MASS-AI (ground; `mass-droid`) | ground navigation, obstacle stop; goal layer and search-and-rescue reports after decision 21 | obstacle, step, person (avoid only), vehicle | ≤ 285 ms, ≥ 8 fps (frame 125 ms), p99 ≤ 75 ms | 235 ms (actuation ≤ 50 ms; heartbeat H = 3P + p50, ≤ 450 ms; dwell 1,000 ms, K 4; slack 11.5 ms) | pi or edge | 0.90; person 0.97; false tracks per clear minute ≤ the loop's cap | stop, brake held (also on a slope) | rangefinder + downward cliff sensor + geofence | minimal 2D ground world with an obstacle grid in `replay.ts` — controller gate only | robot team watches, takes over, stops |
| eXeL AI robot (ground; `exel-robot`, decision 17) | goal targeting (approach, follow, dock, line up on a marked object), obstacle stop, risk alerts | dock marker, obstacle, step, door, person (avoid only) | ≤ 285 ms, ≥ 8 fps (frame 125 ms), p99 ≤ 75 ms | 235 ms (actuation ≤ 50 ms; heartbeat ≤ 450 ms; dwell 1,000 ms, K 4; slack 11.5 ms) | pi or edge | 0.90; dock marker 0.95; person 0.97 | stop, brake held | bumper + rangefinder + downward cliff sensor + geofence | minimal 2D ground world with a dock marker in `replay.ts` — controller gate only | robot team watches, takes over, stops; staff get its alerts |

MASS-AI's goal layer waits on decision 21. **Covering sensor per class:** `loop-spec.json` names, for every loop class, the independent
sensor that covers its misses; the schema refuses a class with none. Drone wire is covered by mapped spans in the geofence. Inside mapped
areas wire keeps its 0.90 floor; outside them the wire floor is 0.97. Ground step and drop-off are covered by the downward cliff
sensor; a forward rangefinder never counts for them. Gate 2 adds an unmapped-wire scenario with a burst miss. **Drone person:** a forward rangefinder plus a stand-off geofence; with neither,
the loop flies at the slow speed the floor allows. **Manta swimmer:** sonar or a proximity sensor, named per hull in `loop-spec.json`.
**Speed envelope.** Each vehicle parameter file carries cruise, max and creep speed, and each row a worked minimum detection range.
Optics set a ceiling no floor can fix: a 1 cm wire on a 640 px, 70° camera spans 0.5 px only inside about 9 m. So outside mapped spans
the Drone's speed is capped until its minimum detection range is under 9 m, and R2's pixel-extent refusal reads the same range.
**Goal-layer timing (ground robots).** A row gives control rate, tracker lag A_track, max follow speed and dock creep speed. The dock is
refused when creep speed × (p99 + P) exceeds the 2 cm line-up ceiling.
The numbers are proposals for decision 9. They live in `loop-spec.json`, not in code. One class
list per loop lives there too; the three tables are generated from it.

**Gate 2 and card values (proposed, decision 9).** Nuisance is scored on **events**, not frames: false confirmed
tracks per clear minute. Clear minutes needed = the smallest t where zero false tracks give a one-sided 95% Poisson bound (2.996 ÷ t)
under the cap: 2.996 ÷ 0.12 gives 25 minutes, 2.996 ÷ 0.06 gives 50. No ρ is needed. The minutes come from at least **30 distinct clear
clips** per loop; 3 clips are refused. A per-frame rate, if kept anywhere, takes ρ as a stated prior in `capture-spec.json`, never one
estimated from zero counts, and a clip bootstrap only once false positives exist. Golden rows sit in `capture-spec.json`; frames are
listed for capture planning only. **Percentile claims need events:** a p95 claim (time to alert, bearing error) needs at least 59 independent events all under the
ceiling (0.95^59 < 0.05); a p99 claim needs 299. **Precision floors** get a quota of predicted positives, sized like recall (one-sided 95%
Clopper-Pearson, power 0.8). **Re-size:** if pilot recall on the first 30 clips is under the assumed true value, the quota is recomputed
from the pilot estimate before capture continues (golden: assumed 0.96, measured 0.93 raises the 142 quota).
| Loop | Nuisance stops / min | Clear minutes (zero false tracks) | Clear frames (planning) | Min clearance | Person / swimmer stand-off | Bearing ceiling (p95) | Card max age | Other class floors |
|---|---|---|---|---|---|---|---|---|
| Drone-2525 | 0.12 | 25 | 30,000 at 20 fps | 3 m | 10 m | 2° | 90 days | bird 0.90, vehicle 0.90 |
| Manta-2525 | 0.06 | 50 | 12,000 at 4 fps | 2 m | 5 m | 3° | 90 days | marine animal 0.85 |
| MASS-AI | 0.12 | 25 | 12,000 at 8 fps | 1 m | 2 m | 3° | 90 days | vehicle 0.90 |
| eXeL AI robot | 0.12 | 25 | 12,000 at 8 fps | 0.5 m | 1.5 m | 1°; dock line-up ≤ 2 cm | 90 days | door 0.90 |
Held-out quotas follow the R9 power rule. A row missing any value, or naming a class with no floor, is refused.

**EdTech camera values (proposed, decision 9).** Alerts only; no timing law. Gate 1 refuses a card above a hazard's time-to-alert ceiling.
| Hazard | Alert precision floor | Recall floor (true · held-out) | Time to alert p95 | Escalation | Cool-down |
|---|---|---|---|---|---|
| smoke or fire | 0.90 | 0.95 (0.99 · 124) | 10 s | 1 min | 300 s |
| blocked exit | 0.90 | 0.90 (0.96 · 142) | 60 s | 3 min | 600 s |
| spill | 0.85 | 0.85 (0.95 · 68) | 60 s | 5 min | 600 s |
| door open after hours | 0.90 | 0.90 (0.96 · 142) | 120 s | 5 min | 900 s |
| person in the robot's path (robot place) | 0.90 | 0.97 (0.99 · 392) | 2 s | 1 min | 60 s |
| fall, crowd building up | off until decision 20 | — | — | — | — |
Each hazard also needs at least 59 scored alerts for its p95 and a predicted-positive quota for its precision floor. **Smoke or fire is
advisory and never replaces the building's fire alarm;** if no paired staff device acknowledges within the delivery budget, the camera
computer sounds a local audible alert. False alerts at most 0.1 per camera per hour: zero false alerts in about 2.996 ÷ 0.1 ≈ 30 clear hours, from at least 30 distinct clips.
Card max age 90 days. A camera place missing any value is refused. A robot place with an alert purpose and no values row is refused (test 40).
**One timing law, four numbers per loop**, in **ms since the capture stamp**, never frames: frame period P = 1000 ÷ fps; max age A, with
p99 + P ≤ A − m (margin m, proposed 10% of A, so a fresh box never clears on arrival); budget B ≥ A, leaving B − A for actuation;
heartbeat timeout H = kP + p50 (k proposed 3), so k missed frames always trip. A box older than A is cleared, never reused. A row is
refused when it breaks p99 + P ≤ A − m ≤ B (exact equality too), when its **slack** (A − m − p99 − P) is under 5 ms, or when its **stale
share** (boxes whose capture-to-output time plus frame phase exceeds A, from the card's soak histogram) is above 1%. Nothing surfaces or
approaches inside a **stand-off**. A mode change the safe action needs (the Drone's 4 s `TRANSITION_S`, `flight.ts:69`) is its own term
in the actuator table, never hidden in B. Each floor applies to replay and held-out and needs the R9 box floor (300) per class.
`ark-sail-33` is decision 14. The safety layer is **advisory**: only more careful than the independent minimum, never less. `person` and
`swimmer` can only produce slow, hover, hold station or stop.

**First loop-ready deliverable (decision 8 default).** Drone-2525 collision avoidance in the civic simulation · `drone-avoid-01`, one named
version seeded from `tree` (`models.json:136`) · the Drone class list from `loop-spec.json` · the pinned air replay set · Gate 1 (every
class's 95% lower bound at its floor, bearing under its ceiling, p99 after the soak within the edge row) and Gate 2 (its pass line in the
arena with the obstacle layer and burst-miss emulator) · signed card and gate · owner: loop integrator. This is the finish line the 19
rounds converge on. Manta-2525, MASS-AI and the eXeL AI robot get the same box (`manta-dock-01`, `mass-nav-01`, `exel-nav-01`) in their
minimal worlds, labelled **simulation-loop-ready** until their vehicle model exists.

**Your domain, your first week** (regions start in parallel; numbers from `capture-spec.json`; crew of four distinct ids each).
| Domain | Classes to capture first | Held-out per class · clear minutes | Conditions | Blocking decision | Day 1 |
|---|---|---|---|---|---|
| Air | the Drone list; tree seeded from `tree`, vehicle from `custom01` | 142; person 392 · 25 min | thin wires at range, sky glare, motion blur | 8, 9 | labelers capture wires at range; the integrator starts the obstacle layer and synthetic frames |
| Water | the Manta list | 68; swimmer 392 · 50 min | turbidity, glare, spray; medium recorded | 9, 14 | labelers capture hulls and piers in glare; the integrator starts the water step |
| Camera | spill, smoke or fire, blocked exit, door open after hours | 68 to 142 (table) · 30 clear hours | indoor light, night corridor; consented pictures only | 3, 18, 19, 20 | the integrator writes the values and the consent check; capture waits for consent |
| Ground | the MASS-AI and eXeL AI robot lists | 142; dock marker 124; person 392 · 25 min | night (visible + IR illuminator, or thermal seeded from `thermal01`, `models.json:553`; a night bin in Gate 1), dust or mud; child height only with consent | 9, 14, 17 | labelers capture steps at night; the integrator starts the ground step and dock marker |
Each contributor's page shows which classes they can help with today and that class's quota in their time zone.

## Robots, goals, risks and cameras (Addendum 1)
> Operator, verbatim: "control looks of for targeting, obstacle avoidance, risk identification, etc for eXeL AI robot and Mass-AI robot
> (CNNs will be be able to be jointly developed for execution on EdTech security cameras, etc)."

- **One CNN, many places.** The `models.json` v2 card gains `clearedPlaces[]` beside `clearedLoops[]`: `robot:<vehicle id>`, `camera`,
  `computer`, each with its own status. The place list is versioned like the Detection record; a new kind is a minor addition, and an
  unknown place gets no action, alert only. A camera place has no actuator table. A card cleared only for a camera is refused by any loop.
- **The eXeL AI robot.** Decision 17 adds `exel-robot` to `VEHICLES` (`controls.ts:20`) with a `CONTROLS_SCHEMA` minor note; re-run
  `test:controls-schema` and `test:stick-sets`. It gets its own parameter file and stick set.
- **Two authority layers, one arbiter.** The **safety layer** (continue · slow · stop) stays advisory: only more careful. The **goal layer**
  (approach · follow · dock · line up) runs only while a named human has picked a goal target from the goal classes in `loop-spec.json`.
  `person`, `swimmer` and deny-list classes can never be goals. The arbiter in `loop-actions.ts` runs the safety layer first on every tick,
  and its slow or stop always wins. Goal actions map to a ROS 2 navigation goal, simulation only until C6. Aiming at a person is out of scope.
- **Goals need position, not just a box.** The card carries per-class bearing error (p95, from the box centre and the intrinsics), range
  error where range truth exists, and dock line-up error (cm). A card over its ceiling (table above) is not ready, whatever its recall.
  `capture-spec.json` asks for range truth and tight boxes on goal classes.
- **Risk alerts, a second output kind.** `detect-contract.ts` outputs an **action** or an **alert** (hazard id, picture reference, reason,
  recipient role). A camera or computer place emits only alerts. Hazards: blocked exit, spill, smoke or fire, fall, crowd building up, door
  open after hours, person in the robot's path. Each alert is one plain sentence, the reason and a link to the blurred picture. It goes to
  one named role, never a public screen. **Not through `lib/notify.ts`:** that route carries nothing but a signing request (`notify-core.js:26-27`:
  the server writes "Please sign", renames attachments `.pdf`, needs a raw address, an `Origin` and a Resend key, one mail per address per 20 s).
  **Decision 19:** (b) local-only alerts on the camera computer and paired staff devices, no server [recommended first]; or (a) later, on the
  server track, a second server-written kind `alert` in `notify-core.js`: member id → address looked up on the server, text written by the
  server, a link only, its own throttle per hazard track, the signing kind unchanged (`tests/notify-core.test.mjs`). **No picture leaves the
  site by default:** an alert is a sentence and a link that opens the blurred picture only on a **paired** staff device holding a role key;
  an attached picture needs a consent id. **Pairing:** each staff device pairs once with the camera computer through the shipped ECDH P-256
  → HKDF → AES-GCM pairing (`frontend/public/drone-2525/play.html` ~:3225, anchor `deriveKey`) with a 6-digit pairing code, never the key;
  no second protocol. That code generates its key extractable (`generateKey(..., true, ...)`), so long-lived staff role keys take a
  non-extractable path. The pairing code is single-use, expires within minutes and locks after 10 tries. The camera computer and robots
  run a Python port of the same steps, held to the browser by interop golden vectors (one transcript, one derived key). The camera computer
  runs the escalation timer for its place, and each robot runs its own. MAVLink 2 signing keys and SROS2 keystores live on the vehicle,
  never under `public/`; they rotate with the signer roster, and a revoked roster key voids the link. **Clips vs events:** field events hold
  only hashes; deleting a clip at retention writes a tombstone event, so the hash chain still verifies.
  Alerts, escalation and acknowledgement travel only on that paired channel; an unpaired device on the same LAN gets no picture and no text.
  The channel is an interface in `detect-contract.ts`; each hazard has a delivery budget, and a slower channel is
  refused for it. **Acknowledge** is an append-only field event (salted staff id, time) read by the escalation timer on the camera computer.
  Unacknowledged, the alert goes to a second named person after the time in `loop-spec.json`; the staff line shows "Waiting for <role>". A
  second acknowledgement is a no-op. One alert per hazard track, then a
  cool-down. Each alert writes a field event, so cameras feed the hard cases. For a person alert a robot may only slow or stop.
- **Schools mean children; the policy is data.** `loop-spec.json` holds per place: a deny list (`checkid`, `head`, `eyes`, face,
  named-person), `blurRequired`, `consentRequired` and alert routing to named roles by member id. Faces are blurred on the device before a
  picture is stored. A school picture needs a consent id in the R7 manifest, and the R9 merge refuses one without it. Consent withdrawn
  (decision 3): every card whose set hashes include that picture lapses to replay-ready until retrained. Signing refuses a camera clearance
  when any flag is unmet. Child-height person captures are a condition, taken only with consent; without it the child-height floor
  is "not ready", and no floor is ever scored on frames tagged synthetic. Retention for minors is decision 18. **Fall and crowd** report a place and a time, never
  who; crowd is a count above a threshold in a zone, and no track is kept past the cool-down. Both stay off on cameras that see minors
  until decision 20; the camera place refuses their hazard ids while it is open.
- **Camera retention.** Every field event and hard case from a camera place takes decision 18 (7 days), never decision 15 (90 days).
  Camera hard cases enter R2 only with a consent id.
- **What a teacher sees.** The staff line at 390 px ("Alert: spill near Room 12"), the blurred picture, the reason, Acknowledge. Never a
  name, a face match or a feed on a public screen. A **For schools** card (at most 8 lines) says what each alert means, that no face is
  matched, who receives it and how long a clip is kept. New words stay English in `AFTER_FILL`. Draft for the operator to approve:
  1. This camera looks for spills, smoke, blocked exits and doors left open after hours.
  2. It never recognises a face or says who anyone is.
  3. Faces are blurred on the camera before any picture is kept.
  4. An alert goes only to named staff on paired devices, never to a public screen.
  5. "Person in path" only makes a robot slow down or stop. It never names the person.
  6. Smoke alerts help staff; the building's fire alarm still does its job.
  7. Pictures of children are kept 7 days, unless a guardian agreed in writing.
  8. Ask the school office who receives alerts and how to see what is kept.
- **Finish lines.** `exel-nav-01`: goal docking on a dock marker in the minimal ground world, both gates, signed → simulation-loop-ready.
  `edtech-hazard-01`: an alert-only card cleared for `camera`, Gate 1 scored by per-class alert precision and time to alert (no timing law),
  signed. Owners: the ground loop integrator; a camera integrator for the school region.

## Failure modes — none of them maps to "continue"
| Event | Action |
|---|---|
| Box older than the loop's max age A (e.g. 121 ms at Drone-2525) | the box is cleared; with no fresh heartbeat, slow |
| Capture stamp missing, in the future, or from another clock domain | safe action |
| Band or payload does not verify | safe action |
| Verified heartbeat with zero objects and frame health above every floor | continue as clear — this is not a failure |
| Heartbeat with zero objects and frame health below a floor (fouled, dark, covered lens) | treated as "detector lost": safe action, never continue |
| Command or telemetry link lost (RC, MAVLink or ROS 2 heartbeat) longer than the timeout in `actuators.json` | the autopilot's own failsafe; the loop never commands continue |
| Stick held past the dead-band, unchanged, for T s (`loop-spec.json`) | flagged as stuck or drifting; the shipped stick calibration runs again; never a silent permanent takeover |
| No verified heartbeat for longer than H = kP + p50 (Drone ≤ 200 ms, Manta ≤ 850 ms, MASS-AI ≤ 450 ms at the p99 ceiling) | safe action; control goes to the named human ("detector lost"). With no human input, the safe action holds indefinitely and the screen and an alert repeat "You have control" until a stick moves or someone presses stop; the loop never re-arms itself |
| Unknown or under-floor object in the loop's path | slow, then safe action |
| Independent minimum lost (rangefinder, altitude, depth or geofence source silent) | safe action and a human alert; the loop refuses to arm. The safe action never needs the source that was lost: Manta without a position or depth source cannot hold station, so it cuts thrust or anchors, holds depth if it can and alerts |
| Command link unsigned or unauthenticated (MAVLink 2 without message signing, ROS 2 without SROS2) | safe action; the loop refuses to arm |
| Dock marker lost inside the blind final approach distance (`loop-spec.json`, per vehicle) | finish on odometry at creep speed with bumper and rangefinder active; any contact or range breach gives stop |
| Loop process stalled (no output for one budget B) | a watchdog in `loop-actions.ts` gives the safe action and writes a field event |
| Model id, labelmap hash or any file sha256 differs from the signed card, or the model is not cleared for this loop | safe action; the loop refuses the model and runs only in simulation |
| Identity or body-part model (`checkid`, `head`, `eyes`, named-person labels — the deny list) | refused for any loop, never loaded |
| Missed object (false negative) — not detectable live | covered by the independent minimum; an avoid-only class under its floor on replay blocks loop-ready |
| Spoofing on replay (printed patch, glare flash, band from another session) | safe action, never continue |
| Leaving a safe action | only after the dwell and K clear verified heartbeats; after "detector lost" or "model refused", only on a human re-arm |
| Goal target lost or hidden longer than H, outside the blind final approach | stop, brake held; the goal clears until a named human picks again |
| Goal target inside any person stand-off, or two goal candidates above threshold | stop; the named human chooses (the model never picks a goal) |
| Stored picture whose face blur fails | nothing is stored |
| Alert recipient offline | the alert is queued on the camera computer and repeated, never dropped |
| Follow target faster than the robot's max speed, leaving the geofence, or entering another robot's corridor | stop, brake held; the goal clears |
| No fresh peer corridor (each robot shares its swept corridor on the paired local channel, stamped and age-checked) | the shared area counts as occupied: slow |
| Report recipient offline or unacknowledged | queued and escalated like an alert, never dropped |
| Unknown place kind | no action; alert only |
| Drift: live `unknown` rate or confidence drop above the card's held-out value by the margin in `loop-spec.json` | slow, and log a field event |

## Model selection, sim first, then a signed gate
- **HAL fit:** the card's measured capture-to-output `tierMs` p99, after the soak, must satisfy p99 + P ≤ A − m on that tier. A tier with
  no measured p99 or soak cannot be selected. Tier to file: only the shipped `modelFile` / `model_file`. `hal.ts` stays a render helper
  (`frameBudgetMs`, `sensorFits`); `halCnnMs` is a fallback estimate, never a pass.
- **Gate 1 (model) · Gate 2 (controller) · signed release — loop-ready needs all three.**
  - **R-CORE first.** `lib/2525-core/MANIFEST.md:17` names a Security-2525 replay engine to extract next. Before C3, grep
    `components/security-2525/` (`rcore.ts`, `play-test.ts`, `mission-support.ts`) and extend it into `lib/2525-core/replay`, or record
    why it cannot serve, with file:line. `replay.ts` below is that module.
  - **Gate 1, open-loop.** `lib/sensor-fusion/replay.ts` (new, pure) replays a pinned clip set per domain (R2 shared decoder, frame hashes,
    replay split only) and scores per-class precision, recall per condition, bearing error and capture-to-output p99. Alone = **replay-ready**.
  - **Gate 2, closed-loop.** A **detection emulator** in `replay.ts` projects world obstacles into the camera (card intrinsics), hides what
    `lineOfSight` (`lib/drone-2525/los.ts:36`) says is occluded, and adds or delays boxes from the card's precision and p99. **Misses come
    in bursts:** a two-state model per class per condition, burst length measured on the replay split and kept on the card. Recorded
    detections cannot react to the vehicle, so they never count as closed loop.
  - **Pass line per loop** (values in the table above): zero collisions over N seeded runs (N ≥ 300 supports under 1% at one-sided 95%), the
    minimum clearance, the nuisance-stop cap, and time to the safe action ≤ B. The hard-case list is sized from N. **Synthetic frames:**
    `replay.ts` renders labelled obstacle-layer views from the same projection, tagged `synthetic`, never counted in held-out or replay.
  - **Scenario generator** (per loop, in `loop-spec.json`): each seed draws obstacle placement, wire height and sag, approach angle, wind or
    current, light and burst-miss state from stated ranges. Runs that share one layout are refused as N.
  - **Provisional card per loop:** precision, recall, burst length and p99 assumed at the floors, so Gate 2 runs with zero pictures. It
    reaches only controller-proven and is never signed.
- **Worlds.** Air: the Drone-2525 arena (`lib/drone-2525/arena-model.ts`; `world.ts` is its cache), which holds doors, buildings and tree
  rows (`:19`, `:26`, `:42`). Add a **ground-truth obstacle layer** as data, the way `treeRows` join: wire spans, poles, scripted birds
  and person-avoid markers. The Arena output gains the prisms `lineOfSight` needs (`los.ts:13`, `:39`), kept out of the wire model so the
  arena stamp and `test:drone-arena` stay unchanged. Water and ground: minimal pure 2D worlds in `replay.ts` (current drift; an obstacle
  grid and a dock marker). Fuller worlds are decision 14.
- **Actions to the vehicle.** `lib/2525-core/loop-actions.ts` (new, pure) turns each air action into a `FlightInput` (`flight.ts:87`):
  hover = zero input, altitude held, quad mode only; wing mode loiters on a fixed circle, then `toggleMode` (`flight.ts:97`, `:139`) into
  quad; land = `takeoffInput` (`:78`) in reverse; return = heading home, then forward. Water and ground get kinematic steps shaped like
  `stepFlight` (`:135`), fed by their own `VehicleCommand` family. The actuator table is one file, `public/sensor-fusion/actuators.json`,
  next to `loop-spec.json` so the browser and `loop_runner.py` read one file (registered in `lib/2525-core/MANIFEST.md`, its hash in the
  signed record and the card-lapse rule, owned by the contract owner). Rows are keyed by autopilot and firmware major: ArduPilot Copter,
  Rover and Boat `custom_mode`, PX4 main and sub mode. The common `MAV_CMD_NAV_LOITER_UNLIM`, `MAV_CMD_NAV_LAND` and
  `MAV_CMD_NAV_RETURN_TO_LAUNCH` are preferred where they exist. ROS 2 is pinned to Jazzy (LTS) with Nav2 `NavigateToPose` and its cancel.
  A required column says how the link is authenticated (MAVLink 2 signing or SROS2). A loop refuses an autopilot whose declared version is
  not in the table. Simulation only until C6; no action id left unmapped.
- **Signed release:** before a live loop loads a model, a named human in the loop-integrator role, never the card's signer, signs the card
  hash, the three file sha256s, the train.json hash and the replay pass. Loop models pin to a signed card, never the main-branch URL
  (`sensor_fusion_edge.py:36`). Anything missing: simulation only. Rollback is one step to the previous signed card.
- **The gate covers the bytes and the runtime.** Loop models load only from the pinned, hash-listed copy the card names, never `BASE`
  (`cnn.js:8`, `sensor_fusion_edge.py:34`). `fetch()` (`:116-131`) checks each sha256 before `os.replace` (`:128`). The signed record holds
  the sha256 of `sensor_fusion_edge.py` (`edge/` the source, `download/` byte-identical or refused) and of `loop-spec.json`. `cnn.js` hashes
  `labelmap.txt` and `detect.tflite` (`:64`, `:67`) with SubtleCrypto and passes **the same `ArrayBuffer`** to `loadTFLiteModel`, never the
  URL, so nothing is fetched twice. `models.json` v2 stays readable by v1 readers (`sf.ts:23`, `cnn.js:50`, both edge scripts ignore
  `card`); for a loop or a camera place, the edge script refuses a v1 or hash-mismatched cached `home()` copy (`:39-47`), the self-update (`:35`,
  `:285`) and `BASE` model pulls (`:34`, `:127`).
- **Where signatures live (local track):** append-only `public/sensor-fusion/loop-signatures.jsonl`. Each entry and roster change is a
  **git commit by a neutral bot or CI identity**; no personal name or email enters git; a CI test checks the chain. Each entry: salted
  member-id hash (the salt a per-project secret off `public/`, rotated with the roster), role, card hash, file sha256s, edge-script and spec
  hashes, replay hash, train.json roster hash, previous entry hash. **Signed means a signature:** a non-extractable ECDSA P-256 key per
  signer in IndexedDB — **new code**, since the Part B pairing is ECDH (`play.html` ~:3225). Public keys sit in
  `public/sensor-fusion/loop-signers.json`, signed by the operator's root key, with rotation and revocation in the chain; a revoked key voids
  every card it signed. **Retention:** decisions 15 and 18; only the project owner deletes; a field event past retention is refused for replay.
- **Minimum crew per region: four distinct member ids** (labeler, reviewer and 5% re-checker, card signer, gate signer). A gate signer who
  held an earlier role on that card is refused. The project page shows the missing role.
- **Deny list as data** in `loop-spec.json`, per place: `checkid`, `head`, `eyes`, and any personal-name, face or eye label. Refused for
  loops and cameras; the display-only demo is unaffected.
- **Registry status:** each `models.json` v2 entry has an owner region and a status (draft · replay-ready · controller-proven (provisional) ·
  simulation-loop-ready · loop-ready · retired). The registry refuses `loop-ready` for a vehicle with no model in `controls.ts` (`:19`
  lists only `turret` and `vtol-quadwing`), so Manta-2525, MASS-AI and the eXeL AI robot stop at simulation-loop-ready. **Card lifetime:**
  loop-ready lapses to replay-ready when **that loop's section** of `loop-spec.json` (plus the shared contract fields), its `actuators.json`
  rows, the edge script or `detect-contract.ts` changes hash, or past the card max age. A new camera hazard never lapses the Drone's card.
  Retiring never deletes a signed card; rollback reads only non-retired cards.
- **Field to capture:** every safe action, takeover, drift event, alert and replay miss writes an append-only field event (clip, frame
  hashes, loop or place id, card hash, reason). R2 turns them into the **hard cases** list, picked and reviewed first. Stored locally in
  `field-events.jsonl` (in the R7 manifest and the Python `home()`); on the server, a members-only table in 043 (decision 1). **Federated
  sets:** R9 merges two regions' sets by roster, keeps each clip split, and the card lists the contributing set hashes.

## Tests (when built)
In `frontend/tests/sensor-fusion-loop.test.mjs` and `sensor-fusion-loop-replay.test.mjs` (plain Node). Each joins `test:ci` only when
its revision ships.
1. Every row holds p99 + P ≤ A − m ≤ B (exact equality and P ≥ A refused); a 121 ms Drone box is cleared; an unmapped tier is refused.
2. Each failure row gives its action; none gives "continue".
3. A model with no card, or a mismatched card hash, is refused.
4. A model too slow for a loop's budget on a tier cannot be selected.
5. A pinned clip gives the same decisions twice; an injected dropout gives the safe action.
6. Browser and Python give the same detections at the same per-class thresholds on one pinned frame set, with the same count when one class id is out of range.
7. No loop action changes a Drone-2525 slot, approval or fire state (extends Part B test 7).
8. 60 s of black or smeared frames with zero boxes never returns continue; 60 s of healthy empty heartbeats never trips; for every row, 1, 2 and 3 drops at p50 and p99: fewer than k never trip, k always do.
9. Every safe action belongs to its vehicle's set; `person`/`swimmer` never widen past slow, hover, hold or stop; every action word in Part C
   prose belongs to its vehicle's set (the citations test scans it).
10. One changed byte in `edgetpu.tflite` is refused; an unknown contract major gives the safe action; `checkid` is refused.
11. A takeover overrides any loop action within one tick; one member cannot sign both card and gate.
12. Golden vectors give the same action in Node and Python.
13. A v1.1 record acts like v1.0; no capture ms, a future stamp or a skewed domain gives the safe action; a pinned tensor with class id 999
    gives `unknown` in Node and Python, and the loop gives slow.
14. Alternating good and bad frames never return "continue"; a 10 fps flicker never beats the dwell; after a takeover or "detector lost"
    only a human re-arm restarts the loop.
15. A stick past the dead-band on tick t voids the loop output on tick t (arbiter; keys and analogue sticks; all vehicles); the dead-band
    is read from `stick-sets.ts` (source check); with `crew.pilot` set to AI a human stick still wins and a loop slow caps the AI; a stick
    toward a sensed drop-off on `mass-droid` gives stop; no `lib/2525-core` file imports `@/lib/drone-2525`.
16. At recall 1 the emulator's boxes match the projected obstacles within 1 unit; every `drone-avoid-01` class has an arena object.
17. Each air action, through `stepFlight` from quad, wing and transition mode, ends inside the budget (wing: "begin loiter" inside B − A);
    water and ground actions end inside B; no action lacks an actuator mapping.
18. Bytes and roster: a right-named file with another sha256 is never loaded (one buffer, no second fetch); one changed edge-script byte
    drops the loop to simulation; a forged entry breaks the chain; a revoked key or unsigned roster fails; a stale cached `models.json` is
    refused; v1 readers parse v2; edge copies and the `play.html` bundle hash equal; no plain member id under `public/sensor-fusion/`; a
    camera place refuses the self-update and `BASE`.
19. One injected takeover adds one hard-case task with its clip hash; an off-domain clip set trips the drift row.
20. A retired card cannot be selected; its history still replays.
21. Gate 2: one obstacle hit in N runs fails; a glare burst of K frames, or a miss run longer than H, gives the safe action; synthetic
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
    distance and turn radius come from the vehicle parameter file.
28. A foreign domain with a fresh offset inside m is accepted, a stale one is not; a pre-reboot stamp is refused; a polar record and a
    two-camera disagreement give the golden action; a record with no medium is refused.
29. Every vehicle id in `controls.ts:20-21` gets a `VehicleCommand` of its own family, and only air gets `FlightInput`; a pinned record
    stream gives identical command sequences from `loop-actions.ts` and `loop_runner.py`; `actuators.json` in `edge/` and `download/` match
    byte for byte; an unsigned MAVLink or ROS 2 link refuses to arm; a v2 spec read by a v1 runner gives the safe action; Gate 2 and C6
    refuse without the takeover drill records; every loop class names a covering sensor, and an unmapped-wire burst miss is a Gate 2 scenario.
30. A single tap never re-arms; each re-arm and takeover writes a field event with a salted id; 60 s without input after "detector lost"
    keeps the safe action and repeats "You have control".
31. `loop-ready` is refused for a vehicle absent from `controls.ts`; C6 needs the signed gate hash and the safety pilot's salted id; every
    action maps to a protocol action for every family in `actuators.json`; an undeclared autopilot version is refused; golden vectors per family.
32. With Coral on and a card measured on `detect.tflite`, an armed loop refuses (extends `sensor-fusion-coral.test.mjs`); flipping the
    switch while armed changes nothing and logs one field event; a failed load never falls back to the other file.
33. 300 runs on one layout are refused as N; a provisional card can never be signed.
34. A card lapses to replay-ready when its own `loop-spec.json` section, the edge script or `detect-contract.ts` changes hash, or past its
    max age; adding a camera hazard leaves the Drone's card loop-ready, and changing a Drone threshold lapses it.
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
    cases keep 7 days, and a camera hard case without a consent id never enters R2.
40. A row missing a Gate 2 or card value, or a class with no floor, is refused; 3 clear clips are refused; a card over its bearing ceiling is not ready; the three class lists match; a camera place
    missing any value, or a robot alert purpose with no values row, is refused; a smoke clip scored above 10 s, or scored on fewer than
    59 alerts, is not ready; a p99 claim on fewer than 299 events is refused; measured pilot recall 0.93 against an assumed 0.96 raises the
    142 quota; every purpose has an output kind (action, alert or report); zero false confirmed tracks pass at 25 Drone clear minutes and
    fail at 24, pass at 50 Manta minutes and fail at 49; a report purpose with no class list is refused; a row with no speed envelope or
    covering sensor (Drone person, Manta swimmer) is refused; a `c1-bench.json` under 299 frames per tier is refused.
41. A provisional card reaches only controller-proven; no signature or roster commit carries a personal email; no file under
    `public/sensor-fusion/` holds the salt; one member id hashes differently in two projects; signing keys are non-extractable.

---

# Appendix — Part B — DETECT (future hardware, after Part C in build order)

> Operator, verbatim (2026.10.03):
> "eventually i will generate hardware that can be added to HDMI or video data transfer cable that can add object detection to video
> stream, when this happens we will use light codex to transmit object, box locations, and % object
>
> on receiving end we will decrypt light codex locally so Object detection is almost magical to end user (with black box on cable
> (DETECT) and black box or equivalent at or bear display terminal (using drone-2525) 6 digit personal encryption scramble as needed for
> coding  / decoding)."

Methods only; future work. Nothing here changes R1–R10.

## The picture in one line
**DETECT** (a box on the cable) runs the model on each frame and writes a Light Codex band into it. The **display box** (or Drone-2525)
reads the band, unlocks it with the person's 6-digit code and draws the boxes. Without the code: an ordinary picture and a thin band.

## Why this can work where JPEG failed
- Light Codex broke through JPEG on 2026-10-02 (3 of 16 captions wrong yet verified, `2026-10-02_sensor_fusion_cnn_answer.md`, T14).
- HDMI and DisplayPort carry pixels without loss. Scaling, colour conversion or compression in between (overscan, a capture card's H.264,
  a video call, a stream) breaks the band. So DETECT and the display box are the two ends of the uncompressed link.
- A band that does not verify draws **nothing** and says "not verified", never a guessed box. A verified band with zero objects says "no detections".

## Methods to build (when the hardware exists)
1. **One payload format** — `lib/light-codex-detect.ts` (pure): `encodeDetections(record, key)` → a line; `decodeDetections(line, key)` →
   the record or null. The record is Part C's **Detection record v1** (~22 characters per object); the header carries format version, model
   id + labelmap hash, frame number, capture ms and object count. After encryption the bytes are digits or base-32; `unsupportedChars()`
   (`lib/light-codex.ts`) refuses anything else.
2. **Band:** the bottom rows, `placeSignature(..., blockSize 2)`; at 1920 px, 10 objects + header + tag fit in two lines (~6 px). The display
   box crops it before showing the picture; the model never sees it; never on training data (R10).
3. **Timing:** each band carries the frame number it describes; the display draws it on that frame or holds it up to the loop's max age
   from `loop-spec.json`, then clears it. The delay shows only in `?diag=1`.
4. **The 6-digit code is a pairing code, never the key.** Six digits are 1,000,000 choices, tried offline in seconds. The code authorizes a
   one-time ECDH P-256 → HKDF → AES-GCM-256 pairing, as Drone-2525 does (`frontend/public/drone-2525/play.html:3225-3239`, anchor `deriveKey`). The code comes from
   `generateSealCode` (`frontend/lib/atlantis-package.ts:141`). Each frame: a nonce (frame number + a random per-pairing salt, never reused
   after a reboot) and a tag, so a changed or replayed band is refused. Wrong code or tampered band: no boxes, "This screen is not paired".
5. **Display on Drone-2525:** strokes, the 13-colour palette, the amber/red rule unchanged. A detection never marks, approves or fires anything.
6. **Fallback:** HDMI InfoFrames (invisible, need chip support at both ends), with the payload of method 1 unchanged.

## Tests (when built)
1. Decode(encode(record)) returns the record (box within 1 unit; same capture ms and confidence).
2. JPEG, a 0.5 px scale or one changed block reads **not verified**, never a wrong box.
3. A wrong code, or a band recorded in another session, gives no boxes.
4. 10 objects fit in two lines at 1920 px, block size 2; more are counted as dropped.
5. A band older than the loop's max age is never drawn.
6. The picture shown and the model input have no band pixels.
7. A detection on Drone-2525 changes no slot, approval or fire state.
8. Two pairings never share a salt or a nonce.

## Decisions for DETECT
Items 10–13 of the one list. **Protected content (HDCP):** a box that rewrites the picture cannot carry copy-protected video, so DETECT is
for unprotected sources (cameras, drones, computers) unless licensed.
