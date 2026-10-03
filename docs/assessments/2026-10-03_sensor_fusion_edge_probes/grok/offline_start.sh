#!/bin/sh
# Grok's sensor_fusion_edge.py, started with all three model files already in place and NO network (the manta Pi in the
# water, a closed range, a phone in airplane mode). Pass = it opens the model it already has. Today it stops with a
# URLError traceback inside fetch() before the camera opens (2026-10-03, exit 1).
T=$(mktemp -d); M=$T/Home/SensorFusion/Demo90/Sample_TFLite_model; mkdir -p $M
cp "${UPSTREAM:-$HOME/de-risking-strategies/sensorfusion}"/Demo90/Sample_TFLite_model/detect.tflite \
   "${UPSTREAM:-$HOME/de-risking-strategies/sensorfusion}"/Demo90/Sample_TFLite_model/edgetpu.tflite \
   "${UPSTREAM:-$HOME/de-risking-strategies/sensorfusion}"/Demo90/Sample_TFLite_model/labelmap.txt $M/
printf '2\n1\nq\n' | HOME=$T HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 https_proxy=http://127.0.0.1:9 \
  python3 frontend/public/sensor-fusion/edge/sensor_fusion_edge.py --fresh 2>&1 | tail -3
