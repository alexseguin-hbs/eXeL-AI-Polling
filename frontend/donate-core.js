/**
 * donate-core — the ONE Stripe Checkout implementation, shared by both entry points.
 *
 * ⚠ WHY THIS FILE EXISTS: the donate endpoint was written as a Cloudflare **Pages Function**
 * (`functions/api/donate.js`), but this site deploys as **Workers Static Assets** (`wrangler.jsonc`
 * → `main: worker.js`). worker.js says it in its own header: "the Pages `functions/` convention is
 * NEVER executed here." So POST /api/donate never reached any handler — it fell through to
 * `env.ASSETS.fetch`, hit `not_found_handling: "single-page-application"`, and came back as
 * index.html with a **200**. The client then failed to parse HTML as JSON and threw its generic
 * "Donation could not be started. Please try again." That is the error on the operator's screen:
 * not Stripe rejecting anything — the request never got near Stripe.
 *
 * The logic is unchanged from the Pages Function; it just lives somewhere both can import, so the
 * two entry points can never drift into two different donation flows.
 *
 * ⚠ THE STRIPE KEY IS A CLOUDFLARE SECRET AND IS NEVER IN THIS REPO. Set ONE of these on the
 * **Worker** (Settings → Variables and Secrets → encrypted), not on a Pages project:
 *     STRIPE_RESTRICTED_KEY   rk_live_…   (preferred — least privilege; needs Checkout write)
 *     STRIPE_SECRET_KEY       sk_live_…   (fallback)
 * With no key the endpoint answers `{ configured: false }` and the UI shows its graceful demo
 * acknowledgement instead of an error — which is the correct state until the secret is set.
 */

// Same-origin only (Thor/Pangu, round 1): a payment endpoint that answers any Origin lets a third-party
// page mint Checkout sessions on this account with its own branding and redirect. The allowed set is
// the request's own origin plus DONATE_ALLOWED_ORIGINS (comma-separated) for a preview deployment.
const allowedOrigins = (request, env) => {
  const own = new URL(request.url).origin;
  const extra = String((env && env.DONATE_ALLOWED_ORIGINS) || "").split(",").map((s) => s.trim()).filter(Boolean);
  return new Set([own, ...extra]);
};
const corsFor = (request, env) => {
  const origin = request.headers.get("Origin");
  // Browsers always send Origin on POST; a POST without one is not a page of this site (curl etc.)
  // and may not mint Checkout sessions (Thor, wave 3). Same-origin GETs legitimately omit it.
  const ok = origin ? allowedOrigins(request, env).has(origin) : request.method !== "POST";
  return { ok, headers: ok && origin ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {} };
};
const jsonWith = (headers) => (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...headers } });
const MAX_CENTS = 999_900;                       // $9,999.00 — a donation, not a wire
const sameOrigin = (u, origin) => { try { return new URL(u).origin === origin; } catch { return false; } };

const resolveKey = (env) => (env && (env.STRIPE_RESTRICTED_KEY || env.STRIPE_SECRET_KEY)) || "";

/**
 * GET /api/donate/verify?cs=<checkout session id> — the ONLY proof a donation happened. The success
 * URL carries Stripe's {CHECKOUT_SESSION_ID}; the page asks here before saying thank you or
 * unlocking anything (Odin, wave 2 — a bare ?donated=true was client-trusted and forgeable).
 * Returns {configured:false} without a key, {paid:true|false, amount_cents, currency} otherwise.
 */
