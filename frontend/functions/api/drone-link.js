/**
 * Cloudflare Pages Function — the crew link for Drone-2525.
 *
 * GET  /api/drone-link?crew=<CODE>   → the last thing each seat said
 * POST /api/drone-link               → this seat says something
 *
 * Modelled on functions/api/responses.js and using the same store: KV when bound, Cache API otherwise.
 * The difference in shape is deliberate. Responses are an APPEND LOG — every one matters and none may be
 * lost. A crew link is LAST-WRITE-WINS PER SEAT: where the aircraft was two seconds ago is not worth
 * delivering, and keeping it would put a stale position on the other person's screen.
 *
 * This endpoint carries a seat's own words about its own controls and nothing else. It is not authoritative:
 * both devices re-check authorship on the way in (lib/drone-2525/link.ts authored()), because an endpoint
 * that can be posted to is an endpoint that will be.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS_HEADERS },
  });
}

const cacheKey = (code) => new Request(`https://cache.internal/drone-link/${code}`, { method: "GET" });

async function getLink(store, code) {
  if (store) {
    const raw = await store.get(`drone:${code}`);
    return raw ? JSON.parse(raw) : {};
  }
  const cached = await caches.default.match(cacheKey(code));
  return cached ? await cached.json() : {};
}

async function putLink(store, code, seats) {
  const data = JSON.stringify(seats);
  if (store) {
    // A crew link is worthless an hour later; a short life keeps a stale code from admitting anybody.
    await store.put(`drone:${code}`, data, { expirationTtl: 3600 });
    return;
  }
  await caches.default.put(
    cacheKey(code),
    new Response(data, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=30" } }),
  );
}

const SEATS = ["pilot", "targeteer"];
const KINDS = ["flight", "gimbal", "hello"];

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  const store = env.RESPONSES || null;

  if (request.method === "GET") {
    const code = (new URL(request.url).searchParams.get("crew") || "").toUpperCase();
    if (!code) return json({ error: "Missing ?crew= param" }, 400);
    const seats = await getLink(store, code);
    return json({ seats });
  }

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

    const code = String(body.crew || "").toUpperCase();
    const msg = body.msg;
    if (!code) return json({ error: "Missing crew" }, 400);
    if (!msg || typeof msg !== "object") return json({ error: "Missing msg" }, 400);
    // Shape only. The seat-authority rule lives in the app and is applied on both devices; this is the
    // cheap refusal that keeps obvious rubbish out of the store.
    if (!SEATS.includes(msg.seat)) return json({ error: "Unknown seat" }, 400);
    if (!KINDS.includes(msg.kind)) return json({ error: "Unknown kind" }, 400);
    if (!Number.isFinite(msg.seq)) return json({ error: "Missing seq" }, 400);

    const seats = await getLink(store, code);
    const prev = seats[msg.seat];
    // Out-of-order arrivals are normal on a lossy path. The newest word from a seat is the only one kept.
    if (!prev || Number(prev.seq) < Number(msg.seq)) seats[msg.seat] = msg;
    await putLink(store, code, seats);
    return json({ seats }, 201);
  }

  return json({ error: "Method not allowed" }, 405);
}
