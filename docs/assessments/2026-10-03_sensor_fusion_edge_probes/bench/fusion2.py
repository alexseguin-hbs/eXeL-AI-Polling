"""REFERENCE PROBE — two sensors, one identification (the step US20220164611A1 describes and Sensor Fusion has not built).
Pure Python (runs in CPython and Pyodide). Each sensor has its own detect() and a known mapping into a shared frame
(here a simple offset/scale; on hardware it comes from calibration). Boxes that overlap in the shared frame are the
same object: one identification, a score per sensor, and a combined score (noisy-OR: 1 - (1-a)(1-b)).
An object only one sensor sees stays a single-sensor mark. Envelopes are signed with a room key (HMAC-SHA256), so a
mark that was changed on the way is refused."""
import hashlib, hmac, json

def to_shared(box, m):            # box = ymin, xmin, ymax, xmax in the sensor's frame; m = (dy, dx, sy, sx)
    dy, dx, sy, sx = m; y0, x0, y1, x1 = box
    return [dy + y0 * sy, dx + x0 * sx, dy + y1 * sy, dx + x1 * sx]

def iou(a, b):
    iy = max(0, min(a[2], b[2]) - max(a[0], b[0])); ix = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    i = ix * iy; u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i
    return i / u if u > 0 else 0.0

async def fuse(sensors, model, min_score=0.5, same=0.5):
    """sensors: [{"id": "cam-A", "kind": "rgb", "detect": coroutine(model), "map": (dy, dx, sy, sx)}, ...]"""
    seen = []
    for s in sensors:
        for b in await s["detect"](model):
            if b["score"] >= min_score:
                seen.append({"sensor": s["id"], "kind": s["kind"], "label": b["label"], "score": round(b["score"], 2), "box": [round(v, 3) for v in to_shared(b["box"], s["map"])]})
    objects = []
    for d in sorted(seen, key=lambda x: -x["score"]):
        for o in objects:
            if o["label"] == d["label"] and d["sensor"] not in o["by"] and iou(o["box"], d["box"]) >= same:
                o["by"][d["sensor"]] = d["score"]; break
        else:
            objects.append({"label": d["label"], "box": d["box"], "by": {d["sensor"]: d["score"]}})
    for o in objects:
        miss = 1.0
        for v in o["by"].values(): miss *= (1 - v)
        o["combined"] = round(1 - miss, 3); o["sensors"] = len(o["by"])
    return {"v": 1, "verb": "FUSE", "authority": "MARK", "model": model, "objects": objects}

def sign(env, key):
    body = json.dumps(env, sort_keys=True, separators=(",", ":")).encode()
    return {**env, "sig": hmac.new(key, body, hashlib.sha256).hexdigest()[:32]}

def verify(env, key):
    e = dict(env); sig = e.pop("sig", "")
    body = json.dumps(e, sort_keys=True, separators=(",", ":")).encode()
    return hmac.compare_digest(sig, hmac.new(key, body, hashlib.sha256).hexdigest()[:32])
