// Sign Doc PDF engine — headless gate (Asar, round 1): a stamp is countable, the note's money holds.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/pdf-stamp.test.mjs
import { buildDocPdf, solvePayment, amortize, promissoryNote } from "../lib/doc-pdf.ts";
import { stampSignature, stampText, stampCodexBlock, codexRows, cacStamp, textBoxes, countSignatureImages, pageCount } from "../lib/pdf-stamp.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// money — the operator's real note: $11,049 at 11.35% over 42 months
ok(solvePayment(11049, 11.35, 42) === 320, `solvePayment → $320.00 (got ${solvePayment(11049, 11.35, 42)})`);
const rows = amortize(11049, 11.35, 42, 320, new Date("2026-10-01T00:00:00Z"));
const paid = Math.round(rows.reduce((s, r) => s + r.payment, 0) * 100) / 100, int = Math.round(rows.reduce((s, r) => s + r.interest, 0) * 100) / 100;
ok(rows.length === 42 && rows[41].end === 0, "42 rows, ends at $0.00");
// 11,049 × 0.1135 ÷ 12 = 104.505125 → 104.51 (the operator's source table showed 104.50 — a rounding fudge we do not repeat)
ok(rows[0].interest === 104.51 && rows[0].principal === 215.49 && rows[0].end === 10833.51, `first row 104.51 / 215.49 / 10,833.51 (got ${rows[0].interest}/${rows[0].principal}/${rows[0].end})`);
ok(paid === 13440 && int === 2391, `totals $13,440.00 paid, $2,391.00 interest (got ${paid}/${int})`);
ok(rows[41].date === "2030-03-01" && rows[41].payment === 320 && rows.every((r) => r.payment === 320), "every payment $320.00, last on 2030-03-01 — no odd last amount");
ok(Math.abs(rows[41].interest - Math.round(rows[41].begin * 11.35 / 1200 * 100) / 100) <= 0.05, "last-row residual is cents, not dollars");

// a generated document → a PDF with pages
const note = promissoryNote({ lender: "Ada Lender", borrower: "Ben Borrower", principal: 11049, apr: 11.35, months: 42, firstPayment: "2026-10-01" });
const pdf = await buildDocPdf(note.spec);
ok(pdf.length > 2000 && String.fromCharCode(...pdf.slice(0, 5)) === "%PDF-", "PDF bytes produced");
const pages = await pageCount(pdf); ok(pages >= 2, `note + schedule spans ≥ 2 pages (got ${pages})`);
ok((await countSignatureImages(pdf)) === 0, "fresh document carries no signature image");

// stamp once → exactly one SoISig image; twice → two
const png1x1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const s1 = await stampSignature(pdf, { page: 1, x: 0.1, y: 0.8, w: 0.35, h: 0.08 }, { pngDataUrl: png1x1, name: "Ada Lender", isoDate: "2026-09-07T12:00:00Z", hash: "ba7816bf" });
ok((await countSignatureImages(s1)) === 1, "one stamp → one signature image");
const s2 = await stampSignature(s1, { page: 1, x: 0.55, y: 0.8, w: 0.35, h: 0.08 }, { pngDataUrl: png1x1, name: "Ben Borrower", isoDate: "2026-09-07T13:00:00Z", hash: "deadbeef" });
ok((await countSignatureImages(s2)) === 2, "two stamps → two signature images");
ok((await pageCount(s2)) === pages, "stamping adds no pages");
ok(s2.length > s1.length && s1.length > pdf.length, "each stamp grows the file");

// a date mark beside the signature — text fitted into its box, recorded as SoITxt
const s3 = await stampText(s2, { page: 1, x: 0.1, y: 0.9, w: 0.22, h: 0.035 }, "Sep 7, 2026");
ok((await textBoxes(s3)).length === 1 && (await countSignatureImages(s3)) === 2, "a text mark stamps without touching the signatures");

// ── a /Rotate 90 page: stamp + date land without error, recorded with r90 (Enki, Asar) ──
{
  const { PDFDocument, degrees } = await import("pdf-lib");
  const d = await PDFDocument.load(pdf); d.getPage(0).setRotation(degrees(90));
  const rotated = await d.save({ useObjectStreams: false });
  const r1 = await stampSignature(rotated, { page: 1, x: 0.2, y: 0.6, w: 0.4, h: 0.08 }, { pngDataUrl: png1x1, name: "Ada Lender", isoDate: "2026-09-07T12:00:00Z", hash: "ba7816bf" });
  const r2 = await stampText(r1, { page: 1, x: 0.2, y: 0.7, w: 0.22, h: 0.035 }, "Sep 7, 2026", { signerIdx: 0, isoDate: "2026-09-07T12:00:00Z", chain: "" });
  const kw = (await PDFDocument.load(r2)).getKeywords() ?? "";
  ok((await countSignatureImages(r2)) === 1 && /SoISig:1:[^ ]*:r90/.test(kw) && /SoITxt:1:[^ ]*:r90:s0:2026-09-07T12:00:00Z:genesis/.test(kw), "rotated page: stamp + bound date mark recorded with r90");
}

// ── signatory block: two rows accumulate at the bottom-right of the last page ──
{
  const b1 = await stampCodexBlock(s2, { rowIndex: 0, total: 2, name: "Ada Lender", isoDate: "2026-09-07T20:03:56Z", hash: "91d05b18" });
  const b2 = await stampCodexBlock(b1, { rowIndex: 1, total: 2, name: "Ben Borrower", isoDate: "2026-09-07T20:10:02Z", hash: "31813d77" });
  const rows = await codexRows(b2);
  ok(rows.length === 2 && rows[0].rowIndex === 0 && rows[1].rowIndex === 1 && rows[1].hash === "31813d77" && rows[0].isoDate === "2026-09-07T20:03:56Z", "signatory block: two rows recorded with time + hash");
  ok(cacStamp("2026-09-07T20:03:56Z") === "2026.09.07 20:03:56 UTC", "CAC-style timestamp format");
  ok((await countSignatureImages(b2)) === 2 && (await pageCount(b2)) === pages, "block adds no pages, keeps the signatures");
}
console.log(`pdf-stamp: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
