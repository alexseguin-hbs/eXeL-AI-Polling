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

console.log(`\nRCORE-GESTURES ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
