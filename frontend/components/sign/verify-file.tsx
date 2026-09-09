"use client";

/** Verify a signed PDF from the file alone — the receipt-3 printed from what the stamps recorded. */
import { useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { verifySignedPdf, type VerifyReport } from "@/lib/sign-verify";
import { cacStamp } from "@/lib/pdf-stamp";
import { readTz } from "@/lib/timezone";
import { shortHash } from "@/lib/sign-envelope";
import { SignReceipt } from "@/components/sign/receipt";

/** The issue codes sign-verify emits, each with a sentence of its own; `row_N_chain` carries the row in {n}. */
const ISSUE_KEYS = new Set(["no_signatures", "images_vs_boxes", "passes_vs_signatures", "rows_vs_signatures", "row_malformed"]);

export function VerifyFile() {
  const { t } = useLexicon();
  const [r, setR] = useState<VerifyReport | null>(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setR(null);
    try { setR(await verifySignedPdf(f.name, new Uint8Array(await f.arrayBuffer()))); }
    catch (e) { setR({ name: f.name, sha256: "", images: 0, boxes: 0, texts: 0, rows: [], passes: [], chain: "", envelopes: 0, issues: [String((e as Error).message ?? e)], ok: false }); }
    finally { setBusy(false); }
  };
  // a code becomes a sentence; anything else (an exception's text) is kept, folded away, never shown raw on the line
  const issueText = (code: string): string | null => {
    if (ISSUE_KEYS.has(code)) return t(`soi.sign.verify.issue.${code}`);
    const m = /^row_(\d+)_chain$/.exec(code); if (m) return t("soi.sign.verify.issue.row_chain").replace("{n}", m[1]);
    return null;
  };
  const known = (r?.issues ?? []).map(issueText).filter((s): s is string => !!s);
  const unknown = (r?.issues ?? []).filter((c) => issueText(c) === null);
  const signerName = (x: { rowIndex: number; name?: string }) => x.name ?? t("soi.sign.signer_n").replace("{n}", String(x.rowIndex + 1));
  return (
    <div className="rounded-lg border border-border p-3 text-xs" data-testid="verify-file">
      <div className="font-medium">{t("soi.sign.verify.title")}</div>
      <p className="text-muted-foreground">{t("soi.sign.verify.hint")}</p>
      <label className="mt-2 flex min-h-[44px] cursor-pointer items-center justify-center rounded-md border border-dashed border-primary/50 px-3 text-primary">
        {busy ? t("soi.sign.verify.reading") : t("soi.sign.verify.drop")}
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} data-testid="verify-input" />
      </label>
      {r && (
        <div className={`mt-2 rounded-md border p-2 ${r.ok ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`} data-testid="verify-result" data-ok={r.ok ? "1" : "0"}>
          <div className={`font-medium ${r.ok ? "text-green-500" : "text-red-500"}`}>
            {r.ok ? t("soi.sign.verify.ok") : r.images === 0 ? t("soi.sign.verify.none") : t("soi.sign.verify.bad")}{!r.ok && r.images > 0 && known.length > 0 && <span className="ml-1 font-normal text-muted-foreground" data-testid="verify-issues">({known.join(", ")})</span>}
          </div>
          {!r.ok && unknown.length > 0 && (
            <details className="mt-1 text-muted-foreground" data-testid="verify-issues-other"><summary className="cursor-pointer">{t("soi.sign.verify.issue.other")}</summary><p className="mt-1 break-words">{unknown.join(" · ")}</p></details>
          )}
          {r.images > 0 && (
            <SignReceipt className="mt-1" files={[`${r.name} · #${shortHash(r.sha256)}`]} signers={r.rows.map((x) => ({ name: signerName(x as { rowIndex: number; name?: string }), signed: true, stamp: cacStamp(x.isoDate, readTz()) }))} count={r.images} chain={r.chain} />
          )}
        </div>
      )}
    </div>
  );
}
