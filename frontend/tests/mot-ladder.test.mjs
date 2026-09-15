// THE MoT LADDER · THE HAL · THE STREAM · CALIBRATION — the self-calibrating-robotics gates.
//
// Operator 2026-09-15: "5 levels for resolution and 5 levels for edge compute … consider 83 starwars mock
// up as level 1.1 … Technically FPS should be faster with 1.1 settings … self calibration goal of 6 - 15
// minutes in first release."
//
// The load-bearing invariant, and the one that was WRONG before this ladder existed:
//   DEMAND AND CAPABILITY ARE DIFFERENT THINGS. A higher rung asks for MORE work and therefore FEWER frames
//   per second. The old four-tier table had it backwards (low 15 fps, ultra 60 fps) because one word did
//   two jobs. If anyone reverses it again, this file fails.
import {
  MOT_LEVELS, MOT_MIN, MOT_MAX, BANDS, STEPS, SENSOR_LADDER, BAND_NAMES,
  parseMot, motSpec, motStep, motIndex, motAtMost, motLabel, isMot,
} from '../lib/wire-core/mot-ladder.ts';
import { HAL_PROFILES, HAL_ORDER, pickHal, resolveHal, halCnnMs, renderHeadroomMs, sensorFits, halLabel } from '../lib/wire-core/hal.ts';
import { STREAMS, REFERENCE_STREAM, streamAt, isReference, fractionOfReference, streamLabel } from '../lib/wire-core/stream.ts';
import {
  initCal, calStep, calLine, planSelfCal, judgeRung, initSweep, calSweepStep, selfCalReport,
  SELF_CAL_MIN_MINUTES, SELF_CAL_MAX_MINUTES, MIN_DWELL_S, MAX_DWELL_S, HOLD_TICKS_TO_CLIMB, FAIL_STREAK_TO_STOP,
  CLIMB_HEADROOM_FRACTION, climbThresholdMs,
} from '../lib/wire-core/calibrate.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// ── THE LADDER IS 5 × 5 ───────────────────────────────────────────────────────────────────────────
ok(BANDS === 5 && STEPS === 5, 'five compute bands and five resolution steps, as asked');
ok(MOT_LEVELS.length === 25, `twenty-five rungs (${MOT_LEVELS.length})`);
ok(MOT_LEVELS[0] === '1.1' && MOT_LEVELS[24] === '5.5', 'it runs 1.1 to 5.5');
ok(MOT_MIN === '1.1' && MOT_MAX === '5.5', 'and names its own ends');
ok(new Set(MOT_LEVELS).size === 25, 'every rung is declared once');
for (const l of MOT_LEVELS) ok(/^[1-5]\.[1-5]$/.test(l), `${l} is one digit, a dot, one digit — never a letter`);
ok(!isMot('1.6') && !isMot('6.1') && !isMot('1.1a'), 'a label off the ladder is refused, not clamped');
let threw = false; try { parseMot('9.9'); } catch { threw = true; }
ok(threw, 'parsing a rung that does not exist throws rather than guessing');

// ── 1.1 IS THE ARCADE RUNG: FASTEST, SPARSEST, ONE SENSOR ─────────────────────────────────────────
const a = motSpec('1.1'), z = motSpec('5.5');
ok(a.demandFps > z.demandFps, `1.1 asks for more frames than 5.5 (${a.demandFps} vs ${z.demandFps}) — the arcade rung is the fast one`);
ok(a.demandFps >= 90, `1.1 asks for a genuinely fast picture (${a.demandFps} fps)`);
ok(a.segments < z.segments, `and fewer strokes (${a.segments} vs ${z.segments})`);
ok(a.gridM > z.gridM, `and a sparser ground grid (${a.gridM}m vs ${z.gridM}m)`);
ok(a.cnnMs < z.cnnMs, `and a cheaper sensor stack (${a.cnnMs}ms vs ${z.cnnMs}ms)`);
ok(a.sensors.length === 1 && a.sensors[0] === 'EO', '1.1 runs one sensor, and it is EO');
ok(z.sensors.length === 5, '5.5 fuses all five');
ok(!a.bloom && z.bloom, 'no bloom on the arcade rung; bloom at the top');
ok(a.bandName === 'VECTOR' && z.bandName === 'FULL', 'the bands are named');

