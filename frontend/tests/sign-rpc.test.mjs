// The Sign Doc RPCs on a REAL Postgres (PGlite, migrations 036 + 037 applied by scripts/local-rpc.mjs) — the Supabase branch of
// sign-store had live proofs only (fleet pass 2, Athena). Run: node tests/sign-rpc.test.mjs
import { rpc } from "../scripts/local-rpc.mjs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const pdf = Buffer.from("%PDF-1.4 tiny " + Date.now()).toString("base64");
const file = { name: "note.pdf", page_count: 1, pdf_base64: pdf, sha256: "ignored" };
const call = async (fn, params) => { const r = await rpc(fn, params); if (r.status === 200 && r.body && r.body.error) return { error: r.body.error }; return r.status === 200 ? { data: r.body } : { error: String(r.body && r.body.message || r.status) }; };
const mint = () => { const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"; let t = ""; for (let i = 0; i < 22; i++) t += a[Math.floor(Math.random() * a.length)]; return t; };   // the app's newToken() shape
const S0 = mint(); const token = mint();
const signers = [{ name: "Alex Seguin", contact: "alex@example.test", secret: S0 }, { name: "Daniel Vail", contact: "512-808-8745", secret: "" }, { name: "Cara Witness", contact: "cara@example.test", secret: "" }];
// create: hashes only reach the table; the creator's own secret opens party 0
let r = await call("sign_envelope_create", { p_token: token, p_title: "Note", p_created_by: "Alex Seguin", p_signers: signers.map((s) => ({ name: s.name, contact: s.contact, secret: s.secret })), p_files: [file], p_expires_at: new Date(Date.now() + 86400e3).toISOString() });
if (r.error) { console.log("create shape:", r.error); }
ok(!r.error, `create answers (${r.error || "ok"})`);
r = await call("sign_envelope_get", { p_token: token, p_secret: S0, p_ip_hash: null, p_user_agent: "t" });
ok(!r.error && r.data.party === 0 && Array.isArray(r.data.files) && r.data.files.length === 1 && r.data.signers[1].contact_masked === "***8745", `the creator reads party 0 with files; contacts masked (${r.error || r.data?.signers?.[1]?.contact_masked})`);
// a stranger: no party, no files; 20 wrong secrets lock the envelope for an hour
r = await call("sign_envelope_get", { p_token: token, p_secret: "nope", p_ip_hash: null, p_user_agent: "t" });
ok(!r.error && r.data.party === -1 && r.data.files === null, "a wrong secret reads the roster only, no files, party -1");
let refused = 0; for (let i = 0; i < 20; i++) { const w = await call("sign_envelope_sign", { p_token: token, p_signer_idx: 0, p_secret: mint(), p_files: [file], p_chain: "" }); if (/bad_secret/.test(w.error || "")) refused++; }
ok(refused >= 19, `every wrong secret is refused as bad_secret and COUNTED — the earlier wrong-secret read counted too (${refused}/20; under 036 the raise rolled the counter back)`);
r = await call("sign_envelope_sign", { p_token: token, p_signer_idx: 0, p_secret: S0, p_files: [file], p_chain: "" });
ok(r.error && /locked/.test(r.error), `20 wrong secrets lock the envelope even for the right one (${r.error})`);
// a fresh envelope with three signers: sign 0 → next_secret + next_contact (Daniel's), sign 1 → next_contact (Cara's), sign 2 → complete + creator_contact
const t2 = mint();
r = await call("sign_envelope_create", { p_token: t2, p_title: "Three", p_created_by: "Alex Seguin", p_signers: signers.map((s) => ({ name: s.name, contact: s.contact, secret: s.secret })), p_files: [file], p_expires_at: new Date(Date.now() + 86400e3).toISOString() });
ok(!r.error, `three-signer envelope created (${r.error || "ok"})`);
r = await call("sign_envelope_sign", { p_token: t2, p_signer_idx: 0, p_secret: S0, p_files: [file], p_chain: "" });
ok(!r.error && r.data.status === "awaiting" && r.data.current_signer_idx === 1 && typeof r.data.next_secret === "string" && r.data.next_contact === "512-808-8745" && r.data.creator_contact === null, `signer 0 signs → baton for 1, next_contact is Daniel's (${r.error || r.data?.next_contact})`);
const s1 = r.data?.next_secret;
r = await call("sign_envelope_sign", { p_token: t2, p_signer_idx: 1, p_secret: s1, p_files: [file], p_chain: r.data?.chain });
ok(!r.error && r.data.current_signer_idx === 2 && r.data.next_contact === "cara@example.test" && r.data.creator_contact === null, `the MIDDLE signer gets the next signer's contact (${r.error || r.data?.next_contact})`);
const s2 = r.data?.next_secret;
r = await call("sign_envelope_sign", { p_token: t2, p_signer_idx: 2, p_secret: s2, p_files: [file], p_chain: r.data?.chain });
ok(!r.error && r.data.status === "complete" && r.data.next_secret === null && r.data.next_contact === null && r.data.creator_contact === "alex@example.test", `the LAST signer completes and gets the creator's contact (${r.error || r.data?.creator_contact})`);
r = await call("sign_envelope_sign", { p_token: t2, p_signer_idx: 2, p_secret: s2, p_files: [file], p_chain: "" });
ok(r.error && /complete/.test(r.error), "a completed envelope refuses another signature");
// the public shape never carries a plaintext contact
r = await call("sign_envelope_get", { p_token: t2, p_secret: S0, p_ip_hash: null, p_user_agent: "t" });
ok(!r.error && !JSON.stringify(r.data.signers).includes("alex@example.test") && !("creator_contact" in r.data), "sign_envelope_get masks every contact and carries no creator_contact");
// duplicate token
r = await call("sign_envelope_create", { p_token: t2, p_title: "Dup", p_created_by: "x", p_signers: [{ name: "a", contact: "a@b.c", secret: mint() }], p_files: [file], p_expires_at: new Date(Date.now() + 86400e3).toISOString() });
ok(r.error && /duplicate|23505|unique/i.test(r.error), `a reused token is refused (${(r.error || "").slice(0, 60)})`);
console.log(`sign-rpc: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
