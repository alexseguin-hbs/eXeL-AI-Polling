/**
 * tmp-core.js — a partly-signed PDF handed over by LINK: stored under a random token for 24 hours, fetched by the
 * next signer from /soi-session/sign/?f=<token> (operator 2026-09-08 01:25: "temp file that expires after 24 hours
 * in website; must be able to access unique login under this method" — the token is that unique credential, minted
 * once, unguessable, and gone with the file when the day is up). Storage: a KV namespace bound as SIGN_FILES
 * (RESPONSES is accepted as a fallback binding). Without one: {configured:false} and the page hands the file over by
 * the share sheet instead. Same-origin POST only; 12 MB cap; PDF magic checked; no listing, no overwrite.
 *   POST /api/tmp        body: the PDF bytes; header X-File-Name        → { token, url, expires }
 *   GET  /api/tmp/<token>                                                → the PDF (410 once expired / unknown)
 */
const TTL = 24 * 60 * 60;
const MAX = 12 * 1024 * 1024;
const TOKEN = /^[A-Za-z0-9_-]{22}$/;
const json = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", ...extra } });
const store = (env) => env.SIGN_FILES || env.RESPONSES || null;
const mintToken = () => { const b = new Uint8Array(16); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "").slice(0, 22); };

export async function handleTmp(request, env) {
  const url = new URL(request.url);
  const kv = store(env);
  const m = /^\/api\/tmp\/([A-Za-z0-9_-]+)\/?$/.exec(url.pathname);
  if (request.method === "GET" && m) {
    if (!kv) return json({ configured: false }, 200);
    if (!TOKEN.test(m[1])) return json({ error: "Bad token" }, 400);
    const got = await kv.getWithMetadata(`tmp:${m[1]}`, { type: "arrayBuffer" });
    if (!got || !got.value) return json({ error: "This file link has expired or never existed." }, 410);
    const name = (got.metadata && got.metadata.name) || "document.pdf";
    return new Response(got.value, { status: 200, headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${name.replace(/[^\w.\- ]/g, "_")}"`, "cache-control": "private, no-store", "x-expires": String(got.metadata && got.metadata.expires || "") } });
  }
  if (request.method === "POST" && (url.pathname === "/api/tmp" || url.pathname === "/api/tmp/")) {
    const origin = request.headers.get("Origin");
    if (!origin || origin !== url.origin) return json({ error: "Origin not allowed" }, 403);
    if (!kv) return json({ configured: false }, 200);
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length < 5 || String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") return json({ error: "Not a PDF" }, 400);
    if (bytes.length > MAX) return json({ error: "File over 12 MB" }, 413);
    const name = String(request.headers.get("X-File-Name") || "document.pdf").slice(0, 120);
    const token = mintToken(); const expires = new Date(Date.now() + TTL * 1000).toISOString();
    await kv.put(`tmp:${token}`, bytes, { expirationTtl: TTL, metadata: { name, size: bytes.length, expires } });
    return json({ token, url: `${url.origin}/soi-session/sign/?f=${token}`, expires, name, size: bytes.length }, 200);
  }
  if (request.method === "GET" && (url.pathname === "/api/tmp" || url.pathname === "/api/tmp/")) return json({ configured: !!kv, ttl_hours: 24 }, 200);
  return json({ error: "Method not allowed" }, 405);
}
