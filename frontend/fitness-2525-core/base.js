// Fitness-2525 worker core — helpers + fit-day record store (split from fitness-2525-core.js; < 12KB per module for the GitHub connector).
// Auth0 JWT + OAuth state → auth.js · encrypted token store (KV only) → tokens.js. Tokens NEVER go through this file.

export const json = (o, status = 200, extra = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });

export const STRAVA_AUTH = "https://www.strava.com/oauth/authorize";
export const STRAVA_TOKEN = "https://www.strava.com/oauth/token";
export const STRAVA_API = "https://www.strava.com/api/v3";
export const STRAVA_SCOPE = "read,activity:read_all";
export const GARMIN_AUTH = "https://connect.garmin.com/oauth2Confirm";
export const GARMIN_TOKEN = "https://diauth.garmin.com/di-oauth2-service/oauth/token";
export const GARMIN_USER = "https://apis.garmin.com/wellness-api/rest/user/id";

export const b64url = (buf) => {
  const bytes = buf instanceof Uint8Array ? buf : new TextEncoder().encode(String(buf));
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
export const fromB64url = (s) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
export const sha256Hex = async (text) => {
  const dig = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(dig)).map((b) => b.toString(16).padStart(2, "0")).join("");
};
export const hmacKey = async (secret) =>
  crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
export const hmacSign = async (secret, msg) => {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(msg));
  return b64url(new Uint8Array(sig));
};
export const hmacOk = async (secret, msg, sig) => {
  try {
    const expect = await hmacSign(secret, msg);
    return expect === sig;
  } catch {
    return false;
  }
};

export const auth0Domain = (env) => String(env.AUTH0_DOMAIN || "exel-ai-polling.us.auth0.com").replace(/^https?:\/\//, "").replace(/\/$/, "");

/** fit-day records (NOT tokens): the dedicated Fitness KV only — never another feature's KV (SITE_STATE is the pause switch). */
export const kvOf = (env) => (env.FITNESS_STORE && typeof env.FITNESS_STORE.get === "function" ? env.FITNESS_STORE : null);

export const supabaseCfg = (env) => {
  const url = String(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return url && key ? { url, key } : null;
};

export async function rpcPut(env, owner, name, payload) {
  const kv = kvOf(env);
  if (kv) {
    await kv.put(`fit:${owner}:${name}`, JSON.stringify(payload));
    return true;
  }
  const sb = supabaseCfg(env);
  if (!sb) return false;
  const res = await fetch(`${sb.url}/rest/v1/rpc/innovation_state_put`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: sb.key, authorization: `Bearer ${sb.key}` },
    body: JSON.stringify({ p_owner: owner, p_name: name, p_payload: payload }),
  });
  if (!res.ok) throw new Error(`supabase put ${res.status}`);
  return true;
}

export async function rpcGet(env, owner, name) {
  const kv = kvOf(env);
  if (kv) {
    const raw = await kv.get(`fit:${owner}:${name}`);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  const sb = supabaseCfg(env);
  if (!sb) return null;
  const res = await fetch(`${sb.url}/rest/v1/rpc/innovation_state_get`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: sb.key, authorization: `Bearer ${sb.key}` },
    body: JSON.stringify({ p_owner: owner, p_name: name }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data ?? null;
}

export async function rpcDel(env, owner, name) {
  const kv = kvOf(env);
  if (kv) {
    await kv.delete(`fit:${owner}:${name}`);
    return true;
  }
  const sb = supabaseCfg(env);
  if (!sb) return false;
  await fetch(`${sb.url}/rest/v1/rpc/innovation_state_del`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: sb.key, authorization: `Bearer ${sb.key}` },
    body: JSON.stringify({ p_owner: owner, p_name: name }),
  });
  return true;
}

/** fit-day owner key (same hash the browser uses for its cloud day records). */
export const dayOwner = (sub) => sha256Hex(`fit2525:${sub}`);
