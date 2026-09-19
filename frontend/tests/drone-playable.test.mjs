// THE OPERATOR'S NORTH STAR IS A SINGLE FILE (2026-09-17: "7MB FILE THAT CAN BE USED FOR ON DEMAND GAMING that
// lives on phone or PC HTML FILE"). The carried deck IS that file and R-CORE says the best solution ships regardless
// of which AI wrote it — so it is served as-is at /drone-2525/play.html. This gate holds the things that make that
// honest: the served file is byte-identical to the carried, hashed deck (nothing quietly edited on the way to
// production), it is under the 7.77 MB ceiling measured in BYTES (r.094's lesson), and the revision's operator
// changes are present in the served bytes (the deck's own boot QA proves they WORK at runtime).
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DECK_REV } from './deck-head.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const REV = DECK_REV;
const FILE_BUDGET = 7_770_000;
const served = fs.readFileSync('public/drone-2525/play.html');
const carried = fs.readFileSync(new URL(`../../docs/drone-2525/operator-deck/drone-2525_r.${REV}.html`, import.meta.url));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
ok(served.length <= FILE_BUDGET, `the served playable is ${served.length} B, under the ${FILE_BUDGET} B ceiling (bytes, not chars)`);
ok(sha(served) === sha(carried), `the served playable is byte-identical to the carried, hashed r.${REV} deck (nothing edited on the way to production)`);
const hashes = fs.readFileSync(new URL(`../../docs/drone-2525/operator-deck/HASHES_r${REV}.sha256`, import.meta.url), 'utf8');
ok(hashes.includes(sha(carried)) && new RegExp(`drone-2525_r\\.${REV}\\.html`).test(hashes), `r.${REV} is in the deck hash ledger`);
const src = served.toString('utf8');
ok(new RegExp(`revision:'0\\.${REV}'`).test(src) && !/r0\.130\b/.test(src) && !/r0\.129\b/.test(src) && !/r0\.123/.test(src), `r.${REV} declares itself and carries no stale bookkeeping`);
// r.129 — still present
ok(/function bullseye\(/.test(src) && /bullseye\(p\.x,p\.y\+1\.2,p\.z,segs\)/.test(src) && /function bullseye\(x,y,z,segs\)/.test(src), 'standing targets carry the white-circle bullseye (r.129)');
ok(/reason:'TWO_HUMANS'/.test(src) && /state\.lobby\.phase==='LIVE'&&!byPeer/.test(src), 'in a live room the red box needs two separate humans (r.129)');
// r.130 — the range with turrets actually works
ok(/function fwdOf\(yaw,tilt\)\{const ct=Math\.cos\(tilt\|\|0\);return \{fx:-Math\.sin\(yaw\)\*ct,fy:Math\.sin\(tilt\|\|0\),fz:Math\.cos\(yaw\)\*ct\};\}/.test(src), 'ONE forward basis: fwdOf is the projector\'s forward (−sin yaw, cos yaw)');
ok(/const f=fwdOf\(yaw,tilt\); return \{x,y:ey,z,yaw,tilt,fx:f\.fx,fy:f\.fy,fz:f\.fz\};/.test(src) && /const fb=fwdOf\(u\.yaw,0\), fx=fb\.fx, fz=fb\.fz;/.test(src) && /const fb=fwdOf\(byaw,0\),fx=fb\.fx,fz=fb\.fz;/.test(src), 'camOf, phys and the driveSign QA all read fwdOf — nothing else derives a forward');
ok(!/Math\.atan2\(dx,-dz\)/.test(src) && (src.match(/aimUnitAt\(/g) || []).length >= 5 && (src.match(/yawTo\(/g) || []).length >= 3, 'every aim goes through aimUnitAt/yawTo (no atan2(dx,−dz) survivor of the old basis)');
ok(!/u\.yaw=Math\.PI;/.test(src) && /Math\.abs\(p0u\.yaw\)<1e-6/.test(src), 'the range pit parks at yaw 0 and faces its plates under the one basis');
ok(/const EXPOSURE_S=\{50:3,100:4,150:5,200:6,250:7,300:8\};/.test(src) && /function exposureOrder\(lane\)/.test(src) && /function rangeTick\(dt\)/.test(src) && /if\(\+state\.challenge===0\) rangeTick\(dt\);/.test(src), 'per-lane pop-up exposures, 3 s at 50 m to 8 s at 300 m (FM 3-22.9), driven from spawn');
ok(/function plateHit\(q\)/.test(src) && /const hit=!!state\.simDirect \|\| \(ph\?ph\.hit:off<32\);/.test(src) && /const PIP_FLOOR_MRAD=3;/.test(src), 'a silhouette is hit when the pip is inside its projected outline (scale-true), with a declared angular floor');
ok(/TRAINING · RESET<\/option>/.test(src) && /TRAINING · DOWN<\/option>/.test(src) && /QUAL · 40<\/option>/.test(src) && /const RANGE_MODE_NAME=\{bounce:'TRAINING · RESET',stay:'TRAINING · DOWN',qual40:'QUAL · 40'\};/.test(src), 'the three range modes carry the operator\'s names');
ok(/function rangeLapse\(q\)/.test(src) && /qualRecordShot\(false,q\.id\)/.test(src), 'in QUAL · 40 a lapsed exposure is an unfired MISS round');
ok(/id:'C-100C'/.test(src) && !/C-250B/.test(src) && /\^C-100\[LCR\]\$/.test(src), 'the ten silhouettes follow the 9127 sheet (100 m ×3, one 250, one 300)');
ok(/function kindOfRef\(ref\)/.test(src) && /kind:kindOfRef\(o\)/.test(src) && /by:\(same&&same\.by\)\|\|row\.peerId\|\|SID/.test(src), 'the reducer keeps the target\'s kind and the designator\'s identity — the author designate() wrote comes first (r.133: the AI member\'s mark was re-stamped with the human\'s id)');
ok(/if\(typeof buoys!=='undefined' && u\.kind!=='turret'\)buoys\.forEach/.test(src), 'a turret never locks a buoy');
const qaBlock = src.slice(src.indexOf('the range with turrets actually works — one forward basis'), src.indexOf("state.simDirect=sv2.sd; }"));
ok(qaBlock.length > 2000 && !/simDirect=true/.test(qaBlock) && /state\.simDirect=false;/.test(qaBlock), 'the r.130 range QA fires AIMED shots only — no simDirect anywhere in it');
ok(/state\.drawErr=String\(e\);/.test(src) && /id:'DRAW_COMPLETES'/.test(src) && /state\.drawDone=\(state\.drawDone\|\|0\)\+1;/.test(src), 'a render exception is recorded, never hidden, and a deferred QA row reads whether frames ran to their last line');
ok(/function drawPlates\(segs\)/.test(src) && /if\(chNum\(\)===0\)\{ drawPlates\(segs\); RANGE_WIRE\.forEach/.test(src) && /else \{ drawTargets\(segs\); WIRE\.g\.forEach/.test(src), 'what you must hit takes the segment budget before the world — on the range AND on every Capitol channel (r.131)');
for (const row of ['PIT_SEES_300_RIGHT_250_LEFT', 'PAN_RIGHT_MOVES_WORLD_LEFT', 'FWD_AT_YAW90', 'TARGETN_HITS_THE_EXPOSED_PLATE', 'LAPSE_RELEASES_THE_BOX', 'ONE_ROUND_PER_EXPOSURE', 'REDUCER_HIT_AND_LAPSE_DOWN_THE_PLATE', 'TABLE_III_EXPOSES_ONLY_SCORABLE', 'QA_LEAVES_NO_TRACE', 'PROJ_FWD_AGREES', 'FWD_IS_WHAT_YOU_SEE_', 'RANGE_SEES_PLATES', 'ALTC_LAYOUT', 'RANGE_POP_SCHEDULE', 'RANGE_LOCK_PLATE', 'RANGE_HIT_50', 'RANGE_HIT_300', 'RANGE_MISS_300_OFF20', 'RANGE_HIT_50_OFF10', 'MODE_RESET_RETURNS', 'MODE_DOWN_STAYS', 'MODE_QUAL_TIMED']) ok(src.includes(`push('${row}`), `QA row ${row} present`);
ok(/lobby/i.test(src) && /TEAM CODE/.test(src) && /appendCanonicalEvent/.test(src) && /applyWorld/.test(src), 'r.128 carries the lobby, the team codes and the reducer law');
const ux = fs.readFileSync('components/drone-2525/command-ux1.tsx', 'utf8');
ok(/data-drone-play\b/.test(ux) && /\/drone-2525\/play\.html/.test(ux) && /DECK_REV/.test(ux), 'the /drone-2525 shell offers PLAY → the served deck, labelled with the served revision');
const rev2 = (fs.readFileSync('lib/drone-2525/deck-rev.ts', 'utf8').match(/DECK_REV = "(\d+)"/) || [])[1];
ok(rev2 === REV, `lib/drone-2525/deck-rev.ts (${rev2}) and tests/deck-head.mjs (${REV}) name the same HEAD`);
ok(fs.existsSync('public/drone-2525/play.html'), 'the PLAY link target exists in public/ (a soft-404 would serve the SPA)');
console.log(`\ndrone-playable: ${pass} passed, ${fail} failed · r.${REV} served byte-identical, under 7.77 MB, the range changes present in the served bytes`);
process.exit(fail ? 1 : 0);
