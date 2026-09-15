// THE SELF-TEST ON A MACHINE — the runner, driven by a FAKE clock and a FAKE frame source.
//
// The point of the fake is not convenience. A self-calibration run takes six to fifteen minutes by design,
// and a gate that actually waited would never run in CI. Injecting the clock lets the whole sweep be proven
// in milliseconds while the code under test is the same code the browser runs — the clock is the ONLY thing
// swapped, because the clock is the only thing that cannot be pure.
import { runSelfCal, selfCalPack } from '../lib/wire-core/self-cal-runner.ts';
import { HAL_PROFILES } from '../lib/wire-core/hal.ts';
import { motSpec } from '../lib/wire-core/mot-ladder.ts';
import { planSelfCal } from '../lib/wire-core/calibrate.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

/**
 * A fake machine. `msPerFrame(level)` says how long THIS machine takes to paint THAT rung, so a test can
 * describe a Pi, a laptop or a board that falls over at band 3 and see what the runner concludes.
 */
function fakeMachine(msPerFrame) {
  let t = 0;
  const queue = [];
  const now = () => t;
  const raf = (cb) => { queue.push(cb); return queue.length; };
  let current = '1.1';
  const load = { paint: (level) => { current = level; } };
  // Drain the queue, advancing the fake clock by whatever the current rung costs this machine.
  const drain = () => { while (queue.length) { const cb = queue.shift(); t += msPerFrame(current); cb(t); } };
  return { now, raf, load, drain, painted: () => current };
}

async function run(msPerFrame, opts = {}) {
  const m = fakeMachine(msPerFrame);
  const p = runSelfCal(m.load, { now: m.now, raf: m.raf, ...opts });
  // Let the promise chain breathe between drains so each awaited measurement can schedule the next.
  for (let i = 0; i < 400; i++) { m.drain(); await Promise.resolve(); }
  return p;
}

// ── A FAST MACHINE HOLDS THE WHOLE LADDER ────────────────────────────────────────────────────────
{
  const r = await run(() => 2);                       // 2ms a frame: 500 fps, anything fits
  ok(r.ceiling !== null, 'a fast machine reports a ceiling');
  ok(r.tried > 0, 'and says how many rungs it tried');
  ok(/holds MoT/.test(r.headline), `with a headline a person can act on: "${r.headline}"`);
  ok(r.sensorsAtCeiling.length >= 1, 'and which sensors run there');
  ok(r.elapsedS > 0, 'and how long it took');
}

// ── A MACHINE THAT FALLS OVER PART-WAY REPORTS WHERE ─────────────────────────────────────────────
{
  // Fine through band 1, hopeless from band 2 on. The ceiling must land inside band 1.
  const r = await run((lvl) => (motSpec(lvl).band === 1 ? 4 : 200));
  ok(r.ceiling !== null && r.ceiling.startsWith('1.'), `the ceiling lands in the band the machine can hold (${r.ceiling})`);
  ok(r.tried < 25, `and the sweep stopped early rather than walking all 25 (${r.tried} tried)`);
  ok(r.results.some((x) => !x.pass), 'a failing rung is recorded, not hidden');
  ok(r.results.every((x) => typeof x.why === 'string' && x.why.length > 8), 'every rung says why it passed or failed');
}

// ── A MACHINE THAT HOLDS NOTHING SAYS SO ─────────────────────────────────────────────────────────
{
  const r = await run(() => 400);                     // 2.5 fps
  ok(r.ceiling === null, 'a machine that held no rung reports no ceiling, rather than inventing one');
  ok(/held no rung/.test(r.headline), 'and says that plainly');
  ok(r.passed === 0, 'with nothing counted as passed');
}

// ── AUTO PICKS THE CLASS FROM THIS MACHINE, NOT FROM A LABEL ─────────────────────────────────────
{
  const slow = await run(() => 120);                  // ~8 fps → Pi-class
  ok(slow.hal === HAL_PROFILES.pi.label, `a slow machine is called ${HAL_PROFILES.pi.label} (${slow.hal})`);
  const fast = await run(() => 5);                    // 200 fps → accelerator-class
  ok(fast.hal === HAL_PROFILES.accel.label, `a fast one is called ${HAL_PROFILES.accel.label} (${fast.hal})`);
  const forced = await run(() => 5, { hal: 'pi' });
  ok(forced.hal === HAL_PROFILES.pi.label, 'and an explicit choice is not overridden by the measurement');
}

// ── THE OPERATOR CAN STOP A FIFTEEN-MINUTE RUN ───────────────────────────────────────────────────
{
  const signal = { aborted: false };
  const m = fakeMachine(() => 4);
  const p = runSelfCal(m.load, { now: m.now, raf: m.raf, signal });
  for (let i = 0; i < 12; i++) { m.drain(); await Promise.resolve(); }
  signal.aborted = true;
  for (let i = 0; i < 200; i++) { m.drain(); await Promise.resolve(); }
  const r = await p;
  ok(r.tried < 25, `an aborted run returns what it had rather than hanging (${r.tried} rungs)`);
  ok(typeof r.headline === 'string', 'and still reports honestly');
}

// ── PROGRESS IS VISIBLE THROUGHOUT, NEVER A SILENT WAIT ──────────────────────────────────────────
{
  const seen = [];
  await run(() => 4, { onProgress: (p) => seen.push(p) });
  ok(seen.length > 2, `progress is reported as it goes (${seen.length} updates)`);
  ok(seen.every((p) => p.total === 25), 'every update says how many rungs there are in total');
  ok(seen.some((p) => p.measuredFps === null), 'a rung announces itself before it is measured');
  ok(seen.some((p) => typeof p.measuredFps === 'number'), 'and reports its number afterwards');
  ok(seen.every((p) => p.remainingS >= 0), 'the time remaining is never negative');
  ok(seen.some((p) => /held|failed/.test(p.line)), 'and the line says plainly whether the rung held');
}

// ── THE BUDGET IS HONOURED ───────────────────────────────────────────────────────────────────────
{
  const p6 = planSelfCal(6), p15 = planSelfCal(15);
  ok(p6.worstCaseMinutes >= 5 && p6.worstCaseMinutes <= 15.5, `a 6-minute ask plans a ${p6.worstCaseMinutes}-minute worst case`);
  ok(p15.worstCaseMinutes <= 15.5, `a 15-minute ask plans a ${p15.worstCaseMinutes}-minute worst case`);
}

// ── THE REPORT IS A FILE A PERSON CAN KEEP ───────────────────────────────────────────────────────
{
  const r = await run(() => 4);
  const pack = selfCalPack(r, { version: '00.00', revision: '0.002', modelHash: 'abc123' });
  ok(pack.format === 'VISION-2525-SELFCAL-1', 'the pack declares its format');
  ok(pack.revision === '0.002' && pack.modelHash === 'abc123', 'and carries the revision and the model it was measured against');
  ok(Array.isArray(pack.rungs) && pack.rungs.length === r.tried, 'with one row per rung tried');
  ok(pack.rungs.every((x) => 'fps' in x && 'headroomMs' in x && 'pass' in x && 'why' in x), 'each row carrying the number, the headroom, the verdict and the reason');
  ok(JSON.parse(JSON.stringify(pack)).headline === r.headline, 'and it survives being written to a file');
}

console.log(`\nself-cal-runner: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
