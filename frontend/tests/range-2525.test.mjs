// THE RANGE WITH TURRETS, LIFTED OUT OF THE DECK (operator 2026-09-19: "make sure range with turrets actually works";
// operator 2026-09-23: "Target Up mode all targets show up … when hit they pop back up; target down mode … stay down when
// hit; on qual follow [Army IWQ Table VI] — some targets have 2, 3, or four up"). The deck's own boot QA fires the aimed
// shots at runtime; this gate lifts the pure pieces out of the carried HEAD (the sequencer-2525 pattern) and proves the
// rules that make the range honest without a browser: the ONE forward basis (what the camera calls forward is what the
// projector puts at screen centre), the IWQ Table VI program (18 engagements, 40 targets, 6/7/8/8/6/5 by range, windows by
// count, the 50 R first, seeded siblings per lane, replay repeats), and the layout. Evaluating the deck's OWN functions means
// the repo and the deck cannot drift.
import fs from 'node:fs';
import { DECK_REV, deckUrl } from './deck-head.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const html = fs.readFileSync(deckUrl(import.meta.url), 'utf8');
const line = (re) => { const m = html.match(re); if (!m) throw new Error(`r.${DECK_REV} lacks ` + re); return m[0]; };
const src = [
  line(/^function mulberry32\(a\)\{.*\}$/m), line(/^function fwdOf\(yaw,tilt\)\{.*\}$/m), line(/^function rightOf\(yaw\)\{.*\}$/m), line(/^function yawTo\(dx,dz\)\{.*\}$/m),
  line(/^function zoomMax\(\)\{.*\}/m), line(/^function zoomClamp\(z\)\{.*\}$/m), line(/^function proj\(p,cam,W,H\)\{[\s\S]*?\n\}/m), line(/^const QUAL=\[[\s\S]*?\]\.map\(q=>\(\{\.\.\.q,up:true,lifePct:100,life:99,mist:false,kind:'pop'\}\)\);/m),
  line(/^const IWQ_VI=\[[\s\S]*?\n\];$/m), line(/^const IWQ_ENG=.*;$/m), line(/^const EXPOSURE_BY_COUNT=\{.*\};/m), line(/^const ENG_GAP_S=\d+;/m), line(/^const PHASE_GAP_S=\d+;/m), line(/^const RETURN_S=\d+;/m), line(/^const IWQ_TOTAL=.*;$/m),
  line(/^function engagementAt\(lane,k\)\{[\s\S]*?\n  return \{n:e\.n,ph:e\.ph,pos:e\.pos,bases,sec:EXPOSURE_BY_COUNT\[bases\.length\]\|\|5\}; \}$/m),
].join('\n');
const D = new Function('state', 'const units={};\n' + src + '\nreturn { fwdOf, rightOf, yawTo, proj, QUAL, IWQ_VI, IWQ_ENG, IWQ_TOTAL, EXPOSURE_BY_COUNT, ENG_GAP_S, PHASE_GAP_S, RETURN_S, engagementAt };')({ zoom: 1 });
ok(typeof D.fwdOf === 'function' && D.QUAL.length === 11, `lifted fwdOf/rightOf/yawTo/proj/QUAL/IWQ_* out of r.${DECK_REV} (HEAD)`);

// ── the one forward basis ──────────────────────────────────────────────────────────────────────
const W = 390, H = 844;
for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 3, 2.2]) for (const tilt of [0, 0.3, -0.25]) {
  const f = D.fwdOf(yaw, tilt); const cam = { x: 3, y: 2, z: -7, yaw, tilt };
  const pr = D.proj([cam.x + f.fx * 60, cam.y + f.fy * 60, cam.z + f.fz * 60], cam, W, H);
  ok(pr && Math.abs(pr.x - W / 2) < 1e-6 && Math.abs(pr.y - H * 0.46) < 1e-6 && Math.abs(pr.z - 60) < 1e-6, `yaw ${yaw.toFixed(2)} tilt ${tilt}: the camera's forward lands at screen centre, 60 m deep`);
  const r = D.rightOf(yaw); const pr2 = D.proj([cam.x + f.fx * 60 + r.rx * 5, cam.y + f.fy * 60, cam.z + f.fz * 60 + r.rz * 5], cam, W, H);
  ok(pr2 && pr2.x > W / 2 + 1, `yaw ${yaw.toFixed(2)}: rightOf is screen-right`);
  const back = D.proj([cam.x - f.fx * 60, cam.y - f.fy * 60, cam.z - f.fz * 60], cam, W, H);
  ok(back === null, `yaw ${yaw.toFixed(2)}: the opposite of forward is culled (behind the camera)`);
}
for (const [dx, dz] of [[0, 50], [10, 50], [-30, 5], [4, -9]]) { const y = D.yawTo(dx, dz); const f = D.fwdOf(y, 0); const n = Math.hypot(dx, dz); ok(Math.abs(f.fx - dx / n) < 1e-9 && Math.abs(f.fz - dz / n) < 1e-9, `yawTo(${dx},${dz}) aims fwdOf exactly along the target`); }
ok(Math.abs(D.fwdOf(0, 0).fz - 1) < 1e-12 && Math.abs(D.fwdOf(0, 0).fx) < 1e-12, 'yaw 0 = +Z, so the range pit (yaw 0) looks downrange at plates that stand at +z');

