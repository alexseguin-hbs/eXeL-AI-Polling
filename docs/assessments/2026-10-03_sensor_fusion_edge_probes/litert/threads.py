import sys, time, numpy as np
from PIL import Image
try:
    from ai_edge_litert.interpreter import Interpreter; RT = "ai-edge-litert"
except ImportError:
    from tflite_runtime.interpreter import Interpreter; RT = "tflite-runtime"
M = sys.argv[1]; x = np.expand_dims(np.asarray(Image.open(M + "/../img/zidane.jpg").convert("RGB").resize((300, 300)), dtype=np.uint8), 0)
for th in (1, 4, None):
    it = Interpreter(model_path=f"{M}/Head/detect.tflite", num_threads=th) if th else Interpreter(model_path=f"{M}/Head/detect.tflite")
    it.allocate_tensors(); d = it.get_input_details()[0]; it.set_tensor(d["index"], x); it.invoke(); ts = []
    for _ in range(10): t0 = time.perf_counter(); it.invoke(); ts.append((time.perf_counter() - t0) * 1000)
    print(RT, "num_threads", th or "default", "median", round(sorted(ts)[5], 1), "ms")
