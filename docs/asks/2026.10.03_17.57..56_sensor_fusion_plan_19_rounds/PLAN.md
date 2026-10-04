# Sensor Fusion → DETECT → control loops — the plan for Grok (revision 0.03)

> Living plan, revised once per round of the 19-round SSSES · SPIRAL · AsM simulation (see `ASK.md`, `rNN.md`).
> Goal (operator): create Drone-2525, Manta-2525 and MASS-AI detection quickly as a global team — our models, introduced into control loops.
> You are Grok. Methods, files and tests for you to build; no code here. Each revision is listed in the history below; 0.00 was the merge of the two sources.
> Sources: `2026.10.03_17.43..08_sensor_fusion_ask_to_grok_capture_label_projects_v3_FINAL.md` (body, appendix omitted) · `2026.10.03_17.55..31_detect_cable_light_codex_video_for_grok.md`.

## Revision history
| Rev | Round | What changed |
|---|---|---|
| 0.00 | — | Consolidated v3 FINAL (R1–R10) + DETECT note. |
| 0.01 | 1 | Chain overview with owner roles; Today-vs-gap re-verified (R1 shipped, citations fixed); R1 reduced to its test; local vs server tracks; R4 split, guest read **and write** closed first (R4a); R2 domain conditions and numbers; R9 class floors + model card hand-off; new Part C (control loops, safe actions, HAL, sim-first, safety gate); one merged decision list; Part B citation + salt fix. |
| 0.02 | 2 | Glossary; Part C no longer waits on DETECT hardware (neutral versioned Detection record, adapters for cnn.js and the Python edge script, shared `loop-spec.json`); staleness in ms, heartbeat splits "clear" from "detector lost"; per-vehicle action sets; floor and world columns; open-loop vs closed-loop replay; card lives in `models.json` v2 with file sha256s and measured ms per tier; HAL fit corrected; train / held-out / replay split by clip; identity models never loop-eligible; false-negative row over an independent minimum; Part C build steps C1–C5 and a first loop-ready deliverable; gate re-cited; decisions 9 and 14. |
| 0.03 | 3 | One timing law (frame period, max age, heartbeat timeout, actuation) with Drone/Manta/MASS-AI values that add up; hold, recovery and human re-arm; one Detection record v1 shared with Part B (capture ms stamped at grab, confidence 0–9999, sensor and camera ids, optional range and track); box-to-path rule; two gates (model open-loop, controller closed-loop with a detection emulator); arena obstacle layer, `loop-actions.ts`, minimal water and ground worlds; supply-chain gate (BASE, self-update, hash-chained sign log, deny list, one labelmap source); held-out size from the floor, blur parity, local Level 2, 5% re-check; field-to-capture queue and drift row; first-week table per domain; Python runner. |

## The whole chain in one line (read this first)
capture (R2) → Level 1 boxes (R3) → Level 2 review (R6) → XML + Light Codex strip (R3, R10) → `<Set>.train.json` (R9) → model folder +
model card (hand-off, R9) → edge or DETECT (Part B) → display → **control loop** (Part C, C1–C5: Drone-2525 air · Manta-2525 water · MASS-AI ground).
The citation test also checks that every R and C number in this line exists as a heading or build step.

| Role | Picks up |
|---|---|
| Labeler | R2 capture, R3 Level 1 boxes |
| Reviewer (never the labeler) | R6 Level 2, R9 merge |
| Model builder | the training hand-off: train.json in, three files + model card out |
| Loop integrator | Part C contracts, replay gate, HAL fit |

The R numbers are build steps, not plan revisions (0.NN) and not Sensor Fusion ledger releases.

**Five words, in plain terms.**
- **Band:** a thin strip of Light Codex blocks written into a video frame by the DETECT box (Part B). Future hardware.
- **Card:** the model's record — what it was trained on, how well it does per class, how fast it runs, and the hashes of its three files.
- **HAL tier:** the class of computer on the vehicle — pi, edge (a system-on-chip, not an Edge TPU) or accel (`lib/wire-core/hal.ts`).
- **Loop-ready:** a model version passed closed-loop replay for one named loop, and a named human signed it. Open-loop only = **replay-ready**.
- **Safe action:** what a vehicle does when it cannot trust what it sees — air: hover, then land or return; water: hold station; ground: stop. Never "continue".
- **Heartbeat:** a verified Detection record with zero objects. It means "the detector is alive and sees nothing".
- **Golden vector:** a fixed input with its expected output, run the same in Node and Python.
- **Open-loop vs closed-loop:** open-loop replays recorded frames; the vehicle's moves cannot change what is seen. Closed-loop: the
  vehicle moves in a simulated world, and what it sees changes with it.
- **Held-out vs replay split:** held-out clips measure the model; replay clips test the loop. Neither is ever trained on.
- **Track:** one object followed across frames, with an id and a velocity.

---

# Part A — Sensor Fusion: capture, label, build models as a team (v3 FINAL, R1–R10)

> v3 folds the twelve-lens pressure test (`2026.10.03_17.43..08_sensor_fusion_ask_to_grok_pressure_test_12asm.md`, MoT C+)
> into v2 (`2026.10.03_17.40..15_..._time_v2.md`), and adds the operator's ask of 2026.10.03: **use the tokenomics visual from
> https://exel-ai-polling.explore-096.workers.dev/vision-2525/** for contribution time (screenshot beside this file:
> `2026.10.03_17.43..08_sensor_fusion_tokenomics_visual_vision2525.png`).
> This is feedback: methods, files and tests for Grok to build. Claude Code does not write the code.

You are Grok, coding the eXeL AI Sensor Fusion app in `alexseguin-hbs/eXeL-AI-Polling`, branch `main`
(`frontend/app/SensorFusion-2525/`, `frontend/public/sensor-fusion/`). Claude Code reviews and tests; you build.
Short sentences in the app. **One revision at a time:** commit R1, wait until the live site serves it, then start R2.

## Rules that do not change
- A model is one folder with three files: `detect.tflite`, `edgetpu.tflite`, `labelmap.txt`. Never rename them. Never add a second way to store a model.
- Nothing a person sees names a database, an error code or a vendor. One plain sentence; the detail goes to the console.
- The screen never says "saved", "uploaded" or "reviewed" before it is true.
- New words: the key goes in `frontend/lib/lexicon-data.ts`, and its name goes in `AFTER_FILL` in `frontend/tests/lexicon-coverage.test.mjs:19`. It stays English until the operator says the English is final. No translation fill.
- A test for a later revision does not enter `test:ci` before that revision ships.
- **Citations are checked, not trusted.** Every `file:line` in this plan is re-verified each round. A plain-Node check (staged, `frontend/tests/sensor-fusion-plan-citations.test.mjs`) reads PLAN.md and fails if a named path does not exist.