// Verified sessions are remembered per isolate for ten minutes, so a page that re-checks — or a
// script hammering the route — costs one Stripe call per session id, not one per hit (Thor, wave 3).
const verifyCache = new Map();
const VERIFY_TTL_MS = 10 * 60 * 1000, VERIFY_MAX = 500;
export async function handleDonateVerify(request, env) {
  const cors = corsFor(request, env);
  const json = jsonWith(cors.headers);
  if (!cors.ok) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { "Content-Type": "application/json" } });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors.headers });
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const key = resolveKey(env);
  if (!key) return json({ configured: false });
  const cs = new URL(request.url).searchParams.get("cs") || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(cs)) return json({ error: "Invalid session id" }, 400);
  const hit = verifyCache.get(cs);
  if (hit && hit.until > Date.now()) return json(hit.body);
  let res;
  try { res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(cs)}`, { headers: { Authorization: `Bearer ${key}` } }); }
  catch { return json({ error: "Could not reach Stripe" }, 502); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: (data && data.error && data.error.message) || "Stripe error" }, 502);
  const paid = data.payment_status === "paid";
  const body = { paid, amount_cents: paid ? Number(data.amount_total) || 0 : 0, currency: data.currency || "usd", donation: !!(data.metadata && data.metadata.transaction_type === "donation") };
  if (verifyCache.size >= VERIFY_MAX) verifyCache.delete(verifyCache.keys().next().value);
  verifyCache.set(cs, { until: Date.now() + VERIFY_TTL_MS, body });
  return json(body);
}

export async function handleDonate(request, env) {
  const cors = corsFor(request, env);
  const json = jsonWith(cors.headers);
  if (!cors.ok) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { "Content-Type": "application/json" } });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors.headers });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const key = resolveKey(env);
  // No key configured → tell the caller so it can show a graceful "demo" acknowledgement instead of
  // a hard error. This is the state on a fresh deploy before the secret is set.
  if (!key) return json({ configured: false });

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const amount = Math.round(Number(body.amount_cents) || 0);
  if (!Number.isFinite(amount) || amount < 50) return json({ error: "Minimum donation is $0.50" }, 400);
  if (amount > MAX_CENTS) return json({ error: "Maximum donation is $9,999.00" }, 400);

  const origin = new URL(request.url).origin;
  const label = String(body.label || "eXeL AI Polling — Community Contribution").slice(0, 250);
  const description = String(body.description || "Support the SoI Governance platform").slice(0, 250);
  const successUrl = String(body.success_url || env.STRIPE_SUCCESS_URL || `${origin}/?donated=true`);
  const cancelUrl = String(body.cancel_url || env.STRIPE_CANCEL_URL || origin);
  // The post-payment redirect must come back to this site — never an arbitrary caller-supplied host.
  if (!sameOrigin(successUrl, origin) || !sameOrigin(cancelUrl, origin)) return json({ error: "Redirect URLs must be on this site" }, 400);
  // Stripe substitutes {CHECKOUT_SESSION_ID} on redirect; the page verifies it at /api/donate/verify.
  const successWithCs = successUrl.includes("{CHECKOUT_SESSION_ID}") ? successUrl : successUrl + (successUrl.includes("?") ? "&" : "?") + "cs={CHECKOUT_SESSION_ID}";
  // Idempotency that actually works: the CLIENT supplies one key per modal open, so a double-tap
  // replays the same Checkout session instead of minting two. A fresh UUID is the fallback only.
  const clientKey = typeof body.client_key === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(body.client_key) ? body.client_key : crypto.randomUUID();

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", String(amount));
  form.set("line_items[0][price_data][product_data][name]", label);
  form.set("line_items[0][price_data][product_data][description]", description);
  form.set("submit_type", "donate");
  form.set("success_url", successWithCs);
  form.set("cancel_url", cancelUrl);
  form.set("metadata[transaction_type]", "donation");
  form.set("metadata[source]", "edge_donate");

  let res;
  try {
    res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
        // A double-tap on mobile must not create two sessions.
        "Idempotency-Key": clientKey,
      },
      body: form.toString(),
    });
  } catch {
    return json({ error: "Could not reach Stripe" }, 502);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    // Surface Stripe's own message (e.g. a restricted key missing Checkout permission) — never the key.
    return json({ error: (data && data.error && data.error.message) || "Stripe error" }, 502);
  }
  return json({ url: data.url });
}
