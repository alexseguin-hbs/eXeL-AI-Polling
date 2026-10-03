#!/usr/bin/env python3
"""Sensor Fusion on this computer.

One program. It picks the machine it is on:
  Mac, Ubuntu, Raspberry Pi, Windows, or a phone.

Each model is a folder:

    Home/SensorFusion/<Folder>/Sample_TFLite_model/
        detect.tflite
        edgetpu.tflite
        labelmap.txt

No Coral: detect.tflite on the CPU.
Coral: edgetpu.tflite, only if that computer has the chip.
The label file is used in order. ??? means it is not one of the 90 names.

First run:
  python3 sensor_fusion_edge.py --check
That downloads Demo.90 and prints what the CPU model finds.
Then:
  python3 sensor_fusion_edge.py
Install once: pip install opencv-python
CPU wheel:    pip install tflite-runtime
If that wheel is missing, pip install tensorflow
"""

import os
import sys
import time
import urllib.request

BASE = "https://raw.githubusercontent.com/De-Risking-Strategies/SensorFusion/master/"
APP = "https://raw.githubusercontent.com/alexseguin-hbs/eXeL-AI-Polling/main/frontend/public/sensor-fusion/edge/sensor_fusion_edge.py"
MODELS = [
    ("Demo.90", "Demo90", "Demo90/Sample_TFLite_model/"),
    ("Deer", "Model01.Deer", "PreLoadedModels/Model01.Deer/Sample_TFLite_model/"),
    ("Head", "Model02.Head", "PreLoadedModels/Model02.Head/Sample_TFLite_model/"),
    ("Eyes", "Model03.Eyes", "PreLoadedModels/Model03.Eyes/Sample_TFLite_model/"),
    ("Tree", "Model04.Tree", "PreLoadedModels/Model04.Tree/Sample_TFLite_model/"),
    ("Custom.01", "Custom.01", "PreLoadedModels/Custom.01/Sample_TFLite_model/"),
    ("Custom.02", "Custom.02", "PreLoadedModels/Custom.02/Sample_TFLite_model/"),
    ("Custom.03", "Custom.03", "PreLoadedModels/Custom.03/Sample_TFLite_model/"),
    ("Custom.04", "Custom.04", "PreLoadedModels/Custom.04/Sample_TFLite_model/"),
    ("Check ID", "checkid", "checkid/Sample_TFLite_model/"),
    ("Thermal.01", "thermal01", "thermal01/Sample_TFLite_model/"),
]


def platform_name():
    if os.environ.get("ANDROID_ROOT") or os.environ.get("ANDROID_DATA"):
        return "android"
    if sys.platform == "darwin":
        return "mac"
    if sys.platform == "win32":
        return "windows"
    if os.path.isdir("/home/pi") or os.path.exists("/proc/device-tree/model"):
        try:
            with open("/proc/device-tree/model", "rb") as handle:
                if b"Raspberry" in handle.read():
                    return "pi"
        except OSError:
            pass
    return "ubuntu"


def home():
    name = platform_name()
    if name == "windows":
        return os.path.join(os.environ.get("USERPROFILE", "C:\\"), "Home", "SensorFusion")
    if name == "android":
        return "/sdcard/Home/SensorFusion"
    if name == "pi" and os.path.isdir("/home/pi"):
        return "/home/pi/SensorFusion"
    return os.path.join(os.path.expanduser("~"), "Home", "SensorFusion")


def remote_for(folder):
    for _label, name, remote in MODELS:
        if name == folder:
            return remote
    return None


def model_file(folder, coral):
    filename = "edgetpu.tflite" if coral else "detect.tflite"
    return os.path.join(home(), folder, "Sample_TFLite_model", filename)


def label_file(folder):
    return os.path.join(home(), folder, "Sample_TFLite_model", "labelmap.txt")


