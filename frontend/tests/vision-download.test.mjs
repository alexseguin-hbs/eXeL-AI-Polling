// The Framework tab scrolls to the card. The download on that card is the 13-section PDF.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const src = readFileSync(new URL("../app/vision-2525/page.tsx", import.meta.url), "utf8");
ok(/href="#framework"/.test(src) && /id="framework"/.test(src), "The Framework tab opens the card below");
ok(/const FRAMEWORK_DOWNLOAD = "https:\/\/ppgfjplawtlrfqpnszyb\.supabase\.co\/storage\/v1\/object\/public\/whitepaper\/VISION-2525\.pdf";/.test(src), "the card download is the 13-section PDF");
ok(/download="VISION-2525\.pdf"/.test(src) && /data-vision-download="framework"/.test(src), "the violet button downloads that PDF");
ok(/The Framework/.test(src) && /Executive Summary/.test(src) && /The Record/.test(src), "the three tabs stay");
ok(/Thirteen sections/.test(src), "the card says thirteen sections");
ok(/href="\/vision-2525\/white-paper\/"/.test(src), "The Record still opens its paper");
console.log(`\nvision-download: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
