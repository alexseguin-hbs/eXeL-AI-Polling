// Vision-2525 page Download (operator 2026-10-05): "Download needs to highlight download this file, not white paper" —
// the button delivers VISION • 2525 · Humanity's Coordination Framework (the Drive file he named), never the white paper.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const src = readFileSync(new URL("../app/vision-2525/page.tsx", import.meta.url), "utf8");
ok(/const FRAMEWORK_DOWNLOAD = "https:\/\/drive\.google\.com\/uc\?export=download&id=1NKlswkP17KJsluq_vbqTFMX_gmBnN9nO";/.test(src), "the Download is the operator's Drive file (direct download)");
ok(/href=\{FRAMEWORK_DOWNLOAD\}[\s\S]{0,200}data-vision-download="framework"/.test(src), "the ↓ Download button uses it");
ok(!/download="SOI_VISION2525_v\.\d+_LIVING_DOCUMENT\.html"/.test(src), "the button no longer downloads the white paper");
ok(/href="\/vision-2525\/white-paper\/"/.test(src), "the white paper is still one tap away");
console.log(`\nvision-download: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
