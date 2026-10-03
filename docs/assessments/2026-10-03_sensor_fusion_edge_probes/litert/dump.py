"""Same 300x300 bytes into the same detect.tflite with whichever runtime is installed; dump boxes/classes/scores/count + timing.
The import order is the proposal for sensor_fusion_edge.py: LiteRT first, tflite-runtime second, TensorFlow last."""
import json, sys, time, numpy as np
from PIL import Image
try:
    from ai_edge_litert.interpreter import Interpreter; RT = "ai-edge-litert"
except ImportError:
    try:
        from tflite_runtime.interpreter import Interpreter; RT = "tflite-runtime"
    except ImportError:
        from tensorflow.lite.python.interpreter import Interpreter; RT = "tensorflow"
M = sys.argv[1]; out = {"runtime": RT, "numpy": np.__version__, "models": {}}
x = np.expand_dims(np.asarray(Image.open(M + "/../img/zidane.jpg").convert("RGB").resize((300, 300)), dtype=np.uint8), 0)
for name in ("Demo90", "Head", "Deer", "Tree"):
    it = Interpreter(model_path=f"{M}/{name}/detect.tflite"); it.allocate_tensors()
    d = it.get_input_details()[0]; it.set_tensor(d["index"], x); it.invoke()
    ts = []
    for _ in range(10): t0 = time.perf_counter(); it.invoke(); ts.append((time.perf_counter() - t0) * 1000)
    o = it.get_output_details(); n = int(it.get_tensor(o[3]["index"])[0])
    out["models"][name] = {"count": n, "ms_median": round(sorted(ts)[5], 1),
        "scores": [round(float(v), 5) for v in it.get_tensor(o[2]["index"])[0][:n]],
        "classes": [int(v) for v in it.get_tensor(o[1]["index"])[0][:n]],
        "boxes": [[round(float(v), 5) for v in b] for b in it.get_tensor(o[0]["index"])[0][:n]]}
print(json.dumps(out))
