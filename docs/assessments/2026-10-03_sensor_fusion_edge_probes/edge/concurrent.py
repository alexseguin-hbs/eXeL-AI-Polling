"""Two devices at once must never crash the edge node: 8 peers x 5 frames, at the same moment.
Pass = every request answered 200 with an envelope, and every seq unique (one counter, no lost update)."""
import json, sys, threading, urllib.request
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8525/infer?model=Demo90"
FRAME = open(sys.argv[2] if len(sys.argv) > 2 else "../bench/img/zidane.jpg", "rb").read()
ok, bad, seqs, lock = [0], [], [], threading.Lock()
go = threading.Barrier(8)
def peer(k):
    go.wait()
    for _ in range(5):
        try:
            r = urllib.request.urlopen(urllib.request.Request(URL + f"&peer=p{k}", data=FRAME, headers={"Content-Type": "image/jpeg"}), timeout=60)
            env = json.loads(r.read()); 
            with lock: ok[0] += 1; seqs.append(env["seq"])
        except Exception as e:
            with lock: bad.append(type(e).__name__ + ": " + str(e)[:80])
ts = [threading.Thread(target=peer, args=(k,)) for k in range(8)]; [t.start() for t in ts]; [t.join() for t in ts]
print(f"answered {ok[0]}/40 · failed {len(bad)} · unique seq {len(set(seqs))}/{len(seqs)}")
for b in sorted(set(bad))[:4]: print("  ", b)
sys.exit(0 if ok[0] == 40 and len(set(seqs)) == len(seqs) else 1)