def labels(folder):
    path = label_file(folder)
    if not os.path.isfile(path):
        return []
    with open(path, encoding="utf-8", errors="replace") as handle:
        lines = [line.strip() for line in handle]
    if lines and lines[-1] == "":
        lines.pop()
    return lines


def fetch(folder, coral):
    remote = remote_for(folder)
    if not remote:
        return
    folder_path = os.path.join(home(), folder, "Sample_TFLite_model")
    os.makedirs(folder_path, exist_ok=True)
    for name in ("labelmap.txt", "detect.tflite", "edgetpu.tflite"):
        dest = os.path.join(folder_path, name)
        temporary = dest + ".part"
        try:
            print(f"Updating {name}")
            urllib.request.urlretrieve(BASE + remote + name, temporary)
            os.replace(temporary, dest)
        except Exception as err:
            if os.path.isfile(temporary):
                os.remove(temporary)
            if os.path.isfile(dest) and os.path.getsize(dest) > 0:
                print(f"Keeping the copy already here: {name}")
            else:
                print(f"Could not update {name}: {err}")


def interpreter_for(path, coral):
    try:
        from ai_edge_litert.interpreter import Interpreter, load_delegate
    except ImportError:
        try:
            from tflite_runtime.interpreter import Interpreter, load_delegate
        except ImportError:
            from tensorflow.lite.python.interpreter import Interpreter
            load_delegate = None
    if coral:
        if load_delegate is None:
            raise RuntimeError("Coral needs LiteRT or tflite-runtime on this computer.")
        lib = {"windows": "edgetpu.dll", "mac": "libedgetpu.1.dylib"}.get(platform_name(), "libedgetpu.so.1")
        return Interpreter(model_path=path, experimental_delegates=[load_delegate(lib)])
    return Interpreter(model_path=path)


def read_hits(interpreter, image, names):
    import numpy as np

    details = interpreter.get_input_details()[0]
    height, width = int(details["shape"][1]), int(details["shape"][2])
    resized = image.resize((width, height))
    pixels = np.asarray(resized, dtype=np.uint8)
    if details["dtype"] == np.float32:
        data = np.expand_dims((pixels.astype(np.float32) - 127.5) / 127.5, 0)
    else:
        data = np.expand_dims(pixels, 0)
    interpreter.set_tensor(details["index"], data)
    started = time.perf_counter()
    interpreter.invoke()
    fps = 1.0 / max(time.perf_counter() - started, 1e-6)
    outs = interpreter.get_output_details()
    boxes = interpreter.get_tensor(outs[0]["index"])[0]
    classes = interpreter.get_tensor(outs[1]["index"])[0]
    scores = interpreter.get_tensor(outs[2]["index"])[0]
    hits = []
    for index, score in enumerate(scores):
        if score > 0.5 and score <= 1:
            class_id = int(round(float(classes[index])))
            name = names[class_id] if 0 <= class_id < len(names) else "???"
            hits.append((float(score), name, boxes[index]))
    return hits, fps


def check(folder="Demo90"):
    fetch(folder, coral=False)
    path = model_file(folder, False)
    print(platform_name(), path)
    interpreter = interpreter_for(path, False)
    interpreter.allocate_tensors()
    import io
    from PIL import Image

    data = urllib.request.urlopen(
        "https://github.com/ultralytics/yolov5/raw/master/data/images/zidane.jpg", timeout=40
    ).read()
    image = Image.open(io.BytesIO(data)).convert("RGB")
    hits, fps = read_hits(interpreter, image, labels(folder))
    print(f"FPS {fps:.2f}")
    if not hits:
        print("No box over 50%.")
        return 1
    for score, name, _box in hits:
        print(f"  {name} {int(score * 100)}%")
    return 0


