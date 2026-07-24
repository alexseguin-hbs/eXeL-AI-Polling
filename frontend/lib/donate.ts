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

  let data: { url?: string; configured?: boolean; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON (e.g. Pages Function not deployed yet) → treat as demo below */
  }

  if (res.ok && data.url) return data.url; // live Stripe checkout
  if (data.configured === false || res.status === 404) return null; // no key / function absent → demo
  throw new Error(data.error || "Donation could not be started. Please try again.");
}
