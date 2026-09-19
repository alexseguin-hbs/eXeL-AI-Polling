// THE RANGE WITH TURRETS, LIFTED OUT OF THE DECK (operator 2026-09-19: "make sure range with turrets actually works.
// each lane has pop ups at various distances"). The deck's own boot QA fires the aimed shots at runtime; this gate
// lifts the pure pieces out of the carried r.130 HTML (the sequencer-2525 pattern) and proves the rules that make
// the range honest without a browser: the ONE forward basis (what the camera calls forward is what the projector
// puts at screen centre), the per-lane exposure schedule (deterministic, every silhouette, seconds by distance from
// FM 3-22.9), and the sheet's layout. Evaluating the deck's OWN functions means the repo and the deck cannot drift.
import fs from 'node:fs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const html = fs.readFileSync(new URL('../../docs/drone-2525/operator-deck/drone-2525_r.130.html', import.meta.url), 'utf8');
const line = (re) => { const m = html.match(re); if (!m) throw new Error('r.130 lacks ' + re); return m[0]; };
const src = [
  line(/^function mulberry32\(a\)\{.*\}$/m), line(/^function fwdOf\(yaw,tilt\)\{.*\}$/m), line(/^function rightOf\(yaw\)\{.*\}$/m), line(/^function yawTo\(dx,dz\)\{.*\}$/m),
  line(/^function proj\(p,cam,W,H\)\{[\s\S]*?\n\}/m), line(/^const QUAL=\[[\s\S]*?\]\.map\(q=>\(\{\.\.\.q,up:true,lifePct:100,life:99,mist:false,kind:'pop'\}\)\);/m),
  line(/^const EXPOSURE_S=\{.*\};$/m), line(/^const EXPOSURE_GAP_S=.*;$/m), line(/^function exposureOrder\(lane\)\{.*\}$/m), line(/^function exposureAt\(lane,k\)\{.*\}$/m),
].join('\n');
const D = new Function('state', src + '\nreturn { fwdOf, rightOf, yawTo, proj, QUAL, EXPOSURE_S, EXPOSURE_GAP_S, exposureOrder, exposureAt };')({ zoom: 1 });
ok(typeof D.fwdOf === 'function' && D.QUAL.length === 10, 'lifted fwdOf/rightOf/yawTo/proj/QUAL/exposure* out of r.130');

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
for (const [dx, dz] of [[0, 50], [10, 50], [-30, 5], [4, -9]]) { const y = D.yawTo(dx, dz); const f = D.fwdOf(y, 0); const n = Math.hypot(dx, dz); ok(Math.abs(f.fx - dx / n) < 1e-9 && Math.abs(f.fz - dz / n) < 1e-9, `yawTo(${dx},${dz}) aims fwdOf exactly along (dx,dz)`); }
ok(Math.abs(D.fwdOf(0, 0).fz - 1) < 1e-12 && Math.abs(D.fwdOf(0, 0).fx) < 1e-12, 'yaw 0 = +Z, so the range pit (yaw 0) looks downrange at plates that stand at +z');

// ── the sheet's layout ─────────────────────────────────────────────────────────────────────────
const Q = D.QUAL;
ok(Q.filter((q) => q.z === 50).length === 1 && Q.filter((q) => q.z === 100 && q.form === 'F').length === 3 && Q.filter((q) => q.z === 150).length === 2 && Q.filter((q) => q.z === 200).length === 2 && Q.filter((q) => q.z === 250).length === 1 && Q.filter((q) => q.z === 300).length === 1, '9127 sheet: 50 F · 100 F×3 · 150 E×2 · 200 E×2 · 250 · 300');
ok(Q.find((q) => q.z === 250).x < 0 && Q.find((q) => q.z === 300).x > 0, '250 M on the left, 300 M on the right, as printed');
ok(Q.every((q) => q.z >= 50 && q.z <= 300 && q.w > 0 && q.h > 0), 'every silhouette has a distance in 50..300 and a real size');

// ── per-lane exposures ─────────────────────────────────────────────────────────────────────────
ok(D.EXPOSURE_S[50] === 3 && D.EXPOSURE_S[100] === 4 && D.EXPOSURE_S[150] === 5 && D.EXPOSURE_S[200] === 6 && D.EXPOSURE_S[250] === 7 && D.EXPOSURE_S[300] === 8, 'exposure 3 s at 50 m, +1 s per 50 m, 8 s at 300 m (FM 3-22.9 record fire)');
ok(D.EXPOSURE_GAP_S > 0 && D.EXPOSURE_GAP_S < 5, `gap between exposures is declared (${D.EXPOSURE_GAP_S} s)`);
const orders = Array.from({ length: 42 }, (_, i) => D.exposureOrder(i));
ok(orders.every((o) => new Set(o).size === 10 && o.every((i) => i >= 0 && i < 10)), 'every lane exposes all ten silhouettes once per cycle (a permutation)');
ok(orders.every((o, i) => o.join() === D.exposureOrder(i).join()), 'a lane\'s order is deterministic (same lane, same order — replay repeats)');
ok(new Set(orders.map((o) => o.join())).size >= 40, `lanes differ: ${new Set(orders.map((o) => o.join())).size}/42 distinct orders — "each lane has pop ups at various distances"`);
const e = Array.from({ length: 10 }, (_, k) => D.exposureAt(20, k));
ok(new Set(e.map((x) => x.z)).size >= 5 && e.every((x) => x.sec === D.EXPOSURE_S[x.z]), 'lane L21 exposes at ≥5 different distances in a cycle, each for its distance\'s seconds');
ok(D.exposureAt(0, 10).base === D.exposureAt(0, 0).base && D.exposureAt(0, -1).base === D.exposureAt(0, 9).base, 'the sequence wraps (k mod 10) and never throws on a negative index');

// ── source-level invariants the browser QA relies on ───────────────────────────────────────────
ok(/function kindOfRef\(ref\)/.test(html) && /kind:kindOfRef\(o\)/.test(html), 'the reducer keeps the target\'s kind (a designated plate is shot as a plate, not as the bull ring)');
ok(/if\(\+state\.challenge===0\) rangeTick\(dt\);/.test(html) && !/q\._dead>2\.4/.test(html), 'spawn drives the range from rangeTick; the old always-up bounce is gone');
ok(/qualResetPlatesForTable\(\)\{[\s\S]{0,400}q\.up=false/.test(html), 'a new QUAL table starts with every plate DOWN');
ok(html.indexOf('drawPlates(segs); RANGE_WIRE.forEach') > 0 && /function bullseye\(x,y,z,segs\)/.test(html) && /state\.drawErr=String\(e\)/.test(html), 'silhouettes are drawn before the range wire; bullseye takes segs; render exceptions are recorded');
console.log(`\nrange-2525: ${pass} passed, ${fail} failed · r.130's range rules lifted and proven: one basis, sheet layout, per-lane exposures`);
process.exit(fail ? 1 : 0);
