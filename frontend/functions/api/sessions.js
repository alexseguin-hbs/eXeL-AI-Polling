/**
 * Cloudflare Pages Function — Cross-device session metadata store.
 *
 * GET  /api/sessions?code=<shortCode>  → retrieve session metadata
 * POST /api/sessions                   → store/update session metadata
 *
 * Uses KV if bound, otherwise falls back to Cache API for shared storage.
 * Enables QR code scanning on different devices in mock mode by syncing
 * the moderator's session metadata to edge storage.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function cacheKey(code) {
  return new Request(`https://cache.internal/sessions/${code}`, { method: "GET" });
}

async function getSession(store, code) {
  if (store) {
    const raw = await store.get(`session-meta:${code}`);
    return raw ? JSON.parse(raw) : null;
  }
  // Fallback: Cache API
  const cache = caches.default;
  const cached = await cache.match(cacheKey(code));
  if (cached) {
    return await cached.json();
  }
  return null;
}

async function putSession(store, code, data) {
  const payload = JSON.stringify(data);
  if (store) {
    await store.put(`session-meta:${code}`, payload, { expirationTtl: 86400 });
    return;
  }
  // Fallback: Cache API (24h TTL)
  const cache = caches.default;
  await cache.put(
    cacheKey(code),
    new Response(payload, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
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

  // Use KV if bound (same binding name as responses.js), otherwise null
  const store = env.RESPONSES || null;

  // ── GET /api/sessions?code=<shortCode> ────────────────────────
  if (request.method === "GET") {
    const url = new URL(request.url);
    const code = (url.searchParams.get("code") || "").toUpperCase();
    if (!code) return json({ error: "Missing ?code= param" }, 400);

    const session = await getSession(store, code);
    if (!session) return json({ error: "Session not found" }, 404);
    return json(session);
  }

  // ── POST /api/sessions ────────────────────────────────────────
  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const code = (body.short_code || "").toUpperCase();
    if (!code) return json({ error: "Missing short_code" }, 400);

    // Merge participant_count: take max of existing and incoming to handle concurrent joins
    let existingCount = 0;
    try {
      const existing = await getSession(store, code);
      if (existing && typeof existing.participant_count === "number") {
        existingCount = existing.participant_count;
      }
    } catch { /* ignore */ }

    const incomingCount = typeof body.participant_count === "number" ? body.participant_count : 0;

    // Store session metadata keyed by short_code
    const metadata = {
      id: body.id || null,
      short_code: code,
      title: body.title || null,
      description: body.description || null,
      status: body.status || "draft",
      polling_mode_type: body.polling_mode_type || "live_interactive",
      static_poll_duration_days: body.static_poll_duration_days || null,
      ends_at: body.ends_at || null,
      timer_display_mode: body.timer_display_mode || "flex",
      anonymity_mode: body.anonymity_mode || "identified",
      theme2_voting_level: body.theme2_voting_level || "theme2_9",
      ai_provider: body.ai_provider || "openai",
      max_response_length: body.max_response_length || 3333,
      participant_count: Math.max(existingCount, incomingCount),
      question_text: body.question_text || null,
      updated_at: new Date().toISOString(),
    };

    await putSession(store, code, metadata);
    return json(metadata, 201);
  }

  return json({ error: "Method not allowed" }, 405);
}
