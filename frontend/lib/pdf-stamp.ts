/**
 * Stamp a signature into a PDF (pdf-lib, pure JS — runs in the browser and in node tests).
 * The box is given as FRACTIONS of the page (x, y from the top-left; w, h), so the same box the
 * signer tapped on a 343-px-wide phone canvas lands on the real page at any size. Each stamp is an
 * image XObject registered under a name starting with "SoISig", which is how
 * `countSignatureImages` proves how many signatures a file carries (Asar's headless gate).
 */
import { PDFDocument, PDFName, StandardFonts, degrees, rgb, PDFPage, PDFFont, PDFImage } from "pdf-lib";

export interface StampBox { page: number; x: number; y: number; w: number; h: number; /** "underline": the box was fitted to a rule on the page — bottom ON the line */ fit?: string; /** the box replaces a placeholder drawn for this signer — paint it white first */ clear?: boolean }   // page 1-based; fractions 0..1
/** White-fill a box (page fractions, top-left origin) — clears a placeholder before the real mark lands on it. */
function clearBox(page: PDFPage, box: StampBox, grow = 1.5): void {
  const { bx, by, bw, bh } = placeOnPage(page, box, 1, 1);
  page.drawRectangle({ x: bx - grow, y: by - grow, width: bw + grow * 2, height: bh + grow * 2, color: rgb(1, 1, 1), opacity: 1 });
}
export interface StampSig { pngDataUrl: string; name: string; isoDate: string; hash: string; /** ties the PDF to its envelope: token + the chain BEFORE this pass (Odin, wave 2) */ envelope?: { token: string; chain: string } }

