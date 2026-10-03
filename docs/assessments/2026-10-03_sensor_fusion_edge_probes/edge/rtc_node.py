"""REFERENCE PROBE — the Pi side of a WebRTC data channel (aiortc). Signalling by paste: offer in a file, answer out.
An HTTPS page cannot fetch a plain-http LAN node (Mixed Content), but it CAN open a WebRTC data channel to it."""
import asyncio, io, json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("SF_HOME", os.path.join(os.path.dirname(os.path.abspath(__file__)), "home"))
import edge_node as en
from aiortc import RTCPeerConnection, RTCSessionDescription
from PIL import Image

async def main(offer_path, answer_path):
    while not os.path.exists(offer_path): await asyncio.sleep(0.1)
    offer = json.load(open(offer_path))
    pc = RTCPeerConnection()
    @pc.on("iceconnectionstatechange")
    def _ice(): print("ice", pc.iceConnectionState, flush=True)
    @pc.on("connectionstatechange")
    def _con(): print("conn", pc.connectionState, flush=True)
    @pc.on("datachannel")
    def on_dc(ch):
        @ch.on("message")
        def on_msg(msg):
            if isinstance(msg, str): ch.send(json.dumps({"verb": "PONG", "t": msg})); return
            head, _, jpeg = msg.partition(b"\n")
            q = json.loads(head); img = Image.open(io.BytesIO(jpeg))
            boxes, ms = en.detect(q["model"], img)
            env = en.envelope("rtc-node", "DETECT", [{"layer": 1, "model": q["model"], "boxes": boxes}], ms)
            env["frame"] = q.get("frame"); ch.send(json.dumps(env))
    await pc.setRemoteDescription(RTCSessionDescription(sdp=offer["sdp"], type=offer["type"]))
    await pc.setLocalDescription(await pc.createAnswer())
    while pc.iceGatheringState != "complete": await asyncio.sleep(0.05)
    json.dump({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}, open(answer_path + ".tmp", "w")); os.replace(answer_path + ".tmp", answer_path)
    print("answer written", flush=True)
    await asyncio.sleep(float(os.environ.get("RTC_SECS", "60")))
    await pc.close()

asyncio.run(main(sys.argv[1], sys.argv[2]))
