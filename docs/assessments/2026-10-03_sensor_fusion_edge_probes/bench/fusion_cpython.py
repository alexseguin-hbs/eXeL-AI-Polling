import asyncio, json, sys
sys.path.insert(0, '.')
from fusion import identify
from PIL import Image
from tflite_runtime.interpreter import Interpreter
M = {}
def load(name):
    if name not in M:
        it = Interpreter(model_path=f'models/{name}/detect.tflite'); it.allocate_tensors()
        M[name] = (it, [l.rstrip('\n') for l in open(f'models/{name}/labelmap.txt', encoding='utf-8')])
    return M[name]
IMG = Image.open(sys.argv[1]).convert('RGB')
async def detect(name, region):
    it, labels = load(name); W, H = IMG.size; y0, x0, y1, x1 = region
    crop = IMG.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))).resize((300, 300))
    import numpy as np
    d = it.get_input_details()[0]; it.set_tensor(d['index'], np.expand_dims(np.asarray(crop, dtype=np.uint8), 0)); it.invoke()
    o = it.get_output_details(); n = int(it.get_tensor(o[3]['index'])[0])
    b = it.get_tensor(o[0]['index'])[0][:n]; c = it.get_tensor(o[1]['index'])[0][:n]; s = it.get_tensor(o[2]['index'])[0][:n]
    return [{'label': labels[int(c[i])], 'score': float(s[i]), 'box': [float(v) for v in b[i]]} for i in range(n)]
print(json.dumps(asyncio.run(identify(detect, ['Demo90', 'Head']))))
