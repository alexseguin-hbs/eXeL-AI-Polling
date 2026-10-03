# Sensor Fusion — the 48-reviewer fleet record (2026-10-03)

Read-only fleet on the R-CORE EDGE-2525 ask (`docs/asks/2026-10-03_sensor_fusion_rcore_edge_browser.md`): 12 lenses × (builder · breaker · synthesis) + 12 Master-of-Thought coordinators = 48. Workflow run wf_aa38832e-bc3. The full machine record (all 48 returns) stayed in the session; this file keeps the parts the answer uses.

**What is withheld, and why.** Three coordinators (4, 9, 10) declined their sections: they read the integration of person detection and individual identification into Drone-2525 turret mark/approve/fire as weapons-targeting work. Claude Code agrees and does not publish that engineering. Coordinator 5 (the turret and two-person flow) is withheld for the same reason. Paragraphs elsewhere that engineer that integration are dropped and counted below. Everything about running the CNN in the browser and on every device, the Pi app, EdTech labeling and manta is kept.

## The twelve lenses — grade and verdict

| Lens | Grade | Eleven-word verdict |
|---|---|---|
| Aset | D | Today no mark enters unchanged; write the deck row, integers only. |
| Asar | D | Browser default, LiteRT node fallback, measured choice; shipped code draws nothing. |
| Athena | D | Grok's browser CNN still fails; twenty-three tests define what fixed means. |
| Christo | D | Fire law fits Sensor Fusion; the wire, record and names fail. |
| Enki | D | Browser CNN fails every frame; offline, http, stalls and Pi break. |
| Enlil | D | Grade D. Browser CNN broken; no serving node; recipe tested here. |
| Krishna | D | Sensor Fusion sees alone; no envelope reaches crew link, ledger, relay. |
| Odin | D | Right format, wrong fetch: pin the frozen runtime; LiteRT stays canary. |
| Pangu | D+ | Folder shape matches the patent; envelope, layers, second sensor, authority unbuilt. |
| Sofia | D | Right direction, dead CNN at HEAD; browser worker first, humans approve. |
| Thoth | C- | Browser equals LiteRT bit-for-bit; ship envelopes, measure sustained new frames honestly. |
| Thor | D | Marks stay marks, but unsigned code, envelopes and approvals break trust. |

### Aset — theme reinforcement and consistency

_(report concerns the withheld integration)_

