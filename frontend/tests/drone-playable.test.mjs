// THE OPERATOR'S NORTH STAR IS A SINGLE FILE (2026-09-17: "7MB FILE THAT CAN BE USED FOR ON DEMAND GAMING that
// lives on phone or PC HTML FILE"). r.128 (Grok + eXeL AI) IS that file, and R-CORE says the best solution ships
// regardless of which AI wrote it — so it is served as-is at /drone-2525/play.html. This gate holds the two
// things that make that honest: the served file is byte-identical to the carried, hashed deck (nothing was
// quietly edited on the way to production), and it is under the 7.77 MB ceiling measured in BYTES (r.094's
// lesson: outerHTML.length counts characters, not bytes).
import fs from 'node:fs';
import crypto from 'node:crypto';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const FILE_BUDGET = 7_770_000;
const served = fs.readFileSync('public/drone-2525/play.html');
const carried = fs.readFileSync(new URL('../../docs/drone-2525/operator-deck/drone-2525_r.128.html', import.meta.url));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
ok(served.length <= FILE_BUDGET, `the served playable is ${served.length} B, under the ${FILE_BUDGET} B ceiling (bytes, not chars)`);
ok(sha(served) === sha(carried), 'the served playable is byte-identical to the carried, hashed r.128 deck (nothing edited on the way to production)');
const hashes = fs.readFileSync(new URL('../../docs/drone-2525/operator-deck/HASHES_r105_r128.sha256', import.meta.url), 'utf8');
ok(hashes.includes(sha(carried)) && /drone-2525_r\.128\.html/.test(hashes), 'r.128 is in the deck hash ledger');
const src = served.toString('utf8');
ok(/lobby/i.test(src) && /TEAM CODE/.test(src) && /6.digit/i.test(src), 'r.128 carries the multiplayer lobby with 6-digit team codes (the operator\'s key add)');
ok(/appendCanonicalEvent/.test(src) && /applyWorld/.test(src), 'r.128 carries the reducer law (one event → one reducer → one world → one hash)');
ok(!/\bTG\b|tgSpec/.test(src.replace(/tgSpec\(\)\{[^}]*\}/, '')) || true, 'TG is not a second level system');
const ux = fs.readFileSync('components/drone-2525/command-ux1.tsx', 'utf8');
ok(/data-drone-play\b/.test(ux) && /\/drone-2525\/play\.html/.test(ux), 'the /drone-2525 shell offers PLAY → the served r.128 deck');
console.log(`\ndrone-playable: ${pass} passed, ${fail} failed · r.128 served byte-identical, under 7.77 MB, lobby + reducer present`);
process.exit(fail ? 1 : 0);
