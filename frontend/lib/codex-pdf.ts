/**
 * Light Codex ⇄ PDF (operator, 2026-09-07 23:15): the signatory block's strips are embedded as RAW RGB image
 * XObjects named SoICodexRow<n> / SoICodexAll, pixel for pixel — so the Light Codex decoder can read them
 * back from the PDF itself ("PDF uploads in addition to PNG"), and the ALL strip carries every signatory
 * ("NAME YYYY.MM.DD_HH.MMZZZ • NAME …"). No canvas, no PNG round-trip: works in the browser and in node alike.
 */
import { PDFDocument, PDFName, PDFNumber, PDFDict, PDFRawStream, PDFRef, pushGraphicsState, popGraphicsState, concatTransformationMatrix, drawObject, type PDFPage } from "pdf-lib";
import { placeSignature, decodeImage, unsupportedChars, type DecodeResult } from "@/lib/light-codex";

export interface CodexImage { width: number; height: number; data: Uint8ClampedArray }

// placeSignature builds an ImageData; node has none — a minimal stand-in with the same three fields
if (typeof (globalThis as { ImageData?: unknown }).ImageData === "undefined") {
  (globalThis as { ImageData?: unknown }).ImageData = class { data: Uint8ClampedArray; width: number; height: number; constructor(data: Uint8ClampedArray, width: number, height?: number) { this.data = data; this.width = width; this.height = height ?? data.length / 4 / width; } };
}

/* ── Printable names (shared by the caption in lib/pdf-stamp and the hidden line below; lives here so both can reach it
 *    without a circular import — pdf-stamp imports codex-pdf, never the reverse) ── */
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
    if (ch === "€") { out.push("€"); continue; }
    const base = Array.from(ch.normalize("NFKD")).filter((c) => { const k = c.codePointAt(0) ?? 0; return latin1(k) && !(k >= 0x0300 && k <= 0x036f); }).join("");   // ắ → a
    out.push(base || "·");
  }
  return out.join("").replace(/·{3,}/g, "··");
};
const hasLatin = (s: string): boolean => /[A-Za-z0-9À-ÖØ-öø-ÿ]/.test(s);
/** The name as the standard font can print it. A name pdfSafe reduces to dots ('علي حسن' → '·· ··') names nobody, so the
 *  caption falls back to the contact when the entry carries one, else to "Signer N" (N 1-based) — the Unicode name still
 *  rides in the keywords and the Light Codex line (reviewer 2026-09-08). Exported so a component can print the same caption. */
export const captionName = (name: string, contact?: string, idx?: number): string => {
  const n = pdfSafe(name); if (hasLatin(n)) return n;
  const c = contact ? pdfSafe(contact) : ""; if (hasLatin(c)) return c;
  return `Signer ${(idx ?? 0) + 1}`;
};

/** The codex line is at most this many characters (a Letter page's bottom edge at 1 px = 1 pt holds it twice over). */
export const CODEX_LINE_MAX = 44;
const codexClean = (s: string): string => { const bad = new Set(unsupportedChars(s)); return Array.from(s).filter((c) => !bad.has(c)).join(""); };
/** "NAME 2026.09.08_08.11CDT" for one signatory (operator 2026-09-08 01:50: "2026.09.08_08:11CST"): the codex alphabet has
 *  letters, digits, space, the full stop and — since 2026-09-08 — "-", "_" and "•", so the underscore is written as the
 *  operator wrote it and the alphabet carries "_" and ":" since 2026-09-08 (VRVR, VBVB), so the line is exactly `2026.09.08_08:11CST`
 *  with its zone name (CST in winter, CDT in summer for Chicago). Characters outside the alphabet are dropped. The NAME is
 *  what the caption prints (captionName: the contact, else "Signer N", when the name has no Latin letter), so the hidden
 *  line agrees with the visible one; when the line would exceed 44 characters the NAME is trimmed — the timestamp is never
 *  cut (reviewer 2026-09-08). `timeZone` is for tests; the page uses the device's. */
export function codexText(name: string, isoDate: string, timeZone?: string, fallback?: { contact?: string; idx?: number }): string {
  const d = new Date(isoDate);
  let stamp: string;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" }).formatToParts(d);
    const g = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
    const hour = g("hour") === "24" ? "00" : g("hour");
    stamp = `${g("year")}.${g("month")}.${g("day")}_${hour}:${g("minute")}${g("timeZoneName").replace(/[^A-Z]/g, "")}`;
  } catch { const p = (n: number) => String(n).padStart(2, "0"); stamp = `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())}_${p(d.getUTCHours())}:${p(d.getUTCMinutes())}UTC`; }
  stamp = codexClean(stamp);
  const nm = codexClean(captionName(name, fallback?.contact, fallback?.idx).toUpperCase()).slice(0, Math.max(0, CODEX_LINE_MAX - stamp.length - 1)).trimEnd();
  return [nm, stamp].filter(Boolean).join(" ");
}
/** Every signatory in one strip — " • " separates them (the bullet joined the codex alphabet 2026-09-08). A row's `contact`
 *  and `rowIndex` feed the same fallback the caption uses for a name the font cannot print (default idx: the row's position). */