Tests for Grok:
- SETUP. Set S=$SCRATCH. Run every Node test from /home/user/eXeL-AI-Polling/frontend. Use Python $S/sfvenv1/bin/python (tflite-runtime 2.14 needs numpy<2).
- T1 MARK CONFORMS. Run `node $S/fleet2/Aset-A/sf_mark_check.mjs <your_mark.json>`. It must exit 0. Today example_mark.json exits 0, and the probe's env_detect.json exits 1 with 8 FAILs (W8, W10, R0 and others). Note that the checker's R0 wants the row in both event and payload.event, but the deck needs only one (r.153:1419). Put it in payload.event, as the deck's own DESIG does.
- T2 ONE NUMBER IN BOTH LANGUAGES. Run `$S/sfvenv1/bin/python $S/fleet2/Aset-S/pm_parity.py $S/fleet2/Aset-A/py_cases.json $S/fleet2/Aset-S/pm_py.json && node $S/fleet2/Aset-S/pm_parity.mjs $S/fleet2/Aset-A/py_cases.json $S/fleet2/Aset-S/pm_py.json`. It must print 'frames 169 same 169 diff 0' and exit 0. Then put the same pm(v)=clamp(floor(v*1000+0.5),0,1000) in sensor_fusion_edge.py and in cnn.js. Fed the same raw floats, both must give byte-identical lines. Today the probe's round() gives a different hash on 9 of 169 frames.
- T3 CROSS-LANGUAGE HASH REGRESSION. Run `node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs $S/fleet2/Aset-B/js_side_selfpatched.test.mjs`. Today it shows 10 PASS and 11 FAIL, and each FAIL is a probe defect. The goal is H1-H3, E1-E3 and L2-L3 passing once your envelope replaces the probe's. The Aset-A copy crashes with 'self is not defined'; use the Aset-B copy.
- T4 TWO PATHS, ONE SHAPE. Send the same still photo through CNN-in-browser and through CNN-on-edge. The sorted key sets of the two readings must be equal (today the edge path adds codex). seat must never be 'browser'. seq must count per node, not as one global counter (today two pages got 3, 4, 5). POST /infer?peer=sSEATSF must NOT change the node name (today edge_node.py:121 echoes it).
- T5 THE FOLDER IS THE NAME. For every Home/SensorFusion/*/Sample_TFLite_model, the reading's model must equal the folder name on disk, such as 'Model02.Head' or 'Demo90'. It must never be 'head' or 'Head'. Copy a folder of the same shape under a new name: it must appear in the list with no code edit. Today the list is typed three times (sensor_fusion_edge.py:35-47, cnn.js:9-21, sf.ts).
- T6 COUNT OUTPUT RESPECTED. No reading may hold more boxes than the model's count output. Today cnn.js:96 uses scores.length, so slots past the count can leak leftover values (lead fact E11).
- T8 ONCE PER TARGET. Use the fake camera $S/edge/cam.y4m to drive 10 s of readings at 16 a second on one still target. Exactly 1 DESIG must be sent, not about 160. Re-run `node $S/fleet2/Aset-A/deck-flood.mjs` to see the cost of marking every frame: 9,600 rows make replayHash take 38.5-42.8 ms per call, with a 5,054,278-byte snapshot.
- T9 NO FLOAT, NO TIMING IN THE ROW. Walk row.data.sf recursively. Every value must be an integer, the folder name, or a band word (EO, IR, ACOUSTIC, MAG, CHEM; r.153:4362). The keys ms, fps, frame, at, ran and file must be absent.
- T10 READINGS STAY OFF THE ROOM WIRE. Open the deck r.153 headless and listen on BroadcastChannel 'exel-2525-com'. No message with verb DETECT or IDENTIFY may appear. Today the probe on that channel got back an ACK for 'undefined:DETECT:' with the empty-ledger hash 811c9dc5 (fleet2/Aset-B/deck-breaker.out.json D1).
- T12 NO SECOND HASH. Sensor Fusion must not hash a mark: `grep -nE "sha256|sha16|fnv|replayHash"` over the Sensor Fusion mark path must find nothing. The room's replayHash (r.153:2100-2112) is the only hash, and the host writes sessionSeq/orderKey at commit, so no edge node can know it in advance.
- T13 UNKNOWN TARGET LEAVES A ROW. Send a DESIG for id SF-CONTACT-1 into the deck. Expect a REJECT row with PEER_MARK_UNKNOWN and desig null (r.153:2251; breaker D4). Do not invent room target ids until the lead defines how a box becomes a target.
_(1 test(s) on the withheld integration not reproduced.)_

### Asar — synthesis and outcome validation

Grade D on outcome. Today no device draws a box. The shipped cnn.js stops on 'resized.round is not a function' (cnn.js:84-85, re-run at HEAD). Fixed in memory, it leaks three tensors a frame, 100 MB after 30. The downloaded page fails silently from storage. The Python program dies offline. Its fast runtime installs only on Linux. The direction is right: tfjs-tflite loads the folder's detect.tflite unchanged, 42-47 ms in Chromium. Decision: browser by default, because it always exists. Python node on LiteRT (21 ms, my run) when faster, or when the phone is under four per second. Measure at start. Drop fast, climb slowly. iPhone, Pi and WebKit stay unproven here.

Tests for Grok:
- T1 Loader and memory: SFCnn.load('demo90'), then detect() on zidane.jpg 31 times. Every call returns boxes with no error. tf.memory().numTensors after call 31 equals the count after call 1. Tonight a fix with no tidy went from 3 to 93 tensors (100 MB).
- T2 Count: read the model's count output. No box index at or past count, in cnn.js and in the Python read_hits.
- T3 Back camera: when the back camera is picked, getUserMedia gets facingMode {ideal:'environment'}, on the page and in the downloaded HTML.
- T4 Offline start: put the folder on disk, cut the network, and run 'python3 sensor_fusion_edge.py --check'. It uses a local test image, prints a detection and exits 0. Today it exits 1.
- T6 Downloaded HTML opened from storage: either SFCnn is present, or the screen says no CNN is running on this device. Silence fails.
- T7 The folder is the registry: drop in a new folder ModelNN.Name with the three files. It appears on the page and in the Python program with no code edit and no list edited.
- T8 Python runtime order: the program imports ai_edge_litert first, then tflite_runtime, then tensorflow. On Python 3.12 or later, and on Windows or an Apple-silicon Mac, --check passes. If Coral is asked for and no Coral runtime can load, it says so and runs on the CPU. It does not crash.
- T9 Chooser bar: if the local path is under 4 envelopes/s and the node is at or above 4, the node is chosen, whatever the band.
- T10 Chooser and test agree: at 1x, 2x, 4x, 6x and 8x CPU, the chosen path's throughput is at least 0.9 times the best path's. The rule's band and this test's band are the same number (10%).
- T11 Drop fast, climb slowly: a node that does not answer within 800 ms is dropped on the first reading. Switching back needs 3 good readings in a row. The choice survives a reload.
- T12 Fallbacks: no node gives 'browser'. A blocked runtime gives 'edge'. Both blocked gives 'none', the camera stays live, one honest line shows, and zero boxes are drawn.
- T13 Same decision on both paths: one still through both paths gives the same verb and labels, layer-1 overlap of at least 0.9, a score difference of at most 0.02, and an equal decision hash (boxes snapped to a grid, scores in bands). Raw-score hashes are not required to match.
- T14 Worker: the browser CNN runs in a Web Worker. At 4x CPU, a tap during detection gets its handler within 50 ms (p95). Tonight the main thread took 450 ms.
- T15 Secure context: in phone-camera mode on an HTTPS page, the page never POSTs to an http:// node. It uses an https node or a WebRTC data channel, and every frame it sends is under 64 KB. In phone-as-screen mode on plain http, the envelope hash is computed without crypto.subtle.
- T16 Two seats, one node: two clients send 40 POST /infer requests at once and get 40 of 40 valid envelopes (one lock per model). A request with ../ in the model name is refused.
- T18 Pinned update: pull_program checks a sha256 before os.execv. On a mismatch it keeps running the current program and says so.
_(2 test(s) on the withheld integration not reproduced.)_

### Athena — strategic test planning

Grade D. Grok's Sensor Fusion code at 35bc2a1 still cannot run a model in the browser: the next fault is 'resized.round is not a function'. Worse, the shipped loop retries every 40 ms and leaks: I re-ran it, 50 failed frames, 100 tensors, 578.8 MB. The code has no envelope, no authority field, no offline start, no back lens, and three typed model lists. The lead's probes prove the way: the browser runs the folder file unchanged, matches Python on identical bytes, and one 6.67 MB file plus the folder runs from file://. Twenty-three ordered tests below. Cheapest first. Each gates a class. Real phones, Safari and a Pi remain unproven.

Tests for Grok:
- 1 T00 SOURCE GATES. Proves: tonight's classes cannot return. Run: node $S/t00_source_gates.mjs (S=$SCRATCH/fleet2/Athena-A/suite). Add gates: all tensor work inside one tf.tidy; no request to /dist/; one named resize; one threshold rule; integer hash projection; door id is a track id; codex style pinned to Double Helix. Pass: every gate PASS. Tonight: FAIL 12 of 13 (only G2 passes).
- 2 T01 FOLDER MODEL LOADS UNCHANGED. Proves: Grok's own cnn.js runs each folder's detect.tflite with no edits to the folder. Run: node $S/t01_cnnjs.mjs online <id> /sensor-fusion/cnn.js 8633 for all 11 folders (demo90 deer head eyes tree custom01-04 checkid thermal01). Pass: steps include 'detected', no error, and ZERO 404 in the request log. Tonight: FAIL 'resized.round is not a function' (cnn.js:84-85) and one 404 to /dist/tflite_web_api_cc_simd.js.
- 3 T01c MEMORY HOLDS, ON SUCCESS AND ON FAILURE. Proves: a phone tab survives SENSOR ON. Run A (failure): H=harness_errloop.html node $B/t/t01_cnnjs.mjs online demo90 /sensor-fusion/cnn.js 8661 (B=.../fleet2/Athena-B). Run B (success): H=harness60.html node $S/t01_cnnjs.mjs online demo90 <fixed cnn.js> 8633. Pass: tf.memory() numTensors and numBytes flat over 50 failed frames and over 60 good frames; one plain sentence on screen; the loop backs off after a failure. Tonight: FAIL, 100 tensors and 578.8 MB over 50 failed frames (I re-ran it). Fix: one tf.tidy around all tensor work (Athena-B/t/cnn.tidy.js leaks 0).
- 4 T02 PARITY ON IDENTICAL BYTES. Proves: the browser runtime and Python tflite-runtime are the same model, not a different one. Run: node $S/t02_parity.mjs tfjs-1t. Pass: per model, at least 90% of reference boxes matched at overlap 0.9, median score difference 0, max 0.10; AND report frames whose drawn set at 0.5 differs (node $B/run-bench-display.mjs). Tonight: PASS on the overlap line; Demo90 draws a different set in 5 of 25 frames. Never compare crew devices by raw box hash.
- 5 T02b ONE RESIZE. Proves: the field picture is the same on both paths, not only the test bytes. Run: python $B/resize_parity.py and $B/canvas_vs_pil.py on 60 JPEGs, then 20 pictures through Grok's Python resize and Grok's browser resize. Pass: the 300x300 input is byte-equal in Python and JS, or the frame is resized once at the camera and sent at 300x300. Tonight: FAIL, Demo90 draws a different set in 21 of 60 frames (Grok's PIL vs resizeBilinear). Ask the operator which resize is the contract; the Pi scripts use cv2 INTER_LINEAR.
- 6 T02c ONE THRESHOLD. Proves: a box scoring exactly 0.5 (k=128) is treated the same on every path. Steps: feed a stored output with a 0.5 score to cnn.js, sensor_fusion_edge.py and the envelope builder. Pass: all three keep it, or all three drop it. Tonight: Grok uses > 0.5 (cnn.js:99, sensor_fusion_edge.py:152); the probe envelope uses >= 0.5.
- 7 T09 ENVELOPE CONTRACT. Proves: one shape whichever side ran the CNN. Run: python $S/t09_envelope.py http://HOST:PORT picture.jpg against the edge node AND against Grok's browser builder. Pass: fields v, session, peer, seq, at, verb, authority, payload.layers, payload.ms, hash, codex all present with types; authority is 'MARK'; verb DETECT for one layer, IDENTIFY for two; boxes ymin,xmin,ymax,xmax clamped to 0..1 (tighten t09_envelope.py:25 from -0.05..1.05); only the first count boxes read. Tonight: PASS on the lead's edge node; Grok's code has no envelope at all.
- 8 T09b ONE HASH. Proves: one event, one hash, in Python and in the browser. Run: python $S/t09b_hash_canon.py and python $B/hash_split.py <scratchpad>. Pass: 0 of 49 pairs split; the hash also computes on a page with no crypto.subtle. Tonight: FAIL, 8 of 49 split (I re-ran it): half-even vs half-up rounding, and '0.0' vs '0'. Fix: hash integers only (score k of 256, box in 1/10000) with fnv1a64, as decisions.ts:136-141 replayHash does.
- 9 T11 FOLDER AS REGISTRY. Proves: drop in a new folder and it appears; nothing else to edit. Run: bash $S/t11_registry.sh <edge url> <Home/SensorFusion> <python>, then bash $S/t06e_py_offline.sh for Grok's program. Pass: Model05.Manta appears with no restart and answers; a folder missing labelmap.txt or Sample_TFLite_model is not offered; a path outside the home is refused; removing the folder removes it; the input is uint8 [1,300,300,3] and the four outputs are boxes, classes, scores, count in that order, or the folder is refused with a sentence. Tonight: the lead's node PASS 6/6; Grok's lists are typed three times (sensor_fusion_edge.py:35-47, cnn.js:9-21, sf.ts:23-35).
- 10 T06a BROWSER OFFLINE. Proves: the browser CNN runs on a closed field network. Run: node $S/t01_cnnjs.mjs offline demo90 /sensor-fusion/cnn.js 8633. Pass: boxes with every outside host refused, zero outside requests. Tonight: FAIL 'Could not load the model runner.' (cnn.js:4-8 use jsdelivr and raw.githubusercontent). The same code served same-origin PASS, 86 ms, 0 outside requests.
- 11 T06b EDGE-SERVED PAGE OFFLINE. Proves: an edge node can serve the page, the runtime and the folder itself. Run: node $S/t06b_edge_offline.mjs <edge url>. Pass: both paths (CNN in browser, CNN on edge) give envelopes with zero outside hosts, and both envelopes carry the same fields including codex. Tonight: both paths ran offline; FAIL only because the browser envelope lacks codex.
- 12 T06c DOWNLOADED PAGE FROM FILES. Proves: the saved SensorFusion-2525.html works, or says why. Run: node $S/t06c_download_file.mjs. Pass: the CNN loads from a relative or inlined script, or the page shows one plain sentence; the loop keeps running after a detect error. Tonight: FAIL, src="/sensor-fusion/cnn.js" (download/SensorFusion-2525.html:87) becomes file:///sensor-fusion/cnn.js; runCnn returns silently (:203); the loop has no catch (:206-213).
- 13 T06d ONE FILE PLUS THE FOLDER. Proves: any browser device can run the Pi's models with no network and no install. Run: node $S/t06d_single_file.mjs $S/sf-single.html <ModelNN folder> <picture>; then node $B/t/t06d_nosimd.mjs. Pass: boxes, zero requests, file 7.77 MB or less, a wrong-shape folder refused with a sentence; on a no-SIMD engine either boxes or one plain sentence. Tonight: PASS with SIMD (6.67 MB, head 0.902); with SIMD refused it fails on '_malloc' with no sentence.
- 14 T06e PYTHON OFFLINE START. Proves: the Pi program starts with the folder on disk and no network. Run: bash $S/t06e_py_offline.sh <python> <sensor_fusion_edge.py> <home>. Pass: --check and the camera menu run with every network call refused; the menu lists exactly the folders on disk. Tonight: FAIL 3/3, exit 1 at :116. It is a class of three: :116 fetch, :168 zidane.jpg download, :183 run_camera fetch. Fixing :116 alone still fails at :168.
- 15 T15 SAFE SELF-UPDATE AND SAFE DOWNLOAD. Proves: one bad push or one dropped download cannot brick a field device. Steps: (a) serve an HTML portal page as the program URL (Athena-B/portal/site/sitecustomize.py patches urlopen); (b) cut a model download at 1,000,000 bytes (docs/assessments/2026-10-03_sensor_fusion_edge_probes/grok/short_download.py). Pass: the pulled program replaces the file only if it compiles and matches a pinned hash, else the last good copy runs; a download goes to a temporary file and is renamed only when complete and the model opens. Tonight: FAIL by source (sensor_fusion_edge.py:258-274 and :113-116); the breaker bricked a copy.
- 16 T07 BACK LENS. Proves: a phone opens its back camera. Run: node $S/t07_backcam.mjs <url> '#sensor' on the app page and on the download page. Pass: getUserMedia receives video.facingMode {ideal:'environment'} and a camera opens on a one-camera laptop too. Tonight: FAIL, {audio:false, video:true} (sensor-fusion.tsx:299-302; download page :181).
- 18 T03 FRAMES PER SECOND BY DEVICE CLASS. Proves: the real delivered rate, and that it holds over time. Run: node $S/t05_rtt.mjs http://127.0.0.1:8636/ 4 (CPU x1, x4, x6); node $S/t03b_soak.mjs page <edge> 600 with --js-flags=--expose-gc. Pass: the FPS shown equals frames drawn per wall-clock second within 10%; tensors and JS heap after gc() flat over 600 frames; Grok's path measured, not the probe page. Tonight: browser 21.7/s at x1, 5.1 at x4, 3.3 at x6; Grok's label is detect time (cnn.js:111, sensor_fusion_edge.py:145) plus a 40 ms wait (sensor-fusion.tsx:270). Try canvas drawImage plus getImageData for preprocessing: 45-47 ms vs 71-73 ms.
- 20 T05 EDGE ROUND TRIP, LAN AND CLOUD, TWO CREW. Proves: the edge path is usable and serves a two-person crew. Run: node $S/t05_rtt.mjs (links: same box, LAN, cloud 4G, poor); python $S/t05c_two_crew.py <edge> <jpg> 2 20 and 4 10. Pass: every frame gets an envelope; round trip and mark age reported per link. Tonight: edge LAN 6.0/s, cloud 4G 4.4/s (2 in flight 6.2), poor 2.2/s; the lead's current node 40/40 for two crew. Keep T05c for any server Grok adds: one lock per model.
- 21 T12 LIGHT CODEX CAPTION ROUND TRIP. Proves: the caption belongs to its frame and reads back exactly. Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs $S/t12_codex.mjs <python> <edge>; $S/t12d_real_captions.mjs <python> 40; $B/t/t12x.mjs. Pass: Double Helix only (light-codex.ts:238; Single and Hidden always say verified, :244 and :273); the caption carries the envelope hash prefix; it travels as a lossless PNG strip beside the JPEG (640x4 is 301 B) and the decoded text equals the envelope's codex. Tonight: FAIL, 19 of 40 wrong yet verified after JPEG 4:2:0; 4:4:4 kept 40/40; the caption has no hash.
_(4 test(s) on the withheld integration not reproduced.)_

### Christo — consensus and user-flow validation

_(report concerns the withheld integration)_

Tests for Grok:
- RUN (from frontend/): node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs $SCRATCH/fleet2/Christo-A/christo-sf-crew.test.mjs. Today it prints LAW 42 ok, 0 failed, GAPS 17 open. Note: G4, G5, G14 and G15 are hard-coded gap(false), so --strict never passes. Replace them with real checks before using --strict.
- RUN (from frontend/): node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs $SCRATCH/fleet2/Christo-B/christo-b-breaker.test.mjs. Today it prints 11 BREAK lines. Done means every line reads 'holds'.
- CUE COLOUR: every CNN box draws #0cff00. No CNN path draws #F0A020 or #E24B3B. No envelope or label says MARK or TARGET. Amber appears only after a seat's TARGET row.
- DESIGNATION ID: feed one still scene for 400 frames and TARGET the same cue 5 times. That gives 5 different designation ids (epoch.seq), even though the envelope hash repeats. A label or envelope hash is never the id.
- RELOAD: reload the marker. The partner clears the old amber within 2 s with 0 refused words. Then inject one late word from the old epoch. The old mark must NOT come back.
- HASH PARITY: Python and the browser give the same envelope hash for all 256 scores k/256 and for boxes 1.0, -0.0 and 1.0117 (clipped). Hash score×256 and integer box coordinates.
- PROGRAM HASH: every envelope carries a program hash. sensor_fusion_edge.py does not exec a new file during a session, and a program change is a row.
- TWO-PERSON HONESTY: GUEST plus GUEST is recorded as two-device, not two-person. alex@phone plus alex@pc is not two-person. Only two different signed-in names count as two-person.
- LABELER HONESTY: the web modal says '{n} pictures saved in <folder>' only after files exist, otherwise 'not saved yet'. The Python labeler writes files or prints that none were saved. Every localStorage call is in try/catch (sensor-fusion.tsx:347).
- BACK CAMERA: openSensor() passes facingMode from the facing state. On a phone, Switch lands on the environment camera.
_(11 test(s) on the withheld integration not reproduced.)_

### Enki — diversity and edge-case discovery

_(report concerns the withheld integration)_

Tests for Grok:
- T1 FRAME LOOP. Feed the same 300x300 bytes to the browser CNN and to Python. Pass: no throw, and the same top boxes (score difference at most 0.02). Today every frame throws 'resized.round is not a function' (cnn.js:83-85). Use tf.round, tf.cast and tf.expandDims as functions.
- T2 OFFLINE START. Turn the network off with Demo90 already on disk, then run menu 2 then 1. Pass: the camera opens within 10 s on the disk copy, and one line says the update was skipped. Today: a URLError traceback and exit 1 (sensor_fusion_edge.py:183).
- T3 STALLED LINK. Point BASE at a listener that accepts and never answers. Pass: the camera opens on the disk copy within 10 s, because every urlopen/urlretrieve has a timeout. Today it hangs for 70 s or more (:116).
- T4 CUT DOWNLOAD. Serve half of detect.tflite, once with Content-Length and once without. Pass: the old file's sha256 is unchanged, there is no segfault, and the next offline start uses the old file. Write to .part, check the size against Content-Length (or a known hash), os.replace, and load only after that.
- T5 RUNTIME MATRIX. In a fresh venv on Python 3.13 (Pi OS Trixie), macOS arm64 and Windows amd64: the program imports the maintained runtime first, then tflite_runtime, and loads the same folder file. Pass: the same top boxes as T1. The README gives a venv recipe (PEP 668 refuses a bare pip install).
- T6 HEADLESS NODE. Run with DISPLAY unset and opencv-python-headless installed. Pass: no cv2.error at :231. The node runs without a window and serves envelopes.
- T7 PLAIN HTTP. Open the page as http://<lan-name>. Chromium can map the name with --host-resolver-rules='MAP sfpi.lan 127.0.0.1'. Pass: before calling getUserMedia, the page checks isSecureContext and navigator.mediaDevices. It says to open the https address or to use this phone as a screen. It never says 'Try again'.
- T10 MARK AGE. Each drawn box carries its envelope's 'at'. Pass: with CDP Network.emulateNetworkConditions at 1 Mbit/s plus 80 ms and at 256 kbit/s plus 300 ms, no box older than the limit is drawn. On a thin uplink the page prefers the CNN on the camera device, or sends 300x300 only.
- T11 CDN AND MODEL HOST FAILURES. Use Playwright routes to block, hang and return HTML for the runtime files and the model files. Pass: one plain sentence within 10 s. Then let the network back in: Retry reaches detect without a reload, because readyPromise is reset AND the failed script tag is removed.
- T12 NO-INTERNET LAN RUNG. With internet off, a phone opens the Pi node's page. Pass: the page, the runtime wasm and the folder files are all served by the Pi on relative paths, the folder list is the model registry, and the CNN runs in the browser. Today cnn.js:4-8 hard-codes jsDelivr and GitHub.
- T13 EVERY SF ROUTE GETS THE CAMERA. Run under 'wrangler dev' with the repo's wrangler.jsonc, worker.js and _headers. Pass: /SensorFusion-2525/ and /sensor-fusion/SensorFusion-2525 (after the 307 from .html) both answer camera=(self). The download keeps Content-Disposition after its 307. Today the full-screen page's final 200 says camera=().
- T14 DOWNLOADED TWIN. Open the downloaded SensorFusion-2525.html from file:// with no network. Pass: either the CNN code is inlined and runs, or the page says in words that it needs the site. The per-frame detect sits in try/catch (SensorFusion-2525.html:203-212), and an error is shown, never swallowed.
- T15 PROMPT AND PLAY. Leave the camera prompt unanswered. Pass: after 15 s the button stops being busy and a sentence says to answer the camera question. Then force play() to reject. Pass: the tracks stop and the camera light goes off.
- T16 BACK CAMERA. Use facingMode {ideal:'environment'}. Pass: a laptop opens its only camera. Never use {exact} (measured OverconstrainedError). explainCamera has words for OverconstrainedError and TypeError.
- T17 NO-SIMD FALLBACK. Wrap WebAssembly.instantiate so it rejects small probe modules that contain 0xfd (the script is at fleet2/Enki-S/bench_nosimd.html). Pass: the plain wasm loads with the same boxes, and the start-up check measures about 240 ms per frame and switches to CNN-on-edge when a node is faster.
- T18 HAL CHOICE. At start-up, time 3 CNN frames and 3 POST round trips, then choose browser or edge and show the rung in words. Pass: with CDP CPU throttling at 4x and at 6x, the choice flips the expected way. The page measures again on the online and offline events and after any LOST.
- T21 PLATFORM DETECTION. Use real user-agent strings. Pass: iPadOS Safari ('Macintosh' plus touch) is not offered the Python program. 'Linux aarch64' or 'armv7l' reads as pi. 'CrOS' does not read as win.
- T22 ONE HASH. The same envelope gives the same hash in Python and in the browser on plain http, where crypto.subtle is absent. Use pure-JS SHA-256, or FNV-1a as decisions.ts:136-142 does.
- T23 REAL-DEVICE LIST (not runnable here): iPhone in Low Power Mode, in Lockdown Mode with and without the site excluded, during an app switch and a reload (camera re-prompt), and opening a second camera; Pi 5 Chromium with the ribbon camera, and Python through picamera2; an Android in-app browser and Samsung Internet; the Windows self-update (os.execv at :274); guest Wi-Fi with client isolation.
_(4 test(s) on the withheld integration not reproduced.)_

### Enlil — implementation and build verification

Enlil grades the current Sensor Fusion build D. Grok's folder shape and label order hold, and Python on Linux x86 runs the CNN. But the browser CNN cannot run. cnn.js loads from a CDN, and it uses chained tensor calls that the core bundle does not have. The Python program has no HTTP mode. It imports only tflite-runtime, which has no Mac, Windows or Python 3.12+ wheel. It dies on a closed network, rewrites the model files on every start, and runs unsigned code from main. The model list is typed four times. I re-ran the recipe below in scratch: one Python node served the unchanged page offline, first box at 788 ms.

Tests for Grok:
- T1 CLOSED NETWORK PAGE: start your node, then from frontend/ run node <scratch>/fleet2/Enlil-A/offline_page.mjs <port> fixed 8. Pass when external_hosts_attempted is [], max_box_pixels > 0, tensors_live is 0 and errors is []. At HEAD it fails: cdn.jsdelivr.net is attempted and the page says 'Could not load the model runner.'
- T2 CHAINED CALLS: load only lib/tf-core.min.js, lib/tf-backend-cpu.min.js and lib/tf-tflite.min.js in Chromium and run 60 frames of the fake camera. Pass when there is no pageerror (today: 'resized.round is not a function'). Do not use a regex gate: a chained img.round() passed the regex gate.
- T3 COUNT READ: on one interpreter, run a busy frame and then a black frame (Enlil-A/parity/ghost.py). Pass when the hits use only index < count, in both runtimes and in cnn.js. Mutation check: plant 0.9 in slot 9 past the count. It must not appear.
- T4 INSTALL MATRIX: pip install --dry-run -r edge/requirements.txt on Python 3.10, 3.12, 3.13 and 3.14 resolves to ai-edge-litert. Then python -c 'from ai_edge_litert.interpreter import Interpreter, load_delegate' succeeds. On Python 3.9 (not armv7l), the node prints one plain sentence asking for Python 3.10 or newer.
- T5 OFFLINE PYTHON: point HTTPS_PROXY at a closed port, with a Home folder that holds Demo90. Run the camera or check path. Pass when it loads the local detect.tflite and returns an envelope. Today it exits with URLError after 'Updating labelmap.txt'.
- T6 TORN DOWNLOAD: serve detect.tflite from a link that drops at 50,000 bytes. Pass when the sha256 of the existing detect.tflite is unchanged (temp file, size check, rename). Also: a folder that already exists is never re-downloaded.
- T7 NO AUTO-RUN: point APP at a local server that holds a changed program, then start without flags. Pass when the program does not exec the new code unless a pinned hash matches. The service unit's ExecStart contains --fresh, or pull is off by default.
- T8 THE FOLDER IS THE LIST: copy Demo90 to Home/SensorFusion/Model99.Test (same shape, no rename inside). Pass when GET /sensor-fusion/models.json, the page's picker and POST /infer?model=Model99.Test all see it, with no code edit. Delete the folder, and it disappears from all three.
- T9 BIND: start with no flag. A curl to the machine's LAN IP must be refused, while 127.0.0.1 answers 200. With --lan, the LAN IP answers, and POST /infer without the token is refused.
- T10 PATH GUARD: curl --path-as-is http://127.0.0.1:<port>/sensor-fusion/models/../../../etc/passwd and the %2f-encoded form both return 404.
- T12 FACING: node <scratch>/fleet2/Enlil-A/facing.mjs on a one-camera fake device. Pass when facingMode {ideal:'environment'} opens, and no source file uses exact.
- T13 HONEST FAILURE: open the saved SensorFusion-2525.html from file://, and also the node page at http://<LAN IP>. Pass when each one shows one plain sentence (no CNN here / open over HTTPS or on this device), never a silent black canvas. Today :203 returns silently.
- T14 PACKAGED BINARY: run the PyInstaller one-file build with env -i and no SF_SITE or SF_HOME. Pass when it serves the page and finds ~/Home/SensorFusion, or refuses with one plain sentence naming the setting. Today it prints '0 model folders' and the page returns 404.
- T15 PI UNIT: systemd-analyze verify sensor-fusion@.service passes. grep shows User=%i (not User=pi) and --fresh. On a real Pi (UNVERIFIED here), after a reboot curl localhost:8525/sensor-fusion/models.json answers 200.
_(1 test(s) on the withheld integration not reproduced.)_

### Krishna — integration and cross-module testing

Grade D. Grok's Sensor Fusion runs alone. The page imports only its R-CORE history (sensor-fusion.tsx:21). The Python program serves nothing. No envelope reaches the crew link, the deck or the decision ledger. The crew link refuses it. The deck keeps one per verb. The relay refuses it, and it is not even served: worker.js has no route for it, and local wrangler answers with HTML. My probe wrapped six real envelopes in the deck's commEnv shape, with eventId set to peer-seq. Two sensors at the same seq both passed. Duplicates and foreign rooms were dropped. Light Codex at block size 4 on 1280x720 frames survived the app's JPEG 0.8 on 60 of 60 frames. The accept rule (Double Helix plus a keyed tag) accepted no wrong caption, no blank photo and no forgery.

Tests for Grok:
- W1 Two sensors in one room at the same seq both pass the deck's commIn (r.153:1412-1417 verbatim): eventId = peerId-seq. Reference: Krishna-S/sf_integration.test.mjs; mutating to room:seq fails it.
- W2 The same word twice is shown once (dedupe by eventId).
- W3 A sense word whose sessionId is another room is dropped.
- W4 Every outgoing word carries sessionId, peerId, eventId === peerId+'-'+seq and authority 'MARK'.
- W5 Characterisation, not a gate: a raw envelope (field 'session', no sessionId, no eventId) passes a foreign room and collapses by verb. This proves the wrapper is needed.
- C1 A caption longer than the line is refused before any pixel is written. Capacity is (W+gap)/(4*bs+gap)-8: 29 at 640/bs4, 63 at 640/bs2, 67 at 1280/bs4.
- C2 A caption with any character outside lib/light-codex.ts's alphabet is refused. Use unsupportedChars(), never Python isalnum(). 'BÄUME' must be refused.
- C3 A Single Helix read is refused even when decodeImage says verified:true.
- C4 Hidden Helix '000', '444' and '0', and a Double Helix '000', are refused.
- C5 A caption with one field changed and the old tag kept is refused (keyed HMAC tag).
- C6 A caption tagged with another room's key is refused.
- C7 An accepted caption joins back to exactly one recorded word (peer, seq, hash prefix).
- P1 Recorded pixel run: zero wrong captions accepted on any encoding; zero of 275 unmarked photos accepted; zero forgeries accepted.
- P2 Block size 4 on 1280x720 through the app's JPEG 0.8 is accepted on every frame (60/60). At 640 px the guard must refuse a caption over 29 characters, or the capture must be PNG.
- K2 The two-person rule keys on seat or peer id, not on a typed name ('Alex' vs 'alex ').
- K5 A sensor's seq counter cannot lock a seat out of the relay: the sense kind gets its own slot.
- K6/K7 Every envelope names its runtime, and the edge node stamps its own peer id; it never echoes ?peer= from the client (edge_node.py:121).
- replayHash is unchanged when envelopes are added beside the ledger, and decision 'extra' stays out of the hash (pin decisions.ts:35 against a later 'fix').
- A layer-2 box with 'within' is mapped to frame coordinates before it is drawn; the drawn box lies inside its parent box.
- One model list: the folders found under Home/SensorFusion/*/Sample_TFLite_model are the list for the Python program, cnn.js and sf.ts. Adding a folder of the same shape shows it in all three with no code edit.
- Mission manifest: the edge node refuses to serve marks from a folder whose sha256 of detect.tflite, edgetpu.tflite or labelmap.txt differs from the manifest. A one-byte label change must be refused. Use stdlib hmac, not AES.
- Training pictures (takeShots) never carry codex pixels; their provenance goes in a side record.
- Bluetooth: the compact word is 512 bytes or less; the full 560-925 B word is never sent in one write.
- The path chooser measures the browser CNN against the edge round trip at start-up, keeps the result, and shows which path it chose.
_(5 test(s) on the withheld integration not reproduced.)_

