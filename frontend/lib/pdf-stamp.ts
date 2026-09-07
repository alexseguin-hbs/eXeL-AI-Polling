/**
 * Stamp a signature into a PDF (pdf-lib, pure JS — runs in the browser and in node tests).
 * The box is given as FRACTIONS of the page (x, y from the top-left; w, h), so the same box the
 * signer tapped on a 343-px-wide phone canvas lands on the real page at any size. Each stamp is an
 * image XObject registered under a name starting with "SoISig", which is how
 * `countSignatureImages` proves how many signatures a file carries (Asar's headless gate).
 */
import { PDFDocument, PDFName, StandardFonts, rgb } from "pdf-lib";

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

const addKeyword = (doc: PDFDocument, kw: string) => { const prev = doc.getKeywords() ?? ""; doc.setKeywords([...(prev ? prev.split(" ") : []), kw]); };

export async function stampSignature(pdf: Uint8Array, box: StampBox, sig: StampSig): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[Math.min(Math.max(box.page, 1), pages.length) - 1];
  // The signer tapped on the page AS DISPLAYED — pdfjs applies /Rotate, pdf-lib's coordinates do not
  // (Enki, wave 2). placeOnPage maps the displayed-fraction box back onto the media box first.
  const { rot, bx, by, bw, bh } = placeOnPage(page, box);
  const png = await doc.embedPng(dataUrlBytes(sig.pngDataUrl));
  // Keep the image's aspect inside the box; caption below it.
  const capH = Math.min(9, bh * 0.28);
  const imgH = bh - capH - 2;
  const scale = Math.min(bw / png.width, imgH / png.height);
  const iw = png.width * scale, ih = png.height * scale;
  const key = PDFName.of(`SoISig${maxSignatureIndex(page.node.Resources()?.lookup(PDFName.of("XObject"))) + 1}`);
  page.node.setXObject(key, png.ref);
  page.drawImage(png, { x: bx + (bw - iw) / 2, y: by + capH + 2, width: iw, height: ih });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const caption = `${sig.name} · ${sig.isoDate} · #${sig.hash}`;
  page.drawText(caption, { x: bx, y: by, size: capH * 0.9, font, color: rgb(0.1, 0.1, 0.1), maxWidth: bw });
  page.drawLine({ start: { x: bx, y: by + capH + 1 }, end: { x: bx + bw, y: by + capH + 1 }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
  // Record the placement as page-fraction metadata so `signatureBoxes()` can read it back (Asar, wave 1).
  addKeyword(doc, `SoISig:${box.page}:${box.x.toFixed(4)}:${box.y.toFixed(4)}:${box.w.toFixed(4)}:${box.h.toFixed(4)}:r${rot}`);
  if (sig.envelope) addKeyword(doc, `SoIEnv:${sig.envelope.token}:${sig.envelope.chain || "genesis"}`);
  return doc.save({ useObjectStreams: false });
}

/** A text mark — a date, a name, a note — fitted into its box on the page (operator, 2026-09-07). */
export async function stampText(pdf: Uint8Array, box: StampBox, text: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[Math.min(Math.max(box.page, 1), pages.length) - 1];
  const { bx, by, bw, bh } = placeOnPage(page, box, 12, 8);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const clean = text.replace(/[\r\n]+/g, " ").slice(0, 200);
  let size = Math.max(6, Math.min(bh * 0.72, 24));
  while (size > 6 && font.widthOfTextAtSize(clean, size) > bw - 4) size -= 0.5;   // shrink to fit the box width
  page.drawText(clean, { x: bx + 2, y: by + (bh - size) / 2 + size * 0.12, size, font, color: rgb(0.06, 0.06, 0.08) });
  addKeyword(doc, `SoITxt:${box.page}:${box.x.toFixed(4)}:${box.y.toFixed(4)}:${box.w.toFixed(4)}:${box.h.toFixed(4)}`);
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