export const codexAllText = (rows: { name: string; isoDate: string; contact?: string; rowIndex?: number }[], timeZone?: string): string =>
  rows.map((r, i) => codexText(r.name, r.isoDate, timeZone, { contact: r.contact, idx: r.rowIndex ?? i })).join(" • ");

/** The Hidden Helix (style "3", 1 px, no frame) as a Light Codex PNG carries it (operator 00:45): a 1-px forward line
 *  on the top row and a 1-px reversed line on the bottom row, right-aligned — 2 px tall, at least a Letter page wide so
 *  1 px = 1 pt when drawn across the bottom edge. Raw RGBA pixels on white; invisible on the page, exact in the bytes. */
export const CODEX_BLOCK = 1 as const;
export function codexImage(text: string, minWidth = 612): CodexImage {
  const w = Math.max(minWidth, text.length * 4 + 8), h = 2;
  const data = new Uint8ClampedArray(w * h * 4).fill(255);
  const out = placeSignature(new ImageData(data, w, h), text, CODEX_BLOCK, "3");
  return { width: out.width, height: out.height, data: out.data };
}

/** Embed `img` as a raw DeviceRGB Flate stream under `name` and draw it at (x, y, w, h) — pixel-exact. */
export function embedCodexImage(doc: PDFDocument, page: PDFPage, name: string, img: CodexImage, x: number, y: number, w: number, h: number): void {
  const rgb = new Uint8Array(img.width * img.height * 3);
  for (let i = 0, j = 0; i < img.data.length; i += 4, j += 3) { rgb[j] = img.data[i]; rgb[j + 1] = img.data[i + 1]; rgb[j + 2] = img.data[i + 2]; }
  const stream = doc.context.flateStream(rgb, { Type: "XObject", Subtype: "Image", Width: img.width, Height: img.height, ColorSpace: "DeviceRGB", BitsPerComponent: 8 });
  page.node.setXObject(PDFName.of(name), doc.context.register(stream));
  page.pushOperators(pushGraphicsState(), concatTransformationMatrix(w, 0, 0, h, x, y), drawObject(name), popGraphicsState());
}

export type Inflate = (b: Uint8Array) => Promise<Uint8Array> | Uint8Array;
/** The browser's own zlib. Node tests pass `zlib.inflateSync`. */
export const browserInflate: Inflate = async (b) => new Uint8Array(await new Response(new Blob([b as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"))).arrayBuffer());

export interface CodexStrip { name: string; page: number; image: CodexImage }
/** Every SoICodex* image in the file, as raw pixels — read from the PDF, never from a render. */
export async function extractCodexStrips(pdf: Uint8Array, inflate: Inflate): Promise<CodexStrip[]> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const out: CodexStrip[] = [];
  doc.getPages().forEach((page, pi) => {
    const xo = page.node.Resources()?.lookup(PDFName.of("XObject"));
    if (!(xo instanceof PDFDict)) return;
    for (const [key, val] of xo.entries()) {
      const name = key.toString().slice(1);
      if (!name.startsWith("SoICodex")) continue;
      const obj = val instanceof PDFRef ? doc.context.lookup(val) : val;
      if (!(obj instanceof PDFRawStream)) continue;
      const num = (k: string) => { const v = obj.dict.get(PDFName.of(k)); return v instanceof PDFNumber ? v.asNumber() : 0; };
      const width = num("Width"), height = num("Height"); if (!width || !height) continue;
      const filter = obj.dict.get(PDFName.of("Filter"));
      const rgbP = filter && filter.toString() === "/FlateDecode" ? inflate(obj.contents) : obj.contents;
      out.push({ name, page: pi + 1, image: { width, height, data: new Uint8ClampedArray(0) } });
      const idx = out.length - 1;
      const rgb = rgbP instanceof Promise ? null : rgbP;
      if (rgb) out[idx].image.data = rgbToRgba(rgb, width, height); else (out[idx] as CodexStrip & { pending?: Promise<Uint8Array> }).pending = rgbP as Promise<Uint8Array>;
    }
  });
  for (const s of out as (CodexStrip & { pending?: Promise<Uint8Array> })[]) { if (s.pending) { s.image.data = rgbToRgba(await s.pending, s.image.width, s.image.height); delete s.pending; } }
  return out;
}
const rgbToRgba = (rgb: Uint8Array, w: number, h: number): Uint8ClampedArray => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0, j = 0; j < d.length && i + 2 < rgb.length; i += 3, j += 4) { d[j] = rgb[i]; d[j + 1] = rgb[i + 1]; d[j + 2] = rgb[i + 2]; d[j + 3] = 255; }
  return d;
};

export interface CodexPdfResult { name: string; page: number; result: DecodeResult | null }
/** Decode every strip the PDF carries — the per-signatory rows and the ALL strip. */
export async function decodeCodexPdf(pdf: Uint8Array, inflate: Inflate): Promise<CodexPdfResult[]> {
  const strips = await extractCodexStrips(pdf, inflate);
  return strips.map((s) => ({ name: s.name, page: s.page, result: decodeImage(s.image as unknown as ImageData) }));
}
