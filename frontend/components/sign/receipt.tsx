"use client";

/**
 * ONE receipt for a signed document — the pod's three lines (recorded · witnessed · settles) — rendered by the Done panel
 * and by the verifier alike, so one document read twice gives one shape (fleet pass 2, Aset / Christo):
 *   1 · recorded   the file(s), with the hash when known
 *   2 · witnessed  every signer: name ✓ time (or ✗ when the row is still open)
 *   3 · settles    웃 {n} signatures · ◬ chain #hash
 */
import { useLexicon } from "@/lib/lexicon-context";
import { shortHash } from "@/lib/sign-envelope";

export interface ReceiptSigner { name: string; /** the receipt's fixed UTC form (cacStamp) when signed */ stamp?: string; signed: boolean }

export function SignReceipt({ files, signers, count, chain, className = "" }: { files: string[]; signers: ReceiptSigner[]; count: number; chain?: string | null; className?: string }) {
  const { t } = useLexicon();
  const sigs = t("soi.sign.signatures"); const line3 = sigs.includes("{n}") ? sigs.replace("{n}", String(count)) : `${count} ${sigs}`;
  return (
    <ol className={`mt-2 grid gap-1 rounded-md border border-border bg-background p-2 text-xs ${className}`} data-testid="receipt-3">
      <li><span className="font-medium text-foreground">1 · {t("soi.pod.receipt.recorded")}</span> {files.join(" · ")}</li>
      <li><span className="font-medium text-foreground">2 · {t("soi.pod.receipt.witnessed")}</span> {signers.map((s) => `${s.name} ${s.signed ? "✓" : "✗"}${s.signed && s.stamp ? ` ${s.stamp}` : ""}`).join(" · ")}</li>
      <li><span className="font-medium text-foreground">3 · {t("soi.pod.receipt.settles")}</span> 웃 {line3} · ◬ {t("soi.sign.chain")} <code>{chain ? shortHash(chain) : "—"}</code></li>
    </ol>
  );
}
