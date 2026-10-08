// The card describes the 13-section framework. Download and Open it deliver that PDF.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const src = readFileSync(new URL("../app/vision-2525/page.tsx", import.meta.url), "utf8");
ok(/const FRAMEWORK_DOWNLOAD = "https:\/\/ppgfjplawtlrfqpnszyb\.supabase\.co\/storage\/v1\/object\/public\/whitepaper\/VISION-2525\.pdf";/.test(src), "the Download is the 13-section framework PDF");
ok(/href=\{FRAMEWORK_DOWNLOAD\}[\s\S]{0,800}data-vision-download="framework"/.test(src), "the download button uses it");
ok(/download="VISION-2525\.pdf"/.test(src), "the saved file is the framework PDF");
ok(/Thirteen sections/.test(src), "the card says thirteen sections");
ok(!/Nineteen sections/.test(src), "the card no longer describes the 19-section paper");
ok(!/Recursive Coordination for Human Continuity/.test(src), "the card title is the framework, not the longer paper");
ok(/#D18BE0/.test(src), "the download mark is the violet icon");
ok(/href="\/vision-2525\/white-paper\/"/.test(src) && /19-section deep dive/.test(src), "the top link is the 19-section deep dive");
console.log(`\nvision-download: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
