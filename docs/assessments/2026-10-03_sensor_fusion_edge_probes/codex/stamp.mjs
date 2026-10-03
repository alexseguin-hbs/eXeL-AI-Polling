// Uses the repo's own lib/light-codex.ts (strip-types). Stamps an envelope caption into a frame and reads it back.
import { readFileSync, writeFileSync } from "node:fs";
globalThis.ImageData = class { constructor(data, w, h) { this.data = data; this.width = w; this.height = h; } };
const LC = await import("/home/user/eXeL-AI-Polling/frontend/lib/light-codex.ts");
const [mode, file, caption] = process.argv.slice(2);
const W = 640, H = 360;
if (mode === "stamp") {
  const src = new ImageData(new Uint8ClampedArray(readFileSync(file)), W, H);
  console.log("unsupported chars:", JSON.stringify(LC.unsupportedChars(caption)));
  const signed = LC.placeSignature(src, caption, 2, "2");
  writeFileSync(file.replace(".rgba", ".signed.rgba"), Buffer.from(signed.data.buffer));
  const back = LC.decodeImage(signed); console.log("decode in memory:", JSON.stringify(back && (back.message ?? back)));
} else {
  const img = new ImageData(new Uint8ClampedArray(readFileSync(file)), W, H);
  const back = LC.decodeImage(img); console.log(`decode ${file.split("/").pop()}:`, JSON.stringify(back ? (back.message ?? back) : null));
}
