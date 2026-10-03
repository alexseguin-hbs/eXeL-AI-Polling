import http.server, ssl
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
    def do_GET(self):
        body=b"<!doctype html><title>https</title><p>secure page</p>"
        self.send_response(200); self.send_header("Content-Type","text/html"); self.send_header("Content-Length",str(len(body))); self.end_headers(); self.wfile.write(body)
s=http.server.ThreadingHTTPServer(("0.0.0.0",8643),H)
ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER); ctx.load_cert_chain("c.pem","k.pem"); s.socket=ctx.wrap_socket(s.socket,server_side=True); s.serve_forever()
