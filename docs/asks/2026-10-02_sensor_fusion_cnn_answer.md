# Sensor Fusion — how the CNN runs on every device (the answer)

> **Final, 2026-10-03 09:15 UTC.** Tonight's runs plus all 48 reviewers (record: `docs/assessments/2026-10-03_sensor_fusion_fleet48.md`).
> Eleven lenses graded the shipped state D, one C−: the direction is right; the shipped browser CNN draws nothing yet.

Claude Code, 2026-10-03, for Grok and the operator. Feedback only. No Sensor Fusion code, model folder or label file
was changed. Every claim below was run tonight unless it says UNVERIFIED. The scripts, outputs and pictures are in
`docs/assessments/2026-10-03_sensor_fusion_edge_probes/` (the record is `FINDINGS.md`). The 48-reviewer record is
`docs/assessments/2026-10-03_sensor_fusion_fleet48.md`.

Machine used: one Intel Xeon 2.10 GHz, 4 cores, no GPU, Chromium 141 only. No phone, no Raspberry Pi, no Safari
engine, no Firefox, no Coral. Phone numbers are this CPU slowed down on purpose. They are estimates, not phones.

The speed bar is the operator's: 4 to 6 FPS on a CPU is enough (`docs/asks/2026-10-02_sensor_fusion_fps_bar.md`).

## The answer in six lines

1. **A web browser can run `detect.tflite` today.** Same file, same folder, no conversion. 39–44 ms a frame here
   (about 20 FPS). Same boxes as Python on the same bytes: median score difference 0.
2. **The app's browser file does not run yet.** At `main` (35bc2a1) every model stops with
   `resized.round is not a function`. One small change fixes it (`grok/cnn_remaining_fix.diff`). With it, Head finds
   a head and the page draws boxes on the live camera.
3. **One Python program is the backbone.** On a Pi, PC, Mac or cloud box it runs the same file and answers with the
   same envelope as the browser. With the 2023 runtime it installs today: 137–181 ms a frame, Linux only. With its
   successor, LiteRT (`ai-edge-litert`): 17.6 ms on one thread, 5.4 ms on four, on Windows, Mac and Linux, same
   answers at 50% and up.
4. **The page picks the path itself.** It times both on the device in your hand. With the old runtime on the node:
   browser at 1× and 2× CPU, node at 6× and 8×. With LiteRT on the node: node at every speed (30–60 ms round trip,
   same machine, no real network — a Pi and Wi-Fi will be slower).
5. **Where the camera is decides the rules.** Camera on the phone: the page must be HTTPS (the live site is). Camera
   on the Pi: the phone is only a screen and needs no certificate and no internet.
6. **The phone and the Pi talk without a server.** An HTTPS page cannot call `http://pi.local` (blocked). WebRTC can:
   160 ms round trip for a 37 KB frame, frames under 64 KB.

## 1. Default path, and when the other path is the fallback

**Default: the CNN runs where the camera is.** On a phone or PC that is the browser. The page loads one runtime
(tfjs-tflite 0.0.1-alpha.10, WebAssembly). It reads `detect.tflite` and `labelmap.txt` from the model folder
unchanged. No frame leaves the device. It works offline once the files are on the device. On a Pi with a camera,
the CNN runs in the Python program on the Pi.

**Fallback: the CNN runs on an edge node.** The node is the same Python program on a Pi, PC, Mac or cloud box. The
page sends one JPEG (37–57 KB at 640×360). The node answers with one envelope (333–621 bytes). Use it when the
device is too slow, when its browser cannot start the runtime, or when the frame needs Coral (`edgetpu.tflite`
runs only on a machine with the chip; a browser can never run it).

**How the page chooses.** Measure; never guess from the phone's name.

- After the model loads, time a few frames on each path, end to end, and take the median.
- Keep the browser unless the node is clearly faster (10–25% margin). A tie stays on the device.
- If the node does not answer, use the browser. If the browser runtime fails, use the node. If both fail, show the
  camera, draw no box, and say so in one sentence.
- Save the choice on the device. Change it only after three readings in a row say so. Near the crossover one
  reading flaps (at 5× CPU a reviewer saw 4 node and 1 browser in 5 runs).

