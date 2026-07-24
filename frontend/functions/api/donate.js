/**
 * Cloudflare Pages Function — LIVE donation checkout (edge, no separate backend).
 *
 * POST /api/donate  { amount_cents, label?, description?, success_url?, cancel_url? }
 *   → { url }              a real Stripe-hosted Checkout URL (redirect the browser to it)
 *   → { configured:false } no Stripe key set on this deployment (caller shows demo state)
 *
 * The Stripe key is read from a Cloudflare **environment variable / secret** — NEVER the
 * repo. Set ONE of these in the Pages project (Settings → Environment variables, encrypted):
 *   STRIPE_RESTRICTED_KEY   rk_live_…   (preferred — least privilege; needs Checkout write)
 *   STRIPE_SECRET_KEY       sk_live_…   (fallback)
 * Optionally STRIPE_SUCCESS_URL / STRIPE_CANCEL_URL to override the redirect targets.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function resolveKey(env) {
  // Prefer a restricted key (RAK) over the unrestricted secret key (Stripe guidance).
  return env.STRIPE_RESTRICTED_KEY || env.STRIPE_SECRET_KEY || "";
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const key = resolveKey(env);
  // No key configured → tell the caller so it can show a graceful "demo" acknowledgement
  // instead of a hard error. This is the state on a fresh deploy before secrets are set.
  if (!key) {
    return json({ configured: false });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const amount = Math.round(Number(body.amount_cents) || 0);
  if (!Number.isFinite(amount) || amount < 50) {
    return json({ error: "Minimum donation is $0.50" }, 400);
  }

  const origin = new URL(request.url).origin;
  const label = String(body.label || "eXeL AI Polling — Community Contribution").slice(0, 250);
  const description = String(body.description || "Support the SoI Governance platform").slice(0, 250);
  const successUrl = String(body.success_url || env.STRIPE_SUCCESS_URL || `${origin}/?donated=true`);
  const cancelUrl = String(body.cancel_url || env.STRIPE_CANCEL_URL || origin);

  // Stripe Checkout Session via the REST API (form-encoded).
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", String(amount));
  form.set("line_items[0][price_data][product_data][name]", label);
  form.set("line_items[0][price_data][product_data][description]", description);
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
      },
      body: form.toString(),
    });
  } catch {
    return json({ error: "Could not reach Stripe" }, 502);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    // Surface Stripe's message (e.g. restricted key missing Checkout permission) without leaking the key.
    const detail = (data && data.error && data.error.message) || "Stripe error";
    return json({ error: detail }, 502);
  }

  return json({ url: data.url });
}
