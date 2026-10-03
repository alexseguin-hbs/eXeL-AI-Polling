# Sensor Fusion FPS bar (operator 2026-10-02)

## Verbatim

> 4-6 FPS detection works for now as this is speed of Sensor Fusion on Rasp Pi with no CNN accelerator FOR TF LITE (coral).

## Reading

A CPU run of `detect.tflite`, with no Coral chip, is acceptable at 4 to 6 frames a second. That is the speed of the Raspberry Pi app without the accelerator. Do not treat 4–6 FPS as a failure. Do not block the browser path, the Python path, or the WebRTC path for being in that range. Coral is the later speed-up, and only on a computer that has the chip. A browser cannot run `edgetpu.tflite`.