// ── MONOTONIC, EVERY STEP OF THE WAY ──────────────────────────────────────────────────────────────
for (let i = 1; i < MOT_LEVELS.length; i++) {
  const lo = motSpec(MOT_LEVELS[i - 1]), hi = motSpec(MOT_LEVELS[i]);
  ok(hi.segments >= lo.segments, `${hi.level} never draws less than ${lo.level}`);
  ok(hi.demandFps <= lo.demandFps, `${hi.level} never asks for a faster picture than ${lo.level} — more demand costs frames`);
  ok(hi.rung === lo.rung + 1, `${hi.level} follows ${lo.level} with no gap`);
}
ok(motSpec('5.5').segments <= 4000, 'the top rung still holds the declared 4,000-segment ceiling');

// ── BOTH AXES DO A JOB: the step is resolution, the band is compute ───────────────────────────────
for (let b = 1; b <= 5; b++) {
  const lo = motSpec(`${b}.1`), hi = motSpec(`${b}.5`);
  ok(hi.dpr > lo.dpr, `inside band ${b} the step raises pixel density (${lo.dpr} → ${hi.dpr}) — the resolution axis is real`);
  ok(hi.ngonSides > lo.ngonSides, `and rounds the curves (${lo.ngonSides} → ${hi.ngonSides})`);
  ok(hi.sensors.length === lo.sensors.length, `while the sensor stack stays put inside a band (${lo.sensors.length})`);
}
for (let st = 1; st <= 5; st++) {
  const lo = motSpec(`1.${st}`), hi = motSpec(`5.${st}`);
  ok(hi.sensors.length > lo.sensors.length, `at step ${st} the band raises the sensor count (${lo.sensors.length} → ${hi.sensors.length}) — the compute axis is real`);
  ok(hi.cnnMs > lo.cnnMs, `and what the stack costs (${lo.cnnMs}ms → ${hi.cnnMs}ms)`);
  ok(hi.dpr === lo.dpr, `while pixel density stays put across a step (${lo.dpr})`);
}
ok(motSpec('1.1').dpr === 1 && motSpec('5.5').dpr === 2, 'pixel density runs 1.0 at step 1 to 2.0 at step 5');
for (let i = 1; i < MOT_LEVELS.length; i++) {
  ok(motSpec(MOT_LEVELS[i]).ngonSides >= motSpec(MOT_LEVELS[i - 1]).ngonSides, `${MOT_LEVELS[i]} is never less round than ${MOT_LEVELS[i - 1]}`);
}

// ── MULTI-SENSOR FUSION: ONE MORE MODULE PER BAND, EO NEVER SHED ──────────────────────────────────
ok(SENSOR_LADDER.join() === 'EO,IR,ACOUSTIC,MAG,CHEM', 'the module ladder is the one the operator named');
for (let b = 1; b <= 5; b++) {
  const s = motSpec(`${b}.1`);
  ok(s.sensors.length === b, `band ${b} runs ${b} module(s)`);
  ok(s.sensors[0] === 'EO', `band ${b} always keeps EO`);
  ok(s.sensors.join() === SENSOR_LADDER.slice(0, b).join(), `band ${b} adds them in the declared order`);
}
ok(BAND_NAMES.length === 5, 'every band has a name');

// ── MOVING ALONG THE LADDER ───────────────────────────────────────────────────────────────────────
ok(motStep('1.1', -1) === '1.1', 'stepping below the bottom stays at the bottom');
ok(motStep('5.5', +1) === '5.5', 'and above the top stays at the top');
ok(motStep('1.5', +1) === '2.1', 'a band boundary is just the next rung');
ok(motStep('2.1', -1) === '1.5', 'and the same going down');
ok(motAtMost('5.5', '2.3') === '2.3', 'a ceiling is honoured');
ok(motAtMost('1.2', '4.4') === '1.2', 'and a rung below the ceiling is left alone');
ok(motIndex('1.1') === 0 && motIndex('5.5') === 24, 'the index runs 0 to 24');
ok(/MoT 3\.2/.test(motLabel(motSpec('3.2'))), 'the label names the rung');

