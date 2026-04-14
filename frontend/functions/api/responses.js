/**
 * Cloudflare Pages Function — Cross-device response store.
 *
 * GET  /api/responses?session=<shortCode>  → list responses for session
 * POST /api/responses                      → append a response
 *
 * Uses KV if bound, otherwise falls back to Cache API for shared storage.
 * Cache API works across all Cloudflare edge locations within the same zone.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function cacheKey(code) {
  return new Request(`https://cache.internal/responses/${code}`, { method: "GET" });
}

async function getResponses(store, code) {
  if (store) {
    const raw = await store.get(`session:${code}`);
    return raw ? JSON.parse(raw) : [];
  }
  // Fallback: Cache API
  const cache = caches.default;
  const cached = await cache.match(cacheKey(code));
  if (cached) {
    return await cached.json();
  }
  return [];
}

async function putResponses(store, code, items) {
  const data = JSON.stringify(items);
  if (store) {
    await store.put(`session:${code}`, data, { expirationTtl: 86400 });
    return;
  }
  // Fallback: Cache API (5min TTL — per-datacenter, so keep short to limit staleness)
  const cache = caches.default;
  await cache.put(
    cacheKey(code),
    new Response(data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    })
  );
}

export async function onRequest(context) {
  const { request, env } = context;

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Use KV if bound, otherwise null (falls back to Cache API)
  const store = env.RESPONSES || null;

  // ── GET /api/responses?session=<code> ──────────────────────────
  if (request.method === "GET") {
    const url = new URL(request.url);
    const code = (url.searchParams.get("session") || "").toUpperCase();
    if (!code) return json({ error: "Missing ?session= param" }, 400);

    const items = await getResponses(store, code);
    return json({ items, total: items.length });
  }

  // ── POST /api/responses ────────────────────────────────────────
  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const code = (body.short_code || "").toUpperCase();
    const text = (body.text || "").trim();
    if (!code) return json({ error: "Missing short_code" }, 400);
    if (!text) return json({ error: "Missing text" }, 400);

    const entry = {
      id: crypto.randomUUID(),
      session_id: code,
      clean_text: text,
      submitted_at: new Date().toISOString(),
      participant_id: body.participant_id || crypto.randomUUID(),
      language_code: body.language_code || "en",
      summary_333: body.summary_333 || null,
      summary_111: body.summary_111 || null,
      summary_33: body.summary_33 || null,
    };

    const items = await getResponses(store, code);

    // G19 fix: Dedup by participant_id + text hash to prevent replay
    const entryKey = `${entry.participant_id}:${entry.clean_text.slice(0, 50)}`;
    const isDuplicate = items.some(
      (it) => `${it.participant_id}:${(it.clean_text || "").slice(0, 50)}` === entryKey
    );
    if (isDuplicate) {
      return json(entry, 201); // Already stored — return success without re-adding
    }

    items.push(entry);

    // G19 fix: Cap at 500 most recent to prevent unbounded growth
    // Older responses are available via Supabase DB (Channel B/D) — KV is just fast cache
    const MAX_KV_ENTRIES = 500;
    const capped = items.length > MAX_KV_ENTRIES ? items.slice(-MAX_KV_ENTRIES) : items;
    await putResponses(store, code, capped);

    return json(entry, 201);
  }

  return json({ error: "Method not allowed" }, 405);
}