const dataUrlBytes = (dataUrl: string): Uint8Array => {
  const b64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
  const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

/** Map a DISPLAYED-frame page-fraction box onto the unrotated media box, clamped to the page. */
function placeOnPage(page: ReturnType<PDFDocument["getPage"]>, box: StampBox, minW = 24, minH = 12) {
  const rot = ((page.getRotation().angle % 360) + 360) % 360;
  const { width, height } = page.getSize();
  let fx = box.x, fy = box.y, fw = box.w, fh = box.h;                 // fractions in the DISPLAYED frame
  if (rot === 90)       { [fx, fy, fw, fh] = [fy, 1 - fx - fw, fh, fw]; }
  else if (rot === 180) { [fx, fy] = [1 - fx - fw, 1 - fy - fh]; }
  else if (rot === 270) { [fx, fy, fw, fh] = [1 - fy - fh, fx, fh, fw]; }
  const bw = Math.min(Math.max(minW, fw * width), width), bh = Math.min(Math.max(minH, fh * height), height);
  const bx = Math.min(Math.max(fx * width, 0), width - bw);
  const by = Math.min(Math.max(height - fy * height - bh, 0), height - bh);   // PDF origin is bottom-left
  return { rot, width, height, bx, by, bw, bh };
}

/**
 * Draw options that put a W×H (display-frame) box into the media-frame rect returned by placeOnPage
 * on a page with /Rotate — pdf-lib rotates around the drawn origin, counter-clockwise, so the origin
 * walks around the rect with the angle (Enki, wave 3: a 90° page drew the signature sideways).
 */
function oriented(rot: number, bx: number, by: number, bw: number, bh: number) {
  if (rot === 90)  return { x: bx + bw, y: by, width: bh, height: bw, rotate: degrees(90) };
  if (rot === 180) return { x: bx + bw, y: by + bh, width: bw, height: bh, rotate: degrees(180) };
  if (rot === 270) return { x: bx, y: by + bh, width: bh, height: bw, rotate: degrees(270) };
  return { x: bx, y: by, width: bw, height: bh, rotate: degrees(0) };
}

/** The standard fonts speak WinAnsi only: a name like علي, 张伟 or Алексей made pdf-lib throw "cannot encode" and the
 *  save died at the stamp (fleet, Aset + Asar + Sofia + Thor, agreed across pods). Every drawn string passes through here:
 *  accents are folded (é → e when the font lacks é, but Latin-1 letters stay), anything the font cannot draw becomes
 *  a middle dot. The Unicode name still rides intact in the keywords and the Light Codex. A real Unicode font is the
 *  day-sized follow-up the fleet named. */
export const pdfSafe = (s: string): string => {
  const latin1 = (cp: number) => cp >= 0x20 && cp < 0x0100 && !(cp >= 0x7f && cp <= 0x9f);
  const out: string[] = [];
  for (const ch of s.normalize("NFC")) {
    const cp = ch.codePointAt(0) ?? 0;
    if (latin1(cp)) { out.push(ch); continue; }                                            // é, ñ, Å: Helvetica has them
    if ("‘’‚‛".includes(ch)) { out.push("'"); continue; } if ("“”„‟".includes(ch)) { out.push('"'); continue; }
    if ("–—".includes(ch)) { out.push("-"); continue; } if (ch === "…") { out.push("..."); continue; } if (ch === "•") { out.push("·"); continue; }
    if (ch === "\u20ac") { out.push("\u20ac"); continue; }
    const base = Array.from(ch.normalize("NFKD")).filter((c) => { const k = c.codePointAt(0) ?? 0; return latin1(k) && !(k >= 0x0300 && k <= 0x036f); }).join("");   // ắ → a
    out.push(base || "·");
  }
  return out.join("").replace(/·{3,}/g, "··");
};
const addKeyword = (doc: PDFDocument, kw: string) => { const prev = doc.getKeywords() ?? ""; doc.setKeywords([...(prev ? prev.split(" ") : []), kw]); };

export async function stampSignature(pdf: Uint8Array, box: StampBox, sig: StampSig): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[Math.min(Math.max(box.page, 1), pages.length) - 1];
  // The signer tapped on the page AS DISPLAYED — pdfjs applies /Rotate, pdf-lib's coordinates do not
  // (Enki, wave 2). placeOnPage maps the displayed-fraction box back onto the media box first.
  const { rot } = placeOnPage(page, box);
  if (box.clear) clearBox(page, box, 3);
  // Two display-frame sub-boxes — the image above, the caption below — each mapped through the
  // page's rotation on its own, so both read upright however the page is turned.
  // On a fitted rule the whole box is the signature (it is already "no taller than the text above"); the digital
  // signature — name · time · #hash — sits UNDER the physical one (operator, 23:05): a 4.5-pt grey line just below
  // the document's own rule, starting where the ink starts, in the gap above the printed name.
  const onRule = box.fit === "underline" || box.fit === "holder";   // a placeholder sits on the other party's rule
  const imgBox = onRule ? { ...box } : { ...box, h: box.h * 0.7 };
  const capBox = onRule ? { ...box, y: box.y + box.h * 0.6, h: box.h * 0.4 } : { ...box, y: box.y + box.h * 0.72, h: box.h * 0.28 };
  const I = placeOnPage(page, imgBox, 24, 8), C = placeOnPage(page, capBox, 24, 4);
  const png = await doc.embedPng(dataUrlBytes(sig.pngDataUrl));
  const swap = rot === 90 || rot === 270;
  const dispW = swap ? I.bh : I.bw, dispH = swap ? I.bw : I.bh;           // the box as the signer saw it
  const scale = Math.min(dispW / png.width, dispH / png.height);
  const iw = png.width * scale, ih = png.height * scale;
  const key = PDFName.of(`SoISig${maxSignatureIndex(page.node.Resources()?.lookup(PDFName.of("XObject"))) + 1}`);
  page.node.setXObject(key, png.ref);
  if (rot === 0) page.drawImage(png, { x: onRule ? I.bx + 2 : I.bx + (I.bw - iw) / 2, y: I.by + (onRule ? 1 : (I.bh - ih) / 2), width: iw, height: ih });   // a signature starts where the line starts
  else { const o = oriented(rot, I.bx, I.by, I.bw, I.bh); page.drawImage(png, { ...o, width: iw, height: ih }); }
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const caption = pdfSafe(`${sig.name} · ${sig.isoDate} · #${sig.hash}`);
  const capDispW = swap ? C.bh : C.bw, capDispH = swap ? C.bw : C.bh;
  let capSize = onRule ? 4.5 : Math.max(4, Math.min(9, capDispH * 0.9));
  while (capSize > 3.5 && font.widthOfTextAtSize(caption, capSize) > capDispW) capSize -= 0.5;
  const co = oriented(rot, C.bx, C.by, C.bw, C.bh);
  if (onRule && rot === 0) page.drawText(caption, { x: I.bx + 2, y: I.by - 5.5, size: capSize, font, color: rgb(0.35, 0.35, 0.38) });   // under the rule, under the ink
  else page.drawText(caption, { x: co.x, y: co.y, size: capSize, font, color: rgb(0.1, 0.1, 0.1), rotate: co.rotate });
  if (!onRule) {                                                                    // the document's own rule is the line
    const lo = oriented(rot, C.bx, C.by, C.bw, C.bh);
    page.drawLine({ start: { x: lo.x, y: lo.y }, end: rot === 90 ? { x: lo.x, y: lo.y + C.bh } : rot === 270 ? { x: lo.x, y: lo.y - C.bh } : rot === 180 ? { x: lo.x - C.bw, y: lo.y } : { x: lo.x + C.bw, y: lo.y }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
  }
  // Record the placement as page-fraction metadata so `signatureBoxes()` can read it back (Asar, wave 1).
  addKeyword(doc, `SoISig:${box.page}:${box.x.toFixed(4)}:${box.y.toFixed(4)}:${box.w.toFixed(4)}:${box.h.toFixed(4)}:r${rot}`);
  if (sig.envelope) addKeyword(doc, `SoIEnv:${sig.envelope.token}:${sig.envelope.chain || "genesis"}`);
  return doc.save({ useObjectStreams: false });
}

/** A text mark — a date, a name, a note — fitted into its box on the page (operator, 2026-09-07). */
export interface TextMeta { signerIdx: number; isoDate: string; chain: string }
export async function stampText(pdf: Uint8Array, box: StampBox, text: string, meta?: TextMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[Math.min(Math.max(box.page, 1), pages.length) - 1];
  const { rot, bx, by, bw, bh } = placeOnPage(page, box, 12, 8);
  if (box.clear) clearBox(page, box);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const clean = pdfSafe(text.replace(/[\r\n]+/g, " ").slice(0, 200));
  const swap = rot === 90 || rot === 270;
  const dispW = swap ? bh : bw, dispH = swap ? bw : bh;
  let size = Math.max(6, Math.min(dispH * 0.72, 24));
  while (size > 6 && font.widthOfTextAtSize(clean, size) > dispW - 4) size -= 0.5;   // shrink to fit the box width
  const pad = (dispH - size) / 2 + size * 0.12;
  const o = oriented(rot, bx, by, bw, bh);
  const at = rot === 0 ? { x: bx + 2, y: by + pad } : rot === 90 ? { x: o.x - pad, y: o.y + 2 } : rot === 180 ? { x: o.x - 2, y: o.y - pad } : { x: o.x + pad, y: o.y - 2 };
  page.drawText(clean, { ...at, size, font, color: rgb(0.06, 0.06, 0.08), rotate: o.rotate });
  // bound to the signer's pass: index, time, chain-before (Odin, Thor) — a date can never pass as a later edit
  addKeyword(doc, `SoITxt:${box.page}:${box.x.toFixed(4)}:${box.y.toFixed(4)}:${box.w.toFixed(4)}:${box.h.toFixed(4)}:r${rot}` + (meta ? `:s${meta.signerIdx}:${meta.isoDate}:${meta.chain || "genesis"}` : ""));
  return doc.save({ useObjectStreams: false });
}

/** Text marks stamped into the file, from the keywords. */
export async function textBoxes(pdf: Uint8Array): Promise<StampBox[]> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  return (doc.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoITxt:")).map((k) => { const [, page, x, y, w, h] = k.split(":"); return { page: Number(page), x: Number(x), y: Number(y), w: Number(w), h: Number(h) }; });
}

function signatureNames(xobj: unknown): string[] {
  const dict = xobj as { keys?: () => PDFName[] } | undefined;
  if (!dict || typeof dict.keys !== "function") return [];
  return dict.keys().map((k) => k.toString()).filter((k) => k.startsWith("/SoISig"));
}
const countSignatureNames = (xobj: unknown): number => signatureNames(xobj).length;
/** Highest existing SoISig<n> on the page, so a gap never overwrites an earlier stamp (Enki, wave 2). */
const maxSignatureIndex = (xobj: unknown): number => signatureNames(xobj).reduce((m, k) => Math.max(m, Number(k.slice("/SoISig".length)) || 0), 0);

/** How many SoISig* image XObjects the file carries across all pages. */
export async function countSignatureImages(pdf: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  let n = 0;
  for (const p of doc.getPages()) n += countSignatureNames(p.node.Resources()?.lookup(PDFName.of("XObject")));
  return n;
}

export async function pageCount(pdf: Uint8Array): Promise<number> {
  return (await PDFDocument.load(pdf, { ignoreEncryption: true })).getPageCount();
}

/** Every stamp's page + rect (page fractions, top-left origin) as recorded at stamp time. */
export async function signatureBoxes(pdf: Uint8Array): Promise<StampBox[]> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  return (doc.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoISig:")).map((k) => {
    const [, page, x, y, w, h] = k.split(":");
    return { page: Number(page), x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
  });
}

/** The envelope a PDF was stamped in: token + chain before each pass (from the keywords). */
export async function envelopeMarks(pdf: Uint8Array): Promise<{ token: string; chain: string }[]> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  return (doc.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoIEnv:")).map((k) => { const [, token, chain] = k.split(":"); return { token, chain }; });
}

/* ── Per-page marks — initials bottom-right + the hidden Light Codex on the bottom edge of EVERY page ──
 * (operator 23:25: "on each signed page"; 00:45: "remove box… Light Codex at very bottom of PDF like the PNG")
 * One row per signer: NAME · "Digitally signed" · YYYY.MM.DD HH:MM:SS UTC · #hash. Each pass draws
 * its own row (rowIndex = signer index) and redraws the frame, so the block accumulates across the
 * envelope. The Light Codex strip (lib/light-codex, block size 2, double helix) is rendered in the
 * browser and handed in as a PNG; the same text it encodes is printed beside it (operator, 2026-09-07).
 */
import { embedCodexImage, type CodexImage } from "@/lib/codex-pdf";
export interface CodexRow { rowIndex: number; name: string; isoDate: string; hash: string; /** this signatory's Light Codex strip, raw pixels */ codex?: CodexImage }
/** Physical initials (operator 00:50): the signer's own drawn initials, one slot per signatory at the bottom-right of
 *  every page, in a spot the page's pixels showed to be clear of text; unfilled slots are dotted placeholders. */
export interface InitialsEntry { total: number; mine?: { idx: number; pngDataUrl: string }; /** page (1-based) → top of the slot row, as a page fraction, from the pixel scan; default: the bottom margin */ topByPage?: Record<number, number> }
export interface CodexEntry { rows: CodexRow[]; total: number; /** every signatory in one strip (operator 23:15) — drawn along the block's foot */ all?: CodexImage; initials?: InitialsEntry }
export const INIT_SLOT = { w: 36, h: 13, gap: 4, right: 18 } as const;
/** The slot rectangle (PDF points, bottom-left origin) of signer `idx` of `total`, on a page of `width` with the row's top at `topY` (points from the bottom). */
export const initialsSlot = (width: number, topY: number, idx: number, total: number) => ({ x: width - INIT_SLOT.right - (total - idx) * (INIT_SLOT.w + INIT_SLOT.gap) + INIT_SLOT.gap, y: topY - INIT_SLOT.h, w: INIT_SLOT.w, h: INIT_SLOT.h });

/** "Alex Seguin" → "AS": the first letter of each word, letters only, at most three (operator 2026-09-08: initials). */
const isLetter = (c: string): boolean => c.toLowerCase() !== c.toUpperCase() || /[\u0600-\u06FF\u0900-\u0DFF\u0E00-\u0E7F\u3040-\u9FFF\uAC00-\uD7AF]/.test(c);   // cased scripts, plus the uncased ones
export const initialsOf = (name: string): string => name.split(/\s+/).map((w) => Array.from(w).filter(isLetter).join("")).filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 3).join("");

