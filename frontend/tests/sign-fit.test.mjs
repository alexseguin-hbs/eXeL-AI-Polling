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

// a scanned page is never level: a rule that drifts one row every 40 px (≈ 1.4°) is still ONE line
const b6 = page(); for (let x = 40; x <= 280; x++) ink(b6, x, x, 300 + Math.floor((x - 40) / 40), 300 + Math.floor((x - 40) / 40));
const f6 = fitToUnderline(b6, { x: 0.4, y: 0.6 });
ok(f6 && near(f6.x, 40 / W) && near(f6.w, 241 / W, 0.01), `a tilted (scanned) rule is followed end to end (w=${f6?.w.toFixed(3)}, want 0.6025)`);


// textH — the document's own text size next to the line (operator 2026-09-08: "match pdf doc size for date and text")
{
  // "Date:" label LEFT of the rule on the same baseline: ink rows 330-339 (10 px tall), rule at 340-341 from x 140
  const b = page(); ink(b, 60, 120, 330, 339); ink(b, 140, 300, 340, 341);
  const f = fitToUnderline(b, { x: 0.5, y: 0.68 });
  ok(f && f.textH !== undefined && near(f.textH, 10 / H), `textH follows the label left of the rule (${f && f.textH && (f.textH * H).toFixed(1)} px, want 10)`);
  // no label beside it: the text line ABOVE the rule (rows 300-309) sets it
  const f1 = fitToUnderline(b1, { x: 0.3, y: 0.66 });
  ok(f1 && f1.textH !== undefined && near(f1.textH, 10 / H), `textH falls back to the text line above (${f1 && f1.textH && (f1.textH * H).toFixed(1)} px, want 10)`);
  // a bare rule with nothing near it reports no textH (the caller keeps its default)
  const b2 = page(); ink(b2, 40, 220, 340, 341);
  const f2 = fitToUnderline(b2, { x: 0.3, y: 0.68 });
  ok(f2 && f2.textH === undefined, "a bare rule carries no text size");
}


// scale-free: the same page at 2× (a zoomed render) fits the same fractions — dashed gaps and text heights double too
{
  const W2 = W * 2, H2 = H * 2; const b2 = { width: W2, height: H2, data: new Uint8ClampedArray(W2 * H2 * 4).fill(255) };
  const ink2 = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * W2 + x) * 4; b2.data[i] = b2.data[i + 1] = b2.data[i + 2] = 20; } };
  ink2(120, 240, 660, 679); for (let x = 280; x <= 600; x += 6) ink2(x, x + 2, 680, 683);       // "Date:" label + a dashed rule (3 on / 3 off) at 2× — the 3-px bridge is fixed at every scale
  const b1x = page(); ink(b1x, 60, 120, 330, 339); for (let x = 140; x <= 300; x += 6) ink(b1x, x, x + 2, 340, 341);   // the same page at 1× (3 on / 3 off)
  const f1x = fitToUnderline(b1x, { x: 0.5, y: 0.68 }), f2x = fitToUnderline(b2, { x: 0.5, y: 0.68 });
  ok(f1x && f2x, "a dashed rule is bridged at 1× and at 2×");
  ok(f1x && f2x && near(f1x.x, f2x.x) && near(f1x.w, f2x.w) && near(f1x.lineY, f2x.lineY) && near(f1x.textH ?? 0, f2x.textH ?? 0), `1× and 2× agree: x ${f1x?.x.toFixed(3)}/${f2x?.x.toFixed(3)} w ${f1x?.w.toFixed(3)}/${f2x?.w.toFixed(3)} textH ${f1x?.textH?.toFixed(4)}/${f2x?.textH?.toFixed(4)}`);
}

console.log(`sign-fit: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
