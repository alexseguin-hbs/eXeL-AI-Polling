# Patent summary for Claude Code (operator 2026-10-02)

Source: https://patents.google.com/patent/US20220164611A1/en
Short link the operator uses: https://tinyurl.com/Sensor-Fusion-Patent

Read this before the CNN brainstorm. Do not call it an issued patent. Do not edit Sensor Fusion code from this note.

## What it is

US20220164611A1 is a published United States patent application. The title is "System and method for multi-sensor, multi-layer targeted labeling and user interfaces therefor." The assignee is De-Risking Strategies, LLC. The inventors are Alex Seguin, Bart Mooyman-Beck, Pushkar Khairnar, Dara Cline, and Sheng Xiong Ding. Priority is 23 November 2020, from provisional 63/117,291. It was filed 23 November 2021 and published 26 May 2022. Google Patents lists the application as abandoned on 25 November 2024. An abandoned application is still public. It is not a granted patent, and its claims are not in force.

Apple cites it. The cited-by list includes Apple's US20240107160A1, "Perception modes." The same list also shows Apple's US12598468B2, "Multi-channel device connection."

## What the application describes

A person names a recognition target. That target has a higher-level name, such as a particular person. The device then picks models in layers. An early layer names something general, such as a person. A later layer names something more specific, such as a head, or that particular person. The data comes from at least two sensors. The screen shows both pictures when their views overlap. The device outputs one identification, from the early layer or the later layer. A score can be shown for each, and a combined score can use both sensors.

The sensors named in the application include a normal camera, a stereo camera, a dynamic vision sensor, a thermal or infrared camera, ultraviolet, lidar, time of flight, and a microphone or a microphone array. The write-up is aimed at a computer that can run this on its own, including an edge device, so it does not have to send every picture to a cloud.

The abstract says: receive a recognition target; select models for an initial layer and a final layer; get data from two or more sensors; run the early models; run the later models; output an identification from one of those sets.

## What this means for Sensor Fusion

The folders already match the layers. Demo.90 names a person. Head names a head. Check ID names Alex, Dara, or Nick. Each folder keeps `detect.tflite`, `edgetpu.tflite`, and `labelmap.txt`. The label file is read in order. `???` means it is not one of the 90 names.

The page today runs one camera and one model. The application’s step that is not built yet is the second sensor, shown at the same time, and a label made by a person becoming the next folder. EdTech is that labeling step. A manta model is the same folder shape, trained on manta. Pose is not designed. Do not rename the files.
