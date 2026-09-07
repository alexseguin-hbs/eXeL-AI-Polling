"use client";

/**
 * Hand-off to the next signer — zero-cost, works today: the phone's own SMS or e-mail composer,
 * prefilled with a message that names the sender and the document (Sofia), plus Copy and a QR.
 */
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useLexicon } from "@/lib/lexicon-context";
import { contactKind, normalizeContact, handoffMessage } from "@/lib/sign-envelope";

export function Handoff({ link, sender, title, nextName, nextContact }: { link: string; sender: string; title: string; nextName: string; nextContact: string }) {
  const { t } = useLexicon();
  const [copied, setCopied] = useState(false);
  const msg = handoffMessage(sender || "Someone", title, link);
  const kind = contactKind(nextContact);
  const sms = `sms:${kind === "phone" ? normalizeContact(nextContact) : ""}?&body=${encodeURIComponent(msg)}`;
  const mail = `mailto:${kind === "email" ? normalizeContact(nextContact) : ""}?subject=${encodeURIComponent(`Please sign: ${title}`)}&body=${encodeURIComponent(msg)}`;
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* no clipboard */ } };
  return (
    <div className="rounded-lg border border-cyan-400/40 bg-cyan-400/5 p-4">
      <div className="text-sm font-medium text-cyan-400">{t("soi.sign.handoff.title")}</div>
      <p className="mt-1 text-xs text-muted-foreground">{t("soi.sign.handoff.hint")} <strong>{nextName || nextContact}</strong>.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={sms} className="min-h-[44px] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{t("soi.sign.handoff.sms")}</a>
        <a href={mail} className="min-h-[44px] rounded-md border border-border px-4 py-2 text-sm">{t("soi.sign.handoff.mail")}</a>
        <button type="button" onClick={copy} className="min-h-[44px] rounded-md border border-border px-4 py-2 text-sm">{copied ? t("soi.sign.handoff.copied") : t("soi.sign.handoff.copy")}</button>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <div className="rounded-md bg-white p-2"><QRCodeSVG value={link} size={96} level="M" /></div>
        <code className="break-all text-[11px] text-muted-foreground" data-testid="handoff-link">{link}</code>
      </div>
    </div>
  );
}
