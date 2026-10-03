// HTTPS page on a LAN address (secure context) ↔ Python aiortc peer over a WebRTC data channel; SDP carried by "paste".
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
import { readFile, writeFile, rm } from "node:fs/promises"; import { existsSync } from "node:fs";
const D = new URL(".", import.meta.url).pathname, OFFER = D + "offer.json", ANSWER = D + "answer.json";
await rm(OFFER, { force: true }); await rm(ANSWER, { force: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-proxy-server", "--disable-features=WebRtcHideLocalIpsWithMdns"] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true }); const p = await ctx.newPage();
await p.goto("https://192.0.2.2:8643/");
const offer = await p.evaluate(async () => {
  const pc = new RTCPeerConnection({ iceServers: [] }); window.pc = pc; const dc = pc.createDataChannel("edge"); window.dc = dc; window.got = [];
  dc.onmessage = (e) => window.got.push({ at: performance.now(), data: e.data });
  await pc.setLocalDescription(await pc.createOffer());
  await new Promise((ok) => { if (pc.iceGatheringState === "complete") ok(); pc.onicegatheringstatechange = () => pc.iceGatheringState === "complete" && ok(); setTimeout(ok, 3000); });
  return { sdp: pc.localDescription.sdp, type: pc.localDescription.type, secure: self.isSecureContext };
});
await writeFile(OFFER, JSON.stringify(offer));
for (let i = 0; i < 200 && !existsSync(ANSWER); i++) await new Promise((r) => setTimeout(r, 100));
const answer = JSON.parse(await readFile(ANSWER, "utf8"));
const jpeg = Array.from(await readFile(D + "home/_probe/" + (process.env.FRAME || "zidane640.jpg")));
const res = await p.evaluate(async ({ answer, jpeg }) => {
  await window.pc.setRemoteDescription(answer);
  await new Promise((ok, no) => { if (window.dc.readyState === "open") ok(); window.dc.onopen = ok; setTimeout(() => no(new Error("channel did not open; ice=" + window.pc.iceConnectionState + " conn=" + window.pc.connectionState + " sig=" + window.pc.signalingState)), 20000); });
  const bytes = new Uint8Array(jpeg), rt = [], envs = [];
  for (let k = 0; k < 10; k++) {
    const head = new TextEncoder().encode(JSON.stringify({ model: "Demo90", frame: k }) + "\n"); const msg = new Uint8Array(head.length + bytes.length); msg.set(head); msg.set(bytes, head.length);
    const n0 = window.got.length, t0 = performance.now(); window.dc.send(msg);
    const ok1 = await new Promise((ok) => { const t = setTimeout(() => { clearInterval(iv); ok(false); }, 8000); const iv = setInterval(() => { if (window.got.length > n0) { clearInterval(iv); clearTimeout(t); ok(true); } }, 5); }); if (!ok1) return { secure: self.isSecureContext, state: window.pc.connectionState, dc: window.dc.readyState, stalled_at_frame: k, bytes_per_frame: bytes.length, maxMessageSize: window.pc.sctp && window.pc.sctp.maxMessageSize };
    rt.push(performance.now() - t0); envs.push(JSON.parse(window.got[window.got.length - 1].data));
  }
  rt.sort((a, b) => a - b);
  const pair = (await window.pc.getStats()); let cand = null; pair.forEach((s) => { if (s.type === "candidate-pair" && s.state === "succeeded") cand = s; });
  return { secure: self.isSecureContext, state: window.pc.connectionState, frames: envs.length, rt_median_ms: Math.round(rt[5]), rt_min_ms: Math.round(rt[0]), bytes_per_frame: bytes.length, authority: [...new Set(envs.map((e) => e.authority))], verbs: [...new Set(envs.map((e) => e.verb))], first: envs[0].payload.layers[0].boxes.slice(0, 2).map((x) => x.label + " " + x.score), codex: envs[0].codex, candidate_pair: cand && cand.nominated };
}, { answer, jpeg });
console.log(JSON.stringify(res, null, 1)); await b.close();
