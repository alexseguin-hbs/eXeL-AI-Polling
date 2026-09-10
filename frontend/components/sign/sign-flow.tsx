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
import { newEnvelope, newToken, applySignature, chainHash, sha256Hex, shortHash, signLink, recordLink, contactKind, handoffMessage, normalizeContact, MAX_FILE_BYTES, MAX_FILES, MAX_ENVELOPE_BYTES, type Envelope, type SignFile } from "@/lib/sign-envelope";
import { createEnvelope, getEnvelope, signEnvelope, storeMode, SignStoreError, type PublicEnvelope, type StoreMode } from "@/lib/sign-store";
import { stampSignature, stampText, stampCodexBlock, stampHolders, holders as readHolders, codexRows, pageCount, initialsOf, type Holder, initialsRowFrac, initialsSlotWidths, cacStamp, textBoxes, unstampText, type TextMark } from "@/lib/pdf-stamp";
import { initialsSlotTop, partnerRule } from "@/lib/sign-layout";
import { fitToUnderline, type Bitmap } from "@/lib/sign-fit";
import { openPdf, renderPage } from "@/lib/pdf-render";
import { putTempFile, type TempLink } from "@/lib/tmpfile";
import { aiStatus, aiPlace, anyAi, type AiConfigured, type AiProvider } from "@/lib/ai";
import { codexAllText, codexImage } from "@/lib/codex-pdf";
import { bytesToBase64, base64ToBytes } from "@/lib/pdf-render";
import { mailFits, type MailAttachment } from "@/lib/notify";
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
/** A lexicon string with its {placeholder} filled — and the value appended when a language's string forgot the placeholder, so nothing is ever lost. */
const fill = (s: string, ph: string, v: string | number): string => (s.includes(`{${ph}}`) ? s.replace(`{${ph}}`, String(v)) : `${s} ${v}`);
/** The rail step a flow state lights: an error keeps the LAST real step lit (reviewer 2026-09-08). */
const railOf = (step: string): SignStep | null => step === "loading" || step === "waiting" || step === "not_party" ? "open" : step === "saving" || step === "login" ? "sign" : step === "error" ? null : (step as SignStep);
/** A date in the Globe's language, never the browser's (reviewer 2026-09-08); Latin digits: the PDF font has no others (fleet). */
const dateIn = (locale: string, d: Date, opts: Intl.DateTimeFormatOptions, time = false): string => {
  const f = time ? (l?: string, o?: Intl.DateTimeFormatOptions) => d.toLocaleString(l, o) : (l?: string, o?: Intl.DateTimeFormatOptions) => d.toLocaleDateString(l, o);
  try { return f(locale || undefined, { ...opts, numberingSystem: "latn" } as Intl.DateTimeFormatOptions); } catch { try { return f(locale || undefined, opts); } catch { return f(undefined, opts); } }
};
import { SignaturePad } from "@/components/sign/signature-pad";
import { PdfPageView, SIG_W, SIG_H, TXT_W, TXT_H, type Mark, type FitAt, type ViewCenter } from "@/components/sign/pdf-page-view";
import { Handoff } from "@/components/sign/handoff";
import { SignDiag, type AuthState } from "@/components/sign/sign-diag";
import { SignReceipt } from "@/components/sign/receipt";
import { SendRow } from "@/components/sign/send-row";
import { sendSignerEmail } from "@/lib/notify";
import { DEFAULT_TZ, ZONES, deviceTz, readTz, saveTz, isTz, zoneAbbr } from "@/lib/timezone";
import { IconDownload, DownloadGlyph } from "@/components/download-icon";
import { VerifyFile } from "@/components/sign/verify-file";

type Step = "upload" | "signers" | "place" | "draw" | "login" | "saving" | "handoff" | "done" | "error" | "loading" | "waiting" | "not_party";
interface Loaded { name: string; bytes: Uint8Array; base64: string; sha256: string; pages: number }

/** The creator's draft — kept on this device across a login redirect or a reload (Enki's gap, wave 2). */
export const DRAFT_KEY = "exel-sign-draft";
interface Draft { title: string; files: { name: string; base64: string }[]; signers: { name: string; contact: string }[]; marks: Record<number, Mark[]>; png: string | null; initialsPng?: string | null; token: string; /** the creator's secret once the envelope was minted — a restore can ask the store whether that token already completed (operator 2026-09-09: the loop) */ secret?: string }
const readDraft = (): Draft | null => { try { const raw = sessionStorage.getItem(DRAFT_KEY); return raw ? (JSON.parse(raw) as Draft) : null; } catch { return null; } };
/** Best effort — a draft over the storage quota is simply not kept; the page still works. */
const keepDraft = (d: Draft): boolean => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); return true; } catch { return false; } };
const dropDraft = () => { try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage unreadable */ } };

/** Two signers named on a build without a shared store: the hand-off cannot be minted — say why. */
const multiLocal = (signers: number, mode: string, step: Step) => signers > 1 && mode === "local" && step === "signers";

