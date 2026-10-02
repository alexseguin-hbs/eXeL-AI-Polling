#!/usr/bin/env python3
"""Sensor Fusion on this computer.

The same program runs on a Raspberry Pi, Ubuntu, and Windows.
The phone uses the website for now.

Each model is a folder:

    Home/SensorFusion/<Folder>/Sample_TFLite_model/
        detect.tflite
        edgetpu.tflite
        labelmap.txt

With Coral, this opens edgetpu.tflite.
Without Coral, this opens detect.tflite.
FPS is how long the model took on that frame. Press f to show or hide it.
"""

import os
import sys
import time

MODELS = [
    ("Demo.90", "Demo90"),
    ("Deer", "Model01.Deer"),
    ("Head", "Model02.Head"),
    ("Eyes", "Model03.Eyes"),
    ("Tree", "Model04.Tree"),
    ("Custom.01", "Custom.01"),
    ("Custom.02", "Custom.02"),
    ("Custom.03", "Custom.03"),
    ("Custom.04", "Custom.04"),
    ("Check ID", "checkid"),
    ("Thermal.01", "thermal01"),
]


def home():
    if os.name == "nt":
        return os.path.join(os.environ.get("USERPROFILE", "C:\\"), "Home", "SensorFusion")
    pi = "/home/pi/SensorFusion"
    if os.path.isdir(pi):
        return pi
    return os.path.join(os.path.expanduser("~"), "Home", "SensorFusion")


def model_file(folder, coral):
    name = "edgetpu.tflite" if coral else "detect.tflite"
    return os.path.join(home(), folder, "Sample_TFLite_model", name)


def labels(folder):
    path = os.path.join(home(), folder, "Sample_TFLite_model", "labelmap.txt")
    if not os.path.isfile(path):
        return []
    with open(path, encoding="utf-8", errors="replace") as handle:
        return [line.strip() for line in handle if line.strip() and line.strip() != "???"]


def choose_model():
    print("\nModels")
    for index, (label, _folder) in enumerate(MODELS, start=1):
        print(f"  {index}) {label}")
    raw = input("Model number: ").strip()
    try:
        picked = MODELS[int(raw) - 1]
    except (ValueError, IndexError):
        print("That number is not in the list.")
        return None
    return picked


def load_interpreter(path, coral):
    if coral:
        from tflite_runtime.interpreter import Interpreter, load_delegate
        return Interpreter(model_path=path, experimental_delegates=[load_delegate("libedgetpu.so.1")])
    try:
        from tflite_runtime.interpreter import Interpreter
    except ImportError:
        from tensorflow.lite.python.interpreter import Interpreter
    return Interpreter(model_path=path)


def run_camera(folder, coral):
    path = model_file(folder, coral)
    if not os.path.isfile(path):
        print(f"Missing file: {path}")
        print("Add the folder with detect.tflite, edgetpu.tflite, and labelmap.txt.")
        return
    try:
        import cv2
    except ImportError:
        print("OpenCV is not installed on this computer, so the camera cannot open.")
        print(f"The file that would run is {path}")
        return
    try:
        interpreter = load_interpreter(path, coral)
    except Exception as err:
        print(f"The model did not start: {err}")
        print(f"File: {path}")
        return
    interpreter.allocate_tensors()
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("The camera did not open.")
        return
    show_fps = False
    names = labels(folder)
    print("Camera is on. Press f to show FPS. Press q to stop.")
    while True:
        ok, frame = camera.read()
        if not ok:
            break
        started = time.perf_counter()
        interpreter.invoke()
        fps = 1.0 / max(time.perf_counter() - started, 1e-6)
        if show_fps:
            cv2.putText(frame, f"FPS: {fps:.2f}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        if names:
            cv2.putText(frame, names[0], (30, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (80, 220, 80), 2)
        cv2.imshow("Sensor Fusion", frame)
        key = cv2.waitKey(1) & 0xFF
        if key in (ord("q"), 27):
            break
        if key in (ord("f"), ord("F")):
            show_fps = not show_fps
    camera.release()
    cv2.destroyAllWindows()


def main():
    print("Sensor Fusion")
    print(f"Folder: {home()}")
    print("1) Sensor Fusion, with Coral")
    print("2) Sensor Fusion, no Coral")
    print("3) Stop")
    print("4) Image labeler")
    print("5) Check ID, with Coral")
    print("6) Check ID, no Coral")
    print("7) Pose")
    print("q) Quit")
    while True:
        choice = input("\nMenu: ").strip().lower()
        if choice in ("q", "x"):
            return
        if choice == "3":
            print("Stopped.")
            continue
        if choice == "7":
            print("Pose is not in the app yet. It does not have the three files.")
            continue
        if choice in ("1", "2", "4"):
            picked = choose_model()
            if not picked:
                continue
            _label, folder = picked
            if choice == "4":
                print(f"Image labeler uses {model_file(folder, False)}")
                print("Pictures stay in", os.path.join(home(), "Pictures"))
            run_camera(folder, coral=(choice == "1"))
            continue
        if choice == "5":
            run_camera("checkid", coral=True)
            continue
        if choice == "6":
            run_camera("checkid", coral=False)
            continue
        print("Choose 1 to 7, or q.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
