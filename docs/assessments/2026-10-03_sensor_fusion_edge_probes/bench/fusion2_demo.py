import asyncio, json, sys, numpy as np
sys.path.insert(0, '.')
from fusion2 import fuse, sign, verify
from PIL import Image
from tflite_runtime.interpreter import Interpreter
FULL = Image.open('img/zidane.jpg').convert('RGB'); W, H = FULL.size
# sensor B is a second camera that sees the right 70% of the same scene (a narrower field, offset to the right)
CROP = (int(0.30 * W), 0, W, H); B_IMG = FULL.crop(CROP)
it = Interpreter(model_path='models/Demo90/detect.tflite'); it.allocate_tensors()
labels = [l.rstrip('\n') for l in open('models/Demo90/labelmap.txt', encoding='utf-8')]
if labels[0] == '???': del labels[0]  # as Demo90/TFLite_detection_webcam.py:127-129 does
def run(img):
    d = it.get_input_details()[0]; it.set_tensor(d['index'], np.expand_dims(np.asarray(img.resize((300, 300)), dtype=np.uint8), 0)); it.invoke()
    o = it.get_output_details(); n = int(it.get_tensor(o[3]['index'])[0])
    b = it.get_tensor(o[0]['index'])[0][:n]; c = it.get_tensor(o[1]['index'])[0][:n]; s = it.get_tensor(o[2]['index'])[0][:n]
    return [{'label': labels[int(c[i])], 'score': float(s[i]), 'box': [float(v) for v in b[i]]} for i in range(n)]
async def detA(model): return run(FULL)
async def detB(model): return run(B_IMG)
sensors = [{'id': 'cam-A', 'kind': 'rgb-wide', 'detect': detA, 'map': (0.0, 0.0, 1.0, 1.0)},
           {'id': 'cam-B', 'kind': 'rgb-narrow', 'detect': detB, 'map': (0.0, 0.30, 1.0, 0.70)}]
env = asyncio.run(fuse(sensors, 'Demo90'))
for o in env['objects']: print(f"  {o['label']!r:7} box {o['box']}  seen by {o['sensors']}: {o['by']}  combined {o['combined']}")
KEY = b'room-2525-key-from-pairing'
signed = sign(env, KEY); print('signed sig', signed['sig'], 'verify', verify(signed, KEY))
forged = json.loads(json.dumps(signed)); forged['objects'][0]['combined'] = 0.99; print('forged combined=0.99 verify', verify(forged, KEY))
wrong = verify(signed, b'another-room'); print('other room key verify', wrong)
