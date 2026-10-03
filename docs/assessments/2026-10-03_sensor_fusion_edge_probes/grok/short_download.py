# A server that promises 4,183,312 bytes (detect.tflite) and drops the line after 1 MB, as a weak link does.
import socket, threading, urllib.request, os, sys
srv = socket.socket(); srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); srv.bind(("127.0.0.1", 0)); srv.listen(1); port = srv.getsockname()[1]
def serve():
    c, _ = srv.accept(); c.recv(65536)
    c.sendall(b"HTTP/1.1 200 OK\r\nContent-Length: 4183312\r\nContent-Type: application/octet-stream\r\n\r\n" + b"\x00" * 1_000_000); c.close()
threading.Thread(target=serve, daemon=True).start()
dest = sys.argv[1]
try: urllib.request.urlretrieve(f"http://127.0.0.1:{port}/detect.tflite", dest)   # the call sensor_fusion_edge.py fetch() makes
except Exception as e: print("urlretrieve raised:", type(e).__name__)
print("file left on disk:", os.path.getsize(dest), "bytes of 4183312")
