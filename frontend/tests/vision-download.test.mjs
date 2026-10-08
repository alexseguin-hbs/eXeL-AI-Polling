// The card describes the 19-section white paper. The Download must be that paper,
// not the shorter framework PDF.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const src = readFileSync(new URL("../app/vision-2525/page.tsx", import.meta.url), "utf8");
ok(/const FRAMEWORK_DOWNLOAD = "\/whitepaper\/vision-2525\.html";/.test(src), "the Download is the 19-section white paper");
ok(/href=\{FRAMEWORK_DOWNLOAD\}[\s\S]{0,500}data-vision-download="framework"/.test(src), "the download button uses it");
ok(/download="Vision-2525\.html"/.test(src), "the saved file is the white paper");
ok(!/VISION-2525\.pdf/.test(src), "the button no longer downloads the shorter framework PDF");
ok(/#D18BE0/.test(src), "the download mark is the violet icon");
ok(/href="\/vision-2525\/white-paper\/"/.test(src), "Open it still opens the same paper");
ok(/Nineteen sections/.test(src), "the card still says nineteen sections");
console.log(`\nvision-download: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
