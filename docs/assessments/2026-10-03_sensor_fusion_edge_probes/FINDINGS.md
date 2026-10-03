## Browser runtimes on the SAME detect.tflite (bench, identical 300x300 bytes vs Python tflite-runtime)
- tfjs-tflite 0.0.1-alpha.10 (loader fixed: /wasm/ path + functional calls), single-thread WASM: all 4 models, 39-44 ms/frame, Demo90 163/179 boxes matched, max score diff 0.016 (Head 0.086), median 0.
- tfjs-tflite threaded (numThreads 4, COOP/COEP): hung, killed at 200 s (UNVERIFIED cause).
- LiteRT.js 2.5.3 webgpu + JSPI: all 4 models run; Demo90 168/179 matched, max diff 0.023; 470-526 ms/frame on SOFTWARE WebGPU (no GPU in sandbox).
- LiteRT.js wasm (plain): 'memory access out of bounds'; wasm+JSPI: 'Cannot read properties of undefined (reading value)' / 'Element type NONE is not supported'; wasm threaded (COI): out of bounds. => its CPU path cannot run the SSD post-process today.
- LiteRT.js webgpu without JSPI: 'Asyncify is not defined'.
- MediaPipe Tasks Vision 1.0.1: refuses - needs TFLite Model Metadata.
- onnxruntime-web: needs ONNX conversion (second format) - not tested.
## Cube probe
- browser CNN 16.5 env/s (43 ms) vs edge node localhost 5.7/s (CNN 144 ms, rt 157 ms, 37 KB/frame 640x360). Throttle 4x: browser 4.4/s (190 ms), edge 4.7/s (171 ms).
## One Python brain, two homes
- fusion.py (pure Python, no numpy) ran unchanged in CPython (tflite-runtime detect) and Pyodide 314.0.7 in Chromium (JS tfjs-tflite detect via js bridge).
- Same identification: head from layer 2; score 1.00 vs 0.98; combined 0.72 vs 0.706; all boxes IoU 0.93-0.98. Raw-output hashes differ (f795f6c3 vs c6b97d49): resize kernels differ.
## Network laws (Chromium)
- http page from a LAN address: isSecureContext false, no navigator.mediaDevices, no WebGPU, no crypto.subtle -> no camera.
- https page (self-signed accepted): camera OPEN; fetch to http LAN node BLOCKED (Mixed Content); fetch to http loopback BLOCKED (private network permission).
## Pyodide
- loads 1.9 s from local files; Python 3.14 wasm32; no tflite/litert package in its 357-package lock; numpy wheel must be vendored for offline (404 here).
## WebRTC: HTTPS page <-> Python node (aiortc 1.15) on the LAN, SDP by paste
- secure context, camera allowed; data channel opened; 10 frames x 36,861 B JPEG (640x360): round trip median 160 ms (min 140), envelopes authority MARK.
- 168,949 B frame: channel CLOSED at frame 0; negotiated sctp.maxMessageSize = 65536 -> frames must stay under 64 KB or be chunked.
- Chrome hides LAN IPs behind mDNS (.local) by default; a real phone+Pi on one Wi-Fi resolve mDNS; this container needed --disable-features=WebRtcHideLocalIpsWithMdns.
## Decision hash
- hashing the DECISION (verb, from_layer, label, boxes snapped to a 0.1 grid, score band) gives the same hash in CPython and Pyodide: 117e81bef7592a62 == 117e81bef7592a62 (raw-output hashes differed).
## Light Codex caption round trip (repo lib/light-codex.ts, block 2, Double Helix, 640x360 frame)
- PNG: verified (both strands). Lossless WebP: verified. JPEG q95: verified via bottom strand (Single Helix fallback). JPEG q85: verified (bottom strand). JPEG q60: null.
- => captions survive camera JPEG at q>=85 with block 2; correction of E14 ("PNG only").
## Sensor Fusion mark through Drone-2525's own fire law (repo slots.ts + decisions.ts)
- machine mark -> designate amber (by SF:Model02.Head); canFire refuses AMBER_NO_APPROVE. Good.
- RISK PROVEN: slots.approve(st,1,"SF:edge-node") -> red, approvalKind "two-person" (names differ), canFire ok. The gate is name-based; ai-crew resolveRequest is name-based too ("an unnamed approval is not an approval"). Safe while only human seat buttons call approve(); Sensor Fusion is the first machine-generated stream into the room.
- Guarded approve (only HI:pilot / HI:targeteer) refuses the machine (stays amber) and accepts the human (red, two-person). Record: AI DESIGNATE · HI APPROVE · HI SIM-ACTION; decisions DEC-0001 SF:Model02.Head, DEC-0002 HI:targeteer; replay hash f0d61ca146860f25.
## Start-up chooser (edge/page.html window.choosePath, edge/choose.mjs)
- The page times 3 frames each way on the device in hand and keeps the browser path unless the node is at least 10% faster (no video leaves the device on a tie).
- Run 1: x1 browser 47.6 / edge 171.5 -> browser · x2 104.4 / 166.9 -> browser · x4 195 / 169 -> edge · x6 279.3 / 183.6 -> edge.
- Run 3 (after the fix below): x1 47.7 / 158.1 -> browser · x2 104.7 / 163.4 -> browser · x4 195.6 / 179.3 -> browser (inside the 10% margin) · x6 315.3 / 186.6 -> edge.
- => fast phones and PCs keep the CNN on the device; a slow device hands it to the node. Near the crossover (x4 here) the pick follows load, so the page should re-time now and then, not once.
- Run 2 read edge null at x6 and fell back to the browser: the node had crashed (next item). Falling back was right; not saying why was wrong.
## Two devices at once (edge/concurrent.py) - a real defect found and fixed
- The node is a threaded HTTP server and shared ONE tflite Interpreter per model across threads. Two frames at the same moment: "RuntimeError: There is at least 1 reference to internal data in the interpreter" and the connection dropped with no answer.
- Before: 8 peers x 5 frames at once -> answered 3/40, 37 RemoteDisconnected.
- Fix: one lock per model around set_tensor/invoke/get_tensor, one lock on the seq counter, and a 500 answer (never a dropped connection) if the model stops.
- After: answered 40/40, 0 failed, unique seq 40/40 (run twice).
- Grok's own sensor_fusion_edge.py is a single-threaded camera loop and is not affected; any node that serves more than one phone is.
- Also seen: a node started without its browser runtime folder serves a page that dies with "tflite is not defined". The page should say the runtime is missing.
## Two sensors, one object (bench/fusion2.py + fusion2_demo.py) - the patent's "two or more sensors" running
- cam-A sees the whole frame; cam-B sees the right 70% (a second camera, mapped into A's frame with (0, 0.30, 1, 0.70)).
- Boxes are matched by label and IoU >= 0.5 in the shared frame; each keeps its per-sensor score; combined = 1 - (1-pA)(1-pB).
- Result: 3 person boxes seen by both - the photo has two people and the model boxes the right-hand one twice, full and upper body (0.72+0.68 -> 0.91 · 0.62+0.61 -> 0.852 · 0.56+0.55 -> 0.802); a person seen only by A and a tie seen only by B stay at 0.5.
- The envelope is signed with a room key (HMAC-SHA256, first 32 hex): verify True; the same envelope with combined forged to 0.99 -> False; the right envelope under another room's key -> False.
- Authority stays "MARK" after fusion: a higher combined score is a better mark, never permission (Drone-2525 fire law).
## Grok's own code, run as it ships (grok/) - feedback only, nothing applied
- cnn.js, unmodified, the way /SensorFusion-2525 calls it (SFCnn.load(id) then SFCnn.detect), CDN and model hosts answered from local copies of the same versions and folders: every model fails - "Cannot read properties of undefined (reading '_malloc')". Cause: setWasmPath points at dist/; the runtime lives in wasm/ (tflite_web_api_cc_simd.js 404).
- With only that line changed: "resized.round is not a function". Cause: the tf-core bundle has no chained ops; the functional form (tf.round, tf.clipByValue, tf.cast, tf.expandDims) works.
- With both lines changed (grok/cnn_two_fixes.diff): Head finds "head 75"; Demo.90 finds 5 boxes; 235-513 ms for the first load plus the first detection.
- The built page (fresh next build of HEAD, fake camera, guest, menu 2, SENSOR 1 ON): as shipped the person reads the raw error "Cannot read properties of undefined (reading '_malloc')" under the picture and no box is drawn (grok/page_as_shipped.png). With the two fixes: "Loading detect.tflite..." -> "Running detect.tflite", a box and score drawn on the live feed, 17,660 painted pixels (grok/page_two_fixes.png).
- Also seen on that page at 390 px: "SENSOR 1: ON" wraps over the settings icon; the yellow FPS/status line prints on top of the box label.
- sensor_fusion_edge.py with all three files already in Home/SensorFusion/Demo90/Sample_TFLite_model and no network: exit 1, URLError traceback inside fetch() before the camera opens (grok/offline_start.sh). fetch() runs on every start and has no fallback to the file already there.
- A dropped download: urlretrieve writes straight onto the model file. A link that drops after 1 MB left 1,000,000 of 4,183,312 bytes and the model would not open (grok/short_download.py). Write to a temp name, check the size, then rename.
- fetch() downloads 2 of the 3 files (labelmap + the one .tflite in use), so a folder fetched on a no-Coral machine has no edgetpu.tflite and cannot simply be carried to a Coral machine (addendum 1: the folder is the unit that moves).
- The model list is typed three times (sensor_fusion_edge.py:35-47, cnn.js:9-21, sf.ts:23-35); the folder could be the list, as edge_node.py does.
