"use client";

/** Verify a signed PDF from the file alone — the receipt-3 printed from what the stamps recorded. */
import { useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { verifySignedPdf, type VerifyReport } from "@/lib/sign-verify";
import { cacStamp } from "@/lib/pdf-stamp";
import { shortHash } from "@/lib/sign-envelope";

export function VerifyFile() {
  const { t } = useLexicon();
  const [r, setR] = useState<VerifyReport | null>(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setR(null);
    try { setR(await verifySignedPdf(f.name, new Uint8Array(await f.arrayBuffer()))); }
    catch (e) { setR({ name: f.name, sha256: "", images: 0, boxes: 0, texts: 0, rows: [], passes: [], chain: "", issues: [String((e as Error).message ?? e)], ok: false }); }
    finally { setBusy(false); }
  };
  return (
    <div className="rounded-lg border border-border p-3 text-xs" data-testid="verify-file">
      <div className="font-medium">{t("soi.sign.verify.title")}</div>
      <p className="text-muted-foreground">{t("soi.sign.verify.hint")}</p>
      <label className="mt-2 flex min-h-[44px] cursor-pointer items-center justify-center rounded-md border border-dashed border-cyan-400/50 px-3 text-cyan-400">
        {busy ? t("soi.sign.verify.reading") : t("soi.sign.verify.drop")}
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} data-testid="verify-input" />
      </label>
      {r && (
        <div className={`mt-2 rounded-md border p-2 ${r.ok ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`} data-testid="verify-result" data-ok={r.ok ? "1" : "0"}>
          <div className={`font-medium ${r.ok ? "text-green-500" : "text-red-500"}`}>
            {r.ok ? t("soi.sign.verify.ok") : r.images === 0 ? t("soi.sign.verify.none") : t("soi.sign.verify.bad")}{!r.ok && r.images > 0 && <span className="ml-1 font-normal text-muted-foreground">({r.issues.join(", ")})</span>}
          </div>
          {r.images > 0 && (
            <ol className="mt-1 grid gap-1">
              <li><span className="font-medium text-foreground">1 · {t("soi.pod.receipt.recorded")}</span> {r.name} · #{shortHash(r.sha256)}</li>
              <li><span className="font-medium text-foreground">2 · {t("soi.pod.receipt.witnessed")}</span> {r.rows.map((x) => `${t("soi.sign.verify.signer")} ${x.rowIndex + 1} · ${cacStamp(x.isoDate)}`).join(" · ")}</li>
              <li><span className="font-medium text-foreground">3 · {t("soi.pod.receipt.settles")}</span> 웃 {r.images} {t("soi.sign.signatures")} · ◬ {t("soi.sign.chain")} <code>{r.chain ? shortHash(r.chain) : "—"}</code></li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
