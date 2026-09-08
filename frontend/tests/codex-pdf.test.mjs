// Light Codex ⇄ PDF (operator 23:15): the signatory strips are embedded as raw pixels and read back from the
// PDF — per-row strips and the ALL strip decode to their texts, reverse-verified; a fresh PDF carries none.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/codex-pdf.test.mjs
import fs from "fs";
import zlib from "zlib";
import { codexText, codexAllText, codexImage, extractCodexStrips, decodeCodexPdf } from "../lib/codex-pdf.ts";
import { stampCodexBlock, codexRows } from "../lib/pdf-stamp.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const inflate = (b) => new Uint8Array(zlib.inflateSync(b));
const pdf = new Uint8Array(fs.readFileSync(new URL("./fixtures/sign-sample.pdf", import.meta.url)));

ok((await decodeCodexPdf(pdf, inflate)).length === 0, "an unsigned PDF carries no SoICodex strip");
const rows = [{ rowIndex: 0, name: "Alex Seguin", isoDate: "2026-09-07T23:02:01.892Z", hash: "91d05b18" }, { rowIndex: 1, name: "Daniel Vail", isoDate: "2026-09-07T23:02:09.590Z", hash: "8ed387cc" }];
ok(codexText(rows[0].name, rows[0].isoDate) === "ALEX SEGUIN 20260907230201", `codexText → ALEX SEGUIN 20260907230201 (got ${codexText(rows[0].name, rows[0].isoDate)})`);
ok(codexAllText(rows) === "ALEX SEGUIN 20260907230201 . DANIEL VAIL 20260907230209", "the ALL text joins every signatory with ' . '");
// pass 1 (Alex only), then pass 2 redraws both rows + the ALL strip — as sign-flow does
let p1 = await stampCodexBlock(pdf, { total: 2, rows: [{ ...rows[0], codex: codexImage(codexText(rows[0].name, rows[0].isoDate)) }], all: codexImage(codexAllText([rows[0]])) });
const withCodex = rows.map((r) => ({ ...r, codex: codexImage(codexText(r.name, r.isoDate)) }));
const p2 = await stampCodexBlock(p1, { total: 2, rows: withCodex, all: codexImage(codexAllText(rows)) });
const strips = await extractCodexStrips(p2, inflate);
ok(strips.length === 6 && [1, 2].every((pg) => ["SoICodexRow0", "SoICodexRow1", "SoICodexAll"].every((n) => strips.some((s) => s.page === pg && s.name === n))), `row0, row1 and ALL on EVERY page (2 pages × 3) — operator 23:25 (got ${strips.map((s) => s.page + ":" + s.name).join(",")})`);
const dec = await decodeCodexPdf(p2, inflate);
ok(dec.every((d) => d.result?.verified), "every strip on every page decodes, reverse-verified");
const byName = Object.fromEntries(dec.filter((d) => d.page === 1).map((d) => [d.name, d.result]));
ok(byName.SoICodexRow0?.messageForward === "ALEX SEGUIN 20260907230201" && byName.SoICodexRow0.verified, `row 0 decodes, reverse-verified (got ${byName.SoICodexRow0?.messageForward})`);
ok(byName.SoICodexRow1?.messageForward === "DANIEL VAIL 20260907230209" && byName.SoICodexRow1.verified, `row 1 decodes, reverse-verified (got ${byName.SoICodexRow1?.messageForward})`);
ok(byName.SoICodexAll?.messageForward === "ALEX SEGUIN 20260907230201 . DANIEL VAIL 20260907230209" && byName.SoICodexAll.verified, `the ALL strip carries every signatory (got ${byName.SoICodexAll?.messageForward})`);
ok(dec.every((d) => d.result?.style === "Single Helix" && d.result.blockSize === 2), `every strip is a 2×2 SINGLE Helix — one line (got ${[...new Set(dec.map((d) => d.result?.style))].join(",")})`);
ok(strips.every((s) => s.image.height === 2), "each strip image is exactly one 2-px line tall");
const kw = await codexRows(p2); ok(kw.length === 2, "the two signatory rows are still recorded as keywords");
// initials, always bottom-right of EACH page (operator 2026-09-08)
const { initialsOf } = await import("../lib/pdf-stamp.ts");
ok(initialsOf("Alex Seguin") === "AS" && initialsOf("daniel lucas vail") === "DLV" && initialsOf("Ada-Marie O'Neil Ruiz Q") === "AOR" && initialsOf("  ") === "", "initialsOf: first letters, letters only, at most three");
const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
const FONTS = new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url).pathname;
const doc2 = await getDocument({ data: p2.slice(), useWorkerFetch: false, isEvalSupported: false, standardFontDataUrl: FONTS, verbosity: 0 }).promise;
let initPages = 0; for (let i = 1; i <= doc2.numPages; i++) { const t = (await (await doc2.getPage(i)).getTextContent()).items.map((x) => x.str).join(" "); if (/AS\s+DV/.test(t)) initPages++; }
ok(initPages === doc2.numPages && doc2.numPages === 2, `initials "AS   DV" on every page (${initPages}/${doc2.numPages})`);
const { PDFDocument: PD } = await import("pdf-lib"); ok(((await PD.load(p2)).getKeywords() ?? "").includes("SoIInit:AS+DV"), "initials recorded once as a keyword (SoIInit:AS+DV)");
console.log(`codex-pdf: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
