// Vision-2525 page Download (operator 2026-10-05): "Download needs to highlight download this file, not white paper" —
// the button delivers VISION • 2525 · Humanity's Coordination Framework (the Drive file he named), never the white paper.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const src = readFileSync(new URL("../app/vision-2525/page.tsx", import.meta.url), "utf8");
ok(/const FRAMEWORK_DOWNLOAD = "https:\/\/ppgfjplawtlrfqpnszyb\.supabase\.co\/storage\/v1\/object\/public\/whitepaper\/VISION-2525\.pdf";/.test(src), "the Download is the Vision PDF on Supabase");
ok(/href=\{FRAMEWORK_DOWNLOAD\}[\s\S]{0,500}data-vision-download="framework"/.test(src), "the download button uses it");
ok(/#D18BE0/.test(src), "the download mark is the violet icon");
ok(!/download="SOI_VISION2525_v\.\d+_LIVING_DOCUMENT\.html"/.test(src), "the button no longer downloads the white paper");
ok(/href="#recursive"/.test(src) && /id="recursive"/.test(src), "the top tab opens the recursive section");
ok(/PDF · 13 sections/.test(src), "the download says it is the 13-section PDF");
console.log(`\nvision-download: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
