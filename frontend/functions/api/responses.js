/**
 * Cloudflare Pages Function — Cross-device response store.
 *
 * GET  /api/responses?session=<shortCode>  → list responses for session
 * POST /api/responses                      → append a response
 *
 * Uses KV if bound, otherwise falls back to Cache API for shared storage.
 * Cache API works across all Cloudflare edge locations within the same zone.
 *
 * WRITE GUARD (AsM round 2, Thor 2026-10-07) — the same class HP-11 closed on /api/sessions. Anyone could
 * append rows to ANY session's feed by short code (and ~500 forged rows evicted every real one). Now a POST
 * lands only when:
 *   • /api/sessions holds a KEYED record for that code (a moderator created or transitioned it), and
 *   • that record's status is "polling" — a draft, ranking, closed or unknown code takes no responses;
 *   • the caller is under a per-address write budget (edge-rate.js, per colo; generous enough for the
 *     moderator's own 100-response Spiral Test from one address).
 * Paths A and B (Supabase) are untouched; this route is Trinity Path C, a backup. A participant who could
 * still forge rows inside a live polling session is recorded as HP-30 (a join-issued credential needs the
 * protected Path C client, so it waits on APPROVAL with live verification).
 */
import { getSession } from "./sessions.js";
import { overLimit } from "../../edge-rate.js";

export const RESPONSES_PER_ADDRESS_PER_MIN = 600;

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
    if (!/^[A-Z0-9]{4,16}$/.test(code)) return json({ error: "Bad short_code" }, 400);
    if (await overLimit(request, "responses", RESPONSES_PER_ADDRESS_PER_MIN)) {
      return json({ error: "Too many responses from this address — try again in a minute" }, 429);
    }
    let meta = null;
    try { meta = await getSession(store, code); } catch { meta = null; }
    if (!meta || !meta.write_key_hash) return json({ error: "No live session with that code" }, 404);
    if (meta.status !== "polling") return json({ error: "This session is not taking responses" }, 409);
    if (!text) return json({ error: "Missing text" }, 400);
    // Bounded: one oversized entry used to push the session's single blob past the store's value
    // limit, so every later submission for that session failed.
    const MAX_TEXT = 3333, MAX_SUMMARY = 3333;
    if (text.length > MAX_TEXT) return json({ error: "Response too long" }, 413);
    for (const k of ["summary_333", "summary_111", "summary_33"]) {
      if (body[k] != null && String(body[k]).length > MAX_SUMMARY) return json({ error: "Summary too long" }, 413);
    }

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