| CPU slowed | browser ms | node ms | picked | FPS that results |
|---|---|---|---|---|
| 1× | 42–48 | 152–171 | browser | about 20 |
| 2× | 104–121 | 163–168 | browser | about 8–9 |
| 4× | 195–219 | 167–190 | either (inside the margin) | about 5 |
| 6× | 276–315 | 184–196 | node | about 4.4–5.4 |
| 8× | 406 | 217 | node | about 4.1 |

The chooser keeps a slow device inside the 4–6 FPS bar. Without it, a 6× device would run the browser at about 3 FPS.

With LiteRT on the node instead of the 2023 runtime, the node's round trip fell to 30–60 ms at every CPU speed, and
the chooser picked the node every time. That run shares one machine and no real network; a Pi is slower and Wi-Fi
adds time, so measure on the real pair. The rule does not change: measure, then pick.

**A browser without WebAssembly SIMD** (older phones) still runs: the runtime picks its plain build by itself. It is
3.8× to 6× slower (269 ms against 70 ms here). The chooser will send that device to the node. No special case.

## 2. One Python program on Windows, Raspberry Pi, Ubuntu, Mac and later machines

The program stays `frontend/public/sensor-fusion/edge/sensor_fusion_edge.py`. The folder stays
`Home/SensorFusion/<Folder>/Sample_TFLite_model/` with the three files. Nothing is renamed.

What already works: it finds the machine (`platform_name()`), the home folder, the CPU file or the Coral file, and
it reads the label file in order. `tflite-runtime` needs `numpy<2`; with it, Demo.90 and Head run here.

What stops it on a real machine today (run tonight):

- **The runtime it installs does not exist for most machines.** `tflite-runtime` 2.14 (October 2023, the last
  release) has wheels only for Linux, Python 3.8–3.11, numpy below 2. No Windows. No Mac. No Ubuntu 24.04 (Python
  3.12). No newest Pi OS (Python 3.13). Its successor, `ai-edge-litert` 2.2 (August 2026), has wheels for Windows,
  Mac (Apple chips), Linux x86 and ARM, Python 3.10–3.14, numpy 2, and the same `Interpreter` and `load_delegate`
  calls. On identical bytes every detection at 50% and up matched, and it ran about 10× faster on the same file
  (`litert/`). Import it first; keep `tflite-runtime` and TensorFlow as the next two tries. Coral under LiteRT is
  UNVERIFIED.
- **It cannot start without internet,** even when all three files are already in the folder. `fetch()` runs on every
  start and has no fallback. Exit 1, a `URLError` traceback, before the camera opens (`grok/offline_start.sh`). A Pi
  in the water, a closed range, or a phone in airplane mode cannot run it.
- **A dropped download breaks a good model.** `urlretrieve` writes straight onto `detect.tflite`. A link that dropped
  after 1 MB left 1,000,000 of 4,183,312 bytes, and the model would not open (`grok/short_download.py`).
- **The folder it fetches is not the folder that moves.** It downloads two of the three files (the label file and the
  one `.tflite` in use). The operator's rule is that the whole `ModelNN.Name` folder moves between machines
  (addendum 1). A folder fetched on a no-Coral machine has no `edgetpu.tflite`.
- **It replaces itself from GitHub `main` on every start,** with no pin and no hash. One bad push reaches every field
  machine at once, with nothing on the record saying which program produced a result.
- **The model list is typed three times** (`sensor_fusion_edge.py:35-47`, `cnn.js:9-21`, `sf.ts:23-35`). A new folder
  on disk does not appear, and the menu offers entries whether or not their folder exists. The folder can be the list.
- `read_hits` reads every score slot instead of the model's own count output. Harmless today; easy to make exact.

To serve more than one phone, the same program can also answer `POST /infer` with one envelope (the reference is
`edge/edge_node.py`). One rule found tonight: **one interpreter is not thread-safe.** Eight phones at once answered
3 of 40 frames until one lock per model was added; then 40 of 40 (`edge/concurrent.py`).

## 3. What an iPhone can do, and what an Android phone can do

**Android (Chrome).** The browser path is the same Chromium engine measured here. The camera opens on an HTTPS
page. The back camera needs `facingMode: "environment"`; the app asks for `video: true` today, so a phone opens its
front camera (`sensor-fusion.tsx:299-308`). Python can also run in Termux, and the program already knows Android.

