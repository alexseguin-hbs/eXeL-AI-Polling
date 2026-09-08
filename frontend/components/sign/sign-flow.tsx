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
 * Never silent (operator 2026-09-07, "I still cannot sign"): every failure names its step, a hanging
 * save is bounded and reported, the page diagnoses itself (SignDiag), and the login — when the site
 * has one — is asked at "Sign & save", the draft riding across the redirect in sessionStorage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowRight } from "lucide-react";
import { SIGN_STEPS, CREATOR_STEPS, COUNTERSIGN_STEPS, AI_GLYPH, type SignStep } from "@/lib/sign-steps";
import { useLexicon } from "@/lib/lexicon-context";
import { useThemeHue } from "@/lib/theme-hue";
import { newEnvelope, newToken, applySignature, chainHash, sha256Hex, shortHash, signLink, contactKind, handoffMessage, normalizeContact, MAX_FILE_BYTES, MAX_FILES, MAX_ENVELOPE_BYTES, type Envelope, type SignFile } from "@/lib/sign-envelope";
import { createEnvelope, getEnvelope, signEnvelope, storeMode, SignStoreError, type PublicEnvelope, type StoreMode } from "@/lib/sign-store";
import { stampSignature, stampText, stampCodexBlock, stampHolders, holders as readHolders, codexRows, pageCount, initialsOf, type Holder, initialsRowFrac, initialsSlotWidths } from "@/lib/pdf-stamp";
import { initialsSlotTop, partnerRule } from "@/lib/sign-layout";
import { fitToUnderline, type Bitmap } from "@/lib/sign-fit";
import { openPdf, renderPage } from "@/lib/pdf-render";
import { putTempFile, type TempLink } from "@/lib/tmpfile";
import { aiStatus, aiPlace, anyAi, type AiConfigured, type AiProvider } from "@/lib/ai";
import { codexAllText, codexImage } from "@/lib/codex-pdf";
import { bytesToBase64, base64ToBytes } from "@/lib/pdf-render";
/** A page as a PNG data URL at 612 px wide — what the AI placement looks at. */
async function pageDataUrl(bytes: Uint8Array, n: number): Promise<string> { const doc = await openPdf(bytes); const r = await renderPage(doc, n, 306); return r.canvas.toDataURL("image/png"); }
/** A page as pixels, rendered off-screen at half width (the fit and the layout read fractions), with its size in points. */
async function pageBitmap(bytes: Uint8Array, n: number): Promise<Bitmap & { widthPt: number; heightPt: number }> {
  const doc = await openPdf(bytes); const r = await renderPage(doc, n, 306);
  const d = r.canvas.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, r.canvas.width, r.canvas.height);
  return { width: d.width, height: d.height, data: d.data, widthPt: r.widthPt, heightPt: r.heightPt };
}
// The PDF core's optional helpers, consumed defensively while they land (reviewer 2026-09-08): the initials row's width
// fraction for the slot scan, and the initials-slot widths it is computed from.
/** The caption under a signature box, in points — the slot scan must clear it too (pdf-stamp draws it under the image). */
const CAPTION_PT = 12;
/** The initials slot's own height as a page fraction (initialsSlotTop's hFrac default). */
const SLOT_H_FRAC = 0.018;
/** The rail step a flow state lights: an error keeps the LAST real step lit (reviewer 2026-09-08). */
const railOf = (step: string): SignStep | null => step === "loading" || step === "waiting" || step === "not_party" ? "open" : step === "saving" || step === "login" ? "sign" : step === "error" ? null : (step as SignStep);
/** A date in the Globe's language, never the browser's (reviewer 2026-09-08); Latin digits: the PDF font has no others (fleet). */
const dateIn = (locale: string, d: Date, opts: Intl.DateTimeFormatOptions, time = false): string => {
  const f = time ? (l?: string, o?: Intl.DateTimeFormatOptions) => d.toLocaleString(l, o) : (l?: string, o?: Intl.DateTimeFormatOptions) => d.toLocaleDateString(l, o);
  try { return f(locale || undefined, { ...opts, numberingSystem: "latn" } as Intl.DateTimeFormatOptions); } catch { try { return f(locale || undefined, opts); } catch { return f(undefined, opts); } }
};
import { SignaturePad } from "@/components/sign/signature-pad";
import { PdfPageView, SIG_W, SIG_H, TXT_W, TXT_H, type Mark, type FitAt } from "@/components/sign/pdf-page-view";
import { Handoff } from "@/components/sign/handoff";
import { SignDiag, type AuthState } from "@/components/sign/sign-diag";
import { IconDownload } from "@/components/download-icon";
import { VerifyFile } from "@/components/sign/verify-file";

type Step = "upload" | "signers" | "place" | "draw" | "login" | "saving" | "handoff" | "done" | "error" | "loading" | "waiting" | "not_party";
interface Loaded { name: string; bytes: Uint8Array; base64: string; sha256: string; pages: number }

/** The creator's draft — kept on this device across a login redirect or a reload (Enki's gap, wave 2). */
export const DRAFT_KEY = "exel-sign-draft";
interface Draft { title: string; files: { name: string; base64: string }[]; signers: { name: string; contact: string }[]; marks: Record<number, Mark[]>; png: string | null; initialsPng?: string | null; token: string }
const readDraft = (): Draft | null => { try { const raw = sessionStorage.getItem(DRAFT_KEY); return raw ? (JSON.parse(raw) as Draft) : null; } catch { return null; } };
/** Best effort — a draft over the storage quota is simply not kept; the page still works. */
const keepDraft = (d: Draft): boolean => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); return true; } catch { return false; } };
const dropDraft = () => { try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage unreadable */ } };

/** Two signers named on a build without a shared store: the hand-off cannot be minted — say why. */
const multiLocal = (signers: number, mode: string, step: Step) => signers > 1 && mode === "local" && step === "signers";

