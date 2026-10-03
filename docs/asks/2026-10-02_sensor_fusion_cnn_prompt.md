# Paste this into Claude Code

You are Claude Code on https://github.com/alexseguin-hbs/eXeL-AI-Polling , branch main.

Read `docs/asks/2026-10-02_sensor_fusion_cnn_brainstorm.md` first. Then brainstorm. Do not edit `frontend/app/SensorFusion-2525/`, `frontend/public/sensor-fusion/`, the model folders, or the label files. Those names already work. Do not push a Sensor Fusion code change from this prompt. Write the answer as `docs/asks/2026-10-02_sensor_fusion_cnn_answer.md` and stop.

## The goal, in the operator's words

Get the CNN working. The software has to run on a Windows PC, a Raspberry Pi, Ubuntu, a phone (iOS and Android), and later machines. It is Python based. Compare two ways:

1. Object detection by sending video from the web page to a model somewhere else.
2. The CNN runs on the device, and the web page turns the camera on.

This is for EdTech, where a person names what the camera sees so the next model can be shared, and for underwater manta detection. The method is the one in US20220164611A1 (multi-sensor, multi-layer labeling). Apple's US20240107160A1 cites that application. The application is published and listed as abandoned. It is not an issued patent.

## What already works

Each model is one folder. The files inside stay `detect.tflite`, `edgetpu.tflite`, and `labelmap.txt`. Read the label file in order. `???` means it is not one of the 90 names. No Coral uses `detect.tflite`. Coral uses `edgetpu.tflite`, and only on a computer that has the chip. The folder is `Home/SensorFusion`. A backslash is only for Windows.

On 2026-10-02 the CPU file was run. Head returned `head` at 86%. Demo.90 returned three boxes, at 71%, 60%, and 56%, named `???` because that is line 0 of its label file.

The program is `frontend/public/sensor-fusion/edge/sensor_fusion_edge.py`. Each run pulls the latest copy into `Home/SensorFusion/sensor_fusion_edge.py` and replaces that model's `detect.tflite` and `labelmap.txt`. The page saves it the same way Vision-2525 saves its page: `/sensor-fusion/download/sensor_fusion_edge.py` with `Content-Disposition: attachment`.

The page is https://exel-ai-polling.explore-096.workers.dev/SensorFusion-2525/ . `frontend/public/sensor-fusion/cnn.js` tries the same CPU file in the browser. That path is not proven on a phone. A browser cannot run `edgetpu.tflite`. Pose is not designed. A second sensor (thermal plus visual) is not built.

## Write the answer as these sections

1. Default path, and when the other path is the fallback. One paragraph each.
2. How one Python program runs on Windows, Raspberry Pi, Ubuntu, and a later machine, without a new folder layout.
3. What an iPhone can do, and what an Android phone can do.
4. How a student labels a picture, and how that set becomes the next model folder.
5. How a manta model drops into the same folder shape, with the camera on a Pi and the screen on a phone.
6. What not to build yet.
7. The first change you would make, named as a file and a behavior, but not made.

Use short sentences. Do not rename a file. Do not add a second way to store a model.
