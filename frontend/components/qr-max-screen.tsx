"use client";

/**
 * QR at max screen — the Divinity Guide's expandable QR overlay and the dashboard's fullscreen join QR, as ONE shared
 * component (operator 2026-09-12: "enable max screen like divinity guide"): the whole screen, the QR large, the code
 * large, the link as text with Copy, a close control. Reused by the pod; the dashboard's own copy is sacred and untouched.
 */
import { QRCodeSVG } from "qrcode.react";
import { useLexicon } from "@/lib/lexicon-context";

export function QrMaxScreen({ url, code, title, subtitle, onClose, onCopyLink, copyLabel, testid = "qr-max-screen" }: {
  url: string; code: string; title: string; subtitle?: string; onClose: () => void; onCopyLink: () => void; copyLabel: string; testid?: string;
}) {
  const { t } = useLexicon();
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto bg-background px-4 animate-in fade-in duration-200" data-testid={testid} role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} aria-label={t("soi.pod.ui.max_close")} data-testid={`${testid}-close`}
        className="absolute right-4 top-4 min-h-[44px] min-w-[44px] rounded-full p-2 transition-colors hover:bg-accent">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <h2 className="mb-1 max-w-full break-words text-center text-2xl font-bold">{title}</h2>
      {subtitle && <p className="mb-6 text-center text-sm text-muted-foreground">{subtitle}</p>}
      <div className="rounded-2xl bg-white p-4 shadow-2xl"><QRCodeSVG value={url} size={Math.min(320, typeof window === "undefined" ? 320 : window.innerWidth - 96)} level="M" /></div>
      <p className="mt-6 font-mono text-4xl font-bold tracking-[0.3em] text-primary" data-testid={`${testid}-code`}>{code}</p>
      <p className="mt-4 max-w-full break-all text-center text-sm text-muted-foreground" data-testid={`${testid}-link`}>{url}</p>
      <button type="button" onClick={onCopyLink} data-testid={`${testid}-copy`} className="mt-3 min-h-[44px] rounded-md border border-border px-4 py-2 text-sm">{copyLabel}</button>
    </div>
  );
}