export function SignFlow({ token, secret, defaultName, defaultContact, seed, fileLink, requireLogin, returnTo }: {
  token?: string; secret?: string; defaultName?: string; defaultContact?: string;
  /** Create Doc hands a generated PDF in as file 1; a 24-hour link (?f=) hands a partly-signed one in the same way. */
  seed?: { name: string; bytes: Uint8Array } | null;
  /** The ?f= token: this reader is a hand-off RECIPIENT — no account, the offline path (the file travels on), never the creator's login. */
  fileLink?: string;
  /** The site has Auth0: ask for the login at "Sign & save" (creator path only). */
  requireLogin?: boolean; returnTo?: string;
}) {
  const { t, activeLocale } = useLexicon();
  const hue = useThemeHue();
  const countersign = !!token;
  const handCarried = !!fileLink;                                          // a ?f= recipient signs like the offline hand-off: local envelope, no login
  const needLogin = !!requireLogin && !handCarried;
  const [step, setStep] = useState<Step>(countersign ? "loading" : "upload");
  const [err, setErr] = useState("");
  const [failStage, setFailStage] = useState<"" | "open" | "stamp" | "create" | "save">("");   // the phase the last failure happened in
  const lastRail = useRef<SignStep>(countersign ? "open" : "upload");                             // the last real step, kept lit through an error
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<Loaded[]>([]);
  const [signers, setSigners] = useState<{ name: string; contact: string; signed?: boolean }[]>([{ name: defaultName ?? "", contact: defaultContact ?? "" }, { name: "", contact: "" }]);
  const [marks, setMarks] = useState<Record<number, Mark[]>>({});      // per file: one "sig" + any text marks
  const [selected, setSelected] = useState<string | null>(null);
  const [viewedPage, setViewedPage] = useState(1);            // + Date / + Text land on the page being looked at (Enki)
  const [fileIdx, setFileIdx] = useState(0);
  const [png, setPng] = useState<string | null>(null);
  const [initialsPng, setInitialsPng] = useState<string | null>(null);   // the PHYSICAL initials, drawn once, stamped bottom-right of every page (operator 00:50)
  const [holdersFor, setHoldersFor] = useState("");                        // the next signer's name once placeholders were left for them
  const [tmpLink, setTmpLink] = useState<TempLink | null>(null);           // the 24-hour file link, when the site has a store
  // AI placement (operator 01:25): OpenAI / Gemini / Grok through the Worker, keys never in the page; the pixel fit stays the fallback
  const [ai, setAi] = useState<AiConfigured>({ openai: false, gemini: false, grok: false });
  const [aiProvider, setAiProvider] = useState<AiProvider>("auto");
  const [aiState, setAiState] = useState<"" | "busy" | "placed" | "none" | "failed">("");
  useEffect(() => { void aiStatus().then(setAi); }, []);
  const aiFind = async () => {
    if (!files[fileIdx]) return;
    setAiState("busy"); setErr("");
    try {
      const r = await aiPlace(await pageDataUrl(files[fileIdx].bytes, viewedPage), myName, aiProvider);
      if (!r) { setAiState("failed"); return; }
      if (!r.result) { setAiState("none"); return; }
      const b = r.result;
      const sig: Mark = { id: "sig", kind: "sig", page: viewedPage, x: b.x, y: b.y + b.h - Math.max(0.02, b.h), w: Math.max(0.08, b.w), h: Math.max(0.02, b.h), fit: "ai" as Mark["fit"] };   // a short box grows upward: the baseline stays
      const date: Mark[] = b.date ? [{ id: `t${Date.now().toString(36)}`, kind: "text", page: viewedPage, x: b.date.x, y: b.date.y, w: Math.max(0.05, b.date.w), h: Math.max(0.01, b.date.h), text: todayText(), fit: "ai" as Mark["fit"] }] : [];
      setMarks((m) => ({ ...m, [fileIdx]: [sig, ...date, ...(m[fileIdx] ?? []).filter((k) => k.kind === "text" && !date.length)] })); setSelected("sig"); setAiState("placed");
    } catch (e) { setAiState("failed"); setErr(`${t("soi.sign.ai.title")}: ${String((e as Error).message ?? e)}`); }
  };
  const [pub, setPub] = useState<PublicEnvelope | null>(null);
  const [nextLink, setNextLink] = useState("");
  const [myLink, setMyLink] = useState("");                     // the creator's own return link — "yours, keep it" (Christo, wave 1)
  const [nextName, setNextName] = useState(""); const [nextContact, setNextContact] = useState("");
  const [signed, setSigned] = useState<{ name: string; bytes: Uint8Array }[]>([]);
  const envRef = useRef<Envelope | null>(null);
  const pendingToken = useRef("");                              // minted before stamping so the PDF can carry it
  const fitRef = useRef<FitAt | null>(null);                    // the page view's pixel fit, for + Date / + Text
  const [localFallback, setLocalFallback] = useState(false);
  const mode = localFallback ? "local" : storeMode();
  // the offline hand-off: no link could be minted (no Supabase / no 036) — the partly-signed file travels by hand
  const [offline, setOffline] = useState<"" | "no_backend" | "no_migration">("");
  // Outside an Auth0Provider this is the library's inert default context — it is only ACTED on when requireLogin.
  const auth = useAuth0();
  const loggedIn = needLogin && auth.isAuthenticated;
  const authState: AuthState = needLogin ? (loggedIn ? "in" : "guarded") : "bypassed";
  const [diagOpen, setDiagOpen] = useState(false);
  const [resumed, setResumed] = useState(false);
  const snapshot = (): Draft => ({ title, files: files.map((f) => ({ name: f.name, base64: f.base64 })), signers, marks, png, initialsPng, token: pendingToken.current });
  const login = () => { keepDraft(snapshot()); setStep("login"); void auth.loginWithRedirect({ appState: { returnTo: returnTo ?? window.location.pathname } }); };

  // ── login prefill (never over what was typed) + draft restore + never-silent guards ──────────
  useEffect(() => {
    const u = auth.user; if (!u || countersign) return;
    setSigners((s) => s.map((x, i) => (i === 0 ? { name: x.name || (u.name && !u.name.includes("@") ? u.name : ""), contact: x.contact || u.email || "" } : x)));
  }, [auth.user, countersign]);
  useEffect(() => {
    if (countersign) return;
    const d = readDraft(); if (!d || !d.files.length) return;
    (async () => {                                             // idempotent, so a strict-mode double run restores the same draft
      const fs: Loaded[] = [];
      for (const f of d.files) { const b = base64ToBytes(f.base64); fs.push({ name: f.name, bytes: b, base64: f.base64, sha256: await sha256Hex(b), pages: await pageCount(b) }); }
      setTitle(d.title); setFiles(fs); setSigners(d.signers.length ? d.signers : [{ name: "", contact: "" }]); setMarks(d.marks ?? {}); setPng(d.png ?? null); setInitialsPng(d.initialsPng ?? null); pendingToken.current = d.token ?? "";
      setStep(d.png ? "draw" : "place"); setResumed(true); dropDraft();
    })();
  }, [countersign]);
  // the draft is kept from the draw step on (files, signers, boxes, stroke) — a reload comes back to it
  useEffect(() => { if (!countersign && step === "draw" && files.length) keepDraft(snapshot()); }, [step, png]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (err) setDiagOpen(true); }, [err]);                                            // any error opens the diagnosis
  useEffect(() => { if (multiLocal(signers.length, mode, step)) setDiagOpen(true); }, [signers.length, mode, step]);
  useEffect(() => {                                                                                    // 30-s watchdog: the page says so instead of hanging
    if (step !== "saving") return;
    const id = setTimeout(() => setErr(t("soi.sign.err.slow")), 30_000);
    return () => clearTimeout(id);
  }, [step, t]);

  // ── seed from Create Doc / a ?f= file link ───────────────────────────────────
  // once per seed object, and never over a draft being restored (the draft already holds the file — reviewer 2026-09-08)
  const seededRef = useRef<{ name: string; bytes: Uint8Array } | null>(null);
  useEffect(() => { if (seed && seededRef.current !== seed) { seededRef.current = seed; if (!(readDraft()?.files.length)) void addBytes(seed.name, seed.bytes); } }, [seed]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (e.party >= 0) { const pre = await preplaced(fs, e.party); if (Object.keys(pre).length) setMarks(pre); }
        if (e.status === "complete") { setSigned(fs.map((f) => ({ name: f.name, bytes: f.bytes }))); setStep("done"); return; }
        if (e.status !== "awaiting") { setErr(t(`soi.sign.status.${e.status}`)); setFailStage("open"); setStep("error"); return; }
        setStep(e.current_signer_idx === e.party ? "place" : "waiting");
      } catch (ex) { if (live) { setErr(`${t("soi.sign.stage.open")}: ${ex instanceof SignStoreError ? t(`soi.sign.err.${ex.code}`) : String((ex as Error).message ?? ex)}`); setFailStage("open"); setStep("error"); } }
    })();
    return () => { live = false; };
  }, [countersign, token, secret]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── waiting for another signer: the roster refreshes by itself (reviewer 2026-09-08) ──────────
  // on return to the tab, every 20 s, and on "Check again" — a turn that came while the phone slept is not missed
  const [checking, setChecking] = useState(false);
  const refreshEnvelope = useCallback(async () => {
    if (!countersign || checking) return;
    setChecking(true);
    try {
      const e = await getEnvelope(token!, secret ?? "");
      setPub(e);
      if (e.status === "complete") { setSigned(files.map((f) => ({ name: f.name, bytes: f.bytes }))); setStep("done"); return; }
      if (e.status === "awaiting" && e.current_signer_idx === e.party && e.party >= 0) {
        const fs: Loaded[] = (e.files ?? []).map((f) => { const b = base64ToBytes(f.pdf_base64); return { name: f.name, bytes: b, base64: f.pdf_base64, sha256: f.sha256, pages: f.page_count }; });
        if (fs.length) { setFiles(fs); const pre = await preplaced(fs, e.party); if (Object.keys(pre).length) setMarks(pre); }
        setStep("place");
      }
    } catch { /* a failed refresh keeps the roster as it was; the next tick tries again */ }
    finally { setChecking(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countersign, token, secret, checking, files]);
  useEffect(() => {
    if (step !== "waiting") return;
    const onVisible = () => { if (document.visibilityState === "visible") void refreshEnvelope(); };
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(() => { if (document.visibilityState === "visible") void refreshEnvelope(); }, 20_000);
    return () => { document.removeEventListener("visibilitychange", onVisible); clearInterval(id); };
  }, [step, refreshEnvelope]);

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
  /** The placeholders a partly-signed file carries for the NEXT signer (the first row nobody has taken), as marks —
   *  so the second signer's page opens with the signature on the other party's line and the date on its Date line. */
  //  A holder's box is used AS STORED (y, h — the bottom on its line); its fit is "holder" (on a rule) only when a rule actually
  //  runs under it, else "default" — the fallback the first signer's pass drew where no partner rule was found (reviewer 2026-09-08).
  const preplaced = async (fs: Loaded[], idx?: number): Promise<Record<number, Mark[]>> => {
    const out: Record<number, Mark[]> = {};
    for (let i = 0; i < fs.length; i++) {
      const hs = await readHolders(fs[i].bytes); if (!hs.length) continue;
      const taken = new Set((await codexRows(fs[i].bytes)).map((r) => r.rowIndex));
      const target = idx ?? Math.min(...hs.map((h) => h.idx).filter((k) => !taken.has(k)));
      const mine = hs.filter((h) => h.idx === target); if (!mine.length) continue;
      const bmps: Record<number, Bitmap> = {};
      const onRule = async (h: Holder): Promise<boolean> => {
        try {
          bmps[h.page] ??= await pageBitmap(fs[i].bytes, h.page);
          const f = fitToUnderline(bmps[h.page], { x: h.x + Math.min(0.1, h.w / 2), y: h.y + h.h - 0.012 });
          return !!f && Math.abs(f.lineY - (h.y + h.h)) < 0.01;
        } catch { return false; }
      };
      const marks: Mark[] = [];
      for (let k = 0; k < mine.length; k++) {
        const h = mine[k]; const fit: Mark["fit"] = (await onRule(h)) ? "holder" : "default";
        marks.push(h.kind === "sig" ? { id: "sig", kind: "sig", page: h.page, x: h.x, y: h.y, w: h.w, h: h.h, fit, clear: true } : { id: `h${k}`, kind: "text", page: h.page, x: h.x, y: h.y, w: h.w, h: h.h, text: todayText(), fit, clear: true });
      }
      out[i] = marks;
    }
    return out;
  };
  useEffect(() => {                                            // creator path: a partly-signed upload lands on its placeholders
    if (countersign || !files.length) return;
    let live = true;
    (async () => { const pre = await preplaced(files); if (live && Object.keys(pre).length) setMarks((m) => { const n = { ...m }; for (const [k, v] of Object.entries(pre)) if (!(n[Number(k)] ?? []).length) n[Number(k)] = v; return n; }); })();
    return () => { live = false; };
  }, [files, countersign]); // eslint-disable-line react-hooks/exhaustive-deps
  // ── a hand-carried / linked partly-signed file names its own title and signers (reviewer 2026-09-08) ──
  // The SoICodex rows are the signers already in the file; the SoIHold placeholder names the next one — this reader.
  // Prefilled only over BLANK rows and an empty title, never over what was typed.
  const [carriedIdx, setCarriedIdx] = useState<number | null>(null);     // which row this reader signs in a carried file
  const prefilledRef = useRef<string>("");
  useEffect(() => {
    if (countersign || !files.length) return;
    const f0 = files[0]; if (prefilledRef.current === f0.sha256) return;
    let live = true;
    (async () => {
      const rows = (await codexRows(f0.bytes)).filter((r) => r.rowIndex >= 0).sort((a, b) => a.rowIndex - b.rowIndex);
      const hs = await readHolders(f0.bytes);
      if (!live || (!rows.length && !hs.length)) return;
      prefilledRef.current = f0.sha256;
      let pdfTitle = "";
      try { const { PDFDocument } = await import("pdf-lib"); pdfTitle = (await PDFDocument.load(f0.bytes, { updateMetadata: false, ignoreEncryption: true })).getTitle() ?? ""; } catch { /* no metadata */ }
      if (!live) return;
      setTitle((cur) => cur || pdfTitle || f0.name.replace(/-(partly-)?signed(-[A-Z-]+)?\.pdf$/i, "").replace(/\.pdf$/i, ""));
      const taken = new Set(rows.map((r) => r.rowIndex));
      const nextIdx = hs.length ? Math.min(...hs.map((h) => h.idx).filter((k) => !taken.has(k))) : rows.length;
      const nextName = hs.find((h) => h.idx === nextIdx)?.name ?? "";
      const total = Math.max(rows.length + 1, nextIdx + 1);
      setSigners((cur) => {
        if (cur.some((s) => s.name.trim() || s.contact.trim())) return cur;   // typed rows win
        return Array.from({ length: total }, (_, i) => {
          const r = rows.find((x) => x.rowIndex === i);
          if (r) return { name: r.name ?? "", contact: "", signed: true };   // already signed in the carried file: no contact owed
          if (i === nextIdx) return { name: nextName || defaultName || "", contact: defaultContact ?? "" };
          return { name: "", contact: "" };
        });
      });
      setCarriedIdx(Number.isFinite(nextIdx) ? nextIdx : null);
    })();
    return () => { live = false; };
  }, [files, countersign]); // eslint-disable-line react-hooks/exhaustive-deps
  const removeFile = (i: number) => {
    setFiles((fs) => fs.filter((_, j) => j !== i));
    // re-key the marks above the removed file, or file N+1 inherits file N's marks (Enki, wave 2)
    setMarks((b) => { const n: Record<number, Mark[]> = {}; for (const [k, v] of Object.entries(b)) { const j = Number(k); if (j < i) n[j] = v; else if (j > i) n[j - 1] = v; } return n; });
    // the viewed file index follows the removal, never past the last file (reviewer 2026-09-08)
    setFileIdx((k) => Math.max(0, Math.min(k > i ? k - 1 : k, files.length - 2)));
    setSelected(null);
  };

  // ── signers ──────────────────────────────────────────────────────────────────
  const setSigner = (i: number, patch: Partial<{ name: string; contact: string }>) => setSigners((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const signersOk = signers.every((s) => s.name.trim() && (s.signed || contactKind(s.contact))) && signers.length >= 1;
  const multi = signers.length > 1;

  // ── place + draw ─────────────────────────────────────────────────────────────
  const sigOf = (i: number): Mark | undefined => marks[i]?.find((m) => m.kind === "sig");
  const allPlaced = files.length > 0 && files.every((_, i) => !!sigOf(i));
  // Text marks: a date or a note placed beside the signature, movable and resizable like it.
  const addText = (text: string) => {
    const cur = marks[fileIdx] ?? []; const sig = cur.find((m) => m.kind === "sig");
    const onSigPage = sig && sig.page === viewedPage;
    const page = viewedPage; const below = onSigPage ? sig.y + sig.h + 0.01 : 0.5; const x = onSigPage ? sig.x : 0.4;
    const id = `t${Date.now().toString(36)}`;
    // the document's own "Date: ____" line, just under the signature, takes the mark (same fit as the signature box)
    const f = sig && onSigPage ? fitRef.current?.({ x: sig.x + Math.min(0.1, sig.w / 2), y: sig.y + sig.h + 0.03 }) : null;
    const fitted = !!(sig && f && f.lineY > sig.y + sig.h && f.h < sig.h * 1.5 && !cur.some((m) => m.kind === "text" && Math.abs(m.y - f.y) < 0.01));
    // a fitted text mark is one text line tall, its bottom ON the rule — the rule's full gap (up to the text above, 23–31 pt)
    // printed "Sep 7, 2026" at ~27 pt beside 11-pt body text (operator's live PDF, 2026-09-08)
    const capped = f ? (() => { const h = f.textH ? Math.min(0.03, Math.max(0.012, f.textH * 1.9)) : Math.min(f.h, TXT_H); return { h, y: f.y + f.h - h }; })() : null;   // textH × 1.9 ≈ the document's em (the preview and stamp draw text at 72 % of the box)
    const mark: Mark = fitted && f && capped ? { id, kind: "text", page, x: f.x, y: capped.y, w: f.w, h: capped.h, text, fit: "underline" } : { id, kind: "text", page, x, y: Math.min(below, 1 - TXT_H), w: TXT_W, h: TXT_H, text, fit: "default" };
    setMarks((b) => ({ ...b, [fileIdx]: [...cur, mark] })); setSelected(id);
    setTimeout(() => { const boxes = document.querySelectorAll('[data-testid="text-box"]'); boxes[boxes.length - 1]?.scrollIntoView({ block: "center", behavior: "smooth" }); }, 50);
  };
  const todayText = () => dateIn(activeLocale, new Date(), { year: "numeric", month: "short", day: "numeric" });   // the Globe's language, Latin digits
  const selMark = (marks[fileIdx] ?? []).find((m) => m.id === selected) ?? null;
  const setSelText = (text: string) => setMarks((b) => ({ ...b, [fileIdx]: (b[fileIdx] ?? []).map((m) => (m.id === selected ? { ...m, text } : m)) }));
  const removeSel = () => { setMarks((b) => ({ ...b, [fileIdx]: (b[fileIdx] ?? []).filter((m) => m.id !== selected) })); setSelected(null); };
  // − / + scale the selected mark about its bottom-left corner: the baseline never moves (operator 2026-09-08)
  const resizeSel = (f: number) => setMarks((b) => ({ ...b, [fileIdx]: (b[fileIdx] ?? []).map((m) => { if (m.id !== selected) return m; const w = Math.min(1, Math.max(0.08, m.w * f)), h = Math.min(1, Math.max(0.02, m.h * f)); return { ...m, w, h, y: Math.max(0, m.y + m.h - h) }; }) }));
  const myIdx = countersign ? (pub?.party ?? 0) : 0;
  // in a carried file this reader is the next free row, not row 0 (the earlier signers are already in the file)
  const myName = countersign ? (pub?.signers[myIdx]?.name ?? "") : signers[carriedIdx ?? 0]?.name ?? signers[0]?.name ?? "";
  const meIdx = countersign ? myIdx : Math.min(carriedIdx ?? 0, Math.max(0, signers.length - 1));   // the row THIS pass signs in

  // ── stamp + save ─────────────────────────────────────────────────────────────
  // The marks of this pass, per file, as the record keeps them (page, box, text) — sign_events.marks
  const passMarks = () => files.map((_, i) => (marks[i] ?? []).map((m) => ({ kind: m.kind, page: m.page, x: +m.x.toFixed(4), y: +m.y.toFixed(4), w: +m.w.toFixed(4), h: +m.h.toFixed(4), ...(m.kind === "text" ? { text: (m.text ?? "").slice(0, 200) } : {}) })));
  const sign = useCallback(async () => {
    if (!png || !initialsPng || !allPlaced) return;
    if (needLogin && auth.isLoading) { setErr(t("soi.sign.err.auth_loading")); return; }   // the SDK is still hydrating after the redirect — a second tap must not loop the login (fleet, Krishna)
    if (needLogin && !auth.isAuthenticated) {                   // the login comes at the moment of saving, the draft rides along
      if (!keepDraft(snapshot())) { setErr(t("soi.sign.err.draft_too_large")); return; }
      setStep("login"); setErr("");
      void auth.loginWithRedirect({ appState: { returnTo: returnTo ?? window.location.pathname } });
      return;
    }
    if (!countersign) keepDraft(snapshot());                    // a reload mid-save restores the draft (dropped on success)
    setStep("saving"); setErr("");
    let stage: "stamp" | "create" | "save" = "stamp";
    try {
      const isoDate = new Date().toISOString();
      const prevChain = countersign ? (pub?.chain ?? "") : "";
      if (!countersign && !pendingToken.current) pendingToken.current = newToken();
      const stamped: SignFile[] = [];
      const stampedBytes: { name: string; bytes: Uint8Array }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const recorded = (await codexRows(f.bytes)).filter((r) => r.rowIndex >= 0);
        const myRow = countersign || !recorded.some((r) => r.rowIndex === meIdx) ? meIdx : Math.max(...recorded.map((r) => r.rowIndex)) + 1;
        const myContact = countersign ? pub?.signers[meIdx]?.contact_masked : signers[meIdx]?.contact;   // names a signer whose name the PDF font cannot draw
        let out = await stampSignature(f.bytes, sigOf(i)!, { pngDataUrl: png, name: myName, isoDate, hash: shortHash(prevChain || f.sha256), contact: myContact, signerIdx: myRow, envelope: { token: countersign ? token! : pendingToken.current, chain: prevChain } });
        // every text mark is bound to THIS signer's pass — index, time, chain-before (Odin, Thor)
        for (const m of (marks[i] ?? []).filter((m) => m.kind === "text" && (m.text ?? "").trim())) out = await stampText(out, m, m.text!.trim(), { signerIdx: meIdx, isoDate, chain: prevChain });
        // the signatory block: this signer's row, CAC-style timestamp + Light Codex 2×2 strip (operator)
        const nameOf = (i: number) => (countersign ? pub?.signers[i]?.name : signers[i]?.name) ?? `${t("soi.sign.signer")} ${i + 1}`;
        // rows already in the file: a file carried by hand (offline hand-off) keeps its earlier signers by the NAME in
        // the keyword; this signer takes the next free row rather than overwriting one
        const total = Math.max(countersign ? (pub?.signers.length ?? 2) : signers.length, myRow + 1);
        const earlier = recorded.filter((r) => r.rowIndex !== myRow).map((r) => ({ ...r, name: r.name || nameOf(r.rowIndex) }));
        const allRows = [...earlier, { rowIndex: myRow, name: myName, isoDate, hash: shortHash(prevChain || f.sha256), contact: myContact }].sort((a, b) => a.rowIndex - b.rowIndex);
        // the initials slot on every page: below the lowest ink at the bottom-right, else the lowest clear gap (never over text).
        // The scan reads the UNSTAMPED page, so this pass's own signature, caption and date are invisible to it (reviewer
        // 2026-09-08): once the marks are known, the slot is pushed below the bottom of this pass's boxes on that page
        // (+ the caption's height), in page fractions. The row's own width fraction is handed to the scan when the core lends it.
        const topByPage: Record<number, number> = {};
        for (let pg = 1; pg <= f.pages; pg++) {
          try {
            const bmp = await pageBitmap(f.bytes, pg);
            const scan = initialsSlotTop(bmp, { colFrac: initialsRowFrac(initialsSlotWidths(total), bmp.widthPt || 612) });   // the scan covers the whole initials row (3+ signers)
            const own = (marks[i] ?? []).filter((m) => m.page === pg);
            const captionFrac = CAPTION_PT / (bmp.heightPt || 792);
            const ownBottom = own.length ? Math.max(...own.map((m) => m.y + m.h + (m.kind === "sig" ? captionFrac : 0))) : 0;
            const pushed = ownBottom > scan && ownBottom < scan + SLOT_H_FRAC + captionFrac ? Math.min(ownBottom, 1 - SLOT_H_FRAC - 0.004) : scan;   // only when the slot would sit on this pass's ink
            topByPage[pg] = ownBottom > scan ? Math.max(scan, pushed, ownBottom > 1 - SLOT_H_FRAC - 0.004 ? scan : ownBottom) : scan;
          } catch { /* default: bottom margin */ }
        }
        // one HIDDEN Light Codex line with EVERY signatory so far, on the bottom edge of every page (operator 23:15 / 00:45)
        out = await stampCodexBlock(out, { total, rows: allRows, all: codexImage(codexAllText(allRows)), initials: { total, mine: { idx: myRow, pngDataUrl: initialsPng }, topByPage } });
        // placeholders for the NEXT signer — signature on the other party's line of the same row, date on its Date line
        const nextIdx = myRow + 1;
        if (nextIdx < total && !(await readHolders(out)).some((h) => h.idx === nextIdx)) {
          const sig = sigOf(i)!; const bmp = await pageBitmap(f.bytes, sig.page);
          // no partner rule on the page: the fallback beside the signature is a DEFAULT box, never treated as on-rule
          // (preplaced() re-reads the page and tags a holder "default" when no rule runs under it — reviewer 2026-09-08)
          const partner = partnerRule(bmp, sig) ?? { x: Math.min(0.95 - sig.w, sig.x + sig.w + 0.06), y: sig.y, w: sig.w, h: sig.h, lineY: sig.y + sig.h };
          const nextName = nameOf(nextIdx);
          const hs: Holder[] = [{ idx: nextIdx, name: nextName, kind: "sig", page: sig.page, x: partner.x, y: partner.y, w: partner.w, h: partner.h }];
          const dateFit = fitToUnderline(bmp, { x: partner.x + Math.min(0.1, partner.w / 2), y: partner.y + partner.h + 0.03 });
          // the partner's date holder is one text line tall with its bottom ON the Date line — the rule's full gap overlapped
          // the printed name above it (operator's live PDF, 2026-09-08)
          const dateH = dateFit ? (dateFit.textH ? Math.min(0.03, Math.max(0.012, dateFit.textH * 1.9)) : Math.min(dateFit.h, TXT_H)) : TXT_H;
          hs.push(dateFit && dateFit.lineY > partner.y + partner.h ? { idx: nextIdx, name: nextName, kind: "date", page: sig.page, x: dateFit.x, y: dateFit.y + dateFit.h - dateH, w: dateFit.w, h: dateH } : { idx: nextIdx, name: nextName, kind: "date", page: sig.page, x: partner.x, y: Math.min(0.98, partner.y + partner.h + 0.012), w: TXT_W, h: TXT_H });
          out = await stampHolders(out, hs); setHoldersFor(nextName);
        }
        const sha = await sha256Hex(out);
        stamped.push({ name: f.name, page_count: f.pages, pdf_base64: bytesToBase64(out), sha256: sha, version: 0 });
        stampedBytes.push({ name: f.name, bytes: out });
      }
      const chain = await chainHash(prevChain, stamped.map((s) => s.sha256));
      let result: PublicEnvelope;
      if (!countersign) {
        const env = { ...newEnvelope({ title: title || files[0].name.replace(/\.pdf$/i, ""), created_by: signers[0].contact, signers, files: files.map((f) => ({ name: f.name, page_count: f.pages, pdf_base64: f.base64, sha256: f.sha256, version: 0 })) }), token: pendingToken.current };
        envRef.current = env;
        stage = "create";
        let created: { token: string; mode: StoreMode };
        try { created = await createEnvelope(env); }
        catch (ex) {
          // no link can be minted here — keep the envelope on this phone and hand the FILE over instead (operator 00:39)
          if (ex instanceof SignStoreError && (ex.code === "no_backend" || ex.code === "no_migration") && multi) { created = await createEnvelope(env, { localMulti: true }); setOffline(ex.code); setTmpLink(stampedBytes[0] ? await putTempFile(stampedBytes[0].bytes, await signedName(stampedBytes[0], false)) : null); }
          // a retry after a half-landed save re-sent the same token (fleet, Krishna): mint a fresh one, once
          else if (ex instanceof SignStoreError && ex.code === "duplicate") { pendingToken.current = newToken(); const env2 = { ...env, token: pendingToken.current }; envRef.current = env2; created = await createEnvelope(env2); Object.assign(env, env2); }
          else throw ex;
        }
        if (created.mode === "local") setLocalFallback(true);
        const next = applySignature(env, 0, env.signers[0].secret, isoDate, stamped, chain);
        envRef.current = next;
        stage = "save";
        result = await signEnvelope(env.token, 0, env.signers[0].secret, stamped, chain, next, passMarks());
      } else {
        stage = "save";
        result = await signEnvelope(token!, myIdx, secret!, stamped, chain, undefined, passMarks());
      }
      dropDraft(); setErr("");
      setPub(result); setSigned(stampedBytes);
      if (result.status === "complete") { setStep("done"); return; }
      const nxt = result.signers[result.current_signer_idx];
      const nextSecret = result.next_secret ?? (envRef.current?.signers[result.current_signer_idx]?.secret ?? "");
      setNextName(nxt?.name ?? ""); setNextContact(countersign ? "" : signers[result.current_signer_idx]?.contact ?? "");
      setNextLink(result.mode === "local" && multi ? "" : signLink(window.location.origin, result.token, nextSecret));   // a device-local link opens nowhere else
      setMyLink(signLink(window.location.origin, result.token, countersign ? secret! : envRef.current?.signers[0]?.secret ?? ""));
      setStep("handoff");
    } catch (ex) {
      // never silent: the step that failed, then the reason
      setErr(`${t(`soi.sign.stage.${stage}`)}: ${ex instanceof SignStoreError ? t(`soi.sign.err.${ex.code}`) : String((ex as Error).message ?? ex)}`);
      setFailStage(stage); setStep("draw");   // the red line, the sentence and the Sign & save button share one screen (fleet: a countersigner landed on PLACE)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [png, initialsPng, allPlaced, files, marks, myName, countersign, pub, title, signers, token, secret, myIdx, t, requireLogin, auth.isAuthenticated, returnTo]);

  // The phone's share sheet carries the FILE to Messages or Mail with the script as its text (operator 01:10:
  // "should have attachment if emailed or texted"); mailto:/sms: never can. Without Web Share: download + composer.
  const [shareState, setShareState] = useState<"" | "shared" | "fallback" | "failed">("");
  const shareFiles = async (fs: { name: string; bytes: Uint8Array }[], final: boolean, text: string) => {
    const files = await Promise.all(fs.map(async (f) => new File([f.bytes as BlobPart], await signedName(f, final), { type: "application/pdf" })));
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean; share?: (d: ShareData) => Promise<void> };
    if (nav.share && nav.canShare?.({ files })) {
      try { await nav.share({ files, title: pub?.title ?? title, text }); setShareState("shared"); return; } catch (e) { if ((e as Error).name === "AbortError") return; setShareState("failed"); }
    }
    for (const f of fs) await download(f, final);               // no share sheet here: the file lands in Downloads, the composer opens with the script
    setShareState("fallback");
    const kind = contactKind(nextContact);
    window.location.href = kind === "phone" ? `sms:${normalizeContact(nextContact)}?&body=${encodeURIComponent(text)}` : `mailto:${kind === "email" ? normalizeContact(nextContact) : ""}?subject=${encodeURIComponent(`${t("soi.sign.handoff.subject")} ${pub?.title ?? title}`)}&body=${encodeURIComponent(text)}`;
  };
  /** "<file>-partly-signed-AS.pdf" / "<file>-signed-AS-DLV.pdf" — the initials of everyone recorded in the file, in signing
   *  order (operator 01:25); read from the file's own signatory rows, so a hand-carried file keeps the earlier signers'. */
  const signedName = async (f: { name: string; bytes: Uint8Array }, final: boolean) => {
    let who: string[] = [];
    try { who = (await codexRows(f.bytes)).filter((r) => r.rowIndex >= 0).sort((a, b) => a.rowIndex - b.rowIndex).map((r) => initialsOf(r.name || "")).filter(Boolean); } catch { /* unreadable: no initials */ }
    return f.name.replace(/\.pdf$/i, "").replace(/-(partly-)?signed(-[A-Z-]+)?$/i, "") + (final ? "-signed" : "-partly-signed") + (who.length ? "-" + who.join("-") : "") + ".pdf";
  };
  const download = async (f: { name: string; bytes: Uint8Array }, final = true) => {
    const url = URL.createObjectURL(new Blob([f.bytes as BlobPart], { type: "application/pdf" }));
    // A half-signed file is named as such, so two downloads never look alike (Christo, wave 1).
    const a = document.createElement("a"); a.href = url; a.download = await signedName(f, final); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // ── the phase rail + one explainer line (R-CORE gate block) ──────────────────
  const rail = useMemo(() => {
    const keys = countersign ? COUNTERSIGN_STEPS : CREATOR_STEPS;
    const r = railOf(step); if (r) lastRail.current = r; const cur = r ?? lastRail.current;   // an error keeps the last real step lit
    return keys.map((k) => ({ k, on: k === cur, past: keys.indexOf(k) < keys.indexOf(cur) }));
  }, [step, countersign]);
  const explain = (() => {
    switch (step) {
      case "upload": return files.length ? t("soi.sign.x.upload_more") : t("soi.sign.x.upload");
      case "signers": return signersOk ? t("soi.sign.x.signers_ok") : t("soi.sign.x.signers");
      case "place": return allPlaced ? t("soi.sign.x.placed") : t("soi.sign.x.place");
      case "draw": return png && initialsPng ? t("soi.sign.x.drawn") : png ? t("soi.sign.x.initials") : t("soi.sign.x.draw");
      case "saving": return t("soi.sign.saving");
      case "login": return t("soi.sign.x.login");
      case "handoff": return offline ? t("soi.sign.x.handoff_offline") : t("soi.sign.x.handoff");
      case "done": return t("soi.sign.x.done");
      case "waiting": return `${t("soi.sign.turn_of")} ${pub?.signers[pub.current_signer_idx]?.name ?? "…"}`;
      case "not_party": return t("soi.sign.not_party");
      case "loading": return t("soi.sign.loading");
      case "error": return err || t("soi.sign.x.error");
      default: return "";
    }
  })();

  const Roster = () => pub && pub.party >= 0 ? (   // a wrong secret (not_party) never reads the roster (Christo, Thor)
    <ol className="mt-2 grid gap-1 text-xs" data-testid="roster">
      {pub.signers.map((s, i) => (
        <li key={i} className="flex items-center justify-between rounded border border-border px-2 py-1">
          <span>{i + 1}. {s.name} <span className="text-muted-foreground">{s.contact_masked}</span>{s.me && <span className="ml-1 rounded bg-primary/15 px-1 text-[10px]">{t("soi.sign.you")}</span>}</span>
          <span className={s.signed_at ? "text-green-500" : i === pub.current_signer_idx && pub.status === "awaiting" ? "text-primary" : "text-muted-foreground"}>
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
          <li key={r.k} className="rounded-full border px-2 py-0.5" style={{ borderColor: r.on ? hue.bright : r.past ? hue.dim : "var(--border)", color: r.on ? hue.bright : r.past ? hue.mid : "var(--muted-foreground)", background: r.on ? hue.faint : undefined, fontWeight: r.on ? 600 : 400 }} aria-current={r.on ? "step" : undefined}><span aria-hidden="true">{SIGN_STEPS[r.k].glyph} </span>{t(SIGN_STEPS[r.k].labelKey)}{r.past ? " ✓" : ""}</li>
        ))}
      </ol>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{countersign ? (title || t("soi.sign.title")) : t("soi.sign.title")}</h2>
        {mode === "local" && <span className="rounded-full border border-amber-500/50 px-2 py-0.5 text-[10px] uppercase text-amber-500">{t("soi.sign.local_only")}</span>}
      </div>
      <p className="mb-4 text-sm text-primary" data-testid="explain" aria-live="polite">{explain}</p>
      {err && <p className="mb-3 rounded-md border border-red-500/40 bg-red-500/5 p-2 text-xs text-red-500" data-testid="error">{err}</p>}
      {resumed && <p className="mb-3 rounded-md border border-primary/40 bg-primary/5 p-2 text-xs text-primary" data-testid="resumed">{t("soi.sign.x.resumed")}</p>}
      <SignDiag d={{ mode, auth: authState, authName: auth.user?.email ?? auth.user?.name, multi: countersign ? (pub?.signers.length ?? 2) > 1 : multi, err, step, stage: failStage }} open={diagOpen} onToggle={() => setDiagOpen((o) => !o)} />

      {/* ── UPLOAD ── */}
      {step === "upload" && (
        <div>
          <label className="block">
            <span className="text-sm font-medium">{t("soi.sign.doc_title")}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("soi.sign.doc_title_ph")} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm" />
          </label>
          <label className="mt-3 flex min-h-[64px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-primary/50 p-4 text-sm text-primary">
            {t("soi.sign.upload")}
            <input type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} data-testid="file-input" />
          </label>
          <p className="mt-1 text-[11px] text-muted-foreground">{t("soi.sign.upload_hint")}</p>
          {requireLogin && !loggedIn && <p className="mt-1 text-[11px] text-muted-foreground" data-testid="login-later">{t("soi.sign.login.later")} <button type="button" onClick={login} className="min-h-[36px] text-primary underline-offset-2 hover:underline">{t("soi.sign.login.now")}</button></p>}
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
          <button type="button" disabled={!files.length} onClick={() => setStep("signers")} className="mt-4 inline-flex min-h-[44px] items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{t("soi.sign.next_signers")} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          <div className="mt-5 border-t border-border pt-3"><VerifyFile /></div>
        </div>
      )}

      {/* ── SIGNERS ── */}
      {step === "signers" && (
        <div>
          {signers.map((s, i) => (
            <div key={i} className="mb-2 rounded-md border border-border p-3">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-primary">
                <span>{i === 0 ? t("soi.sign.me") : `${t("soi.sign.signer")} ${i + 1}`}</span>
                {i > 0 && <button type="button" onClick={() => setSigners((x) => x.filter((_, j) => j !== i))} className="min-h-[36px] px-2 text-muted-foreground" aria-label={t("soi.sign.remove_signer")}>✕</button>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={s.name} onChange={(e) => setSigner(i, { name: e.target.value })} placeholder={t("soi.sign.name_ph")} className="rounded-md border border-border bg-background px-2 py-2 text-sm" data-testid={`signer-name-${i}`} />
                <input value={s.contact} onChange={(e) => setSigner(i, { contact: e.target.value })} placeholder={t("soi.sign.contact_ph")} inputMode="email" className="rounded-md border border-border bg-background px-2 py-2 text-sm" data-testid={`signer-contact-${i}`} />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setSigners((x) => [...x, { name: "", contact: "" }])} className="min-h-[44px] text-sm text-primary">+ {t("soi.sign.add_signer")}</button>
          {multi && mode === "local" && <p className="mt-2 text-xs text-amber-500">{t("soi.sign.err.no_backend")}</p>}
          {!multi && <p className="mt-2 text-xs text-muted-foreground">{t("soi.sign.solo_hint")}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setStep("upload")} className="min-h-[44px] rounded-md border border-border px-4 text-sm"><span aria-hidden="true">‹ </span>{t("soi.sign.back")}</button>
            <button type="button" disabled={!signersOk || (multi && mode === "local")} onClick={() => setStep("place")} className="inline-flex min-h-[44px] items-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{t("soi.sign.next_place")} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
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
                <button key={i} type="button" onClick={() => setFileIdx(i)} className="min-h-[44px] rounded-full border px-3 text-xs" style={{ borderColor: i === fileIdx ? hue.bright : sigOf(i) ? hue.dim : "var(--border)" }}>{sigOf(i) ? "✓ " : ""}{f.name}</button>
              ))}
            </div>
          )}
          <PdfPageView bytes={files[fileIdx].bytes} marks={marks[fileIdx] ?? []} onMarks={(m) => setMarks((x) => ({ ...x, [fileIdx]: m }))} selectedId={selected} onSelect={setSelected} preview={png} onPage={setViewedPage} fitRef={fitRef} onDelete={(id) => { setMarks((b) => ({ ...b, [fileIdx]: (b[fileIdx] ?? []).filter((m) => m.id !== id) })); setSelected(null); }} />
          {/* marks toolbar: add a date or a note; size the selected mark; edit its text */}
          <div className="mt-2 flex flex-wrap items-center gap-2" data-testid="marks-toolbar">
            <button type="button" onClick={() => addText(todayText())} className="min-h-[44px] rounded-md border border-border px-3 text-xs" data-testid="add-date">+ {t("soi.sign.add_date")}</button>
            <button type="button" onClick={() => addText(t("soi.sign.text_default"))} className="min-h-[44px] rounded-md border border-border px-3 text-xs" data-testid="add-text">+ {t("soi.sign.add_text")}</button>
            {selMark && <>
              <button type="button" onClick={removeSel} className="min-h-[44px] rounded-md bg-red-500 px-3 text-xs font-medium text-white" aria-label={t("soi.sign.remove_mark")} data-testid="remove-mark"><span aria-hidden="true">✕ </span>{t("soi.sign.delete")} · {selMark.kind === "sig" ? t("soi.sign.mark.sig") : selMark.text?.trim() && /\d{4}/.test(selMark.text) ? t("soi.sign.mark.date") : t("soi.sign.mark.text")}</button>
              <span className="rounded-full border border-primary/60 px-2 py-1 text-[11px] text-primary" data-testid="sizing-chip">{t("soi.sign.sizing")} {selMark.kind === "sig" ? t("soi.sign.mark.sig") : selMark.text?.trim() && /\d{4}/.test(selMark.text) ? t("soi.sign.mark.date") : t("soi.sign.mark.text")}</span>
              <button type="button" onClick={() => resizeSel(0.85)} className="min-h-[44px] rounded-md border border-border px-3 text-xs" aria-label={t("soi.sign.smaller")}>−</button>
              <button type="button" onClick={() => resizeSel(1.18)} className="min-h-[44px] rounded-md border border-border px-3 text-xs" aria-label={t("soi.sign.larger")}>+</button>
              {selMark.kind === "text" && <input value={selMark.text ?? ""} onChange={(e) => setSelText(e.target.value)} placeholder={t("soi.sign.text_ph")} className="min-h-[44px] min-w-[140px] flex-1 rounded-md border border-border bg-background px-2 text-sm" data-testid="mark-text" />}

            </>}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{sigOf(fileIdx)?.fit === "underline" ? t("soi.sign.fit.underline") : sigOf(fileIdx)?.fit === "ai" ? t("soi.sign.ai.placed") : t("soi.sign.marks_hint")}</p>
          {anyAi(ai) && (
            <div className="mt-2 flex flex-wrap items-center gap-2" data-testid="ai-place">
              <button type="button" onClick={() => void aiFind()} disabled={aiState === "busy"} className="min-h-[44px] rounded-md border px-3 text-xs" style={{ borderColor: hue.dim, color: hue.bright }} data-testid="ai-find"><span aria-hidden="true">{AI_GLYPH} </span>{aiState === "busy" ? t("soi.sign.ai.busy") : t("soi.sign.ai.find")}</button>
              <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value as AiProvider)} className="min-h-[44px] rounded-md border border-border bg-background px-2 text-xs" aria-label={t("soi.sign.ai.provider")} data-testid="ai-provider">
                <option value="auto">{t("soi.sign.ai.auto")}</option>{ai.openai && <option value="openai">OpenAI</option>}{ai.gemini && <option value="gemini">Gemini</option>}{ai.grok && <option value="grok">Grok</option>}
              </select>
              {aiState === "none" && <span className="text-[11px] text-muted-foreground">{t("soi.sign.ai.none")}</span>}
              {aiState === "failed" && <span className="text-[11px] text-red-500">{t("soi.sign.ai.failed")}</span>}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {!countersign && <button type="button" onClick={() => setStep("signers")} className="min-h-[44px] rounded-md border border-border px-4 text-sm"><span aria-hidden="true">‹ </span>{t("soi.sign.back")}</button>}
            <button type="button" disabled={!allPlaced} onClick={() => setStep("draw")} className="inline-flex min-h-[44px] items-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50" data-testid="to-draw">{t("soi.sign.next_draw")} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </div>
      )}

      {/* ── DRAW ── */}
      {step === "draw" && (
        <div>
          <p className="mb-2 text-sm">{t("soi.sign.signing_as")} <strong>{myName}</strong></p>
          {resumed && png && <p className="mb-2 text-[11px] text-primary" data-testid="stroke-kept">{t("soi.sign.x.stroke_kept")}</p>}
          <SignaturePad onChange={(p) => { if (p !== null || !resumed) setPng(p); }} />
          {/* the PHYSICAL initials (operator 00:50): drawn once, stamped at the bottom-right of every page in a clear spot */}
          <p className="mt-3 mb-1 text-sm">{t("soi.sign.draw_initials")}</p>
          <SignaturePad height={90} label={t("soi.sign.draw_initials")} onChange={(p) => { if (p !== null || !resumed) setInitialsPng(p); }} />
          {resumed && initialsPng && <p className="mt-1 text-[11px] text-primary">{t("soi.sign.x.stroke_kept")}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setStep("place")} className="min-h-[44px] rounded-md border border-border px-4 text-sm"><span aria-hidden="true">‹ </span>{t("soi.sign.back")}</button>
            <button type="button" disabled={!png || !initialsPng || (!!requireLogin && auth.isLoading)} onClick={sign} className="min-h-[44px] rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50" data-testid="sign-button"><span aria-hidden="true">◬ </span>{t("soi.sign.stamp")}</button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("soi.sign.consent")}</p>
        </div>
      )}

      {step === "saving" && <p className="text-sm text-muted-foreground">{t("soi.sign.saving")}</p>}
      {step === "login" && <p className="text-sm text-muted-foreground" data-testid="login-redirect">{t("soi.sign.x.login")}</p>}

      {/* ── HANDOFF ── */}
      {step === "handoff" && (
        <div>
          <Roster />
          {nextLink ? <div className="mt-3"><Handoff link={nextLink} sender={myName} title={pub?.title ?? title} nextName={nextName} nextContact={nextContact} /></div> : (
            <div className="mt-3 rounded-lg border border-amber-500/50 bg-amber-500/5 p-4" data-testid="offline-handoff">
              <div className="text-sm font-medium text-amber-500">{t("soi.sign.handoff.offline_title")}</div>
              <p className="mt-1 text-xs text-muted-foreground">{t(`soi.sign.err.${offline || "no_backend"}`)}</p>
              <p className="mt-2 text-xs">{t("soi.sign.handoff.offline").replace("{next}", nextName || nextContact)}</p>
              {tmpLink && (
                <div className="mt-3 rounded-md border border-border bg-background p-2" data-testid="tmp-link">
                  <div className="font-medium text-foreground">{t("soi.sign.tmp.title")}</div>
                  <p className="text-muted-foreground">{t("soi.sign.tmp.hint").replace("{expires}", dateIn(activeLocale, new Date(tmpLink.expires), { dateStyle: "medium", timeStyle: "short" }, true))}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2"><code className="break-all text-[11px]" data-testid="tmp-url">{tmpLink.url}</code><button type="button" onClick={() => { try { void navigator.clipboard.writeText(tmpLink.url); } catch { /* no clipboard */ } }} className="min-h-[36px] rounded-md border border-border px-3">{t("soi.sign.handoff.copy")}</button></div>
                </div>
              )}
              {(() => { const msg = tmpLink ? handoffMessage(myName, pub?.title ?? title, tmpLink.url, t("soi.sign.handoff.offline_link_template")) : handoffMessage(myName, pub?.title ?? title, `${window.location.origin}/soi-session/sign/`, t("soi.sign.handoff.offline_template")); return (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void shareFiles(signed, false, msg)} className="min-h-[44px] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" data-testid="share-file"><span aria-hidden="true">📎 </span>{shareState === "shared" ? t("soi.sign.handoff.shared") : t("soi.sign.handoff.share_file")}</button>
                </div>); })()}
              {shareState === "fallback" && <p className="mt-2 text-[11px] text-muted-foreground" data-testid="share-fallback">{t("soi.sign.handoff.share_fallback")}</p>}
              {shareState === "failed" && <p className="mt-2 text-[11px] text-red-500">{t("soi.sign.handoff.share_failed")}</p>}
            </div>
          )}
          {holdersFor && <p className="mt-3 rounded-md border border-primary/40 bg-primary/5 p-2 text-xs" data-testid="holders-left">{t("soi.sign.holders").replace("{next}", holdersFor)}</p>}
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
          <div className="mt-3 flex flex-wrap items-center gap-3" data-testid="downloads-partly">{signed.map((f) => <span key={f.name} className="inline-flex items-center gap-2 text-xs text-muted-foreground"><IconDownload label={`${t("soi.sign.download")} · ${f.name} · ${t("soi.sign.partly")}`} onClick={() => void download(f, false)} /><span>{f.name} · {t("soi.sign.partly")}</span></span>)}</div>
        </div>
      )}

      {/* ── WAITING / NOT PARTY ── */}
      {step === "waiting" && <div><Roster /><button type="button" onClick={() => void refreshEnvelope()} disabled={checking} className="mt-2 min-h-[44px] rounded-md border border-primary/60 px-3 text-xs text-primary disabled:opacity-40" data-testid="check-again">↻ {checking ? t("soi.sign.loading") : t("soi.sign.check_again")}</button></div>}

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
          <div className="mt-3 flex flex-wrap items-center gap-3" data-testid="downloads">{signed.map((f) => <span key={f.name} className="inline-flex items-center gap-2 text-xs"><IconDownload label={`${t("soi.sign.download")} · ${f.name}`} onClick={() => void download(f)} /><span>{f.name}</span></span>)}
            <button type="button" onClick={() => void shareFiles(signed, true, `${t("soi.sign.complete")} ${pub?.title ?? title}`)} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.12em]" style={{ borderColor: hue.dim, color: hue.bright }} data-testid="share-signed"><span aria-hidden="true">📎</span> {t("soi.sign.handoff.share_signed")}</button></div>
          <div className="mt-4"><VerifyFile /></div>
        </div>
      )}

      {step === "error" && pub && pub.party >= 0 && <Roster />}
      <p className="mt-5 text-[11px] text-muted-foreground"><strong className="text-foreground" data-testid="stance">{t("soi.sign.stance")}</strong> {t("soi.sign.no_fee")}</p>
    </section>
  );
}
