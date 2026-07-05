/**
 * Cloudflare Pages Function — Atlantis Accords short-link store.
 *
 * The universal link used to carry the ENTIRE sealed payload in the URL
 * #fragment (base64 of ciphertext + cover meta) — often 3–8 KB, far too long
 * to share by text/DM. This endpoint stores that payload server-side under a
 * short 7-char hash and hands back a tiny link: `/seal.html#<hash>`.
 *
 * Zero-knowledge is preserved: only the AES-GCM CIPHERTEXT + public cover meta
 * are stored. The unlock code (4-digit / glyph) is never sent here — it travels
 * out-of-band between sender and recipient — so the host can never read the
 * message. Governments seizing the store get ciphertext without the key.
 *
 * POST /api/seal   body: <sealed payload JSON string>  → { hash }
 * GET  /api/seal?h=<hash>                               → <payload JSON string>
 *
 * Storage: KV (binding SEALS, else reuse RESPONSES) with Cache API fallback.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// 90 days — long enough that a shared link keeps working, short enough that
// abandoned seals don't accumulate forever.
const TTL_SECONDS = 60 * 60 * 24 * 90;

// Unambiguous alphabet (no 0/O/1/I/l) — 7 chars ≈ 3.5e12 combinations.
const HASH_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const HASH_LEN = 7;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function makeHash() {
  const buf = crypto.getRandomValues(new Uint8Array(HASH_LEN));
  let s = "";
  for (let i = 0; i < HASH_LEN; i++) s += HASH_ALPHABET[buf[i] % HASH_ALPHABET.length];
  return s;
}

function cacheKey(hash) {
  return new Request(`https://cache.internal/seal/${hash}`, { method: "GET" });
}

async function readSeal(store, hash) {
  if (store) return await store.get(`seal:${hash}`);
  const cached = await caches.default.match(cacheKey(hash));
  return cached ? await cached.text() : null;
}

async function writeSeal(store, hash, payload) {
  if (store) {
    await store.put(`seal:${hash}`, payload, { expirationTtl: TTL_SECONDS });
    return;
  }
  await caches.default.put(
    cacheKey(hash),
    new Response(payload, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${TTL_SECONDS}`,
      },
    })
  );
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const store = env.SEALS || env.RESPONSES || null;

  // ── GET /api/seal?h=<hash> → payload JSON ──────────────────────
  if (request.method === "GET") {
    const url = new URL(request.url);
    const hash = (url.searchParams.get("h") || "").trim();
    if (!/^[A-Za-z0-9]{4,16}$/.test(hash)) return json({ error: "Bad hash" }, 400);

    const payload = await readSeal(store, hash);
    if (!payload) return json({ error: "Not found or expired" }, 404);

    return new Response(payload, {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  // ── POST /api/seal (body = sealed payload JSON) → { hash } ──────
  if (request.method === "POST") {
    const payload = await request.text();
    if (!payload || payload.length > 512 * 1024) {
      return json({ error: "Empty or oversized payload" }, 400);
    }
    // Must be valid JSON (the sealed package) — reject anything else.
    try {
      JSON.parse(payload);
    } catch {
      return json({ error: "Invalid payload" }, 400);
    }

    // Generate a fresh hash; retry on the (very rare) collision.
    let hash = makeHash();
    for (let tries = 0; tries < 5; tries++) {
      if (!(await readSeal(store, hash))) break;
      hash = makeHash();
    }
    await writeSeal(store, hash, payload);
    return json({ hash }, 201);
  }

  return json({ error: "Method not allowed" }, 405);
}
