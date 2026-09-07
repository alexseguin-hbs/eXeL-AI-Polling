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
// happy path: Stripe mocked; idempotency key = client key; form carries amount + donate
const calls = [];
globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_123" }), { status: 200, headers: { "Content-Type": "application/json" } }); };
r = await J(await handleDonate(req({ amount_cents: 333, client_key: "abcDEF123_-abcDEF123_-", success_url: SITE + "/divinity-guide?donated=true", cancel_url: SITE + "/divinity-guide" }, { origin: SITE }), { STRIPE_RESTRICTED_KEY: "rk_test_x" }));
ok(r.status === 200 && r.body.url.startsWith("https://checkout.stripe.com/"), "configured → Stripe Checkout URL");
ok(calls[0].url === "https://api.stripe.com/v1/checkout/sessions", "calls Stripe Checkout Sessions");
ok(calls[0].init.headers["Idempotency-Key"] === "abcDEF123_-abcDEF123_-", "Idempotency-Key is the client's key");
ok(calls[0].init.headers.Authorization === "Bearer rk_test_x", "restricted key preferred");
const form = new URLSearchParams(calls[0].init.body);
ok(form.get("line_items[0][price_data][unit_amount]") === "333" && form.get("submit_type") === "donate" && form.get("success_url") === SITE + "/divinity-guide?donated=true&cs={CHECKOUT_SESSION_ID}", "form carries amount, donate, success_url (+ session id)");
ok(r.h["access-control-allow-origin"] === SITE, "response CORS echoes own origin only");
// a malformed client key falls back to a generated one (never fails the donation)
r = await J(await handleDonate(req({ amount_cents: 333, client_key: "x" }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" }));
ok(r.status === 200 && /^[0-9a-f-]{36}$/.test(calls[1].init.headers["Idempotency-Key"]), "bad client key → generated UUID");
// Stripe's own error surfaces as 502 with its message
globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "This API key does not have Checkout permission" } }), { status: 401, headers: { "Content-Type": "application/json" } });
r = await J(await handleDonate(req({ amount_cents: 333 }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" }));
ok(r.status === 502 && /Checkout permission/.test(r.body.error), "Stripe error surfaces, key never");
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
  // the create path now appends cs={CHECKOUT_SESSION_ID} to the success URL
  const calls2 = []; globalThis.fetch = async (url, init) => { calls2.push(init); return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/x" }), { status: 200, headers: { "Content-Type": "application/json" } }); };
  await handleDonate(req({ amount_cents: 333, success_url: SITE + "/divinity-guide/?donated=true" }, { origin: SITE }), { STRIPE_SECRET_KEY: "sk_test_x" });
  ok2(new URLSearchParams(calls2[0].body).get("success_url") === SITE + "/divinity-guide/?donated=true&cs={CHECKOUT_SESSION_ID}", "create: success_url carries {CHECKOUT_SESSION_ID}");
  console.log(`donate-verify: ${pass2} passed, ${fail2} failed`); if (fail2) process.exit(1);
}
