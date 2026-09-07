"use client";

/**
 * Hand-off to the next signer — zero-cost, works today: the phone's own SMS or e-mail composer,
 * prefilled with a message that names the sender and the document (Sofia), plus Copy and a QR.
 */
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useLexicon } from "@/lib/lexicon-context";
import { contactKind, normalizeContact, handoffMessage } from "@/lib/sign-envelope";
import { sendSignerEmail } from "@/lib/notify";

export function Handoff({ link, sender, title, nextName, nextContact }: { link: string; sender: string; title: string; nextName: string; nextContact: string }) {
  const { t } = useLexicon();
  const [copied, setCopied] = useState(false);
  const [mailState, setMailState] = useState<"idle" | "sending" | "sent" | "fallback" | "error">("idle");
  const [mailErr, setMailErr] = useState("");
  const msg = handoffMessage(sender || t("soi.sign.handoff.someone"), title, link, t("soi.sign.handoff.template"));
  const kind = contactKind(nextContact);
  const sms = `sms:${kind === "phone" ? normalizeContact(nextContact) : ""}?&body=${encodeURIComponent(msg)}`;
  const mail = `mailto:${kind === "email" ? normalizeContact(nextContact) : ""}?subject=${encodeURIComponent(`${t("soi.sign.handoff.subject")} ${title}`)}&body=${encodeURIComponent(msg)}`;
  // E-mail FROM eXeL when the Worker holds a mail key; otherwise the phone's own composer, and we say so.
  const sendFromExel = async () => {
    setMailState("sending"); setMailErr("");
    try {
      const r = await sendSignerEmail({ to: normalizeContact(nextContact), subject: `${t("soi.sign.handoff.subject")} ${title}`, text: msg, link });
      if (r === "sent") setMailState("sent"); else { setMailState("fallback"); window.location.href = mail; }
    } catch (e) { setMailState("error"); setMailErr(e instanceof Error ? e.message : "error"); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* no clipboard */ } };
  return (
    <div className="rounded-lg border border-cyan-400/40 bg-cyan-400/5 p-4">
      <div className="text-sm font-medium text-cyan-400">{t("soi.sign.handoff.title")}</div>
      <p className="mt-1 text-xs text-muted-foreground">{t("soi.sign.handoff.hint")} <strong>{nextName || nextContact}</strong>.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={sms} className="min-h-[44px] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><span aria-hidden="true">💬 </span>{t("soi.sign.handoff.sms")}</a>
        {kind === "email"
          ? <button type="button" onClick={sendFromExel} disabled={mailState === "sending" || mailState === "sent"} className="min-h-[44px] rounded-md border border-border px-4 py-2 text-sm disabled:opacity-60" data-testid="send-email"><span aria-hidden="true">✉ </span>{mailState === "sent" ? t("soi.sign.handoff.mail_sent") : mailState === "sending" ? t("soi.sign.handoff.mail_sending") : t("soi.sign.handoff.mail")}</button>
          : <a href={mail} className="min-h-[44px] rounded-md border border-border px-4 py-2 text-sm"><span aria-hidden="true">✉ </span>{t("soi.sign.handoff.mail")}</a>}
        <button type="button" onClick={copy} className="min-h-[44px] rounded-md border border-border px-4 py-2 text-sm"><span aria-hidden="true">{copied ? "✓ " : "⧉ "}</span>{copied ? t("soi.sign.handoff.copied") : t("soi.sign.handoff.copy")}</button>
      </div>
      {mailState === "fallback" && <p className="mt-2 text-[11px] text-muted-foreground">{t("soi.sign.handoff.mail_fallback")}</p>}
      {mailState === "error" && <p className="mt-2 text-[11px] text-red-500">{mailErr}</p>}
      <div className="mt-3 flex items-start gap-3">
        <div className="rounded-md bg-white p-2"><QRCodeSVG value={link} size={96} level="M" /></div>
        <code className="break-all text-[11px] text-muted-foreground" data-testid="handoff-link">{link}</code>
      </div>
    </div>
  );
}
