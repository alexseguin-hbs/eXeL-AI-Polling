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
