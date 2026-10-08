// Three papers. The Framework download is the 13-section PDF. The Record is the 19-section paper.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const src = readFileSync(new URL("../app/vision-2525/page.tsx", import.meta.url), "utf8");
ok(/const FRAMEWORK_DOWNLOAD = "https:\/\/ppgfjplawtlrfqpnszyb\.supabase\.co\/storage\/v1\/object\/public\/whitepaper\/VISION-2525\.pdf";/.test(src), "the Download is the 13-section framework PDF");
ok(/download="VISION-2525\.pdf"/.test(src) && /data-vision-download="framework"/.test(src), "the framework download uses that PDF");
ok(/Thirteen sections/.test(src), "the Framework card says thirteen sections");
ok(/Nineteen sections/.test(src), "the Record card says nineteen sections");
ok(/Recursive Coordination for Human Continuity/.test(src), "the Record keeps its own title");
ok(/Humanity's Coordination Framework/.test(src), "the Framework keeps its own title");
ok(/The Measure of a Human Life/.test(src), "the Executive Summary keeps its own title");
ok(/#D18BE0/.test(src), "the download mark is the violet icon");
ok(/The Framework/.test(src) && /Executive Summary/.test(src) && /The Record/.test(src), "the three names are on the page");
ok(/\/vision-2525\/white-paper\//.test(src), "The Record opens the 19-section paper");
ok(/\/whitepaper\/vision-2525-executive-summary\.html/.test(src), "the Executive Summary opens the letter");
ok(!/19-section deep dive/.test(src) && !/>\s*Detailed Framework\s*</.test(src), "the old two names are gone");
console.log(`\nvision-download: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
