// Fitness-2525 worker core — provider token store (AsM #2 Thor hardening).
// Strava/Garmin tokens + athlete→user maps live ONLY in the dedicated FITNESS_STORE KV binding, AES-256-GCM encrypted
// with FIT_TOKEN_KEY (base64, 32 bytes). There is no Supabase / other-KV fallback: when either is missing, OAuth refuses (503).
import { json, b64url, fromB64url, sha256Hex } from "./base.js";
import { stateReady } from "./auth.js";

export const tokOwner = (sub) => sha256Hex(`fit2525tok:${sub}`);
export const mapOwner = (provider) => sha256Hex(`fit2525map:${provider}`);

const tokenKv = (env) => (env.FITNESS_STORE && typeof env.FITNESS_STORE.get === "function" ? env.FITNESS_STORE : null);

function keyBytes(env) {
  const raw = String(env.FIT_TOKEN_KEY || "").trim().replace(/=+$/, "");
  if (!raw) return null;
  try {
    const b = fromB64url(raw);
    return b.length === 32 ? b : null;
  } catch {
    return null;
  }
}

export function tokenStoreStatus(env) {
  const kv = !!tokenKv(env);
  const key = !!keyBytes(env);
  return { kv, key, ready: kv && key };
}
export const tokenStoreReady = (env) => tokenStoreStatus(env).ready;

/** null when OAuth may proceed; otherwise a 503 JSON naming what the operator must configure. */
export function oauthNotReady(env) {
  const missing = [];
  if (!stateReady(env)) missing.push("FIT_OAUTH_STATE_SECRET (secret, ≥ 32 chars)");
  const t = tokenStoreStatus(env);
  if (!t.kv) missing.push("FITNESS_STORE (dedicated KV binding)");
  if (!t.key) missing.push("FIT_TOKEN_KEY (secret, base64 32 bytes)");
  return missing.length ? json({ error: "Fitness OAuth not configured on the Worker", missing }, 503) : null;
}

async function aesKey(env) {
  const b = keyBytes(env);
  if (!b) throw new Error("FIT_TOKEN_KEY not configured");
  return crypto.subtle.importKey("raw", b, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
const kvKey = (owner, name) => `fittok:${owner}:${name}`;

export async function tokenPut(env, owner, name, payload) {
  const kv = tokenKv(env);
  if (!kv) throw new Error("FITNESS_STORE not configured");
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(`${owner}:${name}`) },
    await aesKey(env),
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  await kv.put(kvKey(owner, name), JSON.stringify({ v: 1, alg: "A256GCM", iv: b64url(iv), ct: b64url(new Uint8Array(ct)) }));
  return true;
}

/** Reads are safe to attempt: unconfigured store or undecryptable record → null. */
export async function tokenGet(env, owner, name) {
  const kv = tokenKv(env);
  if (!kv || !keyBytes(env)) return null;
  const raw = await kv.get(kvKey(owner, name));
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw);
    if (!rec || rec.v !== 1 || !rec.iv || !rec.ct) return null;
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64url(rec.iv), additionalData: new TextEncoder().encode(`${owner}:${name}`) },
      await aesKey(env),
      fromB64url(rec.ct),
    );
    return JSON.parse(new TextDecoder().decode(pt));
  } catch {
    return null;
  }
}

export async function tokenDel(env, owner, name) {
  const kv = tokenKv(env);
  if (!kv) return false;
  await kv.delete(kvKey(owner, name));
  return true;
}
