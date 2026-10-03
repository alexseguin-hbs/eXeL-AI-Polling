"""REFERENCE PROBE — the Sensor Fusion 'brain' as pure Python (no numpy, no runtime import).
It runs unchanged in CPython (Pi, PC, Mac, cloud) and in Pyodide (any browser).
Only `detect(model, region)` is supplied by the host: tflite-runtime in CPython, the JS CNN in a browser.
Layered identification (US20220164611A1 method, published application, listed abandoned):
an early, general layer finds the thing; a later, specific layer looks inside the early layer's box;
one identification comes out, with a score per layer and a combined score."""
import hashlib, json

def _round(b): return [round(float(v), 3) for v in b]

async def identify(detect, layers, min_score=0.5):
    out, region = [], [0.0, 0.0, 1.0, 1.0]             # ymin, xmin, ymax, xmax of the whole frame
    for k, model in enumerate(layers):
        boxes = [b for b in await detect(model, region) if b["score"] >= min_score]
        out.append({"layer": k + 1, "model": model, "boxes": [{"label": b["label"], "score": round(b["score"], 2), "box": _round(b["box"])} for b in boxes]})
        if not boxes: break
        y0, x0, y1, x1 = region; by0, bx0, by1, bx1 = boxes[0]["box"]   # the next layer looks inside the best box, in frame terms
        h, w = y1 - y0, x1 - x0
        region = [y0 + max(0, by0) * h, x0 + max(0, bx0) * w, y0 + min(1, by1) * h, x0 + min(1, bx1) * w]
    found = [L for L in out if L["boxes"]]
    last = found[-1] if found else None
    combined = 1.0
    for L in found: combined *= L["boxes"][0]["score"]
    ident = {"from_layer": last["layer"] if last else 0, "label": last["boxes"][0]["label"] if last else None,
             "score": last["boxes"][0]["score"] if last else 0.0, "combined": round(combined, 3)}
    body = {"verb": "IDENTIFY", "layers": out, "identification": ident}
    return {"v": 1, "authority": "MARK", **body, "hash": hashlib.sha256(json.dumps(body, sort_keys=True, separators=(",", ":")).encode()).hexdigest()[:16]}
