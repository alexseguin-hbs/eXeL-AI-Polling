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

const RECENT = new Map();
export async function handleNotify(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins(request, env).has(origin)) return json({ error: "Origin not allowed" }, 403);
  const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);
  const key = env && env.RESEND_API_KEY, from = (env && env.NOTIFY_FROM) || "";
  if (!key || !from) return json({ configured: false }, 200, cors);
  let body; try { body = await request.json(); } catch { return json({ error: "Bad JSON" }, 400, cors); }
  // The page sends WHO (to), WHO ASKS (sender), WHAT (title) and the LINK; the server writes the subject and the text
  // itself, so this route can carry nothing but a signing request (fleet, Thor: it was an open relay on Origin alone).
  const to = String(body.to || "").trim(), sender = String(body.sender || "").replace(/[\r\n]/g, " ").slice(0, 80).trim() || "Someone", title = String(body.title || "").replace(/[\r\n]/g, " ").slice(0, 120).trim() || "a document", link = String(body.link || "");

  if (!EMAIL.test(to)) return json({ error: "Invalid e-mail address" }, 400, cors);
  // an optional PDF attachment (the signed file itself — operator 2026-09-09: "email and text with download … from phone or computer"):
  // base64, at most 3 MB decoded, a sanitised .pdf file name; with an attachment the link is optional and the mail says "Signed:"
  // one `attachment` (the first file) and, since 2026-09-09 (operator: "email with attachments"), `attachments[]` for the rest of a
  // multi-file envelope: every entry sanitised the same way, each ≤ 3 MB decoded, all together ≤ 9 MB (Thoth)
  const MAX_ONE = 4 * 1024 * 1024, MAX_ALL = 12 * 1024 * 1024;
  const readOne = (a) => {
    if (!a || typeof a !== "object") return { error: "Bad attachment" };
    const b64 = String(a.base64 || "").replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]+=*$/.test(b64) || b64.length < 8) return { error: "Bad attachment" };
    if (b64.length > MAX_ONE) return { error: "Attachment too large (3 MB max)", status: 413 };
    const name = (String(a.name || "signed.pdf").replace(/[^\w.\- ]/g, "_").slice(0, 120) || "signed.pdf").replace(/(\.pdf)?$/i, ".pdf");
    return { filename: name, content: b64 };
  };
  const attachments = [];
  const list = [...(body.attachment ? [body.attachment] : []), ...(Array.isArray(body.attachments) ? body.attachments : [])];
  if (list.length > 5) return json({ error: "Too many attachments (5 max)" }, 400, cors);
  for (const a of list) { const r = readOne(a); if (r.error) return json({ error: r.error }, r.status || 400, cors); attachments.push(r); }
  if (attachments.reduce((n, a) => n + a.content.length, 0) > MAX_ALL) return json({ error: "Attachments too large (9 MB max together)" }, 413, cors);
  const attachment = attachments[0] || null;
  if (!link && !attachment) return json({ error: "Link is required" }, 400, cors);
  const final = body.final === true;
  const subject = attachment && (final || !link) ? `Signed: ${title}` : `Please sign: ${title}`;
  const text = attachment && (final || !link)
    ? `${sender} signed "${title}" on eXeL AI Polling. The signed PDF${attachments.length > 1 ? "s are" : " is"} attached; ${attachments.length > 1 ? "they carry" : "it carries"} every signatory's name, time and hash.${link ? ` Record: ${link}` : ""}`
    : `${sender} asks you to sign "${title}" on eXeL AI Polling. No account, no fee.${attachment ? " The partly-signed PDF is attached." : ""}${link ? ` This link is yours alone (it holds your key; do not forward it) and it expires in 30 days: ${link}` : ""}`;
  // the link must point back to this site — the mail carries a bearer secret, never an arbitrary URL
  try { if (link && new URL(link).origin !== new URL(request.url).origin) return json({ error: "Link must be on this site" }, 400, cors); } catch { return json({ error: "Bad link" }, 400, cors); }
  // a light per-address throttle: one request per address per 20 s per isolate (best effort; the real bound is the Resend account)
  const now = Date.now(); const last = RECENT.get(to) || 0; if (now - last < 20000) return json({ error: "Too many requests for this address; wait a moment." }, 429, cors); RECENT.set(to, now); if (RECENT.size > 500) RECENT.clear();
  let res;
  try {
    res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, text, ...(attachments.length ? { attachments } : {}) }) });
  } catch { return json({ error: "Could not reach the mail service" }, 502, cors); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: (data && (data.message || (data.error && data.error.message))) || "Mail service error" }, 502, cors);
  return json({ sent: true, id: data.id || null }, 200, cors);
}
