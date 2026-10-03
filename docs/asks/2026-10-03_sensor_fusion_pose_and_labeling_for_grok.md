# Sensor Fusion — Pose and data labeling into the app (recommendations for Grok)

Claude Code, 2026-10-03. Feedback only. No Sensor Fusion code, model folder or label file was changed. Every result
below was run tonight; the scripts are in `docs/assessments/2026-10-03_sensor_fusion_edge_probes/pose/`.

## 1. The two main menus, side by side

| Upstream Pi menu (`menu.sh`, 2020) | What it runs | The app today (`sf.ts` MENU) |
|---|---|---|
| 1 Run Sensor Fusion | `launch.sh` (Coral) | 1 Sensor Fusion, with Coral |
| 2 Run Sensor Fusion no TPU | `launch_noTPU.sh` | 2 Sensor Fusion, no Coral |
| 3 Stop Sensor Fusion | `killall python` | 3 Stop |
| 4 Run Image Labeler | desktop `labelImg` (Qt), Pascal VOC XML | 4 Image labeler (in-page annotate) |
| 5 / 6 Run CheckID (Coral / no TPU) | `checkid/Sample_TFLite_model` | 5 / 6 Check ID |
| 7 Run PoseEstimate | `project-posenet-master/pose_camera.py` | 7 Pose — "not designed yet" |
| 8 Zip Annotated Directory | `zipdir.sh` on `Pictures/<Set>` | — missing |
| 9 Upload Zip File | `upload.sh` (handled, not printed in the menu) | — missing |

The app's menu matches 1–7. Items 8 and 9 (zip and upload the labeled set) are the second half of labeling, and
they are not in the app.

## 2. Pose — what the upstream does, and why not to port it

- `pose_camera.py` loads `posenet_mobilenet_v1_075_*_quant_decoder_edgetpu.tflite`. That file runs only on a Coral:
  the pose decoder is a custom Edge TPU operator.
- It uses the old `edgetpu` Python engine (`BasicEngine`), which Coral has since replaced.
- The `models/` folder is not in the repo, so menu 7 cannot run from a fresh copy today.
- => Do not port it. Replace it with a pose model that has the same three-file shape.

## 3. Pose — the recommendation, proven tonight

**One new folder, the same three files, nothing renamed:**

```
PreLoadedModels/Pose.01/Sample_TFLite_model/
    detect.tflite     <- MoveNet SinglePose Lightning, CPU (Coral's test_data: movenet_single_pose_lightning_ptq.tflite)
    edgetpu.tflite    <- the same model compiled for Coral (movenet_single_pose_lightning_ptq_edgetpu.tflite)
    labelmap.txt      <- the 17 keypoint names, in order (nose, left_eye, right_eye, ... right_ankle)
```

Source: https://github.com/google-coral/test_data (Apache-2.0). The model files are not committed here; the
label file is (`pose/Pose.01_labelmap.txt`).

| Run | Result |
|---|---|
| Python, LiteRT (`pose/pose_py.py`) | input 192×192 uint8, output `[1,1,17,3]` (y, x, score); 6.2 ms; 8 keypoints over 0.3 on the test photo |
| Browser, the runtime the app already loads (`pose/pose_web.mjs`) | same input and output; same person; nose 0.78/0.27 vs Python 0.77/0.28; 0 tensors leaked |
| Coral (`edgetpu.tflite`) | UNVERIFIED — no Coral here |

**How the app tells a pose folder from a detector folder:** by the model's own output, not by a new setting. Four
outputs (boxes, classes, scores, count) = detect. One output `[1,1,17,3]` = pose. The folder stays the registry.

**What the screen draws:** the same green stroke as the boxes — a dot per keypoint over 0.3 and a line for each
skeleton edge (shoulder–elbow, elbow–wrist, hip–knee, …). The envelope gets the verb `POSE` with the keypoints as
whole numbers (×10000), so Python and the browser hash the same.

**More than one person (the patent's layers):** layer 1 Demo.90 finds each person; layer 2 runs Pose.01 on each
person's box. Single-person MoveNet then covers a crowd, and the verb is `IDENTIFY` like Head on a person.

## 4. Data labeling — the recommendation, proven tonight

**Keep labelImg's file format, so every training recipe that already reads it keeps working.** The page writes one
Pascal VOC XML beside each picture. Tonight a page-written file (`pose/manta_0001.xml`, two boxes) was read by
labelImg's own reader with both boxes intact.

1. **One set = one folder of the upstream shape:** `Home/SensorFusion/Pictures/<Set>/` with `0001.jpg` + `0001.xml`
   pairs, and a copy of the model's `labelmap.txt` so the names stay in order.
2. **AI proposes, a person decides.** The current model draws its boxes (or pose keypoints) first; the student moves,
   renames or deletes them. A second person confirms before a picture joins the set.
3. **Menu 8 + 9 become one button: "Save set".** On a phone it saves one `.zip` to Files (the zip keeps the folder
   shape). On a desktop browser it can write the folder directly. "Upload" waits until there is a place to receive
   sets — that choice is the operator's.
4. **The panel only says what happened.** Today the Annotate box says "N pictures in Home/SensorFusion/…" while the
   pictures live only in page memory. After the change, it says that only once the zip or folder is saved.
5. **The Python program, menu 4:** if `labelImg` is installed (`pip install labelImg`, Windows/Mac/Linux), open it on
   the same `Pictures/<Set>` folder and `labelmap.txt`; if not, say "Use the page to label pictures."
6. **Pose labels:** keypoints saved as COCO keypoint JSON (the common format), prefilled by Pose.01.
7. **Signing a label with Light Codex:** only on the lossless picture or a small PNG strip — JPEG breaks it.

## 5. Tests for Grok

| # | Test | Pass | Tonight |
|---|---|---|---|
| P1 | `Pose.01` runs in Python (LiteRT) | 17 keypoints returned, output `[1,1,17,3]` | pass, 6.2 ms |
| P2 | `Pose.01` runs in the browser runtime | same person, keypoints within 0.05 of Python | pass, 0 leaked |
| P3 | The folder list shows `Pose.01` without a code change | appears when the folder is on disk | not built |
| P4 | A page-written VOC XML opens in labelImg | every box read back | pass (labelImg reader) |
| P5 | "Save set" zip opens as `Pictures/<Set>/` with jpg+xml pairs and labelmap | folder shape intact | not built |
| P6 | Annotate text matches what was saved | no count before the save | fails today |
| P7 | Pose.01 on Coral | runs `edgetpu.tflite` | UNVERIFIED |

## 6. The first change, named, not made

**File:** `frontend/public/sensor-fusion/cnn.js` (and the same rule in `sensor_fusion_edge.py`).
**Behavior:** read the model's output shape; for `[1,1,17,3]` return keypoints instead of boxes and draw the
skeleton. Then add the `Pose.01` folder. Menu 7 stops saying "not designed yet".
