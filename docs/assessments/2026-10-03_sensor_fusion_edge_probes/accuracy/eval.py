"""Head / Deer / Tree on Open Images validation pictures, through the program's own interpreter_for + read_hits.
Raw outputs (all 10 boxes) are kept for a threshold sweep; at 0.5 the result is asserted equal to read_hits."""
import sys, json, time, statistics
sys.path.insert(0, '/home/user/eXeL-AI-Polling/frontend/public/sensor-fusion/edge')
import numpy as np
from PIL import Image
import sensor_fusion_edge as sfe
R = '/home/user/de-risking-strategies/sensorfusion/PreLoadedModels/'
MODELS = {'head': 'Model02.Head', 'deer': 'Model01.Deer', 'tree': 'Model04.Tree'}
T = json.load(open('testset.json'))
def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0])); iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy; u = (a[2]-a[0])*(a[3]-a[1]) + (b[2]-b[0])*(b[3]-b[1]) - inter
    return inter / u if u > 0 else 0
out = {}
for k, folder in MODELS.items():
    p = R + folder + '/Sample_TFLite_model/'
    names = [l.strip() for l in open(p + 'labelmap.txt', encoding='utf-8')]
    it = sfe.interpreter_for(p + 'detect.tflite', False); it.allocate_tensors()
    o = it.get_output_details()
    rows = []; times = []
    imgs = [(i, 'pos') for i in T['plan'][k]['pos']] + [(i, 'neg') for i in T['plan'][k]['neg']]
    for i, kind in imgs:
        img = Image.open(f'img/{i}.jpg').convert('RGB')
        hits, fps = sfe.read_hits(it, img, names)          # the program's own path (threshold 0.5)
        times.append(1000.0 / fps)
        b = it.get_tensor(o[0]['index'])[0]; c = it.get_tensor(o[1]['index'])[0]; s = it.get_tensor(o[2]['index'])[0]
        dets = [{'score': float(s[j]), 'cls': int(round(float(c[j]))), 'box': [float(b[j][1]), float(b[j][0]), float(b[j][3]), float(b[j][2])]} for j in range(len(s))]
        assert len(hits) == sum(1 for d in dets if 0.5 < d['score'] <= 1), (i, len(hits))
        rows.append({'id': i, 'kind': kind, 'dets': dets, 'gt': T['gt'][i][k], 'w': img.width, 'h': img.height})
    res = {'model': folder, 'labels': names, 'n_pos': sum(r['kind']=='pos' for r in rows), 'n_neg': sum(r['kind']=='neg' for r in rows),
           'ms_median': round(statistics.median(times), 1), 'ms_p90': round(sorted(times)[int(0.9*len(times))-1], 1), 'sweep': {}}
    for th in [0.3, 0.4, 0.5, 0.6, 0.7]:
        pos_hit = sum(1 for r in rows if r['kind']=='pos' and any(d['score'] > th for d in r['dets']))
        neg_hit = sum(1 for r in rows if r['kind']=='neg' and any(d['score'] > th for d in r['dets']))
        tp = fp = 0; gt_total = gt_found = 0
        for r in rows:
            g = r['gt']; single = [x for x in g if not x[4]]; groups = [x for x in g if x[4]]
            used = set()
            for d in sorted([d for d in r['dets'] if d['score'] > th], key=lambda d: -d['score']):
                best, bj = 0, -1
                for j, x in enumerate(single):
                    if j in used: continue
                    v = iou(d['box'], x[:4])
                    if v > best: best, bj = v, j
                if best >= 0.5: used.add(bj); tp += 1
                elif any(iou(d['box'], x[:4]) >= 0.3 or (d['box'][0] >= x[0]-0.02 and d['box'][2] <= x[2]+0.02 and d['box'][1] >= x[1]-0.02 and d['box'][3] <= x[3]+0.02) for x in groups): tp += 1
                else: fp += 1
            gt_total += len(single); gt_found += len(used)
        res['sweep'][str(th)] = {'pos_images_with_a_box': f'{pos_hit}/{res["n_pos"]}', 'neg_images_with_a_box': f'{neg_hit}/{res["n_neg"]}',
                                 'box_precision': round(tp / (tp + fp), 3) if tp + fp else None, 'box_recall': round(gt_found / gt_total, 3) if gt_total else None,
                                 'tp': tp, 'fp': fp, 'gt_boxes': gt_total, 'gt_found': gt_found}
    res['top_pos'] = sorted(((max([d['score'] for d in r['dets']] or [0]), r['id']) for r in rows if r['kind']=='pos'))[:5]
    res['top_neg'] = sorted(((max([d['score'] for d in r['dets']] or [0]), r['id']) for r in rows if r['kind']=='neg'), reverse=True)[:5]
    out[k] = res
    json.dump(rows, open(f'rows-{k}.json', 'w'))
json.dump(out, open('results.json', 'w'), indent=1)
for k, r in out.items():
    s = r['sweep']['0.5']
    print(f"{k:5} {r['model']:13} pos-with-box {s['pos_images_with_a_box']:6} neg-with-box {s['neg_images_with_a_box']:6} precision {s['box_precision']} recall {s['box_recall']} (gt {s['gt_boxes']}) median {r['ms_median']} ms")
