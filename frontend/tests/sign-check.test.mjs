// A check is a stroke inside its square. No white box. Run:
// node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sign-check.test.mjs
import { PDFDocument, PDFRawStream, decodePDFRawStream, PDFArray } from "pdf-lib";
import { stampCheck } from "../lib/pdf-stamp.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const blank = await PDFDocument.create(); blank.addPage([612, 792]);
const box = { page: 1, x: 0.2, y: 0.3, w: 0.03, h: 0.02 };
const out = await stampCheck(await blank.save(), box);
const doc = await PDFDocument.load(out);
ok((doc.getKeywords() ?? "").includes("SoIChk:1:0.2000:0.3000:0.0300:0.0200"), "the check is recorded on the square");
const contents = doc.getPage(0).node.Contents();
const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
let text = "";
for (const r of refs) {
  const stream = doc.context.lookup(r);
  if (stream instanceof PDFRawStream) text += new TextDecoder("latin1").decode(decodePDFRawStream(stream).decode());
}
ok(!/1 1 1 rg/.test(text), "the check paints no white box over the label");
const moves = [...text.matchAll(/([\d.]+) ([\d.]+) m/g)].map((m) => ({ x: +m[1], y: +m[2] }));
const bw = 0.03 * 612, bh = 0.02 * 792, bx = 0.2 * 612, by = 792 - 0.3 * 792 - bh;
ok(moves.length >= 2 && moves.every((p) => p.x >= bx - 0.2 && p.x <= bx + bw + 0.2 && p.y >= by - 0.2 && p.y <= by + bh + 0.2), `the stroke stays inside the square (${moves.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}) box ${bx.toFixed(1)}..${(bx + bw).toFixed(1)} ${by.toFixed(1)}..${(by + bh).toFixed(1)}`);
console.log(`sign-check: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
