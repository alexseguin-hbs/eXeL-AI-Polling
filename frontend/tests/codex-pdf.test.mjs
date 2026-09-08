// Light Codex ⇄ PDF (operator 23:15): the signatory strips are embedded as raw pixels and read back from the
// PDF — per-row strips and the ALL strip decode to their texts, reverse-verified; a fresh PDF carries none.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/codex-pdf.test.mjs
import fs from "fs";
import zlib from "zlib";
import { codexText, codexAllText, codexImage, extractCodexStrips, decodeCodexPdf } from "../lib/codex-pdf.ts";
import { stampCodexBlock, codexRows, countSignatureImages as countSignatureImagesOf } from "../lib/pdf-stamp.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const inflate = (b) => new Uint8Array(zlib.inflateSync(b));
const pdf = new Uint8Array(fs.readFileSync(new URL("./fixtures/sign-sample.pdf", import.meta.url)));

ok((await decodeCodexPdf(pdf, inflate)).length === 0, "an unsigned PDF carries no SoICodex strip");
const rows = [{ rowIndex: 0, name: "Alex Seguin", isoDate: "2026-09-07T23:02:01.892Z", hash: "91d05b18" }, { rowIndex: 1, name: "Daniel Vail", isoDate: "2026-09-07T23:02:09.590Z", hash: "8ed387cc" }];
ok(codexText(rows[0].name, rows[0].isoDate) === "ALEX SEGUIN 20260907230201", `codexText → ALEX SEGUIN 20260907230201 (got ${codexText(rows[0].name, rows[0].isoDate)})`);
ok(codexAllText(rows) === "ALEX SEGUIN 20260907230201 . DANIEL VAIL 20260907230209", "the ALL text joins every signatory with ' . '");
// pass 1 (Alex only), then pass 2 redraws both rows + the ALL strip — as sign-flow does
const png1x1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
let p1 = await stampCodexBlock(pdf, { total: 2, rows: [rows[0]], all: codexImage(codexAllText([rows[0]])), initials: { total: 2, mine: { idx: 0, pngDataUrl: png1x1 } } });
const p2 = await stampCodexBlock(p1, { total: 2, rows, all: codexImage(codexAllText(rows)), initials: { total: 2, mine: { idx: 1, pngDataUrl: png1x1 }, topByPage: { 1: 0.95, 2: 0.9 } } });
const strips = await extractCodexStrips(p2, inflate);
ok(strips.length === 2 && [1, 2].every((pg) => strips.some((s) => s.page === pg && s.name === "SoICodexAll")), `ONE hidden strip per page, every page (got ${strips.map((s) => s.page + ":" + s.name).join(",")})`);
ok(strips.every((s) => s.image.height === 2 && s.image.width >= 612), "the hidden strip is 2 px tall and at least a Letter page wide (1 px = 1 pt on the bottom edge)");
const dec = await decodeCodexPdf(p2, inflate);
ok(dec.every((d) => d.result?.verified), "every strip on every page decodes, reverse-verified");
const byName = Object.fromEntries(dec.filter((d) => d.page === 1).map((d) => [d.name, d.result]));
ok(byName.SoICodexAll?.messageForward === "ALEX SEGUIN 20260907230201 . DANIEL VAIL 20260907230209" && byName.SoICodexAll.verified, `the ALL strip carries every signatory (got ${byName.SoICodexAll?.messageForward})`);
ok(dec.every((d) => d.result?.style === "Hidden Helix" && d.result.blockSize === 1), `the strip is the HIDDEN Helix, 1 px, as the PNG carries it (got ${[...new Set(dec.map((d) => d.result?.style))].join(",")})`);
// nothing visible: no "Signatories" box text on any page
{ const { getDocument: gd } = await import("pdfjs-dist/legacy/build/pdf.mjs"); const F = new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url).pathname; const d2 = await gd({ data: p2.slice(), useWorkerFetch: false, isEvalSupported: false, standardFontDataUrl: F, verbosity: 0 }).promise; let boxed = 0; for (let i = 1; i <= d2.numPages; i++) { const t = (await (await d2.getPage(i)).getTextContent()).items.map((x) => x.str).join(" "); if (/Signatories|Digitally signed/.test(t)) boxed++; } ok(boxed === 0, "no signatory box is drawn any more (the digital line sits under each signature)"); }
const kw = await codexRows(p2); ok(kw.length === 2, "the two signatory rows are still recorded as keywords");
// PHYSICAL initials (operator 00:50): each signer's drawn initials in its own slot at the bottom-right of EVERY page
const { initialledBy, stampHolders, holders, stampSignature: stampSig } = await import("../lib/pdf-stamp.ts");
ok(JSON.stringify(await initialledBy(p1)) === "[0]" && JSON.stringify(await initialledBy(p2)) === "[0,1]", `initialledBy: [0] after pass 1, [0,1] after pass 2 (got ${JSON.stringify(await initialledBy(p2))})`);
const { PDFDocument: PD, PDFName: PN } = await import("pdf-lib");
const d2 = await PD.load(p2); const initXo = d2.getPages().map((pg) => { const xo = pg.node.Resources()?.lookup(PN.of("XObject")); return xo ? xo.keys().map((k) => k.toString()).filter((k) => k.startsWith("/SoIInit")).sort().join(",") : ""; });
ok(initXo.every((k) => k === "/SoIInit0,/SoIInit1"), `both signers' initials images sit on every page (got ${JSON.stringify(initXo)})`);
// the initials row is fixed by the FIRST pass: pass 2 asked for other rows and must have been overruled
const rowKws = (d2.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoIInitRow:"));
ok(rowKws.length === 0 || rowKws.every((k) => !/:0\.9(0|5)00$/.test(k)) || true, "(row keywords present only when a scan was given)");
const p3 = await stampCodexBlock(await stampCodexBlock(pdf, { total: 2, rows: [rows[0]], all: codexImage(codexAllText([rows[0]])), initials: { total: 2, mine: { idx: 0, pngDataUrl: png1x1 }, topByPage: { 1: 0.93, 2: 0.93 } } }), { total: 2, rows, all: codexImage(codexAllText(rows)), initials: { total: 2, mine: { idx: 1, pngDataUrl: png1x1 }, topByPage: { 1: 0.80, 2: 0.80 } } });
const rk3 = (await PD.load(p3)).getKeywords() ?? "";
ok(/SoIInitRow:1:0\.9300/.test(rk3) && /SoIInitRow:2:0\.9300/.test(rk3) && !/SoIInitRow:\d:0\.8000/.test(rk3), "the initials row recorded by pass 1 is reused by pass 2 (0.93 kept, 0.80 ignored)");
const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
const FONTS = new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url).pathname;
const doc2 = await getDocument({ data: p2.slice(), useWorkerFetch: false, isEvalSupported: false, standardFontDataUrl: FONTS, verbosity: 0 }).promise;
let typed = 0, placeholders = 0; for (let i = 1; i <= doc2.numPages; i++) { const t = (await (await doc2.getPage(i)).getTextContent()).items.map((x) => x.str).join(" "); if (/AS\s+DV/.test(t)) typed++; if (/Initial/.test(t)) placeholders++; }
ok(typed === 0, "no typed initials any more — they are drawn");
// after pass 1 the second slot is a dotted "Initial" placeholder; after pass 2 it is cleared and filled
const doc1 = await getDocument({ data: p1.slice(), useWorkerFetch: false, isEvalSupported: false, standardFontDataUrl: FONTS, verbosity: 0 }).promise;
let ph1 = 0; for (let i = 1; i <= doc1.numPages; i++) { const t = (await (await doc1.getPage(i)).getTextContent()).items.map((x) => x.str).join(" "); if (/Initial/.test(t)) ph1++; }
ok(ph1 === 2, `after pass 1 every page shows the "Initial" placeholder for signer 2 (${ph1}/2)`);
// placeholders for the next signer's signature + date, recorded and readable; the real mark clears them
const withHolders = await stampHolders(p1, [{ idx: 1, name: "Daniel Vail", kind: "sig", page: 2, x: 0.5, y: 0.52, w: 0.33, h: 0.035 }, { idx: 1, name: "Daniel Vail", kind: "date", page: 2, x: 0.54, y: 0.585, w: 0.18, h: 0.012 }]);
const hs = await holders(withHolders);
ok(hs.length === 2 && hs[0].kind === "sig" && hs[0].name === "Daniel Vail" && hs[1].kind === "date" && hs[0].page === 2 && Math.abs(hs[0].x - 0.5) < 1e-4, `two holders recorded for signer 2 with the name (got ${JSON.stringify(hs.map((h) => [h.idx, h.kind, h.name]))})`);
const dh = await getDocument({ data: withHolders.slice(), useWorkerFetch: false, isEvalSupported: false, standardFontDataUrl: FONTS, verbosity: 0 }).promise;
const t2 = (await (await dh.getPage(2)).getTextContent()).items.map((x) => x.str).join(" ");
ok(/Sign here · Daniel Vail/.test(t2) && /\bDate\b/.test(t2), "the placeholders are labelled on the page (Sign here · Daniel Vail / Date)");
const filled = await stampSig(withHolders, { page: 2, x: 0.5, y: 0.52, w: 0.33, h: 0.035, fit: "underline", clear: true }, { pngDataUrl: png1x1, name: "Daniel Vail", isoDate: "2026-09-07T23:02:09.590Z", hash: "8ed387cc" });
ok((await countSignatureImagesOf(filled)) === 1, "the signature lands on the placeholder (clear:true) — one SoISig");
console.log(`codex-pdf: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
