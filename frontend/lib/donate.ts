/**
 * Donation helper — talks to the Cloudflare Pages Function at /api/donate (edge Stripe
 * checkout), independent of MOCK_MODE and the FastAPI backend. The frontend is always
 * served from Cloudflare Pages, so /api/donate is always reachable.
 *
 * Returns:
 *   string  → a real Stripe-hosted Checkout URL (redirect the browser to it)
 *   null    → no Stripe key configured on this deployment (caller shows a demo state)
 *   throws  → a real error (e.g. Stripe rejected the request) with a user-safe message
 */
export async function startDonation(opts: {
  amountCents: number;
  label?: string;
  description?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<string | null> {
  const res = await fetch("/api/donate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount_cents: opts.amountCents,
      label: opts.label,
      description: opts.description,
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
    }),
  });

  // ⚠ A NON-JSON BODY MEANS THE ENDPOINT ISN'T THERE — AND IT USED TO READ AS A STRIPE FAILURE.
  // The comment below always said "treat as demo", but the code only did that on a 404. This deploy
  // serves Workers Static Assets with `not_found_handling: "single-page-application"`, so an
  // unrouted /api/donate came back as **index.html with a 200** — res.ok true, JSON parse failed,
  // `configured` undefined, status not 404 — and fell straight through to the generic throw. The
  // operator saw "Donation could not be started. Please try again." for a request that never
  // reached Stripe. The route now lives in worker.js; this makes the failure mode honest either way.
  const ct = res.headers.get("content-type") || "";
  let data: { url?: string; configured?: boolean; error?: string } = {};
  let parsed = false;
  if (ct.includes("application/json")) {
    try { data = await res.json(); parsed = true; } catch { /* malformed JSON — handled below */ }
  }

  if (res.ok && data.url) return data.url;                            // live Stripe checkout
  if (data.configured === false || res.status === 404) return null;   // no key / route absent → demo
  if (!parsed) return null;                                           // HTML or empty body → not deployed → demo
  throw new Error(data.error || "Donation could not be started. Please try again.");
}
