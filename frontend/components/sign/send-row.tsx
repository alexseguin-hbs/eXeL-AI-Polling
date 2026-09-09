"use client";

/**
 * The END of signing, on a phone or a computer (operator 2026-09-09): the signed (or partly-signed) file goes out by
 * ⤓ Download · 💬 Text · ✉ E-mail · ⧉ Copy message — one row, used by the Done panel, the offline hand-off and the edit-own result.
 *   Text   phone with a share sheet that takes files → the sheet (Messages is in it) with the PDF and the script;
 *          a phone without one → the file downloads and the sms: composer opens with the script;
 *          a computer → the file downloads and the message is copied (sms: is inert on a desktop) — "paste it, attach the file".
 *   E-mail phone with a share sheet → the sheet (Mail); else the site's own mail (/api/notify) sends it WITH THE PDF ATTACHED to the
 *          typed address when the Worker holds the Resend key; else the file downloads and the mail composer opens — "attach the file".
 * Every branch ends in one visible state line. R-CORE: reuses IconDownload, handoffMessage, sendSignerEmail, contactKind.
 */
import { useEffect, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { IconDownload } from "@/components/download-icon";
import { handoffMessage, contactKind, normalizeContact, shortHash } from "@/lib/sign-envelope";
import { sendSignerEmail, mailFits, type MailAttachment } from "@/lib/notify";
import { bytesToBase64 } from "@/lib/pdf-render";

export interface SendFile { name: string; bytes: Uint8Array }
type State = "" | "shared" | "sent" | "composer" | "copied" | "mail_manual" | "failed";

export function SendRow({ files, final, title, sender, link, toDefault, download, fileName, message, chain, focus }: {
  files: SendFile[]; final: boolean; title: string; sender: string;
  /** a record / hand-off / 24-hour link to put in the message, when one exists */ link?: string;
  /** the other party's contact, when known (prefills the e-mail address and the sms: number) */ toDefault?: string;
  download: (f: SendFile, final: boolean) => Promise<void>;
  /** the outgoing file name (with the signers' initials) */ fileName: (f: SendFile, final: boolean) => Promise<string>;
  /** the message text (script) — default: the lexicon's done / hand-off template */ message?: string;
  /** the record's chain hash — one language-neutral line in the message so the recipient can verify what arrived (Pangu) */ chain?: string;
  /** the file a saved link named: its ⤓ is marked (operator 2026-09-09) */ focus?: number;
}) {
  const { t } = useLexicon();
  const [to, setTo] = useState(toDefault && contactKind(toDefault) === "email" ? toDefault : "");
  useEffect(() => { if (toDefault && contactKind(toDefault) === "email") setTo(toDefault); }, [toDefault]);   // the creator's contact arrives with the completion result (037)
  const [state, setState] = useState<State>("");
  const [busy, setBusy] = useState(false);
  const isPhone = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const msg = (message ?? handoffMessage(sender, title, link ?? "", t(final ? "soi.sign.send.done_template" : "soi.sign.handoff.offline_template"))) + (chain ? `\n⧉ ${shortHash(chain)}` : "");
  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { canShare?: (d: ShareData) => boolean; share?: (d: ShareData) => Promise<void> }) : null;
  const asFiles = async () => Promise.all(files.map(async (f) => new File([f.bytes as BlobPart], await fileName(f, final), { type: "application/pdf" })));
  /** the phone's share sheet with the PDF(s) — true when it took them */
  const sheet = async (): Promise<boolean> => {
    if (!nav?.share || !nav.canShare) return false;
    const fs = await asFiles(); if (!nav.canShare({ files: fs })) return false;
    try { await nav.share({ files: fs, title, text: msg }); setState("shared"); return true; } catch (e) { if ((e as Error).name === "AbortError") return true; return false; }
  };
  const downloadAll = async () => { for (const f of files) await download(f, final); };
  const copy = async () => { try { await navigator.clipboard.writeText(msg); setState("copied"); } catch { setState("failed"); } };
  const text = async () => {
    if (busy) return; setBusy(true);
    try {
      if (await sheet()) return;
      await downloadAll();
      if (isPhone) { const n = toDefault && contactKind(toDefault) === "phone" ? normalizeContact(toDefault) : ""; window.location.href = `sms:${n}?&body=${encodeURIComponent(msg)}`; setState("composer"); }
      else await copy();                                                  // a computer: sms: opens nothing — the message is on the clipboard, the file in Downloads
    } finally { setBusy(false); }
  };
  const email = async () => {
    if (busy) return; setBusy(true);
    try {
      if (await sheet()) return;
      const addr = to.trim();
      if (addr && contactKind(addr) === "email" && files[0]) {
        try {
          // EVERY file rides along (operator 2026-09-09: "email with attachments"); over the Worker's caps the composer + downloads path below is the way
          const all: MailAttachment[] = await Promise.all(files.map(async (f) => ({ name: await fileName(f, final), base64: bytesToBase64(f.bytes) })));
          if (mailFits(all)) {
            const r = await sendSignerEmail({ to: addr, sender, title, link, final, attachment: all[0], attachments: all.slice(1) });
            if (r === "sent") { setState("sent"); return; }
          }
        } catch { /* fall through to the composer */ }
      }
      await downloadAll();
      window.location.href = `mailto:${addr && contactKind(addr) === "email" ? normalizeContact(addr) : ""}?subject=${encodeURIComponent(`${final ? t("soi.sign.send.subject_done") : t("soi.sign.handoff.subject")} ${title}`)}&body=${encodeURIComponent(msg)}`;
      setState("mail_manual");
    } finally { setBusy(false); }
  };
  const B = "inline-flex min-h-[44px] items-center gap-1 rounded-md border border-border px-3 text-xs";
  return (
    <div data-testid="send-row">
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {files.map((f, i) => <span key={f.name} className={`inline-flex items-center gap-2 text-xs ${focus === i ? "rounded-md ring-1 ring-primary" : ""}`} data-focus={focus === i ? "1" : undefined}><IconDownload label={`${t("soi.sign.download")} · ${f.name}`} onClick={() => void download(f, final)} testId="send-download" /><span className="max-w-[40vw] truncate">{f.name}</span></span>)}
        <button type="button" onClick={() => void text()} disabled={busy} className={B} data-testid="send-text"><span aria-hidden="true">💬 </span>{t("soi.sign.send.text")}</button>
        <button type="button" onClick={() => void email()} disabled={busy} className={B} data-testid="send-email-file"><span aria-hidden="true">✉ </span>{t("soi.sign.send.email")}</button>
        <button type="button" onClick={() => void copy()} className={B} data-testid="send-copy"><span aria-hidden="true">⧉ </span>{t("soi.sign.send.copy")}</button>
      </div>
      <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder={t("soi.sign.send.to_ph")} className="mt-2 min-h-[44px] w-full max-w-sm rounded-md border border-border bg-background px-3 text-sm" aria-label={t("soi.sign.send.to_ph")} data-testid="send-email-to" />
      {state && <p className={`mt-2 text-[11px] ${state === "failed" ? "text-red-500" : "text-muted-foreground"}`} data-testid="send-state" data-state={state}>
        {state === "shared" ? t("soi.sign.send.shared") : state === "sent" ? t("soi.sign.send.mail_attached") : state === "composer" ? t("soi.sign.handoff.share_fallback") : state === "copied" ? (isPhone ? t("soi.sign.handoff.copied") : t("soi.sign.send.copied_computer")) : state === "mail_manual" ? t("soi.sign.send.mail_manual") : t("soi.sign.handoff.share_failed")}
      </p>}
    </div>
  );
}
