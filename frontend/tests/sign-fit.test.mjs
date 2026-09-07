// Fit-to-underline — pure, on synthetic bitmaps (operator: the box snaps to the signature line and is
// never taller than the bottom of the text above it). Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sign-fit.test.mjs
import { fitToUnderline } from "../lib/sign-fit.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const W = 400, H = 500;
const page = () => ({ width: W, height: H, data: new Uint8ClampedArray(W * H * 4).fill(255) });
const ink = (b, x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * W + x) * 4; b.data[i] = b.data[i + 1] = b.data[i + 2] = 20; } };
const near = (a, b, tol = 0.006) => Math.abs(a - b) < tol;

// a signature block: "Lender" text (rows 300-309, x 40-120), a rule at rows 340-341 (x 40-220)
const b1 = page(); ink(b1, 40, 120, 300, 309); ink(b1, 40, 220, 340, 341);
const f1 = fitToUnderline(b1, { x: 0.3, y: 0.66 });   // thumb lands 10 px above the rule
ok(!!f1, "a rule within reach of the tap is found");
ok(f1 && near(f1.x, 40 / W) && near(f1.w, 181 / W), `box spans the rule: x=${f1?.x.toFixed(3)} w=${f1?.w.toFixed(3)} (want 0.100 / 0.4525)`);
ok(f1 && near(f1.y + f1.h, 339 / H) && near(f1.lineY, 340 / H), `box bottom sits on the rule (${f1 && ((f1.y + f1.h) * H).toFixed(1)} px, rule at 340)`);
ok(f1 && near(f1.y, 311 / H), `box top is just under the text above (${f1 && (f1.y * H).toFixed(1)} px, text bottom 309)`);

// the thumb ON the rule, and slightly beside its column
ok(!!fitToUnderline(b1, { x: 0.3, y: 340 / H }), "tap exactly on the rule");
ok(!!fitToUnderline(b1, { x: 0.3, y: 0.62 }), "tap 30 px above still finds it (reach 6 % = 30 px)");
ok(fitToUnderline(b1, { x: 0.3, y: 0.5 }) === null, "tap 90 px away: no fit — the default box is used");
ok(fitToUnderline(b1, { x: 0.8, y: 0.68 }) === null, "tap right of the rule's end: not this rule");

// no text above within the cap → default height, never taller than maxH
const b2 = page(); ink(b2, 40, 220, 340, 340);
const f2 = fitToUnderline(b2, { x: 0.3, y: 0.68 });
ok(f2 && near(f2.h, (0.08 * H - 1) / H, 0.01), `no text above: default height (${f2 && (f2.h * H).toFixed(1)} px ≈ 40)`);

// underscores: "Date: ____ ____" — dashed with 3-px gaps still reads as one line
const b3 = page(); for (let x = 60; x < 260; x += 10) ink(b3, x, x + 6, 400, 401);
const f3 = fitToUnderline(b3, { x: 0.4, y: 0.79 });
ok(f3 && near(f3.x, 60 / W) && f3.w > 0.45, `a run of underscores fits as one rule (w=${f3?.w.toFixed(3)})`);

// a short stroke (a hyphen, 20 px) is not a signature line
const b4 = page(); ink(b4, 100, 120, 250, 250);
ok(fitToUnderline(b4, { x: 0.27, y: 0.5 }) === null, "a 20-px stroke is not a line (min 15 % of the width)");

// a two-column block: two rules on the same row — the tap's column picks its own
const b5 = page(); ink(b5, 30, 190, 300, 300); ink(b5, 210, 370, 300, 300);
const l = fitToUnderline(b5, { x: 0.25, y: 0.59 }), r = fitToUnderline(b5, { x: 0.75, y: 0.59 });
ok(l && r && near(l.x, 30 / W) && near(l.w, 161 / W) && near(r.x, 210 / W) && near(r.w, 161 / W), "left tap → left rule, right tap → right rule");

console.log(`sign-fit: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
