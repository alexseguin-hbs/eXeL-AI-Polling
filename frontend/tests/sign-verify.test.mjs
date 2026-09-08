// Offline verify — from the file alone (Pangu, wave 3). A two-pass envelope reads green; a tampered
// row (a later pass whose timestamp row does not carry the chain it signed over) reads red; an
// unsigned file says so. Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sign-verify.test.mjs
import fs from "fs";
import { stampSignature, stampCodexBlock } from "../lib/pdf-stamp.ts";
import { verifySignedPdf } from "../lib/sign-verify.ts";
import { sha256Hex, shortHash, chainHash } from "../lib/sign-envelope.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const pdf = new Uint8Array(fs.readFileSync(new URL("./fixtures/sign-sample.pdf", import.meta.url)));
const token = "AAAAAAAAAAAAAAAAAAAAAA";

const r0 = await verifySignedPdf("sample.pdf", pdf);
ok(!r0.ok && r0.images === 0 && r0.issues.includes("no_signatures"), "unsigned file: no signatures, not ok");

// pass 1 (signer 0) over the genesis, pass 2 (signer 1) over the chain after pass 1 — as sign-flow does it
const sha0 = await sha256Hex(pdf);
let p1 = await stampSignature(pdf, { page: 1, x: 0.1, y: 0.7, w: 0.4, h: 0.08 }, { pngDataUrl: png, name: "Alex", isoDate: "2026-09-07T20:00:00.000Z", hash: shortHash(sha0), envelope: { token, chain: "" } });
p1 = await stampCodexBlock(p1, { total: 2, rows: [{ rowIndex: 0, name: "Alex", isoDate: "2026-09-07T20:00:00.000Z", hash: shortHash(sha0) }] });
const chain1 = await chainHash("", [await sha256Hex(p1)]);
let p2 = await stampSignature(p1, { page: 1, x: 0.5, y: 0.7, w: 0.4, h: 0.08 }, { pngDataUrl: png, name: "Dan", isoDate: "2026-09-07T20:05:00.000Z", hash: shortHash(chain1), envelope: { token, chain: chain1 } });
p2 = await stampCodexBlock(p2, { total: 2, rows: [{ rowIndex: 0, name: "Alex", isoDate: "2026-09-07T20:00:00.000Z", hash: shortHash(sha0) }, { rowIndex: 1, name: "Dan", isoDate: "2026-09-07T20:05:00.000Z", hash: shortHash(chain1) }] });
const r2 = await verifySignedPdf("sample-signed.pdf", p2);
ok(r2.ok && r2.images === 2 && r2.boxes === 2 && r2.passes.length === 2 && r2.rows.length === 2, `two-pass envelope reads green (${JSON.stringify(r2.issues)})`);
ok(r2.chain === await chainHash(chain1, [await sha256Hex(p2)]), "closing chain = chainHash(chain before pass 2, [final sha]) — what the receipt shows for a one-file envelope");
ok(r2.passes.every((p) => p.token === token), "both passes carry the envelope token");
ok(r2.rows.map((r) => r.name).join(",") === "Alex,Dan" && r2.initials === 0 && r2.holders === 0, `the report names each row and counts initials + placeholders (got ${JSON.stringify([r2.rows.map((r) => r.name), r2.initials, r2.holders])})`);
{
  const { stampCodexBlock: scb, stampHolders } = await import("../lib/pdf-stamp.ts");
  const withInit = await scb(p2, { total: 2, rows: r2.rows, initials: { total: 2, mine: { idx: 0, pngDataUrl: png } } });
  const withHold = await stampHolders(withInit, [{ idx: 1, name: "Dan", kind: "sig", page: 1, x: 0.5, y: 0.5, w: 0.3, h: 0.04 }]);
  const ri = await verifySignedPdf("init.pdf", withHold);
  ok(ri.initials === 1 && ri.holders === 1 && ri.ok, `initials 1 / holders 1 after one signer initials and a placeholder is set (got ${ri.initials}/${ri.holders}, ${JSON.stringify(ri.issues)})`);
}

// pages inheriting ONE shared /Resources dict (from the Pages node) see the same SoISig image: counted once, by reference
{
  const { PDFDocument, PDFName } = await import("pdf-lib");
  const d = await PDFDocument.create(); const pa = d.addPage([612, 792]); const pb = d.addPage([612, 792]);
  const resRef = d.context.register(d.context.obj({}));
  d.catalog.Pages().set(PDFName.of("Resources"), resRef); pa.node.delete(PDFName.of("Resources")); pb.node.delete(PDFName.of("Resources"));
  const shared = await d.save({ useObjectStreams: false });
  const shaS = await sha256Hex(shared);
  let q = await stampSignature(shared, { page: 1, x: 0.1, y: 0.7, w: 0.4, h: 0.08 }, { pngDataUrl: png, name: "Alex", isoDate: "2026-09-07T20:00:00.000Z", hash: shortHash(shaS), envelope: { token, chain: "" } });
  q = await stampCodexBlock(q, { total: 1, rows: [{ rowIndex: 0, name: "Alex", isoDate: "2026-09-07T20:00:00.000Z", hash: shortHash(shaS) }] });
  const dq = await PDFDocument.load(q);
  const perPage = dq.getPages().map((p) => { const xo = p.node.Resources()?.lookup(PDFName.of("XObject")); return xo ? xo.keys().map((k) => k.toString()).filter((k) => k.startsWith("/SoISig")).join(",") : ""; });
  ok(perPage[0] === "/SoISig1" && perPage[1] === "/SoISig1", `both pages resolve the one SoISig through the shared /Resources (got ${JSON.stringify(perPage)})`);
  const rq = await verifySignedPdf("shared.pdf", q);
  ok(rq.images === 1 && rq.boxes === 1 && rq.ok, `one signature counted once across the two pages — verify ok (images ${rq.images}, ${JSON.stringify(rq.issues)})`);
}

// tamper: pass 2's row claims a different chain than the pass it was signed in
let bad = await stampSignature(p1, { page: 1, x: 0.5, y: 0.7, w: 0.4, h: 0.08 }, { pngDataUrl: png, name: "Dan", isoDate: "2026-09-07T20:05:00.000Z", hash: "00000000", envelope: { token, chain: chain1 } });
bad = await stampCodexBlock(bad, { total: 2, rows: [{ rowIndex: 0, name: "Alex", isoDate: "2026-09-07T20:00:00.000Z", hash: shortHash(sha0) }, { rowIndex: 1, name: "Dan", isoDate: "2026-09-07T20:05:00.000Z", hash: "00000000" }] });
const rb = await verifySignedPdf("bad.pdf", bad);
ok(!rb.ok && rb.issues.includes("row_1_chain"), `a row that does not carry its pass's chain reads red (${JSON.stringify(rb.issues)})`);

// a signature image without its timestamp row: the accounts disagree
const p3 = await stampSignature(p2, { page: 1, x: 0.3, y: 0.5, w: 0.3, h: 0.06 }, { pngDataUrl: png, name: "X", isoDate: "2026-09-07T20:09:00.000Z", hash: "abcdef01", envelope: { token, chain: "zz" } });
const r3 = await verifySignedPdf("extra.pdf", p3);
ok(!r3.ok && r3.issues.includes("rows_vs_signatures"), "a third stamp with no signatory row reads red");

console.log(`sign-verify: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
