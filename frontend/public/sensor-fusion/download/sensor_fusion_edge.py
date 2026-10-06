#!/usr/bin/env python3
"""Sensor Fusion on this computer.

One program. It picks the machine it is on:
  Raspberry Pi, Ubuntu, Windows PC, Mac, iPhone, or Android.

Each model is a folder named Home/SensorFusion.
Windows uses a backslash. The other five use a slash.
Android writes under /sdcard. An iPhone writes under On My iPhone.

    Home/SensorFusion/<Folder>/Sample_TFLite_model/
        detect.tflite
        edgetpu.tflite
        labelmap.txt

No Coral: detect.tflite on the CPU.
Coral: edgetpu.tflite, only if that computer has the chip.
The label file is used in order, after a first ??? line is dropped.
??? anywhere else means it is not one of the 90 names.

First run:
  python3 sensor_fusion_edge.py --check
That downloads Demo.90 and prints what the CPU model finds.
Then:
  python3 sensor_fusion_edge.py
Install once: pip install opencv-python
CPU wheel:    pip install tflite-runtime
If that wheel is missing, pip install tensorflow
"""

import json
import os
import sys
import threading
import time
import urllib.request

BASE = "https://raw.githubusercontent.com/De-Risking-Strategies/SensorFusion/master/"
APP = "https://raw.githubusercontent.com/alexseguin-hbs/eXeL-AI-Polling/main/frontend/public/sensor-fusion/edge/sensor_fusion_edge.py"
LIST = "https://raw.githubusercontent.com/alexseguin-hbs/eXeL-AI-Polling/main/frontend/public/sensor-fusion/models.json"
EDGE = "https://raw.githubusercontent.com/alexseguin-hbs/eXeL-AI-Polling/main/frontend/public/sensor-fusion/edge-contract.json"