def run_camera(folder, coral):
    fetch(folder, coral)
    path = model_file(folder, coral)
    if not os.path.isfile(path):
        print(f"Missing file: {path}")
        return
    try:
        import cv2
        import numpy as np
        from PIL import Image
    except ImportError:
        print("Install OpenCV and Pillow, then run this again.")
        print("pip install opencv-python pillow")
        return
    try:
        interpreter = interpreter_for(path, coral)
        interpreter.allocate_tensors()
    except Exception as err:
        print(f"The model did not start: {err}")
        print(path)
        return
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("The camera did not open.")
        return
    names = labels(folder)
    show_fps = True
    print("Camera is on. Press f for FPS. Press q to stop.")
    while True:
        ok, frame = camera.read()
        if not ok:
            break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(rgb)
        try:
            hits, fps = read_hits(interpreter, image, names)
        except Exception as err:
            print(f"The model stopped: {err}")
            break
        height, width = frame.shape[:2]
        for score, name, box in hits:
            ymin, xmin, ymax, xmax = [float(v) for v in box]
            left, top = int(max(1, xmin * width)), int(max(1, ymin * height))
            right, bottom = int(min(width, xmax * width)), int(min(height, ymax * height))
            cv2.rectangle(frame, (left, top), (right, bottom), (10, 255, 0), 2)
            cv2.putText(frame, f"{name} {int(score * 100)}%", (left, max(20, top - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
        if show_fps:
            cv2.putText(frame, f"FPS: {fps:.2f}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        cv2.imshow("Sensor Fusion", frame)
        key = cv2.waitKey(1) & 0xFF
        if key in (ord("q"), 27):
            break
        if key in (ord("f"), ord("F")):
            show_fps = not show_fps
    camera.release()
    cv2.destroyAllWindows()


def choose_model():
    print("\nModels")
    for index, (label, _folder, _remote) in enumerate(MODELS, start=1):
        print(f"  {index}) {label}")
    raw = input("Model number: ").strip()
    try:
        return MODELS[int(raw) - 1]
    except (ValueError, IndexError):
        print("That number is not in the list.")
        return None


def pull_program():
    if "--fresh" in sys.argv:
        return
    os.makedirs(home(), exist_ok=True)
    dest = os.path.join(home(), "sensor_fusion_edge.py")
    try:
        with urllib.request.urlopen(APP, timeout=30) as response:
            latest = response.read()
    except Exception as err:
        print(f"Could not pull the latest program: {err}")
        return
    current = b""
    try:
        with open(os.path.abspath(__file__), "rb") as handle:
            current = handle.read()
    except OSError:
        pass
    with open(dest, "wb") as handle:
        handle.write(latest)
    if latest != current:
        print(f"Pulled the latest program into {dest}")
        os.execv(sys.executable, [sys.executable, dest, "--fresh", *sys.argv[1:]])


def main():
    pull_program()
    if "--check" in sys.argv:
        folder = "Demo90"
        if "--head" in sys.argv:
            folder = "Model02.Head"
        sys.exit(check(folder))
    print("Sensor Fusion")
    print(f"This computer: {platform_name()}")
    print(f"Folder: {home()}")
    if platform_name() == "android":
        print("A phone can run this file when Python is installed. An iPhone uses the website.")
    print("1) Sensor Fusion, with Coral")
    print("2) Sensor Fusion, no Coral")
    print("3) Stop")
    print("4) Image labeler")
    print("5) Check ID, with Coral")
    print("6) Check ID, no Coral")
    print("7) Pose")
    print("q) Quit")
    print("Training: 1 Capture Images, 2 Annotate Images, 3 Upload Images, 4 Develop Models, 5 Download ML Files, 6 Run Live")
    while True:
        choice = input("\nMenu: ").strip().lower()
        if choice in ("q", "x"):
            return
        if choice == "3":
            print("Stopped.")
            continue
        if choice == "7":
            print("Pose is not designed yet. It does not have the three files.")
            continue
        if choice in ("1", "2", "4"):
            picked = choose_model()
            if not picked:
                continue
            _label, folder, _remote = picked
            if choice == "4":
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
