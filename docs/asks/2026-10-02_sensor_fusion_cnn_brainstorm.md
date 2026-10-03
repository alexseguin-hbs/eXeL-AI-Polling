# Sensor Fusion CNN — brainstorm only (operator 2026-10-02)

Claude Code: brainstorm. Do not edit `/SensorFusion-2525`, the model folders, or the label files. Those names already work. Write the answer beside this ask. Do not push a Sensor Fusion code change from this note.

## Verbatim ask

> ask Claude code to help brainstorm how to get CNN working; with goal of software that works on PC-Windows, Raspberry Pi, Ubuntu, phone (IoS and Android), and future systems (python based). See how we can do object detection simulation via web transfer of video or local cnn detection with web enablement of edge camera. Yes we will be innovation new to world capability that will be useful for EdTech and underwater Manta detection

## What already works — do not rename it

Each model is one folder. Inside it the names stay `detect.tflite`, `edgetpu.tflite`, and `labelmap.txt`. The label file is read in order. `???` means it is not one of the 90 names. No Coral uses `detect.tflite`. Coral uses `edgetpu.tflite`, and only on a computer that has the chip. The folder on each machine is `Home/SensorFusion`. A backslash is only for Windows.

The CPU file was run here on 2026-10-02. **Head** returned `head` at 86%. **Demo.90** returned three boxes, at 71%, 60%, and 56%, named `???` because that is line 0 of its label file.

The program is `frontend/public/sensor-fusion/edge/sensor_fusion_edge.py`. Each run pulls the latest copy into `Home/SensorFusion/sensor_fusion_edge.py` and replaces that model's `detect.tflite` and `labelmap.txt`. The page button saves it the same way Vision-2525 saves its page: `/sensor-fusion/download/sensor_fusion_edge.py` with `Content-Disposition: attachment`.

The web page is https://exel-ai-polling.explore-096.workers.dev/SensorFusion-2525/ . The browser script `frontend/public/sensor-fusion/cnn.js` tries the same CPU file in the page. That path is not yet proven on a phone. A browser cannot run `edgetpu.tflite`.

## The two ways to compare

1. **Local CNN.** The camera stays on the device. `detect.tflite` runs there. The web page is the screen and can turn the camera on. The cloud only carries a new copy of the three files. This is the path the Python program already starts. It has to run on Windows, Raspberry Pi, Ubuntu, iOS, Android, and a later Python system without a new folder layout.

2. **Web transfer of video.** The page still shows the camera. Frames go to a server. The server runs the same model and sends back the box, the name, and the score. Use this when the phone cannot run the file. It stops when the connection stops. Do not store the picture unless the person is labeling it.

EdTech is a person naming what the camera sees, so the next folder can be used by someone else. Underwater manta detection is the same three files, with a model trained on manta, on a camera that may be on a Pi in the water and a screen that may be a phone. The method is the one in US20220164611A1 (multi-sensor, multi-layer labeling). Apple's US20240107160A1 cites that application. The application is published and listed as abandoned. It is not an issued patent.

## What a useful answer names

- Which path is the default, and when the other path is the fallback.
- How one Python program runs on Windows, Raspberry Pi, Ubuntu, and a later machine.
- What an iPhone can do, and what an Android phone can do, without a new file naming scheme.
- How a student labels a picture, and how that labeled set becomes the next model folder.
- How a manta model would drop into the same folder shape.
- What not to build yet. Pose is not designed. A second sensor (thermal plus visual) is not built.
