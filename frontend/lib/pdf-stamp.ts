/**
 * Stamp a signature into a PDF (pdf-lib, pure JS — runs in the browser and in node tests).
 * The box is given as FRACTIONS of the page (x, y from the top-left; w, h), so the same box the
 * signer tapped on a 343-px-wide phone canvas lands on the real page at any size. Each stamp is an
 * image XObject registered under a name starting with "SoISig", which is how
 * `countSignatureImages` proves how many signatures a file carries (Asar's headless gate).
 */
import { PDFDocument, PDFName, StandardFonts, degrees, rgb } from "pdf-lib";

export interface StampBox { page: number; x: number; y: number; w: number; h: number }   // page 1-based; fractions 0..1
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

const addKeyword = (doc: PDFDocument, kw: string) => { const prev = doc.getKeywords() ?? ""; doc.setKeywords([...(prev ? prev.split(" ") : []), kw]); };

export async function stampSignature(pdf: Uint8Array, box: StampBox, sig: StampSig): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[Math.min(Math.max(box.page, 1), pages.length) - 1];
  // The signer tapped on the page AS DISPLAYED — pdfjs applies /Rotate, pdf-lib's coordinates do not
  // (Enki, wave 2). placeOnPage maps the displayed-fraction box back onto the media box first.
  const { rot } = placeOnPage(page, box);
  // Two display-frame sub-boxes — the image above, the caption below — each mapped through the
  // page's rotation on its own, so both read upright however the page is turned.
  const imgBox = { ...box, h: box.h * 0.7 };
  const capBox = { ...box, y: box.y + box.h * 0.72, h: box.h * 0.28 };
  const I = placeOnPage(page, imgBox, 24, 8), C = placeOnPage(page, capBox, 24, 4);
  const png = await doc.embedPng(dataUrlBytes(sig.pngDataUrl));
  const swap = rot === 90 || rot === 270;
  const dispW = swap ? I.bh : I.bw, dispH = swap ? I.bw : I.bh;           // the box as the signer saw it
  const scale = Math.min(dispW / png.width, dispH / png.height);
  const iw = png.width * scale, ih = png.height * scale;
  const key = PDFName.of(`SoISig${maxSignatureIndex(page.node.Resources()?.lookup(PDFName.of("XObject"))) + 1}`);
  page.node.setXObject(key, png.ref);
  if (rot === 0) page.drawImage(png, { x: I.bx + (I.bw - iw) / 2, y: I.by + (I.bh - ih) / 2, width: iw, height: ih });
  else { const o = oriented(rot, I.bx, I.by, I.bw, I.bh); page.drawImage(png, { ...o, width: iw, height: ih }); }
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const caption = `${sig.name} · ${sig.isoDate} · #${sig.hash}`;
  const capDispW = swap ? C.bh : C.bw, capDispH = swap ? C.bw : C.bh;
  let capSize = Math.max(4, Math.min(9, capDispH * 0.9));
  while (capSize > 4 && font.widthOfTextAtSize(caption, capSize) > capDispW) capSize -= 0.5;
  const co = oriented(rot, C.bx, C.by, C.bw, C.bh);
  page.drawText(caption, { x: co.x, y: co.y, size: capSize, font, color: rgb(0.1, 0.1, 0.1), rotate: co.rotate });
  const lo = oriented(rot, C.bx, C.by, C.bw, C.bh);
  page.drawLine({ start: { x: lo.x, y: lo.y }, end: rot === 90 ? { x: lo.x, y: lo.y + C.bh } : rot === 270 ? { x: lo.x, y: lo.y - C.bh } : rot === 180 ? { x: lo.x - C.bw, y: lo.y } : { x: lo.x + C.bw, y: lo.y }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
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
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const clean = text.replace(/[\r\n]+/g, " ").slice(0, 200);
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

/* ── Signatory block — CAC-style digital timestamp + Light Codex 2×2 strip, bottom-right of the last page ──
 * One row per signer: NAME · "Digitally signed" · YYYY.MM.DD HH:MM:SS UTC · #hash. Each pass draws
 * its own row (rowIndex = signer index) and redraws the frame, so the block accumulates across the
 * envelope. The Light Codex strip (lib/light-codex, block size 2, double helix) is rendered in the
 * browser and handed in as a PNG; the same text it encodes is printed beside it (operator, 2026-09-07).
 */
export interface CodexRow { rowIndex: number; name: string; isoDate: string; hash: string; codexPngDataUrl?: string }
export interface CodexEntry { rows: CodexRow[]; total: number }

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
  const pages = doc.getPages(); const page = pages[pages.length - 1];
  const { width } = page.getSize();
  const rows = Math.max(2, e.total, ...e.rows.map((r) => r.rowIndex + 1));   // "2×2": two rows minimum, name | timestamp
  const rowH = 14, pad = 6, blockW = Math.min(300, width * 0.48), blockH = rows * rowH + 22;
  const bx = width - blockW - 18, by = 18;                 // bottom-right, inside a half-inch margin
  const font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({ x: bx, y: by, width: blockW, height: blockH, borderColor: rgb(0.1, 0.25, 0.45), borderWidth: 0.8, color: rgb(1, 1, 1), opacity: 1 });
  page.drawText("Signatories — digital timestamps", { x: bx + pad, y: by + blockH - 12, size: 7.5, font: bold, color: rgb(0.1, 0.25, 0.45) });
  page.drawLine({ start: { x: bx + blockW * 0.42, y: by + 2 }, end: { x: bx + blockW * 0.42, y: by + blockH - 16 }, thickness: 0.4, color: rgb(0.7, 0.75, 0.8) });
  const nameW = blockW * 0.42 - pad * 2;
  const prev = (doc.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoICodex:"));
  for (const r of e.rows) {
    const y = by + blockH - 16 - rowH * (r.rowIndex + 1) + 4;
    let ns = 8; while (ns > 5 && bold.widthOfTextAtSize(r.name, ns) > nameW) ns -= 0.5;
    page.drawText(r.name, { x: bx + pad, y, size: ns, font: bold, color: rgb(0.06, 0.06, 0.08) });
    const stamp = `Digitally signed · ${cacStamp(r.isoDate)} · #${r.hash}`;
    const stampW = blockW * 0.58 - pad * 2 - (r.codexPngDataUrl ? 34 : 0);
    let ss = 6.5; while (ss > 4.5 && font.widthOfTextAtSize(stamp, ss) > stampW) ss -= 0.25;
    page.drawText(stamp, { x: bx + blockW * 0.42 + pad, y, size: ss, font, color: rgb(0.1, 0.1, 0.12) });
    if (r.codexPngDataUrl) {
      try { const png = await doc.embedPng(dataUrlBytes(r.codexPngDataUrl)); page.drawImage(png, { x: bx + blockW - pad - 30, y: y - 2, width: 30, height: 10 }); } catch { /* strip optional */ }
    }
    const kw = `SoICodex:${r.rowIndex}:${r.isoDate}:${r.hash}`;
    if (!prev.includes(kw)) addKeyword(doc, kw);        // a redrawn earlier row is not a new record
  }
  return doc.save({ useObjectStreams: false });
}

/** The signatory rows recorded in the file, from the keywords. */
export async function codexRows(pdf: Uint8Array): Promise<{ rowIndex: number; isoDate: string; hash: string }[]> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  return (doc.getKeywords() ?? "").split(/\s+/).filter((k) => k.startsWith("SoICodex:")).map((k) => {
    const m = /^SoICodex:(\d+):(.+):([0-9a-f]+)$/.exec(k);
    return m ? { rowIndex: Number(m[1]), isoDate: m[2], hash: m[3] } : { rowIndex: -1, isoDate: "", hash: "" };
  });
}
