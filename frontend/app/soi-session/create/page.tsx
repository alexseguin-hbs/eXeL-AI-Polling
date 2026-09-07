"use client";

/**
 * Create Doc — write a document (or start from the promissory-note template), see it as a PDF,
 * then send it into Sign Doc as file 1. Everything renders client-side with lib/doc-pdf.ts; the
 * PDF crosses to /soi-session/sign through sessionStorage (`exel-sign-seed`). No fees.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLexicon } from "@/lib/lexicon-context";
import { useThemeHue } from "@/lib/theme-hue";
import { buildDocPdf, promissoryNote, solvePayment, usd, type DocSpec } from "@/lib/doc-pdf";
import { bytesToBase64 } from "@/lib/pdf-render";

type Mode = "write" | "note";

export default function CreateDocPage() {
  const { t } = useLexicon();
  const hue = useThemeHue();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("write");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [signers, setSigners] = useState("");
  const [f, setF] = useState({ lender: "", borrower: "", principal: "", apr: "", months: "", payment: "", firstPayment: "", method: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState<{ pages: number; bytes: Uint8Array; name: string } | null>(null);

  useEffect(() => { setPreview(null); }, [mode, title, body, signers, f]);

  const principal = Number(f.principal) || 0, apr = Number(f.apr) || 0, months = Math.max(0, Math.round(Number(f.months) || 0));
  const solved = principal > 0 && months > 0 ? solvePayment(principal, apr, months) : 0;
  const payment = Number(f.payment) || solved;
  const note = useMemo(() => {
    if (!(principal > 0 && months > 0 && f.firstPayment && f.lender && f.borrower)) return null;
    try { return promissoryNote({ lender: f.lender, borrower: f.borrower, principal, apr, months, payment: payment || undefined, firstPayment: f.firstPayment, method: f.method || undefined }); } catch { return null; }
  }, [f, principal, apr, months, payment]);

  const spec = (): DocSpec | null => {
    if (mode === "note") return note?.spec ?? null;
    if (!title.trim() || !body.trim()) return null;
    const ss = signers.split(/\n/).map((s) => s.trim()).filter(Boolean).map((s) => { const [role, name] = s.includes(":") ? s.split(":").map((x) => x.trim()) : ["", s]; return { role: role || t("soi.doc.signer"), name }; });
    return { title: title.trim(), header: title.trim(), body: body.trim(), signers: ss, footer: t("soi.doc.footer") };
  };
  const canGenerate = !!spec();

  const generate = async () => {
    const s = spec(); if (!s) return;
    setBusy(true); setErr("");
    try {
      const bytes = await buildDocPdf(s);
      const { pageCount } = await import("@/lib/pdf-stamp");
      setPreview({ bytes, pages: await pageCount(bytes), name: s.title.replace(/[^\w.-]+/g, "_").slice(0, 60) + ".pdf" });
    } catch (e) { setErr(String((e as Error).message ?? e)); }
    setBusy(false);
  };
  const toSign = () => {
    if (!preview) return;
    sessionStorage.setItem("exel-sign-seed", JSON.stringify({ name: preview.name, base64: bytesToBase64(preview.bytes) }));
    router.push("/soi-session/sign/?from=create");
  };
  const download = () => {
    if (!preview) return;
    const url = URL.createObjectURL(new Blob([preview.bytes as BlobPart], { type: "application/pdf" }));
    const a = document.createElement("a"); a.href = url; a.download = preview.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const field = (k: keyof typeof f, label: string, extra: Record<string, unknown> = {}) => (
    <label className="block text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm" data-testid={`note-${k}`} {...extra} />
    </label>
  );
  const rowsPreview = note ? [...note.rows.slice(0, 3), ...(note.rows.length > 4 ? [null] : []), note.rows[note.rows.length - 1]] : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 text-center">
        <div className="mb-2 font-mono text-2xl tracking-[0.3em]" aria-hidden="true">
          <span style={{ color: hue.bright }}>&#9708;</span>{" "}
          <span style={{ color: hue.bright }}>&#9825;</span>{" "}
          <span style={{ color: hue.bright }}>&#50883;</span>
        </div>
        <Link href="/soi-session/" className="text-xs text-muted-foreground hover:text-cyan-400">&larr; {t("soi.landing.title")}</Link>
      </header>
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">{t("soi.doc.title")}</h2>
        <p className="mt-1 text-sm text-cyan-400">{preview ? t("soi.doc.x.ready") : canGenerate ? t("soi.doc.x.generate") : mode === "note" ? t("soi.doc.x.note") : t("soi.doc.x.write")}</p>
        <div className="mt-3 flex gap-2">
          {(["write", "note"] as Mode[]).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className="min-h-[44px] rounded-full border px-4 text-sm" style={{ borderColor: mode === m ? hue.bright : "var(--border)", color: mode === m ? hue.bright : undefined, background: mode === m ? hue.faint : undefined }}>{t(`soi.doc.mode.${m}`)}</button>
          ))}
        </div>

        {mode === "write" && (
          <div className="mt-4 grid gap-3">
            <label className="block text-xs"><span className="font-medium text-muted-foreground">{t("soi.doc.field.title")}</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm" data-testid="doc-title" /></label>
            <label className="block text-xs"><span className="font-medium text-muted-foreground">{t("soi.doc.field.body")}</span>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder={t("soi.doc.body_ph")} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm" data-testid="doc-body" /></label>
            <label className="block text-xs"><span className="font-medium text-muted-foreground">{t("soi.doc.field.signers")}</span>
              <textarea value={signers} onChange={(e) => setSigners(e.target.value)} rows={2} placeholder={t("soi.doc.signers_ph")} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm" /></label>
          </div>
        )}

        {mode === "note" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {field("lender", t("soi.doc.f.lender"))}
            {field("borrower", t("soi.doc.f.borrower"))}
            {field("principal", t("soi.doc.f.principal"), { inputMode: "decimal", placeholder: "11049.00" })}
            {field("apr", t("soi.doc.f.apr"), { inputMode: "decimal", placeholder: "11.35" })}
            {field("months", t("soi.doc.f.term"), { inputMode: "numeric", placeholder: "42" })}
            {field("payment", `${t("soi.doc.f.payment")}${solved ? ` (${usd(solved)})` : ""}`, { inputMode: "decimal", placeholder: solved ? String(solved) : "" })}
            {field("firstPayment", t("soi.doc.f.first_date"), { type: "date" })}
            {field("method", t("soi.doc.f.method"), { placeholder: "Venmo / Zelle / ACH" })}
            {note && (
              <div className="sm:col-span-2 overflow-x-auto rounded-md border border-border p-2 text-[11px]">
                <div className="mb-1 font-medium">{t("soi.doc.amort")} · {usd(note.payment)} × {note.rows.length}</div>
                <table className="w-full"><thead><tr className="text-muted-foreground"><th className="text-left">#</th><th className="text-left">{t("soi.doc.col.date")}</th><th className="text-right">{t("soi.doc.col.interest")}</th><th className="text-right">{t("soi.doc.col.principal")}</th><th className="text-right">{t("soi.doc.col.ending")}</th></tr></thead>
                  <tbody>{rowsPreview.map((r, i) => r ? <tr key={r.n}><td>{r.n}</td><td>{r.date}</td><td className="text-right">{usd(r.interest)}</td><td className="text-right">{usd(r.principal)}</td><td className="text-right">{usd(r.end)}</td></tr> : <tr key={`gap-${i}`}><td colSpan={5} className="text-center text-muted-foreground">…</td></tr>)}</tbody></table>
              </div>
            )}
          </div>
        )}

        {err && <p className="mt-3 text-xs text-red-500">{err}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={!canGenerate || busy} onClick={generate} className="min-h-[44px] rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50" data-testid="generate">{busy ? t("soi.doc.generating") : t("soi.doc.generate")}</button>
          {preview && <>
            <span className="self-center text-xs text-muted-foreground" data-testid="preview">{preview.name} · {preview.pages} {t("soi.sign.pages")}</span>
            <button type="button" onClick={download} className="min-h-[44px] rounded-md border border-border px-4 text-sm">⤓ {t("soi.sign.download")}</button>
            <button type="button" onClick={toSign} className="min-h-[44px] rounded-md border px-4 text-sm font-medium" style={{ borderColor: hue.bright, color: hue.bright }} data-testid="to-sign">{t("soi.doc.to_sign")}</button>
          </>}
        </div>
        <p className="mt-5 text-[11px] text-muted-foreground">{t("soi.doc.note")}</p>
      </section>
    </div>
  );
}
