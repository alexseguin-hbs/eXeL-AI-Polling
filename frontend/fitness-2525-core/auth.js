// Fitness-2525 worker core — Auth0 RS256 JWT verification + signed OAuth state (AsM #2 Thor hardening).
// Fail closed: no configured audience → 503; no exp / expired / wrong iss / wrong aud / unknown kid → 401.
import { json, b64url, fromB64url, hmacSign, hmacOk, auth0Domain } from "./base.js";

export const CLOCK_SKEW_S = 60;
const JWKS_TTL_MS = 3600_000;
const JWKS_REFETCH_MIN_MS = 60_000; // an unknown kid refetches the JWKS at most once a minute

/** Audiences this Worker accepts: the API audience (access tokens) and/or the SPA client id (ID tokens). */
export function acceptedAudiences(env) {
  return [env.AUTH0_AUDIENCE, env.AUTH0_CLIENT_ID].map((v) => String(v || "").trim()).filter(Boolean);
}

let jwksCache = { at: 0, keys: null };
export function resetJwksCache() { jwksCache = { at: 0, keys: null }; }

async function fetchJwks(env) {
  const res = await fetch(`https://${auth0Domain(env)}/.well-known/jwks.json`);
  if (!res.ok) throw new Error(`jwks ${res.status}`);
  const body = await res.json();
  jwksCache = { at: Date.now(), keys: Array.isArray(body.keys) ? body.keys : [] };
  return jwksCache.keys;
}

/** Exact kid match only — never keys[0]. An unknown kid triggers ONE refetch (key rotation), rate-limited. */
async function jwkForKid(env, kid) {
  const now = Date.now();
  const fresh = jwksCache.keys && now - jwksCache.at < JWKS_TTL_MS;
  if (fresh) {
    const hit = jwksCache.keys.find((k) => k.kid === kid);
    if (hit) return hit;
    if (now - jwksCache.at < JWKS_REFETCH_MIN_MS) return null;
  }
  const keys = await fetchJwks(env);
  return keys.find((k) => k.kid === kid) || null;
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

/** Returns { user } or { error: reason }. */
export async function verifyAuth0Jwt(env, token) {
  const auds = acceptedAudiences(env);
  if (!auds.length) return { error: "audience_unconfigured" };
  let parts = null;
  try { parts = parseJwtParts(token); } catch { parts = null; }
  if (!parts) return { error: "malformed" };
  const { header, payload, signed, sig } = parts;
  if (header.alg !== "RS256" || !header.kid) return { error: "bad_header" };
  if (payload.iss !== `https://${auth0Domain(env)}/`) return { error: "bad_iss" };
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return { error: "no_exp" };
  if (payload.exp + CLOCK_SKEW_S < now) return { error: "expired" };
  if (typeof payload.nbf === "number" && payload.nbf - CLOCK_SKEW_S > now) return { error: "not_yet_valid" };
  const tokAud = Array.isArray(payload.aud) ? payload.aud.map(String) : payload.aud != null ? [String(payload.aud)] : [];
  if (!tokAud.some((a) => auds.includes(a))) return { error: "bad_aud" };
  const jwk = await jwkForKid(env, header.kid);
  if (!jwk || jwk.kty !== "RSA") return { error: "unknown_kid" };
  const key = await importJwk(jwk);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, fromB64url(sig), new TextEncoder().encode(signed));
  if (!ok) return { error: "bad_signature" };
  if (!payload.sub) return { error: "no_sub" };
  return { user: { sub: String(payload.sub), name: payload.name || payload.nickname || null, email: payload.email || null } };
}

export async function requireUser(request, env) {
  const h = request.headers.get("Authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) return { error: json({ error: "Sign in required" }, 401) };
  if (!acceptedAudiences(env).length) {
    // fail closed: without a configured audience no token is accepted
    return { error: json({ error: "Auth not configured on the Worker: set AUTH0_CLIENT_ID and/or AUTH0_AUDIENCE", message: "Server sign-in verification not configured yet" }, 503) };
  }
  try {
    const r = await verifyAuth0Jwt(env, m[1].trim());
    if (!r.user) return { error: json({ error: "Invalid or expired Auth0 token", reason: r.error }, 401) };
    return { user: r.user };
  } catch (e) {
    return { error: json({ error: `Auth verify failed: ${String(e && e.message || e)}` }, 401) };
  }
}

// ── OAuth state: HMAC with FIT_OAUTH_STATE_SECRET only (no fallback, ≥ 32 chars) ─────────────
export const STATE_SECRET_MIN = 32;
export function stateReady(env) {
  return String(env.FIT_OAUTH_STATE_SECRET || "").length >= STATE_SECRET_MIN;
}
function stateSecret(env) {
  if (!stateReady(env)) throw new Error("FIT_OAUTH_STATE_SECRET not configured");
  return String(env.FIT_OAUTH_STATE_SECRET);
}

export async function mintState(env, payload) {
  const body = b64url(JSON.stringify({ ...payload, exp: Date.now() + 15 * 60_000 }));
  const sig = await hmacSign(stateSecret(env), body);
  return `${body}.${sig}`;
}

export async function readState(env, state) {
  if (!stateReady(env)) return null;
  const [body, sig] = String(state || "").split(".");
  if (!body || !sig) return null;
  if (!(await hmacOk(stateSecret(env), body, sig))) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (!p || !p.sub || !p.exp || p.exp < Date.now()) return null;
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