export function SignFlow({ token, secret, defaultName, defaultContact, seed, fileLink, requireLogin, returnTo, file }: {
  token?: string; secret?: string; defaultName?: string; defaultContact?: string;
  /** Create Doc hands a generated PDF in as file 1; a 24-hour link (?f=) hands a partly-signed one in the same way. */
  seed?: { name: string; bytes: Uint8Array } | null;
  /** The ?f= token: this reader is a hand-off RECIPIENT — no account, the offline path (the file travels on), never the creator's login. */
  fileLink?: string;
  /** The site has Auth0: ask for the login at "Sign & save" (creator path only). */
  requireLogin?: boolean; returnTo?: string;
  /** A saved link's ONE file (its 8-hex short hash): on a complete envelope that file is focused and downloaded once (operator 2026-09-09). */
  file?: string;
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
  const [tmpLinks, setTmpLinks] = useState<TempLink[]>([]);                // one 24-hour link PER FILE, when the site has a store (a multi-file envelope hands every file over)
  const tmpLink = tmpLinks[0] ?? null;
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
    } catch (e) { setAiState("failed"); const m = String((e as Error).message ?? e); setErr(`${t("soi.sign.ai.title")}: ${t("soi.sign.ai.failed")}${/\S/.test(m) ? ` (${m.slice(0, 80)})` : ""}`); }   // the sentence is the lexicon's; the provider's words follow in brackets, cut short
  };
  const [pub, setPub] = useState<PublicEnvelope | null>(null);
  const [nextLink, setNextLink] = useState("");
  const [myLink, setMyLink] = useState("");                     // the creator's own return link — "yours, keep it" (Christo, wave 1)
  const [nextName, setNextName] = useState(""); const [nextContact, setNextContact] = useState("");
  const [signed, setSigned] = useState<{ name: string; bytes: Uint8Array }[]>([]);
  const envRef = useRef<Envelope | null>(null);
  const pendingToken = useRef("");                              // minted before stamping so the PDF can carry it
  const fitRef = useRef<FitAt | null>(null);                    // the page view's pixel fit, for + Date / + Text
  const viewRef = useRef<ViewCenter | null>(null);              // the page view's visible centre, for + Text with nothing to follow
  const [tz, setTzState] = useState<string>(DEFAULT_TZ);         // the zone the record is spelled in — Central (Austin) by default, chosen before signing (operator 2026-09-09)
  useEffect(() => { setTzState(readTz()); }, []);
  const setTz = (z: string) => { if (isTz(z)) { setTzState(z); saveTz(z); } };
  const [localFallback, setLocalFallback] = useState(false);
  const mode = localFallback ? "local" : storeMode();
  // the offline hand-off: no link could be minted (no Supabase / no 036) — the partly-signed file travels by hand
  const [offline, setOffline] = useState<string>("");   // the SignStoreError code that kept the record on this device ("" = a shared record)
  // Outside an Auth0Provider this is the library's inert default context — it is only ACTED on when requireLogin.
  const auth = useAuth0();
  const loggedIn = needLogin && auth.isAuthenticated;
  const authState: AuthState = needLogin ? (loggedIn ? "in" : "guarded") : "bypassed";
  const [resumed, setResumed] = useState(false);
  const snapshot = (): Draft => ({ title, files: files.map((f) => ({ name: f.name, base64: f.base64 })), signers, marks, png, initialsPng, token: pendingToken.current, secret: envRef.current?.signers[0]?.secret ?? "" });
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
      // a draft whose envelope already LANDED (the page died between the save and dropDraft): open the record instead of asking for
      // the signature again (operator 2026-09-09: "loops asking for signatures even though completed"). Best effort — an unreachable
      // store restores as before.
      if (d.token && d.secret && storeMode() === "supabase") {
        try { const e = await getEnvelope(d.token, d.secret); if (e.status !== "awaiting" || (e.signers[0]?.signed_at ?? null)) { dropDraft(); window.location.replace(signLink(window.location.origin, d.token, d.secret)); return; } }
        catch { /* not there: nothing landed — restore the draft */ }
      }
      const fs: Loaded[] = [];
      for (const f of d.files) { const b = base64ToBytes(f.base64); fs.push({ name: f.name, bytes: b, base64: f.base64, sha256: await sha256Hex(b), pages: await pageCount(b) }); }
      setTitle(d.title); setFiles(fs); setSigners(d.signers.length ? d.signers : [{ name: "", contact: "" }]); setMarks(d.marks ?? {}); setPng(d.png ?? null); setInitialsPng(d.initialsPng ?? null); pendingToken.current = d.token ?? "";
      setStep(d.png ? "draw" : "place"); setResumed(true); dropDraft();
    })();
  }, [countersign]);
  // the draft is kept from the draw step on (files, signers, boxes, stroke) — a reload comes back to it
  useEffect(() => { if (!countersign && step === "draw" && files.length) keepDraft(snapshot()); }, [step, png]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {                                                                                    // 30-s watchdog: the page says so instead of hanging
    if (step !== "saving") return;
    // H1 (AAR class sweep): a HANG is a dead end no catch can reach — an untimed fetch, a pdfjs worker that never settles.
    // The watchdog used to only print "this is slow" and leave the signer on a panel with no button while his finished file
    // sat in a closure the UI could not reach. Now it HANDS HIM THE FILE: 30 s to say it is slow, 60 s to end the wait on the
    // outcome panel if anything was stamped.
    const slow = setTimeout(() => setErr(t("soi.sign.err.slow")), 30_000);
    const out = setTimeout(() => {
      const done = stampedRef.current;
      if (!done.length) return;                                // nothing stamped yet: the pads are still the right place
      setSigned(done); setLocalFallback(true); setSaveRefused(true); setOffline("slow_done"); setStep("done");
    }, 60_000);
    return () => { clearTimeout(slow); clearTimeout(out); };
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
        if (e.mode !== "local") setMyLink(signLink(window.location.origin, token!, secret ?? ""));   // the saved link exists on every reopen (Asar); a device-local link opens nowhere
        const fs: Loaded[] = (e.files ?? []).map((f) => { const b = base64ToBytes(f.pdf_base64); return { name: f.name, bytes: b, base64: f.pdf_base64, sha256: f.sha256, pages: f.page_count }; });
        setFiles(fs);
        if (e.party >= 0) { const pre = await preplaced(fs, e.party); if (Object.keys(pre).length) setMarks(pre); }
        if (e.status === "complete") { setSigned(fs.map((f) => ({ name: f.name, bytes: f.bytes }))); setStep("done"); return; }
        if (e.status !== "awaiting") { setErr(t(`soi.sign.status.${e.status}`)); setFailStage("open"); setStep("error"); return; }
        setStep(e.current_signer_idx === e.party ? "place" : "waiting");
      } catch (ex) { if (live) { setErr(`${t("soi.sign.stage.open")}: ${ex instanceof SignStoreError ? signerErr(ex.code) : t("soi.sign.err.device_only")}`); setFailStage("open"); setStep("error"); } }
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
      if (e.mode !== "local") setMyLink(signLink(window.location.origin, token!, secret ?? ""));
      // the FINAL version from the store, not the files captured at open (Enki: a party who waited to completion downloaded the pre-final bytes)
      if (e.status === "complete") { const fin = (e.files ?? []).map((f) => ({ name: f.name, bytes: base64ToBytes(f.pdf_base64) })); setSigned(fin.length ? fin : files.map((f) => ({ name: f.name, bytes: f.bytes }))); setStep("done"); return; }
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
  const [creatorContact, setCreatorContact] = useState("");                // 037: on completion, the creator's contact — the finished file goes back to them
  const [creatorMail, setCreatorMail] = useState<"" | "sent" | "manual">("");
  const creatorMailed = useRef(false);
  useEffect(() => {
    // the creator is told the document completed (fleet pass 2, Christo): the last signer's phone mails the finished file to the
    // creator through the site's own mail, once; without a mail key the send row (already prefilled) is the way, and the line says so
    if (step !== "done" || !countersign || !creatorContact || !signed.length || creatorMailed.current) return;
    creatorMailed.current = true;
    if (contactKind(creatorContact) !== "email") { setCreatorMail("manual"); return; }
    void (async () => {
      try {
        const all: MailAttachment[] = await Promise.all(signed.map(async (f) => ({ name: await signedName(f, true), base64: bytesToBase64(f.bytes) })));
        if (!mailFits(all)) { setCreatorMail("manual"); return; }              // over the mail caps: the send row (Text / share sheet) is the way
        const r = await sendSignerEmail({ to: creatorContact, sender: myName, title: pub?.title ?? title, final: true, attachment: all[0], attachments: all.slice(1) });
        setCreatorMail(r === "sent" ? "sent" : "manual");
      } catch { setCreatorMail("manual"); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, countersign, creatorContact, signed]);
  // the saved link per file (operator 2026-09-09): each finished file's sha256 → its sha8 key; a link that names one file focuses it and
  // downloads it ONCE per device (sessionStorage guard — never again on every reopen, Pangu/Enki)
  const [signedSha, setSignedSha] = useState<string[]>([]);
  const stampedRef = useRef<{ name: string; bytes: Uint8Array }[]>([]);   // H1: what the watchdog hands over when a call hangs
  const [extrasFailed, setExtrasFailed] = useState("");                   // H2: the signature stands, an enhancement did not
  const [saveRefused, setSaveRefused] = useState(false);                  // the store did not take this pass: never claim completion
  const [diagOn, setDiagOn] = useState(false);                            // ?diag=1 — the operator's door, off every signer path
  useEffect(() => { try { setDiagOn(new URLSearchParams(window.location.search).get("diag") === "1"); } catch { /* no window */ } }, []);
  useEffect(() => { let live = true; void Promise.all(signed.map((f) => sha256Hex(f.bytes))).then((h) => { if (live) setSignedSha(h); }); return () => { live = false; }; }, [signed]);
  const focusIdx = useMemo(() => (file && signedSha.length ? signedSha.findIndex((h) => h.startsWith(file)) : -1), [file, signedSha]);
  useEffect(() => {
    if (step !== "done" || focusIdx < 0 || !signed[focusIdx]) return;
    const key = `exel-sign-dl:${token ?? ""}:${file ?? ""}`;
    try { if (sessionStorage.getItem(key) === "1") return; sessionStorage.setItem(key, "1"); } catch { /* storage unreadable: download once now */ }
    void download(signed[focusIdx], true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, focusIdx]);
  // The route to the migration SQL, which used to live inside the removed "Why can't I sign?" disclosure (operator 04:59 CST).
  // It appears only where it is actionable: on a panel that already says the database did not take the record.
  /**
   * THE SIGNER NEVER MEETS THE MACHINE (operator 2026-09-10).
   * Everything that means "we could not make a shared copy" — no store on the build, an unapplied or incomplete migration,
   * an RPC that errored, timed out or was unreachable, a full device, a save that outran the clock — is ONE sentence in the
   * signer's own terms: the file is on this phone, take it and send it. The engineering cause never reaches this screen;
   * it stays in the console and on the operator's own diagnostics door (?diag=1). Only codes the SIGNER can act on keep
   * their own wording: a link that is not theirs, an expired or revoked document, not their turn, a file too large.
   */
  const DEVICE_ONLY = new Set(["no_backend", "no_migration", "migration_incomplete", "rpc_error", "unreachable", "timeout", "storage_full", "slow_done", "duplicate"]);
  const signerErr = (code: string): string => t(DEVICE_ONLY.has(code) ? "soi.sign.err.device_only" : `soi.sign.err.${code}`);
  const [carriedIdx, setCarriedIdx] = useState<number | null>(null);     // which row this reader signs in a carried file
  // "remove field and redo" (operator 2026-09-08 22:40): a carried file's LAST signer may open his own text marks again —
  // remove or retype them — and save; the signature, initials, codex row and hidden strip stay. Never a later signer's record.
  const [carried, setCarried] = useState<{ lastName: string; lastIdx: number; hasNext: boolean } | null>(null);
  const [editOwn, setEditOwn] = useState<{ pass: number; isoDate: string; chain: string; marks: TextMark[] } | null>(null);
  const [editReceipt, setEditReceipt] = useState<{ name: string; signed: boolean; stamp?: string }[]>([]);
  const [localReceipt, setLocalReceipt] = useState<{ name: string; signed: boolean; stamp?: string }[]>([]);   // what THIS device witnessed when the store took nothing
  const docTextH = useRef<number | null>(null);                                  // the document's text size the last fit measured (Same size uses it)
  const enterEditOwn = async (f0: Loaded, last: { rowIndex: number; name?: string; isoDate: string }) => {
    const tms = (await textBoxes(f0.bytes)).filter((m) => m.signerIdx === last.rowIndex);
    setEditOwn({ pass: last.rowIndex, isoDate: tms[0]?.isoDate ?? last.isoDate, chain: tms[0]?.chain && tms[0].chain !== "genesis" ? tms[0].chain : "", marks: tms });
    setMarks({ 0: tms.map((m, i) => ({ id: `st${i}`, kind: "text" as const, page: m.page, x: m.x, y: m.y, w: m.w, h: m.h, text: m.text ?? "", fit: "stamped" as const })) });
    setFileIdx(0); setSelected(null); setStep("place");
  };
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
      const last = rows[rows.length - 1];
      const free = hs.map((h) => h.idx).filter((k) => !taken.has(k));                    // placeholders nobody has filled yet
      if (last) { setCarried({ lastName: last.name || fill(t("soi.sign.signer_n"), "n", last.rowIndex + 1), lastIdx: last.rowIndex, hasNext: free.length > 0 }); if (!free.length && !hs.length) { void enterEditOwn(f0, last); return; } }   // one signer, nobody next: the uploader is that signer
      if (last && !free.length) return;                                                    // a FINISHED file: nobody is next; only its last signer may open his own text (the banner)
      const nextIdx = free.length ? Math.min(...free) : rows.length;                       // Math.min() of nothing is Infinity — it crashed the signers array on a finished file
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
  /** + Text / + Date (operator 2026-09-08 22:55): the new mark goes BELOW the last text or date entered on this page (same left edge,
   *  same size, one line down — snapped to the form's next rule when one is there); with no entry yet, under the signature's own
   *  "Date:" line when the signature is on this page; else in the CENTRE OF THE CURRENT VIEW (what the reader sees at this zoom and
   *  scroll), never the centre of the page. A fitted mark is one text line tall with its bottom on the rule. */
  const addText = (text: string) => {
    const cur = marks[fileIdx] ?? []; const sig = cur.find((m) => m.kind === "sig");
    const page = viewedPage; const onSigPage = sig && sig.page === viewedPage;
    const id = `t${Date.now().toString(36)}`;
    const texts = cur.filter((m) => m.kind === "text" && m.page === page); const last = texts[texts.length - 1];
    const gap = 0.004;
    const cap = (f: NonNullable<ReturnType<FitAt>>) => { const h = f.textH ? Math.min(0.03, Math.max(0.012, f.textH * 1.9)) : Math.min(f.h, TXT_H); return { h, y: f.y + f.h - h }; };
    const taken = (f: NonNullable<ReturnType<FitAt>>) => cur.some((m) => m.kind === "text" && m.page === page && Math.abs(m.y + m.h - (f.y + f.h)) < 0.006);   // that rule already carries a mark
    let mark: Mark;
    if (last) {
      // below the last entry: its left edge and size, one line down; the form's next rule takes it when one sits there
      const y = Math.min(1 - last.h, last.y + last.h + gap);
      const f = fitRef.current?.({ x: last.x + Math.min(0.05, last.w / 2), y: y + last.h / 2 });
      if (f?.textH) docTextH.current = f.textH;
      // the next rule takes it only when it starts where the last entry starts (a form's column of lines); size stays the last entry's
      mark = f && f.lineY > last.y + last.h && f.lineY < y + last.h * 2 && Math.abs(f.x - last.x) < 0.03 && !taken(f) ? { id, kind: "text", page, x: last.x, y: f.y + f.h - last.h, w: last.w, h: last.h, text, fit: "underline" } : { id, kind: "text", page, x: last.x, y, w: last.w, h: last.h, text, fit: "default" };
    } else if (onSigPage && sig) {
      // the document's own "Date: ____" line, just under the signature, takes the mark (same fit as the signature box)
      const f = fitRef.current?.({ x: sig.x + Math.min(0.1, sig.w / 2), y: sig.y + sig.h + 0.03 });
      if (f?.textH) docTextH.current = f.textH;
      mark = f && f.lineY > sig.y + sig.h && f.h < sig.h * 1.5 && !taken(f) ? { id, kind: "text", page, x: f.x, ...cap(f), w: f.w, text, fit: "underline" } : { id, kind: "text", page, x: sig.x, y: Math.min(sig.y + sig.h + 0.01, 1 - TXT_H), w: TXT_W, h: TXT_H, text, fit: "default" };
    } else {
      // nothing to follow: the centre of what is on screen now (zoom + scroll), snapped to a rule there when one is under it
      const c = viewRef.current?.() ?? { x: 0.5, y: 0.5 };
      const f = fitRef.current?.(c);
      if (f?.textH) docTextH.current = f.textH;
      mark = f && !taken(f) ? { id, kind: "text", page, x: f.x, ...cap(f), w: f.w, text, fit: "underline" } : { id, kind: "text", page, x: Math.min(Math.max(c.x - TXT_W / 2, 0), 1 - TXT_W), y: Math.min(Math.max(c.y - TXT_H / 2, 0), 1 - TXT_H), w: TXT_W, h: TXT_H, text, fit: "default" };
    }
    setMarks((b) => ({ ...b, [fileIdx]: [...cur, mark] })); setSelected(id);
    setTimeout(() => { const boxes = document.querySelectorAll('[data-testid="text-box"]'); boxes[boxes.length - 1]?.scrollIntoView({ block: "center", behavior: "smooth" }); }, 50);
  };
  const todayText = () => dateIn(activeLocale, new Date(), { year: "numeric", month: "short", day: "numeric", timeZone: tz });   // the Globe's language, Latin digits
  const selMark = (marks[fileIdx] ?? []).find((m) => m.id === selected) ?? null;
  const setSelText = (text: string) => setMarks((b) => ({ ...b, [fileIdx]: (b[fileIdx] ?? []).map((m) => (m.id === selected ? { ...m, text } : m)) }));
  /** Every text mark on this file to ONE height (bottom kept on its line): the document's own text size when a fit measured it, else the
   *  median of the marks; clamp [0.012, 0.03] (operator 2026-09-08: "set all text to same size at end of form completion"). */
  const sameSize = () => setMarks((b) => {
    const cur = b[fileIdx] ?? []; const texts = cur.filter((m) => m.kind === "text"); if (texts.length < 2) return b;
    const hs = texts.map((m) => m.h).sort((a, c) => a - c); const median = hs[Math.floor(hs.length / 2)];
    const h = Math.min(0.03, Math.max(0.012, docTextH.current ? docTextH.current * 1.9 : median));
    return { ...b, [fileIdx]: cur.map((m) => (m.kind === "text" ? { ...m, y: m.y + m.h - h, h } : m)) };
  });
  /** Edit-own save: a removed or changed stamped mark leaves the file (its glyphs stripped, its keyword dropped); changed and new marks are
   *  stamped with the SAME pass (index, time, chain-before) so the record stays one pass. No new signature, no new codex row. */
  const saveEdits = async () => {
    if (!editOwn || !files[0]) return;
    setErr("");
    try {
      let out = files[0].bytes; const cur = marks[0] ?? [];
      const near = (a: number, b: number) => Math.abs(a - b) < 1e-4;
      const unchanged = (om: TextMark, m: Mark | undefined) => !!m && (m.text ?? "").trim() === (om.text ?? "").trim() && near(m.x, om.x) && near(m.y, om.y) && near(m.w, om.w) && near(m.h, om.h);
      for (let i = 0; i < editOwn.marks.length; i++) { const om = editOwn.marks[i]; if (!unchanged(om, cur.find((m) => m.id === `st${i}`))) out = await unstampText(out, om); }
      for (const m of cur.filter((k) => k.kind === "text" && (k.text ?? "").trim())) {
        const idx = /^st(\d+)$/.exec(m.id); const om = idx ? editOwn.marks[Number(idx[1])] : undefined;
        if (om && unchanged(om, m)) continue;
        out = await stampText(out, m, m.text!.trim(), { signerIdx: editOwn.pass, isoDate: editOwn.isoDate, chain: editOwn.chain });
      }
      const rows = (await codexRows(out)).filter((r) => r.rowIndex >= 0).sort((a, b) => a.rowIndex - b.rowIndex);
      setEditReceipt(rows.map((r) => ({ name: r.name || fill(t("soi.sign.signer_n"), "n", r.rowIndex + 1), signed: true, stamp: cacStamp(r.isoDate, tz) })));
      setSigned([{ name: files[0].name, bytes: out }]); setStep("done");
    } catch (ex) { console.info("[sign] page render:", (ex as Error).message); setErr(`${t("soi.sign.stage.stamp")}: ${t("soi.sign.err.device_only")}`); setFailStage("stamp"); }
  };
  const removeSel = () => { setMarks((b) => ({ ...b, [fileIdx]: (b[fileIdx] ?? []).filter((m) => m.id !== selected) })); setSelected(null); };
  // − / + scale the selected mark about its bottom-left corner: the baseline never moves (operator 2026-09-08)
  const resizeSel = (f: number) => setMarks((b) => ({ ...b, [fileIdx]: (b[fileIdx] ?? []).map((m) => { if (m.id !== selected) return m; const w = Math.min(1, Math.max(0.08, m.w * f)), h = Math.min(1, Math.max(0.02, m.h * f)); return { ...m, w, h, y: Math.max(0, m.y + m.h - h) }; }) }));
  const myIdx = countersign ? (pub?.party ?? 0) : 0;
  // Did the DOCUMENT complete, or did only THIS signer finish? The outcome panel renders either way (the invariant), but it may
  // never claim more than happened: a refused save mid-chain is "hand the file over", not "every signer has signed" (Christo).
  // H4: `pub` comes from a network response — never dereference its array unchecked, or a malformed body blanks the whole
  // component during render (the file in hand and nothing on screen).
  const pubSigners = Array.isArray(pub?.signers) ? pub!.signers : [];
  // A refused save means nothing landed, so the panel may not say "complete" however far down the roster this signer sits
  // (found walking the stages: the heading claimed completion while the roster said "your turn now").
  const outcomeComplete = !saveRefused && (pub?.status === "complete" || (!countersign ? signers.length === 1 : !!pub && pubSigners.length > 0 && myIdx === pubSigners.length - 1));
  // in a carried file this reader is the next free row, not row 0 (the earlier signers are already in the file)
  const myName = countersign ? (pubSigners[myIdx]?.name ?? "") : signers[carriedIdx ?? 0]?.name ?? signers[0]?.name ?? "";
  const meIdx = countersign ? myIdx : Math.min(carriedIdx ?? 0, Math.max(0, signers.length - 1));   // the row THIS pass signs in

  // ── stamp + save ─────────────────────────────────────────────────────────────
  // The marks of this pass, per file, as the record keeps them (page, box, text) — sign_events.marks
  const passMarks = () => files.map((_, i) => (marks[i] ?? []).map((m) => ({ kind: m.kind, page: m.page, x: +m.x.toFixed(4), y: +m.y.toFixed(4), w: +m.w.toFixed(4), h: +m.h.toFixed(4), ...(m.kind === "text" ? { text: (m.text ?? "").slice(0, 200) } : {}) })));
  const sign = useCallback(async () => {
    if (!png || !initialsPng) return;
    if (!allPlaced) { setErr(t("soi.sign.x.place")); return; }   // H9: never a silent no-op — say what is missing
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
    // hoisted so the CATCH can see the finished files: a stamped signature is never discarded (MoT ruling, AAR 2026-09-09)
    const stampedBytes: { name: string; bytes: Uint8Array }[] = [];
    stampedRef.current = stampedBytes; setExtrasFailed(""); setSaveRefused(false);
    try {
      const isoDate = new Date().toISOString();
      const prevChain = countersign ? (pub?.chain ?? "") : "";
      if (!countersign && !pendingToken.current) pendingToken.current = newToken();
      const stamped: SignFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const recorded = (await codexRows(f.bytes)).filter((r) => r.rowIndex >= 0);
        const myRow = countersign || !recorded.some((r) => r.rowIndex === meIdx) ? meIdx : Math.max(...recorded.map((r) => r.rowIndex)) + 1;
        const myContact = countersign ? pubSigners[meIdx]?.contact_masked : signers[meIdx]?.contact;   // names a signer whose name the PDF font cannot draw
        let out = await stampSignature(f.bytes, sigOf(i)!, { pngDataUrl: png, name: myName, isoDate, hash: shortHash(prevChain || f.sha256), contact: myContact, signerIdx: myRow, tz, envelope: { token: countersign ? token! : pendingToken.current, chain: prevChain } });
        // every text mark is bound to THIS signer's pass — index, time, chain-before (Odin, Thor)
        for (const m of (marks[i] ?? []).filter((m) => m.kind === "text" && (m.text ?? "").trim())) out = await stampText(out, m, m.text!.trim(), { signerIdx: meIdx, isoDate, chain: prevChain });
        // the signatory block: this signer's row, CAC-style timestamp + Light Codex 2×2 strip (operator)
        const nameOf = (i: number) => (countersign ? pubSigners[i]?.name : signers[i]?.name) ?? fill(t("soi.sign.signer_n"), "n", i + 1);
        // rows already in the file: a file carried by hand (offline hand-off) keeps its earlier signers by the NAME in
        // the keyword; this signer takes the next free row rather than overwriting one
        const total = Math.max(countersign ? (pubSigners.length || 2) : signers.length, myRow + 1);
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
        // ── H2 (AAR class sweep) · everything from here to the hash ENHANCES a file that is already signed: the codex strip
        // and the next signer's placeholders. A throw in any of them used to discard `out` entirely, so file 2 of 3 vanished
        // while file 1 was presented as a completed pass. Best-effort now; the stamped file is pushed no matter what.
        try {
        // one HIDDEN Light Codex line with EVERY signatory so far, on the bottom edge of every page (operator 23:15 / 00:45)
        out = await stampCodexBlock(out, { total, rows: allRows, all: codexImage(codexAllText(allRows, tz)), initials: { total, mine: { idx: myRow, pngDataUrl: initialsPng }, topByPage } });
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
        } catch (ex) { setExtrasFailed(String((ex as Error).message ?? ex).slice(0, 120)); }   // the signature stands; the extras did not
        const sha = await sha256Hex(out);
        stamped.push({ name: f.name, page_count: f.pages, pdf_base64: bytesToBase64(out), sha256: sha, version: 0 });
        stampedBytes.push({ name: f.name, bytes: out });
        stampedRef.current = stampedBytes;                     // H1: the watchdog can see the finished files from outside the closure
      }
      // ── THE INVARIANT (operator 2026-09-09 04:59 CST; MoT ruling after the AAR) ─────────────────────────────────────────
      // A completed signature is NEVER discarded. The bytes are stamped; from here the outcome panel is unconditional and the
      // file is downloadable, textable and e-mailable whatever any backend does. The store decides only whether a SHAREABLE
      // LINK mints — never whether the signer gets his own document.
      setSigned(stampedBytes);
      const chain = await chainHash(prevChain, stamped.map((s) => s.sha256));
      let result: PublicEnvelope;
      if (!countersign) {
        stage = "create";                                      // H11: newEnvelope's own refusals are a CREATE failure, not a stamping one
        const env = { ...newEnvelope({ title: title || files[0].name.replace(/\.pdf$/i, ""), created_by: signers[0].contact, signers, files: files.map((f) => ({ name: f.name, page_count: f.pages, pdf_base64: f.base64, sha256: f.sha256, version: 0 })) }), token: pendingToken.current };
        envRef.current = env; keepDraft(snapshot());               // the draft now carries token + secret: a restore can find a landed save
        stage = "create";
        let created: { token: string; mode: StoreMode; why?: string };
        try { created = await createEnvelope(env); }
        catch (ex) {
          // no link can be minted here — keep the envelope on this phone and hand the FILE over instead (operator 00:39)
          if (ex instanceof SignStoreError && (ex.code === "no_backend" || ex.code === "no_migration" || ex.code === "migration_incomplete") && multi) { created = await createEnvelope(env, { localMulti: true }); setOffline(ex.code); setTmpLinks((await Promise.all(stampedBytes.map(async (f) => putTempFile(f.bytes, await signedName(f, false))))).filter((l): l is TempLink => !!l)); }
          // a retry after a half-landed save re-sent the same token (fleet, Krishna): mint a fresh one, once
          else if (ex instanceof SignStoreError && ex.code === "duplicate") { pendingToken.current = newToken(); const env2 = { ...env, token: pendingToken.current }; envRef.current = env2; created = await createEnvelope(env2); Object.assign(env, env2); }
          // ANY other failure at create (operator 2026-09-09 04:02 CDT: "after signing I can't download, text or email — fix with
          // urgency"): the signature is already stamped — the record stays on this device and the file travels by download / Text /
          // E-mail; the block names the reason. A shared link can be minted by signing again once the site answers.
          else if (ex instanceof SignStoreError && ex.code !== "duplicate") { created = await createEnvelope(env, { localMulti: true }); setOffline(ex.code); if (multi) setTmpLinks((await Promise.all(stampedBytes.map(async (f) => putTempFile(f.bytes, await signedName(f, false))))).filter((l): l is TempLink => !!l)); }
          else throw ex;
        }
        if (created.mode === "local") { setLocalFallback(true); if (created.why) setOffline(created.why); }   // the store degraded by itself (one signer): the Done panel names why
        const next = applySignature(env, 0, env.signers[0].secret, isoDate, stamped, chain);
        envRef.current = next;
        stage = "save";
        result = await signEnvelope(env.token, 0, env.signers[0].secret, stamped, chain, next, passMarks());
      } else {
        // the countersigner has no local Envelope to fall back to (the secrets are not his to hold), so a refusal here is caught
        // below and ends on the outcome panel with his stamped file — never back at the pads (Enki/Thor, AAR 2026-09-09)
        stage = "save";
        result = await signEnvelope(token!, myIdx, secret!, stamped, chain, undefined, passMarks());
      }
      dropDraft(); setErr("");
      setPub(result); setSigned(stampedBytes);
      // The pass landed on THIS DEVICE rather than in the shared record (the store refused and signEnvelope kept it here).
      // Say so: the badge and the one human sentence, and no saved link, because a link would serve the unsigned version.
      if (result.mode === "local" && storeMode() === "supabase") { setLocalFallback(true); setOffline("rpc_error"); }
      if (result.creator_contact) setCreatorContact(result.creator_contact);   // 037: the finished file goes back to the creator
      if (result.status === "complete") { if (result.mode !== "local") setMyLink(signLink(window.location.origin, result.token, countersign ? secret! : envRef.current?.signers[0]?.secret ?? "")); setStep("done"); return; }
      const nxt = result.signers[result.current_signer_idx];
      const nextSecret = result.next_secret ?? (envRef.current?.signers[result.current_signer_idx]?.secret ?? "");
      setNextName(nxt?.name ?? ""); setNextContact(countersign ? (result.next_contact ?? "") : signers[result.current_signer_idx]?.contact ?? "");   // 037: a middle signer gets the next signer's contact too
      setNextLink(result.mode === "local" && multi ? "" : signLink(window.location.origin, result.token, nextSecret));   // a device-local link opens nowhere else
      setMyLink(signLink(window.location.origin, result.token, countersign ? secret! : envRef.current?.signers[0]?.secret ?? ""));
      setStep("handoff");
    } catch (ex) {
      // never silent: the step that failed, then the reason
      const code = ex instanceof SignStoreError ? ex.code : "";
      // the cause is for us, not for him: it goes to the console; he reads one sentence about his document
      if (code && DEVICE_ONLY.has(code)) console.info("[sign] store unavailable:", code, (ex as Error).message);
      setErr(`${t(`soi.sign.stage.${stage}`)}: ${code ? signerErr(code) : t("soi.sign.err.device_only")}`);
      setFailStage(stage);
      // THE INVARIANT: with a stamped file in hand the signer lands on the outcome panel — Download · Text · E-mail · Copy — and
      // the failure is a NOTE on it, never a wall that costs him the signature (operator 04:59 CST: "this error comes up after
      // signing"; the save stage had no fallback, only create did). Only a failure BEFORE stamping returns to the pads.
      // H6: the draft is KEPT here. The store did not take the record, so this device is the only copy; dropping it meant an
      // evicted tab lost the signature outright.
      if (stampedBytes.length) {
        setSigned(stampedBytes); setLocalFallback(true); setSaveRefused(true); setOffline(code || "rpc_error");
        // the record refused the pass, but this device witnessed it: the receipt says who signed, not "0 signatures"
        setLocalReceipt((countersign ? pubSigners.map((x) => ({ name: x.name, signed: !!x.signed_at, stamp: x.signed_at ? cacStamp(x.signed_at, tz) : undefined })) : signers.map((x) => ({ name: x.name, signed: false })))
          .map((r, i) => (i === meIdx ? { name: myName, signed: true, stamp: cacStamp(new Date().toISOString(), tz) } : r)));
        setStep("done"); return;
      }
      setStep("draw");
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
      case "place": return editOwn ? t("soi.sign.x.edit_own") : allPlaced ? t("soi.sign.x.placed") : t("soi.sign.x.place");
      case "draw": return png && initialsPng ? t("soi.sign.x.drawn") : png ? t("soi.sign.x.initials") : t("soi.sign.x.draw");
      case "saving": return t("soi.sign.saving");
      case "login": return t("soi.sign.x.login");
      case "handoff": return offline ? t("soi.sign.x.handoff_offline") : t("soi.sign.x.handoff");
      case "done": return editOwn ? t("soi.sign.x.edited") : t("soi.sign.x.done");
      case "waiting": return fill(t("soi.sign.turn_of"), "name", pubSigners[pub?.current_signer_idx ?? 0]?.name ?? "…");
      case "not_party": return t("soi.sign.not_party");
      case "loading": return t("soi.sign.loading");
      case "error": return err || t("soi.sign.x.error");
      default: return "";
    }
  })();

  const Roster = () => pub && pub.party >= 0 ? (   // a wrong secret (not_party) never reads the roster (Christo, Thor)
    <ol className="mt-2 grid gap-1 text-xs" data-testid="roster">
      {pubSigners.map((s, i) => (
        <li key={i} className="flex items-center justify-between rounded border border-border px-2 py-1">
          <span>{i + 1}. {s.name} <span className="text-muted-foreground">{s.contact_masked}</span>{s.me && <span className="ms-1 rounded bg-primary/15 px-1 text-[10px]">{t("soi.sign.you")}</span>}</span>
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
      {/* The operator's own door, never on a signer's path (2026-09-10): /soi-session/sign/?diag=1 shows the technical panel
          — store, backend, build and the migration SQL. A person signing a document never types that, and nothing on his own
          screen names a database, a migration or a vendor. */}
      {diagOn && <SignDiag d={{ mode, auth: authState, authName: auth.user?.email ?? auth.user?.name, multi: countersign ? pubSigners.length > 1 : multi, err, step, stage: failStage }} open onToggle={() => { /* always open on the operator's door */ }} />}

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
          {requireLogin && !loggedIn && <p className="mt-1 text-[11px] text-muted-foreground" data-testid="login-later">{t("soi.sign.login.later")} <button type="button" onClick={login} className="min-h-[44px] text-primary underline-offset-2 hover:underline">{t("soi.sign.login.now")}</button></p>}
          {files.length > 0 && (
            <ul className="mt-3 grid gap-1 text-sm" data-testid="file-list">
              {carried && !editOwn && <li className="mb-1 rounded-md border border-amber-500/50 bg-amber-300/10 p-2 text-xs" data-testid="carried">
                <div>{fill(t("soi.sign.carried.signed_by"), "name", carried.lastName)}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <button type="button" onClick={() => { const f0 = files[0]; void (async () => { const rows = (await codexRows(f0.bytes)).filter((r) => r.rowIndex === carried.lastIdx); if (rows[0]) await enterEditOwn(f0, rows[0]); })(); }} className="min-h-[44px] rounded-md border border-amber-500/70 px-3 text-xs" data-testid="carried-i-am">{fill(t("soi.sign.carried.i_am"), "name", carried.lastName)}</button>
                  {carried.hasNext && <span className="self-center text-muted-foreground">· {t("soi.sign.carried.next")}: {t("soi.sign.next")} →</span>}
                </div>
              </li>}
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded border border-border px-2 py-1">
                  <span>{f.name} <span className="text-xs text-muted-foreground">· {fill(t("soi.sign.pages"), "n", f.pages)} · #{shortHash(f.sha256)}</span></span>
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
                <span>{i === 0 ? t("soi.sign.me") : fill(t("soi.sign.signer_n"), "n", i + 1)}</span>
                {i > 0 && <button type="button" onClick={() => setSigners((x) => x.filter((_, j) => j !== i))} className="min-h-[44px] px-2 text-muted-foreground" aria-label={t("soi.sign.remove_signer")}>✕</button>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={s.name} onChange={(e) => setSigner(i, { name: e.target.value })} placeholder={t("soi.sign.name_ph")} className="rounded-md border border-border bg-background px-2 py-2 text-sm" data-testid={`signer-name-${i}`} />
                <input value={s.contact} onChange={(e) => setSigner(i, { contact: e.target.value })} placeholder={t("soi.sign.contact_ph")} inputMode="email" className="rounded-md border border-border bg-background px-2 py-2 text-sm" data-testid={`signer-contact-${i}`} />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setSigners((x) => [...x, { name: "", contact: "" }])} className="min-h-[44px] text-sm text-primary">+ {t("soi.sign.add_signer")}</button>
          {multi && mode === "local" && <p className="mt-2 text-xs text-amber-500">{signerErr("no_backend")}</p>}
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
          <PdfPageView bytes={files[fileIdx].bytes} marks={marks[fileIdx] ?? []} onMarks={(m) => setMarks((x) => ({ ...x, [fileIdx]: m }))} selectedId={selected} onSelect={setSelected} preview={png} onPage={setViewedPage} fitRef={fitRef} viewRef={viewRef} onDelete={(id) => { setMarks((b) => ({ ...b, [fileIdx]: (b[fileIdx] ?? []).filter((m) => m.id !== id) })); setSelected(null); }} />
          {/* marks toolbar: add a date or a note; size the selected mark; edit its text */}
          <div className="mt-2 flex flex-wrap items-center gap-2" data-testid="marks-toolbar">
            <button type="button" onClick={() => addText(todayText())} className="min-h-[44px] rounded-md border border-border px-3 text-xs" data-testid="add-date">+ {t("soi.sign.add_date")}</button>
            <button type="button" onClick={() => addText(t("soi.sign.text_default"))} className="min-h-[44px] rounded-md border border-border px-3 text-xs" data-testid="add-text">+ {t("soi.sign.add_text")}</button>
            {(marks[fileIdx] ?? []).filter((m) => m.kind === "text").length >= 2 && <button type="button" onClick={sameSize} className="min-h-[44px] rounded-md border border-border px-3 text-xs" title={t("soi.sign.same_size")} data-testid="text-same-size"><span aria-hidden="true">⌶ </span>{t("soi.sign.same_size")}</button>}
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
            {editOwn ? <button type="button" onClick={() => void saveEdits()} className="inline-flex min-h-[44px] items-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" data-testid="save-edits">{t("soi.sign.save_edits")}</button> :
            <button type="button" disabled={!allPlaced} onClick={() => setStep("draw")} className="inline-flex min-h-[44px] items-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50" data-testid="to-draw">{t("soi.sign.next_draw")} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
          </div>
        </div>
      )}

      {/* ── DRAW ── */}
      {step === "draw" && (
        <div>
          <p className="mb-2 text-sm">{t("soi.sign.signing_as")} <strong>{myName}</strong></p>
          <div className="mb-3 rounded-md border border-border p-2 text-xs" data-testid="tz-box">
            <label className="block text-[11px] uppercase tracking-wide text-muted-foreground" htmlFor="sign-tz">{t("soi.sign.tz.label")}</label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <select id="sign-tz" value={ZONES.some((z) => z.id === tz) ? tz : "__device"} onChange={(e) => setTz(e.target.value === "__device" ? deviceTz() : e.target.value)} className="min-h-[44px] max-w-full rounded-md border border-border bg-background px-2 text-sm" data-testid="tz-select">
                {ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
                {!ZONES.some((z) => z.id === tz) && <option value="__device">{tz}</option>}
              </select>
              <button type="button" onClick={() => setTz(deviceTz())} className="min-h-[44px] rounded-md border border-border px-3 text-xs" data-testid="tz-device">{t("soi.sign.tz.device")}</button>
              <span className="text-muted-foreground" data-testid="tz-now">{zoneAbbr(new Date().toISOString(), tz)} · {cacStamp(new Date().toISOString(), tz)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{t("soi.sign.tz.default_note")} {t("soi.sign.tz.disclaimer")}</p>
          </div>
          {resumed && png && <p className="mb-2 text-[11px] text-primary" data-testid="stroke-kept">{t("soi.sign.x.stroke_kept")}</p>}
          <SignaturePad value={png} onChange={(p) => { if (p !== null || !resumed) setPng(p); }} />
          {/* the PHYSICAL initials (operator 00:50): drawn once, stamped at the bottom-right of every page in a clear spot */}
          <p className="mt-3 mb-1 text-sm">{t("soi.sign.draw_initials")}</p>
          <SignaturePad height={90} value={initialsPng} label={t("soi.sign.draw_initials")} onChange={(p) => { if (p !== null || !resumed) setInitialsPng(p); }} />
          {resumed && initialsPng && <p className="mt-1 text-[11px] text-primary">{t("soi.sign.x.stroke_kept")}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setStep("place")} className="min-h-[44px] rounded-md border border-border px-4 text-sm"><span aria-hidden="true">‹ </span>{t("soi.sign.back")}</button>
            <button type="button" disabled={!png || !initialsPng || (!!requireLogin && auth.isLoading)} onClick={sign} className="min-h-[44px] rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50" data-testid="sign-button"><span aria-hidden="true">◬ </span>{t("soi.sign.stamp")}</button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("soi.sign.consent")}</p>
          <p className="mt-1 flex items-start gap-2 text-[11px] text-muted-foreground" data-testid="after-save-hint"><span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/60 text-primary" aria-hidden="true"><DownloadGlyph size={12} /></span><span>{t("soi.sign.x.after_save")}</span></p>
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
              <p className="mt-1 text-xs text-muted-foreground">{signerErr(offline || "no_backend")}</p>
              <p className="mt-2 text-xs">{t("soi.sign.handoff.offline").replace("{next}", nextName || nextContact)}</p>

              {tmpLink && (
                <div className="mt-3 rounded-md border border-border bg-background p-2" data-testid="tmp-link">
                  <div className="font-medium text-foreground">{t("soi.sign.tmp.title")}</div>
                  <p className="text-muted-foreground">{t("soi.sign.tmp.hint").replace("{expires}", dateIn(activeLocale, new Date(tmpLink.expires), { dateStyle: "medium", timeStyle: "short" }, true))}</p>
                  {tmpLinks.map((l, i) => (
                    <div key={l.url} className="mt-1 flex flex-wrap items-center gap-2">{tmpLinks.length > 1 && <span className="text-[11px] text-muted-foreground">{signed[i]?.name ?? i + 1}</span>}<code dir="ltr" className="break-all text-[11px]" data-testid={i === 0 ? "tmp-url" : `tmp-url-${i + 1}`}>{l.url}</code><button type="button" onClick={() => { try { void navigator.clipboard.writeText(l.url); } catch { /* no clipboard */ } }} className="min-h-[44px] rounded-md border border-border px-3">{t("soi.sign.handoff.copy")}</button></div>
                  ))}
                </div>
              )}
              {(() => { const msg = tmpLink ? handoffMessage(myName, pub?.title ?? title, tmpLinks.map((l) => l.url).join("\n"), t("soi.sign.handoff.offline_link_template")) : handoffMessage(myName, pub?.title ?? title, `${window.location.origin}/soi-session/sign/`, t("soi.sign.handoff.offline_template")); return (
                <div data-testid="share-file"><SendRow files={signed} final={false} title={pub?.title ?? title} sender={myName} link={tmpLink?.url} toDefault={nextContact} download={(f, fin) => download(f, fin)} fileName={(f, fin) => signedName(f, fin)} message={msg} /></div>); })()}
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
                <code dir="ltr" className="break-all text-[11px] text-muted-foreground">{myLink}</code>
                <button type="button" onClick={() => { try { navigator.clipboard.writeText(myLink); } catch { /* no clipboard */ } }} className="min-h-[44px] rounded-md border border-border px-3 text-xs">{t("soi.sign.handoff.copy")}</button>
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
            <div className={`font-medium ${outcomeComplete ? "text-green-500" : "text-amber-500"}`} data-testid="outcome-title" data-complete={outcomeComplete ? "1" : "0"}>{outcomeComplete ? t("soi.sign.complete") : t("soi.sign.handoff.offline_title")}</div>
            {/* The pod's receipt shape — recorded · witnessed · settles — so a signed document reads as one of eXeL's (Pangu). */}
            <SignReceipt files={signed.map((f) => f.name)} signers={localReceipt.length ? localReceipt : pubSigners.length ? pubSigners.map((s) => ({ name: s.name, signed: !!s.signed_at, stamp: s.signed_at ? cacStamp(s.signed_at, tz) : undefined })) : editReceipt} count={localReceipt.length ? localReceipt.filter((r) => r.signed).length : pubSigners.length ? pubSigners.filter((s) => s.signed_at).length : editReceipt.length} chain={pub?.chain} />
          </div>
          <Roster />
          {extrasFailed && <p className="mt-2 text-[11px] text-muted-foreground" data-testid="extras-failed">{t("soi.sign.extras_failed")}</p>}
          {offline && mode === "local" && !err && (
            <div className="mt-2 rounded-md border border-amber-500/50 bg-amber-500/5 p-2 text-[11px]" data-testid="local-why">
              {signerErr(offline)}
              {/* the disclosure that used to carry the migration SQL is gone (operator 04:59 CST); the route to it lives here now */}
            </div>
          )}
          {creatorMail && <p className="mt-2 text-[11px] text-muted-foreground" data-testid="creator-mail" data-state={creatorMail}>{fill(t(creatorMail === "sent" ? "soi.sign.creator_mailed" : "soi.sign.creator_mail_manual"), "name", pubSigners[0]?.name ?? "")}</p>}
          {/* the message carries the RECORD link (no secret — Thor) and the chain hash; the saved link below is the holder's own key */}
          <div data-testid="downloads"><SendRow files={signed} final={outcomeComplete} title={pub?.title ?? title} sender={myName} link={myLink ? recordLink(window.location.origin, pub?.token ?? token ?? envRef.current?.token ?? "") : undefined} chain={pub?.chain} toDefault={countersign ? (creatorContact || undefined) : signers.find((x, i) => i !== meIdx)?.contact} download={(f, fin) => download(f, fin)} fileName={(f, fin) => signedName(f, fin)} focus={focusIdx} /></div>
          {myLink && mode !== "local" && signedSha.length === signed.length && (
            <div className="mt-3 rounded-lg border border-border p-3 text-xs" data-testid="saved-links">
              <div className="font-medium">{t("soi.sign.saved.title")}</div>
              <p className="text-muted-foreground">{t("soi.sign.saved.hint")}</p>
              {signed.map((f, i) => (
                <div key={f.name + i} className={`mt-2 flex flex-wrap items-center gap-2 rounded-md p-1 ${focusIdx === i ? "ring-1 ring-primary" : ""}`} data-testid={`file-link-${i + 1}`} data-focus={focusIdx === i ? "1" : undefined}>
                  <span className="max-w-[60vw] truncate">{fill(t("soi.sign.saved.file"), "n", i + 1)} · {f.name} · <span className="font-mono">{shortHash(signedSha[i])}</span></span>
                  <code dir="ltr" className="break-all text-[11px] text-muted-foreground" data-testid={`file-link-url-${i + 1}`}>{signLink(window.location.origin, pub?.token ?? token ?? envRef.current?.token ?? "", countersign ? secret! : envRef.current?.signers[0]?.secret ?? "", shortHash(signedSha[i]))}</code>
                  <button type="button" onClick={() => { try { void navigator.clipboard.writeText(signLink(window.location.origin, pub?.token ?? token ?? envRef.current?.token ?? "", countersign ? secret! : envRef.current?.signers[0]?.secret ?? "", shortHash(signedSha[i]))); } catch { /* no clipboard */ } }} className="min-h-[44px] rounded-md border border-border px-3" data-testid={`file-link-copy-${i + 1}`}>{t("soi.sign.handoff.copy")}</button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4"><VerifyFile /></div>
        </div>
      )}

      {step === "error" && pub && pub.party >= 0 && <Roster />}
      <p className="mt-5 text-[11px] text-muted-foreground"><strong className="text-foreground" data-testid="stance">{t("soi.sign.stance")}</strong> {t("soi.sign.no_fee")}</p>
    </section>
  );
}