## Today vs gap (read the code first — do not rebuild what ships)
| Already in the code | Where | Gap |
|---|---|---|
| Steps "Capture Images" and "Annotate Images" | `app/SensorFusion-2525/steps.tsx:2-3` | Capture takes only sensor + device today; video picking (R2) |
| AI accuracy meter | `sensor-fusion.tsx:1093` | none — keep it |
| Six training icons as the step bar | ledger r. entries `ledger.ts:132-146` | none — keep them |
| Pascal VOC writer `vocXml` | `sensor-fusion.tsx:169`, called by `writeXml` at `:401` and `:418` | move to a pure module + add `readVoc` (R3) |
| Picture + label tables | `supabase/migrations/040_sensor_fusion_pictures.sql`, `041_sensor_fusion_labels.sql` | **guests can read and insert today** (INSERT `040:15-16`, `041:18-19`; SELECT `040:22`, `041:25`) — close first (R4a) |
| Model list | **SHIPPED:** `public/sensor-fusion/models.json`; `sf.ts:23` imports it; `cnn.js:50` fetches it; both `sensor_fusion_edge.py` copies read it (`:36-52`) | only the R1 test is missing |
| Names `head.0001.jpg` that continue | built by `peekNames` / `commitNames`, `sensor-fusion.tsx:252-258` | dot form → `<label>_<NNNN>` (R5), with migration |
| Fixed detection threshold | `cnn.js:104` (`score > 0.5`); also `sensor_fusion_edge.py:176` in both `edge/` and `download/` | per-class thresholds from the model card (Part C) |
| Invite codes | `lib/drone-2525/si-pod.ts:119` `inviteCode` = seeded hash fed to `randomPodCode`; `admits` `:149` runs in the browser | live codes from crypto bytes + a server check (R4b) |
| Vehicles | `lib/2525-core/controls.ts:20-21` (`vtol-quadwing`, `manta-99-66`, `manta-mini-66-33`, `ark-sail-33`, `mass-droid`); `controls.ts:19`: "Only `turret` and `vtol-quadwing` exist in this repo today"; sea and droid platforms listed and dated (`lib/drone-2525/platform.ts:10`); Manta project `lib/pod-projects.ts:86`; shared core `lib/2525-core/MANIFEST.md` | no detection contract yet; **no water or ground world** — Manta and MASS-AI replay is open-loop until one exists (Part C, decision 14) |
| Compute tiers | `lib/wire-core/hal.ts` `HAL_PROFILES` (pi/edge/accel), `halCnnMs`, `sensorFits`; gated by `tests/drone-hal.test.mjs` | `cnnMs` prices a render-ladder rung and `frameBudgetMs` is a render budget — neither is model time; the card carries measured model ms (Part C) |
| Shipped labelmaps | `public/sensor-fusion/models.json`: `demo90` (COCO), `thermal01` (`:553`, dog and person, a thermal sensor), `checkid` (`:541`, four named people), `tree` (`:136`), `deer` (`:109`), `custom01` (`:145`, boat, car, bird among its classes), `head` (`:118`) and `eyes` (`:127`, body-part detectors) | no labelmap has wire, pole, hull, pier, buoy or step; seed `drone-avoid-01` from `tree` and use `deer` as the wildlife class (R9.5); `checkid`, `head` and `eyes` are on the deny list — never loop-eligible (Part C) |
| Model bytes source | `BASE` = a third-party master branch (`cnn.js:8`, `sensor_fusion_edge.py:34`), fetched at `:127` and installed by `os.replace` at `:128`; the script updates itself from `APP` (`:35`, read at `:285`) | loop models load only from a pinned, hash-listed copy named by the signed card; self-update refused while a loop is armed (Part C gate) |
| Detector timing | `sensor_fusion_edge.py:167-169` and `cnn.js:80`, `:116` time inference only; nothing stamps the capture | both adapters stamp capture time where the frame is read (`camera.read`, `sensor_fusion_edge.py:235`; the browser video frame callback); `tierMs` is capture → output (Part C) |
| Detection payload | `lib/light-codex-detect.ts` — **does not exist yet** | Part B method 1 |
| Pod clock | `lib/pod-clock.ts` | wire to project elements (R8) |
| Trinity cards (♡ SI · 웃 HI · ◬ AI) | `app/vision-2525/page.tsx:168-195`, data `lib/soi-framework.ts:32-34` | reuse as one shared component (R8) |

## Revisions, in order (each: its done line, its tests, then wait for LIVE)

**Two tracks, so nothing sits idle.** *Local track* (no operator decision needed): R1 test, R2, R3, R4a, R5 alone, R6 on one device,
R7 Save set (folder or zip, manifest), R8 clock with `measure()` (`lib/pod-clock.ts:56`), R9, R10, Part C steps C1–C5. *Server track* (waits on
decision 1): R4b group join, R5 group blocks, shared queues, Upload, shared time records.

**R1 · One model list — SHIPPED.** `models.json` exists and all four readers use it (see Today vs gap). Do not rebuild it.
*Only gap — the test:* every `models.json` entry has its three files; the name picker shows only the open model's labels.

