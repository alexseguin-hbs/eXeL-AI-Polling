/**
 * Shared image library (SoI-2525) — a small, cross-project pool of uploaded images so the CONOPS visual (and
 * other attach fields) can PICK / SAVE / DELETE a previously-uploaded image instead of re-uploading. Each entry is
 * stamped with provenance — Project · Date · Time · Name (uploader). Populated from the CONOPS uploader and the
 * Light-Codex tool. localStorage-backed (per browser, shared across projects) + best-effort cloud mirror.
 *
 * CONOPS upload transparently runs the image through the Light-Codex double-helix signer (1×1 block) with a hidden
 * provenance message "Project · Date · Time · Name" — the user never has to know Light Codex is involved. Signing
 * is best-effort: if it can't sign, the plain image is used.
 */
import { saveState } from "./innovation-store";
import { placeSignature } from "./light-codex";

export interface LibImageMeta { project?: string; date?: string; time?: string; who?: string }
export interface LibImage extends LibImageMeta { name: string; src: string } // src = data: URI or http(s) URL
const KEY = "soi-image-library";
const MAX = 24; // keep the pool (and the persisted blob) bounded

/** Stable content id for dedupe (FNV-1a over the src). */
const idOf = (src: string): string => { let h = 2166136261; for (let i = 0; i < src.length; i++) h = Math.imul(h ^ src.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };

export function loadImageLibrary(): LibImage[] {
  try { const s = localStorage.getItem(KEY); const a = s ? JSON.parse(s) : []; return Array.isArray(a) ? a : []; } catch { return []; }
}
function persist(next: LibImage[]) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota — keep in-memory only */ }
  void saveState("image-library", next as unknown as Record<string, string>); // best-effort cloud mirror
}
/** Add an image (deduped by content) with provenance; newest first, capped at MAX. Returns the updated library. */
export function addToImageLibrary(name: string, src: string, meta: LibImageMeta = {}): LibImage[] {
  if (!src) return loadImageLibrary();
  const lib = loadImageLibrary();
  const key = idOf(src);
  if (lib.some((i) => idOf(i.src) === key)) return lib; // already present
  const next = [{ name: name || "image", src, ...meta }, ...lib].slice(0, MAX);
  persist(next);
  return next;
}
/** Remove by content src. Returns the updated library. */
export function removeFromImageLibrary(src: string): LibImage[] {
  const key = idOf(src);
  const next = loadImageLibrary().filter((i) => idOf(i.src) !== key);
  persist(next);
  return next;
}

// ── Transparent Light-Codex signing (default 1×1 double-helix) ──────────────────────────────────────────────
function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d", { willReadFrequently: true })!; ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, c.width, c.height));
      } catch (e) { reject(e); } finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("read")); };
    img.src = url;
  });
}
const readDataURL = (file: File): Promise<string> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("read")); r.readAsDataURL(file); });
/** Keep only characters the Light-Codex codec can carry; collapse the rest to spaces. */
const safeMsg = (s: string) => s.replace(/[^A-Za-z0-9 _.:|/-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
/**
 * Read a file and return a PNG data URL with a hidden 1×1 double-helix provenance signature embedded. Falls back
 * to the plain image on any failure (non-PNG, canvas blocked, unsupported chars). Never throws.
 */
export async function signedDataURL(file: File, message: string): Promise<string> {
  try {
    const data = await fileToImageData(file);
    const signed = placeSignature(data, safeMsg(message), 1, "2"); // 1×1 block · double helix
    const c = document.createElement("canvas"); c.width = signed.width; c.height = signed.height;
    c.getContext("2d")!.putImageData(signed, 0, 0);
    return c.toDataURL("image/png");
  } catch {
    try { return await readDataURL(file); } catch { return ""; }
  }
}
