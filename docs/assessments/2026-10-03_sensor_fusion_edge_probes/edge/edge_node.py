#!/usr/bin/env python3
"""REFERENCE PROBE — not Sensor Fusion app code. Claude Code, 2026-10-03, for Grok.

One Python backbone that runs the same on a Raspberry Pi, a PC, a Mac or a cloud box:
  * the model list IS the folder: every Home/SensorFusion/<Name>/Sample_TFLite_model/ with the three files
  * POST /infer?model=<Name>[&then=<Name2>]  body = a JPEG frame  ->  one envelope (JSON)
  * GET  /models                                ->  the folder list
  * GET  /                                       ->  the page (the browser is the screen and the camera)
The envelope is the SAME whether the CNN ran here (Python) or in the browser (WASM): verb, model, layer, boxes
read only up to the model's own count, a replay hash, and a Light Codex caption for the frame.
Stdlib HTTP + tflite-runtime (numpy<2) + Pillow. No framework, no second model store.
"""
import io, json, os, sys, time, hashlib, threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import numpy as np
from PIL import Image
try:
    from tflite_runtime.interpreter import Interpreter
except ImportError:
    from tensorflow.lite.python.interpreter import Interpreter

HOME = os.path.realpath(os.environ.get("SF_HOME") or "") if os.environ.get("SF_HOME") else os.path.join(os.path.expanduser("~"), "Home", "SensorFusion")
PAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "page.html")
SESSION = hashlib.sha1(str(time.time()).encode()).hexdigest()[:8]
_cache, _seq = {}, [0]
_guard = threading.Lock()   # one interpreter is NOT thread-safe; the server is threaded: one lock per model, one for the seq

def inside(p, root):   # "/x/home_sibling".startswith("/x/home") is True; commonpath is the real test
    p, root = os.path.realpath(p), os.path.realpath(root)
    return os.path.commonpath([p, root]) == root

def models():
    out = []
    for name in sorted(os.listdir(HOME)) if os.path.isdir(HOME) else []:
        d = os.path.join(HOME, name, "Sample_TFLite_model")
        if all(os.path.isfile(os.path.join(d, f)) for f in ("detect.tflite", "labelmap.txt")):
            out.append({"name": name, "coral_file": os.path.isfile(os.path.join(d, "edgetpu.tflite"))})
    return out

def load(name):
    if name not in _cache:
        d = os.path.join(HOME, name, "Sample_TFLite_model")
        it = Interpreter(model_path=os.path.join(d, "detect.tflite")); it.allocate_tensors()
        labels = [l.rstrip("\n") for l in open(os.path.join(d, "labelmap.txt"), encoding="utf-8")]
        _cache[name] = (it, labels, threading.Lock())
    return _cache[name]

def detect(name, img, min_score=0.5):
    with _guard: it, labels, mlock = load(name)
    with mlock:                  # two peers at once queue here instead of crashing invoke()
        return _detect(it, labels, img, min_score)

def _detect(it, labels, img, min_score):
    d = it.get_input_details()[0]; h, w = int(d["shape"][1]), int(d["shape"][2])
    x = np.expand_dims(np.asarray(img.convert("RGB").resize((w, h)), dtype=np.uint8), 0)
    it.set_tensor(d["index"], x); t0 = time.perf_counter(); it.invoke(); ms = (time.perf_counter() - t0) * 1000
    o = it.get_output_details()
    n = int(it.get_tensor(o[3]["index"])[0])                      # read only what the model says it filled
    b = it.get_tensor(o[0]["index"])[0][:n]; c = it.get_tensor(o[1]["index"])[0][:n]; s = it.get_tensor(o[2]["index"])[0][:n]
    boxes = [{"label": labels[int(c[i])] if 0 <= int(c[i]) < len(labels) else "?", "cls": int(c[i]), "score": round(float(s[i]), 3),
              "box": [round(float(v), 4) for v in b[i]]} for i in range(n) if s[i] >= min_score]
    return boxes, ms