// ── THE HAL: THE SENSOR IS PAID FIRST ─────────────────────────────────────────────────────────────
ok(HAL_ORDER.join() === 'pi,edge,accel', 'three declared classes, poorest first');
ok(HAL_PROFILES.pi.frameBudgetMs === 66 && HAL_PROFILES.pi.cnnMs === 18, 'PI-class is 66ms with an 18ms CNN');
ok(HAL_PROFILES.edge.frameBudgetMs === 33 && HAL_PROFILES.edge.cnnMs === 12, 'EDGE-SOC is 33ms with a 12ms CNN');
ok(HAL_PROFILES.accel.frameBudgetMs === 16 && HAL_PROFILES.accel.cnnMs === 8, 'ACCELERATOR is 16ms with an 8ms CNN');
for (const h of HAL_ORDER) ok(HAL_PROFILES[h].about.length > 20, `${h} is described in plain words, not just a number`);
ok(pickHal(10).id === 'pi', 'a machine at 10 fps is told it is Pi-class');
ok(pickHal(30).id === 'edge', 'a machine at 30 fps is EDGE-SOC');
ok(pickHal(90).id === 'accel', 'a machine at 90 fps is accelerator-class');
ok(pickHal(0).id === 'edge' && pickHal(NaN).id === 'edge', 'an unknown measurement takes the middle class, never the best');
ok(resolveHal('pi', 999).id === 'pi', 'an explicit choice is not overridden by a measurement');
ok(resolveHal('auto', 999).id === 'accel', 'and AUTO follows the measurement');
ok(halCnnMs(HAL_PROFILES.pi, 18) === 18, 'the Pi is the reference the rungs are written against');
ok(halCnnMs(HAL_PROFILES.accel, 18) < 18, 'an accelerator runs the same stack cheaper');
{
  const h = HAL_PROFILES.edge, cnn = 12;
  ok(renderHeadroomMs(h, cnn, 10) === h.frameBudgetMs - halCnnMs(h, cnn) - 10,
     'headroom is the frame budget MINUS the sensor MINUS the drawing — the sensor comes out first');
  ok(renderHeadroomMs(h, cnn, 100) < 0, 'a slow frame shows as negative headroom, not as a smaller sensor');
}
ok(!sensorFits(HAL_PROFILES.accel, 200), 'a stack that cannot fit the frame at all is said to be impossible');
ok(/EDGE-SOC/.test(halLabel(HAL_PROFILES.edge, 'auto')) && /AUTO/.test(halLabel(HAL_PROFILES.edge, 'auto')), 'the label says both what was chosen and how');

// ── THE STREAM LADDER ─────────────────────────────────────────────────────────────────────────────
ok(REFERENCE_STREAM.id === '1080p30' && REFERENCE_STREAM.w === 1920 && REFERENCE_STREAM.hz === 30, 'the reference is 1920×1080 at 30 Hz');
ok(STREAMS[STREAMS.length - 1].id === '480p15', 'frame rate is the LAST thing surrendered');
for (let i = 1; i < STREAMS.length; i++) ok(STREAMS[i].pixelsPerSecond < STREAMS[i - 1].pixelsPerSecond, `${STREAMS[i].id} carries less than ${STREAMS[i - 1].id}`);
ok(STREAMS[1].hz === 30 && STREAMS[2].hz === 30, 'resolution goes before frames: 720p and 480p both still hold 30 Hz');
ok(isReference(0) && !isReference(1), 'only the top rung is the reference');
ok(fractionOfReference(0) === 1, 'the reference is 100% of itself');
ok(fractionOfReference(3) < 0.2, 'the last resort is honest about how little it carries');
ok(/holding the reference/.test(streamLabel(0)) && /% of reference/.test(streamLabel(2)), 'the label says which, in words');
ok(streamAt(-5).id === '1080p30' && streamAt(99).id === '480p15', 'an index off the ladder is held at the ends, not thrown');