export const cacStamp = (iso: string): string => {
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
};

/**
 * Every pass redraws the WHOLE block — the frame and every row signed so far, this pass's included —
 * because the frame is filled white to stay legible over page content, and a pass that drew only its
 * own row painted over the earlier signer's (caught rendering the proof PDF, 2026-09-07). The caller
 * reads the earlier rows back with `codexRows()` and supplies names from the roster.
 */
export async function stampCodexBlock(pdf: Uint8Array, e: CodexEntry): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const prev = (doc.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoICodex:"));
  const initPng = e.initials?.mine ? await doc.embedPng(dataUrlBytes(e.initials.mine.pngDataUrl)) : null;
  // the initials row of each page is decided ONCE (the first pass's pixel scan) and recorded — a later pass would
  // otherwise see the earlier initials as ink and move the row (caught in the render, wave 9)
  const rowKw = (doc.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoIInitRow:"));
  const rows: Record<number, number> = {}; for (const k of rowKw) { const m = /^SoIInitRow:(\d+):([\d.]+)$/.exec(k); if (m) rows[Number(m[1])] = Number(m[2]); }
  if (e.initials) { doc.getPages().forEach((_, i) => { const pg = i + 1; if (rows[pg] === undefined) { const t = e.initials!.topByPage?.[pg]; if (t !== undefined) { rows[pg] = t; addKeyword(doc, `SoIInitRow:${pg}:${t.toFixed(4)}`); } } }); e.initials = { ...e.initials, topByPage: { ...(e.initials.topByPage ?? {}), ...rows } }; }
  doc.getPages().forEach((page, i) => drawCodexBlock(doc, page, i + 1, e, font, bold, initPng));
  if (e.initials?.mine) { const kw = `SoIInit:${e.initials.mine.idx}`; if (!(doc.getKeywords() ?? "").split(/\s+/).includes(kw)) addKeyword(doc, kw); }
  for (const r of e.rows) { const base = `SoICodex:${r.rowIndex}:${r.isoDate}:${r.hash}`; if (!prev.some((k) => k.startsWith(base))) addKeyword(doc, `${base}:n${b64u(r.name)}`); }   // a redrawn earlier row is not a new record; the name rides along

  return doc.save({ useObjectStreams: false });
}
function drawCodexBlock(doc: PDFDocument, page: PDFPage, pageNo: number, e: CodexEntry, font: PDFFont, _bold: PDFFont, initPng: PDFImage | null): void {
  // No visible box (operator 2026-09-08 00:45: the digital line already sits under each physical signature).
  // What every page carries: the PHYSICAL initials of every signatory at the bottom-right — each in its own slot, in
  // signing order, in a spot the page's pixels showed clear of text (operator 00:50) — dotted placeholders for the
  // signatories still to come, and the Light Codex of ALL signatories HIDDEN on the very bottom edge (the Hidden
  // Helix, as a Light Codex PNG carries it). The rows themselves live in the keywords (codexRows).
  const { width, height } = page.getSize();
  // drawn 0.6 pt tall on the bottom edge — a hairline to the eye; the decoder reads the embedded pixels, not the drawing
  if (e.all) { const w = Math.max(width, e.all.width); embedCodexImage(doc, page, "SoICodexAll", e.all, width - w, 0, w, 0.6); }
  const ini = e.initials; if (!ini) return;
  const topFrac = ini.topByPage?.[pageNo];
  const topY = topFrac !== undefined ? height - topFrac * height : 3 + INIT_SLOT.h;   // default: the bottom margin (above the hidden line)
  const xo = page.node.Resources()?.lookup(PDFName.of("XObject"));
  const has = (idx: number) => { const d = xo as { has?: (n: PDFName) => boolean } | undefined; return !!d && typeof d.has === "function" && d.has(PDFName.of(`SoIInit${idx}`)); };
  for (let idx = 0; idx < ini.total; idx++) {
    const s = initialsSlot(width, topY, idx, ini.total);
    if (ini.mine && ini.mine.idx === idx && initPng) {
      // my slot: clear the placeholder, then my own drawn initials, kept to their aspect inside the slot
      page.drawRectangle({ x: s.x - 1.5, y: s.y - 1.5, width: s.w + 3, height: s.h + 3, color: rgb(1, 1, 1), opacity: 1 });
      const k = Math.min(s.w / initPng.width, s.h / initPng.height); const iw = initPng.width * k, ih = initPng.height * k;
      page.node.setXObject(PDFName.of(`SoIInit${idx}`), initPng.ref);
      page.drawImage(initPng, { x: s.x + (s.w - iw) / 2, y: s.y + (s.h - ih) / 2, width: iw, height: ih });
    } else if (!has(idx)) {
      // a signatory still to initial: a dotted slot with a 4.5-pt "Initial" label — cleared when they do
      page.drawRectangle({ x: s.x, y: s.y, width: s.w, height: s.h, borderColor: rgb(0.35, 0.45, 0.6), borderWidth: 0.5, borderDashArray: [1.5, 1.5], color: rgb(1, 1, 1), opacity: 1 });
      page.drawText("Initial", { x: s.x + 2, y: s.y + 4, size: 4.5, font, color: rgb(0.45, 0.5, 0.6) });
    }
  }
}

/** Which signatories (row indices) have initialled the file — from the SoIInit keywords. */
export async function initialledBy(pdf: Uint8Array): Promise<number[]> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  return (doc.getKeywords() ?? "").split(/\s+/).filter((k) => /^SoIInit:\d+$/.test(k)).map((k) => Number(k.slice(8)));
}

