"use client";

/**
 * /pdf-signer — the signer, open to anyone. No account and no login.
 * The file stays on the device unless the person chooses to send it.
 */
import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { SignFlow } from "@/components/sign/sign-flow";
import { useLexicon } from "@/lib/lexicon-context";
import { TrinityGlyphs } from "@/components/trinity-glyphs";
import { SoiGlobe } from "@/components/soi-globe";

const SIGNER_URL = "https://exel-ai-polling.explore-096.workers.dev/pdf-signer/";

export default function PdfSignerPage() {
  const { t } = useLexicon();
  const [qr, setQr] = useState(false);
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {qr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setQr(false)}>
          <div className="w-full max-w-xs rounded-xl bg-white p-4 text-center text-neutral-900" onClick={(e) => e.stopPropagation()} data-testid="pdf-signer-qr">
            <QRCodeSVG value={SIGNER_URL} size={220} level="M" />
            <p className="mt-3 break-all text-xs">{SIGNER_URL}</p>
            <button type="button" onClick={() => setQr(false)} className="mt-2 min-h-[44px] px-3 text-sm">Close</button>
          </div>
        </div>
      )}
      <header className="mb-6 text-center">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => setQr(true)} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground hover:text-primary" aria-label="QR code for PDF Signer" title="QR code" data-testid="pdf-signer-qr-open">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="10" y="10" width="2" height="2" />
              <rect x="13" y="10" width="2" height="2" />
              <rect x="10" y="13" width="2" height="2" />
              <rect x="13" y="13" width="2" height="2" />
              <rect x="3" y="3" width="2" height="2" fill="var(--background, #000)" />
              <rect x="11" y="3" width="2" height="2" fill="var(--background, #000)" />
              <rect x="3" y="11" width="2" height="2" fill="var(--background, #000)" />
            </svg>
          </button>
          <SoiGlobe />
        </div>
        <TrinityGlyphs size="text-2xl" className="mb-2" />
        <h1 className="text-lg font-semibold">PDF Signer</h1>
        <p className="mt-1 text-xs text-muted-foreground">Open to anyone. No login.</p>
        <Link href="/soi-session/" className="mt-1 inline-block text-xs text-muted-foreground hover:text-primary">&larr; {t("soi.landing.title")}</Link>
      </header>
      <SignFlow requireLogin={false} returnTo="/pdf-signer" />
    </div>
  );
}