**iPhone (Safari; every iOS browser is Safari's engine).** The browser path should run: Safari has WebAssembly, and
SIMD since 16.4. **UNVERIFIED** — no Safari engine here. One public report shows tfjs-tflite failing on iOS 15 Safari
(tensorflow/tfjs#5846, closed without a fix). The device check page tests it in one tap:
https://claude.ai/artifact/1DQS4jfGH2Nd1pRLZtgPxi . Python on an iPhone is not practical. An iPhone is a camera and
a screen; if it is too slow, the chooser hands the CNN to a node over WebRTC.

**Both.** The camera needs a secure context (HTTPS). Proven: an http page from a LAN address has no camera API, no
WebGPU and no `crypto.subtle`.

## 4. How a student labels a picture, and how that set becomes the next model folder

1. The student opens the page, turns SENSOR 1 on, and presses Capture.
2. The student draws a box and types a name. This is LABEL. It is amber: one person's word.
3. A second person confirms it. Now two people agree. Only confirmed pictures are kept. (A reviewer ran it: a write
   before the confirm is refused; after it, exactly one row with who labeled, who confirmed and when.)
4. The kept pictures and their boxes are exported as Pascal VOC files (what the upstream `labelImg` setup uses).
5. A trainer on a PC or cloud box makes `detect.tflite` and `labelmap.txt` (and `edgetpu.tflite` with the Edge TPU
   compiler on Linux). The training step is not designed yet.
6. The three files go into one new folder of the same shape: `PreLoadedModels/Custom.0N/Sample_TFLite_model/`. That
   folder is the next model. Anyone can copy it to any machine.

Today the page's Annotate box says "N pictures in Home/SensorFusion/…" but the pictures live only in page memory,
and the Python labeler saves none. The panel should never say more than happened.

A label can carry its own signature with Light Codex — **only on a lossless picture** (PNG). Through JPEG, 9 of 16
captions could not be read and 3 came back wrong while marked verified (correction below). Keep the caption as a
small lossless strip beside the JPEG, or in the envelope.

## 5. A manta model, with the camera on a Pi and the screen on a phone

- **Same folder shape.** For example `PreLoadedModels/Model05.Manta/Sample_TFLite_model/` with the three files
  (an example name; nothing was created).
- **The Pi runs the CNN.** The camera is on the Pi, so the frame never travels. The Pi sends envelopes (a few hundred
  bytes) and, now and then, one picture.
- **The phone is only a screen.** Proven tonight: the node's own page over plain http, from its LAN address, with no
  certificate and no internet, ran the browser CNN (5 boxes, 63 ms) and reached the node's CNN (4 boxes, 141 ms). The
  envelope hashes matched the HTTPS run exactly. Only the camera needs HTTPS, and here the camera is on the Pi.
- **One fix that needs:** `crypto.subtle` does not exist on an http page. Anything that hashes or signs in the
  browser needs a plain-JavaScript fallback. The reference page now has one, checked equal on four inputs.
- **No internet on the boat** is fine if the Python program can start offline (section 2, the first fix).
- **A second sensor** (sonar or thermal beside the camera) uses the two-sensor pattern in section 11.

## 6. What not to build yet

- No second model format. No ONNX, no TF.js graph. The `.tflite` file runs in the browser as it is.
- No MediaPipe path. It refuses these files (they have no TFLite metadata), and adding metadata changes the files.
- No threaded WebAssembly. It hung here. The single-thread build is fast enough.
- No LiteRT.js CPU path. It crashes on the SSD post-process today. Its WebGPU path works but was slow on a software
  GPU; test it again on a real GPU later.
- No CNN in Pyodide. Pyodide has no TFLite. Python in the browser can share logic, not the CNN.
- No cloud video storage. Do not keep a picture unless a person is labeling it.
- Send an envelope when the answer changes, not every frame (a reviewer's 16-per-second log reached 5 MB in 10 minutes).
- Pose and thermal stay not designed.

## 7. The first change, named, not made

**File:** `frontend/public/sensor-fusion/cnn.js`.
**Behavior:** the browser path runs on every model. Use the functional tensor calls inside `tf.tidy`
(`grok/cnn_remaining_fix.diff`). Then: read the model's count output; and when the runner cannot start, the page
says one plain sentence ("The detector could not start on this device.") and puts the detail in the console.

Why this one first: it is the only thing between the live page and a working browser CNN. Proven: with it, Head
returns `head 75`, Demo.90 returns 5 boxes, 300 frames leak nothing, and the built page draws boxes on a live camera
(`grok/page_two_fixes.png`). Without it the page shows `resized.round is not a function` under a picture with no
boxes (`grok/page_at_35bc2a1.png`).

The next changes, in order: (2) the Python program imports LiteRT first (`from ai_edge_litert.interpreter import
Interpreter, load_delegate`), so one `pip install ai-edge-litert` works on Windows, Mac, Linux and the Pi, with the
same files; (3) it starts offline and downloads to a temporary name, then renames; (4) the folder is the model list,
read once, in all three places; (5) the phone asks for the back camera; (6) the
downloaded `SensorFusion-2525.html` loads its runtime when opened from the phone's Files (today it cannot: its
script tag is site-absolute, `file:///sensor-fusion/cnn.js` is not found).

## 8. Tests for Grok

Each test has a pass line. Each was run tonight; the script is named. "Today" is what `main` does now.

| # | Test | Pass | Today | Script |
|---|---|---|---|---|
| T1 | `cnn.js` runs Head on a known photo, headless | ≥1 `head` box ≥ 50% | fails: `resized.round` | `grok/cnn_run.mjs` |
| T2 | The built page, fake camera, SENSOR 1 on | boxes drawn; no raw error text | raw error, no box | `grok/cnn_page.mjs` |
| T3 | 300 detections | 0 tensors left | 0 with the diff; 3/frame without tidy | `grok/cnn_leak_simd.mjs` |
| T4 | Same bytes, browser vs Python | median score diff 0, max ≤ 0.1 | pass (0, 0.016 Demo90) | `bench/run-bench.mjs` |
| T5 | 4–6 FPS bar at 4× CPU | browser or node ≥ 4 FPS | pass (≈5) | `edge/drive.mjs`, `edge/choose.mjs` |
| T6 | Chooser | browser at 1×, node at 6× | pass | `edge/choose.mjs` |
| T7 | No WebAssembly SIMD | still finds the head | pass, 3.8× slower | `grok/cnn_leak_simd.mjs` (NOSIMD=1) |
| T8 | Eight phones at once on one node | 40/40, unique seq | 3/40 before the lock | `edge/concurrent.py` |
| T9 | Python program offline, files present | opens the model | exit 1, URLError | `grok/offline_start.sh` |
| T10 | Download drops at 1 MB | old model still opens | model destroyed | `grok/short_download.py` |
| T11 | Phone as screen, plain http, LAN | CNN runs, hashes equal HTTPS | pass | `edge/screenmode.mjs` |
| T12 | HTTPS page calls an http node | refused; WebRTC used instead | refused (correct) | `edge/mixed.mjs`, `edge/rtc.mjs` |
| T13 | WebRTC frame size | ≤ 64 KB arrives; 169 KB closes the channel | as stated | `edge/rtc.mjs` |
| T14 | Light Codex caption, PNG vs JPEG | PNG 16/16; JPEG read = unverified | PNG 16/16; JPEG 4 right, 3 wrong-verified | `codex/stamp_many.mjs` |
| T16 | Two sensors, one object | combined score; forged or other-room envelope refused | pass | `bench/fusion2_demo.py` |
| T17 | Folder is the list | a new folder appears; no entry without a folder | fails (typed lists) | reviewer Athena-A, T06e |
| T18 | Back camera on a phone | getUserMedia asks `facingMode: environment` | asks `video: true` | reviewer Athena-A, T07 |
| T19 | Downloaded HTML from Files | CNN loads from `file://` | not found | reviewer Asar-A / Athena-A |
| T20 | Envelope hash, Python vs browser | equal on the same layers | differs when a value is 0.0 or 1.0, or a tie rounds | reviewer Aset-A / Athena-A |
| T21 | `pip install` the runtime on Windows, Mac, Ubuntu 24.04, Pi OS (Python 3.13) | installs | `tflite-runtime` has no wheel there; `ai-edge-litert` does | PyPI file lists |
| T22 | LiteRT vs `tflite-runtime`, same bytes | same detections ≥ 50% | pass (4 models); 10× faster | `litert/dump.py` |

The last row matters for replay. Python writes `1.0` and rounds half-to-even; JavaScript writes `1` and rounds
half-up. Hash integers instead: score × 1000 and box × 10000 as whole numbers.

## 9. What this answer does not cover

The ask also names Drone-2525 turret targeting and two-person drone operations. Three of the twelve coordinators
declined that part, and Claude Code agrees. Wiring person detection and the identification of particular people into
turret targeting and fire authorization is weapons-targeting work. This answer does not engineer it: no data flow, no
wire format, no hardening and no tests for that integration. One principle stays on the record because it is already
repo law: a machine may never approve its own mark.

Everything else stands: the CNN in the browser and on every device, the Pi app on PC, Mac and phones, the student's
labels, the manta camera, and the two-sensor method.

## 10. Colorful commentary — what eXeL AI has already taught us

- **A green test is not a working page.** A Drone-2525 revision once passed its gates while its camera and its picture
  were 180° apart. Tonight `cnn.js` loaded, raised no page error, and drew nothing. Test the person's
  screen — boxes drawn, words read — not the function.
- **Fix the class, never the instance.** Three dead ends in the signing flow were one bug (AAR 2026-09-09). Tonight:
  one shared interpreter behind a threaded server. The class is "any shared engine behind more than one caller". It
  will come back for Coral, for a GPU delegate, for a second camera.
- **The person never meets the machine.** A signer once read "migration 036 is applied, 038 is not". Tonight a student
  would read `Cannot read properties of undefined (reading '_malloc')`. One plain sentence; the detail goes to the
  console.
- **Unreachable is not a pass.** Phones, Pi, Safari: UNVERIFIED until one runs it. The device check is the one tap.
- **One master, many carriers.** The model list typed three times is the Executive Summary drift again. The folder is
  the master.
- **Never outpace the deploy.** Grok fixed the WASM path while this review ran; my record said otherwise for a few
  minutes. The record now says both, in order.
- **The reviewers caught the reviewer.** My first note said Light Codex captions survive JPEG. One caption made it look
  true. Forty captions said no. Measure the class.

## 11. The patent's method, running

US20220164611A1 (De-Risking Strategies, LLC). Published application, listed abandoned 25 Nov 2024; not an issued
patent. Apple's US20240107160A1 cites it. Its method: layered models and two or more sensors. Both ran tonight.

- **Layered models.** Layer 1 (Demo.90) finds a person; layer 2 (Head) runs on that box. The envelope verb becomes
  IDENTIFY. One pure-Python `fusion.py` ran unchanged in CPython and in the browser (Pyodide) and gave the same
  identification: head from layer 2, combined 0.72 vs 0.706. A hash of the decision (verb, layer, label, box on a
  0.1 grid, score band) matched in both: `117e81bef7592a62`.
- **Two sensors.** Camera A sees the whole scene; camera B sees the right 70%. Boxes are mapped into one frame and
  matched by label and overlap. Seen by both: combined 0.91, 0.852, 0.802. Seen by one: stays 0.5. The envelope is
  signed with a room key. A forged score fails. Another room's key fails. Authority stays MARK.

This is not legal advice.

## 12. Sensor fusion in the year 2525 — a brainstorm

- **The CNN runs where the light lands. Only meaning travels.** A frame is 37 KB. An envelope is 400 bytes. In 2525
  no picture leaves the lens unless a person asks for it.
- **The folder is a seed.** One shape — three files — carried from a classroom in Austin to a camera in the Gulf. A
  student's two-person labels become a manta's eyes.
- **Sensors agree before they speak.** Eyes, heat, sound, sonar, magnetics, chemistry: the patent names the camera, stereo, event,
  thermal, ultraviolet, lidar, time of flight and microphones. Each adds a layer; each keeps its own score. Disagreement is
  kept, not averaged away.
- **Every result is signed and every decision replays.** The record is the court: who saw, who labeled, who confirmed, one
  hash on every device.
- **The machine proposes; a person decides — always.** In the classroom, on the boat, everywhere.
- **Like a brain.** Coarse to fine (person, then head, then eyes). Attention follows the box. Many senses bind into one
  object. The visual cortex did this first; the layered method writes it down.
- **Any device is a node.** A phone, a Pi, a laptop, a satellite. The page measures and the work goes where it runs
  best. No device is too small to see; none is too big to be asked.

## 13. Review notes on the current code (feedback, not edits)

- `cnn.js` at 35bc2a1: the chained tensor calls (fix in section 7); reads every score slot instead of the count; the
  FPS number is CNN time, not frames delivered.
- `sensor-fusion.tsx`: the raw error reaches the screen; the back camera is not requested; at 390 px "SENSOR 1: ON"
  wraps over the settings icon and the yellow status line prints over the box label; the Annotate count claims files
  that are not saved; every skipped sign-in is the same actor `GUEST`, so two guests read as two-step, not two-person.
- `sensor_fusion_edge.py`: offline start, atomic download, all three files, pinned self-update, count output (section 2).
- `download/SensorFusion-2525.html`: cannot load its runtime from `file://`. A reviewer built one 6.67 MB HTML with the
  runtime inside (under the 7.77 MB file law) that runs from `file://` with zero network, the model folder picked from
  disk. A model cannot fit inside the same file (runtime + one model as base64 ≈ 12 MB).

## Corrections on the record

- **Light Codex through JPEG.** My earlier note said captions survive JPEG at quality ≥ 85. Withdrawn. 16 captions:
  PNG 16/16; JPEG 4 right, 3 wrong yet marked verified, 9 unread. When only one strand survives, the decoder sets
  verified to true with nothing to check (`lib/light-codex.ts:242-245`).
- **`cnn.js`.** My record said the WASM path was wrong. Grok had fixed it (35bc2a1) minutes earlier. The one fault
  left is the tensor calls.
- **Envelope rate.** The probe's "16.5 envelopes/s" was a floor: the log kept only 200 entries. A counter gives about
  20/s.

## Update — proven on a phone (2026-10-03, 04:46 CST)

- Grok applied the first change as `d76ec50` ("Run the browser model with the tensor calls that runtime supports"),
  the same lines as `grok/cnn_remaining_fix.diff`.
- The operator's iPhone, on LTE, on the live page: SENSOR 1 on, model Head, the page reads "Running detect.tflite"
  and draws a green box with `head 100%` on the live front camera. Capture:
  `docs/assessments/2026-10-03_sensor_fusion_edge_probes/grok/iphone_head_live_d76ec50.png`.
- So the browser path now runs on Safari's engine on a real phone. The iPhone line in section 3 moves from
  UNVERIFIED to proven for Head. Android, a Pi, and the frame rate on the phone are still to be measured.
- Still open from section 7: the Python program's offline start and safe download, the folder as the model list,
  the back camera, and the downloaded HTML opened from the phone's Files.
- Seen in the capture: the yellow status line still prints over the box label (section 13).

## Update — going offline (2026-10-03)

- **Python program: mostly done by Grok (d76ec50).** With no internet and the files already on the machine, it keeps
  them, opens the model and goes to the camera. One gap: when the network hangs instead of refusing (Wi-Fi up, no
  internet behind it), the model download has no timeout and the program waits forever. Give every download a
  timeout (for example 10 s), or skip the refresh when the three files are present.
- **The page: not offline today.** Once loaded, a reload with no network fails outright; nothing is kept on the phone.
- **Proven fix (scratch, not applied):** serve the runtime and the model folders from the site itself (five URLs in
  `cnn.js`) and add one small service worker that keeps the page, the runtime and the chosen model folders on the
  device. After one online visit, the browser was closed and reopened with no network: the page, the camera and the
  detector all ran and drew boxes. Files: `docs/assessments/2026-10-03_sensor_fusion_edge_probes/offline/`.
- **On a phone:** open the page once online, then Share → Add to Home Screen, so the phone keeps the files.
  UNVERIFIED on a real phone until the operator tries it in airplane mode.
- **Camera on a Pi, no internet at all:** already proven — the phone opens the Pi's own page over the local Wi-Fi.