**R2 · Capture from three sources, one set.** Sensor (name from the open model's `labelmap.txt`, how many, default 4) · this device
(several files) · video. Video keeps the fewest different-enough frames, with fixed numbers: sample 4 frames/s; drop frames whose
Laplacian variance is under a stated threshold; drop near-copies by a 64-bit picture fingerprint within Hamming distance 6; prefer frames
where the model sees the object; keep 1 in 10 empty frames; cap 40 per minute; show "1,800 frames → 31 pictures" before saving.
One shared spec file for the numbers, read by the page and by Python, e.g. `public/sensor-fusion/capture-spec.json`. Every number has its
value there, including the Laplacian floor (proposed: 100 on a 640 px grey frame; the operator may change it) — none lives only in code.
Strip GPS and EXIF; respect EXIF rotation; turn HEIC into JPEG.
**Domain and conditions.** Each set records its domain (air · water-surface · underwater · ground) and sensor (rgb today; thermal, sonar,
depth later), and tags pictures with the conditions a loop needs: glare, turbidity, spray, night, rain, lens fouling, dust or mud,
motion blur at cruise speed. The R6 set check warns when a needed condition has zero pictures.
**People in pictures.** The `person` class is for avoidance, search and rescue and blurring only — never for engagement. Faces in shared
sets are blurred unless consent is recorded. **Identity models** (`checkid`, and any face or named-person labelmap) are never loop-eligible
and never shared without recorded consent.
**Per-domain capture checklist and quota** (in `capture-spec.json`, so one region can own one domain): air — thin wires at range, sky glare;
water — turbidity, glare, spray; ground — night, dust. Each list names its loop's classes and floors; minutes of video per class follow from
the R9 box floor and the 40-per-minute cap, so each time zone knows its quota. Thermal is already a sensor (`thermal01`), not only "later".
Minutes per class = (floor-derived held-out count + replay count + 300 train boxes) ÷ (40 picks/min × boxes per pick); the page shows the
result per domain and a test checks the sum. Each set also records the camera id and its intrinsics (field of view, image size, mount
angle) in `capture-spec.json`, so a loop can turn a box into a bearing. A **hard cases** list (field events, Part C) is picked first.
*Test (browser + Python runner):* a pinned 60 s clip gives ≤ 40 pictures, no near-copies, the same picks in both.

**R3 · Annotate.** Four edge grips (left/right move sideways only, top/bottom up and down only) placed **outside** the box so a finger
never covers the line; thin high-contrast line; magnifier while dragging; one-pixel nudges. Boxes kept in picture pixels. SAVE BOX writes
to the device only. Move `vocXml` into `lib/sensor-fusion/voc.ts` (pure) and add `readVoc`. A picture may have zero, one or many boxes.
Label names: from `labelmap.txt`, "did you mean …?" for close spellings; a label must be file-name safe (letters, digits, `-`). Two labels that would make the same file name (`ray fin`, `rayfin`) are refused at entry, not silently merged (Thoth).
*Tests:* `readVoc(vocXml(x))` equals `x`; labelImg opens the file; a saved box equals the on-screen box within 1 pixel; five SAVE BOX = 0 downloads.

**R4a · Close the tables first (its own revision, before any group feature).** Today a guest can read **and insert** pictures and labels
(040/041, see Today vs gap). Anyone who can insert labels can poison a model a vehicle will steer by. New migration: only signed-in project
members may read or write; guests get nothing.
*Tests:* a guest read returns nothing; a guest insert is refused; a member of project A cannot read project B.

**R4b · Group projects and roles.** Owner, contributor, reviewer, viewer; optional **teacher** (sees time and progress, never a race).
Live invite codes come from `randomPodCode` fed **crypto-random bytes**; the seeded `inviteCode` (`si-pod.ts:119`) stays for replay only.
Codes expire (reuse the idea of `INVITE_TTL_MS`). Admission is checked **on the server** (a Supabase RPC or RLS policy), not only by the
browser `admits` (`si-pod.ts:149`). Sign-in required; store a member id, never a name. Warn when faces appear; consent rules for minors are
the operator's. **Waits for decision 1.**
*Tests:* a guest cannot join; an expired code is refused; the same seed in live mode never gives the same code twice; an admission
granted only by the browser is refused by the server.

**R5 · Names that never collide.** `<label>_<NNNN>.jpg` + `.xml`, 4 digits, 5+ past 9999. Alone: highest used + 1, never reused.
Group: temporary names while collecting; at **Close upload**, members in join order, each member's pictures in capture order, one unbroken
block each (`bird_0001`–`bird_1111`, then `bird_1112`–`bird_2222`). A late member gets the next block; a member who leaves keeps their
block. Old `bird.0001` names are read and renamed once; the XML records every rename. Reopening after Close is the operator's decision.
*Test:* 2 × 1,111 pictures number as above; 10,000 pictures reach `bird_10000`; an old dot-name set migrates with no gap.

**R6 · Level 1 and Level 2.** Each box carries `level`, `labeled_by`, `labeled_at`; after review `reviewed_by`, `reviewed_at`, `review`
(accepted · fixed · rejected) and a short reviewer note sent back to the labeler. The reviewer is never the labeler. **Local Level 2:** two
members may share one device, each with their own member id and sign-in, so Level 2 runs without decision 1. **Re-check against poisoning:**
before a merge, a second reviewer re-checks a random 5% of the set's accepted boxes; a set whose disagreement rate is above the rate in the
shared spec is blocked from train.json. A queue holds a picture for one person for 10 minutes, then frees it. A set check flags near-duplicate
names and boxes. Only accepted or fixed Level 2 boxes train.
*Test:* a reviewer is never shown their own box, also with two members on one device; a held picture frees after the timeout; a set
above the re-check disagreement rate cannot be merged.

**R7 · Save set and upload.** `Pictures/<Set>/` (folder on a desktop, one zip on a phone) with every jpg+xml pair, `labelmap.txt` and a
manifest (schema version, model id + labelmap hash, member roster in join order, the rename log, and per file: sha256, label count, level, member id). The XML carries the same schema version, so a later format change never breaks old sets silently (Odin). Warn before the phone's storage is full. **Upload destination is the operator's decision.**
*Tests:* Save set makes one file; the manifest hashes match the files; a failed upload never says "uploaded"; no screen names a database, error code or vendor; removing a member, an expired code and deleting a set each behave as stated (Athena, Thor).

**R8 · Contribution time, shown with the Vision-2525 tokenomics cards.**
- *Clock:* reuse `frontend/lib/pod-clock.ts` (start/stop events, `measure()`, `witnessedMinutes()`, `hhmmss()`), the clock already used by
  `app/soi-session/page.tsx` and the Drone-2525 SI panel. No second clock. Every working stretch counts, long term: capture (sensor,
  device, video), Level 1, Level 2, name merges, set checks, and later project elements. **Clocked, not claimed:** the platform records
  start and stop (member id, project, element, device); recorded time is never altered; a claim may never exceed witnessed time; idle closes
  a stretch. Stored in UTC, shown in the person's time and as `YYYY.MM.DD_HH.MM..SS`; order follows the clock's `seq`.
- *The visual (operator, 2026.10.03):* the three cards on `/vision-2525/` — ♡ SI Shared Intention, 웃 HI Human Intelligence, ◬ AI
  Artificial Intelligence, each with its glyph disc, accent colour, purpose line and law line (`1 minute given = 1 ♡` · `1 웃 = 1 hour at
  1× local min wage · earned = M × hours` · `◬ = witnessed acceleration · 1 min SI = 5 ◬ illustrative, variable to ~10×`).
  **Method:** lift the card markup at `app/vision-2525/page.tsx:176-192` (with `TRINITY_ACCENT`, `page.tsx:33`) into one shared
  component, e.g. `components/soi-trinity-cards.tsx`, and have Vision-2525 and Sensor Fusion both render it — never a copy. Give it an
  optional value line per card: the project's or member's **♡ minutes** (live, from the clock), **◬** shown only as the illustrative
  multiple until witnessed acceleration exists, **웃** shown as "paid projects only" until the operator marks a project paid.
  Read names, purposes and laws through the existing `soi.coin.*` lexicon keys (`lib/lexicon-data.ts:1306-1315`) — note the Vision-2525
  page prints `c.name` / `c.purpose` / `c.law` raw today, so the shared component fixes that too (the way `components/soi-section.tsx:38` does).
  Fits 390 px: the three cards stack in portrait, three across from `sm`.
- *Where it shows:* the project page (team total, split by element), each member's row, and each model version (who gave how much time).
- *Later, paid projects → 웃, the operator's decision:* from the date a project is marked paid, its witnessed hours can be valued as 웃
  (M × hours, platform-clocked only). ♡ is never spent or traded (D12); what carries over is the witnessed-hours record.
*Tests:* ten minutes of Level 1 work make one stretch with member id, project, element, device and UTC; idle is not counted; an over-claim is
refused; team ♡ equals the sum of members, split by element, the same in two time zones; Vision-2525 and Sensor Fusion import the same
card component (source check); no card string is printed without `t()`.

**R9 · XML while editing, one JSON after Level 2 (operator, 2026.10.03_17.48..49 CST).**
> Operator, verbatim: "default to xml for individual editing and we can merge to json after level 2 completed for model training"
- **XML is the default and the source of truth.** One Pascal VOC `.xml` beside each `.jpg`, edited picture by picture through Level 1
  and Level 2 (R3, R6). Nobody edits the JSON.
- **Merge to JSON only when Level 2 is complete.** A **Merge for training** button appears once every picture in the set has finished
  Level 2. Until then it says how many pictures are still waiting. Method: a pure `mergeToJson(set)` in `lib/sensor-fusion/voc.ts`
  that reads every XML through `readVoc` and writes one `<Set>.train.json`:
  - images: file, width, height, sha256;
  - categories: from `labelmap.txt`, in its order;
  - annotations: only boxes whose Level 2 review is accepted or fixed. Rejected and Level-1-only boxes are left out, and the count of
    each is printed.
  - the schema version, model id, labelmap hash, and a hash over all the XMLs, so the JSON always says which XMLs made it;
  - a class-balance report: boxes per class and per condition. A class under the minimum box count (in the shared spec; proposed 300
    accepted boxes) marks the set "not ready for loop X".
  COCO layout is recommended, since it is the common training format; the operator confirms.
- **Regenerated, never patched.** Any later edit goes back to the XML, a new Level 2 review, then a fresh merge. A JSON whose XML hash
  no longer matches the set is marked out of date and is not used for training.
- **Three splits, fixed before merging.** Each domain's pictures go to train, held-out or replay **by clip or session, never by frame**,
  so near-copies cannot leak. The manifest (R7) records the split by picture sha256. `mergeToJson` refuses a held-out or replay hash.
  **Held-out size follows from the floor:** n ≥ 3 ÷ (1 − floor) instances per class — about 100 for a 0.97 floor, 30 for 0.90. The card
  reports the 95% lower confidence bound, not the point estimate; a class whose bound is under its floor is "not ready".
  **Blur parity:** person and swimmer recall is measured on a consented, unblurred held-out set, or with the same blur the runtime uses.
  The card records which; loop-ready for person is refused when the held-out blur state differs from the runtime's.
  **One label source:** the `labelmap.txt` bytes (UTF-8, LF, order as written) are what every hash covers. The `models.json` labels array
  must equal them (R1 test), and both adapters map name → index through that file only.
- **Training hand-off (named, not out of scope).** Out: `<Set>.train.json` + labelmap hash. Back: the three model files + a **model card**.
  The card is **not a fourth file**: it is a `card` object on the model's entry in `models.json`, which moves to version 2 with a schema check.
  It holds: train.json hash; sha256 of `detect.tflite`, `edgetpu.tflite` and `labelmap.txt`; per-class precision and recall on the held-out
  split; per-class thresholds; `unknown` rate; domain; sensor (rgb, thermal; sonar and depth declared); measured model ms per HAL tier
  (`tierMs.{pi,edge,accel}` with device, input size, p50 and p95); and `clearedLoops[]`. The card is signed by a named member who did not
  do the Level 2 review. Where training runs is decision 7.
- **First labelmap per loop (R9.5).** Name the new model ids in `models.json` (e.g. `drone-avoid-01`, `manta-dock-01`, `mass-nav-01`). Seed
  them from shipped classes (bird, boat, person, car); new classes (wire, hull, buoy, step) start at zero and the class-balance report counts them up.
- **Save set (R7)** carries the XMLs always, and the JSON only when it exists and is current. The page and the Python edge script merge
  the same way (one shared spec).
*Tests (plain Node):* merging is refused while any picture is short of Level 2; merging the same XMLs twice gives byte-identical JSON;
the box counts in the JSON equal the accepted plus fixed boxes in the XMLs; a rejected box never appears; editing one XML marks the JSON
out of date; a class under the floor is reported "not ready"; a box with no Level 2 sign-off is refused by the merge; no held-out or
replay hash appears in train.json and no clip has frames in two splits; every `models.json` v2 card has all its fields; a card at 0.97 recall
on 50 instances is "not ready"; the browser and Python compute the same labelmap hash for every entry.

**R10 · Light Codex as each picture's metadata (operator, 2026.10.03_17.51..01 CST).**
> Operator, verbatim: "within organizing workloads ; feel free to use LightCodex on image for level 1 and level 2 annotations; while also
> specifying time annotated on image, who captured or uploaded image, and who level 1 and level 2 approved with time stamps ( think light
> codex as metadata)."
- **Reuse, do not rebuild:** `frontend/lib/light-codex.ts` — `placeSignature(src, signature, blockSize, style)` to write,
  `decodeImage(d)` to read back, `unsupportedChars(text)` to refuse a payload before writing it.
- **What the codex carries** (one short line per picture, member ids never names, stamps in `YYYY.MM.DD_HH.MM..SS` UTC):
  `<file stem> · CAP <member id> <stamp> <sensor|device|video> · L1 <member id> <stamp> · L2 <member id> <stamp> <accepted|fixed|rejected> · X <first 8 of the XML sha256>`.
  The capture part is written when the picture is captured or uploaded. The L1 and L2 parts are added as each level is signed off.
  Each step writes a new codex and never edits the old one; the earlier codex is kept in the rename and review log. The XML hash ties
  the picture's light record to its XML, so a codex that no longer matches its XML reads as out of date.
- **Where it goes — never on the training JPEG.** The 2026-10-02 tests showed JPEG breaks Light Codex: through JPEG 3 of 16 captions
  decoded wrong yet read as verified (`docs/asks/2026-10-02_sensor_fusion_cnn_answer.md`, T14). A stripe on the training picture would
  also teach the model its colours. So the codex goes on a lossless PNG strip beside the picture, `<label>_<NNNN>.codex.png`, sized to
  the picture's width. The codex goes in the set (R7) with the jpg and xml; it is left out of the training JSON (R9) except its hash.
- **Organizing the workload:** the queues (R6) read the codex strips to sort and show the state of each picture at a glance:
  captured · Level 1 done · Level 2 done · rejected and sent back. Who did it and when are shown beside each picture. The time each
  stamp marks matches the pod clock's stretches (R8), so ♡ minutes and the picture record agree.
- **The XML stays the source of truth** (R9). The codex is a readable mirror on the image side. When the two disagree, the XML wins
  and the picture is flagged.
*Tests:* writing then reading a codex strip as PNG gives back the exact line (16 of 16); the same line through JPEG is never read as
verified (reported as unreadable instead); a payload with an unsupported character is refused before writing; L1 and L2 parts appear only
after those sign-offs, with the signer's member id, and the L2 signer is never the L1 signer; a codex whose XML hash no longer matches is
flagged out of date; the training JPEG's pixels are unchanged.

## Tests file and runners
All in `frontend/tests/sensor-fusion-labeler.test.mjs`, added revision by revision. Plain Node: R1, R3 (voc round trip), R4a (source check of the new migration: no `anon` in any policy), R5, R6, R8, R9. Part C tests live in their own files (see Part C). Needs a browser (canvas ImageData): R10.
Needs a browser (Playwright, preinstalled Chromium): R2 page side, R3 pixel check, 390 px layout, R8 card stack. Needs Python: R2 frame picks
and the Part C golden vectors. **Python runner:** one npm script, e.g. `test:sensor-fusion-py`, runs them with `python3`, and a step in
`.github/workflows/deploy.yml` calls it. It stays outside `test:ci` until C1 ships. Compare page and Python picks on the decoded frames from one shared decoder output (pinned clip + its frame hashes), not on each side's own JPEG decode, which can differ by a pixel (Odin).

## Operator decisions — one list for the whole plan (asked, not assumed; recommended default in brackets)
1. Where group projects, roles, queues and time records are stored — the server track waits on it. [Supabase, behind R4a policies]
2. Where Upload sends sets. [the same project store]
3. Teacher role and consent rules for minors. [teacher on; minors only with recorded guardian consent; faces blurred]
4. What reopening a project after Close does. [new block numbers after the last; old blocks untouched]
5. When a project counts as paid (the 웃 switch). [only when the operator marks it]
6. The training JSON's layout. [COCO]
7. Where training runs and who may sign a model card. [operator's machine; a named member who did not review]
8. Which loop gets the first model. [Drone-2525 collision avoidance in the civic simulation]
9. The compute tier, max detection age and per-class floors per loop. [the Part C table's proposed values: tier, age column, recall-floor column]
10. DETECT: band, HDMI side channel, or both. [band first]
11. DETECT: which video links count. [HDMI only]
12. DETECT: code per person or per pair of boxes, and how a lost code is replaced. [per pair; re-pair to replace]
13. DETECT: protected content (HDCP). [unprotected sources only, unless licensed]
14. Who builds the fuller water and ground worlds, and when; whether `ark-sail-33` joins Manta. [the loop integrator of each region owns its minimal world in `replay.ts` now (C4); fuller worlds after the first air box is loop-ready; `ark-sail-33` later]

## Out of scope
Running the training itself (the hand-off in R9 is in scope). Any change to existing model files or label files.

---

# Part B — DETECT

> Operator, verbatim (2026.10.03):
> "eventually i will generate hardware that can be added to HDMI or video data transfer cable that can add object detection to video
> stream, when this happens we will use light codex to transmit object, box locations, and % object
>
> on receiving end we will decrypt light codex locally so Object detection is almost magical to end user (with black box on cable
> (DETECT) and black box or equivalent at or bear display terminal (using drone-2525) 6 digit personal encryption scramble as needed for
> coding  / decoding)."

Methods only. Claude Code names the methods, files and tests; Grok builds; no code here. Future work: nothing below changes the
Sensor Fusion revisions R1–R10 (`2026.10.03_17.43..08_sensor_fusion_ask_to_grok_capture_label_projects_v3_FINAL.md`).

## The picture in one line
**DETECT** (a box on the cable) runs the Sensor Fusion model on each frame and writes a Light Codex band into the frame. The **display
box**, or Drone-2525 on the screen side, reads the band, unlocks it with the person's 6-digit code, and draws the boxes. Anyone without the
code sees an ordinary picture plus a thin coloured band.

## Why this can work where JPEG failed
- On 2026-10-02 Light Codex broke through JPEG: 3 of 16 captions read wrong yet showed as verified (`2026-10-02_sensor_fusion_cnn_answer.md`, T14).
- **HDMI and DisplayPort carry pixels without loss**, so a codex band survives the cable itself.
- It breaks anywhere the picture is **scaled, colour-converted or compressed** in between:
  - a TV's overscan or zoom;
  - a capture card's H.264;
  - a video call;
  - a stream to the internet.
- **So DETECT and the display box must be the two ends of the uncompressed link.** A third device in between voids the band.
- Rule for the screen: when the band does not verify, draw **nothing** and say "not verified". Never draw a guessed box. A verified band
  with zero objects is different: it says "no detections" (a clear scene).

## Methods to build (when the hardware exists)
1. **One payload format, shared by both boxes** — `lib/light-codex-detect.ts` (pure).
   - `encodeDetections(record, key)` → a Light Codex line. `decodeDetections(line, key)` → the same record, or null.
   - The record is Part C's **Detection record v1** — the same fields, no second format: label index (from `labelmap.txt`), box
     (x, y, w, h as 0–9999 of the frame), confidence as an integer 0–9999 (card thresholds use the same scale).
     That is ~22 characters per object.
   - The header carries the format version, model id + labelmap hash, frame number, capture time (ms) and object count.
   - Light Codex writes only its own alphabet (letters, digits, `. - _ ,`).
     - After encryption the bytes are written as digits or base-32 letters.
     - `unsupportedChars()` (in `lib/light-codex.ts`) refuses anything else before writing.
2. **Where the band sits.** A fixed band at the bottom rows, `placeSignature(..., blockSize 2)`.
   - At 1920 px wide, one line holds ~210 characters, so 10 objects + header + tag fit in two lines (~6 px).
   - The display box crops or covers the band before showing the picture. It never touches the rest of the frame, and the model never
     sees the band.
   - The band is never on the training data (same rule as R10).
3. **Timing.** Inference on an Edge TPU takes a frame or two.
   - DETECT stamps every band with the frame number it describes.
   - The display box draws a box only on that frame, or holds it for at most the max age in ms from `loop-spec.json`, then clears it.
   - The delay is shown in `?diag=1`, never on the picture.
4. **The 6-digit code — a pairing code, not the key.** Six digits are only 1,000,000 choices. Someone who records the stream can try them
   all offline in seconds, so the code must never be the encryption key itself.
   - **Pairing:** the code authorizes a one-time pairing. The two boxes run ECDH P-256 → HKDF → AES-GCM-256, the pattern Drone-2525
     already uses (`frontend/public/drone-2525/play.html:453` "Code authorizes the human pairing. ECDH/HKDF/AES-GCM protects node traffic").
   - **The code:** it is made with `generateSealCode` in `frontend/lib/atlantis-package.ts:141` (random, not a hash of a seed) plus a
     6-digit tier.
   - **Each frame:** a fresh nonce (the frame number + a session salt) and a short tag, so a changed or replayed band is refused.
     The salt is random and new for every pairing, never reused after a reboot, so nonces never repeat.
   - **Wrong code or tampered band:** no boxes, the sentence "This screen is not paired", and nothing else.
5. **The display end on Drone-2525.** Same vector law: boxes as strokes, the 13-colour palette, the amber/red designation rule unchanged.
   A detection is only a picture of what the model saw — it never marks, approves or fires anything. The existing Drone-2525 doctrine
   holds: a named human decides.
6. **Fallback channel, named for later.** HDMI also carries a small side channel outside the picture (InfoFrames). It is invisible and
   costs no pixels, but needs hardware support at both ends. Keep the payload format of method 1 identical, so the band and the side
   channel can be swapped without changing a reader.

## Tests (when built)
1. `decodeDetections(encodeDetections(record, k), k)` returns the same record (box within 1 unit of 0–9999; same capture ms and confidence).
2. A band passed through JPEG, a 0.5 px scale or one changed block reads as **not verified** — never a wrong box.
3. Wrong code, or the right code on a recorded band from another session, gives no boxes.
4. 10 objects + header + tag fit in two lines at 1920 px, block size 2; the reader says how many objects were dropped if more were found.
5. A band is never drawn once its capture time is older than the loop's max age in ms from `loop-spec.json`.
6. The cropped picture the user sees has no band pixels, and the model input never contains the band.
7. A detection shown on Drone-2525 changes no slot, approval or fire state.
8. Two pairings in a row never share a salt or a nonce.

## Decisions for DETECT
Merged into the one list in Part A (items 10–13): band or side channel (the band is simple, visible, works today; the side channel is
invisible, needs chip support); HDMI only or also DisplayPort / SDI; code per person or per pair. **Protected content (HDCP):** a box that
reads and rewrites the picture cannot carry copy-protected video such as streaming services. That limits DETECT to unprotected sources
(cameras, drones, computers) unless licensed — worth knowing before the hardware is drawn.

---

# Part C — Detections into control loops (Drone-2525 · Manta-2525 · MASS-AI)

> **Scope boundary (hard).** A detection steers, slows, holds or stops a vehicle — for navigation, collision avoidance, station keeping,
> inspection, wildlife, search and rescue, and the Drone-2525 civic simulation. It never marks, approves or fires anything. The
> Drone-2525 two-step named-human gate (TARGET amber → APPROVE red → FIRE, simulation only; amber → red two-step at
> `lib/drone-2525/challenge.ts:17`, CH5 two-person rule at `:103`, slot-box rule r.149 at `lib/drone-2525/domain.gen.ts:306`) is
> untouched. Real-world weapon targeting and detecting people for engagement are out of scope.

Methods, files and tests for Grok; no code. **Loops take detections from the on-board model today** (`cnn.js` in the browser,
`sensor_fusion_edge.py` on a vehicle) **and from the DETECT band later.** Part C does not wait for the cable hardware. It builds on the
local track and needs no server.

**Build steps (local track; each: done line, test, then wait for LIVE).**
- **C1 · Contract + spec.** `detect-contract.ts` and `loop-spec.json`, pure. *Done:* golden vectors pass in Node and Python.
- **C2 · Adapters.** `fromCnnHits` and the Python edge adapter. *Done:* one pinned frame gives identical Detection lists in both.
- **C3 · Gate 1, open-loop replay per domain.** *Done:* per-class P/R and p95 scored for air, water and ground. Air, water and ground run
  in parallel — one regional team each; "one revision at a time" binds only the live site.
- **C4 · Gate 2, closed loop.** Obstacle layer, detection emulator, `loop-actions.ts`, water and ground worlds. *Done:* the first loop-ready
  box below is met in simulation.
- **C5 · Signed safety gate + rollback.** *Done:* a live loop refuses any model without a signed, hash-matched card.

## One loop contract, shared — never three copies
- **`lib/2525-core/detect-contract.ts`** (pure, new). Registered in `lib/2525-core/MANIFEST.md`. Drone-2525 is the first consumer;
  Manta-2525 and MASS-AI are declared consumers.
- **Input: Detection record v1**, versioned like `CONTROLS_SCHEMA` (`controls.ts:17`). Required: label index (from `labelmap.txt`), box
  x, y, w, h as 0–9999, confidence 0–9999, capture time (ms), clock domain id, frame number, model id, labelmap hash, sensor id, camera id,
  calibration version. Optional: range (m) and track id. A payload with zero objects is a valid **heartbeat** ("alive, clear"). Part B
  carries this same record later. Minor versions only add optional fields; a reader ignores unknown optional fields; an unknown major
  version gives the safe action.
- **Capture time:** monotonic ms from the device that captured the frame, stamped at grab time — `camera.read` (`sensor_fusion_edge.py:235`)
  and the browser video frame callback — never after inference and never from `perf_counter` deltas. A record with no capture time, a
  future stamp, or a clock domain other than the loop's is refused and gives the safe action.
- **Adapters:** `fromCnnHits` turns `cnn.js` hits (normalized ymin/xmin/ymax/xmax + label name, `cnn.js:105-113`) into the record; the
  Python edge script gets the same adapter. Both clamp boxes to 0–1 before scaling to 0–9999. A class id out of range (shown as a placeholder name at
  `cnn.js:112`, `sensor_fusion_edge.py:178`) becomes `unknown` and is never dropped. `decodeDetections` is the third producer later.
- **Which file runs where:** `detect.tflite` on pi and edge (system-on-chip); `edgetpu.tflite` only where a Coral is present.
  `card.tierMs` records which file it measured, from capture to output, not `invoke()` alone.
- **Box to path:** bearing comes from the box centre and the camera intrinsics (in `capture-spec.json` and the card). Range comes from the
  independent sensor (rangefinder, depth, sonar, altitude) or, failing that, from the class's known size. "In the path" = bearing inside the
  vehicle's swept corridor and range under the stopping distance at its speed. A one-frame box with no track gives only "slow".
- **One shared spec, two runtimes:** `public/sensor-fusion/loop-spec.json` holds the actions, failure rows, budgets, age limits, floors and
  thresholds. TypeScript and Python both read it. Golden vectors (input → action) run in both. Registered in `MANIFEST.md` with
  domain-neutral ids (actions as ids, labels by property).
- **Output:** one action from the **vehicle's own set**, plus the reason for `?diag=1`. Air: continue, slow, hover, land, return. Water:
  continue, slow, hold station, surface. Ground: continue, slow, stop (brake held). An unknown contract or spec major version → safe action.
- **Per-class thresholds** come from the model card. They replace the fixed `score > 0.5` (`cnn.js:104`, `sensor_fusion_edge.py:176`).
- **Hold and recovery:** tightening to a more careful action is instant. Relaxing needs both a minimum dwell (ms, in `loop-spec.json`) and
  K verified clear heartbeats in a row (K in `loop-spec.json`). A detection flickering at 10 fps can never make the action alternate faster
  than the dwell.
- **Takeover and hand-back:** the live input path is `lib/drone-2525/use-controls.ts`, fed by the `StickBinding` sets (`controls.ts:25`).
  Any stick or key deflection past a dead-band sets "human has control" before the loop's action is applied on that tick. The loop
  re-engages only on an explicit human re-arm — never on its own after a takeover, a "detector lost" or a "model refused".
- **Display (Drone-2525 HUD):** detection boxes as strokes (Part B method 5 palette); the current action as one plain word; one status line
  at 390 px for each state — "Loop is flying", "You have control", "Detector lost". The reason goes only to `?diag=1`. The action word never
  covers the reticle or slot boxes. Display never writes slot, approval or fire state. New words stay English in `AFTER_FILL`.

## The loops (bound to the vehicle ids in `lib/2525-core/controls.ts:21`)
| Vehicle | Loop purposes | Classes (first set) | Latency budget | Max detection age | HAL tier | Recall floor (proposed) | Safe action | Independent minimum | World | Human role |
|---|---|---|---|---|---|---|---|---|---|---|
| Drone-2525 (air; `vtol-quadwing`) | collision avoidance, wires and terrain, inspection, wildlife, search and rescue, civic simulation | wire, pole, tree, bird, person (avoid only), vehicle | ≤ 150 ms end to end, ≥ 20 fps (frame 50 ms), p95 ≤ 50 ms | 100 ms (actuation ≤ 50 ms; heartbeat timeout 200 ms) | edge or accel | 0.90; person 0.97 (precision ≥ 0.80) | hover; then land if the return path is not known clear, else return | altitude + geofence | arena + detection emulator — closed loop (C4) | pilot watches, takes over, stops |
| Manta-2525 (water; `manta-mini-66-33` first, `manta-99-66`) | station keeping, hull and pier inspection, marine wildlife | hull, pier, buoy, swimmer (avoid only), marine animal | ≤ 400 ms, ≥ 4 fps (frame 250 ms), p95 ≤ 100 ms | 350 ms (actuation ≤ 50 ms; heartbeat timeout 850 ms) | edge | 0.85; swimmer 0.97 | hold station (surface only for a submerged hull and never within the swimmer stand-off; to confirm for `manta-mini-66-33`) | depth + proximity hold | minimal 2D water world with current drift in `replay.ts` — controller gate only | boat crew watches, takes over, stops |
| MASS-AI (ground; `mass-droid`) | ground navigation, obstacle stop, search and rescue | obstacle, step, person (avoid only), vehicle | ≤ 250 ms, ≥ 8 fps (frame 125 ms), p95 ≤ 75 ms | 200 ms (actuation ≤ 50 ms; heartbeat timeout 450 ms) | pi or edge | 0.90; person 0.97 | stop, brake held (also on a slope) | rangefinder + geofence | minimal 2D ground world with an obstacle grid in `replay.ts` — controller gate only | robot team watches, takes over, stops |

The numbers are proposals for decision 9. They live in `loop-spec.json`, not in code.
**One timing law, four numbers per loop**, all in **milliseconds since the capture time stamp**, never in frames:
frame period P = 1000 ÷ fps; max age A, with p95 + P ≤ A (a fresh box can be up to one frame plus inference old); budget B, with A ≤ B,
so actuation gets B − A; heartbeat timeout H = A + 2P (one dropped frame does not trip; three in a row do). A box older than A is cleared,
never reused. `loop-spec.json` is refused when any row breaks p95 + P ≤ A ≤ B. Each floor applies to the replay and
held-out splits and needs at least the R9 box floor (300) per class. `ark-sail-33` is the operator's call (decision 14). Detection is
**advisory**: it can only make a vehicle more careful than its independent minimum, never less. `person` and `swimmer` can only produce
slow, hover, hold station or stop.

**First loop-ready deliverable (decision 8 default).** Drone-2525 collision avoidance in the civic simulation · model `drone-avoid-01`, one
named version, seeded from the shipped `tree` model (`models.json:136`) · classes wire, pole, tree, bird, person (avoid only) · the pinned
air replay clip set · pass line: Gate 1 (every class's 95% lower bound at its floor, p95 within the edge-tier row) and Gate 2 (closed loop in
the arena with the obstacle layer and the emulator) · signed card and signed gate · owner: loop integrator. This is the finish line the 19
rounds converge on. Manta-2525 and MASS-AI each get the same box (`manta-dock-01`, `mass-nav-01`) against their minimal worlds.

**Your domain, your first week** (three regions start in parallel; the numbers come from `capture-spec.json` and the floors above).
| Domain | Classes to capture first | Held-out per class (from floor) | Conditions | Replay clip set owed | Blocking decision | Owner role |
|---|---|---|---|---|---|---|
| Air | wire, pole, bird, person (avoid); tree seeded from `tree` | 30; person 100 | thin wires at range, sky glare, motion blur | pinned air set | 8, 9 | labelers + one reviewer per class, loop integrator |
| Water | hull, pier, buoy, swimmer (avoid), marine animal | 20 (0.85 floor); swimmer 100 | turbidity, glare, spray | pinned water set | 9, 14 | same roles, water region |
| Ground | obstacle, step, person (avoid), vehicle | 30; person 100 | night, dust or mud | pinned ground set | 9, 14 | same roles, ground region |
Each contributor's project page shows which classes they can help with today and that class's quota in their time zone.

## Failure modes — none of them maps to "continue"
| Event | Action |
|---|---|
| Box older than the loop's max age A (e.g. 101 ms at Drone-2525) | the box is cleared; with no fresh heartbeat, slow |
| Capture stamp missing, in the future, or from another clock domain | safe action |
| Band or payload does not verify | safe action |
| Verified heartbeat with zero objects | continue as clear — this is not a failure |
| No verified heartbeat for longer than the timeout H (201 ms Drone, 851 ms Manta, 451 ms MASS-AI) | safe action; control goes to the named human ("detector lost") |
| Unknown or under-floor object in the loop's path | slow, then safe action |
| Model id, labelmap hash or any file sha256 differs from the signed card, or the model is not cleared for this loop | safe action; the loop refuses the model and runs only in simulation |
| Identity or body-part model (`checkid`, `head`, `eyes`, named-person labels — the deny list) | refused for any loop, never loaded |
| Missed object (false negative) — not detectable live | covered by the independent minimum; an avoid-only class under its floor on replay blocks loop-ready |
| Spoofing on replay (printed patch, glare flash, band from another session) | safe action, never continue |
| Leaving a safe action | only after the dwell and K clear verified heartbeats; after "detector lost" or "model refused", only on a human re-arm |
| Drift: live `unknown` rate or confidence drop above the card's held-out value by the margin in `loop-spec.json` | slow, and log a field event |

## Model selection, sim first, then a signed gate
- **HAL fit:** the card's measured capture-to-output `tierMs` p95 on a tier must satisfy p95 + P ≤ A for the loop (actuation then fits in
  B − A) — that gates selection. A tier with no measured p95 cannot be selected. `hal.ts` stays a render helper: `frameBudgetMs` and `sensorFits` still hold
  for the display; `halCnnMs` is only a fallback estimate, never a pass.
- **Two gates; loop-ready needs both.**
  - **Gate 1 — the model (open-loop).** `lib/sensor-fusion/replay.ts` (new, pure) replays a pinned clip set per domain (frames from the R2
    shared decoder, with frame hashes, replay split only) and scores per-class precision and recall and capture-to-output p95. Passing
    Gate 1 alone = **replay-ready**.
  - **Gate 2 — the controller (closed-loop).** A **detection emulator** in `replay.ts` projects world obstacles into the camera (intrinsics
    from the card), hides what `lineOfSight` (`lib/drone-2525/los.ts:36`) says is occluded, and drops, adds or delays boxes using the
    card's per-class recall, precision and p95. Recorded detections cannot react to the vehicle's moves, so they never count as closed loop.
- **Worlds.** Air: the Drone-2525 arena (`lib/drone-2525/arena-model.ts`; `world.ts` is only its cache). Today it holds doors, buildings
  and tree rows (`arena-model.ts:19`, `:26`, `:42`). Add a **ground-truth obstacle layer** as data in the domain source, the way `treeRows`
  join it: wire spans, poles, and scripted moving points for birds and person-avoid markers. Water and ground: minimal pure 2D kinematic
  worlds in `replay.ts` — water with current drift for station keeping, ground with an obstacle grid — so all three vehicles can pass Gate 2.
  Fuller worlds stay decision 14.
- **Actions to the vehicle.** `lib/2525-core/loop-actions.ts` (new, pure) turns each air action into a `FlightInput` (`flight.ts:87`):
  hover = zero input with altitude held; land = the shape of `takeoffInput` (`flight.ts:78`) in reverse; return = heading to home, then
  forward. `loop-spec.json` adds an actuator table per autopilot family (air loiter / land / return-to-launch; water hold; ground brake);
  it is simulation-only until the C5 gate passes, and no action id may be left unmapped.
- **Model safety gate:** before a live loop loads a model, a named human signs the card hash, the three file sha256s, the train.json hash
  and the replay pass. The signer is recorded by member id, in the loop-integrator role, append-only, and is never the card's signer. Loop
  models are pinned to a signed card, never to the main-branch URL the edge script reads today (`sensor_fusion_edge.py:36`). If anything is
  missing, the loop runs only in simulation. Rollback is one step back to the previous signed card.
- **The gate covers the bytes and the runtime.** Loop models load only from a pinned, hash-listed copy the card names, never from `BASE`
  (`cnn.js:8`, `sensor_fusion_edge.py:34`). `fetch()` (`sensor_fusion_edge.py:116-131`) checks each file's sha256 against the signed card
  before `os.replace` (`:128`) and refuses BASE-only provenance for loop models. The signed record also holds the sha256 of
  `sensor_fusion_edge.py` and of `loop-spec.json`; the self-update from `APP` (`:35`, `:285`) is refused while a loop is armed.
- **Where signatures live (local track, no server):** an append-only log file beside `models.json`, e.g.
  `public/sensor-fusion/loop-signatures.jsonl`. Each entry: member id, role, card hash, file sha256s, edge-script and spec hashes, replay
  hash, the train.json manifest roster (who captured and reviewed), and the previous entry's hash. Editing a past entry breaks the chain.
- **Deny list as data** in `loop-spec.json`: ids `checkid`, `head`, `eyes`, plus a rule — any label that is a personal name or a face or eye
  part. These are refused for loop use; the display-only demo is unaffected.
- **Registry status:** each `models.json` v2 entry carries an owner region and a status (draft · replay-ready · loop-ready · retired).
  Retiring never deletes a signed card; rollback reads only non-retired signed cards; a retired card's history still replays.
- **Field to capture:** every safe action, takeover, drift event and replay miss writes an append-only field event (clip reference, frame
  hashes, loop id, card hash, reason). R2 turns these into the per-domain **hard cases** capture list, picked first, and R6 reviews them first.

## Tests (when built)
In `frontend/tests/sensor-fusion-loop.test.mjs` and `frontend/tests/sensor-fusion-loop-replay.test.mjs` (both plain Node). Each joins
`test:ci` only when its revision ships.
1. Every `loop-spec.json` row holds p95 + P ≤ A ≤ B and is refused otherwise (including frame period ≥ age limit); at Drone-2525 a box
   101 ms old is cleared, never reused.
2. Each failure-mode row gives its action; no row gives "continue".
3. A model with no card, or a card whose hash does not match, is refused.
4. A model too slow for a loop's budget on a HAL tier cannot be selected for it.
5. A pinned clip gives the same loop decisions twice; an injected detection dropout makes the loop take its safe action.
6. Browser and Python edge give the same detections at the same per-class thresholds on one pinned frame set.
7. No loop action changes a Drone-2525 slot, approval or fire state (extends Part B test 7 to every loop).
8. 60 s of verified empty heartbeats never trips the safe action; one dropped frame never does; no heartbeat for H + 1 ms does
   (201 ms Drone, 851 ms Manta, 451 ms MASS-AI).
9. Every safe-action cell in the table belongs to that vehicle's action set in `loop-spec.json`; `person`/`swimmer` never widen past slow, hover, hold or stop.
10. One changed byte in `edgetpu.tflite` is refused; an unknown contract major version gives the safe action; `checkid` is refused.
11. A takeover input overrides any loop action within one tick; the same member cannot sign both the card and the gate.
12. Golden vectors give the same action in Node and Python.
13. A v1.1 record with extra optional fields gives the same action as v1.0 in Node and Python; a record with no capture ms, a future stamp
    or a skewed clock domain gives the safe action; an out-of-range class id becomes `unknown`.
14. Alternating good and bad frames never return the loop to "continue"; a 10 fps flicker never alternates faster than the dwell; after
    a takeover or "detector lost" the loop stays off until a human re-arm.
15. A stick deflection past the dead-band on tick t means the loop output on tick t is ignored (pure core of `use-controls.ts`).
16. With recall 1, the emulator's boxes match the projected arena obstacles within 1 unit; every class in `drone-avoid-01` has at least one
    arena object.
17. Each air action, stepped through `stepFlight`, reaches its end state inside the budget; no action id lacks an actuator mapping.
18. A model file with the right name but a different sha256 is never installed for a loop; one changed byte of the edge script drops the
    loop into simulation; editing a past entry of the signature log breaks its hash chain; `head` and `eyes` are refused.
19. One injected takeover in replay adds one hard-case capture task carrying its clip hash; an off-domain clip set trips the drift row.
20. A retired card cannot be selected, and its history still replays.
