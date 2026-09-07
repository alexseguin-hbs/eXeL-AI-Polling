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
  /** One key per modal open — a double-tap replays the same Checkout instead of minting two. */
  clientKey?: string;
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
      client_key: opts.clientKey,
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

/** A same-page return URL carrying ?donated=true so the page can say thank you (never before Stripe confirms). */
export function donatedReturnUrl(): string {
  if (typeof window === "undefined") return "/?donated=true";
  const u = new URL(window.location.href);
  u.searchParams.set("donated", "true");
  return u.toString();
}

/** One idempotency key per open; base64url-ish, 22 chars. */
export function newClientKey(): string {
  const b = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  return Array.from(b, (x) => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[x % 64]).join("").slice(0, 22);
}

export type DonatedReturn = "none" | "paid" | "unpaid" | "unverified";

/**
 * Read-once return from Stripe. `?donated=true&cs=<id>` → ask /api/donate/verify whether that
 * Checkout session is PAID (Odin, wave 2). A bare `?donated=true` with no session id proves nothing
 * and returns "unverified"; callers thank politely but unlock nothing. Both params are removed.
 */
export async function verifyDonatedReturn(): Promise<DonatedReturn> {
  if (typeof window === "undefined") return "none";
  const u = new URL(window.location.href);
  if (u.searchParams.get("donated") !== "true") return "none";
  const cs = u.searchParams.get("cs") || "";
  u.searchParams.delete("donated"); u.searchParams.delete("cs");
  try { window.history.replaceState(null, "", u.toString()); } catch { /* ignore */ }
  if (!cs) return "unverified";
  try {
    const res = await fetch(`/api/donate/verify?cs=${encodeURIComponent(cs)}`);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return "unverified";
    const data = (await res.json()) as { paid?: boolean; configured?: boolean };
    if (data.configured === false) return "unverified";
    return data.paid ? "paid" : "unpaid";
  } catch { return "unverified"; }
}

/** @deprecated use verifyDonatedReturn — kept so older call sites compile; returns true only for a paid return. */
export async function consumeDonatedFlag(): Promise<boolean> { return (await verifyDonatedReturn()) === "paid"; }