/* ── Placeholders for the signatories still to come (operator 00:50: "3 placeholders so Danny can sign after me") ──
 * A dotted box with a tiny label where the next signer's signature and date go — the other party's line on the same
 * row (lib/sign-layout partnerRule) and its Date line — recorded as SoIHold keywords so the next signer's page
 * opens with the marks already placed; the real mark clears the box when it lands (StampBox.clear). */
export interface Holder { idx: number; name: string; kind: "sig" | "date"; page: number; x: number; y: number; w: number; h: number }
export async function stampHolders(pdf: Uint8Array, holders: Holder[]): Promise<Uint8Array> {
  if (!holders.length) return pdf;
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  for (const h of holders) {
    const page = pages[Math.min(Math.max(h.page, 1), pages.length) - 1];
    const { bx, by, bw, bh } = placeOnPage(page, h, 12, 8);
    page.drawRectangle({ x: bx, y: by, width: bw, height: bh, borderColor: rgb(0.35, 0.45, 0.6), borderWidth: 0.6, borderDashArray: [2, 2] });
    const label = pdfSafe(h.kind === "sig" ? `Sign here · ${h.name}` : "Date"); let size = Math.min(6, bh * 0.5);
    while (size > 3.5 && font.widthOfTextAtSize(label, size) > bw - 4) size -= 0.5;
    page.drawText(label, { x: bx + 2, y: by + 2, size, font, color: rgb(0.45, 0.5, 0.6) });
    addKeyword(doc, `SoIHold:${h.idx}:${h.kind}:${h.page}:${h.x.toFixed(4)}:${h.y.toFixed(4)}:${h.w.toFixed(4)}:${h.h.toFixed(4)}:n${b64u(h.name)}`);
  }
  return doc.save({ useObjectStreams: false });
}
/** The placeholders recorded in the file. */
export async function holders(pdf: Uint8Array): Promise<Holder[]> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  return (doc.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoIHold:")).map((k) => {
    const m = /^SoIHold:(\d+):(sig|date):(\d+):([\d.]+):([\d.]+):([\d.]+):([\d.]+):n([A-Za-z0-9_-]*)$/.exec(k);
    return m ? { idx: Number(m[1]), kind: m[2] as "sig" | "date", page: Number(m[3]), x: Number(m[4]), y: Number(m[5]), w: Number(m[6]), h: Number(m[7]), name: b64uDecode(m[8]) } : null;
  }).filter((h): h is Holder => !!h);
}

/** The signatory rows recorded in the file, from the keywords (name when the file carries it — since 2026-09-08). */
export async function codexRows(pdf: Uint8Array): Promise<{ rowIndex: number; isoDate: string; hash: string; name?: string }[]> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  return (doc.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoICodex:")).map((k) => {
    const m = /^SoICodex:(\d+):(.+?):([0-9a-f]+)(?::n([A-Za-z0-9_-]*))?$/.exec(k);   // the ISO time itself holds colons
    return m ? { rowIndex: Number(m[1]), isoDate: m[2], hash: m[3], ...(m[4] !== undefined ? { name: b64uDecode(m[4]) } : {}) } : { rowIndex: -1, isoDate: "", hash: "" };
  });
}
const b64u = (s: string): string => (typeof btoa === "function" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uDecode = (s: string): string => { try { const b = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4); return typeof atob === "function" ? decodeURIComponent(escape(atob(b))) : Buffer.from(b, "base64").toString("utf8"); } catch { return ""; } };
