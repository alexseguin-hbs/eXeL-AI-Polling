#!/usr/bin/env python3
# Demo.90 test card — runs the same detect.tflite the browser loads on the operator's Austin picture: one full-frame pass plus four
# overlapping tiles, class-wise NMS. Full frame alone misses the dog and the cyclist (SSD top-10 at 300x300); full + tiles finds all five.
# Run: pip install ai-edge-litert numpy pillow; fetch detect.tflite + labelmap.txt from
#   https://raw.githubusercontent.com/De-Risking-Strategies/SensorFusion/master/Demo90/Sample_TFLite_model/
#   python3 scripts/sensor-fusion/demo90-testcard.py <image.png> <detect.tflite> <labelmap.txt> <out.json> <out.png>
import json, sys, hashlib, numpy as np
from PIL import Image, ImageDraw
from ai_edge_litert.interpreter import Interpreter
img_path, model, labels_path, out_json, out_png = sys.argv[1:6]
labels = [l.strip() for l in open(labels_path)]
it = Interpreter(model_path=model); it.allocate_tensors()
inp = it.get_input_details()[0]; outs = it.get_output_details(); H, W = inp['shape'][1], inp['shape'][2]
im = Image.open(img_path).convert('RGB'); iw, ih = im.size
def run(box, tag):
    ox, oy, x2, y2 = box; crop = im.crop(box); cw, ch = crop.size
    x = np.expand_dims(np.asarray(crop.resize((W, H))), 0).astype(inp['dtype'])
    it.set_tensor(inp['index'], x); it.invoke(); o = [it.get_tensor(d['index']) for d in outs]
    return [{"label": labels[int(c)+1], "score": round(float(s),3), "box_px": [round(ox+b[1]*cw), round(oy+b[0]*ch), round(ox+b[3]*cw), round(oy+b[2]*ch)], "pass": tag}
            for b, c, s in zip(o[0][0], o[1][0], o[2][0])]
T = iw // 2; ov = 160
passes = [((0,0,iw,ih),'full')] + [((ox,oy,min(iw,ox+T+ov),min(ih,oy+T+ov)),f'tile{i}') for i,(ox,oy) in enumerate([(0,0),(T-ov,0),(0,T-ov),(T-ov,T-ov)])]
full = run(*passes[0]); cand = full + sum([run(*p) for p in passes[1:]], [])
def iou(a, b):
    ix = max(0, min(a[2],b[2])-max(a[0],b[0])); iy = max(0, min(a[3],b[3])-max(a[1],b[1])); i = ix*iy
    u = (a[2]-a[0])*(a[3]-a[1]) + (b[2]-b[0])*(b[3]-b[1]) - i; return i/u if u else 0
keep = []
for d in sorted([c for c in cand if c["score"] >= 0.5], key=lambda z: -z["score"]):
    if all(not (k["label"] == d["label"] and (iou(k["box_px"], d["box_px"]) > 0.4 or (min(k["box_px"][2],d["box_px"][2])-max(k["box_px"][0],d["box_px"][0]))*(min(k["box_px"][3],d["box_px"][3])-max(k["box_px"][1],d["box_px"][1])) > 0.7*min((d["box_px"][2]-d["box_px"][0])*(d["box_px"][3]-d["box_px"][1]),(k["box_px"][2]-k["box_px"][0])*(k["box_px"][3]-k["box_px"][1])))) for k in keep):
        keep.append(d)
area = lambda b: (b[2]-b[0])*(b[3]-b[1])
main = {}
for d in keep:
    if d["label"] in ("person","bicycle","car","dog","traffic light"):
        main.setdefault(d["label"], []).append(d)
headline = []
for lab in ("person","bicycle","car","dog","traffic light"):
    xs = sorted(main.get(lab, []), key=lambda d: -area(d["box_px"]))
    headline += xs[:2] if lab == "person" else xs[:1]
full_found = sorted({d["label"] for d in full if d["score"] >= 0.5})
res = {"what": "Demo.90 (detect.tflite, SSD MobileNet COCO, 300x300, top-10 per pass) on the operator's Austin test card",
       "model_sha256": hashlib.sha256(open(model,'rb').read()).hexdigest(), "image_sha256": hashlib.sha256(open(img_path,'rb').read()).hexdigest(),
       "image": [iw, ih], "passes": ["full frame"] + [f"tile {i}: {p[0]}" for i, p in enumerate(passes[1:])], "keep_threshold": 0.5, "nms_iou": 0.4,
       "full_frame_only_finds": full_found, "full_plus_tiles_finds": sorted({d["label"] for d in keep}),
       "headline": [{k: d[k] for k in ("label","score","box_px","pass")} for d in headline],
       "all": [{k: d[k] for k in ("label","score","box_px","pass")} for d in keep]}
json.dump(res, open(out_json,'w'), indent=1)
dr = ImageDraw.Draw(im)
for d in headline:
    dr.rectangle(d["box_px"], outline=(0,255,160), width=4); dr.text((d["box_px"][0]+5, d["box_px"][1]+5), f'{d["label"]} {round(d["score"]*100)}%', fill=(0,255,160))
im.save(out_png)
print("full only:", full_found); print("full+tiles:", res["full_plus_tiles_finds"])
for d in headline: print(d["label"], d["score"], d["box_px"], d["pass"])
