/**
 * Send the next signer's link — or the signed PDF itself as an attachment (operator 2026-09-09) — by e-mail from eXeL (/api/notify → Resend). Returns "sent" when the
 * Worker holds RESEND_API_KEY + NOTIFY_FROM, "unconfigured" when it does not (the page falls back
 * to the phone's own mail composer), or throws with a user-safe message.
 */
export interface MailAttachment { name: string; base64: string }
/** each file ≤ 3 MB decoded (4 MiB base64), all together ≤ 9 MB — the Worker's caps; a caller over them should fall back to the composer */
export const MAIL_ONE_MAX = 4 * 1024 * 1024, MAIL_ALL_MAX = 12 * 1024 * 1024;
export const mailFits = (files: MailAttachment[]): boolean => files.every((f) => f.base64.length <= MAIL_ONE_MAX) && files.reduce((n, f) => n + f.base64.length, 0) <= MAIL_ALL_MAX;
export async function sendSignerEmail(opts: { to: string; sender: string; title: string; link?: string; final?: boolean; attachment?: MailAttachment; /** the rest of a multi-file envelope (operator 2026-09-09: "email with attachments") */ attachments?: MailAttachment[] }): Promise<"sent" | "unconfigured"> {
  // the Worker composes subject and text itself from who / what / link — this route carries nothing else (fleet, Thor)
  const res = await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(opts), signal: AbortSignal.timeout(20_000) });   // H1: never an untimed fetch on this path
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? ((await res.json().catch(() => ({}))) as { sent?: boolean; configured?: boolean; error?: string }) : {};
  if (data.sent) return "sent";
  if (data.configured === false || res.status === 404 || !ct.includes("application/json")) return "unconfigured";
  throw new Error(data.error || "The e-mail could not be sent.");
}
