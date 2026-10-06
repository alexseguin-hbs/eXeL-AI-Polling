// Fitness-2525 · AsM item 2 (Thor, Risk & Security): Auth0 JWT aud/exp/iss/kid enforcement, no dev OAuth-state secret,
// provider tokens only in the FITNESS_STORE KV (AES-GCM, no Supabase fallback), Strava webhook subscription filter + deauth.
// Run (from frontend/): node tests/fitness-2525-security.test.mjs
import { generateKeyPairSync, createSign, createHmac, randomBytes } from "node:crypto";
import { handleFitness2525 } from "../fitness-2525-core.js";
import { verifyAuth0Jwt, resetJwksCache } from "../fitness-2525-core/auth.js";
import { tokenGet, tokenPut, tokOwner, mapOwner } from "../fitness-2525-core/tokens.js";

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log("FAIL:", msg); } };

const DOMAIN = "exel-ai-polling.us.auth0.com";
const CLIENT = "H8wuT6P2nfm87bvbRjaegoOliLyhPw4K";
const kp = () => generateKeyPairSync("rsa", { modulusLength: 2048 });
const K1 = kp(), K2 = kp(), EVIL = kp();
const jwkOf = (k, kid) => ({ ...k.publicKey.export({ format: "jwk" }), kid, alg: "RS256", use: "sig" });
const b64u = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const now = () => Math.floor(Date.now() / 1000);
function mint(claims = {}, { kid = "k1", key = K1, alg = "RS256", drop = [] } = {}) {
  const header = { alg, typ: "JWT" };
  if (kid) header.kid = kid;
  const payload = { iss: `https://${DOMAIN}/`, sub: "auth0|tester", aud: CLIENT, iat: now(), exp: now() + 3600, name: "Tester", ...claims };
  for (const d of drop) delete payload[d];
  const signed = `${b64u(header)}.${b64u(payload)}`;
  const s = createSign("RSA-SHA256"); s.update(signed);
  return `${signed}.${s.sign(key.privateKey).toString("base64url")}`;
}