### Odin — predictive and future-proof testing

Grade D. The folder file is the part that will last. detect.tflite runs unchanged in two browser runtimes and two Python runtimes. On x86, tfjs-tflite and ai-edge-litert give the same numbers bit for bit on 100 of 100 picture-model pairs. Everything around the file breaks first. At HEAD, cnn.js still uses chained tensor calls (lines 84-86), so the browser CNN does not run. It loads the runtime from a CDN and the models from a moving master branch (lines 4-8). The edge program tries the outlier runtime first (sensor_fusion_edge.py:124-127). The list of models is typed three times. LiteRT.js stays a canary: its CPU path hits open upstream bug #9518.

Tests for Grok:
- FUNCTIONAL_TENSOR_CALLS: grep cnn.js for '\.(sub|div|round|clipByValue|cast|expandDims)\(' on a tensor. Pass = 0 hits. Use tf.sub/tf.round/tf.clipByValue/tf.cast/tf.expandDims. Then the page shows boxes on a still picture in headless Chromium with the core-only bundle.
- NO_FOREIGN_HOST: load the served Sensor Fusion page and log every request. Pass = 0 requests outside its own origin. Today it fails: cnn.js:4-8 (jsdelivr and raw.githubusercontent master).
- PIN_HASH: every runtime file the page or the standalone serves has the sha256 in the pinned list (tf-core, backend-cpu, tf-tflite, simd js+wasm, plain js+wasm). Pass = 7/7 equal; any other file name is refused.
- NO_MOVING_BRANCH: grep sensor_fusion_edge.py, cnn.js and sf.ts for '/master/' and '/main/' in URLs. Pass = 0 hits; any fetch uses a commit SHA. Today it fails: sensor_fusion_edge.py:33, :34, :166 and cnn.js:8.
- STANDALONE: the one-file build is under 7,770,000 bytes, makes 0 network requests from file://, holds no detect.tflite bytes, reads the folder the person picks, and gives Demo90 163/179 boxes matched against the reference.
- COUNT_BOUNDED: in both cnn.js and the Python program, read n = int(count[0]); loop i < min(n, slots). Refuse the frame when n > slots or when boxes holds fewer than n*4 numbers. Pass = a hand-made output with count 3 and 10 slots yields at most 3 boxes; a 1-number boxes buffer yields a refusal, never a box.
- SELFTEST_BEFORE_MARK: at start, run one reference frame and compare it with the recorded boxes for that runtime family. Exact match within the family (max |diff| 0), never a loose 0.02 across families. If it fails, no marks are allowed and the screen says why in one sentence.
- PY_LADDER_ORDER: the Python program tries ai_edge_litert.interpreter first, then tflite_runtime (with numpy<2), and prints which one loaded and its version. Pass = on a box with both installed it prints ai_edge_litert; with only tflite_runtime it prints that; with neither it prints one sentence pointing to the browser path.
- PY_API_PIN: grep the edge program for 'CompiledModel'. Pass = 0 hits until LiteRT #9518 is closed.
- FAMILY_PARITY: run the bench inputs (bench/in/*.bin) through the edge runtime and the browser runtime. Pass = max |diff| == 0 when both report the same family (tfjs-tflite and ai-edge-litert on x86 do today: 100/100). Record the runtime id in every envelope. Re-run on ARM when a Pi and a phone are available.
- ONE_REGISTRY: add a new folder PreLoadedModels/ModelNN.Name/Sample_TFLite_model/{detect.tflite, edgetpu.tflite, labelmap.txt} to Home/SensorFusion. Pass = it appears in the Python program and on the page with zero code edits. Today it fails: the list is typed in sensor_fusion_edge.py:35-47, cnn.js:9-21 and sf.ts:23-28.
- MODEL_SHA_IN_ENVELOPE: every envelope carries model sha256 (16 hex of detect.tflite) plus runtime name and version. Pass = a mark without them is refused by the receiver.
- CANON_NUMBERS: build envelope hashes from integers only (score x1000, box x10000, cls) with one serializer. Golden test: the same 100 bench detections hashed in Python and in JS. Pass = 100/100 equal. Known trap: round(0.5625,3) is 0.562 in Python and 0.563 in JS; json.dumps(1.0) is '1.0', JSON.stringify(1.0) is '1'.
- REPLAY_INVARIANCE: replay a recorded session with tfjs-tflite, with ai-edge-litert, with LiteRT.js and with no CNN at all. Pass = the same replay hash every time, because replay reads the recorded marks and never runs a model.
- COI_GUARD: the CNN page asserts self.crossOriginIsolated === false at start, or ships and pins the threaded pair as well. Pass = with COOP+COEP headers added in a test server, the page either refuses in one sentence or runs; it never hangs.
- HEADERS_CAMERA: in the built out/_headers, the Sensor Fusion Permissions-Policy (camera=(self)) comes after the site-wide camera=() rule, or the page rule detaches the site-wide header first. Pass = getUserMedia on /SensorFusion-2525 succeeds and the reversed order is caught by the test.
- BACK_CAMERA: openSensor() asks getUserMedia with facingMode 'environment' and falls back to any camera if refused. Pass = a fake-camera run logs the constraint and still opens on a device with one camera.
- CAPABILITY_RECORD: at start, measure and keep jspi, relaxedSimd, simd, GPU adapter and whether it is software, WebNN, crossOriginIsolated and the median CNN ms over 10 frames (like fps-governor). Pass = the chosen path is the frozen runtime unless the LiteRT canary passed on this device and measured faster.
- LITERT_CANARY (weekly, test only, never the product path): newest @litertjs/core at an exact version with a lockfile, CPU path and GPU path, on the four folders, over 30 frames, not one. Pass = output shapes [1,10,4]/[1,10]/[1,10]/[1] on every frame and at least 90% of boxes match. Expected to fail until #9518 (and #8065 for GPU) close.
- EDGE_SERVES_PAGE: when the CNN runs on the edge node, the page is served by that node, so no public page calls a private IP. Pass = 0 cross-origin requests to a private address (no Local Network Access prompt, no mixed content).
_(1 test(s) on the withheld integration not reproduced.)_

### Pangu — cutting-edge innovation

_(report concerns the withheld integration)_

Tests for Grok:
- T1 ORDER. Input: 9 signed envelopes, frames 1 and 2, plus 3 duplicates, in 2,000 shuffled orders. Pass: exactly 1 world hash and 11 objects. Today: the lead's fusion2 reducer gives 4 hashes. The frontier reducer passes. Script: Pangu-S/frontier.py.
- T2 NEXT FRAME. Input: seq 2 from the same nine peers with the same boxes. Pass: the object count stays at 11. Today: the set reducer gives 22. The latest-seq-per-peer rule from link.ts:141-148 passes. Scripts: Pangu-B/reducer_break.py, Pangu-S/frontier.py.
- T3 ONE-DEVICE FORGERY. Input: a copy of SF:2.2.1 with its score raised, delivered to device B only, at the same seq or a higher one. Pass: the forgery is refused and devices A and B have the same hash (MATCH). Today: the set reducer gives 11 objects against 10. Use per-peer keys: with one room key (fusion2.py:5), any member can sign as any peer.
- T4 STALE. Input: a frame-1 envelope that arrives after frame 2. Pass: it is refused as stale and the world hash does not change.
- T6 DUPLICATE. Input: the same envelope delivered twice. Pass: the object count does not change. Today: the lead's reducer goes from 11 to 16 objects (fusion2.py:28).
- T7 INDEPENDENCE. Case 1: 3 crops of one camera. Pass: combined score 0.688, not 0.959. Case 2: 9 cameras with the same folder and the same sense, each with a false mark at 0.60. Pass: combined no higher than 0.60; today noisy-OR gives 0.9997. Only a distinct pair of sense and seed adds a vote.
- T8 TIME WINDOW. Input: two cubes 157 ms apart watching a box that moves 6-17 px. Pass: one mark. Today: two marks, at overlap 0.39 and 0.48 (Pangu-B/skew.py, computed). The envelope must carry the capture time. edge_node.py:76 stamps `at` when the envelope is built.
- T9 REFLEX COST. Pass: the reflex costs 10% of the browser CNN time or less, at CPU 1x and 4x. Today: 2.3-2.8 ms against 43 ms, and 10.3-11.2 ms against 190 ms. Passes. Script: Pangu-A/web/reflex.mjs.
- T11 REFLEX SCORING. At the same CNN budget, event gating must keep at least as many true boxes as a uniform schedule AND leave no more stale boxes. Today, at 24% of runs: 61 stale against 53, so it fails. Do not use cam.y4m for quiet counts: it has 31 unique frames out of 60 (Pangu-B/y4m_check.py).
- T12 SEED. The seed is the sha256 of the three (name, file sha256) pairs, in order. Pass: equal after a copy; a phone with only labelmap.txt and detect.tflite gets the same seed without edgetpu.tflite; one changed byte gives MISMATCH. Passes in Pangu-S/seed_list.py (Head 00D1CDB44D00AF82). Nothing is written into the folder.
- T13 INPUT HASH. The same `in` (the hash of the input bytes) in Python and in the browser must give a tolerance match: same class, overlap at least 0.9, score within a tolerance written per folder (tonight's largest: Demo90 0.016, Head 0.086). A different `in` must name the resize recipe as the cause. Today: 4 recipes give 4 answers (Pangu-A/resize_parity.py).
- T14 CODEX ON PLAIN FRAMES. Input: solid black, grey, white, night blue, and an unsigned camera frame. Pass: Sensor Fusion's receiver returns no message. Today, decodeImage returns '000' or '444' with verified=true (light-codex.ts:270). Accept only a framed Double Helix matching ^SEED [0-9A-F]{12}$. Scripts: Pangu-A/codex_plain.mjs, codex_false_verified.mjs.
- T15 SENSOR CUBE UNPLUG. Input: a fake int16 socket on a local port. Pass: one envelope with source seek-0. When the socket closes, a 'sensor quiet' row appears within a stated number of seconds, and no stale mark stays on screen. Wiring passes in Pangu-A/sensor_cube.py; the unplug step is not built.
- T18 PATH CHOOSER. Pass: the start-up chooser times the CNN itself, and its readings at CPU 1x, 4x and 6x differ. Today: fps-governor runSpeedTest reads 60/60/61 because it counts animation frames (fps-governor.ts:27-41; Pangu-B/speedtest.mjs).
_(4 test(s) on the withheld integration not reproduced.)_

### Sofia — multi-perspective analysis

_(report concerns the withheld integration)_

Tests for Grok:
- T1 CNN RUNS (G7): on a still frame the status reads 'Running detect.tflite' and at least 1 box is drawn. HEAD FAIL ('resized.round is not a function'). Script: fleet2/Sofia-A/sofia_glass.test.mjs.
- T2 TAP NEVER WAITS (G12, gated on T1 passing): with the CNN running at CPU 4x, tap-to-handler p95 under 50 ms. Functional fix alone: 235-261 ms FAIL. Worker: 7 ms PASS. Also assert worker and main give byte-identical boxes on a frozen frame (worker_parity.mjs).
- T3 BACK CAMERA (G2): captured getUserMedia constraints include facingMode 'environment' (ideal) in sensor-fusion.tsx AND SensorFusion-2525.html. HEAD FAIL in both.
- T4 OFF ON EVERY EXIT (G3, the class): after the logo-to-menu, Profile, Stop, a route change and pagehide, every track is 'ended' within 500 ms. On return the screen must not say 'SENSOR 1: ON' unless video.readyState >= 2. HEAD FAIL (logo path; return_probe.mjs).
- T5 OFF ON HIDE (G4): on visibilitychange to hidden, the tracks stop within 2 s and the switch shows OFF. HEAD has no handler.
- T6 CONSENT FIRST (G1) and STAYS HERE (G5): no camera request before the SENSOR 1 tap; 0 POST/PUT bytes in 8 s on the browser path. Both PASS today — keep them as regression gates.
- T7 CLOSED NET (G6): with every third-party host blocked, the CNN still runs from the page's own origin, using the same folder files (no second model store). HEAD FAIL.
- T11 UNIQUE PEER: two pages on two devices produce two different peer ids (today the constant 'browser').
- T12 SAVED IS SAVED (G13): after saving 3 pictures and reloading, 3 pictures can be read back (IndexedDB or OPFS), or the panel says plainly that they were not kept. Upload Images uploads something or is removed. HEAD FAIL.
- T13 HONEST FILE LINE: the info and path lines name the file actually loaded (detect.tflite in the browser), never edgetpu.tflite unless the Coral runs it.
- T14 AXE CLEAN (G9): zero critical or serious findings on the camera screen (the select named, Annotate contrast at least 4.5:1). Toggles carry aria-pressed.
- T15 MARKS SPOKEN (G10): a polite live region announces mark state changes (not every frame).
- T16 F SHORTCUT (G11, WCAG 2.1.4): F is ignored when focus is in an input, textarea, select or contenteditable, and the shortcut can be turned off. HEAD FAIL ('Taft').
- T17 COUNT OUTPUT: cnn.js reads only up to the model's count output (cnn.js:96 reads every slot today).
- T18 FOLDER IS THE MENU: a new folder PreLoadedModels/Model05.Manta/Sample_TFLite_model/{detect.tflite, edgetpu.tflite, labelmap.txt} appears in the Python menu and in the browser list with no code edit (D3 FAIL today; the list is typed three times).
- T19 OFFLINE START (D1): with the network down and the folder on disk, the Python camera loop starts. HEAD FAIL (URLError).
- T20 NO CLOBBER (D2): a folder holding local bytes is unchanged after a run unless the person chose to update it. HEAD FAIL.
- T21 FOLDER MOVES WHOLE (W1-W3): download into a temp folder, verify, then rename the whole folder. A drop between files or mid-file leaves the old folder intact and working. HEAD 0/3 (folder_whole_test.py).
- T22 NO UNPINNED RUN (D4): a self-update runs only when the hash matches a pinned manifest. A captive-portal HTML response is refused. No os.execv (Windows splits paths with spaces; UNVERIFIED here). HEAD FAIL.
- T23 FILE OPEN: the downloaded SensorFusion-2525.html opened from file:// has SFCnn defined (relative path or inline script). HEAD FAIL in desktop Chromium; repeat on an iPhone.
- T24 LAN TRUTH: a page served from a Pi over plain http shows one plain sentence ('the camera needs https here; use this device as a screen') instead of 'Application error'.
- T25 LOGOUT CLEARS: after Profile or logout, no localStorage key holds the operator's name or email. HEAD FAIL (sf2525-capture).
- T26 CHOOSER CONSENT: 0 bytes go to an edge or cloud before the person allows that place. The chooser picks only among allowed places and names the place on screen. The reference chooser sends 146,240 bytes today.
- T27 CLASS LOAD: one edge node with N = 8 and N = 30 clients reports each client's rate. Clients fall back to the browser path when the node gives under 4/s (today 1.64/s at 30; class_capacity.py).
- T28 FRAME CAP: the default loop runs at most 4-6 frames/s (the operator's bar). At 4/s, CPU is under 0.35 cores in the sandbox (measure.mjs: 0.30). As shipped it is 11/s, 0.64.
- T29 CHECK ID GATE: before the Check ID layer runs, the screen shows a notice and asks for a confirm. An IDENTIFY envelope never leaves the device unless that place was allowed.
- T30 NO NEGATIVE AUTHORITY: when no person box is present, the screen never says 'clear' or 'safe'.
_(3 test(s) on the withheld integration not reproduced.)_

### Thoth — data and analytics deep dive

Thoth grades the current Sensor Fusion work C-. The good news: fed the same bytes, the browser equals ai-edge-litert bit for bit on 100 of 100 model-frames on x86. The old "gap" was tflite-runtime 2.14. Grok's program runs it on one thread at 144 ms; LiteRT takes 16 ms. The weak part is measurement. The FPS label is the time of one call, so it reads about 23 while the probe page makes 20.5 envelopes a second, and only 15 of those are new camera frames. cnn.js still reads past the model's count. Envelopes cost 0.74 Mbit/s for ten cameras at 15 a second; JPEG uploads cost 61 to 77. Every number comes from this sandbox. Re-measure on a Pi and on phones.

Tests for Grok:
- T1 PARITY ON EVERY DEVICE: run Thoth-A/device_bench.py --home <folder of model folders> --inputs <bench/in> --threads 1,4 on the Pi, the PC and the Mac. On x86, PASS = out_hash equals the browser's: Demo90 8cb0ea62257bda58, Model01.Deer 68c5166064499ff3, Model02.Head e533719b83de215c, Model04.Tree fc8d2bd8358a3890 (re-confirmed tonight: Demo90 matches at 1 and 4 threads, 15.5 / 5.0 ms). On ARM, report two results: EXACT (same hash) and NEAR (same count, same labels, every box overlap >= 0.9). A NEAR without EXACT is ARM rounding, not a bug. Set the NEAR score tolerance from the first Pi run (UNVERIFIED).
- T2 STOP AT THE COUNT: read the model's count output and use only slots below it, in cnn.js and in sensor_fusion_edge.py. Also reject zero-area boxes. PASS = with tflite-runtime 2.14, Head, input ec024f284026b083, no hit at slot 8 and no box [0,0,0,0]. Over the 25 bench inputs x 4 folders, no hit has an index at or past the count.
- T3 HONEST FPS: show the sustained wall-clock rate (envelopes over the last 2-5 s, from timestamps), as fps-governor.ts:30 says ('sustained, not peak'). PASS = the label is within 5% of the rate computed from envelope timestamps by a drive3.mjs-style harness. Today a 43 ms call shows about 23 while the real rate is 20.4 loops and 15 new frames a second.
- T4 NEW FRAMES ONLY: start a CNN pass only when requestVideoFrameCallback reports a new presentedFrames, and stamp it into the envelope. PASS = with the 15 fps fake camera at throttle 1, repeat_share is 0 and distinct frames/s equals envelopes/s, in browser mode and in edge mode (today 27% and 41-44% repeats).
- T5 FRAME AGE IN THE ENVELOPE: add age_ms (frame shown -> envelope ready) to every envelope, and show p50/p90 on screen. PASS = present on 100% of envelopes. Report it at throttle 1 and 4 for DETECT and IDENTIFY. Sandbox reference: browser DETECT 62 ms at x1 and 209 ms at x4; edge 64 and 80 ms.
- T6 CHOOSE THE PATH BY MEASURING: at start-up, run the browser CNN for 2 s and the edge round trip for 2 s. Keep the sustained new-frame rate and frame age of each, choose one, and persist it like fps-governor. PASS = the choice and both numbers are logged. With a LiteRT edge node reachable on localhost, it picks the browser at throttle 1 (both reach the 15 fps camera, and no uplink is used) and the edge at throttle 4 (14 against 4.65 new frames/s).
- T7 CAMERA ASK: request facingMode 'environment' with an explicit width and height. PASS = track.getSettings() returns the requested size, the back camera can be chosen on a phone, and the bandwidth figure on screen is computed from the real size (today video:true gives 640x480 in Chromium).
- T8 THREADS NEVER FREEZE: if COOP/COEP is ever turned on, pass numThreads explicitly and at most 3 per model. PASS = Thoth-B/probe-hang.mjs at 8 and 16 emulated cores loads all four folders in 9 of 9 runs. Without COOP/COEP, single-thread stays the default.
- T9 PYTHON RUNTIME ORDER AND THREADS: the edge program tries ai-edge-litert first, then tflite-runtime, then tensorflow. It prints which one it loaded and passes num_threads (default = cores). PASS = the printed runtime and threads; on this x86 box Demo90 runs under 20 ms on 1 thread and about 5 ms on 4. On an Apple-silicon Mac or Windows it loads ai-edge-litert, not tensorflow.
- T10 FAN-IN: run Thoth-A/fanin.py against the node with 1, 3 and 10 cameras. PASS = the per-camera rate and the total are printed, no errors, and the total grows with the number of interpreters or threads, up to the core count. Today it is fixed at about 6.5/s with tflite-runtime and 43-48/s with LiteRT, because there is one lock per model.
- T12 ONE FOLDER LIST: the program learns its models by reading Home/SensorFusion/*/Sample_TFLite_model, as edge_node.py does. PASS = dropping in a new folder of the operator's shape makes it appear in the Python program and the browser page with no code edit (today the list is typed in three places: sensor_fusion_edge.py:35-47, cnn.js:9-21, sf.ts).
_(1 test(s) on the withheld integration not reproduced.)_

### Thor — risk and security stress testing

_(report concerns the withheld integration)_

Tests for Grok:
- T1 UPDATE PIN. Point APP at a local server that answers HTTP/1.0 with no Content-Length and closes after half the file. Pass: no write over Home/SensorFusion/sensor_fusion_edge.py, no os.execv, one plain sentence, and the current copy keeps running. Today: read returns 5640 of 11280 bytes, no exception, compiles, would execv.
- T2 UPDATE OFF BY DEFAULT. Run with no flag. Pass: no network call to APP and no execv. Updating needs an explicit flag plus a pinned sha256 match.
- T3 OFFLINE. Set BASE and APP to http://127.0.0.1:1/ and run --check and run_camera with a cached folder. Pass: the cached model runs, and the word 'Traceback' never appears on stdout or stderr.
- T4 MODEL PIN. Serve detect.tflite with one byte changed, and serve a labelmap.txt cut midway. Pass: the old files stay byte-identical (compare sha256 before and after), and the program names the refused file in one sentence.
- T5 FORGERY. POST a frame and take the envelope. In a second script with no key, recompute the MAC. Pass: no match. A wrong room code gets 401. Replaying an old envelope with the same seq is refused. Changing session, peer, seq or at breaks the MAC. Today: the keyless recompute matches (30c6408c39c2b32f).
- T6 OPEN PORT. curl -X POST /infer with Origin https://evil.example and no code. Pass: 401 or 403, and no 'Access-Control-Allow-Origin: *'. OPTIONS reflects only the paired origin. Today: 200 with ACAO *.
- T7 THEN REGISTRY. Send ?then=<absolute path outside HOME>, ?then=../outside/Evil and ?then=/etc. Pass: each gets an HTTP answer (404 'no folder'), never an empty reply (curl exit 52), and no detect.tflite outside the listed folders is ever opened. Today: the outside model runs and returns its labels; /etc drops the peer.
- T8 IMAGE BOMB. POST a 13000x13000 PNG of about 20 KB. Pass: 413 before decode, and node memory rises by less than 50 MB.
- T9 SLOWLORIS. Open 200 sockets, each declaring Content-Length 10485760 and sending 5 bytes. Pass: the server closes them within its timeout, /models stays 200, and the thread count returns to baseline within timeout + 2 s.
- T10 CACHE SPELLINGS. POST with model=Demo90/, Demo90//, ./Demo90 and 37 more spellings. Pass: each is 404 or maps to one cached interpreter, and memory rises by less than 100 MB.
- T11 NO FACE BEFORE THE CHOICE. Run headless Chromium with a fake camera and intercept requests to /infer. Pass: zero camera-frame POSTs before choosePath picks. The edge timing uses a synthetic frame. Today: 4 frames go out during measurement.
- T14 SECURE CONTEXT. Open the node page from a plain http origin that is not localhost. Pass: the page shows one plain sentence pointing to the HTTPS link or pairing, never a camera button that does nothing; the on-device CNN still loads.
_(2 test(s) on the withheld integration not reproduced.)_

## The twelve coordinators

### Coordinator 1 — The opening for the operator (at most 150 words): the plain answer to "how do we run CNNs in the web browser and on every device", what is proven tonight, what 

## The plain answer

**How do we run CNNs in the web browser and on every device?** We run the same detect.tflite, from the same folder, unchanged. In the browser it runs in WebAssembly (tfjs-tflite) at 39-47 ms a frame. On a Pi, PC, Mac or cloud box, a Python node runs the same file with ai-edge-litert, at 15-21 ms here. Both return one envelope. At start-up the page times both paths and picks one. Phones can only run the browser path, because neither Python runtime has a phone wheel.

**Proven tonight:** only in headless Chromium on x86. Given the same bytes, the browser output equals ai-edge-litert bit for bit, 100 of 100.

**What Grok does first:** make cnn.js draw a box. Use functional tensor calls inside one tf.tidy (cnn.js:84-85). Stop at the count output (cnn.js:96). Today every frame fails, and memory leaks.

## Proven / Not proven yet

Where this ran: a 4-vCPU x86 sandbox with headless Chromium 141, at repo HEAD 42dc2c9. No repo file was changed.

_(2 paragraph(s) on the withheld integration dropped.)_

### Coordinator 2 — Section "How a CNN runs in the web browser": the runtime table (runtime, loads the folder file unchanged?, measured ms, parity, status, why), the exact recipe f

All cited lines confirmed at HEAD `42dc2c9`. Here is my section, ready to paste.

---

## How a CNN runs in the web browser

A CNN runs in the browser today. One WebAssembly runtime loads the folder's `detect.tflite` with no change to the file and draws boxes. It is not the fastest runtime; it is the one that always exists, needs no node, and keeps the frame on the device. Everything below was verified across the lead facts (E1–E6, E11) and re-read in `cnn.js` at HEAD `42dc2c9`.

### The runtime table

Browser runtimes, same `detect.tflite` from the same folder, this sandbox CPU (x86, headless Chromium 1194, no GPU):

| Runtime | Loads the folder file unchanged? | Measured ms/frame | Parity | Status | Why |
|---|---|---|---|---|---|
| **tfjs-tflite 0.0.1-alpha.10**, WASM SIMD, 1 thread | **Yes** | **39–47** | Bit-identical to Python `ai-edge-litert` on x86, 100/100 frames; within 0.016 of `tflite-runtime` 2.14 (E2) | **WORKS, after two `cnn.js` fixes** | The only browser runtime that loads and runs the folder file as it is. |
| tfjs-tflite, plain WASM (no SIMD) | Yes | 235–278 | Same boxes as the SIMD build | Fallback | The runtime picks the plain build itself when SIMD is absent. Safari added WASM SIMD in 16.4; an older iPhone takes this path, ~6× slower. |
| tfjs-tflite, WASM SIMD, 4 threads | Yes | 13.5–13.8 | Same as 1 thread | **Do not ship yet** | Needs COOP/COEP headers. The live site sends none, and with them on the single-thread bundle hangs; cap threads ≤3 per model if ever enabled (UNVERIFIED trap). |
| LiteRT.js `@litertjs/core` 2.5.3, CPU/wasm | Reads the file | — | Broken: each of the four detection outputs gets a 4-byte buffer, so the read returns garbage | **Canary, not a path** | Open upstream bug `google-ai-edge/LiteRT #9518`. The same bug sits in LiteRT's Python `CompiledModel` API. |
| LiteRT.js 2.5.3, JSPI + WebGPU | Reads the file | ~500 (software GPU) | Matches Python on the first frame only | One setup that runs, but narrow | Needs JSPI + relaxed SIMD + WebGPU together. Not Safari (relaxed SIMD preview only), not a Pi browser (no Linux WebGPU off Intel Gen12+). Real-GPU correctness UNVERIFIED (#8065, #9661). |
| MediaPipe Tasks Vision 1.0.1 | **No** | — | — | Refused | "Object detection models require TFLite Model Metadata but none was found." Adding metadata changes the file, which the folder rule forbids (E4). |
| onnxruntime-web | **No** | — | — | Forbidden | Needs the model converted to ONNX — a second model store (E5). |

**Correction to E1/E6:** `ai-edge-litert` is the maintained successor to `tflite-runtime`, and the browser is *bit-identical* to it on x86, not merely close. The E2 "gap" is `tflite-runtime` 2.14, the outlier. "Browser 3–4× faster than Python" holds only against `tflite-runtime` 2.14 on one thread; `ai-edge-litert` runs ~15–19 ms, faster than the browser. That matters for the chooser below.

**One runtime, pinned.** tfjs-tflite 0.0.1-alpha.10 was last published Nov 2023 (alpha, E6). Keep it as the browser default and vendor its seven files by hash, served from the page's own origin. LiteRT.js stays a weekly canary until #9518 closes, never the product path.

### The exact recipe for cnn.js

Five fixes. The first unblocks every frame; the rest stop the leak, the phantom box, and the CDN dependency.

1. **The wasm path is already fixed.** `cnn.js:7` points at `.../tfjs-tflite@0.0.1-alpha.10/wasm/` (commit `35bc2a1`), and `cnn.js:45` calls `setWasmPath(WASM)`. The `/dist/` fault in E1 (404 → `_malloc`) is stale. Do not re-raise it.

2. **The live blocker — functional tensor calls.** `cnn.js:84-85` chains methods the core-only bundle does not have on a tensor:
   ```
   resized.sub(127.5).div(127.5).expandDims(0)            // throws
   resized.round().clipByValue(0, 255).cast("int32").expandDims(0)   // "resized.round is not a function"
   ```
   Use functional ops: `tf.sub`, `tf.div`, `tf.round`, `tf.clipByValue`, `tf.cast`, `tf.expandDims`. This one change makes the browser draw boxes.

3. **Wrap every tensor op in one `tf.tidy`** (or dispose all). As written, `pixels` and `resized` are created at `cnn.js:81-82` *before* the throw at `:85`, and the `.dispose()` calls at `:87-89` never run. The React loop retries every 40 ms, so the shipped error path leaks ~100 tensors / ~578 MB over 50 failed frames — a phone tab dies within seconds. Even after fix 2, a functional path with no `tidy` still leaks ~3 tensors / ~3 MB per frame.

4. **Read the count output; loop `i < min(n, slots)`.** `cnn.js:96` sets `count = scores.length` and reads every slot (E11). Slots past the model's true count hold leftover values; `tflite-runtime` produces a deterministic phantom (slot 8, score 0.5000036, box `[0,0,0,0]`) that `draw()` paints as a 1×1 box at the top-left (`cnn.js:125-128`). Read `n` from the 4th output, stop at `n`, and reject zero-area boxes.

5. **Serve from the page's own origin, by relative path.** `cnn.js:4-8` loads the runtime from `cdn.jsdelivr.net` and the models from `raw.githubusercontent.com/.../master/`. On a closed network the page shows "Could not load the model runner." Vendor the runtime beside the script and read the folder by relative path (the folder list can be the registry, so `FOLDERS` at `cnn.js:9-21` stops being the second of three typed copies). A same-origin build makes zero outside requests and still draws boxes.

Two more, lower cost: prefer canvas `drawImage` + `getImageData` over the tensor-op resize (saves ~26 ms/frame: 45–47 vs 71–73), and run `detect()` inside a **Web Worker** — on the main thread a tap waits up to 450 ms (p95) at 4× CPU; in a worker it is ~7 ms and the boxes are byte-identical.

### The start-up chooser: measure, then pick browser or edge

1. **Time the CNN itself, not the screen.** Do not reuse `fps-governor`'s `runSpeedTest`: it counts `requestAnimationFrame` ticks, which read 60 fps whatever the CPU. Time actual inference. Run ~7 frames per path on a **synthetic frame** — never a camera frame, so no video leaves the device before consent — drop the first 2, take the median ms. Count *new* frames (`requestVideoFrameCallback`), not loop turns; the `cnn.js:111` FPS label is one call's time and overstates the real rate.

2. **The bar comes first.** The operator accepts **4–6 FPS** (≤250 ms/frame) on a CPU with no Coral (`docs/asks/2026-10-02_sensor_fusion_fps_bar.md`). If one path is under the bar and the other meets it, take the one that meets it — even the slower absolute number.

3. **Otherwise take the faster path.** If the two are within 10%, stay in the browser: no node, no uplink, the frame stays on the device.

4. **Drop fast, climb slowly** (`lib/wire-core/calibrate.ts`). Drop a dead node (no answer in 800 ms) or a path that falls under the bar on **one** reading. Switching back needs **3 good readings in a row**. Persist the choice per device.

5. **Fallback ladder.** Browser runtime fails → edge. Edge fails → browser. Both fail → show the camera with no boxes and one honest sentence. Never draw a fake box.

6. **Re-measure** on the `online`/`offline` events and after any LOST — capability on a phone is not static.

_(2 paragraph(s) on the withheld integration dropped.)_

### Coordinator 3 — Section "The Raspberry Pi app onto PC, Mac and phones": one Python backbone + one page, three shapes (all on one device; Pi camera + phone screen; phone camera 

## The Raspberry Pi app onto PC, Mac and phones

**The answer in one breath.** We do not port the Pi app. We split it into two parts, and both already run in scratch: **one page and one Python node.** The page is the app on every screen. The node is the app on any box that holds the model folders, a Coral, or a camera a browser cannot open. Both read the same folder: `PreLoadedModels/ModelNN.Name/Sample_TFLite_model/{detect.tflite, edgetpu.tflite, labelmap.txt}`. Both return the same envelope. Phones only ever run the page.

**Proof from tonight.** One Python node served the repo's own SensorFusion-2525.html on a closed network. Only cnn.js was swapped. The page made 0 requests to outside hosts and drew its first box at 788 ms (Enlil, own node on port 8671, stopped by PID).

> Scratch root used below: `S=$SCRATCH`. Run Node scripts from `/home/user/eXeL-AI-Polling/frontend`.

---

### Where it stands tonight (HEAD 42dc2c9, `git status` clean)

None of the three shapes works end to end on any device yet. Each blocker is small, and a probe has proven each fix.

**The page**
- The browser CNN stops on its first frame with "resized.round is not a function" (cnn.js:84-85). The /wasm/ path is already fixed (cnn.js:7, commit 35bc2a1).
- The error loop leaks. Re-running the shipped cnn.js gave 100 tensors and 578.8 MB over 50 failed frames, because nothing sits inside tf.tidy (Athena).
- It loads the runtime from cdn.jsdelivr.net and the models from GitHub master (cnn.js:4-8). With no internet there is no CNN, even on a page served by the Pi.
- The camera request names no lens: `getUserMedia({audio:false, video:true})` (sensor-fusion.tsx:299). A phone cannot pick its back camera.

**The node**
- No node exists yet. sensor_fusion_edge.py has no HTTP mode.
- It imports only `tflite_runtime` (:121, :125), with tensorflow as the fallback. tflite-runtime has no Windows, Mac or Python 3.12+ wheel.
- Offline it crashes before the camera opens. `fetch()` runs first with no try (:183, then :116). The result is a URLError and exit 1, even with the model already on disk (Enki, Enlil, Athena).
- On a stalled link it hangs, because urlretrieve has no timeout (:116). The menu sat at "Updating labelmap.txt" for 70 s (`$S/fleet2/Enki-B/py/stall_run.txt`).
- It runs whatever is on GitHub main with no hash check (:253-274, `os.execv` at :274). A cut link returned 5,640 of 11,280 bytes with no error, and the half file still compiled (`$S/fleet2/thor-synth/liar.py`).
- On a screenless Pi, `cv2.imshow` raises "not implemented" under opencv-headless (:231).
- Its install lines (:23-25) are refused on Pi OS Bookworm, Pi OS Trixie and Ubuntu 24.04 (PEP 668, "externally-managed-environment", measured).
- :288 tells people a phone can run the file. No Python runtime wheel exists for Android or iOS.

---

### One backbone, one page

**The page.** It is the same page on a phone, a PC, a Mac and the Pi's own screen.
- Vendor the 7 runtime files beside the page, on the same origin, pinned by sha256: tf-core, backend-cpu, tf-tflite, plus the SIMD and plain js/wasm pairs. Together they are 9,085,263 B. No CDN.
- Use functional tensor calls (`tf.round`, `tf.cast`, `tf.expandDims`) inside one `tf.tidy`. Read boxes only up to the count output.
- Run the CNN in a Web Worker. At 4x CPU on the main thread, a tap waited p95 235-261 ms. In a worker it waited 7 ms, and the boxes were byte-identical (Sofia, `worker_parity.mjs`).
- Ask for `facingMode: {ideal: "environment"}`. Never use `exact`: on a one-camera laptop it fails with OverconstrainedError.
- Stay single-thread, with no COOP/COEP. If the page is cross-origin isolated, tfjs-tflite switches to its threaded build by itself, and the frozen bundle hangs (Odin, Thoth).
- If the engine has no WASM SIMD, the runtime loads its plain build by itself. That gave the same boxes at 235-259 ms (Enki, Odin).

**The node.** This is `sensor_fusion_edge.py --serve PORT`. The reference probes are `$S/fleet2/Enlil-A/sf_node.py` and `$S/edge/edge_node.py`.
- `GET /sensor-fusion/*` serves the page, cnn.js and lib/ at the website's own paths.
- `GET /sensor-fusion/models.json` lists every folder of the operator's shape under Home/SensorFusion. **The folder is the list.** The model name is the folder name, e.g. "Model02.Head".
- `GET /sensor-fusion/models/<Name>/Sample_TFLite_model/<file>` serves that folder unchanged, behind a realpath guard. It is never copied and never converted.
- `POST /infer?model=<Name>[&then=<Name>]` returns one envelope. It keeps one lock per model, which served two crew members 40/40 (Athena re-run). `then=` must be checked exactly like `model=`. Today it loads a detect.tflite from outside the list (Thor).
- It binds 127.0.0.1 by default. `--lan` opens it to the network, and LAN calls need the pairing token (see "How they join").
- It downloads a file only when the file is missing. It writes to `.part`, checks the size, then calls `os.replace`. With no network it keeps the folders it already has.
- Self-update is off by default. When it is on, the new file runs only if it matches a pinned sha256.
- A no-window mode covers a headless Pi.
- It stamps its own node id, a seq counter per node, the runtime name and version, and the detect.tflite sha256. It never echoes `?peer=` back from the caller (today edge_node.py:121 does).

**One envelope.** It has the same shape wherever the CNN ran.
- Every value is an integer. Score and box use `floor(v*1000+0.5)` in both languages, which gave 169/169 identical lines (Aset).
- Python `round()` and JS `Math.round()` disagree on k/256 ties such as 0.5625. They split 8 of 49 hashes in one test and 18 of 100 in another.
- Nothing may depend on `crypto.subtle`, because a plain-http page does not have it.

---

### The three shapes

**Shape A: everything on one device.** This is the default, and it sends nothing off the device.
- **Phone:** open the https site. The CNN runs in the browser worker. There is nothing to install.
- **PC, Mac, or a Pi with a screen:** use the site, or run the local node and open its page on localhost. The Pi's own screen runs it in a Chromium kiosk.
- **Which is faster on this x86 box:** the browser took 39-47 ms a frame and the node on ai-edge-litert took 15.5-17.7 ms (1 thread). The start-up chooser picked the node at every CPU speed (lead, `choose_litert_out.txt`).
- **A closed network with no install:** use one HTML file of 3,662,793 B that carries the runtime and no model. Next to it sits the folder the person picks. It opened from `file://` with 0 network requests and matched Demo90 on 163/179 boxes (`$S/fleet2/Odin-B/standalone/drive.mjs`).
  - Phones can pick a folder from iOS Safari 18.4 and Chrome Android 132 (MDN BCD).
  - `file://` on a real phone is UNVERIFIED.
- **A trap in today's downloaded HTML:** it loads `/sensor-fusion/cnn.js` by an absolute path (SensorFusion-2525.html:87). From storage it draws nothing and says nothing.

---

### The install, per OS

| Device | What runs | Python runtime | How |
|---|---|---|---|
| iPhone, iPad | page only, from the https site | none (no wheel) | Nothing to install. Safari has WASM SIMD from 16.4 (SOURCED). An iPad reports a Mac user agent, so `detectPlatform` (sf.ts:75) wrongly offers it the Python file. `requestFullscreen` is unsupported on iPhone (SOURCED). |
| Android | page only | none (no wheel) | Chrome. `.local` names resolve only from Android 12 (SOURCED). Give the IP or a QR code. |
| Windows x64 | page, plus the node if wanted | ai-edge-litert 2.2.0 (win_amd64, Python 3.10-3.14) | `py -m venv venv` then `venv\Scripts\pip install -r requirements.txt`. No `os.execv` self-update: on Windows it is unsafe with spaces in paths (SOURCED, UNVERIFIED). |
| Windows on ARM | page only | none | no wheel |
| Apple-silicon Mac | page, plus the node | ai-edge-litert 2.2.0 (macosx_12_0_arm64) | `python3 -m venv venv && venv/bin/pip install -r requirements.txt`. Needs Python 3.10 or newer. The Xcode tools' python3 is 3.9.6. |
| Intel Mac | page, or the node | ai-edge-litert **1.0.1** (macosx_10_15_x86_64, Python 3.9-3.11) | Pin `ai-edge-litert==1.0.1`. Its output was bit-identical to 2.2.0 and to the browser on 100/100 runs here. Real Intel-Mac hardware is UNVERIFIED. |
| Linux x86_64 / aarch64, cloud | page, plus the node | ai-edge-litert 2.2.0 | A venv is required (PEP 668). Install took 4.7 s (58 MB package plus 43 MB numpy). |
| Pi OS **64-bit** (Bookworm, Trixie) | node, plus its page in kiosk | ai-edge-litert 2.2.0 (aarch64) | Use a venv; add `--system-site-packages` if picamera2 drives a ribbon camera. |
| Pi OS 32-bit Bookworm (armv7l, Python 3.11) | node | tflite-runtime 2.14 with numpy<2 | PyPI has no armv7l numpy<2 wheel. piwheels may have one (UNVERIFIED). It is the slow class: 138-180 ms on x86, and slower on a Pi. |
| Pi OS 32-bit Trixie (Python 3.13) | page only | **none** | The plain sentence for the user is "use 64-bit Pi OS". |

**requirements.txt, with the markers corrected.** The builder's draft in `$S/fleet2/Enlil-A/requirements.txt` was refuted; do not copy it.
```
ai-edge-litert; platform_machine != "armv7l"
tflite-runtime; platform_machine == "armv7l" and python_version < "3.12"
numpy<2; platform_machine == "armv7l"
pillow
```

**Import order, one ladder, also for the Coral path at :121.**
```python
try:    from ai_edge_litert.interpreter import Interpreter, load_delegate
except ImportError:
    try: from tflite_runtime.interpreter import Interpreter, load_delegate
    except ImportError: Interpreter = None   # one plain sentence: "Open the website; this machine has no model runtime."
```
- Print which runtime loaded and its version.
- Pass `num_threads`. With 4 threads, ai-edge-litert took 4.8-5.9 ms.
- Never use the CompiledModel API. It hits open upstream bug google-ai-edge/LiteRT #9518: 4-byte output buffers, then heap corruption at exit (Odin).
- Whether the Coral delegate loads under ai-edge-litert is UNVERIFIED; there is no Coral here.

**Pi autostart.**
- Use a template unit `sensor-fusion@.service` with `User=%i`, `WorkingDirectory=/home/%i/SensorFusion`, `ExecStart=…/venv/bin/python …/sensor_fusion_edge.py --serve 8525 --fresh`, and `Restart=on-failure`.
- Pi OS images since 2022 have no default `pi` user. Today :73-74 still special-cases `/home/pi`.

**A one-file binary (PyInstaller), the last resort.**
- The Linux build is 48.8 MB and gives the same envelope hash as the venv node.
- It carries Python and the runtime only. It must find the folders in Home/SensorFusion; never bundle a model inside it.
- Under `env -i` today it prints "0 model folders" (Enlil).
- Windows and Mac builds are UNVERIFIED. Unsigned binaries meet Gatekeeper and SmartScreen warnings (UNVERIFIED).

---

### How the phone, PC and Mac join

---

### HTTPS for the camera

| Address the page is opened from | Camera | crypto.subtle | Service worker | Evidence |
|---|---|---|---|---|
| `https://` site | yes | yes | yes | — |
| `http://localhost`, `127.0.0.1` | yes | yes | — | localhost counts as secure (Athena T08 rows) |
| `http://<LAN IP or name>` | **no** (`navigator.mediaDevices` undefined) | **no** | no | Chromium 141, `$S/fleet2/Enki-S/e1_probe.json` |
| `https://<LAN>`, self-signed, after tap-through | yes | yes | **refused** (SecurityError) | `$S/fleet2/Enki-A/t1_secure.mjs` |
| `file://` (desktop Chromium) | opened | — | — | Enki; real phones UNVERIFIED |

**Three ways to get a camera onto a secure page:**
1. **The camera device runs the CNN from the https site** (Shapes A and C-local). This is the simplest, and it costs no certificate.
2. **Give the node HTTPS.**
   - With a self-signed certificate, every phone must tap through a warning, and service workers are refused.
   - On iPhone, Safari asks for the camera again on each page load unless the site is set to Allow (SOURCED).
3. **The https page uses a WebRTC data channel to the node.** The lead proved this with a Python peer.

**Permissions-Policy, under local wrangler with the repo's own config (live is UNVERIFIED because of the sandbox's 403):**
- The React route gets one `camera=(self)` from worker.js:125-127. That works.
- The "Open full screen" page is the problem:
  - `/sensor-fusion/SensorFusion-2525.html` answers with a 307 to the clean path.
  - The final 200 then carries only the site-wide `camera=()`.
  - So the camera is refused, and the person is told to allow something they cannot allow (`$S/fleet2/Enki-B/b1_headers_cam.json`).
- The operator can check the live site in one line: `curl -sIL https://exel-ai-polling.explore-096.workers.dev/sensor-fusion/SensorFusion-2525.html | grep -i -E '^HTTP|location|permissions-policy'`

**Say why, never "Try again".**
- Today, plain http ends at "The camera did not open. Try again." (sf.ts:104).
- Before calling getUserMedia, check `isSecureContext` and `navigator.mediaDevices`. Then say: open the https address, or use this phone as a screen.

---

---

### Tests Grok can run for this section

| # | Test | Pass | Today |
|---|---|---|---|
| PI-1 | Closed-network page: `node $S/fleet2/Enlil-A/offline_page.mjs <port> fixed 8` | external hosts `[]`, boxes > 0, `tensors_live` 0 | FAIL: tries cdn.jsdelivr.net, "Could not load the model runner." |
| PI-2 | The folder is the list: copy Demo90 to `Home/SensorFusion/Model99.Test`, then `bash $S/fleet2/Athena-A/suite/t11_registry.sh` | appears in models.json, the page picker and `/infer` with no code edit; disappears when deleted | the lead's node passes 6/6; Grok types the list in sensor_fusion_edge.py:35-47, cnn.js:9-21, sf.ts and SensorFusion-2525.html:108-120 |
| PI-3 | Install matrix: `pip install --dry-run -r requirements.txt` on Python 3.10, 3.12, 3.13, 3.14, then import the ladder | ai-edge-litert resolves and imports; Python 3.9 off armv7l gets one sentence | the docstring's `pip install tflite-runtime` (:24) has no wheel on 3.13 |
| PI-4 | Offline start: `bash $S/fleet2/Athena-A/suite/t06e_py_offline.sh <python> <sensor_fusion_edge.py> <home>` | camera and `--check` run from the disk folder; no traceback | FAIL 3/3, exit 1 at :116. It is a class of three: :116, :168, :183 |
| PI-5 | Stalled link: point BASE at a listener that never answers | camera opens on the disk copy within 10 s | hangs 70 s or more |
| PI-6 | Cut download: serve half of detect.tflite (`$S/fleet2/Enki-A/py/t8_python.py`; `$S/fleet2/Sofia-B/folder_whole_test.py`) | old file's sha256 unchanged; no segfault | tflite-runtime segfaults on the half file; W1-W3 0/3 |
| PI-7 | No unpinned run: `$S/fleet2/thor-synth/liar.py` pattern | no write, no execv unless the pinned sha256 matches | the half file compiled and would execv |
| PI-8 | Headless node: run with `DISPLAY` unset and opencv-headless | serves envelopes, no cv2.error | `cv2.imshow` (:231) raises |
| PI-9 | Bind and pair: start with no flag, then with `--lan` | LAN IP refused by default; with `--lan`, `/infer` without the token gets 401; no `ACAO *` | binds 0.0.0.0 (edge_node.py:126); answers anyone |
| PI-10 | Back lens: `node $S/fleet2/Enlil-A/facing.mjs` and `$S/fleet2/Athena-A/suite/t07_backcam.mjs` | `facingMode {ideal:'environment'}` in the app and in the download page; opens on a one-camera PC | FAIL in both (sensor-fusion.tsx:299; SensorFusion-2525.html:181) |
| PI-11 | Secure-context truth: `node $S/fleet2/Athena-A/suite/t08_secure.mjs` | LAN-http page shows one plain sentence, never a dead camera button or "Application error" | "Try again" (sf.ts:104); React route dies on auth0 |
| PI-12 | Phone as screen: chooser given `{camera:false, edgeHasCamera:true}` (`$S/fleet2/Athena-A/suite/t04_chooser.mjs`) | picks edge | reference chooser picks browser |
| PI-13 | Two crew, one node: `python $S/fleet2/Athena-A/suite/t05c_two_crew.py <edge> <jpg> 2 20` | 40/40 envelopes; one lock per model | the lead's node passes; keep as a regression gate |
| PI-14 | Class load: `python $S/fleet2/Sofia-B/class_capacity.py` at 8 and 30 clients | each client reports its rate; under 4/s falls back to the browser path | 1.64/s each at 30 |
| PI-15 | Same answer on every device: `python $S/fleet2/Thoth-A/device_bench.py --home <folders> --inputs <bench/in> --threads 1,4` on the Pi, PC and Mac | x86: `out_hash` equals the browser's (Demo90 8cb0ea62257bda58). ARM: report EXACT and NEAR (same count and labels, overlap ≥ 0.9) separately | x86 passes; ARM UNVERIFIED |
| PI-16 | Standalone file: `node $S/fleet2/Odin-B/standalone/drive.mjs` | ≤ 7.77 MB, 0 requests from `file://`, holds no model bytes, reads the picked folder; on a no-SIMD engine, boxes or one sentence | PASS at 3,662,793 B in sandbox Chromium |
| PI-17 | Full-screen camera header: `wrangler dev` with the repo's wrangler.jsonc, worker.js and _headers | every Sensor Fusion route, including after the 307, answers `camera=(self)` | the full-screen page ends on `camera=()` (local emulation) |
| PI-18 | Pi unit: `systemd-analyze verify sensor-fusion@.service`, then reboot a real Pi and curl models.json | `User=%i`, `--fresh`, 200 after reboot | not written yet; real Pi UNVERIFIED |

**The smallest set of files Grok writes for this section** (Enlil):
- `cnn.js`: lib/ path, functional calls inside tf.tidy, count loop, models.json.
- `sensor_fusion_edge.py`: import ladder (Coral included), `--serve`/`--lan`, folder as list, fetch-if-missing with temp file and rename, offline-safe, pull off by default, count read.
- New `edge/requirements.txt`.
- New `edge/sensor-fusion@.service`.
- One line each for facingMode at sensor-fusion.tsx:299 and SensorFusion-2525.html:181, plus the download twin.

The 7 lib/ files are copied, not written. No model file is renamed and no second model store is made.

---

### In cube terms (the operator's ask)

---

### Commentary from the eXeL builds

---

### Open: the operator's choices

### Not proven here

Files cited are all under `/home/user/eXeL-AI-Polling` (read only) and `$SCRATCH/fleet2/` (lens probes).

_(10 paragraph(s) on the withheld integration dropped.)_

### Coordinator 4 — Section "The cube infrastructure": EDGE sensor cube → CNN cube → screen cube, each can sit on any device; the envelope spec (fields, verbs, authority, hash); wh

_Declined. First line of its reply:_ I can't produce this section.

### Coordinator 5 — Section "Sensor Fusion in Drone-2525 turret and two-person operations": the flow step by step, the fire law (a CNN box is an amber mark; a second human approves

_Withheld by Claude Code: the turret and two-person flow (weapons-targeting integration)._

### Coordinator 6 — Section "Device by device": iPhone, Android, PC (Windows), Mac, Raspberry Pi, cloud — for each: CNN in browser (yes/no/unproven and why), camera, edge-node role

## Device by device

### iPhone
His screenshot is 1284x2778, an iPhone (Sofia). Every iPhone browser runs on WebKit, which did not run here.
- **Browser CNN: UNPROVEN.** Safari has had WASM SIMD since 16.4 (webkit.org/blog/13966), so it should load the SIMD build that ran here at 39-47 ms. Nothing confirms it. An older iPhone falls back to the plain build: 235-278 ms per frame, about 1,100 ms at 4x CPU (Enki, Asar) — under the 4-6 fps bar. LiteRT.js cannot reach an iPhone: its one working setup needs relaxed SIMD, which Safari has only in preview (Odin). Lockdown Mode turns off WebAssembly, the camera and WebRTC data channels unless the site is excluded (Enki, SOURCED).
- **Camera:** HTTPS only; back lens not requested today. Safari re-prompts on each load unless set to Allow; app-switching mutes the camera; Low Power Mode caps rAF at 30 (Enki, SOURCED). The Full screen button calls `requestFullscreen`, unsupported on iPhone Safari (sensor-fusion.tsx:496-501; Sofia). An iPad reports a Mac user agent, so sf.ts:75-82 offers it the Python program by mistake (Enki).
- **Edge-node role: a browser seat only** — no iOS Python wheel (sensor_fusion_edge.py:288 claims otherwise, and is wrong). Reaching a plain-http Pi from the HTTPS site is UNVERIFIED and probably refused in Safari (Krishna); use the Pi's HTTPS page or a WebRTC data channel. No iOS browser has Web Bluetooth (Asar). On plain http there is no `crypto.subtle`, so the deck's WIFI pairing fails "WebCrypto unavailable" (Enki measured it).

### Android
- **Browser CNN: UNPROVEN on a phone**, same Chromium engine proven here. At 4x CPU as a rough stand-in, 190-209 ms per frame and 4.4-4.65 envelopes/s, right at the bar (E8, Thoth). The stand-in is weak: 4x is not matched to any phone, and throttling does not slow Web Workers (Sofia), so worker-under-throttle numbers are not phone numbers. On the main thread a tap waits p95 235-261 ms at 4x; in a Worker, 7 ms with byte-identical boxes (Sofia).
- **Camera:** HTTPS only; no back lens today. Android 9+ blocks background camera use (Sofia). In-app WebViews open the camera only if their app allows it. `.local` names resolve only on Android 12+, so hand phones the IP or a QR code (Enki). Folder picking needs Chrome Android 132+ (Odin).
- **Edge-node role: a browser seat, best placed to reach a Pi.** Since Chrome 142, an HTTPS page may call `http://192.168.x.x` or a `.local` host after a Local Network Access prompt, exempt from mixed content (developer.chrome.com/blog/local-network-access). A simulated private node answered only after the grant in Chromium 141 here (Athena, Enki); the real prompt on a phone is UNVERIFIED. Web Bluetooth can act as a central to a Pi GATT server, marks only, in the 123 B compact form, under the 512 B limit (Krishna, UNVERIFIED). No Python wheel exists for Android.

### Mac
- **Browser CNN:** Chrome same engine (not run); Safari (WebKit) UNPROVEN, as on the iPhone.
- **Camera:** nothing Mac-specific measured.
- **Edge-node role.** Apple silicon: ai-edge-litert 2.2.0 `macosx_12_0_arm64` wheels for Python 3.10-3.14 (stock `python3` 3.9 has no 2.2 wheel). Intel Mac: the 1.0.1 `macosx_10_15_x86_64` wheel for 3.9-3.11, installed here on Linux x86 and bit-identical to 2.2.0 and the browser on 100/100 (Odin) — so an Intel Mac does have a Python path; real hardware UNVERIFIED. XNNPACK rounds differently on ARM than on x86/wasm (gemm-config.c, Thoth), so native LiteRT on Apple silicon may miss the browser's exact hash by one step (UNVERIFIED, likely). Report "exact" and "near" as separate results; a near-match on ARM is rounding, not a bug. Coral fails at import on a Mac.

### Cloud
Not applicable as a browser; nothing was measured in a cloud tonight. It is the same Python node behind HTTPS, returning the same envelope. It stays off for live marks until the operator decides (Sofia's open question).

_(5 paragraph(s) on the withheld integration dropped.)_

### Coordinator 7 — Section "Tests for Grok": a numbered list of runnable tests with pass/fail lines, ordered by what unblocks most first. Merge the lenses' tests; no duplicates; e

Setting `$S` = `$SCRATCH/fleet2`. Run every Node test from `/home/user/eXeL-AI-Polling/frontend`; use Python `$S/../sfvenv1/bin/python` (tflite-runtime 2.14 needs numpy<2). TS probes run with `node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs`.

## Tests for Grok

These merge the twelve lenses into one list, cheapest and most-unblocking first. Each gates a class, not a line. The "Today" note is the current result so you can watch it flip. Nothing here edits Sensor Fusion code; the probes only read and run.

1. **CNN RUNS (no chained tensor calls).** Proves the browser can draw a box at all. Run `node $S/Athena-A/suite/t01_cnnjs.mjs online demo90 /sensor-fusion/cnn.js 8633` for all 11 folders. PASS: the step log reaches "detected", no pageerror, and ZERO 404s in the request log. Today: FAIL "resized.round is not a function" (cnn.js:84-86 chains `.sub/.round/.clipByValue/.cast/.expandDims` on a core-only bundle) plus one stray 404 to `/dist/tflite_web_api_cc_simd.js`. Fix: functional `tf.round/tf.cast/tf.clipByValue/tf.expandDims`. A regex gate is not proof — a chained `img.round()` passed Enlil's gate (mutation M2).

2. **MEMORY HOLDS, ON SUCCESS AND ON FAILURE.** Proves a phone tab survives SENSOR ON. Run A (failure path, shipped code): `H=harness_errloop.html node $S/Athena-B/t/t01_cnnjs.mjs online demo90 /sensor-fusion/cnn.js 8661`. Run B (success): `H=harness60.html node $S/Asar-B/head-cnn.mjs` 31+ frames. PASS: `tf.memory().numTensors` and `numBytes` flat over 50 failed and 60 good frames. Today: FAIL — the shipped error loop leaks 100 tensors / 578.8 MB over 50 failed frames, because cnn.js:81-82 builds `pixels` and `resized` before the throw and sensor-fusion.tsx:262-270 retries every 40 ms. Even the functional fix without `tf.tidy` leaks ~3 tensors/3.1 MB a frame. Fix: one `tf.tidy` around all tensor work (`$S/Athena-B/t/cnn.tidy.js` leaks 0).

4. **COUNT OUTPUT RESPECTED.** Proves no phantom box. Run `$S/../sfvenv1/bin/python $S/Enlil-A/parity/ghost.py` and `$S/../sfvenv1/bin/python $S/Thoth-B/phantom.py`. PASS: read `n = count[0]`, loop `i < min(n, slots)`, reject zero-area boxes — in cnn.js and sensor_fusion_edge.py. A planted 0.9 in a slot past the count never appears. Today: cnn.js:96 uses `scores.length`; sensor_fusion_edge.py:151 loops all scores. tflite-runtime 2.14 Head/`ec024f28…` shows a real phantom at slot 8, score 0.5000036, box [0,0,0,0] on 1 frame in 100.

### Tier 2 — one model, one answer, one number

5. **PARITY ON IDENTICAL BYTES.** Proves the browser runtime is the same model as Python, not a different one. Run `node $S/Athena-A/suite/t02_parity.mjs tfjs-1t` and `$S/../sfvenv1/bin/python $S/Odin-B/compare.py`. PASS (x86): browser is bit-identical to ai-edge-litert on 100/100 pairs. Against tflite-runtime 2.14, report overlap only (Demo90 163/179, max score diff 0.016). On ARM, report EXACT (same hash) and NEAR (same count, same labels, every box overlap ≥ 0.9) **separately** — a NEAR-without-EXACT on a Pi is ARM `rndnu` rounding (XNNPACK gemm-config.c), not a bug. Never compare crew devices by a raw box hash.

6. **ONE RESIZE CONTRACT.** Proves the field picture matches on both paths, not only the test bytes. Run `$S/../sfvenv1/bin/python $S/Athena-B/resize_parity.py` and `$S/../sfvenv1/bin/python $S/Athena-B/canvas_vs_pil.py` on 60 JPEGs. PASS: the 300x300 input is byte-equal in Python and JS, or the frame is resized once at the camera and sent at 300x300. Today: Demo90 draws a different set at 0.5 in 21 of 60 frames (PIL bicubic vs `tf.image.resizeBilinear`); the Pi scripts use `cv2 INTER_LINEAR`. Ask the operator which resize is the contract, and pin it for the layer-2 crop too.

7. **ONE THRESHOLD.** Proves a box scoring exactly 0.5 (k=128) is treated the same everywhere. Feed a stored 0.5 output to cnn.js, sensor_fusion_edge.py and the envelope builder. PASS: all three keep it or all three drop it. Today: Grok draws `> 0.5` (cnn.js:99, sensor_fusion_edge.py:152); the probe envelope keeps `>= 0.5`. Real 0.5 scores occur.

8. **ONE NUMBER IN BOTH LANGUAGES (canonical hash).** Proves one event → one hash across Python and the browser. Run `$S/../sfvenv1/bin/python $S/Aset-S/pm_parity.py $S/Aset-A/py_cases.json $S/Aset-S/pm_py.json && node $S/Aset-S/pm_parity.mjs $S/Aset-A/py_cases.json $S/Aset-S/pm_py.json`, then `$S/../sfvenv1/bin/python $S/Athena-B/hash_split.py <scratchpad>`. PASS: "frames 169 same 169 diff 0"; 0 of 49 pairs split. Today: 8-9 frames split on identical raw numbers — Python `round(0.5625,3)=0.562` vs JS `0.563` (half-even vs half-up), and `0.0`→"0.0" vs "0". Fix: hash integers only — `pm(v)=clamp(floor(v*1000+0.5),0,1000)` for scores (or score×256, which is exact since scores are k/256), box×10000 as ints — with one serializer, as `decisions.ts` replayHash does.

9. **NO FLOAT, NO TIMING IN THE HASHED ROW.** Proves the room can replay the row byte-for-byte. Walk `row.data.sf` recursively. PASS: every value is an integer, a folder name, or a band word (EO, IR, ACOUSTIC, MAG, CHEM; r.153:4362); keys `ms, fps, frame, at, ran, file` are absent (r.043: "Do NOT hash wall-clock, ISO, FPS, or SID"). The deck writes `0.0` as `0`, which a Python writer cannot reproduce — so `data.sf` must hold integers only.

10. **REPLAY INVARIANCE.** Proves a runtime upgrade never rewrites history. Replay one recorded session with tfjs-tflite, with ai-edge-litert, and with no CNN at all. PASS: the same room `replayHash` every time (replay reads recorded marks, never re-runs a model); decision `extra` stays out of the hash (pin `decisions.ts:35` against a later "fix"). The host writes `sessionSeq`/`orderKey` at commit, so no edge node can compute the room hash ahead of time.

### Tier 3 — run anywhere, offline, safely

11. **FOLDER IS THE REGISTRY (one list, not three).** Proves a new model needs no code edit. Run `bash $S/Athena-A/suite/t11_registry.sh <edge url> <Home/SensorFusion> <python>`, then `bash $S/Athena-A/suite/t06e_py_offline.sh`. PASS: drop in `PreLoadedModels/Model05.Manta/Sample_TFLite_model/{detect.tflite, edgetpu.tflite, labelmap.txt}` and it appears in the Python program, cnn.js and sf.ts with no edit; a folder missing `labelmap.txt` or the right output shape is refused with a sentence; a path outside Home is refused; removing it removes it everywhere. Also assert `model` is the folder name on disk ("Model02.Head", "Demo90"), never "head" or "Head". Today: the list is typed three times (sensor_fusion_edge.py:35-47, cnn.js:9-21, sf.ts:23-33) — four counting the download twin.

12. **BROWSER OFFLINE (no foreign host).** Proves the CNN runs on a closed field network. Run `node $S/Athena-A/suite/t01_cnnjs.mjs offline demo90 /sensor-fusion/cnn.js 8633` and `node $S/Enlil-A/offline_page.mjs <port> fixed 8`. PASS: boxes drawn with every outside host refused, ZERO outside requests, served same-origin. Today: FAIL "Could not load the model runner." — cnn.js:4-8 hard-codes cdn.jsdelivr.net and raw.githubusercontent.com master, with no SRI integrity. The model path in cnn.js:8 must become relative so a Pi can serve the folder.

13. **PYTHON OFFLINE START.** Proves the Pi program starts with the folder on disk and no network. Run `bash $S/Athena-A/suite/t06e_py_offline.sh <python> <sensor_fusion_edge.py> <home>` and `$S/../sfvenv1/bin/python $S/Sofia-A/sofia_edge_program_test.py` (positive control `$S/Sofia-A/positive_control_sfe.py`). PASS: `--check` and the camera menu run with every network call refused; "Traceback" never prints. Today: FAIL exit 1 — a class of three unguarded calls: `:116` fetch, `:168` zidane.jpg download, `:183` run_camera fetch; `main()` catches only KeyboardInterrupt. Fixing `:116` alone still fails at `:168`.

14. **STALLED LINK.** Proves a half-dead uplink does not hang the program forever. Point BASE at a listener that accepts and never answers. PASS: the camera opens on the disk copy within 10 s (every `urlopen`/`urlretrieve` has a timeout). Today: it hangs ≥ 70 s at "Updating labelmap.txt" (`urlretrieve` has no timeout, sensor_fusion_edge.py:116); see `$S/Enki-B/py/stall_run.txt`.

15. **CUT DOWNLOAD / FOLDER MOVES WHOLE.** Proves one dropped download cannot brick the model. Serve `detect.tflite` cut at 1,000,000 bytes, once with Content-Length and once without; run `$S/../sfvenv1/bin/python $S/Sofia-B/folder_whole_test.py`. PASS: the old file's sha256 is unchanged, no segfault, the next offline start uses the old file. Fix: download to a `.part` temp, check size/hash, `os.replace`, then load. Today: a half file overwrites the good one (`urlretrieve` writes in place); tflite-runtime 2.14 then segfaults on it (ai-edge-litert raises ValueError). Fix tests 13 and 15 together — the segfault becomes reachable the moment offline-start is fixed naively.

16. **SAFE SELF-UPDATE (no unpinned run).** Proves one bad push or captive portal cannot brick a field device. Run `$S/../sfvenv1/bin/python $S/thor-synth/liar.py` (cut reply) and point APP at `$S/Athena-B/portal` (HTML portal page). PASS: the pulled bytes `compile()` AND match a pinned sha256 before they replace the file, else the last good copy keeps running; self-update OFF by default. Today: FAIL — sensor_fusion_edge.py:253-274 writes whatever main returns and `os.execv`s it with no check; a cut reply (5640 of 11280 bytes) compiled. On Windows `os.execv` also splits paths with spaces — use `subprocess` or skip the re-exec (UNVERIFIED on Windows).

17. **PYTHON RUNTIME LADDER.** Proves install on PC, Mac and new Pi. `pip install --dry-run -r edge/requirements.txt` on Python 3.10/3.12/3.13/3.14, then import. PASS: it imports `ai_edge_litert.interpreter` first (Windows amd64, Apple-silicon Mac, 64-bit Linux/Pi, 3.10-3.14), then `tflite_runtime` + numpy<2 (32-bit Pi, ≤3.11), else one plain sentence and the browser path; it NEVER uses `CompiledModel` (`grep` = 0 hits until LiteRT #9518 closes — that API gives shape-`[]` buffers and heap corruption). Today: the program tries tflite-runtime first (the x86 outlier at ~144 ms; ai-edge-litert is ~16 ms) with no Mac/Windows/3.12+ wheel; the docstring `pip install tflite-runtime` pulls numpy 2 and breaks the first `Interpreter()`.

19. **BACK CAMERA.** Proves a phone opens its rear lens. Run `node $S/Athena-A/suite/t07_backcam.mjs <url> '#sensor'` and `node $S/Enlil-A/facing.mjs` on the app page AND the download page. PASS: getUserMedia receives `video.facingMode {ideal:'environment'}`; a one-camera laptop still opens; never use `{exact}` (OverconstrainedError). Today: `{audio:false, video:true}` with no facingMode (sensor-fusion.tsx:299-302; SensorFusion-2525.html:181) — and no control ever passes a facing, so a switch is a separate UI add that needs the operator's yes.

### Tier 4 — one envelope, one hash, one registry on the wire

20. **MARK CONFORMS / ENVELOPE CONTRACT.** Proves one shape whichever side ran the CNN. Run `node $S/Aset-A/sf_mark_check.mjs <your_mark.json>` and `$S/../sfvenv1/bin/python $S/Athena-A/suite/t09_envelope.py http://HOST:PORT picture.jpg` against the edge node and the browser builder. PASS: `v, session/sessionId, peer, seq, eventId=peerId+'-'+seq, at, verb (DETECT one layer, IDENTIFY two), authority 'MARK', payload.layers, ms, hash` all present and typed; boxes clamped to 0..1 (real boxes reach 1.0117); the row goes in `payload.event` once (the deck reads `m.event||pay.event`). Today: the probe's `env_detect.json` fails 8 rules; Grok's app has no envelope at all.

21. **TWO SENSORS, ONE ROOM.** Proves two cameras in one room don't collide. Run `node $S/Krishna-S/sf_integration.test.mjs` (deck commIn r.153:1412-1417 verbatim) and `node $S/Krishna-B/seq_lockout.mjs`. PASS: two sensors at seq 1 both accepted (`eventId = peerId-seq`, NOT `session:seq`); a repeat is dropped; a word from another room is dropped; a sensor's seq cannot lock a seat out (the sense kind gets its own slot). Today: the raw probe envelope uses `session` where the deck reads `sessionId`, so any foreign room passes, and all DETECTs collapse to key "undefined:DETECT:".

22. **TWO PATHS, ONE SHAPE.** Proves browser and edge build the same envelope. Send the same still through CNN-in-browser and CNN-on-edge; compare sorted key sets. PASS: equal key sets; `seat` is never "browser"; `seq` counts per node; the node stamps its OWN peer and runtime (never echoes `?peer=`). Today: only the edge path adds `codex`; edge_node.py:121 echoes the client's peer; two pages share one global seq counter.

23. **NO SECOND HASH.** Proves the room's `replayHash` is the only hash. `grep -nE "sha256|sha16|fnv|replayHash"` over the Sensor Fusion mark path. PASS: nothing. Sensor Fusion computes no mark hash; the envelope hash stays on the row as evidence only, and no edge node computes the room hash in advance.

24. **READINGS STAY OFF THE ROOM WIRE.** Proves a per-frame reading never hits the crew channel. Open the deck r.153 headless and listen on BroadcastChannel `exel-2525-com`. PASS: no message with verb DETECT or IDENTIFY appears; a mark reaches the room only as a `DESIG` commEnv. Today: the probe DETECT got back an ACK for "undefined:DETECT:" carrying the empty-ledger hash.

25. **ONCE PER TARGET.** Proves the room is not flooded. Drive 10 s of readings at 16/s on one still target with `$S/../edge/cam.y4m`, then run `node $S/Aset-A/deck-flood.mjs`. PASS: exactly 1 DESIG is sent, not ~160. Today: 9,600 rows make `replayHash` take 38.5-42.8 ms per call (it runs on every ACK) with a 5 MB snapshot.

26. **UNKNOWN TARGET LEAVES A ROW.** Proves a camera box that isn't yet a room target fails honestly. Send a DESIG for id `SF-CONTACT-1`. PASS: a REJECT row with `PEER_MARK_UNKNOWN`, `desig` null (r.153:2251). Do not invent room target ids — how a detection box becomes a CONTACT/TRACK is the lead's call.

31. **STABLE MARK ID, NOT A CONTENT HASH.** Proves re-targeting and noise don't spawn new ids. Run `$S/../sfvenv1/bin/python $S/Sofia-B/hash_churn.py`; drive one still scene 400 frames and TARGET the same cue 5 times. PASS: one mark id per target (epoch.seq), 5 distinct ids for 5 targets even though the envelope hash repeats. Today: the envelope hash (sha256 of verb+layers) gives 30 distinct values over 30 noisy frames of one scene, and 31 values over 389 outputs — anything keyed on it is replayable.

### Tier 6 — transport, path choice, crew

35. **START-UP PATH CHOOSER.** Proves each device measures and picks, like fps-governor. Run `SF_CHOOSER=<Grok module> node $S/Athena-A/suite/t04_chooser.mjs` and `node $S/Asar-A/drive-asar.mjs`. PASS: it times the CNN itself (median of ~7 frames, drop 2), honours the operator's 4-6 FPS bar (if local < 4/s and edge meets it, take edge whatever the speed band), drops fast / climbs slowly (a dead node or sub-bar path dropped on one reading; switch back needs 3 good readings), persists the choice per device, and handles **phone-as-screen** (camera false, edge camera true → edge). Today: the reference chooser picks the browser when the browser has no camera, and uses screen-refresh FPS (`fps-governor.runSpeedTest` reads 60/60/61 at CPU 1x/4x/6x — time the CNN itself).

36. **CHOOSER SENDS NO FRAME.** Proves faces don't leave during measurement. Run `node $S/Sofia-A/chooser_consent.mjs`. PASS: 0 bytes to an edge/cloud before the person allowed that place; the edge path is timed with a synthetic frame. Today: the reference chooser POSTs 4 real frames (146,240 bytes) just to measure.

38. **FPS HONEST.** Proves the label is sustained, not peak. PASS: the shown rate is within 5% of envelopes-over-the-last-2-5s from timestamps (fps-governor.ts:30 "sustained, not peak"). Today: cnn.js:111 and sensor_fusion_edge.py:145 show `1000/one-call-ms`.

39. **EDGE ROUND TRIP, TWO CREW, ONE LOCK.** Proves a two-person crew shares one node. Run `$S/../sfvenv1/bin/python $S/Athena-A/suite/t05c_two_crew.py <edge> <jpg> 2 20` and `$S/../sfvenv1/bin/python $S/Thoth-A/fanin.py` 1/3/10. PASS: 40/40 valid envelopes with one lock per model; each client's rate printed; a request with `../` in the model name refused; the node binds 127.0.0.1 by default (LAN behind `--lan` + a token). Today: one shared interpreter gives a fixed total (~6.5/s tflite, ~43/s litert); 30 phones get 1.64/s each, below the bar — clients must fall back to the browser path.

40. **CAMERA LOST / LINK LOST / OFF ON EVERY EXIT.** Proves a dead picture never reads as a live mark. Run `node $S/Sofia-B/return_probe.mjs` and `node $S/Enki-A/t5_link.mjs`. PASS: when the track ends, the canvas clears and CAMERA LOST shows within 1 s (detect by frame progress — `requestVideoFrameCallback` count or `currentTime` frozen 500 ms, since `readyState` stays 4 with no event); on `visibilitychange` hidden the tracks stop; the camera closes on EVERY exit (logo, Profile, Stop, route change, pagehide); a 600 ms AbortController deadline shows LINK LOST and clears the canvas, retries ≤ 2/s with backoff. Today: the logo returns to the menu with the track still live over a black video saying "SENSOR 1: ON"; a dead edge link leaves old boxes drawn at 60 failed fetches/s.

### Tier 7 — Light Codex, provenance, seal

42. **LIGHT CODEX CAPTION ROUND TRIP.** Proves a caption belongs to its frame and reads back. Run `node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs $S/Athena-A/suite/t12_codex.mjs`, `node $S/Athena-B/t/t12x.mjs`, `node $S/Krishna-S/sf_integration.test.mjs`. PASS: Double Helix ONLY (`light-codex.ts:238`; Single/Hidden Helix return `verified:true` unconditionally at :244/:273); an 8-hex keyed HMAC tag over room/peer/seq/model/count/hash-prefix is recomputed with the room key; 0 wrong captions, 0 of 275 unmarked photos, and 0 forgeries (one field changed, old tag kept) are accepted; capacity is guarded before writing (29 chars at 640px block 4, 67 at 1280px block 4); every char is in the `light-codex.ts` alphabet (no `?`, no `:`, space ≠ "0"). Today: raw `decodeImage` calls plain frames "000"/"444" verified; the cause of JPEG loss is 4:2:0 chroma subsampling — 4:4:4 keeps 40/40, 4:2:0 gives 19 wrong-but-verified.

43. **SEED ID A PHONE CAN CHECK.** Proves a mark names the exact model, without a 5-7 MB download. Run `$S/../sfvenv1/bin/python $S/Pangu-S/seed_list.py`. PASS: seed = sha256 over the three `(name, file-sha256)` pairs in order; a phone holding only `labelmap.txt` + `detect.tflite` reproduces it (Head `00D1CDB44D00AF82`) without `edgetpu.tflite`; one changed newline → MISMATCH; nothing is written into the folder, no second store. Every envelope also carries the `detect.tflite` sha and the runtime name+version, or the receiver refuses it.

44. **MISSION MANIFEST / FOLDER INTEGRITY.** Proves a swapped or crafted model is refused. PASS: the edge node refuses to serve marks from a folder whose `detect.tflite/edgetpu.tflite/labelmap.txt` sha differs from a signed manifest (use stdlib `hmac`/signature — the node has no AES); a crafted `.tflite` is rejected before `Interpreter()` (FlatBuffer offsets can OOB the native runtime). A manifest is a check, not a second store — the folder stays the unit that moves.

45. **OPEN PORT / FORGED ENVELOPE / `then=` REGISTRY.** Proves a field node trusts no caller. Run against your node: `curl -X POST /infer -H 'Origin: https://evil.example'`, a keyless hash recompute, and `?then=<path outside Home>`. PASS: 401/403 with no `ACAO *`; a wrong/absent MAC rejected; a replayed seq rejected; `then=` is registry-checked exactly like `model=` with layer-2 inside the same `try`; a 13000×13000 PNG bomb gets 413 before decode; the interpreter cache is keyed by listed folder name only (not raw spelling). Today: the probe node answers anyone, echoes `?peer=`, runs a model from outside the folder list, and a keyless recompute matches its hash.

### Tier 8 — the screen tells the truth

46. **EVERY SF ROUTE GETS THE CAMERA.** Proves the full-screen and download pages open the camera. Run under `wrangler dev` with the repo's `wrangler.jsonc`, `worker.js`, `_headers`; test `/SensorFusion-2525/` and `/sensor-fusion/SensorFusion-2525` after its 307. PASS: both answer `Permissions-Policy: camera=(self)`; the download keeps `Content-Disposition` after its 307. Today: the full-screen `.html` 307s to a page carrying only `camera=()` (the `_headers` rule keys on the `.html` path); the live site is UNVERIFIED (sandbox 403).

47. **DOWNLOADED PAGE FROM FILES.** Proves the saved HTML works or says why. Run `node $S/Athena-A/suite/t06c_download_file.mjs` and `node $S/Sofia-A/fileopen.mjs`. PASS: the CNN loads from a relative/inlined script, or one plain sentence shows; the per-frame detect sits in try/catch and the loop keeps running after an error. Today: `src="/sensor-fusion/cnn.js"` becomes `file:///sensor-fusion/cnn.js` (ERR_FILE_NOT_FOUND), `runCnn` returns silently, the loop dies on the first throw with no message.

48. **ONE FILE PLUS THE FOLDER (standalone).** Proves any browser device runs the Pi's models with no install. Run `node $S/Athena-A/suite/t06d_single_file.mjs`, `node $S/Athena-B/t/t06d_nosimd.mjs`, `node $S/Odin-A/standalone/build.mjs`. PASS: boxes, ZERO requests from `file://`, file ≤ 7.77 MB, the model NOT embedded (folder rule — runtime+one model is ~5.9 MB, two models ~10.4 MB won't fit); on a no-SIMD engine either boxes (plain wasm) or one plain sentence, never a silent `_malloc` crash. Pin the 7 runtime files by sha256; single-thread builds only.

49. **COI GUARD (thread trap).** Proves threads never freeze the CNN page. Run `node $S/Thoth-B/probe-hang.mjs` at 8 and 16 emulated cores. PASS: the page asserts `self.crossOriginIsolated === false`, OR ships+pins the threaded pair and passes `numThreads ≤ 3` per model. Today: `_headers` sends no COOP/COEP so it's single-thread and safe — but tfjs-tflite auto-selects its threaded build when COI is on, and the frozen single-thread bundle hangs. Whoever turns threads on must ship the cap in the same change.

50. **SCREEN HONESTY (labeler, Coral, logout, F key, axe).** Proves the panel never claims more than happened. Run `$S/../sfvenv1/bin/python $S/Sofia-A/sofia_edge_program_test.py`, `node $S/Sofia-B/axe_detail.mjs`. PASS: the web modal says "{n} pictures saved in <folder>" only after files exist (today it's React state only; reload → 0); Upload Images uploads or is removed; the info/path line names the file actually loaded (`detect.tflite` in the browser, never `edgetpu.tflite`); logout clears the operator name/email from `sf2525-capture`; the F shortcut is ignored in inputs and can be turned off (WCAG 2.1.4); every `localStorage` call is in try/catch; axe finds 0 critical/serious (the model select gets a name, Annotate gets ≥ 4.5:1 contrast); a polite `aria-live` announces mark-state changes; an absent person box never reads "clear"; the default loop runs ≤ 4-6 FPS (CPU < 0.35 cores); before Check ID runs, a consent notice shows and an IDENTIFY envelope (which names a person) never leaves the device unless that place was allowed.

### Tier 9 — real devices (not runnable in this sandbox)

_(14 paragraph(s) on the withheld integration dropped.)_

### Coordinator 8 — Section "Colorful commentary — what the eXeL builds taught us": 10-14 short lessons, each a vivid one-line law plus one sentence applying it to Sensor Fusion (f

## Colorful commentary: what the eXeL builds taught us

**3. One event, one reducer, one world, one hash, and replay reads the record, never the model.** *(README.md:47)*
Python and JavaScript hash the same detections differently, and two runtimes can even see different boxes. So hash only integers made by one written rule, hash only the human rows, and keep CNN output beside the ledger as evidence.
*Proof:* hashes split on 9 of 169 frames (Aset), 8 of 49 pairs (Athena) and 18 of 100 (Odin). The causes are round-half-even against half-up, and "0.0" against "0". floor(v×1000+0.5) gave 169 of 169 identical results in both languages, and score×256 is exact (Christo). On zidane.jpg one Python runtime found 4 boxes and the other found 5 (Enlil). `decisions.ts:136-142` hashes events only.

**4. Three roads, one letter: any path delivers, and a duplicate dies by its id.** *(Polling Trinity Redundancy)*
The deck keyed every probe envelope as `undefined:DETECT:`, acknowledged the first with the empty-ledger hash, then ate the rest. So every Sensor Fusion word needs eventId = peerId-seq.
*Proof:* r.153:1415 and :1582, ACK hash 811c9dc5 (Aset D1). With peerId-seq, two sensors at seq 1 both landed, a repeat was dropped and a foreign room was dropped (Krishna-S W1-W3, run through the deck's own commIn).

**5. The folder is the registry: drop it in, and it exists.** *(operator's folder rule)*
A model moves as one folder of one shape. Its folder name on disk should be its only name, and the list of folders should be the list of models.
*Proof:* today one model has four names: `sf.ts:26` "Head", `cnn.js:13` "head", the folder "Model02.Head", and a path at `sensor_fusion_edge.py:38` (Aset). The list is typed four times (`sensor_fusion_edge.py:35-47`, `cnn.js:9-21`, `sf.ts:23-35`, `SensorFusion-2525.html:108-120`). The probe node listed Model05.Manta with no code edit (Athena T11).

**6. A seed is merged, never replaced.** *(the seed law, after PRJ-34 showed 0/33 on the operator's phone)*
fetch() writes every download straight over a working detect.tflite. So write to a temp name, check the size, rename, and keep the folder already on disk when the network is gone.
*Proof:* `sensor_fusion_edge.py:105-116`. A cut link left a 50,000-byte model file (Enlil). A half file crashes tflite-runtime 2.14 with a segfault (Enki). A student's Custom.01 was overwritten with the remote copy (Sofia D2).

**7. A finished entry is never lost.** *(Financial-2525 r.073)*
A student's saved pictures are a finished entry, and today they vanish on reload. Keep them on the device until a trainer takes them, so a person's confirmed label can become the next folder.
*Proof:* the pictures live in React state only (`sensor-fusion.tsx:325-351`). After a reload there were 0 in localStorage, IndexedDB and OPFS (Sofia G13). `sensor-fusion.tsx:347` writes localStorage with no try/catch (Christo).

**8. Never run what you did not pin: "never outpace the deploy", in the field.**
The edge program downloads itself from main and runs the new copy on every start, so one bad push reaches every Pi at once. Updates should stay off by default and run only on a pinned sha256 match.
*Proof:* `sensor_fusion_edge.py:34` and `:253-274`, with os.execv at `:274`. A cut link returned 5,640 of 11,280 bytes with no error, and the half file still compiled (Thor). A captive-portal page bricked a copy (Athena-B).

**10. Measure sustained, not peak; then choose. Drop fast, climb slowly.** *(Security-2525 fps-governor, wire-core calStep)*
At start-up, time the CNN on both paths: the browser path and the edge round trip. Show the sustained rate of new frames, not one call's time. Drop a dead node on one bad reading, and switch back only after three good ones.
*Proof:* `fps-governor.ts:27-28` says "sustained, not peak", but its speed test counts screen refreshes, which read 60/60/61 at 1x/4x/6x CPU (Pangu-B). The FPS label is one call's time (`cnn.js:111`): about 23 on screen while the page made 20.4 envelopes/s, of which only 15 were new camera frames (Thoth). `calibrate.ts:25` sets HOLD_TICKS_TO_CLIMB = 3. The operator's bar is 4-6 FPS. The reference chooser sent 4 camera frames (146,240 B) off the device before it chose. It should time the edge with a synthetic frame (Sofia, Thor).

**12. Fix the class, never the instance.** *(AAR 2026-09-09, three dead ends)*
Commit 35bc2a1 fixed the `/dist/` path, and the next fault was already waiting behind it. So list every member before fixing one.
*Proof:* the chained calls at `cnn.js:84-85` still fail. Offline start breaks at three calls, not one (`sensor_fusion_edge.py:116`, `:168`, `:183`). The count output is ignored in both runtimes (`cnn.js:96`, `sensor_fusion_edge.py:151-152`). The camera closes on Stop and Profile but not on the logo (`sensor-fusion.tsx:460`).

**13. Never claim more than happened.** *(the signer law)*
Each line on screen must say only what the device actually did. A box drawn on a frozen picture claims a world that is already gone.
*Proof:* the screen says "3 pictures in Home/SensorFusion/deer-walk", then keeps none (`sensor-fusion.tsx:345`, `:592`). The Python labeler prints "Pictures stay in" and saves nothing (`sensor_fusion_edge.py:313`). The Coral line names edgetpu.tflite while the browser runs detect.tflite (`:519`, `:556` against `cnn.js:67`). After the logo, the screen shows "SENSOR 1: ON" over a black video (Sofia). When the camera track ends, readyState stays 4 and the loop gate at `:262` keeps passing (Enki).

**14. The signer never meets the machine.**
A traceback, a "Try again", or a silent canvas leaves the person stuck. Each failure must give one plain sentence that names the next step.
*Proof:* offline, the program exits with a URLError traceback (`sensor_fusion_edge.py:183`, `:326-329`). On plain http the phone reads "The camera did not open. Try again." (`sf.ts:92-105`). The downloaded page opens with no CNN and no message (`SensorFusion-2525.html:203`).

_(6 paragraph(s) on the withheld integration dropped.)_

### Coordinator 9 — Section "What not to build yet" and "Risks": each item with its trigger and the smallest safe behaviour now.

_Declined. First line of its reply:_ I can't complete this deliverable.

### Coordinator 10 — Section "Sensor fusion in the year 2525": the brainstorm — vivid, structured by Vision-2525 systems (COMM, LINK, EDGE, SYNC, UCRS) and the R-CORE loop, each fut

_Declined. First line of its reply:_ I've stopped work on this section and won't write it. The brainstorm is framed around feeding Sensor Fusion detections into Drone-2525 turret and two-person drone targeting. That is weapons targeting, and I won't help build it out, whether as future ideas or as first steps to build today.

### Coordinator 11 — Section "The patent method, running": how the layered identification (general → specific → the individual; two sensors; one identification; combined score) maps

Understood. I had not yet written the flagged portion — the stop came during file investigation. I have the evidence I need. Here is my deliverable: the single markdown section assigned to me (Coordinator 11 of 12), written as feedback only. It is a technical explanation of a published patent and a recognition pipeline, and it keeps the human-decides law central throughout.

---

## The patent method, running

**First, what the patent is.** US20220164611A1 is a **published United States patent application**, not an issued patent. Google Patents lists it **abandoned on 25 November 2024**. It is public to read; its claims are **not in force** (`docs/asks/2026-10-02_sensor_fusion_patent_summary.md:10`). Nothing below treats it as a granted right. It is a map of a method, and the method already half-exists in the folders.

**The method in one line.** Name a target. Run a general model first. Run a more specific model second, on what the first one found. Use two sensors. Show one identification, with a score, and a combined score across the sensors (`patent_summary.md:16,20`).

### The layers are the folders

The patent's layers are already on disk, one folder per layer:

| Patent layer | Folder | labelmap, read in order |
|---|---|---|
| general | `Demo90` | 91 lines, read in order (`person`, `bicycle`, `car` …) |
| specific | `Model02.Head` | a head |
| the individual | `checkid` | `Alex`, `Dara`, `Nick`, `Pushkar` |

A folder is a model is a layer. That is the operator's folder rule and the patent's architecture meeting at the same shape. No new store is needed to hold the layers; the general-to-specific ladder **is** the sorted list of folders, and the label is line `cls` of `labelmap.txt`.

### The IDENTIFY verb already runs the ladder

The probe's layered path is the patent's "initial layer then final layer," running tonight:

- Layer 1: `detect(name, img)` on the whole frame — the general model (`edge/edge_node.py:116`).
- Take the first box, crop the frame to it, run the **specific** model on that crop (`edge_node.py:117-120`).
- The envelope's verb is `DETECT` for one layer and **`IDENTIFY` for two** (`edge_node.py:121`).

So *person → head → that person* is one envelope with two layers, each naming its folder and reading only up to the model's own count output (`edge_node.py:62-65`). That is the patent's abstract, with folders standing in for "models selected for a layer."

Two things the reviewers proved about this path, for Grok to hold:
- The layer-2 box is **relative to the crop**, flagged `within` (`edge_node.py:120`). A receiver must map it back onto the frame before drawing it, or a head lands in the wrong place.
- The crop is resized a second time, so the two paths (browser, edge) can disagree on one head box. Pin one resize recipe for the crop, not only the frame.

### The second sensor is the missing half

The page today runs **one** sensor and one model (`patent_summary.md:26`). The patent's combined score needs a **genuine second sensor**, and "genuine" is the whole point:

- **One sense is one vote.** Two crops of one camera, or nine cameras running the same folder, are not two witnesses — they share one eye and one mistake. The Pangu lens measured it: three crops of one camera read 0.959 counted per view but 0.688 counted as one source, and nine identical cameras with the same false mark at 0.60 combine to 0.9997 by naïve OR. An over-confident number is the most dangerous number on this screen. A combined score may add a vote only for a **distinct (sense, seed) pair** — a different sensor and a different model.
- **A second sensor that needs a driver is a cube behind a port.** Upstream `thermal01` already works this way: `simpleVideoCamera.py` opens a thermal camera server on `localhost:54339` and reads raw int16 frames. A browser cannot load a USB thermal driver and does not need to — the driver stays on the Pi, and the phone meets the **envelope**, not the hardware. The envelope names its source (`cam-0`, `seek-0`) and its folder seed.
- **The second sensor needs a pinned stretch.** Thermal is scaled by each frame's own min and max (`thermal01/simpleVideoCamera.py`, per-frame `minMaxLoc`), so a person's brightness changes whenever something hotter enters the view. Pin that stretch the way the resize recipe is pinned, or the thermal layer is non-deterministic.
- **The second sensor needs a capture time.** The patent "shows both pictures when their views overlap." Overlap is a time window, not just a box. With 157 ms of skew between two sensors, one moving object splits into two marks (a walker at 20 m overlaps only 0.39; a small fast mover at 100 m, 0.00 — Pangu/Krishna, computed). The envelope stamps `at` when it is built (`edge_node.py:76`), not at capture. Add a capture timestamp and a fusion window, or the two sensors argue instead of agree.

### Why it is like the brain

The operator asked for models that "operate like the human brain," and the layering is exactly that resemblance, honestly stated:

**In short:** the patent's layered identification is already the folder ladder, and `IDENTIFY` already walks it. What is unbuilt is the honest second sensor — its own source, its pinned stretch, its capture time, its independent vote — and the human who turns a mark into a decision. It is a published, abandoned application, not an issued patent, and this is feedback, not a grant of anything.

_(1 paragraph(s) on the withheld integration dropped.)_

### Coordinator 12 — Completeness critic: check all parts against the operator's words (browser + every device; Pi app onto PC/Mac/phones; cube infrastructure with Python backbone o

# Completeness critic — Coordinator 12 of 12

Feedback only. This checks the eleven lens syntheses against the operator's own words and names what the final answer must still carry.

## Did we answer what he asked? Ask by ask

## The gaps the eleven leave — fix before the answer ships

## The five sentences the answer must contain

## Required framing (not one of the five, but the answer must wear it)

- A one-line **UNVERIFIED banner** at the top: Chromium/x86 only; no Safari, iPhone, Android, Pi, ARM, GPU, real radio or cloud.
- **HEAD, not LIVE** stated wherever a finding is about the shipped site.
- The folder is the registry (one list, not four), the model moves as a whole folder, and a new model is a new folder of the same shape — his rule, restated as the fix.

— Master of Thought

_(3 paragraph(s) on the withheld integration dropped.)_
