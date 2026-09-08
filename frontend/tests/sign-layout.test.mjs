// Page layout from pixels (operator 00:50): the initials slot never covers text; the partner's line is found.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sign-layout.test.mjs
import { initialsSlotTop, partnerRule } from "../lib/sign-layout.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const W = 400, H = 500;
const page = () => ({ width: W, height: H, data: new Uint8ClampedArray(W * H * 4).fill(255) });
const ink = (b, x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * W + x) * 4; b.data[i] = b.data[i + 1] = b.data[i + 2] = 20; } };

// an empty bottom: the slot sits in the bottom margin (top ≈ H − 3 − 9 = 488 → 0.976)
const b0 = page(); ink(b0, 40, 360, 300, 310);
ok(Math.abs(initialsSlotTop(b0) - (H - 3 - 9) / H) < 0.003, `empty bottom → bottom margin (got ${initialsSlotTop(b0).toFixed(3)})`);
// a footer rule 20 px above the bottom edge: still room under it (20 ≥ 9 + 2 + 3)
const b1 = page(); ink(b1, 40, 360, 479, 480);
ok(initialsSlotTop(b1) * H > 480 && initialsSlotTop(b1) * H + 9 <= H - 3, `room under a footer rule → below it (top ${(initialsSlotTop(b1) * H).toFixed(0)})`);
// a table running to 6 px above the bottom edge on the right: no room below → the lowest clear gap above the table
const b2 = page(); ink(b2, 220, 396, 300, 493);                                   // table on the right, to y=493
ink(b2, 220, 396, 250, 260);                                                       // some text above, gap 261..299 (39 rows)
const t2 = initialsSlotTop(b2) * H;
ok(t2 >= 261 && t2 + 9 <= 299, `table to the edge → the gap above it (top ${t2.toFixed(0)}, want within 261–290)`);
// ink only in the LEFT column leaves the right column free: bottom margin
const b3 = page(); ink(b3, 10, 150, 470, 495);
ok(Math.abs(initialsSlotTop(b3) - (H - 3 - 9) / H) < 0.003, "ink on the left only → right column free → bottom margin");

// the partner's line: two rules on one row; the first signer's box on the left one
const b4 = page(); ink(b4, 40, 180, 300, 300); ink(b4, 220, 360, 300, 300);
const sigL = { x: 40 / W, y: 285 / H, w: 141 / W, h: 14 / H };
const pr = partnerRule(b4, sigL);
ok(pr && Math.abs(pr.x - 220 / W) < 0.01 && Math.abs(pr.w - 141 / W) < 0.01 && Math.abs(pr.lineY - 300 / H) < 0.004, `partner rule to the RIGHT (got ${pr && JSON.stringify([pr.x.toFixed(3), pr.w.toFixed(3)])})`);
const sigR = { x: 220 / W, y: 285 / H, w: 141 / W, h: 14 / H };
const pl = partnerRule(b4, sigR);
ok(pl && Math.abs(pl.x - 40 / W) < 0.01, `partner rule to the LEFT when the first signer took the right column (got ${pl && pl.x.toFixed(3)})`);
ok(partnerRule(page(), sigL) === null, "no second rule → null (the caller falls back)");
console.log(`sign-layout: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