// ── mocked network ───────────────────────────────────────────────────────────
let jwksKeys = [jwkOf(K1, "k1")];
let jwksFetches = 0;
const fetchLog = [];
globalThis.fetch = async (input, init = {}) => {
  const u = String(input && input.url || input);
  fetchLog.push(u);
  if (u.includes("/.well-known/jwks.json")) { jwksFetches++; return new Response(JSON.stringify({ keys: jwksKeys })); }
  if (u === "https://www.strava.com/oauth/token") {
    return new Response(JSON.stringify({ access_token: "ACCESS-SECRET-1", refresh_token: "REFRESH-SECRET-1", expires_at: now() + 21600,
      scope: "read,activity:read_all", athlete: { id: 777, firstname: "Ann", lastname: "Runner" } }));
  }
  if (u.startsWith("https://www.strava.com/api/v3/activities/")) {
    return new Response(JSON.stringify({ id: 1, type: "Run", sport_type: "Run", start_date_local: "2026-10-05T07:00:00Z", moving_time: 1800, distance: 5000, calories: 300, name: "AM run" }));
  }
  if (u.startsWith("https://www.strava.com/oauth/deauthorize")) return new Response("{}");
  return new Response(JSON.stringify({ unexpected: u }), { status: 500 });
};
const kv = () => {
  const m = new Map();
  return { m, get: async (k) => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); } };
};
const KEY = randomBytes(32).toString("base64");
const STATE = randomBytes(32).toString("base64url");
const full = (extra = {}) => ({
  AUTH0_CLIENT_ID: CLIENT, FIT_OAUTH_STATE_SECRET: STATE, FIT_TOKEN_KEY: KEY, FITNESS_STORE: kv(),
  STRAVA_CLIENT_ID: "123", STRAVA_CLIENT_SECRET: "strava-secret", STRAVA_VERIFY_TOKEN: "vt", STRAVA_SUBSCRIPTION_ID: "4242",
  SUPABASE_URL: "https://sb.example", SUPABASE_ANON_KEY: "anon", ...extra,
});
const call = async (env, path, { method = "GET", token, body } = {}) => {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await handleFitness2525(new Request(`https://fit.example${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env);
  const text = await res.text();
  let j = null; try { j = JSON.parse(text); } catch { /* redirect */ }
  return { status: res.status, j, text, loc: res.headers.get("location") };
};
const reason = async (env, tok) => (await verifyAuth0Jwt(env, tok)).error || "ok";
const E = { AUTH0_CLIENT_ID: CLIENT };

// ── 1. JWT: aud ──────────────────────────────────────────────────────────────
resetJwksCache();
ok(await reason(E, mint()) === "ok", "valid ID token (aud = client id) accepted");
ok(await reason({}, mint()) === "audience_unconfigured", "no AUTH0_CLIENT_ID/AUTH0_AUDIENCE → fail closed");
ok((await call({}, "/api/fitness-2525/strava/status", { token: mint() })).status === 503, "status with no audience configured → 503");
ok((await call({}, "/api/fitness-2525/strava/status")).status === 401, "no Authorization header → 401 sign-in (unchanged)");
ok(await reason(E, mint({}, { drop: ["aud"] })) === "bad_aud", "aud missing → rejected");
ok(await reason(E, mint({ aud: "someone-else" })) === "bad_aud", "aud wrong → rejected");
ok(await reason(E, mint({ aud: ["https://other/api", CLIENT] })) === "ok", "aud array containing client id → accepted");
ok(await reason({ AUTH0_AUDIENCE: "https://api.fit" }, mint({ aud: ["https://api.fit", `https://${DOMAIN}/userinfo`] })) === "ok", "access token aud = AUTH0_AUDIENCE → accepted");
ok(await reason({ AUTH0_AUDIENCE: "https://api.fit" }, mint()) === "bad_aud", "only AUTH0_AUDIENCE set → client-id token rejected");
const st401 = await call(E, "/api/fitness-2525/strava/status", { token: mint({ aud: "nope" }) });
ok(st401.status === 401 && st401.j.reason === "bad_aud", "status with wrong aud → 401 bad_aud");

// ── 2. JWT: exp / nbf / iss / alg / signature ────────────────────────────────
ok(await reason(E, mint({}, { drop: ["exp"] })) === "no_exp", "exp missing → rejected");
ok(await reason(E, mint({ exp: now() - 120 })) === "expired", "expired 2 min ago → rejected");
ok(await reason(E, mint({ exp: now() - 30 })) === "ok", "expired 30 s ago → within 60 s skew, accepted");
ok(await reason(E, mint({ exp: "9999999999" })) === "no_exp", "non-numeric exp → rejected");
ok(await reason(E, mint({ nbf: now() + 600 })) === "not_yet_valid", "nbf 10 min in future → rejected");
ok(await reason(E, mint({ iss: "https://evil.auth0.com/" })) === "bad_iss", "wrong iss → rejected");
ok(await reason(E, mint({ iss: `https://${DOMAIN}` })) === "bad_iss", "iss without trailing slash → rejected (exact match)");
ok(await reason(E, mint({}, { key: EVIL })) === "bad_signature", "signed by an unknown private key → rejected");
ok(await reason(E, mint({}, { alg: "HS256" })) === "bad_header", "alg HS256 → rejected");
ok(await reason(E, mint({}, { kid: null })) === "bad_header", "kid missing → rejected");
ok(await reason(E, mint({}, { drop: ["sub"] })) === "no_sub", "sub missing → rejected");
ok(await reason(E, "not.a.jwt") === "malformed" && await reason(E, "") === "malformed", "malformed token → rejected");

// ── 3. JWT: unknown kid (no keys[0] fallback, ONE refetch, rate-limited) ─────
resetJwksCache(); jwksFetches = 0;
ok(await reason(E, mint()) === "ok" && jwksFetches === 1, "first verify fetches JWKS once");
ok(await reason(E, mint({}, { kid: "zz" })) === "unknown_kid", "unknown kid signed with keys[0]'s key → rejected (no keys[0] fallback)");
ok(jwksFetches === 1, "unknown kid within 60 s of a fetch → no refetch storm");
const realNow = Date.now;
Date.now = () => realNow() + 61_000;
ok(await reason(E, mint({}, { kid: "zz" })) === "unknown_kid" && jwksFetches === 2, "unknown kid after 60 s → exactly one refetch, still rejected");
Date.now = () => realNow() + 125_000;
jwksKeys = [jwkOf(K1, "k1"), jwkOf(K2, "k2")];
ok(await reason(E, mint({}, { kid: "k2", key: K2 })) === "ok" && jwksFetches === 3, "rotated key k2 → one refetch finds it → accepted");
ok(await reason(E, mint({}, { kid: "k2", key: K2 })) === "ok" && jwksFetches === 3, "k2 now cached → no further fetch");
Date.now = realNow;
resetJwksCache();

const T = mint();

// ── 4. OAuth state secret: no dev fallback ───────────────────────────────────
for (const [label, extra] of [["unset", { FIT_OAUTH_STATE_SECRET: undefined }], ["too short", { FIT_OAUTH_STATE_SECRET: "short-secret" }]]) {
  const env = full(extra);
  const c = await call(env, "/api/fitness-2525/strava/connect", { token: T });
  ok(c.status === 503 && c.j.missing.some((s) => s.startsWith("FIT_OAUTH_STATE_SECRET")), `state secret ${label} → strava connect 503 naming FIT_OAUTH_STATE_SECRET`);
  const cb = await call(env, "/api/fitness-2525/strava/callback?code=x&state=y");
  ok(cb.status === 503 && cb.j && cb.j.error, `state secret ${label} → strava callback 503 JSON`);
  const g = await call({ ...env, GARMIN_CLIENT_ID: "g", GARMIN_CLIENT_SECRET: "h" }, "/api/fitness-2525/garmin/connect", { token: T });
  ok(g.status === 503, `state secret ${label} → garmin connect 503`);
}
{
  // a state forged with the old literal dev secret must not be accepted once a real secret is set
  const env = full();
  const body = b64u({ sub: "auth0|victim", provider: "strava", exp: Date.now() + 600_000 });
  const forged = `${body}.${createHmac("sha256", "fit2525-dev-state").update(body).digest("base64url")}`;
  fetchLog.length = 0;
  const cb = await call(env, `/api/fitness-2525/strava/callback?code=abc&state=${forged}`);
  ok(cb.status === 302 && /strava=error/.test(cb.loc) && !fetchLog.some((u) => u.includes("strava.com/oauth/token")), "state signed with 'fit2525-dev-state' → rejected, no token exchange");
  ok(env.FITNESS_STORE.m.size === 0, "forged state → nothing stored");
}

// ── 5. Token store: KV + AES key required, no Supabase fallback ─────────────
for (const [label, extra, name] of [
  ["no FITNESS_STORE", { FITNESS_STORE: undefined }, "FITNESS_STORE"],
  ["no FIT_TOKEN_KEY", { FIT_TOKEN_KEY: undefined }, "FIT_TOKEN_KEY"],
  ["16-byte FIT_TOKEN_KEY", { FIT_TOKEN_KEY: randomBytes(16).toString("base64") }, "FIT_TOKEN_KEY"],
  ["legacy shared KV only", { FITNESS_STORE: undefined, SIGN_FILES: kv(), SITE_STATE: kv() }, "FITNESS_STORE"],
]) {
  const env = full(extra);
  fetchLog.length = 0;
  const c = await call(env, "/api/fitness-2525/strava/connect", { token: T });
  ok(c.status === 503 && c.j.missing.some((s) => s.startsWith(name)), `${label} → connect 503 naming ${name}`);
  const cb = await call(env, "/api/fitness-2525/strava/callback?code=x&state=y");
  ok(cb.status === 503, `${label} → callback 503`);
  ok(!fetchLog.some((u) => u.includes("sb.example")), `${label} → no Supabase call (no fallback)`);
  if (extra.SIGN_FILES) ok(extra.SIGN_FILES.m.size === 0 && extra.SITE_STATE.m.size === 0, "legacy shared KVs never written");
  const s = await call(env, "/api/fitness-2525/strava/status", { token: T });
  ok(s.status === 200 && s.j.connected === false && s.j.tokens === "unconfigured", `${label} → status 200 disconnected, tokens unconfigured`);
}
ok((await call(full({ STRAVA_CLIENT_ID: undefined }), "/api/fitness-2525/strava/connect", { token: T })).j.configured === false, "Strava app unset → still the 200 configured:false (UI unchanged)");

// ── 6. Full encrypted flow: connect → callback → status → webhook → deauth ───
const env = full();
const store = env.FITNESS_STORE.m;
const conn = await call(env, "/api/fitness-2525/strava/connect", { token: T });
ok(conn.status === 200 && conn.j.configured && /state=/.test(conn.j.url), "fully configured → connect returns Strava authorize URL");
const state = new URL(conn.j.url).searchParams.get("state");
fetchLog.length = 0;
const cb = await call(env, `/api/fitness-2525/strava/callback?code=good&state=${encodeURIComponent(state)}`);
ok(cb.status === 302 && /strava=connected/.test(cb.loc), "callback → connected");
ok(!fetchLog.some((u) => u.includes("sb.example")), "callback never touches Supabase for tokens");
const dump = [...store.entries()].map(([k, v]) => `${k}=${v}`).join("\n");
ok(store.size === 2 && [...store.keys()].every((k) => k.startsWith("fittok:")), `exactly token + athlete map in KV (got ${store.size})`);
ok(!/ACCESS-SECRET|REFRESH-SECRET|auth0\|tester|Ann Runner/.test(dump), "KV holds no plaintext token, sub or athlete name");
ok([...store.values()].every((v) => { const r = JSON.parse(v); return r.v === 1 && r.alg === "A256GCM" && r.iv && r.ct; }), "records are {v,alg,iv,ct} envelopes");
const owner = await tokOwner("auth0|tester");
const rec = await tokenGet(env, owner, "strava");
ok(rec && rec.refresh_token === "REFRESH-SECRET-1" && rec.athlete_id === 777, "decrypt round-trip returns the tokens");
ok(await tokenGet({ ...env, FIT_TOKEN_KEY: randomBytes(32).toString("base64") }, owner, "strava") === null, "wrong FIT_TOKEN_KEY → cannot decrypt");
{
  const mo = await mapOwner("strava");
  const tokRaw = store.get(`fittok:${owner}:strava`);
  const e2 = { ...env, FITNESS_STORE: kv() };
  await e2.FITNESS_STORE.put(`fittok:${mo}:athlete-777`, tokRaw);
  ok(await tokenGet(e2, mo, "athlete-777") === null, "ciphertext moved to another key fails (AAD bound to key name)");
  let threw = false; try { await tokenPut({ FIT_TOKEN_KEY: KEY }, owner, "strava", {}); } catch { threw = true; }
  ok(threw, "tokenPut with no FITNESS_STORE throws (never writes elsewhere)");
}
const st = await call(env, "/api/fitness-2525/strava/status", { token: T });
ok(st.j.connected === true && st.j.name === "Ann Runner" && st.j.tokens === "kv-encrypted" && !/SECRET/.test(st.text), "status: connected, tokens kv-encrypted, no token in response");

// webhook
const wh = (e, body) => call(e, "/api/fitness-2525/strava/webhook", { method: "POST", body });
const before = dump;
ok((await wh(full({ STRAVA_SUBSCRIPTION_ID: undefined, FITNESS_STORE: env.FITNESS_STORE }), { subscription_id: 4242, object_type: "athlete", owner_id: 777, updates: { authorized: "false" } })).status === 503, "webhook with no STRAVA_SUBSCRIPTION_ID → 503");
ok((await wh(env, { subscription_id: 9999, object_type: "athlete", owner_id: 777, updates: { authorized: "false" } })).status === 403, "webhook wrong subscription_id → 403");
ok((await wh(env, { object_type: "athlete", owner_id: 777, updates: { authorized: "false" } })).status === 403, "webhook missing subscription_id → 403");
ok([...store.entries()].map(([k, v]) => `${k}=${v}`).join("\n") === before, "rejected webhooks change nothing");
ok((await call(env, "/api/fitness-2525/strava/webhook?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=abc")).j["hub.challenge"] === "abc", "GET subscription handshake still works");
const act = await wh(env, { subscription_id: 4242, object_type: "activity", aspect_type: "create", object_id: 1, owner_id: 777 });
ok(act.status === 200 && fetchLog.some((u) => u.endsWith("/activities/1")), "valid activity event → fetched with stored token");
ok([...store.keys()].some((k) => k.startsWith("fit:")), "activity merged into a fit-day record");
const de = await wh(env, { subscription_id: "4242", object_type: "athlete", aspect_type: "update", object_id: 777, owner_id: 777, updates: { authorized: "false" } });
ok(de.status === 200 && de.j.deauthorized === true, "athlete deauthorization → 200 deauthorized");
ok(![...store.keys()].some((k) => k.startsWith("fittok:")), "deauth deleted the athlete's tokens + athlete map");
ok((await call(env, "/api/fitness-2525/strava/status", { token: T })).j.connected === false, "after deauth → status disconnected");

// disconnect also removes encrypted records
{
  const e = full();
  const c = await call(e, "/api/fitness-2525/strava/connect", { token: T });
  await call(e, `/api/fitness-2525/strava/callback?code=good&state=${encodeURIComponent(new URL(c.j.url).searchParams.get("state"))}`);
  ok(e.FITNESS_STORE.m.size === 2, "reconnect stores 2 encrypted records");
  const d = await call(e, "/api/fitness-2525/strava/disconnect", { method: "POST", token: T });
  ok(d.j.ok && e.FITNESS_STORE.m.size === 0, "disconnect deletes token + map");
}

// ── 7. Index reports readiness booleans only ─────────────────────────────────
const idx = await call(full(), "/api/fitness-2525");
ok(idx.status === 200 && idx.j.security.auth_audience && idx.j.security.oauth_state_secret && idx.j.security.token_store.ready && idx.j.security.strava_webhook_subscription, "index: all security readiness true when configured");
ok(!idx.text.includes(KEY) && !idx.text.includes(STATE) && !idx.text.includes("strava-secret"), "index never echoes secret values");
const idx0 = await call({}, "/api/fitness-2525");
ok(idx0.status === 200 && idx0.j.security.auth_audience === false && idx0.j.security.token_store.ready === false && idx0.j.storage === "none", "index (bare env): readiness false, storage none");
ok((await call({ SIGN_FILES: kv(), SITE_STATE: kv() }, "/api/fitness-2525")).j.storage === "none", "shared SIGN_FILES/SITE_STATE KVs no longer used as Fitness storage");

console.log(`fitness-2525-security: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