def model_rows():
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(home(), "models.json"),
        os.path.join(here, "models.json"),
        os.path.join(here, "..", "models.json"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            with open(path, encoding="utf-8") as handle:
                return json.load(handle)["models"]
    try:
        os.makedirs(home(), exist_ok=True)
        dest = os.path.join(home(), "models.json")
        urllib.request.urlretrieve(LIST, dest)
        with open(dest, encoding="utf-8") as handle:
            return json.load(handle)["models"]
    except Exception:
        print("The model list is not on this computer.")
        return []


def edge_contract():
    global _EDGE
    if _EDGE is not None:
        return _EDGE
    here = os.path.dirname(os.path.abspath(__file__))
    names = [
        os.path.join(here, "edge-contract.json"),
        os.path.join(here, "..", "edge-contract.json"),
        os.path.join(os.path.expanduser("~"), "Home", "SensorFusion", "edge-contract.json"),
    ]
    if os.environ.get("USERPROFILE"):
        names.insert(2, os.path.join(os.environ["USERPROFILE"], "Home", "SensorFusion", "edge-contract.json"))
    for path in names:
        if os.path.isfile(path):
            with open(path, encoding="utf-8") as handle:
                _EDGE = json.load(handle)
                return _EDGE
    _EDGE = {"folder": ["Home", "SensorFusion"], "platforms": []}
    try:
        dest = names[-1]
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        urllib.request.urlretrieve(EDGE, dest)
        with open(dest, encoding="utf-8") as handle:
            _EDGE = json.load(handle)
    except Exception:
        pass
    return _EDGE


_EDGE = None


def folder_parts():
    parts = edge_contract().get("folder")
    if isinstance(parts, list) and parts and all(isinstance(part, str) and part for part in parts):
        return parts
    return ["Home", "SensorFusion"]


def shown_folder():
    data = edge_contract()
    name = platform_name()
    for row in data.get("platforms", []):
        if row.get("py") == name or row.get("id") == name:
            show = row.get("show") or folder_parts()
            return str(row.get("sep") or "/").join(show)
    return os.path.join(*folder_parts())


def platform_name():
    if os.environ.get("ANDROID_ROOT") or os.environ.get("ANDROID_DATA") or hasattr(sys, "getandroidapilevel"):
        return "android"
    machine = ""
    try:
        machine = os.uname().machine
    except AttributeError:
        machine = ""
    if sys.platform == "ios" or machine.startswith(("iPhone", "iPad")):
        return "iphone"
    if sys.platform == "darwin":
        return "mac"
    if sys.platform == "win32":
        return "windows"
    try:
        with open("/proc/device-tree/model", "rb") as handle:
            if b"Raspberry" in handle.read():
                return "pi"
    except OSError:
        pass
    return "ubuntu"


def home():
    parts = folder_parts()
    name = platform_name()
    if name == "windows":
        return os.path.join(os.environ.get("USERPROFILE", "C:\\"), *parts)
    if name == "android":
        for root in ("/sdcard", "/storage/emulated/0"):
            if os.path.isdir(root) and os.access(root, os.W_OK):
                return os.path.join(root, *parts)
        shared = os.path.expanduser("~/storage/shared")
        if os.path.isdir(shared):
            return os.path.join(shared, *parts)
    if name == "iphone":
        documents = os.path.expanduser("~/Documents")
        base = documents if os.path.isdir(documents) else os.path.expanduser("~")
        return os.path.join(base, *parts)
    return os.path.join(os.path.expanduser("~"), *parts)


def remote_for(folder):
    for row in model_rows():
        if row.get("folder") == folder:
            return row.get("remote")
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
    # One label rule for every reader: a first line of ??? is dropped, as TFLite_detection_webcam.py does.
    # Class 0 is then person on Demo.90. A label map with no ??? first line is used as it is.
    if lines and lines[0] == "???":
        del lines[0]
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


def imaging_sensors():
    """The cameras this machine can open. Linux reads the device name. The others are Camera 1, Camera 2."""
    found = []
    if platform_name() in ("pi", "ubuntu"):
        root = "/sys/class/video4linux"
        if os.path.isdir(root):
            for entry in sorted(os.listdir(root)):
                if not entry.startswith("video"):
                    continue
                try:
                    with open(os.path.join(root, entry, "name"), encoding="utf-8", errors="replace") as handle:
                        label = handle.read().strip() or entry
                except OSError:
                    label = entry
                lowered = label.lower()
                if "metadata" in lowered or "codec" in lowered:
                    continue
                try:
                    index = int(entry.replace("video", "") or "0")
                except ValueError:
                    continue
                found.append((index, label))
    if found:
        return found
    try:
        import cv2
    except ImportError:
        return [(0, "Camera")]
    name = platform_name()
    flag = {
        "windows": getattr(cv2, "CAP_DSHOW", 0),
        "mac": getattr(cv2, "CAP_AVFOUNDATION", 0),
        "pi": getattr(cv2, "CAP_V4L2", 0),
        "ubuntu": getattr(cv2, "CAP_V4L2", 0),
    }.get(name, 0)
    for index in range(4):
        camera = cv2.VideoCapture(index, flag) if flag else cv2.VideoCapture(index)
        if camera.isOpened():
            found.append((index, f"Camera {index + 1}"))
        camera.release()
    return found or [(0, "Camera")]


def choose_sensor():
    found = imaging_sensors()
    print("Imaging sensors")
    for number, (_index, label) in enumerate(found, start=1):
        print(f"  {number}) {label}")
    if len(found) == 1:
        return found[0]
    raw = input("Sensor number: ").strip()
    try:
        return found[int(raw) - 1]
    except (ValueError, IndexError):
        print("That number is not in the list. Using the first sensor.")
        return found[0]


def open_capture(index):
    import cv2

    flag = {
        "windows": getattr(cv2, "CAP_DSHOW", 0),
        "mac": getattr(cv2, "CAP_AVFOUNDATION", 0),
        "pi": getattr(cv2, "CAP_V4L2", 0),
        "ubuntu": getattr(cv2, "CAP_V4L2", 0),
    }.get(platform_name(), 0)
    camera = cv2.VideoCapture(index, flag) if flag else cv2.VideoCapture(index)
    if not camera.isOpened() and flag:
        camera.release()
        camera = cv2.VideoCapture(index)
    return camera


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
    index, sensor_label = choose_sensor()
    camera = open_capture(index)
    if not camera.isOpened():
        print(f"The camera did not open: {sensor_label}")
        return
    names = labels(folder)
    show_fps = True
    print(f"{sensor_label} is on. Press f for FPS. Press q to stop.")
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
        cv2.imshow(f"Sensor Fusion — {sensor_label}", frame)
        key = cv2.waitKey(1) & 0xFF
        if key in (ord("q"), 27):
            break
        if key in (ord("f"), ord("F")):
            show_fps = not show_fps
    camera.release()
    cv2.destroyAllWindows()


def choose_model():
    rows = model_rows()
    print("\nModels")
    for index, row in enumerate(rows, start=1):
        print(f"  {index}) {row.get('label')}")
    raw = input("Model number: ").strip()
    try:
        row = rows[int(raw) - 1]
        return row.get("label"), row.get("folder"), row.get("remote")
    except (ValueError, IndexError, AttributeError):
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


def serve(coral):
    """The page sends camera pictures here. Coral loads edgetpu.tflite. Without it, this uses detect.tflite."""
    import io
    from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
    from urllib.parse import parse_qs, urlparse
    from PIL import Image

    cache = {}
    lock = threading.Lock()
    engine = "Coral" if coral else "processor"

    def get_interpreter(folder):
        key = (folder, coral)
        if key not in cache:
            fetch(folder, coral)
            path = model_file(folder, coral)
            if not os.path.isfile(path):
                raise FileNotFoundError(path)
            interpreter = interpreter_for(path, coral)
            interpreter.allocate_tensors()
            cache[key] = (interpreter, labels(folder), path)
        return cache[key]

    if coral:
        try:
            get_interpreter("Demo90")
            print("Coral is on. Demo.90 is loaded on the chip.")
        except Exception as err:
            print("No Coral found.", err)
            engine = "missing"
    else:
        print("This program is using the processor, not Coral.")

    class Handler(BaseHTTPRequestHandler):
        def cors(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

        def do_OPTIONS(self):
            self.send_response(204)
            self.cors()
            self.end_headers()

        def do_GET(self):
            if urlparse(self.path).path != "/health":
                self.send_error(404)
                return
            body = json.dumps({"ok": engine != "missing", "engine": engine}).encode()
            self.send_response(200)
            self.cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            parsed = urlparse(self.path)
            if parsed.path != "/frame":
                self.send_error(404)
                return
            if engine == "missing":
                body = json.dumps({"error": "No Coral found."}).encode()
                self.send_response(503)
                self.cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(body)
                return
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b""
            folder = parse_qs(parsed.query).get("model", ["Demo90"])[0]
            try:
                image = Image.open(io.BytesIO(raw)).convert("RGB")
                with lock:
                    interpreter, names, _path = get_interpreter(folder)
                    hits, fps = read_hits(interpreter, image, names)
            except Exception as err:
                body = json.dumps({"error": str(err), "engine": engine}).encode()
                self.send_response(500)
                self.cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(body)
                return
            packed = []
            for score, name, box in hits:
                if not name or name == "???":
                    continue
                ymin, xmin, ymax, xmax = [float(value) for value in box]
                packed.append({"name": name, "score": score, "ymin": ymin, "xmin": xmin, "ymax": ymax, "xmax": xmax})
            body = json.dumps({"hits": packed, "fps": fps, "engine": engine}).encode()
            self.send_response(200)
            self.cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, _format, *_args):
            return

    print("Listening on http://127.0.0.1:8765")
    print("Leave this window open. The page sends the camera here.")
    try:
        ThreadingHTTPServer(("127.0.0.1", 8765), Handler).serve_forever()
    except OSError as err:
        print("Could not listen on port 8765.", err)


def main():
    pull_program()
    if "--page" in sys.argv:
        serve("--coral" in sys.argv)
        return
    if "--check" in sys.argv:
        folder = "Demo90"
        if "--head" in sys.argv:
            folder = "Model02.Head"
        sys.exit(check(folder))
    print("Sensor Fusion")
    print(f"This computer: {platform_name()}")
    print(f"Folder: {home()}")
    print(f"Same folder: {shown_folder()}")
    print("1) Sensor Fusion")
    print("2) Stop")
    print("3) Image labeler")
    print("4) Pose")
    print("q) Quit")
    print("Coral is a switch. Check ID is a model in the list.")
    print("Training: 1 Capture Images, 2 Annotate Images, 3 Upload Images, 4 Develop Models, 5 Download ML Files, 6 Run Live")
    while True:
        choice = input("\nMenu: ").strip().lower()
        if choice in ("q", "x"):
            return
        if choice == "2":
            print("Stopped.")
            continue
        if choice == "4":
            print("Pose is not designed yet. It does not have the three files.")
            continue
        if choice in ("1", "3"):
            coral_on = input("Coral on? y/n: ").strip().lower() in ("y", "yes", "on")
            picked = choose_model()
            if not picked:
                continue
            _label, folder, _remote = picked
            if choice == "3":
                print("Pictures stay in", os.path.join(home(), "Pictures"))
            run_camera(folder, coral=coral_on)
            continue
        print("Choose 1 to 4, or q.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