// ── THE LIVE LOOP: DEGRADE IN ORDER, AND SAY SO ───────────────────────────────────────────────────
{
  const hal = HAL_PROFILES.pi;
  let s = initCal('5.1', '5.5');
  ok(s.sensors.length === 5, 'a band-5 rung starts with all five modules live');
  const slow = { hal, frameMs: 500 };                    // hopelessly over budget

  const r1 = calStep(s, slow); s = r1.state;
  ok(r1.changed && s.sensors.length === 4 && !s.sensors.includes('CHEM'), 'the first thing shed is CHEM, from the top of the ladder');
  ok(/shed/.test(s.reason), 'and it says so');

  for (let i = 0; i < 3; i++) s = calStep(s, slow).state;
  ok(s.sensors.length === 1 && s.sensors[0] === 'EO', 'it sheds down to EO and stops — a blind unit is not a degraded unit');

  const before = s.streamIdx;
  s = calStep(s, slow).state;
  ok(s.streamIdx === before + 1, 'only once the modules are gone does a pixel go');
  while (s.streamIdx < STREAMS.length - 1) s = calStep(s, slow).state;
  ok(streamAt(s.streamIdx).id === '480p15', 'and the frame rate is the last rung of that fall');

  const lvl = s.level;
  s = calStep(s, slow).state;
  ok(motIndex(s.level) < motIndex(lvl), 'only at the floor of the stream ladder does it ask for less picture');
}
{
  // Climbing back: sustained headroom only, and in the reverse order it fell.
  const hal = HAL_PROFILES.accel;
  let s = { ...initCal('3.1', '5.5'), streamIdx: 2, sensors: ['EO'] };
  const fast = { hal, frameMs: 1 };
  const first = calStep(s, fast); s = first.state;
  ok(!first.changed, 'one good reading is not enough to climb');
  s = calStep(s, fast).state;
  const third = calStep(s, fast); s = third.state;
  ok(third.changed && s.streamIdx === 1, `it takes ${HOLD_TICKS_TO_CLIMB} held readings, and pixels come back first (reason: ${s.reason})`);
  s = calStep(calStep(calStep(s, fast).state, fast).state, fast).state;
  ok(s.streamIdx === 0, 'then the reference stream is back');
  s = calStep(calStep(calStep(s, fast).state, fast).state, fast).state;
  ok(s.sensors.length === 2, 'and only then does a module come back on');
}
{
  const hal = HAL_PROFILES.edge;
  const s = { ...initCal('2.1', '2.1'), held: 99 };
  const r = calStep(s, { hal, frameMs: 1 });
  ok(r.state.level === '2.1', 'calibration never climbs above the ceiling a person set');
  ok(/ceiling/.test(r.state.reason), 'and says that is why it stopped');
  ok(!calStep(s, { hal, frameMs: NaN }).changed, 'a reading that is not a number changes nothing');
}
ok(/·/.test(calLine(initCal(), HAL_PROFILES.pi)), 'the DATA line carries stream, machine, sensors and reason');
// The climb threshold is a FRACTION of the budget, so every class can actually reach it.
ok(CLIMB_HEADROOM_FRACTION > 0 && CLIMB_HEADROOM_FRACTION < 0.5, 'the climb threshold is a fraction of the frame, not a fixed millisecond count');
for (const h of HAL_ORDER) {
  const t = climbThresholdMs(HAL_PROFILES[h]);
  ok(t < HAL_PROFILES[h].frameBudgetMs - HAL_PROFILES[h].cnnMs,
     `${h} can actually reach its climb threshold (${t.toFixed(1)}ms of a ${HAL_PROFILES[h].frameBudgetMs}ms frame)`);
}