// ── the layout: sheet 9127 + the operator's 50 L/R ─────────────────────────────────────────────
const Q = D.QUAL;
ok(Q.filter((q) => q.z === 50).length === 2 && Q.find((q) => q.id === 'C-50L').x < 0 && Q.find((q) => q.id === 'C-50').x > 0, '50 m targets are left and right; C-50 is the 50 R');
ok(Q.filter((q) => q.z === 100 && q.form === 'F').length === 3 && Q.filter((q) => q.z === 150).length === 2 && Q.filter((q) => q.z === 200).length === 2 && Q.filter((q) => q.z === 250).length === 1 && Q.filter((q) => q.z === 300).length === 1, '100 F×3 · 150 E×2 · 200 E×2 · 250 · 300 (sheet 9127)');
ok(Q.find((q) => q.z === 250).x < 0 && Q.find((q) => q.z === 300).x > 0, '250 M on the left, 300 M on the right, as printed');
ok(Q.every((q) => q.z >= 50 && q.z <= 300 && q.w > 0 && q.h > 0), 'every silhouette has a distance in 50..300 and a real size');
ok(Q.every((q) => Math.abs(q.w - 0.495) < 1e-9 && (q.form === 'F' ? Math.abs(q.h - 0.508) < 1e-9 : Math.abs(q.h - 1.016) < 1e-9)), 'r.138: true scale — F 0.495 × 0.508 m, E 0.495 × 1.016 m (19.5" × 20" / 19.5" × 40")');
{ const f = (844 * 0.52) / Math.tan((38 / 1) * Math.PI / 180); const px300 = (1.016 / 300) * f; const px50 = (0.508 / 50) * f; ok(px300 < 8 && px50 < 12, `a 300 m E is ${px300.toFixed(1)} px tall and a 50 m F ${px50.toFixed(1)} px at 1× — small, as the photographs show; the 3 mrad floor (${(f * 3 / 1000).toFixed(1)} px) keeps them hittable`); }
ok(/function zoomMax\(\)\{ const u=units\[state\.unit\]\|\|\{\}; const tur=u\.kind==='turret'\|\|state\.mode==='turret'; return \(tur&&state\.rangeMode==='qual40'&&\+state\.challenge===0\)\?3:30; \}/.test(html) && (html.match(/zoomClamp\(/g) || []).length >= 8 && !/Math\.min\(3\.2,/.test(html), 'r.138 zoom law: turret + QUAL 3×, everything else 30×; one clamp at every optic site');
ok(/function magCap\(\)\{ return \(state\.rangeMode==='qual40'&&\+state\.challenge===0\)\?10:30; \}/.test(html) && /reason:'EMPTY_MAGAZINE'/.test(html) && /decide\('RELOAD','MAG'/.test(html) && /magLoad\('PHASE'\)/.test(html), 'r.138 magazine: 10 rounds in QUAL · 40, 30 elsewhere; an empty magazine refuses; RELOAD is a row; the phase rest reloads');
ok([50, 100, 150, 200, 250, 300].every((z) => Q.some((q) => q.z === z)), 'every range the program names has a silhouette to raise');

// ── the IWQ Table VI program (operator 2026-09-23, verbatim in docs/asks/2026-09-23_range_modes_iwq_table_vi.md) ──
ok(D.IWQ_VI.length === 4 && D.IWQ_VI.map((p) => p.ph).join() === '1,2,3,4', 'four phases, in order');
ok(D.IWQ_ENG.length === 18 && D.IWQ_TOTAL === 40, `18 engagements · ${D.IWQ_TOTAL} targets (40)`);
const byZ = {}; D.IWQ_ENG.forEach((e) => e.ranges.forEach((z) => { byZ[z] = (byZ[z] || 0) + 1; }));
ok([50, 100, 150, 200, 250, 300].map((z) => byZ[z]).join('/') === '6/7/8/8/6/5', `target count by range 50×6 · 100×7 · 150×8 · 200×8 · 250×6 · 300×5 (got ${[50, 100, 150, 200, 250, 300].map((z) => byZ[z]).join('/')})`);
const given = [[50], [100], [150], [50, 150, 200], [150, 200, 250, 300], [100], [150, 300], [200, 300], [250, 300], [150, 250, 300], [50, 100, 200], [50, 200], [150, 250], [100, 150, 200]];
ok(given.every((r, i) => D.IWQ_ENG[i].ranges.join('/') === r.join('/')), 'engagements 1–14 are the operator\'s table verbatim');
ok(D.IWQ_ENG.slice(14).every((e) => e.ranges.length >= 1 && e.ranges.length <= 4) && D.IWQ_ENG.slice(14).reduce((a, e) => a + e.ranges.length, 0) === 10, 'engagements 15–18 (DECLARED) are a mix of 1–4 that reaches 10 rounds');
ok(D.IWQ_ENG.every((e) => new Set(e.ranges).size === e.ranges.length), 'no engagement raises two targets at one range');
ok(D.IWQ_ENG.slice(0, 5).every((e) => e.ph === 1) && D.IWQ_ENG.slice(5, 10).every((e) => e.ph === 2) && D.IWQ_ENG.slice(10, 14).every((e) => e.ph === 3) && D.IWQ_ENG.slice(14).every((e) => e.ph === 4), 'phases hold 5 / 5 / 4 / 4 engagements');
ok(D.EXPOSURE_BY_COUNT[1] === 5 && D.EXPOSURE_BY_COUNT[2] === 8 && D.EXPOSURE_BY_COUNT[3] === 12 && D.EXPOSURE_BY_COUNT[4] === 16, '1 target = 5 s · 2 = 8 s · 3 = 12 s · 4 = 16 s');
ok(D.ENG_GAP_S === 3 && D.PHASE_GAP_S >= 8 && D.PHASE_GAP_S <= 10 && D.RETURN_S > 0, `~3 s between engagements · ${D.PHASE_GAP_S} s between phases (8–10) · training targets return after ${D.RETURN_S} s`);
for (const lane of [0, 1, 20, 41]) {
  const es = Array.from({ length: 18 }, (_, k) => D.engagementAt(lane, k));
  ok(es.every((e, k) => e && e.n === k + 1 && e.bases.length === D.IWQ_ENG[k].ranges.length && e.sec === D.EXPOSURE_BY_COUNT[e.bases.length]), `lane ${lane}: every engagement raises its count of targets for its count's seconds`);
  ok(es.every((e, k) => e.bases.every((b, i) => Q.find((q) => q.id === b).z === D.IWQ_ENG[k].ranges[i])), `lane ${lane}: each raised silhouette stands at the range the program names`);
  ok(es[0].bases.length === 1 && es[0].bases[0] === 'C-50' && es[0].sec === 5, `lane ${lane}: the 50 R standing shot is first`);
  ok(es.map((e) => e.bases.join()).join('|') === Array.from({ length: 18 }, (_, k) => D.engagementAt(lane, k)).map((e) => e.bases.join()).join('|'), `lane ${lane}: deterministic — replay repeats`);
}
const sigs = new Set(Array.from({ length: 42 }, (_, i) => Array.from({ length: 18 }, (_, k) => D.engagementAt(i, k).bases.join()).join('|')));
ok(sigs.size >= 30, `lanes differ in which sibling stands: ${sigs.size}/42 distinct — "each lane has pop ups at various distances"`);
ok(D.engagementAt(0, 18) === null && D.engagementAt(0, 99) === null, 'after engagement 18 the program ends (null), it never wraps');
ok(!/const EXPOSURE_S=/.test(html) && !/QUAL_TABLES/.test(html) && !/exposureOrder\(/.test(html), 'r.130\'s by-distance exposures and the 20/10/10 tables are gone (superseded by the program of record)');

// ── source-level invariants the browser QA relies on ───────────────────────────────────────────
ok(/function kindOfRef\(ref\)/.test(html) && /kind:kindOfRef\(o\)/.test(html), 'the reducer keeps the target\'s kind (a designated plate is shot as a plate, not as the bull ring)');
ok(/if\(\+state\.challenge===0\) rangeTick\(dt\);/.test(html) && !/q\._dead>2\.4/.test(html), 'spawn drives the range from rangeTick; the old always-up bounce is gone');
ok(/function rangeReset\(\)\{ (magLoad\('RESET'\); )?const up=rangeTraining\(\);/.test(html) && /qualResetPlatesForTable\(\)\{[\s\S]{0,400}q\.up=false/.test(html), 'r.137: RESET stands every target in training; a qualification starts with every plate DOWN');
ok(/if\(mode!=='qual40'\)\{ \/\* TRAINING: every target stands; a hit target falls, then returns \(RESET\) or stays down \(DOWN\)/.test(html) && /if\(q\._ret>=RETURN_S\)/.test(html) && /state\.rangeAllDown=\(mode==='stay'&&!anyUp\);/.test(html), 'r.137: training has no exposure clock — RESET returns a hit target after RETURN_S, DOWN keeps it down and says ALL DOWN');
ok(/R\.cur=e\.bases\.map\(b=>plateOf\(mine,b\)\)/.test(html) && /if\(R\.t>=\(R\.eng\?R\.eng\.sec:5\)\)/.test(html) && /rangeLapse\(q,false\); state\.rangeLapsed=/.test(html), 'r.137: the tower raises the engagement\'s targets TOGETHER and lapses every unengaged one when the window ends');
ok(/R\.phase='phasegap'; (magLoad\('PHASE'\); )?if\(rangeArmed\(\)\) toast\('PHASE '\+nxt\.ph\+' · '\+nxt\.pos\+' · MAG CHANGE · MOVE'\)/.test(html), 'r.137: between phases the tower rests for the mag change and says so');
ok(html.indexOf('drawPlates(segs); RANGE_WIRE.forEach') > 0 && /function bullseye\(x,y,z,segs\)/.test(html) && /state\.drawErr=String\(e\)/.test(html), 'silhouettes are drawn before the range wire; bullseye takes segs; render exceptions are recorded');
ok(/function worldOf\(ref\)/.test(html) && /function aimUnitAt\(u,ref,lo,hi\)/.test(html) && !/const dx=s\.ref\.x-u\.x,dz=s\.ref\.z-u\.z;/.test(html), 'r.131: every aim goes through aimUnitAt (camera eye, centre of mass); the T-box and pick use worldOf');
ok(/function rangeRelease\(q\)/.test(html) && /ref\._eng=true;/.test(html) && /ONE ROUND PER TARGET/.test(html) && /TARGET DOWN · WAIT FOR THE NEXT EXPOSURE/.test(html), 'r.131/r.137: authority is scoped to the exposure; one round per silhouette in QUAL·40; a down target is refused');
ok(/const PIP_FLOOR_MRAD=3;/.test(html) && /function pipFloorPx\(\)/.test(html) && !/PIP_FLOOR_PX/.test(html), 'r.131: the pip floor is angular (3 mrad, min 3 px) — the same standard at every zoom and screen size');
ok(/rings\[0\]\.up=false; \}\n\};/.test(html) && !/rings\[0\]\.up=true; rings\[0\]\.lifePct=100;\n  \}\n\};/.test(html), 'r.131: picking CH0 never re-aims at the bull ring');
ok(/if\(state\.linkMute\) return;/.test(html) && /const sim=true;/.test(html) && /state\.desig=null; state\.tgtSlot=\{\}; state\.hiApproved=false; (state\.lastShot=null; state\.lastBand=''; )?state\.rangeHit=evSave\.rangeHit/.test(html), 'r.131: QA and batch runs leave no trace on the record or the strip');
console.log(`\nrange-2525: ${pass} passed, ${fail} failed · r.${DECK_REV}'s range rules lifted and proven: one basis, the 50 L/R layout, the IWQ Table VI program`);
process.exit(fail ? 1 : 0);
