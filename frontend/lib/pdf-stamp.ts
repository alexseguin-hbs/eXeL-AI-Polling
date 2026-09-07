/**
 * Stamp a signature into a PDF (pdf-lib, pure JS — runs in the browser and in node tests).
 * The box is given as FRACTIONS of the page (x, y from the top-left; w, h), so the same box the
 * signer tapped on a 343-px-wide phone canvas lands on the real page at any size. Each stamp is an
 * image XObject registered under a name starting with "SoISig", which is how
 * `countSignatureImages` proves how many signatures a file carries (Asar's headless gate).
 */
import { PDFDocument, PDFName, StandardFonts, rgb } from "pdf-lib";

export interface StampBox { page: number; x: number; y: number; w: number; h: number }   // page 1-based; fractions 0..1
export interface StampSig { pngDataUrl: string; name: string; isoDate: string; hash: string }

const dataUrlBytes = (dataUrl: string): Uint8Array => {
  const b64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
  const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export async function stampSignature(pdf: Uint8Array, box: StampBox, sig: StampSig): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[Math.min(Math.max(box.page, 1), pages.length) - 1];
  const { width, height } = page.getSize();
  const png = await doc.embedPng(dataUrlBytes(sig.pngDataUrl));
  // Record the placement as page-fraction metadata so `signatureBoxes()` can read it back (Asar, wave 1).
  const bw = Math.min(Math.max(24, box.w * width), width), bh = Math.min(Math.max(12, box.h * height), height);
  // Clamp to the page (Athena, wave 1): a box tapped at the edge stays on the page, never off it.
  const bx = Math.min(Math.max(box.x * width, 0), width - bw);
  const by = Math.min(Math.max(height - box.y * height - bh, 0), height - bh);   // PDF origin is bottom-left
  // Keep the image's aspect inside the box; caption below it.
  const capH = Math.min(9, bh * 0.28);
  const imgH = bh - capH - 2;
  const scale = Math.min(bw / png.width, imgH / png.height);
  const iw = png.width * scale, ih = png.height * scale;
  const existing = countSignatureNames(page.node.Resources()?.lookup(PDFName.of("XObject")));
  const key = PDFName.of(`SoISig${existing + 1}`);
  page.node.setXObject(key, png.ref);
  page.drawImage(png, { x: bx + (bw - iw) / 2, y: by + capH + 2, width: iw, height: ih });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const caption = `${sig.name} · ${sig.isoDate} · #${sig.hash}`;
  page.drawText(caption, { x: bx, y: by, size: capH * 0.9, font, color: rgb(0.1, 0.1, 0.1), maxWidth: bw });
  page.drawLine({ start: { x: bx, y: by + capH + 1 }, end: { x: bx + bw, y: by + capH + 1 }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
  const prev = doc.getKeywords() ?? "";
  doc.setKeywords([...(prev ? prev.split(" ") : []), `SoISig:${box.page}:${(bx / width).toFixed(4)}:${(1 - (by + bh) / height).toFixed(4)}:${(bw / width).toFixed(4)}:${(bh / height).toFixed(4)}`]);
  return doc.save({ useObjectStreams: false });
}

/** Every stamp's page + rect (page fractions, top-left origin) as recorded at stamp time. */
export async function signatureBoxes(pdf: Uint8Array): Promise<StampBox[]> {
  const doc = await PDFDocument.load(pdf, { ignoreEncryption: true });
  const kw = doc.getKeywords() ?? "";
  return kw.split(/\s+/).filter((k) => k.startsWith("SoISig:")).map((k) => {
    const [, page, x, y, w, h] = k.split(":");
    return { page: Number(page), x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
  });
}

function countSignatureNames(xobj: unknown): number {
  const dict = xobj as { keys?: () => PDFName[] } | undefined;
  if (!dict || typeof dict.keys !== "function") return 0;
  return dict.keys().filter((k) => k.toString().startsWith("/SoISig")).length;
}

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
