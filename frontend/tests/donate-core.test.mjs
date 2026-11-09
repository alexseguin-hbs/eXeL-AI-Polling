// Stripe donate edge core — headless: unconfigured → demo, bounds, same-origin redirects, cross-origin refused,
// client idempotency key reaches Stripe, Stripe's own error surfaces. Run:
//   node tests/donate-core.test.mjs
import { handleDonate } from "../donate-core.js";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const SITE = "https://exel-ai-polling.explore-096.workers.dev";
const req = (body, { origin, method = "POST" } = {}) => new Request(SITE + "/api/donate", { method, headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: method === "POST" ? JSON.stringify(body) : undefined });
const J = async (r) => ({ status: r.status, body: await r.json().catch(() => null), h: Object.fromEntries(r.headers) });

// unconfigured → honest demo state, 200 (a browser POST carries its Origin)
let r = await J(await handleDonate(req({ amount_cents: 333 }, { origin: SITE }), {}));
ok(r.status === 200 && r.body.configured === false, "no key → {configured:false}");
r = await J(await handleDonate(req({ amount_cents: 333 }), { STRIPE_SECRET_KEY: "sk_test_x" }));
ok(r.status === 403, "a POST without an Origin (curl) may not mint sessions");
// options preflight from own origin
const pre = await handleDonate(req({}, { origin: SITE, method: "OPTIONS" }), { STRIPE_SECRET_KEY: "sk_test_x" });
ok(pre.status === 204 && pre.headers.get("Access-Control-Allow-Origin") === SITE, "preflight from own origin allowed");
// cross-origin refused outright
r = await J(await handleDonate(req({ amount_cents: 333 }, { origin: "https://evil.example" }), { STRIPE_SECRET_KEY: "sk_test_x" }));
ok(r.status === 403, "cross-origin POST → 403");
// preview origin allow-list
r = await J(await handleDonate(req({}, { origin: "https://preview.example", method: "OPTIONS" }), { STRIPE_SECRET_KEY: "sk_test_x", DONATE_ALLOWED_ORIGINS: "https://preview.example" }));
ok(r.status === 204, "DONATE_ALLOWED_ORIGINS admits a preview origin");
// bounds
r = await J(await handleDonate(req({ amount_cents: 10 }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" })); ok(r.status === 400 && /Minimum/.test(r.body.error), "below $0.50 → 400");
r = await J(await handleDonate(req({ amount_cents: 1_000_000 }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" })); ok(r.status === 400 && /Maximum/.test(r.body.error), "above $9,999 → 400");
// redirect URLs must be on this site
r = await J(await handleDonate(req({ amount_cents: 333, success_url: "https://evil.example/thanks" }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" }));
ok(r.status === 400 && /this site/.test(r.body.error), "off-site success_url → 400");
// t192u/t193u LEDGER FIRST: the edge never calls Stripe to create a Checkout — it asks the API, which writes the
// pending payment_transactions row before returning the Checkout URL.
const API = "https://exel-ai-polling-api.explore-096.workers.dev/api/v1/payments/divinity-donate";
const calls = [];
const apiOk = async (url, init) => { calls.push({ url, init, body: JSON.parse(init.body) }); return new Response(JSON.stringify({ checkout_url: "https://checkout.stripe.com/c/pay/cs_test_123", checkout_id: "cs_test_123" }), { status: 200, headers: { "Content-Type": "application/json" } }); };
globalThis.fetch = apiOk;
r = await J(await handleDonate(req({ amount_cents: 333, client_key: "abcDEF123_-abcDEF123_-", success_url: SITE + "/divinity-guide?donated=true", cancel_url: SITE + "/divinity-guide" }, { origin: SITE }), { STRIPE_RESTRICTED_KEY: "rk_test_x" }));
ok(r.status === 200 && r.body.url.startsWith("https://checkout.stripe.com/") && r.body.ledger === true, "configured → API ledger Checkout URL");
ok(calls[0].url === API, "calls the API ledger route, never api.stripe.com");
ok(!JSON.stringify(calls[0].init.headers).includes("rk_test_x"), "the Stripe key never leaves the edge");
ok(calls[0].body.amount_cents === 333 && calls[0].body.client_key === "abcDEF123_-abcDEF123_-" && calls[0].body.success_url === SITE + "/divinity-guide?donated=true&cs={CHECKOUT_SESSION_ID}", "body carries amount, client key, success_url (+ session id)");
ok(r.h["access-control-allow-origin"] === SITE, "response CORS echoes own origin only");
r = await J(await handleDonate(req({ amount_cents: 333, client_key: "x" }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" }));
ok(r.status === 200 && /^[0-9a-f-]{36}$/.test(calls[1].body.client_key), "bad client key → generated UUID");
// API down → refuse (503), never a direct Stripe Checkout the ledger cannot see
globalThis.fetch = async () => new Response("upstream", { status: 501 });
r = await J(await handleDonate(req({ amount_cents: 333 }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" }));
ok(r.status === 503 && /nothing was charged/.test(r.body.error), "API unavailable → 503, nothing charged");
globalThis.fetch = async () => { throw new Error("network"); };
r = await J(await handleDonate(req({ amount_cents: 333 }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" }));
ok(r.status === 503, "API unreachable → 503");
globalThis.fetch = async () => new Response(JSON.stringify({ detail: "Redirect URLs must return to this site" }), { status: 400, headers: { "Content-Type": "application/json" } });
r = await J(await handleDonate(req({ amount_cents: 333 }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" }));
ok(r.status === 400 && /this site/.test(r.body.error), "API 400 detail surfaces");
console.log(`donate-core: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);

// ── verified return (Odin, wave 2) ─────────────────────────────────────────────────
const { handleDonateVerify } = await import("../donate-core.js");
const vreq = (qs, origin = SITE, method = "GET") => new Request(SITE + "/api/donate/verify" + qs, { method, headers: origin ? { Origin: origin } : {} });
{
  let pass2 = 0, fail2 = 0; const ok2 = (c, m) => { if (c) pass2++; else { fail2++; console.log("FAIL:", m); } };
  let r = await J(await handleDonateVerify(vreq("?cs=cs_test_abcdefghijkl"), {}));
  ok2(r.status === 200 && r.body.configured === false, "verify: no key → {configured:false}");
  r = await J(await handleDonateVerify(vreq("?cs=evil"), { STRIPE_SECRET_KEY: "sk_test_x" }));
  ok2(r.status === 400, "verify: malformed session id → 400");
  globalThis.fetch = async (url) => new Response(JSON.stringify({ id: "cs_test_abcdefghijkl", payment_status: "paid", amount_total: 333, currency: "usd", metadata: { transaction_type: "donation" } }), { status: 200, headers: { "Content-Type": "application/json" } });
  r = await J(await handleDonateVerify(vreq("?cs=cs_test_abcdefghijkl"), { STRIPE_SECRET_KEY: "sk_test_x" }));
  ok2(r.status === 200 && r.body.paid === true && r.body.amount_cents === 333 && r.body.donation === true, "verify: paid session → paid:true with amount");
  globalThis.fetch = async () => new Response(JSON.stringify({ id: "cs_test_unpaid000001", payment_status: "unpaid", amount_total: 333, currency: "usd" }), { status: 200, headers: { "Content-Type": "application/json" } });
  r = await J(await handleDonateVerify(vreq("?cs=cs_test_unpaid000001"), { STRIPE_SECRET_KEY: "sk_test_x" }));
  ok2(r.status === 200 && r.body.paid === false && r.body.amount_cents === 0, "verify: unpaid session → paid:false");
  let stripeCalls = 0; globalThis.fetch = async () => { stripeCalls++; return new Response("{}", { status: 500 }); };
  r = await J(await handleDonateVerify(vreq("?cs=cs_test_abcdefghijkl"), { STRIPE_SECRET_KEY: "sk_test_x" }));
  ok2(r.status === 200 && r.body.paid === true && stripeCalls === 0, "verify: a verified session is served from cache (no Stripe call)");
  r = await J(await handleDonateVerify(vreq("?cs=cs_test_abcdefghijkl", "https://evil.example"), { STRIPE_SECRET_KEY: "sk_test_x" }));
  ok2(r.status === 403, "verify: cross-origin → 403");
  console.log(`donate-verify: ${pass2} passed, ${fail2} failed`); if (fail2) process.exit(1);
}
// purpose + poll scope pass through to the API (which owns products, metadata and the ladder)
{
  let p4 = 0, f4 = 0; const ok4 = (c, m) => { if (c) p4++; else { f4++; console.log("FAIL:", m); } };
  const seen = []; globalThis.fetch = async (url, init) => { seen.push(JSON.parse(init.body)); return new Response(JSON.stringify({ checkout_url: "https://checkout.stripe.com/c/pay/cs_test_y" }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  const SID = "8a0b2c4d-1e2f-4a5b-8c9d-0e1f2a3b4c5d", PID = "1b2c3d4e-5f60-4a7b-9c8d-7e6f5a4b3c2d";
  await handleDonate(req({ amount_cents: 999, session_id: SID, participant_id: PID, purpose: "derisking_strategies" }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_live_x" });
  ok4(seen[0].session_id === SID && seen[0].participant_id === PID && seen[0].purpose === "derisking_strategies", "poll + participant + purpose forwarded");
  await handleDonate(req({ amount_cents: 333, session_id: "not-a-uuid'; drop", participant_id: PID }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" });
  ok4(!seen[1].session_id && !seen[1].participant_id, "malformed poll id → unscoped (and no participant)");
  await handleDonate(req({ amount_cents: 333, purpose: "__proto__" }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" });
  ok4(seen[2].purpose === "community", "unknown purpose falls back to community");
  await handleDonate(req({ amount_cents: 333, label: "x".repeat(250) }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" });
  ok4(seen[3].label.length === 120, "label clamped to the API's 120 chars");
  console.log(`donate-scope: ${p4} passed, ${f4} failed`); if (f4) process.exit(1);
}
