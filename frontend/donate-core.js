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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...CORS } });

/** Prefer a restricted key (RAK) over the unrestricted secret key — Stripe's own guidance. */
const resolveKey = (env) => (env && (env.STRIPE_RESTRICTED_KEY || env.STRIPE_SECRET_KEY)) || "";

export async function handleDonate(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const key = resolveKey(env);
  // No key configured → tell the caller so it can show a graceful "demo" acknowledgement instead of
  // a hard error. This is the state on a fresh deploy before the secret is set.
  if (!key) return json({ configured: false });

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const amount = Math.round(Number(body.amount_cents) || 0);
  if (!Number.isFinite(amount) || amount < 50) return json({ error: "Minimum donation is $0.50" }, 400);

  const origin = new URL(request.url).origin;
  const label = String(body.label || "eXeL AI Polling — Community Contribution").slice(0, 250);
  const description = String(body.description || "Support the SoI Governance platform").slice(0, 250);
  const successUrl = String(body.success_url || env.STRIPE_SUCCESS_URL || `${origin}/?donated=true`);
  const cancelUrl = String(body.cancel_url || env.STRIPE_CANCEL_URL || origin);

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", String(amount));
  form.set("line_items[0][price_data][product_data][name]", label);
  form.set("line_items[0][price_data][product_data][description]", description);
  form.set("submit_type", "donate");
  form.set("success_url", successUrl);
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
        "Idempotency-Key": crypto.randomUUID(),
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
