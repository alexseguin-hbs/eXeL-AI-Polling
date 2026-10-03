// Many realistic captions, each stamped into the same camera frame with the repo's light-codex.ts; then read back.
import { readFileSync, writeFileSync } from "node:fs";
globalThis.ImageData = class { constructor(data, w, h) { this.data = data; this.width = w; this.height = h; } };
const LC = await import("/home/user/eXeL-AI-Polling/frontend/lib/light-codex.ts");
const W = 640, H = 360, [mode] = process.argv.slice(2);
const caps = JSON.parse(readFileSync("caps.json", "utf8"));
if (mode === "stamp") caps.forEach((c, i) => { const src = new ImageData(new Uint8ClampedArray(readFileSync("frame.rgba")), W, H); writeFileSync(`s${i}.rgba`, Buffer.from(LC.placeSignature(src, c, 2, "2").data.buffer)); });
else { const out = { right: 0, wrong_verified: 0, wrong_unverified: 0, nothing: 0, examples: [] };
  caps.forEach((c, i) => { const back = LC.decodeImage(new ImageData(new Uint8ClampedArray(readFileSync(`${mode}${i}.rgba`)), W, H));
    const msg = back ? back.messageForward : null, ver = back ? back.verified : null, style = back ? back.style : null; out.styles = out.styles || {}; if (style) out.styles[style] = (out.styles[style] || 0) + 1;
    if (msg == null) out.nothing++; else if (msg === c) out.right++; else { (ver ? out.wrong_verified++ : out.wrong_unverified++); if (out.examples.length < 3) out.examples.push([c, msg, ver]); } });
  console.log(mode, JSON.stringify(out)); }
