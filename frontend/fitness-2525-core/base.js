// Fitness-2525 worker core — helpers, storage, Auth0, OAuth state (split from fitness-2525-core.js; < 12KB per module for the GitHub connector)

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
export const stateSecret = (env) =>
  env.FIT_OAUTH_STATE_SECRET || env.STRAVA_CLIENT_SECRET || env.GARMIN_CLIENT_SECRET || env.STRAVA_VERIFY_TOKEN || "fit2525-dev-state";

/** Prefer Fitness KV, then existing Worker KV bindings. */
export const kvOf = (env) => env.FITNESS_STORE || env.SIGN_FILES || env.RESPONSES || env.SITE_STATE || null;

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

export const tokOwner = (sub) => sha256Hex(`fit2525tok:${sub}`);
export const dayOwner = (sub) => sha256Hex(`fit2525:${sub}`);
export const mapOwner = (provider) => sha256Hex(`fit2525map:${provider}`);

export let jwksCache = { at: 0, keys: null };
export async function auth0Jwks(env) {
  const now = Date.now();
  if (jwksCache.keys && now - jwksCache.at < 3600_000) return jwksCache.keys;
  const res = await fetch(`https://${auth0Domain(env)}/.well-known/jwks.json`);
  if (!res.ok) throw new Error(`jwks ${res.status}`);
  const body = await res.json();
  jwksCache = { at: now, keys: body.keys || [] };
  return jwksCache.keys;
}

export function parseJwtParts(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const header = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[1])));
  return { header, payload, signed: `${parts[0]}.${parts[1]}`, sig: parts[2] };
}

export async function importJwk(jwk) {
  return crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
}

export async function verifyAuth0Jwt(env, token) {
  const parts = parseJwtParts(token);
  if (!parts) return null;
  const { header, payload, signed, sig } = parts;
  if (header.alg !== "RS256") return null;
  const domain = auth0Domain(env);
  const issOk = payload.iss === `https://${domain}/` || payload.iss === `https://${domain}`;
  if (!issOk) return null;
  if (payload.exp && payload.exp * 1000 < Date.now() - 30_000) return null;
  const keys = await auth0Jwks(env);
  const jwk = keys.find((k) => k.kid === header.kid) || keys[0];
  if (!jwk) return null;
  const key = await importJwk(jwk);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, fromB64url(sig), new TextEncoder().encode(signed));
  if (!ok) return null;
  if (!payload.sub) return null;
  return { sub: String(payload.sub), name: payload.name || payload.nickname || null, email: payload.email || null };
}

export async function requireUser(request, env) {
  const h = request.headers.get("Authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) return { error: json({ error: "Sign in required" }, 401) };
  try {
    const user = await verifyAuth0Jwt(env, m[1].trim());
    if (!user) return { error: json({ error: "Invalid or expired Auth0 token" }, 401) };
    return { user };
  } catch (e) {
    return { error: json({ error: `Auth verify failed: ${String(e && e.message || e)}` }, 401) };
  }
}

export async function mintState(env, payload) {
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + 15 * 60_000 }));
  const sig = await hmacSign(stateSecret(env), body);
  return `${body}.${sig}`;
}

export async function readState(env, state) {
  const [body, sig] = String(state || "").split(".");
  if (!body || !sig) return null;
  if (!(await hmacOk(stateSecret(env), body, sig))) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (!p || !p.sub || (p.exp && p.exp < Date.now())) return null;
    return p;
  } catch {
    return null;
  }
}

export function pkcePair() {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = b64url(verifierBytes);
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)).then((dig) => ({
    verifier,
    challenge: b64url(new Uint8Array(dig)),
  }));
}
