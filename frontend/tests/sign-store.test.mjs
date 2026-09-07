// sign-store — the contract the file's header states: without Supabase, a multi-signer envelope is a
// hard, visible failure (no link is ever minted from a device-local store); one signer may stay local.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sign-store.test.mjs
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
Object.defineProperty(globalThis, "navigator", { value: { userAgent: "node-test" }, configurable: true });
const { createEnvelope, getEnvelope, signEnvelope, storeMode, SignStoreError } = await import("../lib/sign-store.ts");
const { newEnvelope, applySignature } = await import("../lib/sign-envelope.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const file = { name: "n.pdf", page_count: 1, pdf_base64: "JVBERi0=", sha256: "aa", version: 0 };
ok(storeMode() === "local", "no NEXT_PUBLIC_SUPABASE_* → local mode");
const two = newEnvelope({ title: "T", created_by: "a@x.com", signers: [{ name: "A", contact: "a@x.com" }, { name: "B", contact: "5551234" }], files: [file] });
let code = ""; try { await createEnvelope(two); } catch (e) { code = e instanceof SignStoreError ? e.code : "other"; }
ok(code === "no_backend", "multi-signer envelope without Supabase → SignStoreError(no_backend)");
ok(!store.has(`exel-sign:${two.token}`), "nothing was written locally for the refused envelope");
const one = newEnvelope({ title: "Solo", created_by: "a@x.com", signers: [{ name: "A", contact: "a@x.com" }], files: [file] });
const r = await createEnvelope(one); ok(r.mode === "local" && r.token === one.token, "single-signer envelope stays local");
const got = await getEnvelope(one.token, one.signers[0].secret); ok(got.party === 0 && got.files?.length === 1 && got.signers[0].me, "party read returns files");
const stranger = await getEnvelope(one.token, "nope"); ok(stranger.party === -1 && stranger.files === null, "stranger read returns no files");
const next = applySignature(one, 0, one.signers[0].secret, "2026-09-07T00:00:00Z", [{ ...file, sha256: "ab" }], "c1");
const signed = await signEnvelope(one.token, 0, one.signers[0].secret, next.files, "c1", next);
ok(signed.status === "complete" && signed.files?.[0].version === 1 && signed.next_secret === null, "local sign completes a one-signer envelope");
let nf = ""; try { await getEnvelope("missing", ""); } catch (e) { nf = e.code; } ok(nf === "not_found", "unknown token → not_found");
console.log(`sign-store: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