def caption(env):   # Light Codex alphabet: A-Z 0-9 space . - _ • :  (the frame carries its own signed line)
    top = env["payload"]["layers"][-1]["boxes"][:1]
    word = (top[0]["label"] if top else "NONE").upper()
    txt = f'{env["payload"]["layers"][-1]["model"].upper()} {word} {int(round((top[0]["score"] if top else 0) * 100))} S{env["seq"]}'
    return "".join(ch for ch in txt.replace(".", " ").replace("_", "-") if ch.isalnum() or ch in " -:")[:32]

def envelope(peer, verb, layers, ms):
    with _guard: _seq[0] += 1; seq = _seq[0]
    env = {"v": 1, "session": SESSION, "peer": peer, "seq": seq, "at": int(time.time() * 1000), "verb": verb,
           "authority": "MARK",   # a detection is a mark, never permission to act (Drone-2525 fire law)
           "payload": {"layers": layers, "ms": round(ms, 1)}}
    env["hash"] = hashlib.sha256(json.dumps({"verb": verb, "layers": layers}, sort_keys=True, separators=(",", ":")).encode()).hexdigest()[:16]
    env["codex"] = caption(env)
    return env

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, body, ctype="application/json"):
        data = body if isinstance(body, (bytes, bytearray)) else json.dumps(body).encode()
        self.send_response(code); self.send_header("Content-Type", ctype); self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/models": return self._send(200, {"home": HOME, "models": models()})
        if u.path.startswith("/m/"):   # the browser path fetches the SAME files from the same folders
            p = os.path.normpath(os.path.join(HOME, u.path[3:]))
            if inside(p, HOME) and os.path.isfile(p): return self._send(200, open(p, "rb").read(), "application/octet-stream")
            return self._send(404, {"error": "no such file"})
        lib = os.path.realpath(os.environ["SF_WEBLIB"]) if os.environ.get("SF_WEBLIB") else None   # the browser runtime files, served by the node itself (no CDN needed on a closed network)
        if lib and u.path.startswith("/lib/"):
            p = os.path.normpath(os.path.join(lib, u.path[5:]))
            if inside(p, lib) and os.path.isfile(p):
                ct = "application/wasm" if p.endswith(".wasm") else "text/javascript" if p.endswith(".js") else "application/octet-stream"
                return self._send(200, open(p, "rb").read(), ct)
        if u.path in ("/", "/index.html") and os.path.isfile(PAGE): return self._send(200, open(PAGE, "rb").read(), "text/html")
        self._send(404, {"error": "not found"})
    def do_OPTIONS(self):
        self.send_response(204); self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Headers", "*"); self.end_headers()
    def do_POST(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path != "/infer": return self._send(404, {"error": "not found"})
        raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        try: img = Image.open(io.BytesIO(raw))
        except Exception: return self._send(400, {"error": "not a picture"})
        name = q.get("model", ["Demo90"])[0]; then = q.get("then", [None])[0]
        if name not in [m["name"] for m in models()]: return self._send(404, {"error": f"no folder {name}"})
        try: boxes, ms = detect(name, img)
        except Exception as e: return self._send(500, {"error": "model stopped", "detail": str(e)[:200]})   # never drop the peer without an answer
        layers = [{"layer": 1, "model": name, "boxes": boxes}]
        if then and boxes:   # the patent's layered identification: a later, more specific model runs on the early layer's box
            y0, x0, y1, x1 = boxes[0]["box"]; W, Hh = img.size
            crop = img.crop((int(max(0, x0) * W), int(max(0, y0) * Hh), int(min(1, x1) * W), int(min(1, y1) * Hh)))
            b2, ms2 = detect(then, crop); ms += ms2; layers.append({"layer": 2, "model": then, "within": 0, "boxes": b2})
        self._send(200, envelope(q.get("peer", ["web"])[0], "DETECT" if len(layers) == 1 else "IDENTIFY", layers, ms))

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8525
    print(f"edge node · {HOME} · {len(models())} model folders · http://0.0.0.0:{port}/")
    ThreadingHTTPServer(("0.0.0.0", port), H).serve_forever()
