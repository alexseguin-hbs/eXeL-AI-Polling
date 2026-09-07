"use client";

/**
 * Sign Doc — the whole flow on one component, two entrances:
 *   create      the creator uploads 1–5 PDFs, names the signers (themselves first), places a box on
 *               each file, draws, stamps, saves, and hands the baton to signer 2;
 *   countersign a link `?e=<token>&s=<secret>` opens the envelope; on their turn the signer places,
 *               draws, stamps; the last signature completes it and everyone downloads.
 * The baton: each signer receives the NEXT signer's secret exactly once, when they sign — the
 * server mints it (migration 036). Stamps are page-fraction boxes → lib/pdf-stamp. Every step's
 * explainer line changes with state (R-CORE gate block), and nothing here charges a fee.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { useThemeHue } from "@/lib/theme-hue";
import { newEnvelope, newToken, applySignature, chainHash, sha256Hex, shortHash, signLink, contactKind, MAX_FILE_BYTES, MAX_FILES, MAX_ENVELOPE_BYTES, type Envelope, type SignFile } from "@/lib/sign-envelope";
import { createEnvelope, getEnvelope, signEnvelope, storeMode, SignStoreError, type PublicEnvelope } from "@/lib/sign-store";
import { stampSignature, pageCount, type StampBox } from "@/lib/pdf-stamp";
import { bytesToBase64, base64ToBytes } from "@/lib/pdf-render";
import { SignaturePad } from "@/components/sign/signature-pad";
import { PdfPageView } from "@/components/sign/pdf-page-view";
import { Handoff } from "@/components/sign/handoff";

type Step = "upload" | "signers" | "place" | "draw" | "saving" | "handoff" | "done" | "error" | "loading" | "waiting" | "not_party";
interface Loaded { name: string; bytes: Uint8Array; base64: string; sha256: string; pages: number }

export function SignFlow({ token, secret, defaultName, defaultContact, seed }: {
  token?: string; secret?: string; defaultName?: string; defaultContact?: string;
  /** Create Doc hands a generated PDF in as file 1. */
  seed?: { name: string; bytes: Uint8Array } | null;
}) {
  const { t } = useLexicon();
  const hue = useThemeHue();
  const countersign = !!token;
  const [step, setStep] = useState<Step>(countersign ? "loading" : "upload");
  const [err, setErr] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<Loaded[]>([]);
  const [signers, setSigners] = useState<{ name: string; contact: string }[]>([{ name: defaultName ?? "", contact: defaultContact ?? "" }, { name: "", contact: "" }]);
  const [boxes, setBoxes] = useState<Record<number, StampBox>>({});
  const [fileIdx, setFileIdx] = useState(0);
  const [png, setPng] = useState<string | null>(null);
  const [pub, setPub] = useState<PublicEnvelope | null>(null);
  const [nextLink, setNextLink] = useState("");
  const [myLink, setMyLink] = useState("");                     // the creator's own return link — "yours, keep it" (Christo, wave 1)
  const [nextName, setNextName] = useState(""); const [nextContact, setNextContact] = useState("");
  const [signed, setSigned] = useState<{ name: string; bytes: Uint8Array }[]>([]);
  const envRef = useRef<Envelope | null>(null);
  const pendingToken = useRef("");                              // minted before stamping so the PDF can carry it
  const [localFallback, setLocalFallback] = useState(false);
  const mode = localFallback ? "local" : storeMode();

  // ── seed from Create Doc ─────────────────────────────────────────────────────
  useEffect(() => { if (seed) void addBytes(seed.name, seed.bytes); }, [seed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── countersign: open the envelope ───────────────────────────────────────────
  useEffect(() => {
    if (!countersign) return;
    let live = true;
    (async () => {
      try {
        const e = await getEnvelope(token!, secret ?? "");
        if (!live) return;
        setPub(e); setTitle(e.title);
        if (e.party < 0) { setStep("not_party"); return; }
        const fs: Loaded[] = (e.files ?? []).map((f) => { const b = base64ToBytes(f.pdf_base64); return { name: f.name, bytes: b, base64: f.pdf_base64, sha256: f.sha256, pages: f.page_count }; });
        setFiles(fs);
        if (e.status === "complete") { setSigned(fs.map((f) => ({ name: f.name, bytes: f.bytes }))); setStep("done"); return; }
        if (e.status !== "awaiting") { setErr(t(`soi.sign.status.${e.status}`)); setStep("error"); return; }
        setStep(e.current_signer_idx === e.party ? "place" : "waiting");
      } catch (ex) { if (live) { setErr(ex instanceof SignStoreError ? t(`soi.sign.err.${ex.code}`) : String(ex)); setStep("error"); } }
    })();
    return () => { live = false; };
  }, [countersign, token, secret]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── upload ───────────────────────────────────────────────────────────────────
  const addBytes = async (name: string, bytes: Uint8Array) => {
    if (bytes.length > MAX_FILE_BYTES) { setErr(t("soi.sign.err.file_too_large")); return; }
    if (files.reduce((n, f) => n + f.bytes.length, 0) + bytes.length > MAX_ENVELOPE_BYTES) { setErr(t("soi.sign.err.envelope_too_large")); return; }
    if (files.length >= MAX_FILES) { setErr(t("soi.sign.err.file_count")); return; }
    if (bytes.length < 5 || String.fromCharCode.apply(null, Array.from(bytes.slice(0, 5))) !== "%PDF-") { setErr(t("soi.sign.err.not_pdf")); return; }
    const [sha256, pages] = await Promise.all([sha256Hex(bytes), pageCount(bytes)]);
    setErr("");
    setFiles((fs) => [...fs, { name, bytes, base64: bytesToBase64(bytes), sha256, pages }]);
  };
  const onFiles = async (list: FileList | null) => { for (const f of Array.from(list ?? [])) await addBytes(f.name, new Uint8Array(await f.arrayBuffer())); };
  const removeFile = (i: number) => {
    setFiles((fs) => fs.filter((_, j) => j !== i));
    // re-key the boxes above the removed file, or file N+1 inherits file N's box (Enki, wave 2)
    setBoxes((b) => { const n: Record<number, StampBox> = {}; for (const [k, v] of Object.entries(b)) { const j = Number(k); if (j < i) n[j] = v; else if (j > i) n[j - 1] = v; } return n; });
  };

  // ── signers ──────────────────────────────────────────────────────────────────
  const setSigner = (i: number, patch: Partial<{ name: string; contact: string }>) => setSigners((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const signersOk = signers.every((s) => s.name.trim() && contactKind(s.contact)) && signers.length >= 1;
  const multi = signers.length > 1;

  // ── place + draw ─────────────────────────────────────────────────────────────
  const allPlaced = files.length > 0 && files.every((_, i) => !!boxes[i]);
  const myIdx = countersign ? (pub?.party ?? 0) : 0;
  const myName = countersign ? (pub?.signers[myIdx]?.name ?? "") : signers[0]?.name ?? "";

  // ── stamp + save ─────────────────────────────────────────────────────────────
  const sign = useCallback(async () => {
    if (!png || !allPlaced) return;
    setStep("saving"); setErr("");
    try {
      const isoDate = new Date().toISOString();
      const prevChain = countersign ? (pub?.chain ?? "") : "";
      if (!countersign && !pendingToken.current) pendingToken.current = newToken();
      const stamped: SignFile[] = [];
      const stampedBytes: { name: string; bytes: Uint8Array }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const out = await stampSignature(f.bytes, boxes[i], { pngDataUrl: png, name: myName, isoDate, hash: shortHash(prevChain || f.sha256), envelope: { token: countersign ? token! : pendingToken.current, chain: prevChain } });
        const sha = await sha256Hex(out);
        stamped.push({ name: f.name, page_count: f.pages, pdf_base64: bytesToBase64(out), sha256: sha, version: 0 });
        stampedBytes.push({ name: f.name, bytes: out });
      }
      const chain = await chainHash(prevChain, stamped.map((s) => s.sha256));
      let result: PublicEnvelope;
      if (!countersign) {
        const env = { ...newEnvelope({ title: title || files[0].name.replace(/\.pdf$/i, ""), created_by: signers[0].contact, signers, files: files.map((f) => ({ name: f.name, page_count: f.pages, pdf_base64: f.base64, sha256: f.sha256, version: 0 })) }), token: pendingToken.current };
        envRef.current = env;
        const created = await createEnvelope(env);
        if (created.mode === "local") setLocalFallback(true);
        const next = applySignature(env, 0, env.signers[0].secret, isoDate, stamped, chain);
        envRef.current = next;
        result = await signEnvelope(env.token, 0, env.signers[0].secret, stamped, chain, next);
      } else {
        result = await signEnvelope(token!, myIdx, secret!, stamped, chain);
      }
      setPub(result); setSigned(stampedBytes);
      if (result.status === "complete") { setStep("done"); return; }
      const nxt = result.signers[result.current_signer_idx];
      const nextSecret = result.next_secret ?? (envRef.current?.signers[result.current_signer_idx]?.secret ?? "");
      setNextName(nxt?.name ?? ""); setNextContact(countersign ? "" : signers[result.current_signer_idx]?.contact ?? "");
      setNextLink(signLink(window.location.origin, result.token, nextSecret));
      setMyLink(signLink(window.location.origin, result.token, countersign ? secret! : envRef.current?.signers[0]?.secret ?? ""));
      setStep("handoff");
    } catch (ex) {
      setErr(ex instanceof SignStoreError ? t(`soi.sign.err.${ex.code}`) : String((ex as Error).message ?? ex));
      setStep(countersign ? "place" : "draw");
    }
  }, [png, allPlaced, files, boxes, myName, countersign, pub, title, signers, token, secret, myIdx, t]);

  const download = (f: { name: string; bytes: Uint8Array }, final = true) => {
    const url = URL.createObjectURL(new Blob([f.bytes as BlobPart], { type: "application/pdf" }));
    // A half-signed file is named as such, so two downloads never look alike (Christo, wave 1).
    const a = document.createElement("a"); a.href = url; a.download = f.name.replace(/\.pdf$/i, "") + (final ? "-signed.pdf" : "-partly-signed.pdf"); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // ── the phase rail + one explainer line (R-CORE gate block) ──────────────────
  const rail = useMemo(() => {
    const keys = countersign ? ["open", "place", "draw", "sign", "done"] : ["upload", "signers", "place", "draw", "sign", "handoff"];
    const cur = step === "loading" || step === "waiting" || step === "not_party" ? "open" : step === "saving" ? "sign" : step === "done" ? (countersign ? "done" : "handoff") : step;
    return keys.map((k) => ({ k, on: k === cur, past: keys.indexOf(k) < keys.indexOf(cur) }));
  }, [step, countersign]);
  const explain = (() => {
    switch (step) {
      case "upload": return files.length ? t("soi.sign.x.upload_more") : t("soi.sign.x.upload");
      case "signers": return signersOk ? t("soi.sign.x.signers_ok") : t("soi.sign.x.signers");
      case "place": return allPlaced ? t("soi.sign.x.placed") : t("soi.sign.x.place");
      case "draw": return png ? t("soi.sign.x.drawn") : t("soi.sign.x.draw");
      case "saving": return t("soi.sign.saving");
      case "handoff": return t("soi.sign.x.handoff");
      case "done": return t("soi.sign.x.done");
      case "waiting": return `${t("soi.sign.turn_of")} ${pub?.signers[pub.current_signer_idx]?.name ?? "…"}`;
      case "not_party": return t("soi.sign.not_party");
      case "loading": return t("soi.sign.loading");
      default: return "";
    }
  })();

  const Roster = () => pub ? (
    <ol className="mt-2 grid gap-1 text-xs" data-testid="roster">
      {pub.signers.map((s, i) => (
        <li key={i} className="flex items-center justify-between rounded border border-border px-2 py-1">
          <span>{i + 1}. {s.name} <span className="text-muted-foreground">{s.contact_masked}</span>{s.me && <span className="ml-1 rounded bg-cyan-400/15 px-1 text-[10px]">{t("soi.sign.you")}</span>}</span>
          <span className={s.signed_at ? "text-green-500" : i === pub.current_signer_idx && pub.status === "awaiting" ? "text-cyan-400" : "text-muted-foreground"}>
            {s.signed_at ? `✓ ${t("soi.sign.signed")}` : i === pub.current_signer_idx && pub.status === "awaiting" ? (s.me ? t("soi.sign.turn_you") : t("soi.sign.turn_now")) : t("soi.sign.pending")}
          </span>
        </li>
      ))}
    </ol>
  ) : null;

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {/* rail */}
      <ol className="mb-3 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide" aria-label={t("soi.sign.steps_aria")}>
        {rail.map((r) => (
          <li key={r.k} className="rounded-full border px-2 py-0.5" style={{ borderColor: r.on ? hue.bright : r.past ? hue.dim : "var(--border)", color: r.on ? hue.bright : r.past ? hue.mid : "var(--muted-foreground)", background: r.on ? hue.faint : undefined }}>{t(`soi.sign.step.${r.k}`)}</li>
        ))}
      </ol>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{countersign ? (title || t("soi.sign.title")) : t("soi.sign.title")}</h2>
        {mode === "local" && <span className="rounded-full border border-amber-500/50 px-2 py-0.5 text-[10px] uppercase text-amber-500">{t("soi.sign.local_only")}</span>}
      </div>
      <p className="mb-4 text-sm text-cyan-400" data-testid="explain" aria-live="polite">{explain}</p>
      {err && <p className="mb-3 rounded-md border border-red-500/40 bg-red-500/5 p-2 text-xs text-red-500" data-testid="error">{err}</p>}

      {/* ── UPLOAD ── */}
      {step === "upload" && (
        <div>
          <label className="block">
            <span className="text-sm font-medium">{t("soi.sign.doc_title")}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("soi.sign.doc_title_ph")} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm" />
          </label>
          <label className="mt-3 flex min-h-[64px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-cyan-400/50 p-4 text-sm text-cyan-400">
            {t("soi.sign.upload")}
            <input type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} data-testid="file-input" />
          </label>
          <p className="mt-1 text-[11px] text-muted-foreground">{t("soi.sign.upload_hint")}</p>
          {files.length > 0 && (
            <ul className="mt-3 grid gap-1 text-sm" data-testid="file-list">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded border border-border px-2 py-1">
                  <span>{f.name} <span className="text-xs text-muted-foreground">· {f.pages} {t("soi.sign.pages")} · #{shortHash(f.sha256)}</span></span>
                  <button type="button" onClick={() => removeFile(i)} className="min-h-[44px] px-3 text-xs text-muted-foreground">✕</button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" disabled={!files.length} onClick={() => setStep("signers")} className="mt-4 min-h-[44px] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{t("soi.sign.next_signers")}</button>
        </div>
      )}

      {/* ── SIGNERS ── */}
      {step === "signers" && (
        <div>
          {signers.map((s, i) => (
            <div key={i} className="mb-2 rounded-md border border-border p-3">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-cyan-400">
                <span>{i === 0 ? t("soi.sign.me") : `${t("soi.sign.signer")} ${i + 1}`}</span>
                {i > 0 && <button type="button" onClick={() => setSigners((x) => x.filter((_, j) => j !== i))} className="min-h-[36px] px-2 text-muted-foreground" aria-label={t("soi.sign.remove_signer")}>✕</button>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={s.name} onChange={(e) => setSigner(i, { name: e.target.value })} placeholder={t("soi.sign.name_ph")} className="rounded-md border border-border bg-background px-2 py-2 text-sm" data-testid={`signer-name-${i}`} />
                <input value={s.contact} onChange={(e) => setSigner(i, { contact: e.target.value })} placeholder={t("soi.sign.contact_ph")} inputMode="email" className="rounded-md border border-border bg-background px-2 py-2 text-sm" data-testid={`signer-contact-${i}`} />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setSigners((x) => [...x, { name: "", contact: "" }])} className="min-h-[44px] text-sm text-cyan-400">+ {t("soi.sign.add_signer")}</button>
          {multi && mode === "local" && <p className="mt-2 text-xs text-amber-500">{t("soi.sign.err.no_backend")}</p>}
          {!multi && <p className="mt-2 text-xs text-muted-foreground">{t("soi.sign.solo_hint")}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setStep("upload")} className="min-h-[44px] rounded-md border border-border px-4 text-sm">{t("soi.sign.back")}</button>
            <button type="button" disabled={!signersOk || (multi && mode === "local")} onClick={() => setStep("place")} className="min-h-[44px] rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{t("soi.sign.next_place")}</button>
          </div>
        </div>
      )}

      {/* ── PLACE ── */}
      {step === "place" && files.length > 0 && (
        <div>
          {countersign && <Roster />}
          {files.length > 1 && (
            <div className="mt-2 mb-2 flex flex-wrap gap-1">
              {files.map((f, i) => (
                <button key={i} type="button" onClick={() => setFileIdx(i)} className="min-h-[44px] rounded-full border px-3 text-xs" style={{ borderColor: i === fileIdx ? hue.bright : boxes[i] ? hue.dim : "var(--border)" }}>{boxes[i] ? "✓ " : ""}{f.name}</button>
              ))}
            </div>
          )}
          <PdfPageView bytes={files[fileIdx].bytes} box={boxes[fileIdx] ?? null} onBox={(b) => setBoxes((x) => ({ ...x, [fileIdx]: b }))} preview={png} />
          <div className="mt-3 flex gap-2">
            {!countersign && <button type="button" onClick={() => setStep("signers")} className="min-h-[44px] rounded-md border border-border px-4 text-sm">{t("soi.sign.back")}</button>}
            <button type="button" disabled={!allPlaced} onClick={() => setStep("draw")} className="min-h-[44px] rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50" data-testid="to-draw">{t("soi.sign.next_draw")}</button>
          </div>
        </div>
      )}

      {/* ── DRAW ── */}
      {step === "draw" && (
        <div>
          <p className="mb-2 text-sm">{t("soi.sign.signing_as")} <strong>{myName}</strong></p>
          <SignaturePad onChange={setPng} />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setStep("place")} className="min-h-[44px] rounded-md border border-border px-4 text-sm">{t("soi.sign.back")}</button>
            <button type="button" disabled={!png} onClick={sign} className="min-h-[44px] rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50" data-testid="sign-button">{t("soi.sign.stamp")}</button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("soi.sign.consent")}</p>
        </div>
      )}

      {step === "saving" && <p className="text-sm text-muted-foreground">{t("soi.sign.saving")}</p>}

      {/* ── HANDOFF ── */}
      {step === "handoff" && (
        <div>
          <Roster />
          <div className="mt-3"><Handoff link={nextLink} sender={myName} title={pub?.title ?? title} nextName={nextName} nextContact={nextContact} /></div>
          {myLink && (
            <div className="mt-3 rounded-lg border border-border p-3 text-xs" data-testid="my-link">
              <div className="font-medium">{t("soi.sign.mylink.title")}</div>
              <p className="text-muted-foreground">{t("soi.sign.mylink.hint")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="break-all text-[11px] text-muted-foreground">{myLink}</code>
                <button type="button" onClick={() => { try { navigator.clipboard.writeText(myLink); } catch { /* no clipboard */ } }} className="min-h-[36px] rounded-md border border-border px-3 text-xs">{t("soi.sign.handoff.copy")}</button>
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">{signed.map((f) => <button key={f.name} type="button" onClick={() => download(f, false)} className="min-h-[44px] rounded-md border border-border px-3 text-sm">⤓ {f.name} · {t("soi.sign.partly")}</button>)}</div>
        </div>
      )}

      {/* ── WAITING / NOT PARTY ── */}
      {(step === "waiting" || step === "not_party") && <Roster />}

      {/* ── DONE ── */}
      {step === "done" && (
        <div>
          <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-3 text-sm">
            <div className="font-medium text-green-500">{t("soi.sign.complete")}</div>
            {/* The pod's receipt shape — recorded · witnessed · settles — so a signed document reads as one of eXeL's (Pangu). */}
            <ol className="mt-2 grid gap-1 rounded-md border border-border bg-background p-2 text-xs" data-testid="receipt-3">
              <li><span className="font-medium text-foreground">1 · {t("soi.pod.receipt.recorded")}</span> {signed.map((f) => f.name).join(" · ")}</li>
              <li><span className="font-medium text-foreground">2 · {t("soi.pod.receipt.witnessed")}</span> {(pub?.signers ?? []).map((s) => `${s.name}${s.signed_at ? " ✓" : " ✗"}`).join(" · ")}</li>
              <li><span className="font-medium text-foreground">3 · {t("soi.pod.receipt.settles")}</span> 웃 {(pub?.signers ?? []).length} {t("soi.sign.signatures")} · ◬ {t("soi.sign.chain")} <code>{pub?.chain ? shortHash(pub.chain) : "—"}</code></li>
            </ol>
          </div>
          <Roster />
          <div className="mt-3 flex flex-wrap gap-2" data-testid="downloads">{signed.map((f) => <button key={f.name} type="button" onClick={() => download(f)} className="min-h-[44px] rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">⤓ {t("soi.sign.download")} {f.name}</button>)}</div>
        </div>
      )}

      {step === "error" && <Roster />}
      <p className="mt-5 text-[11px] text-muted-foreground">{t("soi.sign.no_fee")}</p>
    </section>
  );
}
