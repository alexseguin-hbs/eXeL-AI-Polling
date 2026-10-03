import http.server, os, sys
S=os.environ["SCRATCH"]; OUT="/home/user/eXeL-AI-Polling/frontend/out"; LIB=S+"/tfjsprobe/node_modules/@tensorflow"; UP="/home/user/de-risking-strategies/sensorfusion"
MODE=sys.argv[2]  # "shipped" or "offline"
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
    def translate_path(self, path):
        p=path.split("?")[0]
        if MODE=="offline":
            if p=="/sw.js": return S+"/offline2/sw.js"
            if p=="/sensor-fusion/cnn.js": return S+"/offline2/cnn_sameorigin.js"
            if p.startswith("/sf-lib/"): return LIB+"/"+p[8:]
            if p.startswith("/sf-models/"): return UP+"/"+p[11:]
        else:
            if p=="/sensor-fusion/cnn.js": return "/home/user/eXeL-AI-Polling/frontend/public/sensor-fusion/cnn.js"
        f=OUT+p
        return f+"index.html" if f.endswith("/") else f
    def end_headers(self):
        if MODE=="offline" and self.path.startswith("/SensorFusion-2525/"):  # register the keeper from the page itself in the prototype
            pass
        super().end_headers()
http.server.ThreadingHTTPServer(("127.0.0.1",int(sys.argv[1])),H).serve_forever()
