// R-CORE GESTURES lock — the shared Vision-2525 interaction math (mirrors Mission-Planning) is pure +
// deterministic. Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/rcore-gestures.test.mjs
import { RCORE_CFG, clamp, wrapAngle, rightDrag, pinchUpdate, pairGeometry, wheelZoom } from "../lib/rcore-gestures.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

// clamp + wrapAngle
ok(clamp(5, 0, 3) === 3 && clamp(-1, 0, 3) === 0 && clamp(2, 0, 3) === 2, "clamp bounds");
ok(near(wrapAngle(Math.PI + 0.1), -Math.PI + 0.1) && near(wrapAngle(-Math.PI - 0.1), Math.PI - 0.1), "wrapAngle normalizes across ±π seam");
ok(near(wrapAngle(0.3), 0.3), "wrapAngle leaves in-range angles");

// RIGHT-drag: bearing += −(dx/width)·π ; pitch += dy·0.35 (MP constants)
const rd = rightDrag(100, 20, 200);
ok(near(rd.dBearing, -(100 / 200) * Math.PI), "right-drag bearing = −(dx/width)·π");
ok(near(rd.dPitch, 20 * RCORE_CFG.rightPitch), "right-drag pitch = dy·0.35");
ok(rightDrag(-100, 0, 200).dBearing > 0, "drag left → bearing increases (opposite sign)");

// Two-finger: spread → zoom in (>1); pinch → zoom out (<1); twist → bearing; vertical → tilt
const p0 = pairGeometry(0, 0, 10, 0);        // 10px apart, horizontal, midY 0
const spread = pairGeometry(0, 0, 20, 0);    // 20px apart → spread
ok(pinchUpdate(p0, spread).zoomFactor > 1, "spread fingers → zoomFactor > 1 (zoom in)");
ok(pinchUpdate(spread, p0).zoomFactor < 1, "pinch fingers → zoomFactor < 1 (zoom out)");
const twisted = pairGeometry(0, 0, 0, 10);   // rotated 90° from horizontal
ok(Math.abs(pinchUpdate(p0, twisted).dBearing) > 0.1, "twist → bearing delta");
const lifted = pairGeometry(0, 20, 10, 20);  // same separation, midY moved +20
ok(near(pinchUpdate(p0, lifted).dPitch, 20 * RCORE_CFG.twoFingerTilt), "two-finger vertical → tilt = dcy·0.25");
ok(near(pinchUpdate(p0, lifted).zoomFactor, 1), "pure vertical move → no zoom (dist unchanged)");

// Determinism
ok(JSON.stringify(pinchUpdate(p0, spread)) === JSON.stringify(pinchUpdate(p0, spread)), "pinchUpdate deterministic");

// Wheel
ok(wheelZoom(-100) > 1 && wheelZoom(100) < 1, "wheel up → zoom in, down → zoom out");
ok(near(wheelZoom(-100) * wheelZoom(100), 1), "wheel up∘down = identity (symmetric step)");

// pairGeometry
const g = pairGeometry(0, 0, 3, 4);
ok(g.dist === 5 && near(g.cy, 2), "pairGeometry dist=5, midY=2");

// S4 — MISSION-PLANNING PARITY LOCK: the shared constants must EXACTLY match mission-planning.tsx so Architect
// never feels faster/twitchier than the tactical map (operator). These pin the source-of-truth values.
ok(RCORE_CFG.pinchDamp === 0.5, "MP parity: pinch damp K=0.5 (mission-planning.tsx:791)");
ok(RCORE_CFG.wheelStep === 0.15, "MP parity: wheel step 0.15 → factor 1.15 (mission-planning.tsx:663)");
ok(near(wheelZoom(-1), 1.15) && near(wheelZoom(1), 1 / 1.15), "wheel factor = 1.15 / (1/1.15), identical to MP");
ok(RCORE_CFG.rightPitch === 0.35 && RCORE_CFG.twoFingerTilt === 0.25, "MP parity: right-pitch 0.35, two-finger tilt 0.25");
// sensitivity scalar (default 1 = MP parity; <1 = calmer). Default must not change any delta.
ok(RCORE_CFG.sensitivity === 1, "sensitivity defaults to 1 (MP parity, inert)");
const calm = { ...RCORE_CFG, sensitivity: 0.5 };
ok(near(rightDrag(100, 20, 200, calm).dBearing, rightDrag(100, 20, 200).dBearing * 0.5), "sensitivity 0.5 halves right-drag bearing");
ok(near(rightDrag(100, 20, 200, calm).dPitch, rightDrag(100, 20, 200).dPitch * 0.5), "sensitivity 0.5 halves right-drag pitch");
ok(near(pinchUpdate(p0, twisted, calm).dBearing, pinchUpdate(p0, twisted).dBearing * 0.5), "sensitivity 0.5 halves two-finger twist");
ok(near(pinchUpdate(p0, spread, calm).zoomFactor, pinchUpdate(p0, spread).zoomFactor), "sensitivity does NOT change zoom (only rotate/tilt feel)");

console.log(`\nRCORE-GESTURES ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
