"use client";

/**
 * /pdf-signer — the signer, open to anyone. No account and no login.
 * The file stays on the device unless the person chooses to send it.
 */
import Link from "next/link";
import { SignFlow } from "@/components/sign/sign-flow";
import { useLexicon } from "@/lib/lexicon-context";
import { TrinityGlyphs } from "@/components/trinity-glyphs";
import { SoiGlobe } from "@/components/soi-globe";

export default function PdfSignerPage() {
  const { t } = useLexicon();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 text-center">
        <div className="mb-2 flex justify-end"><SoiGlobe /></div>
        <TrinityGlyphs size="text-2xl" className="mb-2" />
        <h1 className="text-lg font-semibold">PDF Signer</h1>
        <p className="mt-1 text-xs text-muted-foreground">Open to anyone. No login.</p>
        <Link href="/soi-session/" className="mt-1 inline-block text-xs text-muted-foreground hover:text-primary">&larr; {t("soi.landing.title")}</Link>
      </header>
      <SignFlow requireLogin={false} returnTo="/pdf-signer" />
    </div>
  );
}
