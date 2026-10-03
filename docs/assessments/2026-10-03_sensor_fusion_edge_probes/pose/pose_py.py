import sys, time, json, numpy as np
from PIL import Image
from ai_edge_litert.interpreter import Interpreter
M = sys.argv[1]; it = Interpreter(model_path=M + "/detect.tflite"); it.allocate_tensors()
d = it.get_input_details()[0]; o = it.get_output_details()
print("input", d["shape"].tolist(), d["dtype"].__name__, "| outputs", [(x["shape"].tolist(), x["dtype"].__name__) for x in o])
names = [l.strip() for l in open(M + "/labelmap.txt")]
img = Image.open(sys.argv[2]).convert("RGB"); h, w = int(d["shape"][1]), int(d["shape"][2])
x = np.expand_dims(np.asarray(img.resize((w, h)), dtype=d["dtype"]), 0); it.set_tensor(d["index"], x); it.invoke()
ts = []
for _ in range(10): t0 = time.perf_counter(); it.invoke(); ts.append((time.perf_counter() - t0) * 1000)
k = it.get_tensor(o[0]["index"])[0][0]  # [17,3] = y, x, score
good = [(names[i], round(float(k[i][1]), 2), round(float(k[i][0]), 2), round(float(k[i][2]), 2)) for i in range(17) if k[i][2] > 0.3]
print("median ms", round(sorted(ts)[5], 1), "| keypoints over 0.3:", len(good)); print(json.dumps(good))
