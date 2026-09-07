"use client";

// Placeholder while the flow lands in the following commits — never a dead link from the landing.
import Link from "next/link";
import { useLexicon } from "@/lib/lexicon-context";

export default function Page() {
  const { t } = useLexicon();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/soi-session/" className="text-sm text-cyan-400">&larr; {t("soi.landing.title")}</Link>
      <h1 className="mt-4 text-2xl font-semibold">{t("soi.landing.btn.create")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Write a document or start from a template, then send it for signature. This door opens in the next commits of this build (C8).</p>
    </div>
  );
}
