// ADAPTIVE FIDELITY — "if compute is higher, resolution upgrade and frame rate upgrade (only per Edge sensor
// CNN compute and available compute)" (operator 2026-09-15). Two laws are gated here:
//   1. THE SENSOR IS PAID FIRST — the CNN reserve comes out of the frame before the renderer may want anything.
//   2. A TIER CHANGES WHAT IS DRAWN, NEVER WHAT IS TRUE — the model hash is identical at every tier.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/drone-fidelity.test.mjs
const { TIERS, TIER_ORDER, SENSOR_PROFILES, renderBudgetMs, tierFeasible, initFidelity, stepFidelity, applyCap,
        fidelityLabel, UPGRADE_HOLD_MS, UPGRADE_HEADROOM } = await import("../lib/wire-core/fidelity.ts");
const { WireBuilder, canonicalHash, selectLod } = await import("../lib/wire-core/wire-model.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ── the ladder is monotonic: more compute buys more of everything, never less ──
ok(TIER_ORDER.join() === "low,med,high,ultra", "four tiers, poorest first");
for (let i = 1; i < TIER_ORDER.length; i++) {
  const a = TIERS[TIER_ORDER[i - 1]], b = TIERS[TIER_ORDER[i]];
  ok(b.segments > a.segments && b.fps >= a.fps && b.dpr >= a.dpr && b.ngonSides > a.ngonSides,
     `${TIER_ORDER[i]} raises segments, fps, resolution and curve detail over ${TIER_ORDER[i - 1]}`);
}
ok(TIERS.low.segments === 1200 && TIERS.ultra.fps === 60, "LOW is a Pi budget (1200 segments); ULTRA is 60fps");

// ── the sensor is paid first ──
const pi = SENSOR_PROFILES["pi-baseline"], accel = SENSOR_PROFILES["edge-accel"], none = SENSOR_PROFILES.none;
ok(renderBudgetMs("low", none) === 1000 / 15, "with no sensor the whole frame is the renderer's");
ok(Math.abs(renderBudgetMs("low", pi) - (1000 / 15 - 18)) < 1e-9, "the CNN reserve is subtracted from the frame budget");
ok(renderBudgetMs("high", pi) < renderBudgetMs("high", accel), "a cheaper sensor leaves more for the picture");
ok(!tierFeasible("ultra", pi), "ULTRA (60fps = 16.7ms) is NOT feasible while a Pi-class CNN takes 18ms — said, not limped through");
ok(tierFeasible("ultra", accel), "ULTRA is feasible once the sensor runs on an accelerator");

// ── downgrade is immediate; upgrade must be earned ──
let s = initFidelity("ultra", "high");
let r = stepFidelity(s, 999, accel, 0);
ok(r.changed && r.state.tier === "med", "one blown frame drops the tier immediately");
ok(/over/.test(r.reason), `and says why (${r.reason})`);

s = initFidelity("ultra", "med");
const budget = renderBudgetMs("med", accel);
r = stepFidelity(s, budget * 0.2, accel, 1000);
ok(!r.changed && r.state.headroomSince === 1000, "headroom starts a clock rather than upgrading at once");
r = stepFidelity(r.state, budget * 0.2, accel, 1000 + UPGRADE_HOLD_MS - 1);
ok(!r.changed, `still holding just under ${UPGRADE_HOLD_MS}ms`);
r = stepFidelity(r.state, budget * 0.2, accel, 1000 + UPGRADE_HOLD_MS);
ok(r.changed && r.state.tier === "high", "three seconds of headroom earns one step up");
r = stepFidelity({ ...r.state, tier: "high", headroomSince: 0 }, renderBudgetMs("high", accel) * 0.9, accel, 99999);
ok(!r.changed, `a frame above ${UPGRADE_HEADROOM * 100}% of budget is not headroom`);

// no oscillation: a blown frame right after an upgrade drops and the headroom clock restarts from null
s = initFidelity("ultra", "high");
const up = stepFidelity({ ...s, headroomSince: 0 }, 1, accel, UPGRADE_HOLD_MS);
ok(up.changed && up.state.headroomSince === null, "an upgrade clears the headroom clock, so it cannot ratchet");

// the manual cap is a ceiling the automation may not pass
s = initFidelity("low", "low");
r = stepFidelity({ ...s, headroomSince: 0 }, 0.1, accel, 99999);
ok(!r.changed && /ceiling/.test(r.reason), "auto-upgrade never passes the operator's manual cap");

// an infeasible tier steps down even on a good frame
r = stepFidelity(initFidelity("ultra", "ultra"), 1, pi, 0);
ok(r.changed && r.state.tier === "high", "an infeasible tier drops regardless of how fast the frame was");

// a missing measurement changes nothing
ok(!stepFidelity(initFidelity(), NaN, accel, 0).changed, "no measurement, no decision");

// ── THE INVARIANT: the tier changes what is drawn, never what is true ──
const b = new WireBuilder();
b.group("base", "ring", "blank", 0, () => b.path([[0,0,0],[9,0,0],[9,9,0]], true));
b.group("mid", "polyline", "ooda", 1, () => b.path([[0,0,0],[0,0,4]]));
b.group("detail", "polyline", "framework", 2, () => b.path([[9,9,0],[9,9,7],[0,9,7]]));
const model = b.build({ id: "t", name: "t", version: "00.00", revision: "0.001", generator: "test", stamp: "s" },
                      { kind: "enu", origin: { lat: 30, lon: -97, mslM: 0 }, up: "z" });
const h = canonicalHash(model);
const seen = TIER_ORDER.map((t) => { selectLod(model, TIERS[t].maxLod, TIERS[t].segments); return canonicalHash(model); });
ok(seen.every((x) => x === h), "the model hash is IDENTICAL at every tier — fidelity never edits the truth");
const kept = TIER_ORDER.map((t) => selectLod(model, TIERS[t].maxLod, TIERS[t].segments).kept);
ok(kept[0] < kept[3], `and LOW really does draw less than ULTRA (${kept[0]} vs ${kept[3]})`);
const lowReport = selectLod(model, TIERS.low.maxLod, TIERS.low.segments);
ok(lowReport.dropped > 0 && lowReport.byGroup.some((g) => !g.kept), "what was dropped is reported per group, never silent");

// ── the HUD always says where it is ──
const label = fidelityLabel(initFidelity("ultra", "high"), pi, lowReport);
ok(/HIGH/.test(label) && /30fps/.test(label) && /sensor 18ms/.test(label) && /dropped/.test(label),
   `the label carries tier, fps, sensor reserve and drops (${label})`);

// THE MANUAL CEILING — lowering it is immediate, raising it is only permission.
{
  const high = { tier: 'high', manualCap: 'ultra', headroomSince: 1000, reason: 'x' };
  const lowered = applyCap(high, 'low');
  ok(lowered.tier === 'low', 'lowering the ceiling drops the picture at once, not on the next missed frame');
  ok(lowered.manualCap === 'low', 'the new ceiling is remembered');
  ok(lowered.headroomSince === null, 'lowering the ceiling forgets any headroom earned under the old one');
  const raised = applyCap(lowered, 'ultra');
  ok(raised.tier === 'low', 'raising the ceiling never jumps the picture — an upgrade still has to be earned');
  ok(raised.manualCap === 'ultra', 'but the higher ceiling is now permitted');
  ok(applyCap(raised, 'ultra') === raised, 'a cap that did not change returns the same state');
}

console.log(`drone-fidelity: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
