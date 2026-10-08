// Hero keeps the original row, with three titles. The card text is the 13-section framework, and so is the download.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const src = readFileSync(new URL("../app/vision-2525/page.tsx", import.meta.url), "utf8");
ok(/const FRAMEWORK_DOWNLOAD = "https:\/\/ppgfjplawtlrfqpnszyb\.supabase\.co\/storage\/v1\/object\/public\/whitepaper\/VISION-2525\.pdf";/.test(src), "the download is the 13-section PDF");
ok(/download="VISION-2525\.pdf"/.test(src) && /data-vision-download="framework"/.test(src), "the card download uses that PDF");
ok(/The Framework/.test(src) && /Executive Summary/.test(src) && /The Record/.test(src), "the hero has the three titles");
ok(/href="\/vision-2525\/white-paper\/"/.test(src), "The Record opens the finished white paper");
ok(/Thirteen sections/.test(src), "the card says thirteen sections");
ok(/Humanity's Coordination Framework/.test(src), "the card title is the framework");
ok(!/Nineteen sections/.test(src), "the card no longer says nineteen sections");
ok(!/Recursive Coordination for Human Continuity/.test(src), "the old card title is gone");
ok(!/>\s*Detailed Framework\s*</.test(src), "Detailed Framework is no longer a title");
ok(!/FRAMEWORK_SECTIONS/.test(src), "the thirteen-part list is not on this page");
ok(/#D18BE0/.test(src), "the download mark is the violet icon");
console.log(`\nvision-download: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
