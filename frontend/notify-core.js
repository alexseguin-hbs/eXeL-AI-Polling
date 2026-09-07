/**
 * notify-core.js — POST /api/notify — send the next signer their link by e-mail FROM eXeL.
 * Provider: Resend (https://api.resend.com/emails) with the Worker secrets RESEND_API_KEY and
 * NOTIFY_FROM (e.g. "eXeL AI Polling <sign@exel-ai.com>"). No key → {configured:false} and the page
 * falls back to the phone's own mail composer — never an error, never a fake "sent".
 * Same-origin only, like /api/donate. One implementation; worker.js routes to it.
 */
const allowedOrigins = (request, env) => {
  const own = new URL(request.url).origin;
  const extra = String((env && env.DONATE_ALLOWED_ORIGINS) || "").split(",").map((s) => s.trim()).filter(Boolean);
  return new Set([own, ...extra]);
};
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...headers } });
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export async function handleNotify(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins(request, env).has(origin)) return json({ error: "Origin not allowed" }, 403);
  const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);
  const key = env && env.RESEND_API_KEY, from = (env && env.NOTIFY_FROM) || "";
  if (!key || !from) return json({ configured: false }, 200, cors);
  let body; try { body = await request.json(); } catch { return json({ error: "Bad JSON" }, 400, cors); }
  const to = String(body.to || "").trim(), subject = String(body.subject || "").slice(0, 150), text = String(body.text || "").slice(0, 4000), link = String(body.link || "");
  if (!EMAIL.test(to)) return json({ error: "Invalid e-mail address" }, 400, cors);
  if (!subject || !text) return json({ error: "Subject and text are required" }, 400, cors);
  // the link must point back to this site — the mail carries a bearer secret, never an arbitrary URL
  try { if (link && new URL(link).origin !== new URL(request.url).origin) return json({ error: "Link must be on this site" }, 400, cors); } catch { return json({ error: "Bad link" }, 400, cors); }
  let res;
  try {
    res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, text }) });
  } catch { return json({ error: "Could not reach the mail service" }, 502, cors); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: (data && (data.message || (data.error && data.error.message))) || "Mail service error" }, 502, cors);
  return json({ sent: true, id: data.id || null }, 200, cors);
}
