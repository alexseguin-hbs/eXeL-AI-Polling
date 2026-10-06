/**
 * fitness-2525-core.js — Fitness-2525 Strava + Garmin Connect OAuth & sync.
 *
 * Routes (mirrored after /api/ai in worker.js):
 *   /api/fitness-2525/strava/{connect,callback,status,disconnect,sync,webhook}
 *   /api/fitness-2525/garmin/{connect,callback,status,disconnect,push}
 *
 * Provider tokens (per Auth0 user.sub, never localStorage) live ONLY in the dedicated FITNESS_STORE KV binding,
 * AES-256-GCM encrypted with FIT_TOKEN_KEY (tokens.js). No Supabase / shared-KV fallback: unconfigured → OAuth 503.
 * Fit-day records (workouts merged from providers): Supabase innovation_state RPCs — the same rows the browser syncs.
 *
 * Env (secrets unless noted):
 *   AUTH0_CLIENT_ID and/or AUTH0_AUDIENCE — accepted JWT `aud` (required; unset → 503 fail-closed)
 *   AUTH0_DOMAIN (defaults to public tenant) — JWT `iss` must equal https://<domain>/
 *   FIT_OAUTH_STATE_SECRET (≥ 32 chars) — HMAC for OAuth state; unset → connect/callback 503
 *   FIT_TOKEN_KEY (base64 32 bytes) + KV binding FITNESS_STORE — token store; unset → connect/callback 503
 *   STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_VERIFY_TOKEN, STRAVA_SUBSCRIPTION_ID (webhook POST filter)
 *   GARMIN_CLIENT_ID, GARMIN_CLIENT_SECRET (optional — UI shows pending when unset)
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY (fit-day records only)
 */
import { json, supabaseCfg } from "./fitness-2525-core/base.js";
import { acceptedAudiences, stateReady } from "./fitness-2525-core/auth.js";
import { tokenStoreStatus } from "./fitness-2525-core/tokens.js";
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
      storage: supabaseCfg(env) ? "supabase" : "none", // fit-day records
      // readiness booleans only — never secret values
      security: {
        auth_audience: acceptedAudiences(env).length > 0,
        oauth_state_secret: stateReady(env),
        token_store: tokenStoreStatus(env),
        strava_webhook_subscription: !!String(env.STRAVA_SUBSCRIPTION_ID || "").trim(),
      },
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
