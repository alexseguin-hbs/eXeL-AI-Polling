/**
 * PDF page rendering for the Sign Doc flow — pdfjs loaded ONLY on demand, in the browser.
 * "use client" pages are still prerendered in Node at `next build`, where pdfjs touches DOM
 * globals, so nothing here imports pdfjs at module top level. The worker is served from
 * public/pdf.worker.min.mjs (scripts/copy-pdf-worker.mjs, predev + prebuild — Enlil, round 1).
 */

export interface RenderedPage { canvas: HTMLCanvasElement; widthPt: number; heightPt: number; }

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

export function loadPdfjs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((m) => {
      m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return m;
    });
  }
  return pdfjsPromise;
}

export async function openPdf(bytes: Uint8Array) {
  const pdfjs = await loadPdfjs();
  // pdfjs transfers the buffer to the worker; hand it a copy so the caller's bytes survive.
  return pdfjs.getDocument({ data: bytes.slice() }).promise;
}

/** Render page `n` (1-based) to a canvas that is `cssWidth` CSS px wide, sharp on any DPR. */
export async function renderPage(doc: Awaited<ReturnType<typeof openPdf>>, n: number, cssWidth: number): Promise<RenderedPage> {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const scale = cssWidth / base.width;
  // at least 2× so a 0.7-pt rule survives as ink the tap can fit to (lib/sign-fit) on a 1× screen; at most 3×
  const dpr = typeof window !== "undefined" ? Math.min(Math.max(window.devicePixelRatio || 1, 2), 3) : 1;
  const viewport = page.getViewport({ scale: scale * dpr });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${Math.round(viewport.height / dpr)}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas, widthPt: base.width, heightPt: base.height };
}

export const bytesToBase64 = (b: Uint8Array): string => {
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + 0x8000)));
  return btoa(s);
};
export const base64ToBytes = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