// ── THE SELF-TEST: 6 TO 15 MINUTES, AND THE DWELL IS DERIVED ──────────────────────────────────────
{
  const p6 = planSelfCal(6), p15 = planSelfCal(15);
  ok(p6.dwellS >= MIN_DWELL_S, `a 6-minute budget still gives a sustained reading (${p6.dwellS}s per rung)`);
  ok(p15.dwellS <= MAX_DWELL_S, `a 15-minute budget does not waste time either (${p15.dwellS}s per rung)`);
  ok(p15.dwellS > p6.dwellS, 'a longer budget buys a longer look at each rung');
  ok(p6.worstCaseMinutes <= SELF_CAL_MAX_MINUTES + 0.5, `the worst case fits the release goal (${p6.worstCaseMinutes} min)`);
  ok(p6.rungs.length === 25, 'the sweep walks all 25 rungs');
  ok(planSelfCal(1).budgetMinutes === SELF_CAL_MIN_MINUTES, 'a budget under 6 minutes is raised to 6, not silently accepted');
  ok(planSelfCal(90).budgetMinutes === SELF_CAL_MAX_MINUTES, 'and one over 15 is held at 15');
  ok(/stops early/.test(p6.note), 'the plan says out loud that it can stop early');
}
{
  const hal = HAL_PROFILES.pi;
  ok(judgeRung('1.1', hal, 60).pass, 'a Pi holding 60 fps passes the arcade rung');
  ok(!judgeRung('1.1', hal, 20).pass, 'and fails it at 20 fps, under the 30 Hz reference');
  ok(/under the 30 Hz reference/.test(judgeRung('1.1', hal, 20).why), 'the reason names the reference, not a code');
  // A 50ms sensor stack DOES fit a 66ms Pi frame — it is the 16ms accelerator frame it cannot fit.
  ok(judgeRung('5.5', hal, 200).pass, 'a Pi has a slow frame but a lot of it: the top rung fits at 200 fps');
  const tight = HAL_PROFILES.accel;
  ok(!judgeRung('5.5', tight, 200).pass, 'an accelerator has a fast frame and little of it: the top rung does not fit however fast the picture is');
  ok(/sensor alone/.test(judgeRung('5.5', tight, 200).why), 'and says that is why');
  ok(!judgeRung('4.5', HAL_PROFILES.edge, 31).pass, 'a frame that clears the reference but overruns the budget still fails');
  ok(/frame budget/.test(judgeRung('4.5', HAL_PROFILES.edge, 31).why), 'and names the budget it overran');
}
{
  // A machine that holds the low rungs and falls over higher up: the sweep must stop, and report honestly.
  const hal = HAL_PROFILES.edge;
  const plan = planSelfCal(6);
  let sw = initSweep();
  const fpsFor = (i) => (i < 6 ? 80 : 10);
  while (!sw.done) sw = calSweepStep(sw, plan, hal, fpsFor(sw.idx));
  ok(sw.done, 'the sweep ends');
  ok(sw.results.length < plan.rungs.length, `it stopped early rather than walking all 25 (${sw.results.length} tried)`);
  ok(sw.failStreak >= FAIL_STREAK_TO_STOP, `it stopped after ${FAIL_STREAK_TO_STOP} failures in a row`);
  const rep = selfCalReport(sw, plan, hal);
  ok(rep.ceiling === '2.1', `it reports the highest rung actually held (${rep.ceiling})`);
  ok(rep.passed === 6, 'and how many passed');
  ok(rep.sensorsAtCeiling.length === 2, 'and which sensors run at that ceiling');
  ok(/holds MoT 2\.1 at 1080p30/.test(rep.headline), `the headline is a sentence a person can act on: "${rep.headline}"`);
  ok(rep.elapsedS <= SELF_CAL_MAX_MINUTES * 60, `and it took ${rep.elapsedS}s, inside the budget`);
}
{
  // A machine that holds nothing must say so, not report a ceiling it never reached.
  const hal = HAL_PROFILES.pi;
  const plan = planSelfCal(6);
  let sw = initSweep();
  while (!sw.done) sw = calSweepStep(sw, plan, hal, 5);
  const rep = selfCalReport(sw, plan, hal);
  ok(rep.ceiling === null, 'a machine that held no rung is reported as holding no rung');
  ok(/held no rung/.test(rep.headline), 'in words, with the rung it tried');
}

console.log(`\nmot-ladder: ${pass} passed, ${fail} failed · 25 rungs · 1.1 ${motSpec('1.1').demandFps}fps/${motSpec('1.1').segments}seg → 5.5 ${motSpec('5.5').demandFps}fps/${motSpec('5.5').segments}seg`);
process.exit(fail ? 1 : 0);
