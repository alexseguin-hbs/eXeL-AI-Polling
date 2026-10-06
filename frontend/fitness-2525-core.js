/**
 * fitness-2525-core.js — Fitness-2525 Strava + Garmin Connect OAuth & sync.
 *
 * Routes (mirrored after /api/ai in worker.js):
 *   /api/fitness-2525/strava/{connect,callback,status,disconnect,sync,webhook}
 *   /api/fitness-2525/garmin/{connect,callback,status,disconnect,push}
 *
 * Tokens are stored per Auth0 user.sub server-side (never localStorage):
 *   1) KV binding FITNESS_STORE | SIGN_FILES | RESPONSES | SITE_STATE when present
 *   2) else Supabase innovation_state RPCs via SUPABASE_URL + (SERVICE_ROLE or ANON) key
 *
 * Env secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_VERIFY_TOKEN,
 *   GARMIN_CLIENT_ID, GARMIN_CLIENT_SECRET (optional — UI shows pending when unset),
 *   AUTH0_DOMAIN (defaults to public tenant), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY
 */
import { json, kvOf, supabaseCfg } from "./fitness-2525-core/base.js";
import { stravaConfigured, garminConfigured } from "./fitness-2525-core/sync.js";
import { handleStrava } from "./fitness-2525-core/strava.js";
import { handleGarmin } from "./fitness-2525-core/garmin.js";

export async function handleFitness2525(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  // CORS preflight for same-origin SPA (harmless)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": url.origin,
        "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
        "access-control-allow-headers": "authorization,content-type",
        "access-control-max-age": "86400",
      },
    });
  }

  if (path === "/api/fitness-2525" || path === "/api/fitness-2525/") {
    return json({
      ok: true,
      strava: { configured: stravaConfigured(env) },
      garmin: { configured: garminConfigured(env), pending: !garminConfigured(env) },
      storage: kvOf(env) ? "kv" : supabaseCfg(env) ? "supabase" : "none",
    });
  }

  const m = path.match(/^\/api\/fitness-2525\/(strava|garmin)\/([a-z]+)\/?$/);
  if (!m) return json({ error: "Not found" }, 404);
  const provider = m[1];
  const action = m[2];
  try {
    if (provider === "strava") return await handleStrava(request, env, action, url);
    return await handleGarmin(request, env, action, url);
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 502);
  }
}
