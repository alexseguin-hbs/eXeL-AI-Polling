/**
 * Cloudflare Pages Function — Cross-device session metadata store.
 *
 * GET  /api/sessions?code=<shortCode>  → retrieve session metadata (never the write-key hash)
 * POST /api/sessions                   → create, or update session metadata
 *
 * Uses KV if bound, otherwise falls back to Cache API for shared storage.
 * Enables QR code scanning on different devices in mock mode by syncing
 * the moderator's session metadata to edge storage.
 *
 * HP-11 — WRITE KEY. Anyone could overwrite any live session's title, status or question by
 * short code. Now:
 *   • The FIRST create of a code generates a random write key, stores ONLY its SHA-256 hash,
 *     and returns the key once, in that create response (never on GET, never again).
 *   • A change to title, status, question_text or any other setting requires the key
 *     (header `X-Session-Key`, or body field `write_key`). Without it → 403, nothing written.
 *   • Without the key, the only accepted change is a HIGHER participant_count (joiners on
 *     other devices raise the lobby count), by at most KEYLESS_COUNT_STEP per request; it never
 *     creates a session.
 *   • A record stored before this change has no hash; the next settings write adopts it and
 *     receives a key (such records expire within the 24 h KV TTL).
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Session-Key",
  "Cache-Control": "no-store",
};

// Every stored field a keyless caller may NOT change (participant_count is the one exception).
const PROTECTED_FIELDS = [
  "id", "title", "description", "status", "polling_mode_type", "static_poll_duration_days",
  "ends_at", "timer_display_mode", "anonymity_mode", "theme2_voting_level", "ai_provider",
  "max_response_length", "question_text", "current_cycle",
];

import { overLimit } from "../../edge-rate.js";

// A keyless caller (a joiner on another device) may raise the lobby count by at most this much per request,
// so one POST cannot set it to 10^9 (Pangu, round 2); POSTs per address are budgeted like /api/responses.
export const KEYLESS_COUNT_STEP = 25;
export const SESSION_WRITES_PER_ADDRESS_PER_MIN = 240;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/** What leaves the worker: the stored record minus the write-key hash. */
function publicView(record) {
  if (!record) return record;
  const { write_key_hash: _hidden, ...rest } = record;
  return rest;
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time comparison of two hex strings. */
function sameHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function newWriteKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cacheKey(code) {
  return new Request(`https://cache.internal/sessions/${code}`, { method: "GET" });
}

export async function getSession(store, code) {
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

function buildMetadata(body, code, participantCount) {
  return {
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
    participant_count: participantCount,
    // The round a status belongs to, so a reader can tell a stale earlier-cycle status from a re-opened round.
    current_cycle: Number.isInteger(body.current_cycle) && body.current_cycle > 0 ? body.current_cycle : 1,
    question_text: body.question_text || null,
    updated_at: new Date().toISOString(),
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Use KV if bound (same binding name as responses.js), otherwise fallback to Cache API
  const store = env.RESPONSES || null;
  if (!store) {
    console.warn("[sessions.js] KV binding RESPONSES not found — falling back to Cache API (5min TTL, per-datacenter). Bind KV for reliable cross-device sync.");
  }

  // ── GET /api/sessions?code=<shortCode> ────────────────────────
  if (request.method === "GET") {
    const url = new URL(request.url);
    const code = (url.searchParams.get("code") || "").toUpperCase();
    if (!code) return json({ error: "Missing ?code= param" }, 400);

    const session = await getSession(store, code);
    if (!session) return json({ error: "Session not found" }, 404);
    return json(publicView(session));
  }

  // ── POST /api/sessions ────────────────────────────────────────
  if (request.method === "POST") {
    if (await overLimit(request, "sessions", SESSION_WRITES_PER_ADDRESS_PER_MIN)) {
      return json({ error: "Too many updates from this address — try again in a minute" }, 429);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    if (!body || typeof body !== "object") return json({ error: "Invalid JSON body" }, 400);

    const code = (body.short_code || "").toUpperCase();
    if (!code) return json({ error: "Missing short_code" }, 400);

    let existing = null;
    try {
      existing = await getSession(store, code);
    } catch { /* treat as absent */ }

    const existingCount = existing && typeof existing.participant_count === "number" ? existing.participant_count : 0;
    const incomingCount = typeof body.participant_count === "number" ? body.participant_count : 0;
    const touchesSettings = PROTECTED_FIELDS.some((k) => k in body);

    const presented = request.headers.get("X-Session-Key") || (typeof body.write_key === "string" ? body.write_key : "");
    const keyOk = !!(existing && existing.write_key_hash && presented
      && sameHex(await sha256Hex(presented), existing.write_key_hash));

    // 1 · create (or adopt a pre-key record): a fresh key, stored only as its hash, returned once.
    if (!existing || !existing.write_key_hash) {
      if (!touchesSettings) {
        // A bare count bump never creates a session (nor claims its key).
        if (!existing) return json({ error: "Session not found" }, 404);
      } else {
        const writeKey = newWriteKey();
        const metadata = buildMetadata(body, code, Math.max(existingCount, incomingCount));
        metadata.write_key_hash = await sha256Hex(writeKey);
        await putSession(store, code, metadata);
        return json({ ...publicView(metadata), write_key: writeKey }, 201);
      }
    }

    // 2 · the key holder may change anything (the count still only ever rises).
    if (keyOk) {
      const metadata = buildMetadata(body, code, Math.max(existingCount, incomingCount));
      metadata.write_key_hash = existing.write_key_hash;
      await putSession(store, code, metadata);
      return json(publicView(metadata), 201);
    }

    // 3 · no key: a settings change is refused outright; only a higher participant_count lands.
    const changes = PROTECTED_FIELDS.filter((k) => k in body && (body[k] ?? null) !== (existing[k] ?? null));
    if (changes.length) {
      return json({ error: "This session's write key is required to change its settings", fields: changes }, 403);
    }
    if (incomingCount > existingCount) {
      const raised = Math.min(incomingCount, existingCount + KEYLESS_COUNT_STEP);
      const metadata = { ...existing, participant_count: raised, updated_at: new Date().toISOString() };
      await putSession(store, code, metadata);
      return json(publicView(metadata), 201);
    }
    return json(publicView(existing), 200);
  }

  return json({ error: "Method not allowed" }, 405);
}
