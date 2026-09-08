// The 24-hour file link (operator 01:25): same-origin PDF in, unguessable token out, the PDF back by token, gone after
// the TTL, nothing without the KV binding. Run: node tests/tmp-core.test.mjs
import { handleTmp } from "../tmp-core.js";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const SITE = "https://exel.test";
const fakeKv = () => { const m = new Map(); return { put: async (k, v, o) => { m.set(k, { v: v instanceof Uint8Array ? v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) : v, meta: o?.metadata, ttl: o?.expirationTtl }); }, getWithMetadata: async (k) => { const e = m.get(k); return e ? { value: e.v, metadata: e.meta } : { value: null, metadata: null }; }, delete: async (k) => m.delete(k), _m: m }; };
const pdf = new TextEncoder().encode("%PDF-1.4 fake body");
const post = (body, origin = SITE, name = "note.pdf") => new Request(SITE + "/api/tmp", { method: "POST", headers: { ...(origin ? { Origin: origin } : {}), "X-File-Name": name, "Content-Type": "application/pdf" }, body });
const J = async (r) => ({ status: r.status, body: await r.json().catch(() => null), headers: r.headers });

let r = await J(await handleTmp(post(pdf), {})); ok(r.status === 200 && r.body.configured === false, "no KV binding → {configured:false}");
const kv = fakeKv();
r = await J(await handleTmp(post(pdf, null), { SIGN_FILES: kv })); ok(r.status === 403, "no Origin → 403");
r = await J(await handleTmp(post(pdf, "https://evil.example"), { SIGN_FILES: kv })); ok(r.status === 403, "cross-origin → 403");
r = await J(await handleTmp(post(new TextEncoder().encode("hello")), { SIGN_FILES: kv })); ok(r.status === 400, "not a PDF → 400");
r = await J(await handleTmp(post(pdf), { SIGN_FILES: kv }));
ok(r.status === 200 && /^[A-Za-z0-9_-]{22}$/.test(r.body.token) && r.body.url === `${SITE}/soi-session/sign/?f=${r.body.token}` && /^\d{4}-/.test(r.body.expires), `stored: 22-char token, ?f= link, expiry (got ${JSON.stringify(r.body)})`);
const entry = kv._m.get(`tmp:${r.body.token}`); ok(entry && entry.ttl === 86400 && entry.meta.name === "note.pdf", "KV entry carries a 24-h TTL and the file name");
const g = await handleTmp(new Request(`${SITE}/api/tmp/${r.body.token}`), { SIGN_FILES: kv });
ok(g.status === 200 && (g.headers.get("content-type") || "").includes("pdf") && /note\.pdf/.test(g.headers.get("content-disposition") || "") && new TextDecoder().decode(await g.arrayBuffer()).startsWith("%PDF-"), "GET by token → the PDF, named");
const gone = await J(await handleTmp(new Request(`${SITE}/api/tmp/AAAAAAAAAAAAAAAAAAAAAA`), { SIGN_FILES: kv })); ok(gone.status === 410, "unknown/expired token → 410");
const bad = await J(await handleTmp(new Request(`${SITE}/api/tmp/short`), { SIGN_FILES: kv })); ok(bad.status === 400, "malformed token → 400");
const st = await J(await handleTmp(new Request(`${SITE}/api/tmp`), { SIGN_FILES: kv })); ok(st.status === 200 && st.body.configured === true && st.body.ttl_hours === 24, "GET /api/tmp → status");
const rb = await J(await handleTmp(post(pdf), { RESPONSES: fakeKv() })); ok(rb.status === 200 && rb.body.token, "the RESPONSES binding is accepted as a fallback store");
// an accented file name travels URL-encoded in the header (fetch refuses non-ISO-8859-1 header values) and is stored decoded
const acc = await J(await handleTmp(post(pdf, SITE, encodeURIComponent("pagaré-firmado.pdf")), { SIGN_FILES: kv }));
ok(acc.status === 200 && acc.body.name === "pagaré-firmado.pdf" && kv._m.get(`tmp:${acc.body.token}`).meta.name === "pagaré-firmado.pdf", `accented name decoded on receipt (got ${acc.body && acc.body.name})`);
const accGet = await handleTmp(new Request(`${SITE}/api/tmp/${acc.body.token}`), { SIGN_FILES: kv });
ok(accGet.status === 200 && /^[\x20-\x7e]*$/.test(accGet.headers.get("content-disposition") || ""), "GET of the accented file: the content-disposition header stays ASCII-safe");
const plain = await J(await handleTmp(post(pdf, SITE, "note 2.pdf"), { SIGN_FILES: kv })); ok(plain.status === 200 && plain.body.name === "note 2.pdf", "a plain name is kept as sent");
console.log(`tmp-core: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
